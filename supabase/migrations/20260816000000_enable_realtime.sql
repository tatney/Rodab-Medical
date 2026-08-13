-- ============================================================
-- Enable Supabase Realtime for live ambulance tracking.
--
-- Publishes ambulance_requests + drivers row changes so all
-- viewers (patient TrackPage, SOSPage fleet map, dispatch
-- LiveMonitor) receive push updates instead of polling only.
--
-- RLS already permits public SELECT on both tables, and Realtime
-- enforces RLS, so events will be delivered to viewers.
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.ambulance_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;

NOTIFY pgrst, 'reload schema';
