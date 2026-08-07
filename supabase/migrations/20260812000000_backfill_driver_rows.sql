-- Backfill missing driver rows for driver-role profiles.
-- Some driver accounts were created via signup/dashboard without a matching row
-- in the public.drivers table, so they never appear in driver assignment
-- dropdowns or the admin Drivers tab, and cannot receive rides or location
-- updates.

ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS status TEXT;

INSERT INTO public.drivers (id, user_id, profile_id, full_name, phone, license_number, status, is_available)
SELECT
  p.id,
  p.id,
  p.id,
  p.full_name,
  p.phone,
  COALESCE(dr.license_number, ''),
  COALESCE(dr.status, 'off_duty'),
  COALESCE(dr.is_available, true)
FROM public.profiles p
LEFT JOIN public.drivers dr ON dr.profile_id = p.id
WHERE p.role = 'driver'
  AND dr.id IS NULL
ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
