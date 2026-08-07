-- Add consultation_fee to the canonical doctors table (plural).
-- It only existed on the dropped singular `doctor` table, so the
-- Super Admin doctor edit modal could not persist it.

ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC DEFAULT 0;

NOTIFY pgrst, 'reload schema';
