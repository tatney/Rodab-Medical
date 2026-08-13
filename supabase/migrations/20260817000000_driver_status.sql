-- ============================================================
-- Driver availability status (online / busy / offline).
--
-- A driver is marked 'busy' + is_available=false whenever they
-- have at least one active ride (dispatched / in_transit /
-- arrived), and is freed back to 'online' + is_available=true
-- when the last active ride completes or is cancelled — unless
-- the driver manually set 'offline', which is preserved.
--
-- Replaces the legacy status set (available / busy / off_duty)
-- with the new one (online / busy / offline): legacy values are
-- normalised, the CHECK constraint and column default are
-- swapped, then existing drivers are backfilled.
--
-- Safe to re-run: CREATE OR REPLACE / DROP IF EXISTS / idempotent
-- backfill.
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_driver_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_driver_id uuid;
  v_active    int;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_driver_id := OLD.driver_id;
  ELSE
    v_driver_id := NEW.driver_id;
  END IF;

  IF v_driver_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT count(*) INTO v_active
  FROM public.ambulance_requests
  WHERE driver_id = v_driver_id
    AND status IN ('dispatched', 'in_transit', 'arrived');

  IF v_active > 0 THEN
    UPDATE public.drivers
    SET status = 'busy', is_available = false
    WHERE id = v_driver_id;
  ELSE
    -- Free the driver, but never flip a manual 'offline' back online.
    UPDATE public.drivers
    SET status = 'online', is_available = true
    WHERE id = v_driver_id
      AND (status IS DISTINCT FROM 'offline');
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS ambulance_requests_sync_driver_status ON public.ambulance_requests;
CREATE TRIGGER ambulance_requests_sync_driver_status
AFTER INSERT OR UPDATE OR DELETE ON public.ambulance_requests
FOR EACH ROW EXECUTE FUNCTION public.sync_driver_status();

-- Replace the legacy CHECK constraint (available / busy / off_duty) and the
-- legacy column default with the new status set.
ALTER TABLE public.drivers
  DROP CONSTRAINT IF EXISTS drivers_status_check,
  ALTER COLUMN status SET DEFAULT 'online';

-- Normalise legacy values to the new set (no constraint active yet).
UPDATE public.drivers SET status = 'offline' WHERE status = 'off_duty';
UPDATE public.drivers SET status = 'online'  WHERE status = 'available';

ALTER TABLE public.drivers
  ADD CONSTRAINT drivers_status_check
  CHECK (status IN ('online', 'busy', 'offline'));

-- Backfill existing drivers: busy if they hold an active ride.
UPDATE public.drivers d
SET status = 'busy', is_available = false
WHERE EXISTS (
  SELECT 1 FROM public.ambulance_requests r
  WHERE r.driver_id = d.id AND r.status IN ('dispatched', 'in_transit', 'arrived')
);

-- Otherwise online + available — but never flip a manual 'offline' back online.
UPDATE public.drivers d
SET status = 'online', is_available = true
WHERE COALESCE(d.status, '') <> 'offline'
  AND (d.status IS DISTINCT FROM 'online' OR d.is_available IS DISTINCT FROM true)
  AND NOT EXISTS (
    SELECT 1 FROM public.ambulance_requests r
    WHERE r.driver_id = d.id AND r.status IN ('dispatched', 'in_transit', 'arrived')
  );

NOTIFY pgrst, 'reload schema';
