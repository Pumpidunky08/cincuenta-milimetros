## Objetivo

Dejar funcionando la generación automática de vistas previas: tomar la foto original del almacenamiento privado, reducirla y marcarla con agua, y devolver un enlace utilizable en la galería.

## Estado actual verificado

- El archivo de la función apunta al bucket `fotos-originales`, que no existe. Los buckets reales son `fotos-privadas` y `fotos-publicas`.
- Los registros de ejecución confirman el fallo exacto: `Error descargando original: StorageApiError: Bucket not found`.
- La función carga la fuente de la marca de agua desde una dirección que ya no existe (responde 404), así que el texto tampoco se dibujaría aunque el bucket fuera correcto.
- La función no valida quién la llama: hoy cualquiera con la dirección puede pedir procesar un archivo privado.
- Quedó código de diagnóstico temporal que escribe listados de buckets en los registros.
- El componente de subida en el panel (`FotoUploader`) ya invoca `generar-preview` y espera recibir `foto_publica_url`.

## Qué se va a corregir

1. **Buckets correctos**: leer de `fotos-privadas` y escribir en `fotos-publicas`, sin depender de valores de configuración desactualizados.
2. **Marca de agua**: usar una fuente que sí exista y esperar correctamente el dibujado del texto "Preview · No Oficial" repetido en diagonal.
3. **Tamaño**: reducir a un máximo de 1200 px de ancho y guardar como JPEG comprimido.
4. **Seguridad**: aceptar solo llamadas de un administrador autenticado (validado con `is_admin()`), y rechazar rutas inválidas.
5. **Respuesta**: devolver siempre JSON con `foto_publica_url` (enlace firmado de 10 años) o un mensaje de error claro, con cabeceras CORS.
6. **Limpieza**: quitar el código de diagnóstico temporal.

## Verificación

- Desplegar la función y comprobar que una llamada sin permisos responde "No autorizado".
- Procesar una imagen real de prueba y revisar visualmente que la marca de agua aparece y que el tamaño se redujo.
- Confirmar que el enlace devuelto abre la vista previa.

## Detalles técnicos

- Se mantiene Deno + ImageScript dentro de la Edge Function (el runtime del servidor de la app no soporta librerías de imagen nativas).
- Los buckets son privados en este espacio de trabajo, por eso la vista previa se sirve mediante enlace firmado de larga duración en lugar de URL pública. Si algún día se rotan las claves del proyecto, esos enlaces habría que regenerarlos.
