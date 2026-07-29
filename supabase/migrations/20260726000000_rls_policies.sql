-- ============================================================
-- RLS Policies for Rodab Medical
-- Safe to re-run: uses DROP IF EXISTS / CREATE OR REPLACE
-- Adds missing columns defensively for tables created manually
-- ============================================================

-- Helper functions (CREATE OR REPLACE is idempotent)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT public.get_user_role() IN ('admin', 'super_admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_doctor()
RETURNS BOOLEAN AS $$
  SELECT public.get_user_role() IN ('doctor', 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- DEFENSIVE COLUMN ADDITIONS
-- Tables were created manually before migrations ran, so
-- CREATE TABLE IF NOT EXISTS was a no-op. These ADD COLUMN
-- IF NOT EXISTS statements ensure all expected columns exist.
-- ============================================================

-- PROFILES: all columns expected (id, email, full_name, phone, role, avatar_url, address, date_of_birth, gender, created_at, updated_at)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='email') THEN ALTER TABLE public.profiles ADD COLUMN email TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='full_name') THEN ALTER TABLE public.profiles ADD COLUMN full_name TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='phone') THEN ALTER TABLE public.profiles ADD COLUMN phone TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='role') THEN ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='avatar_url') THEN ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='address') THEN ALTER TABLE public.profiles ADD COLUMN address TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='date_of_birth') THEN ALTER TABLE public.profiles ADD COLUMN date_of_birth DATE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='gender') THEN ALTER TABLE public.profiles ADD COLUMN gender TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='created_at') THEN ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='updated_at') THEN ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW(); END IF;
END $$;

-- DEPARTMENTS: (id, name, description, icon, is_active, created_at, updated_at)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='departments' AND column_name='name') THEN ALTER TABLE public.departments ADD COLUMN name TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='departments' AND column_name='description') THEN ALTER TABLE public.departments ADD COLUMN description TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='departments' AND column_name='icon') THEN ALTER TABLE public.departments ADD COLUMN icon TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='departments' AND column_name='is_active') THEN ALTER TABLE public.departments ADD COLUMN is_active BOOLEAN DEFAULT true; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='departments' AND column_name='created_at') THEN ALTER TABLE public.departments ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='departments' AND column_name='updated_at') THEN ALTER TABLE public.departments ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW(); END IF;
END $$;

-- DOCTOR: (id, profile_id, user_id, department_id, specialty, specialization, bio, consultation_fee, created_at)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='doctor' AND column_name='profile_id') THEN ALTER TABLE public.doctor ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='doctor' AND column_name='user_id') THEN ALTER TABLE public.doctor ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='doctor' AND column_name='department_id') THEN ALTER TABLE public.doctor ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='doctor' AND column_name='specialty') THEN ALTER TABLE public.doctor ADD COLUMN specialty TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='doctor' AND column_name='specialization') THEN ALTER TABLE public.doctor ADD COLUMN specialization TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='doctor' AND column_name='bio') THEN ALTER TABLE public.doctor ADD COLUMN bio TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='doctor' AND column_name='consultation_fee') THEN ALTER TABLE public.doctor ADD COLUMN consultation_fee NUMERIC DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='doctor' AND column_name='created_at') THEN ALTER TABLE public.doctor ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(); END IF;
END $$;

-- APPOINTMENTS: (id, patient_id, doctor_id, department_id, department, hospital_id, appointment_date, appointment_time, doctor_name, reason, status, created_at)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='appointments' AND column_name='patient_id') THEN ALTER TABLE public.appointments ADD COLUMN patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='appointments' AND column_name='doctor_id') THEN ALTER TABLE public.appointments ADD COLUMN doctor_id UUID; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='appointments' AND column_name='department_id') THEN ALTER TABLE public.appointments ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='appointments' AND column_name='department') THEN ALTER TABLE public.appointments ADD COLUMN department TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='appointments' AND column_name='hospital_id') THEN ALTER TABLE public.appointments ADD COLUMN hospital_id UUID; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='appointments' AND column_name='appointment_date') THEN ALTER TABLE public.appointments ADD COLUMN appointment_date DATE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='appointments' AND column_name='appointment_time') THEN ALTER TABLE public.appointments ADD COLUMN appointment_time TIME; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='appointments' AND column_name='doctor_name') THEN ALTER TABLE public.appointments ADD COLUMN doctor_name TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='appointments' AND column_name='reason') THEN ALTER TABLE public.appointments ADD COLUMN reason TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='appointments' AND column_name='status') THEN ALTER TABLE public.appointments ADD COLUMN status TEXT DEFAULT 'pending'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='appointments' AND column_name='created_at') THEN ALTER TABLE public.appointments ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(); END IF;
END $$;

-- CONSULTATIONS: (id, patient_id, doctor_id, department_id, doctor_name, subject, message, specialty, notes, diagnosis, response, responder_id, responded_at, status, created_at)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='consultations' AND column_name='patient_id') THEN ALTER TABLE public.consultations ADD COLUMN patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='consultations' AND column_name='doctor_id') THEN ALTER TABLE public.consultations ADD COLUMN doctor_id UUID; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='consultations' AND column_name='department_id') THEN ALTER TABLE public.consultations ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='consultations' AND column_name='doctor_name') THEN ALTER TABLE public.consultations ADD COLUMN doctor_name TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='consultations' AND column_name='subject') THEN ALTER TABLE public.consultations ADD COLUMN subject TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='consultations' AND column_name='message') THEN ALTER TABLE public.consultations ADD COLUMN message TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='consultations' AND column_name='specialty') THEN ALTER TABLE public.consultations ADD COLUMN specialty TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='consultations' AND column_name='notes') THEN ALTER TABLE public.consultations ADD COLUMN notes TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='consultations' AND column_name='diagnosis') THEN ALTER TABLE public.consultations ADD COLUMN diagnosis TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='consultations' AND column_name='response') THEN ALTER TABLE public.consultations ADD COLUMN response TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='consultations' AND column_name='responder_id') THEN ALTER TABLE public.consultations ADD COLUMN responder_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='consultations' AND column_name='responded_at') THEN ALTER TABLE public.consultations ADD COLUMN responded_at TIMESTAMPTZ; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='consultations' AND column_name='status') THEN ALTER TABLE public.consultations ADD COLUMN status TEXT DEFAULT 'open'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='consultations' AND column_name='created_at') THEN ALTER TABLE public.consultations ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(); END IF;
END $$;

-- VEHICLES: (id, plate_number, vehicle_type, model, year, type, capacity, status, created_at, updated_at)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='plate_number') THEN ALTER TABLE public.vehicles ADD COLUMN plate_number TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='vehicle_type') THEN ALTER TABLE public.vehicles ADD COLUMN vehicle_type TEXT DEFAULT 'ambulance'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='model') THEN ALTER TABLE public.vehicles ADD COLUMN model TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='year') THEN ALTER TABLE public.vehicles ADD COLUMN year INTEGER; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='type') THEN ALTER TABLE public.vehicles ADD COLUMN type TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='capacity') THEN ALTER TABLE public.vehicles ADD COLUMN capacity INTEGER; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='status') THEN ALTER TABLE public.vehicles ADD COLUMN status TEXT DEFAULT 'available'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='created_at') THEN ALTER TABLE public.vehicles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='updated_at') THEN ALTER TABLE public.vehicles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW(); END IF;
END $$;

-- DRIVERS: (id, profile_id, full_name, phone, license_number, vehicle_id, is_available, current_latitude, current_longitude, last_location_update, created_at)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='drivers' AND column_name='profile_id') THEN ALTER TABLE public.drivers ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='drivers' AND column_name='full_name') THEN ALTER TABLE public.drivers ADD COLUMN full_name TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='drivers' AND column_name='phone') THEN ALTER TABLE public.drivers ADD COLUMN phone TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='drivers' AND column_name='license_number') THEN ALTER TABLE public.drivers ADD COLUMN license_number TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='drivers' AND column_name='vehicle_id') THEN ALTER TABLE public.drivers ADD COLUMN vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='drivers' AND column_name='is_available') THEN ALTER TABLE public.drivers ADD COLUMN is_available BOOLEAN DEFAULT true; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='drivers' AND column_name='current_latitude') THEN ALTER TABLE public.drivers ADD COLUMN current_latitude DOUBLE PRECISION; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='drivers' AND column_name='current_longitude') THEN ALTER TABLE public.drivers ADD COLUMN current_longitude DOUBLE PRECISION; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='drivers' AND column_name='last_location_update') THEN ALTER TABLE public.drivers ADD COLUMN last_location_update TIMESTAMPTZ; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='drivers' AND column_name='created_at') THEN ALTER TABLE public.drivers ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(); END IF;
END $$;

-- AMBULANCE RIDES: (id, patient_id, pickup_lat, pickup_lng, pickup_address, destination, priority, hospital_id, notes, status, is_guest, patient_name, patient_phone, driver_id, created_at)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulance_rides' AND column_name='patient_id') THEN ALTER TABLE public.ambulance_rides ADD COLUMN patient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulance_rides' AND column_name='pickup_lat') THEN ALTER TABLE public.ambulance_rides ADD COLUMN pickup_lat DOUBLE PRECISION; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulance_rides' AND column_name='pickup_lng') THEN ALTER TABLE public.ambulance_rides ADD COLUMN pickup_lng DOUBLE PRECISION; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulance_rides' AND column_name='pickup_address') THEN ALTER TABLE public.ambulance_rides ADD COLUMN pickup_address TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulance_rides' AND column_name='destination') THEN ALTER TABLE public.ambulance_rides ADD COLUMN destination TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulance_rides' AND column_name='priority') THEN ALTER TABLE public.ambulance_rides ADD COLUMN priority TEXT DEFAULT 'medium'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulance_rides' AND column_name='hospital_id') THEN ALTER TABLE public.ambulance_rides ADD COLUMN hospital_id UUID; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulance_rides' AND column_name='notes') THEN ALTER TABLE public.ambulance_rides ADD COLUMN notes TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulance_rides' AND column_name='status') THEN ALTER TABLE public.ambulance_rides ADD COLUMN status TEXT DEFAULT 'dispatched'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulance_rides' AND column_name='is_guest') THEN ALTER TABLE public.ambulance_rides ADD COLUMN is_guest BOOLEAN DEFAULT false; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulance_rides' AND column_name='patient_name') THEN ALTER TABLE public.ambulance_rides ADD COLUMN patient_name TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulance_rides' AND column_name='patient_phone') THEN ALTER TABLE public.ambulance_rides ADD COLUMN patient_phone TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulance_rides' AND column_name='driver_id') THEN ALTER TABLE public.ambulance_rides ADD COLUMN driver_id UUID; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulance_rides' AND column_name='created_at') THEN ALTER TABLE public.ambulance_rides ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(); END IF;
END $$;

-- AMBULANCE REQUESTS: (id, patient_id, patient_name, contact_phone, guest_name, guest_phone, pickup_address, destination_address, latitude, longitude, notes, emergency_level, status, is_guest, driver_id, assigned_at, started_at, completed_at, created_at)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulance_requests' AND column_name='patient_id') THEN ALTER TABLE public.ambulance_requests ADD COLUMN patient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulance_requests' AND column_name='patient_name') THEN ALTER TABLE public.ambulance_requests ADD COLUMN patient_name TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulance_requests' AND column_name='contact_phone') THEN ALTER TABLE public.ambulance_requests ADD COLUMN contact_phone TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulance_requests' AND column_name='guest_name') THEN ALTER TABLE public.ambulance_requests ADD COLUMN guest_name TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulance_requests' AND column_name='guest_phone') THEN ALTER TABLE public.ambulance_requests ADD COLUMN guest_phone TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulance_requests' AND column_name='pickup_address') THEN ALTER TABLE public.ambulance_requests ADD COLUMN pickup_address TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulance_requests' AND column_name='destination_address') THEN ALTER TABLE public.ambulance_requests ADD COLUMN destination_address TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulance_requests' AND column_name='latitude') THEN ALTER TABLE public.ambulance_requests ADD COLUMN latitude DOUBLE PRECISION; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulance_requests' AND column_name='longitude') THEN ALTER TABLE public.ambulance_requests ADD COLUMN longitude DOUBLE PRECISION; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulance_requests' AND column_name='notes') THEN ALTER TABLE public.ambulance_requests ADD COLUMN notes TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulance_requests' AND column_name='emergency_level') THEN ALTER TABLE public.ambulance_requests ADD COLUMN emergency_level TEXT DEFAULT 'normal'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulance_requests' AND column_name='status') THEN ALTER TABLE public.ambulance_requests ADD COLUMN status TEXT DEFAULT 'requested'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulance_requests' AND column_name='is_guest') THEN ALTER TABLE public.ambulance_requests ADD COLUMN is_guest BOOLEAN DEFAULT false; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulance_requests' AND column_name='driver_id') THEN ALTER TABLE public.ambulance_requests ADD COLUMN driver_id UUID; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulance_requests' AND column_name='assigned_at') THEN ALTER TABLE public.ambulance_requests ADD COLUMN assigned_at TIMESTAMPTZ; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulance_requests' AND column_name='started_at') THEN ALTER TABLE public.ambulance_requests ADD COLUMN started_at TIMESTAMPTZ; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulance_requests' AND column_name='completed_at') THEN ALTER TABLE public.ambulance_requests ADD COLUMN completed_at TIMESTAMPTZ; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ambulance_requests' AND column_name='created_at') THEN ALTER TABLE public.ambulance_requests ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(); END IF;
END $$;

-- Fix NOT NULL constraints on columns that may have been created manually
ALTER TABLE public.ambulance_requests ALTER COLUMN contact_phone DROP NOT NULL;

-- AVAILABILITY: (id, doctor_id, date, day_of_week, start_time, end_time, max_appointments, department, created_at)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='availability' AND column_name='doctor_id') THEN ALTER TABLE public.availability ADD COLUMN doctor_id UUID; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='availability' AND column_name='date') THEN ALTER TABLE public.availability ADD COLUMN date DATE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='availability' AND column_name='day_of_week') THEN ALTER TABLE public.availability ADD COLUMN day_of_week INTEGER; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='availability' AND column_name='start_time') THEN ALTER TABLE public.availability ADD COLUMN start_time TIME; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='availability' AND column_name='end_time') THEN ALTER TABLE public.availability ADD COLUMN end_time TIME; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='availability' AND column_name='max_appointments') THEN ALTER TABLE public.availability ADD COLUMN max_appointments INTEGER DEFAULT 10; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='availability' AND column_name='department') THEN ALTER TABLE public.availability ADD COLUMN department TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='availability' AND column_name='created_at') THEN ALTER TABLE public.availability ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(); END IF;
END $$;

-- HOSPITALS: (id, name, address, phone, email, latitude, longitude, is_active, created_at)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hospitals' AND column_name='name') THEN ALTER TABLE public.hospitals ADD COLUMN name TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hospitals' AND column_name='address') THEN ALTER TABLE public.hospitals ADD COLUMN address TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hospitals' AND column_name='phone') THEN ALTER TABLE public.hospitals ADD COLUMN phone TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hospitals' AND column_name='email') THEN ALTER TABLE public.hospitals ADD COLUMN email TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hospitals' AND column_name='latitude') THEN ALTER TABLE public.hospitals ADD COLUMN latitude DOUBLE PRECISION; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hospitals' AND column_name='longitude') THEN ALTER TABLE public.hospitals ADD COLUMN longitude DOUBLE PRECISION; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hospitals' AND column_name='is_active') THEN ALTER TABLE public.hospitals ADD COLUMN is_active BOOLEAN DEFAULT true; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hospitals' AND column_name='created_at') THEN ALTER TABLE public.hospitals ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(); END IF;
END $$;

-- NOTIFICATIONS: (id, user_id, sender_id, target_user_id, target_department, title, message, type, is_read, read_at, created_at)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='user_id') THEN ALTER TABLE public.notifications ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='sender_id') THEN ALTER TABLE public.notifications ADD COLUMN sender_id UUID; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='target_user_id') THEN ALTER TABLE public.notifications ADD COLUMN target_user_id UUID; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='target_department') THEN ALTER TABLE public.notifications ADD COLUMN target_department TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='title') THEN ALTER TABLE public.notifications ADD COLUMN title TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='message') THEN ALTER TABLE public.notifications ADD COLUMN message TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='type') THEN ALTER TABLE public.notifications ADD COLUMN type TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='is_read') THEN ALTER TABLE public.notifications ADD COLUMN is_read BOOLEAN DEFAULT false; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='read_at') THEN ALTER TABLE public.notifications ADD COLUMN read_at TIMESTAMPTZ; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='created_at') THEN ALTER TABLE public.notifications ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(); END IF;
END $$;

-- FEES: (id, name, title, amount, description, category, status, department_id, created_by, is_active, created_at, updated_at)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fees' AND column_name='name') THEN ALTER TABLE public.fees ADD COLUMN name TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fees' AND column_name='title') THEN ALTER TABLE public.fees ADD COLUMN title TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fees' AND column_name='amount') THEN ALTER TABLE public.fees ADD COLUMN amount NUMERIC; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fees' AND column_name='description') THEN ALTER TABLE public.fees ADD COLUMN description TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fees' AND column_name='category') THEN ALTER TABLE public.fees ADD COLUMN category TEXT DEFAULT 'general'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fees' AND column_name='status') THEN ALTER TABLE public.fees ADD COLUMN status TEXT DEFAULT 'draft'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fees' AND column_name='department_id') THEN ALTER TABLE public.fees ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fees' AND column_name='created_by') THEN ALTER TABLE public.fees ADD COLUMN created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fees' AND column_name='is_active') THEN ALTER TABLE public.fees ADD COLUMN is_active BOOLEAN DEFAULT true; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fees' AND column_name='created_at') THEN ALTER TABLE public.fees ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fees' AND column_name='updated_at') THEN ALTER TABLE public.fees ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW(); END IF;
END $$;

-- REPEAT PRESCRIPTIONS: (id, patient_id, user_id, doctor_id, medication_name, medication, first_name, last_name, date_of_birth, email, phone, address, name_of_gp, pharmacy, additional_info, is_private_patient, consent, dosage, frequency, reason, doctor_name, status, notes, approved_by, created_at, updated_at)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='repeat_prescriptions' AND column_name='patient_id') THEN ALTER TABLE public.repeat_prescriptions ADD COLUMN patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='repeat_prescriptions' AND column_name='user_id') THEN ALTER TABLE public.repeat_prescriptions ADD COLUMN user_id UUID; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='repeat_prescriptions' AND column_name='doctor_id') THEN ALTER TABLE public.repeat_prescriptions ADD COLUMN doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='repeat_prescriptions' AND column_name='medication_name') THEN ALTER TABLE public.repeat_prescriptions ADD COLUMN medication_name TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='repeat_prescriptions' AND column_name='medication') THEN ALTER TABLE public.repeat_prescriptions ADD COLUMN medication TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='repeat_prescriptions' AND column_name='first_name') THEN ALTER TABLE public.repeat_prescriptions ADD COLUMN first_name TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='repeat_prescriptions' AND column_name='last_name') THEN ALTER TABLE public.repeat_prescriptions ADD COLUMN last_name TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='repeat_prescriptions' AND column_name='date_of_birth') THEN ALTER TABLE public.repeat_prescriptions ADD COLUMN date_of_birth TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='repeat_prescriptions' AND column_name='email') THEN ALTER TABLE public.repeat_prescriptions ADD COLUMN email TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='repeat_prescriptions' AND column_name='phone') THEN ALTER TABLE public.repeat_prescriptions ADD COLUMN phone TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='repeat_prescriptions' AND column_name='address') THEN ALTER TABLE public.repeat_prescriptions ADD COLUMN address TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='repeat_prescriptions' AND column_name='name_of_gp') THEN ALTER TABLE public.repeat_prescriptions ADD COLUMN name_of_gp TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='repeat_prescriptions' AND column_name='pharmacy') THEN ALTER TABLE public.repeat_prescriptions ADD COLUMN pharmacy TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='repeat_prescriptions' AND column_name='additional_info') THEN ALTER TABLE public.repeat_prescriptions ADD COLUMN additional_info TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='repeat_prescriptions' AND column_name='is_private_patient') THEN ALTER TABLE public.repeat_prescriptions ADD COLUMN is_private_patient BOOLEAN DEFAULT false; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='repeat_prescriptions' AND column_name='consent') THEN ALTER TABLE public.repeat_prescriptions ADD COLUMN consent BOOLEAN DEFAULT false; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='repeat_prescriptions' AND column_name='dosage') THEN ALTER TABLE public.repeat_prescriptions ADD COLUMN dosage TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='repeat_prescriptions' AND column_name='frequency') THEN ALTER TABLE public.repeat_prescriptions ADD COLUMN frequency TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='repeat_prescriptions' AND column_name='reason') THEN ALTER TABLE public.repeat_prescriptions ADD COLUMN reason TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='repeat_prescriptions' AND column_name='doctor_name') THEN ALTER TABLE public.repeat_prescriptions ADD COLUMN doctor_name TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='repeat_prescriptions' AND column_name='status') THEN ALTER TABLE public.repeat_prescriptions ADD COLUMN status TEXT DEFAULT 'pending'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='repeat_prescriptions' AND column_name='notes') THEN ALTER TABLE public.repeat_prescriptions ADD COLUMN notes TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='repeat_prescriptions' AND column_name='approved_by') THEN ALTER TABLE public.repeat_prescriptions ADD COLUMN approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='repeat_prescriptions' AND column_name='created_at') THEN ALTER TABLE public.repeat_prescriptions ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='repeat_prescriptions' AND column_name='updated_at') THEN ALTER TABLE public.repeat_prescriptions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW(); END IF;
END $$;

-- ILLNESS CERTIFICATES: (id, patient_id, user_id, doctor_id, reason, start_date, end_date, certificate_start_date, certificate_end_date, first_name, last_name, date_of_birth, email, phone, address, doctor_name, status, notes, approved_by, created_at, updated_at)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='illness_certificates' AND column_name='patient_id') THEN ALTER TABLE public.illness_certificates ADD COLUMN patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='illness_certificates' AND column_name='user_id') THEN ALTER TABLE public.illness_certificates ADD COLUMN user_id UUID; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='illness_certificates' AND column_name='doctor_id') THEN ALTER TABLE public.illness_certificates ADD COLUMN doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='illness_certificates' AND column_name='reason') THEN ALTER TABLE public.illness_certificates ADD COLUMN reason TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='illness_certificates' AND column_name='start_date') THEN ALTER TABLE public.illness_certificates ADD COLUMN start_date DATE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='illness_certificates' AND column_name='end_date') THEN ALTER TABLE public.illness_certificates ADD COLUMN end_date DATE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='illness_certificates' AND column_name='certificate_start_date') THEN ALTER TABLE public.illness_certificates ADD COLUMN certificate_start_date DATE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='illness_certificates' AND column_name='certificate_end_date') THEN ALTER TABLE public.illness_certificates ADD COLUMN certificate_end_date DATE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='illness_certificates' AND column_name='first_name') THEN ALTER TABLE public.illness_certificates ADD COLUMN first_name TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='illness_certificates' AND column_name='last_name') THEN ALTER TABLE public.illness_certificates ADD COLUMN last_name TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='illness_certificates' AND column_name='date_of_birth') THEN ALTER TABLE public.illness_certificates ADD COLUMN date_of_birth TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='illness_certificates' AND column_name='email') THEN ALTER TABLE public.illness_certificates ADD COLUMN email TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='illness_certificates' AND column_name='phone') THEN ALTER TABLE public.illness_certificates ADD COLUMN phone TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='illness_certificates' AND column_name='address') THEN ALTER TABLE public.illness_certificates ADD COLUMN address TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='illness_certificates' AND column_name='doctor_name') THEN ALTER TABLE public.illness_certificates ADD COLUMN doctor_name TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='illness_certificates' AND column_name='status') THEN ALTER TABLE public.illness_certificates ADD COLUMN status TEXT DEFAULT 'pending'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='illness_certificates' AND column_name='notes') THEN ALTER TABLE public.illness_certificates ADD COLUMN notes TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='illness_certificates' AND column_name='approved_by') THEN ALTER TABLE public.illness_certificates ADD COLUMN approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='illness_certificates' AND column_name='created_at') THEN ALTER TABLE public.illness_certificates ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='illness_certificates' AND column_name='updated_at') THEN ALTER TABLE public.illness_certificates ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW(); END IF;
END $$;

-- CONTACT MESSAGES: (id, name, full_name, email, subject, message, phone, form_type, status, admin_reply, created_at, updated_at)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contact_messages' AND column_name='name') THEN ALTER TABLE public.contact_messages ADD COLUMN name TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contact_messages' AND column_name='full_name') THEN ALTER TABLE public.contact_messages ADD COLUMN full_name TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contact_messages' AND column_name='email') THEN ALTER TABLE public.contact_messages ADD COLUMN email TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contact_messages' AND column_name='subject') THEN ALTER TABLE public.contact_messages ADD COLUMN subject TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contact_messages' AND column_name='message') THEN ALTER TABLE public.contact_messages ADD COLUMN message TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contact_messages' AND column_name='phone') THEN ALTER TABLE public.contact_messages ADD COLUMN phone TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contact_messages' AND column_name='form_type') THEN ALTER TABLE public.contact_messages ADD COLUMN form_type TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contact_messages' AND column_name='status') THEN ALTER TABLE public.contact_messages ADD COLUMN status TEXT DEFAULT 'unread'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contact_messages' AND column_name='admin_reply') THEN ALTER TABLE public.contact_messages ADD COLUMN admin_reply TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contact_messages' AND column_name='created_at') THEN ALTER TABLE public.contact_messages ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contact_messages' AND column_name='updated_at') THEN ALTER TABLE public.contact_messages ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW(); END IF;
END $$;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_public_doctors" ON public.profiles;
CREATE POLICY "profiles_select_public_doctors" ON public.profiles FOR SELECT
  USING (role = 'doctor' OR id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = auth.uid())
  );
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL
  USING (public.is_admin());

-- Auth trigger: auto-create profile on signup (ON CONFLICT avoids race with Edge Functions)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- DEPARTMENTS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "departments_select" ON public.departments;
CREATE POLICY "departments_select" ON public.departments FOR SELECT
  USING (is_active = true OR public.is_admin());
DROP POLICY IF EXISTS "departments_admin_all" ON public.departments;
CREATE POLICY "departments_admin_all" ON public.departments FOR ALL
  USING (public.is_admin());

-- DOCTOR
ALTER TABLE public.doctor ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "doctor_select" ON public.doctor;
CREATE POLICY "doctor_select" ON public.doctor FOR SELECT USING (true);
DROP POLICY IF EXISTS "doctor_admin_all" ON public.doctor;
CREATE POLICY "doctor_admin_all" ON public.doctor FOR ALL USING (public.is_admin());

-- APPOINTMENTS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "appointments_select" ON public.appointments;
CREATE POLICY "appointments_select" ON public.appointments FOR SELECT
  USING (
    patient_id = auth.uid() OR public.is_admin()
    OR (public.is_doctor() AND doctor_id IN (SELECT id FROM public.doctor WHERE user_id = auth.uid()))
  );
DROP POLICY IF EXISTS "appointments_insert" ON public.appointments;
CREATE POLICY "appointments_insert" ON public.appointments FOR INSERT
  WITH CHECK (patient_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "appointments_delete" ON public.appointments;
CREATE POLICY "appointments_delete" ON public.appointments FOR DELETE
  USING (patient_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "appointments_update" ON public.appointments;
CREATE POLICY "appointments_update" ON public.appointments FOR UPDATE
  USING (public.is_doctor() OR public.is_admin());

-- CONSULTATIONS
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "consultations_select" ON public.consultations;
CREATE POLICY "consultations_select" ON public.consultations FOR SELECT
  USING (
    patient_id = auth.uid() OR public.is_admin()
    OR (public.is_doctor() AND specialty IN (SELECT specialty FROM public.doctor WHERE user_id = auth.uid()))
  );
DROP POLICY IF EXISTS "consultations_insert" ON public.consultations;
CREATE POLICY "consultations_insert" ON public.consultations FOR INSERT
  WITH CHECK (patient_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "consultations_update" ON public.consultations;
CREATE POLICY "consultations_update" ON public.consultations FOR UPDATE
  USING (public.is_doctor() OR public.is_admin());

-- VEHICLES
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vehicles_select" ON public.vehicles;
CREATE POLICY "vehicles_select" ON public.vehicles FOR SELECT USING (true);
DROP POLICY IF EXISTS "vehicles_admin_all" ON public.vehicles;
CREATE POLICY "vehicles_admin_all" ON public.vehicles FOR ALL USING (public.is_admin());

-- DRIVERS
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "drivers_select" ON public.drivers;
CREATE POLICY "drivers_select" ON public.drivers FOR SELECT USING (true);
DROP POLICY IF EXISTS "drivers_update_own" ON public.drivers;
CREATE POLICY "drivers_update_own" ON public.drivers FOR UPDATE
  USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
DROP POLICY IF EXISTS "drivers_admin_all" ON public.drivers;
CREATE POLICY "drivers_admin_all" ON public.drivers FOR ALL USING (public.is_admin());

-- AMBULANCE RIDES
ALTER TABLE public.ambulance_rides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ambulance_rides_select" ON public.ambulance_rides;
CREATE POLICY "ambulance_rides_select" ON public.ambulance_rides FOR SELECT
  USING (
    patient_id = auth.uid() OR public.is_admin()
    OR driver_id IN (SELECT id FROM public.drivers WHERE profile_id = auth.uid())
  );
DROP POLICY IF EXISTS "ambulance_rides_insert" ON public.ambulance_rides;
CREATE POLICY "ambulance_rides_insert" ON public.ambulance_rides FOR INSERT
  WITH CHECK (patient_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "ambulance_rides_update" ON public.ambulance_rides;
CREATE POLICY "ambulance_rides_update" ON public.ambulance_rides FOR UPDATE
  USING (public.is_admin() OR patient_id = auth.uid()
    OR driver_id IN (SELECT id FROM public.drivers WHERE profile_id = auth.uid()));

-- AMBULANCE REQUESTS
ALTER TABLE public.ambulance_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ambulance_requests_select" ON public.ambulance_requests;
CREATE POLICY "ambulance_requests_select" ON public.ambulance_requests FOR SELECT USING (true);
DROP POLICY IF EXISTS "ambulance_requests_insert" ON public.ambulance_requests;
CREATE POLICY "ambulance_requests_insert" ON public.ambulance_requests FOR INSERT
  WITH CHECK (patient_id = auth.uid() OR patient_id IS NULL);
DROP POLICY IF EXISTS "ambulance_requests_update" ON public.ambulance_requests;
CREATE POLICY "ambulance_requests_update" ON public.ambulance_requests FOR UPDATE
  USING (
    public.is_admin() OR patient_id = auth.uid()
    OR driver_id IN (SELECT id FROM public.drivers WHERE profile_id = auth.uid())
  );

-- AVAILABILITY
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "availability_select" ON public.availability;
CREATE POLICY "availability_select" ON public.availability FOR SELECT USING (true);
DROP POLICY IF EXISTS "availability_manage" ON public.availability;
CREATE POLICY "availability_manage" ON public.availability FOR ALL
  USING (doctor_id IN (SELECT id FROM public.doctor WHERE user_id = auth.uid()) OR public.is_admin());

-- HOSPITALS
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hospitals_select" ON public.hospitals;
CREATE POLICY "hospitals_select" ON public.hospitals FOR SELECT
  USING (is_active = true OR public.is_admin());
DROP POLICY IF EXISTS "hospitals_admin_all" ON public.hospitals;
CREATE POLICY "hospitals_admin_all" ON public.hospitals FOR ALL USING (public.is_admin());

-- NOTIFICATIONS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin());

-- FEES
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fees_select" ON public.fees;
CREATE POLICY "fees_select" ON public.fees FOR SELECT
  USING (status = 'published' OR public.is_admin());
DROP POLICY IF EXISTS "fees_admin_all" ON public.fees;
CREATE POLICY "fees_admin_all" ON public.fees FOR ALL USING (public.is_admin());

-- REPEAT PRESCRIPTIONS
ALTER TABLE public.repeat_prescriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "repeat_prescriptions_select" ON public.repeat_prescriptions;
CREATE POLICY "repeat_prescriptions_select" ON public.repeat_prescriptions FOR SELECT
  USING (patient_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "repeat_prescriptions_insert" ON public.repeat_prescriptions;
CREATE POLICY "repeat_prescriptions_insert" ON public.repeat_prescriptions FOR INSERT
  WITH CHECK (patient_id = auth.uid());
DROP POLICY IF EXISTS "repeat_prescriptions_update" ON public.repeat_prescriptions;
CREATE POLICY "repeat_prescriptions_update" ON public.repeat_prescriptions FOR UPDATE
  USING (public.is_admin());

-- ILLNESS CERTIFICATES
ALTER TABLE public.illness_certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "illness_certificates_select" ON public.illness_certificates;
CREATE POLICY "illness_certificates_select" ON public.illness_certificates FOR SELECT
  USING (patient_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "illness_certificates_insert" ON public.illness_certificates;
CREATE POLICY "illness_certificates_insert" ON public.illness_certificates FOR INSERT
  WITH CHECK (patient_id = auth.uid());
DROP POLICY IF EXISTS "illness_certificates_update" ON public.illness_certificates;
CREATE POLICY "illness_certificates_update" ON public.illness_certificates FOR UPDATE
  USING (public.is_admin());

-- CONTACT MESSAGES
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contact_messages_select" ON public.contact_messages;
CREATE POLICY "contact_messages_select" ON public.contact_messages FOR SELECT
  USING (email = (SELECT email FROM public.profiles WHERE id = auth.uid()) OR public.is_admin());
DROP POLICY IF EXISTS "contact_messages_insert" ON public.contact_messages;
CREATE POLICY "contact_messages_insert" ON public.contact_messages FOR INSERT
  WITH CHECK (true);
DROP POLICY IF EXISTS "contact_messages_update" ON public.contact_messages;
CREATE POLICY "contact_messages_update" ON public.contact_messages FOR UPDATE
  USING (email = (SELECT email FROM public.profiles WHERE id = auth.uid()) OR public.is_admin());

-- Force PostgREST schema reload
NOTIFY pgrst, 'reload schema';
