-- Fix relationships lost when the duplicate `doctor` table was dropped
-- (20260728000000). That migration re-added FKs for availability, appointments
-- and consultations -> doctors, but never recreated `doctors.user_id ->
-- profiles(id)` (it existed on the dropped table) nor `doctors.department_id ->
-- departments(id)` (column was never recreated at all). PostgREST could not
-- resolve any `doctors -> profiles` nested relationship, breaking /find-doctor,
-- appointments, consultations, availability and the admin doctor views.

-- Step 1: Restore FK doctors.user_id -> profiles.id
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

-- Step 2: Restore doctors.department_id column + FK -> departments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'doctors' AND column_name = 'department_id'
  ) THEN
    ALTER TABLE public.doctors
      ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'doctors_department_id_fkey' AND conrelid = 'public.doctors'::regclass
  ) THEN
    ALTER TABLE public.doctors
      ADD CONSTRAINT doctors_department_id_fkey
      FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Step 3: Backfill department_id from the matching department name
UPDATE public.doctors d
SET department_id = dep.id
FROM public.departments dep
WHERE dep.name = d.department AND d.department_id IS NULL;

-- Step 4: Reload the PostgREST schema cache so nested relationships resolve now
NOTIFY pgrst, 'reload schema';
