-- Add missing columns to existing tables

-- Doctor table: add missing columns
ALTER TABLE IF EXISTS public.doctor ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.doctor ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE IF EXISTS public.doctor ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE IF EXISTS public.doctor ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC DEFAULT 0;

-- Departments: add missing columns
ALTER TABLE IF EXISTS public.departments ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE IF EXISTS public.departments ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS public.departments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Consultations: add missing columns
ALTER TABLE IF EXISTS public.consultations ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE IF EXISTS public.consultations ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE IF EXISTS public.consultations ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE IF EXISTS public.consultations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';
ALTER TABLE IF EXISTS public.consultations ADD COLUMN IF NOT EXISTS response TEXT;
ALTER TABLE IF EXISTS public.consultations ADD COLUMN IF NOT EXISTS responder_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.consultations ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

-- Vehicles: add missing columns
ALTER TABLE IF EXISTS public.vehicles ADD COLUMN IF NOT EXISTS vehicle_type TEXT DEFAULT 'ambulance';
ALTER TABLE IF EXISTS public.vehicles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available';
ALTER TABLE IF EXISTS public.vehicles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Drivers: add missing columns
ALTER TABLE IF EXISTS public.drivers ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.drivers ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE IF EXISTS public.drivers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE IF EXISTS public.drivers ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE IF EXISTS public.drivers ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.drivers ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS public.drivers ADD COLUMN IF NOT EXISTS current_latitude DOUBLE PRECISION;
ALTER TABLE IF EXISTS public.drivers ADD COLUMN IF NOT EXISTS current_longitude DOUBLE PRECISION;
ALTER TABLE IF EXISTS public.drivers ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMPTZ;

-- Hospitals: rename lat/lng to latitude/longitude
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hospitals' AND column_name='lat') THEN
    ALTER TABLE public.hospitals RENAME COLUMN lat TO latitude;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hospitals' AND column_name='lng') THEN
    ALTER TABLE public.hospitals RENAME COLUMN lng TO longitude;
  END IF;
END $$;

-- Notifications: add read_at
ALTER TABLE IF EXISTS public.notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Fees: add missing columns
ALTER TABLE IF EXISTS public.fees ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE IF EXISTS public.fees ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE IF EXISTS public.fees ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE IF EXISTS public.fees ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.fees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Repeat prescriptions: add missing columns
ALTER TABLE IF EXISTS public.repeat_prescriptions ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.repeat_prescriptions ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.repeat_prescriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Illness certificates: add missing columns
ALTER TABLE IF EXISTS public.illness_certificates ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.illness_certificates ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.illness_certificates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Contact messages: add missing columns
ALTER TABLE IF EXISTS public.contact_messages ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'unread';
ALTER TABLE IF EXISTS public.contact_messages ADD COLUMN IF NOT EXISTS admin_reply TEXT;
ALTER TABLE IF EXISTS public.contact_messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Availability: add missing columns
ALTER TABLE IF EXISTS public.availability ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE IF EXISTS public.availability ADD COLUMN IF NOT EXISTS max_appointments INTEGER DEFAULT 10;

-- Profiles: add missing columns if needed
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
