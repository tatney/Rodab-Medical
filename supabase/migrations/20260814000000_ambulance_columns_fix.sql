-- ============================================================
-- Ambulance requests: add the display columns the frontend has
-- always read/written but migrations never created, then backfill
-- them from the canonical columns so existing rows display properly.
-- Safe to re-run: ADD COLUMN IF NOT EXISTS / idempotent UPDATEs.
-- ============================================================

ALTER TABLE public.ambulance_requests ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.ambulance_requests ADD COLUMN IF NOT EXISTS destination TEXT;
ALTER TABLE public.ambulance_requests ADD COLUMN IF NOT EXISTS condition TEXT;

UPDATE public.ambulance_requests
SET location = COALESCE(location, pickup_address),
    destination = COALESCE(destination, destination_address),
    condition = COALESCE(condition, notes);

NOTIFY pgrst, 'reload schema';
