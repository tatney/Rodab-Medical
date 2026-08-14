-- Profile avatar uploads: a public 'avatars' storage bucket where each
-- authenticated user can only write inside their own folder.
-- (Public bucket reads need no policy; writes/updates/deletes do.)

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS storage_avatars_own_all ON storage.objects;
CREATE POLICY storage_avatars_own_all ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
