-- Response ratings: one optional star rating + comment per completed
-- ambulance request, submitted by the patient (or the guest who booked it).

CREATE TABLE IF NOT EXISTS public.ambulance_request_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.ambulance_requests(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (request_id)
);

ALTER TABLE public.ambulance_request_ratings ENABLE ROW LEVEL SECURITY;

-- Anyone can read ratings (used by the client to detect "already rated" and
-- available for admin analytics later).
DROP POLICY IF EXISTS ambulance_request_ratings_select ON public.ambulance_request_ratings;
CREATE POLICY ambulance_request_ratings_select ON public.ambulance_request_ratings
  FOR SELECT USING (true);

-- A rating can only be added to a COMPLETED request by the patient who owns it
-- (or by a guest on guest requests, where patient_id is NULL). Anon role sees
-- auth.uid() = NULL, so `patient_id IS NULL` matches guest requests.
DROP POLICY IF EXISTS ambulance_request_ratings_insert ON public.ambulance_request_ratings;
CREATE POLICY ambulance_request_ratings_insert ON public.ambulance_request_ratings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ambulance_requests r
      WHERE r.id = request_id
        AND r.status = 'completed'
        AND (r.patient_id = auth.uid() OR r.patient_id IS NULL)
    )
  );
