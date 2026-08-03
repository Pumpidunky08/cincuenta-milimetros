## Objetivo

Que al subir una foto original se genere automáticamente una versión de vista previa (reducida y con marca de agua diagonal "Preview · No Oficial") y que esa copia sea la que ven los compradores en la galería.

## Estado actual verificado

- Existe el código de la función `generar-preview` en el proyecto, pero apunta a un bucket llamado `fotos-originales` que **no existe**. Los buckets reales son `fotos-privadas` y `fotos-publicas` (ambos privados).
- La tabla `fotografias` ya tiene `foto_publica_url`, `foto_privada_path` y `video_privada_path`.
- No hay todavía ninguna pantalla en el panel de administración para subir fotos: el panel solo valida el acceso de administrador.

## Qué se va a construir

**1. Corregir la función de previews**
- Usar los buckets reales (`fotos-privadas` como origen, `fotos-publicas` como destino).
- Mantener: reducción a máximo 1200 px de ancho, marca de agua repetida en diagonal, compresión JPEG.
- Devolver un enlace firmado de 10 años a la copia pública (los buckets no pueden ser públicos en este espacio de trabajo).
- Proteger la función: solo un usuario administrador (validado con `is_admin()`) puede invocarla.
- Desplegarla y probarla con una imagen real.

**2. Pantalla de subida en `/admin`**
- Selector de evento + campos: equipo, categoría, tipo de foto, atleta, dorsal.
- Subida múltiple de archivos al bucket privado.
- Por cada archivo: llamar a `generar-preview` y guardar la fila en `fotografias` con `foto_privada_path` y `foto_publica_url`.
- Barra de progreso por archivo y aviso de errores.

**3. Permisos de almacenamiento**
- Políticas en `storage.objects`: solo administradores pueden subir/leer `fotos-privadas` y subir a `fotos-publicas`. Las previews se sirven por enlace firmado, así que no hace falta lectura anónima.

## Detalles técnicos

- El procesamiento de imagen se queda en la Edge Function existente (Deno + ImageScript); el runtime del servidor de la app no soporta librerías de imagen nativas.
- La galería ya lee `fotografias_publicas`, que expone `foto_publica_url`, así que no hay cambios en la vista de compra.
- Limitación a considerar: los enlaces firmados de 10 años dejan de servir si se rotan las claves del proyecto; si eso pasa, se regeneran con un script.
