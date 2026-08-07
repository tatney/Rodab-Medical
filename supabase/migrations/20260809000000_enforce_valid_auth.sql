-- ============================================================
-- Enforce valid email addresses on auth.users for ALL signup paths
-- (public signup, admin/staff creation, edge functions).
-- Safe to re-run: DROP TRIGGER IF EXISTS / CREATE OR REPLACE.
-- ============================================================

CREATE OR REPLACE FUNCTION public.enforce_valid_auth_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NULL
     OR NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$'
     OR char_length(NEW.email) > 254
  THEN
    RAISE EXCEPTION 'A valid email address is required';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_valid_auth_email_trigger ON auth.users;
CREATE TRIGGER enforce_valid_auth_email_trigger
  BEFORE INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.enforce_valid_auth_email();
