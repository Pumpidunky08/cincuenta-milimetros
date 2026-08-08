// Edge Function: generar-preview
//
// Flujo:
//   1. El panel de admin sube SOLO el archivo original (alta resolución) al bucket privado.
//   2. Llama a esta función pasando el `path` de ese archivo.
//   3. Esta función descarga el original, lo reduce y le aplica marca de agua,
//      sube el resultado al bucket público y devuelve un enlace firmado de 10 años.
//   4. El panel guarda la fila en `fotografias` con foto_privada_path + foto_publica_url.
//
// Solo administradores autenticados (is_admin()) pueden invocarla.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

// Buckets reales del proyecto (ambos privados).
const BUCKET_PRIVADO = "fotos-privadas";
const BUCKET_PUBLICO = "fotos-publicas";

const admin = createClient(supabaseUrl, serviceRoleKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

// ImageScript 1.2.x recibe la fuente como bytes TTF crudos.
const FONT_URL =
  "https://raw.githubusercontent.com/matmen/ImageScript/master/tests/fonts/opensans%20bold.ttf";

let fontCache: Uint8Array | null = null;
async function getFont(): Promise<Uint8Array> {
  if (!fontCache) {
    const res = await fetch(FONT_URL);
    if (!res.ok) throw new Error("No se pudo cargar la fuente de la marca de agua");
    fontCache = new Uint8Array(await res.arrayBuffer());
  }
  return fontCache;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    // --- Autorización: solo administradores ---
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "No autorizado" }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return json({ error: "No autorizado" }, 401);
    }

    const { data: esAdmin, error: adminError } = await userClient.rpc("is_admin");
    if (adminError || esAdmin !== true) {
      return json({ error: "Requiere permisos de administrador" }, 403);
    }

    // --- Entrada ---
    const { path } = await req.json();
    if (!path || typeof path !== "string" || path.includes("..") || path.startsWith("/")) {
      return json({ error: "Falta o es inválido el parámetro 'path'" }, 400);
    }

    // 1. Descargar el original desde el bucket privado
    const { data: original, error: downloadError } = await admin.storage
      .from(BUCKET_PRIVADO)
      .download(path);

    if (downloadError || !original) {
      console.error("Error descargando original:", downloadError);
      return json({ error: "No se encontró el archivo original" }, 404);
    }

    const bytes = new Uint8Array(await original.arrayBuffer());
    const image = await Image.decode(bytes);

    // 2. Reducir a máximo 1200 px de ancho
    const ANCHO_MAXIMO = 1200;
    if (image.width > ANCHO_MAXIMO) {
      image.resize(ANCHO_MAXIMO, Image.RESIZE_AUTO);
    }

    // 3. Marca de agua diagonal repetida
    const fuente = await getFont();
    const texto = await Image.renderText(fuente, 26, "Preview · No Oficial", 0xffffff90);

    const paso = 240;
    const capaMarca = new Image(image.width, image.height);
    for (let y = -image.height; y < image.height * 2; y += paso) {
      for (let x = -image.width; x < image.width * 2; x += paso) {
        capaMarca.composite(texto, x, y);
      }
    }
    capaMarca.rotate(-25);
    image.composite(capaMarca, 0, 0);

    // 4. Comprimir como JPEG
    const salida = await image.encodeJPEG(75);

    // 5. Subir la vista previa al bucket público
    const pathPublico = path.replace(/\.[^/.]+$/, "") + "-preview.jpg";
    const { error: uploadError } = await admin.storage
      .from(BUCKET_PUBLICO)
      .upload(pathPublico, salida, { contentType: "image/jpeg", upsert: true });

    if (uploadError) {
      console.error("Error subiendo preview:", uploadError);
      return json({ error: "Error subiendo el preview" }, 500);
    }

    // Los buckets no pueden ser públicos en este espacio de trabajo:
    // se genera un enlace firmado de 10 años.
    const DIEZ_ANIOS_EN_SEGUNDOS = 60 * 60 * 24 * 365 * 10;
    const { data: signedData, error: signError } = await admin.storage
      .from(BUCKET_PUBLICO)
      .createSignedUrl(pathPublico, DIEZ_ANIOS_EN_SEGUNDOS);

    if (signError || !signedData) {
      console.error("Error firmando URL de preview:", signError);
      return json({ error: "Error generando enlace de preview" }, 500);
    }

    return json({ foto_publica_url: signedData.signedUrl, preview_path: pathPublico });
  } catch (err) {
    console.error("Error procesando preview:", err);
    return json({ error: "Error interno" }, 500);
  }
});
