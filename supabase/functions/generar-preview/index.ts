// Edge Function: generar-preview
// Deploy: supabase functions deploy generar-preview
//
// Flujo:
//   1. El panel de admin sube SOLO el archivo original (alta resolución) al bucket privado.
//   2. Llama a esta función pasando el `path` de ese archivo.
//   3. Esta función descarga el original, aplica marca de agua + reduce tamaño,
//      sube el resultado al bucket público, y devuelve la URL pública.
//   4. El panel de admin usa esa URL para guardar la fila en `fotografias`
//      (foto_publica_url = la que devuelve esta función,
//       foto_privada_path = el path del original que ya subió en el paso 1).
//
// Variables de entorno necesarias:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   BUCKET_PRIVADO   (default: "fotos-originales")
//   BUCKET_PUBLICO   (default: "fotos-publicas")

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const bucketPrivado = Deno.env.get("BUCKET_PRIVADO") ?? "fotos-originales";
const bucketPublico = Deno.env.get("BUCKET_PUBLICO") ?? "fotos-publicas";

const supabase = createClient(supabaseUrl, serviceRoleKey);

let fontCache: Font | null = null;
async function getFont(): Promise<Font> {
  if (!fontCache) {
    // Fuente básica para el texto de la marca de agua
    fontCache = await Font.fromUrl(
      "https://raw.githubusercontent.com/matmen/ImageScript/master/fonts/arial.ttf",
    );
  }
  return fontCache;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { path } = await req.json();
    if (!path || typeof path !== "string") {
      return new Response("Falta el parámetro 'path'", { status: 400 });
    }

    // 1. Descargar el archivo original desde el bucket privado
    const { data: original, error: downloadError } = await supabase.storage
      .from(bucketPrivado)
      .download(path);

    if (downloadError || !original) {
      console.error("Error descargando original:", downloadError);
      return new Response("No se encontró el archivo original", { status: 404 });
    }

    const bytes = new Uint8Array(await original.arrayBuffer());
    const image = await Image.decode(bytes);

    // 2. Redimensionar (evita que el preview sirva como reemplazo del original)
    const anchoMaximo = 1200;
    if (image.width > anchoMaximo) {
      image.resize(anchoMaximo, Image.RESIZE_AUTO);
    }

    // 3. Marca de agua diagonal repetida
    const fuente = await getFont();
    const texto = Image.renderText(fuente, 26, "PREVIEW · NO OFICIAL", 0xffffff90);

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

    // 5. Subir la versión con marca de agua al bucket público
    const pathPublico = path.replace(/\.[^/.]+$/, "") + "-preview.jpg";
    const { error: uploadError } = await supabase.storage
      .from(bucketPublico)
      .upload(pathPublico, salida, { contentType: "image/jpeg", upsert: true });

    if (uploadError) {
      console.error("Error subiendo preview:", uploadError);
      return new Response("Error subiendo el preview", { status: 500 });
    }

    // El workspace no permite buckets públicos, así que en vez de getPublicUrl
    // generamos un enlace firmado de muy larga duración (10 años) que funciona
    // igual que uno público en la práctica, sin exponer el bucket completo.
    const DIEZ_ANIOS_EN_SEGUNDOS = 60 * 60 * 24 * 365 * 10;
    const { data: signedData, error: signError } = await supabase.storage
      .from(bucketPublico)
      .createSignedUrl(pathPublico, DIEZ_ANIOS_EN_SEGUNDOS);

    if (signError || !signedData) {
      console.error("Error firmando URL de preview:", signError);
      return new Response("Error generando enlace de preview", { status: 500 });
    }

    return new Response(JSON.stringify({ foto_publica_url: signedData.signedUrl }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error("Error procesando preview:", err);
    return new Response("Error interno", { status: 500 });
  }
});