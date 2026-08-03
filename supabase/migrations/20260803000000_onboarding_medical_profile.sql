-- ============================================================
-- Digital Medical Profile + Online Onboarding
-- Safe to re-run: ADD COLUMN IF NOT EXISTS / idempotent UPDATEs
-- ============================================================

-- Profiles: onboarding state + structured digital medical record.
-- medical_profile is a JSONB object keyed by form-template field keys so
-- admin-added fields persist automatically (no per-field migrations).
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS medical_profile JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Form submissions: where the data came from (onboarding vs manual).
ALTER TABLE public.form_submissions ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';

-- Existing users are not forced through onboarding:
--   - users who already submitted a form are marked complete
--   - everyone else is marked skipped (they can start later from the dashboard)
UPDATE public.profiles p
SET onboarding_status = 'complete',
    onboarding_completed_at = COALESCE(p.onboarding_completed_at, fs.first_submitted)
FROM (
  SELECT user_id, MIN(created_at) AS first_submitted
  FROM public.form_submissions
  WHERE user_id IS NOT NULL
  GROUP BY user_id
) fs
WHERE fs.user_id = p.id;

UPDATE public.profiles
SET onboarding_status = 'skipped'
WHERE onboarding_status = 'pending'
  AND id NOT IN (SELECT user_id FROM public.form_submissions WHERE user_id IS NOT NULL);

NOTIFY pgrst, 'reload schema';
