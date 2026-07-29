-- Fix duplicated doctor/doctors tables.
-- The real table is `doctors` (plural). `doctor` (singular) was created by
-- CREATE TABLE IF NOT EXISTS and has RLS policies attached to it.
-- We drop `doctor`, apply policies to `doctors`, and add FK constraints.

-- Step 1: Drop policies on `appointments`, `consultations`, `availability`
-- that reference `public.doctor` (singular) so we can drop that table.
DROP POLICY IF EXISTS "doctors_read_department_appointments" ON public.appointments;
DROP POLICY IF EXISTS "doctors_read_department_consultations" ON public.consultations;

-- Step 2: Drop policies on the `doctor` table itself
DROP POLICY IF EXISTS "doctor_select" ON public.doctor;
DROP POLICY IF EXISTS "doctor_admin_all" ON public.doctor;

-- Step 3: Drop the duplicate `doctor` table
DROP TABLE IF EXISTS public.doctor CASCADE;

-- Step 4: Add FK constraints so Supabase can resolve nested relationships
ALTER TABLE public.availability
  DROP CONSTRAINT IF EXISTS availability_doctor_id_fkey,
  ADD CONSTRAINT availability_doctor_id_fkey
    FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE SET NULL;

ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_doctor_id_fkey,
  ADD CONSTRAINT appointments_doctor_id_fkey
    FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE SET NULL;

ALTER TABLE public.consultations
  DROP CONSTRAINT IF EXISTS consultations_doctor_id_fkey,
  ADD CONSTRAINT consultations_doctor_id_fkey
    FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE SET NULL;

-- Step 5: Apply RLS to the real `doctors` table
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "doctors_select" ON public.doctors;
CREATE POLICY "doctors_select" ON public.doctors FOR SELECT USING (true);
DROP POLICY IF EXISTS "doctors_admin_all" ON public.doctors;
CREATE POLICY "doctors_admin_all" ON public.doctors FOR ALL USING (public.is_admin());

-- Step 6: Recreate `appointments_select` policy using `doctors` instead of `doctor`
DROP POLICY IF EXISTS "appointments_select" ON public.appointments;
CREATE POLICY "appointments_select" ON public.appointments FOR SELECT
  USING (
    patient_id = auth.uid() OR public.is_admin()
    OR (public.is_doctor() AND doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()))
  );

-- Step 7: Recreate `consultations_select` policy using `doctors` instead of `doctor`
DROP POLICY IF EXISTS "consultations_select" ON public.consultations;
CREATE POLICY "consultations_select" ON public.consultations FOR SELECT
  USING (
    patient_id = auth.uid() OR public.is_admin()
    OR (public.is_doctor() AND specialty IN (SELECT specialty FROM public.doctors WHERE user_id = auth.uid()))
  );

-- Step 8: Recreate `availability_manage` policy using `doctors` instead of `doctor`
DROP POLICY IF EXISTS "availability_manage" ON public.availability;
CREATE POLICY "availability_manage" ON public.availability FOR ALL
  USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()) OR public.is_admin());
