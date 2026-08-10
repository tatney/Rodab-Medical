-- Appointments booking fixes:
--  1) Let a patient cancel their own appointment (soft-cancel -> status 'cancelled')
--     without granting them UPDATE powers over anything else.
--  2) Prevent double-booking a doctor/date/time slot when that slot is covered by
--     an availability window. Legacy bookings outside any window stay allowed.

-- 1) Patient may cancel their own appointment
DROP POLICY IF EXISTS "appointments_cancel_own" ON public.appointments;
CREATE POLICY "appointments_cancel_own" ON public.appointments FOR UPDATE
  USING (patient_id = auth.uid())
  WITH CHECK (patient_id = auth.uid() AND status = 'cancelled');

-- 2) Block duplicate bookings inside an availability window
CREATE OR REPLACE FUNCTION public.prevent_appointment_double_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
DECLARE
  v_covered BOOLEAN;
  v_dow INTEGER;
  av RECORD;
BEGIN
  v_dow := EXTRACT(DOW FROM NEW.appointment_date)::int;

  v_covered := FALSE;
  FOR av IN
    SELECT av2.id, av2.date, av2.day_of_week, av2.start_time, av2.end_time
    FROM public.availability av2
    WHERE av2.doctor_id = NEW.doctor_id
      AND NEW.appointment_time >= av2.start_time
      AND NEW.appointment_time < av2.end_time
  LOOP
    IF (av.date IS NOT NULL AND av.date = NEW.appointment_date)
       OR (av.date IS NULL AND av.day_of_week IS NOT NULL AND av.day_of_week = v_dow) THEN
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

DROP TRIGGER IF EXISTS trg_prevent_appointment_double_booking ON public.appointments;
CREATE TRIGGER trg_prevent_appointment_double_booking
  BEFORE INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_appointment_double_booking();
