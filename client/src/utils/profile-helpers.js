const REQUIRED_FIELDS = [
  { key: 'full_name', label: 'Full name' },
  { key: 'phone', label: 'Contact phone' },
]

export function isProfileComplete(user) {
  if (!user) return false
  return missingProfileFields(user).length === 0
}

export function missingProfileFields(user) {
  const missing = []
  if (!user) return REQUIRED_FIELDS.map((f) => f.label)
  for (const field of REQUIRED_FIELDS) {
    const val = user[field.key]
    if (!val || !String(val).trim()) missing.push(field.label)
  }
  if (user.role === 'user' && user.onboarding_status !== 'complete') {
    missing.push('Medical profile (onboarding)')
  }
  return missing
}

export function profileReadiness(user) {
  const missing = missingProfileFields(user)
  return {
    complete: missing.length === 0,
    missing,
    missingCount: missing.length,
  }
}
