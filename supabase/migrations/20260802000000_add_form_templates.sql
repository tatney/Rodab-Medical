-- ============================================================
-- Downloadable Forms: form_templates + form_submissions
-- Safe to re-run: CREATE TABLE IF NOT EXISTS / DROP POLICY IF EXISTS
-- ============================================================

-- ============================================================
-- FORM TEMPLATES (admin-configurable downloadable forms)
-- fields: JSONB array of field definitions:
--   { key, label, type, placeholder, required, options[], full }
--   type: text | email | tel | number | date | textarea | select | radio | checkbox | signature
-- ============================================================
CREATE TABLE IF NOT EXISTS public.form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📋',
  category TEXT DEFAULT 'general',
  form_code TEXT,
  revision TEXT DEFAULT 'Rev. 1.0',
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  header_extra JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FORM SUBMISSIONS (saved filled copies of templates)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.form_templates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  reference_no TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS form_submissions_template_idx ON public.form_submissions (template_id);
CREATE INDEX IF NOT EXISTS form_submissions_user_idx ON public.form_submissions (user_id);

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "form_templates_select_active" ON public.form_templates;
CREATE POLICY "form_templates_select_active" ON public.form_templates FOR SELECT
  USING (is_active = true OR public.is_admin());
DROP POLICY IF EXISTS "form_templates_admin_all" ON public.form_templates;
CREATE POLICY "form_templates_admin_all" ON public.form_templates FOR ALL
  USING (public.is_admin());

ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "form_submissions_select_own" ON public.form_submissions;
CREATE POLICY "form_submissions_select_own" ON public.form_submissions FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "form_submissions_insert_own" ON public.form_submissions;
CREATE POLICY "form_submissions_insert_own" ON public.form_submissions FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "form_submissions_admin_all" ON public.form_submissions;
CREATE POLICY "form_submissions_admin_all" ON public.form_submissions FOR ALL
  USING (public.is_admin());

-- ============================================================
-- SEED: international-standard downloadable forms (only when empty)
-- ============================================================
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM public.form_templates) > 0 THEN
    RETURN;
  END IF;

  INSERT INTO public.form_templates (title, description, icon, category, form_code, revision, fields) VALUES
  -- 1. Patient Registration
  ('Patient Registration Form', 'Capture essential patient demographics, contact details and insurance information for registration.', '📝', 'registration', 'FM-001', 'Rev. 1.0', '[
    {"key":"full_name","label":"Full Name","type":"text","placeholder":"As shown on ID / passport","required":true},
    {"key":"date_of_birth","label":"Date of Birth","type":"date","required":true},
    {"key":"gender","label":"Gender","type":"select","options":["Male","Female","Other","Prefer not to say"],"required":true},
    {"key":"nationality","label":"Nationality","type":"text","required":false},
    {"key":"id_number","label":"National ID / Passport No.","type":"text","placeholder":"Government-issued ID number","required":false},
    {"key":"email","label":"Email","type":"email","required":true},
    {"key":"phone","label":"Phone","type":"tel","placeholder":"+961 XX XXX XXX","required":true},
    {"key":"home_address","label":"Home Address","type":"textarea","placeholder":"Street, city, postal code","required":false,"full":true},
    {"key":"emergency_contact_name","label":"Emergency Contact Name","type":"text","required":false},
    {"key":"emergency_contact_relation","label":"Relationship","type":"text","required":false},
    {"key":"emergency_contact_phone","label":"Emergency Contact Phone","type":"tel","required":false},
    {"key":"insurance_provider","label":"Insurance Provider","type":"text","required":false},
    {"key":"insurance_member_id","label":"Insurance Member / Policy No.","type":"text","required":false},
    {"key":"blood_type","label":"Blood Type","type":"select","options":["A+","A-","B+","B-","AB+","AB-","O+","O-","Unknown"],"required":false},
    {"key":"preferred_language","label":"Preferred Language","type":"select","options":["English","Arabic","French","Other"],"required":false},
    {"key":"consent","label":"I consent to the processing of my personal data for registration and treatment purposes.","type":"checkbox","required":true}
  ]'),

  -- 2. Medical History
  ('Medical History & Health Questionnaire', 'Comprehensive health questionnaire covering allergies, medications, conditions and lifestyle factors.', '🩺', 'medical', 'FM-002', 'Rev. 1.0', '[
    {"key":"full_name","label":"Full Name","type":"text","required":true},
    {"key":"date_of_birth","label":"Date of Birth","type":"date","required":true},
    {"key":"height","label":"Height (cm)","type":"number","placeholder":"e.g. 170","required":false},
    {"key":"weight","label":"Weight (kg)","type":"number","placeholder":"e.g. 70","required":false},
    {"key":"allergies","label":"Allergies (medications, foods, latex, etc.)","type":"textarea","placeholder":"List all known allergies","required":false,"full":true},
    {"key":"current_medications","label":"Current Medications","type":"textarea","placeholder":"Name, dosage and frequency","required":false,"full":true},
    {"key":"chronic_conditions","label":"Chronic Conditions","type":"textarea","placeholder":"e.g. diabetes, hypertension, asthma","required":false,"full":true},
    {"key":"past_surgeries","label":"Past Surgeries & Hospitalizations","type":"textarea","required":false,"full":true},
    {"key":"family_history","label":"Family Medical History","type":"textarea","required":false,"full":true},
    {"key":"smoking_status","label":"Smoking","type":"select","options":["Never","Former","Current"],"required":false},
    {"key":"alcohol_consumption","label":"Alcohol Consumption","type":"select","options":["Never","Occasionally","Regularly"],"required":false},
    {"key":"pregnancy_status","label":"Pregnancy / Breastfeeding Status","type":"select","options":["Not applicable","Pregnant","Breastfeeding"],"required":false},
    {"key":"immunization_up_to_date","label":"Immunizations Up to Date","type":"select","options":["Yes","No","Unsure"],"required":false},
    {"key":"consent","label":"I confirm that the above information is true and accurate.","type":"checkbox","required":true}
  ]'),

  -- 3. Informed Consent
  ('Informed Consent for Treatment', 'Standard informed consent for medical treatment, anesthesia and emergency procedures.', '✍️', 'consent', 'FM-003', 'Rev. 1.0', '[
    {"key":"full_name","label":"Full Name","type":"text","required":true},
    {"key":"date_of_birth","label":"Date of Birth","type":"date","required":true},
    {"key":"treatment_description","label":"Treatment / Procedure","type":"textarea","placeholder":"Describe the proposed treatment or procedure","required":true,"full":true},
    {"key":"risks_benefits","label":"Risks and Benefits Explained","type":"textarea","required":false,"full":true},
    {"key":"alternatives","label":"Alternative Treatments Discussed","type":"textarea","required":false,"full":true},
    {"key":"consent_treatment","label":"I consent to the proposed treatment/procedure.","type":"checkbox","required":true},
    {"key":"consent_anesthesia","label":"I consent to anesthesia as required.","type":"checkbox","required":false},
    {"key":"consent_emergency","label":"I consent to emergency treatment if complications arise.","type":"checkbox","required":false},
    {"key":"patient_signature","label":"Patient / Guardian Signature","type":"signature","placeholder":"Type full legal name to sign","required":true,"full":true},
    {"key":"witness_name","label":"Witness Name","type":"text","required":false},
    {"key":"signature_date","label":"Date of Consent","type":"date","required":true}
  ]'),

  -- 4. Release of Medical Records
  ('Consent to Release Medical Records', 'Authorize the release of medical records to a specified person or institution.', '📁', 'records', 'FM-004', 'Rev. 1.0', '[
    {"key":"full_name","label":"Full Name","type":"text","required":true},
    {"key":"date_of_birth","label":"Date of Birth","type":"date","required":true},
    {"key":"id_number","label":"National ID / Passport No.","type":"text","required":false},
    {"key":"phone","label":"Phone","type":"tel","required":false},
    {"key":"email","label":"Email","type":"email","required":false},
    {"key":"records_requested","label":"Records to be Released","type":"textarea","placeholder":"e.g. lab results, imaging, discharge summary, operative notes","required":true,"full":true},
    {"key":"release_to_name","label":"Release Records To (Name)","type":"text","required":true},
    {"key":"release_to_entity","label":"Institution / Company","type":"text","required":false},
    {"key":"release_to_address","label":"Institution Address","type":"textarea","required":false,"full":true},
    {"key":"purpose","label":"Purpose of Request","type":"select","options":["Transfer of care","Legal proceedings","Insurance claim","Personal records","Employment","Other"],"required":true},
    {"key":"release_start_date","label":"Records From (Date)","type":"date","required":false},
    {"key":"release_end_date","label":"Records To (Date)","type":"date","required":false},
    {"key":"patient_signature","label":"Patient Signature","type":"signature","placeholder":"Type full legal name to sign","required":true,"full":true},
    {"key":"signature_date","label":"Date","type":"date","required":true}
  ]'),

  -- 5. Referral Request
  ('Referral Request Form', 'Specialist referral request completed by a referring physician.', '📋', 'referral', 'FM-005', 'Rev. 1.0', '[
    {"key":"patient_name","label":"Patient Name","type":"text","required":true},
    {"key":"date_of_birth","label":"Date of Birth","type":"date","required":true},
    {"key":"phone","label":"Patient Phone","type":"tel","required":false},
    {"key":"email","label":"Patient Email","type":"email","required":false},
    {"key":"referring_doctor","label":"Referring Physician Name","type":"text","required":true},
    {"key":"referring_license","label":"Physician License No.","type":"text","required":false},
    {"key":"referring_hospital","label":"Referring Facility","type":"text","required":false},
    {"key":"referred_specialist","label":"Referred To (Specialty / Physician)","type":"text","required":true},
    {"key":"reason_for_referral","label":"Reason for Referral","type":"textarea","required":true,"full":true},
    {"key":"diagnosis","label":"Working Diagnosis","type":"textarea","required":false,"full":true},
    {"key":"relevant_history","label":"Relevant Medical History","type":"textarea","required":false,"full":true},
    {"key":"current_medications","label":"Current Medications","type":"textarea","required":false,"full":true},
    {"key":"requested_documents","label":"Documents Enclosed / Requested","type":"textarea","required":false,"full":true},
    {"key":"referral_date","label":"Date","type":"date","required":true},
    {"key":"physician_signature","label":"Physician Signature","type":"signature","placeholder":"Type full legal name to sign","required":true,"full":true}
  ]'),

  -- 6. Patient Feedback / Complaint
  ('Patient Feedback & Complaint Form', 'Share feedback or file a complaint about your care experience.', '⭐', 'feedback', 'FM-006', 'Rev. 1.0', '[
    {"key":"full_name","label":"Full Name","type":"text","required":false},
    {"key":"phone","label":"Phone","type":"tel","required":false},
    {"key":"email","label":"Email","type":"email","required":false},
    {"key":"visit_date","label":"Date of Visit","type":"date","required":false},
    {"key":"department","label":"Department / Service","type":"text","placeholder":"e.g. Emergency, Cardiology","required":false},
    {"key":"subject","label":"Subject","type":"text","required":true,"full":true},
    {"key":"details","label":"Details","type":"textarea","placeholder":"Describe your experience, feedback or complaint","required":true,"full":true},
    {"key":"suggestions","label":"Suggestions for Improvement","type":"textarea","required":false,"full":true},
    {"key":"contact_me","label":"May we contact you about this submission?","type":"select","options":["Yes","No"],"required":false},
    {"key":"consent","label":"I consent to this submission being reviewed and processed by hospital staff.","type":"checkbox","required":true}
  ]');
END
$$;
