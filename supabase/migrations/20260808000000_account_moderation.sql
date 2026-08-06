-- ============================================================
-- Account moderation: flag / unflag / reward + audit trail
-- Safe to re-run: ADD COLUMN IF NOT EXISTS / DROP POLICY IF EXISTS
-- ============================================================

-- Profile-level moderation state
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS flag_reason TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS flagged_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reward_points INTEGER NOT NULL DEFAULT 0;

-- Audit trail of moderation actions (flag / unflag / reward)
CREATE TABLE IF NOT EXISTS public.account_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('flag', 'unflag', 'reward')),
  detail TEXT,
  amount INTEGER,
  performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS account_actions_user_idx ON public.account_actions (user_id);

-- RLS: moderation audit trail is admin-only
ALTER TABLE public.account_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "account_actions_select_admin" ON public.account_actions;
CREATE POLICY "account_actions_select_admin" ON public.account_actions FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "account_actions_insert_admin" ON public.account_actions;
CREATE POLICY "account_actions_insert_admin" ON public.account_actions FOR INSERT
  WITH CHECK (public.is_admin());

NOTIFY pgrst, 'reload schema';
