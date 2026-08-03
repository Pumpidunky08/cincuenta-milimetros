-- Políticas de almacenamiento para fotos originales y previews
DROP POLICY IF EXISTS "fotos_privadas_admin_all" ON storage.objects;
CREATE POLICY "fotos_privadas_admin_all"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'fotos-privadas' AND public.is_admin())
WITH CHECK (bucket_id = 'fotos-privadas' AND public.is_admin());

DROP POLICY IF EXISTS "fotos_publicas_admin_all" ON storage.objects;
CREATE POLICY "fotos_publicas_admin_all"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'fotos-publicas' AND public.is_admin())
WITH CHECK (bucket_id = 'fotos-publicas' AND public.is_admin());