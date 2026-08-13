-- ============================================================
-- Ambulance requests: human-friendly tracking IDs.
-- Format: RDB + YYMMDD + '-' + 5-digit next number of the total
-- number of emergencies, e.g. RDB260813-00035.
-- Safe to re-run: idempotent ADD COLUMN / CREATE OR REPLACE.
-- ============================================================

ALTER TABLE public.ambulance_requests ADD COLUMN IF NOT EXISTS tracking_id TEXT;

-- Backfill existing rows with IDs derived from their creation date,
-- numbered 1..N in creation order so the next insert continues at N+1.
WITH numbered AS (
  SELECT id,
         row_number() OVER (ORDER BY created_at, id) AS rn
  FROM public.ambulance_requests
)
UPDATE public.ambulance_requests r
SET tracking_id = 'RDB' || to_char(r.created_at, 'YYMMDD') || '-' || lpad(n.rn::text, 5, '0')
FROM numbered n
WHERE r.id = n.id
  AND r.tracking_id IS NULL;

-- Auto-assign the next tracking ID on insert: RDB + YYMMDD + '-' + (total + 1).
CREATE OR REPLACE FUNCTION public.set_ambulance_tracking_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.tracking_id IS NULL THEN
    NEW.tracking_id := 'RDB' || to_char(NOW(), 'YYMMDD') || '-' || lpad(
      ((SELECT count(*)::int FROM public.ambulance_requests) + 1)::text,
      5,
      '0'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ambulance_requests_tracking_id_trigger ON public.ambulance_requests;
CREATE TRIGGER ambulance_requests_tracking_id_trigger
BEFORE INSERT ON public.ambulance_requests
FOR EACH ROW EXECUTE FUNCTION public.set_ambulance_tracking_id();

NOTIFY pgrst, 'reload schema';
