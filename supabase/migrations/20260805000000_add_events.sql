-- ============================================================
-- Events: public announcements with up to 4 images + caption,
-- managed by the super admin dashboard.
-- Safe to re-run: CREATE TABLE IF NOT EXISTS / DROP POLICY IF EXISTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT NOT NULL,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT events_images_max CHECK (jsonb_array_length(images) <= 4)
);

CREATE INDEX IF NOT EXISTS events_created_idx ON public.events (created_at DESC);
CREATE INDEX IF NOT EXISTS events_active_idx ON public.events (is_active);

-- ── RLS: public can read active events; admins can manage everything ──
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS events_select_active ON public.events;
CREATE POLICY events_select_active ON public.events FOR SELECT
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS events_admin_all ON public.events;
CREATE POLICY events_admin_all ON public.events FOR ALL
  USING (public.is_admin());

-- ── Cap at 20 events: after every insert, drop the oldest beyond 20 ──
CREATE OR REPLACE FUNCTION public.enforce_events_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  DELETE FROM public.events e
  WHERE e.id IN (
    SELECT id FROM (
      SELECT id, row_number() OVER (ORDER BY created_at DESC, id DESC) AS rn
      FROM public.events
    ) ranked
    WHERE ranked.rn > 20
  );
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS events_limit_after_insert ON public.events;
CREATE TRIGGER events_limit_after_insert AFTER INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.enforce_events_limit();

-- ── Storage: let admins upload event images to the public 'images' bucket ──
-- (public bucket reads need no policy; writes/updates/deletes do.)
DROP POLICY IF EXISTS storage_images_admin_all ON storage.objects;
CREATE POLICY storage_images_admin_all ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'images' AND public.is_admin())
  WITH CHECK (bucket_id = 'images' AND public.is_admin());

NOTIFY pgrst, 'reload schema';
