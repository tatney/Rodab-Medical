import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { updateProfile } from '../api'

const colors = {
  primary: '#0b2a57',
  primaryHover: '#091e3d',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray500: '#6b7280',
  gray700: '#374151',
  gray900: '#111827',
  white: '#ffffff',
  green: '#16a34a',
  red: '#dc2626',
}

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const roleLabels = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  doctor: 'Doctor',
  driver: 'Driver',
  user: 'Patient',
}

const roleColors = {
  super_admin: { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
  admin: { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
  doctor: { bg: '#ede9fe', text: '#5b21b6', border: '#8b5cf6' },
  driver: { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
  user: { bg: '#d1fae5', text: '#065f46', border: '#10b981' },
}

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: '',
    age: '',
    gender: '',
    bloodGroup: '',
    chronicDisease: '',
    address: '',
    nextOfKinName: '',
    nextOfKinPhone: '',
    nextOfKinRelation: '',
  })

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.full_name || user.name || user.user_metadata?.full_name || '',
        email: user.email || '',
        phone: user.phone || user.user_metadata?.phone || '',
        role: user.role || user.user_metadata?.role || 'user',
        age: user.age || user.user_metadata?.age || '',
        gender: user.gender || user.user_metadata?.gender || '',
        bloodGroup: user.blood_group || user.user_metadata?.blood_group || '',
        chronicDisease: user.chronic_disease || user.user_metadata?.chronic_disease || '',
        address: user.address || user.user_metadata?.address || '',
        nextOfKinName: user.next_of_kin_name || user.user_metadata?.next_of_kin_name || '',
        nextOfKinPhone: user.next_of_kin_phone || user.user_metadata?.next_of_kin_phone || '',
        nextOfKinRelation: user.next_of_kin_relation || user.user_metadata?.next_of_kin_relation || '',
      })
    }
  }, [user])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSave = async () => {
    setError('')
    setSaving(true)
    try {
      await updateProfile({
        full_name: form.fullName,
        phone: form.phone,
        age: form.age ? Number(form.age) : undefined,
        gender: form.gender || undefined,
        blood_group: form.bloodGroup || undefined,
        chronic_disease: form.chronicDisease || undefined,
        address: form.address || undefined,
        next_of_kin_name: form.nextOfKinName || undefined,
        next_of_kin_phone: form.nextOfKinPhone || undefined,
        next_of_kin_relation: form.nextOfKinRelation || undefined,
      })
      await refreshUser()
      setEditing(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initial = (form.fullName || form.email || '?')[0].toUpperCase()
  const rc = roleColors[user?.role] || roleColors.user

  const fieldStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    padding: '14px 0',
    borderBottom: `1px solid ${colors.gray100}`,
  }
  const labelStyle = { fontSize: 14, fontWeight: 600, color: colors.gray500, minWidth: 160 }
  const inputStyle = {
    flex: 1,
    maxWidth: 360,
    padding: '10px 14px',
    borderRadius: 8,
    border: `1px solid ${colors.gray300}`,
    fontSize: 14,
    textAlign: 'right',
  }
  const valueStyle = { fontSize: 15, color: colors.gray900, fontWeight: 500, textAlign: 'right', flex: 1, maxWidth: 360 }

  return (
    <div style={{ padding: '48px 24px', maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 20, marginBottom: 32 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            backgroundColor: colors.primary,
            color: colors.white,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {initial}
        </div>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: colors.gray900, margin: 0 }}>
            {form.fullName || 'Settings'}
          </h1>
          <p style={{ fontSize: 13, color: colors.gray500, margin: '4px 0 6px' }}>
            {form.email}
          </p>
          <span
            style={{
              display: 'inline-block',
              padding: '3px 10px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'capitalize',
              backgroundColor: rc.bg,
              color: rc.text,
              border: `1px solid ${rc.border}`,
            }}
          >
            {roleLabels[user?.role] || user?.role}
          </span>
        </div>
      </div>

      {/* Success/Error */}
      {success && (
        <div role="status" aria-live="polite" style={{ padding: '12px 16px', borderRadius: 8, backgroundColor: '#dcfce7', border: '1px solid #86efac', color: colors.green, fontSize: 14, marginBottom: 20 }}>
          Profile updated successfully!
        </div>
      )}
      {error && (
        <div role="alert" style={{ padding: '12px 16px', borderRadius: 8, backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: colors.red, fontSize: 14, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Profile Card */}
      <div style={{ backgroundColor: colors.white, borderRadius: 12, border: `1px solid ${colors.gray200}`, padding: 32, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.gray900 }}>Personal Information</h2>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              style={{ padding: '12px 20px', backgroundColor: colors.primary, color: colors.white, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              Edit Profile
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setEditing(false); setError('') }}
                style={{ padding: '12px 16px', backgroundColor: colors.gray100, color: colors.gray700, border: `1px solid ${colors.gray300}`, borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ padding: '12px 20px', backgroundColor: saving ? colors.gray300 : colors.green, color: colors.white, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        <div style={fieldStyle}>
          <label htmlFor="settings-fullName" style={labelStyle}>Full Name</label>
          {editing ? (
            <input id="settings-fullName" name="fullName" value={form.fullName} onChange={handleChange} style={inputStyle} />
          ) : (
            <span style={valueStyle}>{form.fullName || '-'}</span>
          )}
        </div>
        <div style={fieldStyle}>
          <label htmlFor="settings-email" style={labelStyle}>Email</label>
          <span style={{ ...valueStyle, color: colors.gray500 }}>{form.email || '-'} <span style={{ fontSize: 12, color: colors.gray300 }}>(read-only)</span></span>
        </div>
        <div style={fieldStyle}>
          <label htmlFor="settings-phone" style={labelStyle}>Phone</label>
          {editing ? (
            <input id="settings-phone" name="phone" type="tel" value={form.phone} onChange={handleChange} style={inputStyle} />
          ) : (
            <span style={valueStyle}>{form.phone || '-'}</span>
          )}
        </div>
        <div style={fieldStyle}>
          <label htmlFor="settings-role" style={labelStyle}>Role</label>
          <span style={valueStyle}>{form.role} <span style={{ fontSize: 12, color: colors.gray300 }}>(read-only)</span></span>
        </div>
        <div style={fieldStyle}>
          <label htmlFor="settings-age" style={labelStyle}>Age</label>
          {editing ? (
            <input id="settings-age" name="age" type="number" min="0" max="150" value={form.age} onChange={handleChange} style={inputStyle} />
          ) : (
            <span style={valueStyle}>{form.age || '-'}</span>
          )}
        </div>
        <div style={fieldStyle}>
          <label htmlFor="settings-gender" style={labelStyle}>Gender</label>
          {editing ? (
            <select id="settings-gender" name="gender" value={form.gender} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          ) : (
            <span style={valueStyle}>{form.gender || '-'}</span>
          )}
        </div>
        <div style={fieldStyle}>
          <label htmlFor="settings-bloodGroup" style={labelStyle}>Blood Group</label>
          {editing ? (
            <select id="settings-bloodGroup" name="bloodGroup" value={form.bloodGroup} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Select</option>
              {bloodGroups.map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          ) : (
            <span style={valueStyle}>{form.bloodGroup || '-'}</span>
          )}
        </div>
        <div style={fieldStyle}>
          <label htmlFor="settings-chronicDisease" style={labelStyle}>Chronic Disease</label>
          {editing ? (
            <input id="settings-chronicDisease" name="chronicDisease" value={form.chronicDisease} onChange={handleChange} placeholder="e.g. Diabetes" style={inputStyle} />
          ) : (
            <span style={valueStyle}>{form.chronicDisease || '-'}</span>
          )}
        </div>
        <div style={fieldStyle}>
          <label htmlFor="settings-address" style={labelStyle}>Address</label>
          {editing ? (
            <input id="settings-address" name="address" value={form.address} onChange={handleChange} style={inputStyle} />
          ) : (
            <span style={valueStyle}>{form.address || '-'}</span>
          )}
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: `2px solid ${colors.gray100}` }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.gray700, marginBottom: 12 }}>Next of Kin</h3>
        </div>
        <div style={fieldStyle}>
          <label htmlFor="settings-nextOfKinName" style={labelStyle}>Name</label>
          {editing ? (
            <input id="settings-nextOfKinName" name="nextOfKinName" value={form.nextOfKinName} onChange={handleChange} style={inputStyle} />
          ) : (
            <span style={valueStyle}>{form.nextOfKinName || '-'}</span>
          )}
        </div>
        <div style={fieldStyle}>
          <label htmlFor="settings-nextOfKinPhone" style={labelStyle}>Phone</label>
          {editing ? (
            <input id="settings-nextOfKinPhone" name="nextOfKinPhone" type="tel" value={form.nextOfKinPhone} onChange={handleChange} style={inputStyle} />
          ) : (
            <span style={valueStyle}>{form.nextOfKinPhone || '-'}</span>
          )}
        </div>
        <div style={{ ...fieldStyle, borderBottom: 'none' }}>
          <label htmlFor="settings-nextOfKinRelation" style={labelStyle}>Relation</label>
          {editing ? (
            <input id="settings-nextOfKinRelation" name="nextOfKinRelation" value={form.nextOfKinRelation} onChange={handleChange} placeholder="e.g. Spouse, Parent" style={inputStyle} />
          ) : (
            <span style={valueStyle}>{form.nextOfKinRelation || '-'}</span>
          )}
        </div>
      </div>

      {/* Account Actions */}
      <div style={{ backgroundColor: colors.white, borderRadius: 12, border: `1px solid ${colors.gray200}`, padding: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.gray900, marginBottom: 16 }}>Account</h2>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 20px',
            backgroundColor: '#fef2f2',
            color: colors.red,
            border: '1px solid #fecaca',
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  )
}
