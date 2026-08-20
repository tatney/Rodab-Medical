-- Fix availability.day_of_week: change INTEGER -> TEXT
-- Frontends send day name strings ("Sunday", "Monday", etc.) but the column was INTEGER,
-- causing inserts to fail with a type mismatch error.

-- 1. Alter column type
ALTER TABLE public.availability
  ALTER COLUMN day_of_week TYPE TEXT USING CASE day_of_week
    WHEN 0 THEN 'Sunday'
    WHEN 1 THEN 'Monday'
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'
    ELSE NULL
  END;

-- 2. Update the double-booking trigger to compare text day names
CREATE OR REPLACE FUNCTION public.prevent_appointment_double_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
DECLARE
  v_covered BOOLEAN;
  v_day_name TEXT;
  av RECORD;
BEGIN
  v_day_name := TRIM(TO_CHAR(NEW.appointment_date, 'FMDay'));

  v_covered := FALSE;
  FOR av IN
    SELECT av2.id, av2.date, av2.day_of_week, av2.start_time, av2.end_time
    FROM public.availability av2
    WHERE av2.doctor_id = NEW.doctor_id
      AND NEW.appointment_time >= av2.start_time
      AND NEW.appointment_time < av2.end_time
  LOOP
    IF (av.date IS NOT NULL AND av.date = NEW.appointment_date)
       OR (av.date IS NULL AND av.day_of_week IS NOT NULL AND av.day_of_week = v_day_name) THEN
      v_covered := TRUE;
      EXIT;
    END IF;
  END LOOP;

  IF v_covered THEN
    IF EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.doctor_id = NEW.doctor_id
        AND a.appointment_date = NEW.appointment_date
        AND a.appointment_time = NEW.appointment_time
        AND a.status IS DISTINCT FROM 'cancelled'
    ) THEN
      RAISE EXCEPTION 'This time slot is already booked.';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
