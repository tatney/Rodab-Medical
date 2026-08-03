// Shared helpers for rendering admin-defined form templates.

// Map of form field key -> profiles column. Typed columns are the canonical
// source for core demographics; everything else lives in medical_profile JSONB.
export const CORE_ALIASES = {
  full_name: 'full_name',
  name: 'full_name',
  patient_name: 'full_name',
  email: 'email',
  phone: 'phone',
  contact_phone: 'phone',
  date_of_birth: 'date_of_birth',
  dob: 'date_of_birth',
  gender: 'gender',
  address: 'address',
  home_address: 'address',
}

// Build initial values for a template, pre-filled from the user's profile:
// typed profile columns first, then medical_profile JSONB keyed by field key.
export function buildInitialValues(template, user = {}) {
  const map = {}
  const mp = user.medical_profile || {}
  const fields = Array.isArray(template?.fields) ? template.fields : []
  for (const f of fields) {
    const key = f.key
    const fromColumn = CORE_ALIASES[key] ? user[CORE_ALIASES[key]] : undefined
    if (fromColumn) {
      map[key] = fromColumn
    } else if (mp[key] !== undefined && mp[key] !== null && mp[key] !== '') {
      map[key] = mp[key]
    } else if (f.type === 'checkbox') {
      map[key] = false
    } else {
      map[key] = ''
    }
  }
  return map
}

// Validate required fields; returns { key: message }
export function validateFields(fields = [], values = {}) {
  const errs = {}
  for (const f of fields) {
    const v = values[f.key]
    if (f.required && (v === undefined || v === null || v === '' || v === false)) {
      errs[f.key] = `${f.label || f.key} is required`
    }
  }
  return errs
}

export function fieldInputType(field) {
  switch (field?.type) {
    case 'number': return 'number'
    case 'email': return 'email'
    case 'tel': return 'tel'
    case 'date': return 'date'
    default: return 'text'
  }
}

// Flatten a set of filled templates into a medical_profile object.
// Consent checkboxes are excluded (they are per-submission, not profile data).
export function flattenMedicalProfile(entries = []) {
  const profile = {}
  for (const entry of entries) {
    for (const f of Array.isArray(entry.tpl?.fields) ? entry.tpl.fields : []) {
      if (f.type === 'checkbox') continue
      const v = entry.values[f.key]
      if (v !== undefined && v !== null && v !== '') profile[f.key] = v
    }
  }
  return profile
}
