-- Re-point doctors.user_id to the authoritative `profiles` table.
-- The pre-existing doctors_user_id_fkey constraint referenced the legacy
-- `user_profiles` table, so PostgREST still could not resolve doctors ->
-- profiles embeds even after 20260806000000 restored the constraint name.
-- `profiles` is the table used by the client, RLS and auth functions.

ALTER TABLE public.doctors DROP CONSTRAINT IF EXISTS doctors_user_id_fkey;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'doctors_user_id_fkey' AND conrelid = 'public.doctors'::regclass
  ) THEN
    ALTER TABLE public.doctors
      ADD CONSTRAINT doctors_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Reload the PostgREST schema cache so nested relationships resolve now
NOTIFY pgrst, 'reload schema';
