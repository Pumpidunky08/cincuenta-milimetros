-- 1) Recreate view with security_invoker to respect caller RLS/permissions
DROP VIEW IF EXISTS public.fotografias_publicas;
CREATE VIEW public.fotografias_publicas
WITH (security_invoker = true, security_barrier = true) AS
SELECT id, evento_id, foto_publica_url, equipo, categoria, atleta, dorsal, tipo_foto, created_at
FROM public.fotografias;

GRANT SELECT ON public.fotografias_publicas TO anon, authenticated;

-- 2) Restrict fotografias public reads: hide private paths via column grants
-- Keep the permissive SELECT policy but limit which columns anon/authenticated can read.
REVOKE SELECT ON public.fotografias FROM anon, authenticated, PUBLIC;

GRANT SELECT (id, evento_id, foto_publica_url, equipo, categoria, atleta, dorsal, atleta_tag, tipo_foto, created_at, evento_id)
  ON public.fotografias TO anon, authenticated;

GRANT ALL ON public.fotografias TO service_role;

-- Add an admin-only SELECT policy so admins can still read private paths through server-side (service role) or via elevated queries.
DROP POLICY IF EXISTS fotografias_lectura_admin ON public.fotografias;
CREATE POLICY fotografias_lectura_admin ON public.fotografias
FOR SELECT
USING (public.is_admin());

-- 3) Restrict is_admin() execution: not needed for anonymous callers
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- 4) Set search_path on all functions to prevent search_path hijacking
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.get_categorias_por_equipo(uuid, text) SET search_path = public;
ALTER FUNCTION public.get_conteo_por_tipo(uuid, text, text) SET search_path = public;
ALTER FUNCTION public.get_equipos_por_evento(uuid) SET search_path = public;

-- Also restrict RPC helper functions from anonymous execution (they read from fotografias)
REVOKE EXECUTE ON FUNCTION public.get_categorias_por_equipo(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_conteo_por_tipo(uuid, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_equipos_por_evento(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_categorias_por_equipo(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_conteo_por_tipo(uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_equipos_por_evento(uuid) TO authenticated, service_role;