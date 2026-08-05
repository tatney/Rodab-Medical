-- ============================================================
-- News & Blogs (events renamed + categories), Programmes and
-- Partners. Managed by the super admin dashboard.
-- Safe to re-run: IF NOT EXISTS guards everywhere.
-- ============================================================

-- ── Step 1: Events become "News & Blogs" with a category ──
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS category TEXT;
CREATE INDEX IF NOT EXISTS events_category_idx ON public.events (category);

-- ── Step 2: Programmes table (behaves like events) ──
CREATE TABLE IF NOT EXISTS public.programmes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT NOT NULL,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT programmes_images_max CHECK (jsonb_array_length(images) <= 4)
);

CREATE INDEX IF NOT EXISTS programmes_created_idx ON public.programmes (created_at DESC);
CREATE INDEX IF NOT EXISTS programmes_active_idx ON public.programmes (is_active);
CREATE INDEX IF NOT EXISTS programmes_category_idx ON public.programmes (category);

ALTER TABLE public.programmes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS programmes_select_active ON public.programmes;
CREATE POLICY programmes_select_active ON public.programmes FOR SELECT
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS programmes_admin_all ON public.programmes;
CREATE POLICY programmes_admin_all ON public.programmes FOR ALL
  USING (public.is_admin());

-- Cap at 20 programmes
CREATE OR REPLACE FUNCTION public.enforce_programmes_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  DELETE FROM public.programmes p
  WHERE p.id IN (
    SELECT id FROM (
      SELECT id, row_number() OVER (ORDER BY created_at DESC, id DESC) AS rn
      FROM public.programmes
    ) ranked
    WHERE ranked.rn > 20
  );
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS programmes_limit_after_insert ON public.programmes;
CREATE TRIGGER programmes_limit_after_insert AFTER INSERT ON public.programmes
  FOR EACH ROW EXECUTE FUNCTION public.enforce_programmes_limit();

-- ── Step 3: Partners table (org name + logo) ──
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS partners_active_idx ON public.partners (is_active);
CREATE INDEX IF NOT EXISTS partners_created_idx ON public.partners (created_at DESC);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS partners_select_active ON public.partners;
CREATE POLICY partners_select_active ON public.partners FOR SELECT
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS partners_admin_all ON public.partners;
CREATE POLICY partners_admin_all ON public.partners FOR ALL
  USING (public.is_admin());

-- Cap at 30 partners
CREATE OR REPLACE FUNCTION public.enforce_partners_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  DELETE FROM public.partners p
  WHERE p.id IN (
    SELECT id FROM (
      SELECT id, row_number() OVER (ORDER BY created_at DESC, id DESC) AS rn
      FROM public.partners
    ) ranked
    WHERE ranked.rn > 30
  );
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS partners_limit_after_insert ON public.partners;
CREATE TRIGGER partners_limit_after_insert AFTER INSERT ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.enforce_partners_limit();

-- Storage: admins can already upload to the public 'images' bucket via the
-- storage_images_admin_all policy created in the events migration.

NOTIFY pgrst, 'reload schema';
