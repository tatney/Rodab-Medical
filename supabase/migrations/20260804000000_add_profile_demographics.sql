-- ============================================================
-- Add demographic columns to profiles so SignupPage demographics
-- (age, gender, blood group, chronic disease) actually persist.
-- Safe to re-run: ADD COLUMN IF NOT EXISTS / idempotent UPDATEs
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blood_group TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS chronic_disease TEXT;

-- gender/date_of_birth already exist; nothing else to backfill.

-- Allow a user to insert their own profile row. The auth.users trigger
-- (on_auth_user_created -> handle_new_user) creates the row at signup, but
-- Postgres still evaluates the INSERT policy on that statement's path, so a
-- missing INSERT policy silently blocked SignupPage's upsert and dropped the
-- demographics (age/gender/blood group/chronic disease) it was writing.
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

NOTIFY pgrst, 'reload schema';
