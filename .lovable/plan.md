## Problema
Hoy `/admin/login` solo se abre escribiendo la URL. La home y el header no exponen ningún acceso.

## Opción propuesta: acceso discreto en el footer
El panel de admin no es para usuarios finales (compradores en las gradas), así que no debería competir visualmente con el flujo de compra.

1. Añadir un footer minimalista en `src/routes/__root.tsx` (debajo del `<Outlet />`) con un enlace pequeño "Acceso administradores" que use `<Link to="/admin/login">`.
2. Así queda disponible desde cualquier página (home, evento, checkout) sin ensuciar la UI móvil.

## Alternativas si prefieres otra ubicación
- **Botón en el header** junto al carrito (más visible, pero mezcla admin con compra).
- **Solo en la home** dentro de una sección discreta al final.
- **Sin enlace en UI** y acceder siempre por URL directa (status quo).

¿Voy con el footer, o prefieres otra ubicación?