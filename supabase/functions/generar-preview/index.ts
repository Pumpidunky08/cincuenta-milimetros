// Edge Function: webhook-pago (ePayco)
// Deploy: supabase functions deploy webhook-pago --no-verify-jwt
//
// IMPORTANTE — modelo multi-tenant:
// Cada evento tiene su PROPIA cuenta de ePayco (de su organizador real).
// El dinero llega directo a esa cuenta, nunca pasa por una cuenta central.
// Por eso este webhook, antes de verificar la firma, primero identifica
// a qué evento pertenece la transacción (vía la orden), y usa LAS
// CREDENCIALES DE ESE EVENTO para verificar la firma — no un secreto global.
//
// ePayco envía la confirmación como POST con datos application/x-www-form-urlencoded
// (no JSON como otras pasarelas). Ver: https://docs.epayco.com/docs/url-de-confirmacion
//
// Al crear la transacción/checkout en el frontend, es OBLIGATORIO enviar
// nuestra referencia interna (el id de la orden) en el campo x_extra1,
// para poder identificar la orden aquí.
//
// Variables de entorno necesarias:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   RESEND_API_KEY
//   BUCKET_PRIVADO   (default: "fotos-originales")

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
const bucketPrivado = Deno.env.get("BUCKET_PRIVADO") ?? "fotos-originales";

const supabase = createClient(supabaseUrl, serviceRoleKey);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // ePayco envía form-urlencoded, no JSON
    const rawBody = await req.text();
    const params = new URLSearchParams(rawBody);

    const xRefPayco = params.get("x_ref_payco") ?? "";
    const xTransactionId = params.get("x_transaction_id") ?? "";
    const xAmount = params.get("x_amount") ?? "";
    const xCurrencyCode = params.get("x_currency_code") ?? "";
    const xSignature = params.get("x_signature") ?? "";
    const xTransactionState = params.get("x_transaction_state") ?? "";
    // Nuestra referencia interna (id de la orden), enviada como x_extra1 al crear la transacción
    const referenciaOrden = params.get("x_extra1") ?? "";

    if (!referenciaOrden) {
      console.error("Webhook de ePayco sin x_extra1 (referencia de orden)");
      return new Response("Falta referencia de orden", { status: 400 });
    }

    // ---------------------------------------------------
    // 1. Encontrar la orden y, con ella, el evento al que pertenece
    // ---------------------------------------------------
    const { data: orden, error: errorOrden } = await supabase
      .from("ordenes")
      .select("*")
      .eq("referencia_pago", referenciaOrden)
      .single();

    if (errorOrden || !orden) {
      console.error("Orden no encontrada para referencia:", referenciaOrden, errorOrden);
      return new Response("Orden no encontrada", { status: 404 });
    }

    if (!orden.evento_id) {
      console.error("La orden no tiene evento_id asociado:", orden.id);
      return new Response("Orden sin evento asociado", { status: 400 });
    }

    // ---------------------------------------------------
    // 2. Traer las credenciales de ESE evento (multi-tenant)
    // ---------------------------------------------------
    const { data: credenciales, error: errorCred } = await supabase
      .from("credenciales_pago")
      .select("llave_privada, datos_adicionales")
      .eq("evento_id", orden.evento_id)
      .single();

    if (errorCred || !credenciales) {
      console.error("El evento no tiene credenciales de pago configuradas:", orden.evento_id);
      return new Response("Evento sin credenciales de pago", { status: 400 });
    }

    const pKey = credenciales.llave_privada;
    const custId = (credenciales.datos_adicionales as Record<string, unknown>)?.customer_id as
      | string
      | undefined;

    if (!pKey || !custId) {
      console.error("Faltan p_key o customer_id en las credenciales del evento:", orden.evento_id);
      return new Response("Credenciales incompletas", { status: 400 });
    }

    // ---------------------------------------------------
    // 3. Verificar la firma con las credenciales de ESE evento
    // Fórmula oficial de ePayco:
    // sha256(p_cust_id_cliente^p_key^x_ref_payco^x_transaction_id^x_amount^x_currency_code)
    // ---------------------------------------------------
    const cadena = `${custId}^${pKey}^${xRefPayco}^${xTransactionId}^${xAmount}^${xCurrencyCode}`;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(cadena));
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (hashHex !== xSignature) {
      console.error("Firma de ePayco inválida para orden:", orden.id);
      return new Response("Firma inválida", { status: 401 });
    }

    // ---------------------------------------------------
    // 4. Mapear el estado y actualizar la orden
    // ---------------------------------------------------
    const estadoInterno = mapearEstado(xTransactionState);

    const { data: ordenActualizada, error: errorUpdate } = await supabase
      .from("ordenes")
      .update({ estado: estadoInterno })
      .eq("id", orden.id)
      .select()
      .single();

    if (errorUpdate || !ordenActualizada) {
      console.error("Error actualizando la orden:", errorUpdate);
      return new Response("Error actualizando orden", { status: 500 });
    }

    // ---------------------------------------------------
    // 5. Si el pago fue aprobado, entregar los archivos (idempotente)
    // ---------------------------------------------------
    if (estadoInterno === "aprobado" && !ordenActualizada.archivos_enviados) {
      await entregarArchivos(ordenActualizada);
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Error procesando webhook de ePayco:", err);
    return new Response("Error interno", { status: 500 });
  }
});

function mapearEstado(estadoEpayco: string): "aprobado" | "rechazado" | "reembolsado" | "pendiente" {
  switch (estadoEpayco) {
    case "Aceptada":
      return "aprobado";
    case "Rechazada":
    case "Fallida":
      return "rechazado";
    case "Pendiente":
      return "pendiente";
    default:
      return "pendiente";
  }
}

async function entregarArchivos(orden: any) {
  const items = orden.items as { fotografia_id: string }[];
  const ids = items.map((i) => i.fotografia_id);

  const { data: fotos, error } = await supabase
    .from("fotografias")
    .select("id, foto_privada_path, video_privada_path")
    .in("id", ids);

  if (error || !fotos) {
    console.error("Error obteniendo fotografías para entrega:", error);
    return;
  }

  const expiracionSegundos = 60 * 60 * 48; // 48 horas
  const enlaces: string[] = [];

  for (const foto of fotos) {
    const { data: signedFoto, error: errFoto } = await supabase.storage
      .from(bucketPrivado)
      .createSignedUrl(foto.foto_privada_path, expiracionSegundos);

    if (errFoto) {
      console.error("Error generando signed URL de foto:", errFoto);
    } else if (signedFoto) {
      enlaces.push(signedFoto.signedUrl);
    }

    if (foto.video_privada_path) {
      const { data: signedVideo, error: errVideo } = await supabase.storage
        .from(bucketPrivado)
        .createSignedUrl(foto.video_privada_path, expiracionSegundos);

      if (errVideo) {
        console.error("Error generando signed URL de video:", errVideo);
      } else if (signedVideo) {
        enlaces.push(signedVideo.signedUrl);
      }
    }
  }

  await enviarCorreoDescarga(orden.email_comprador, enlaces);

  await supabase
    .from("ordenes")
    .update({ archivos_enviados: true, fecha_envio: new Date().toISOString() })
    .eq("id", orden.id);
}

async function enviarCorreoDescarga(destinatario: string, enlaces: string[]) {
  const items = enlaces
    .map((url) => `<li><a href="${url}">Descargar archivo</a></li>`)
    .join("");

  const html = `
    <h2>¡Gracias por tu compra!</h2>
    <p>Tus archivos están listos. Estos enlaces expiran en 48 horas:</p>
    <ul>${items}</ul>
  `;

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Cincuenta Milímetros <onboarding@resend.dev>",
      to: [destinatario],
      subject: "Tus fotos ya están listas para descargar",
      html,
    }),
  });

  if (!resp.ok) {
    console.error("Error enviando correo:", await resp.text());
  }
}