import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getFormTemplates, createFormSubmission } from '../api'
import { extractArray } from '../utils/api-helpers'
import { downloadFormPdf } from '../utils/pdf'
import { useAuth } from '../context/AuthContext'
import colors from '../utils/colors'

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 8,
  border: `1px solid ${colors.gray300}`,
  backgroundColor: colors.white,
  color: colors.gray900,
  fontSize: 15,
  boxSizing: 'border-box',
}

const labelStyle = {
  display: 'block',
  marginBottom: 6,
  fontSize: 14,
  fontWeight: 600,
  color: colors.gray700,
}

const errorTextStyle = { fontSize: 12, color: colors.red, marginTop: 4 }
const inputErrorStyle = { borderColor: colors.red }

function buildInitialValues(template, user) {
  const map = {}
  const aliases = {
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
  for (const f of Array.isArray(template?.fields) ? template.fields : []) {
    const key = f.key
    if (user && aliases[key]) {
      const val = user[aliases[key]]
      if (val) map[key] = val
    } else if (f.type === 'checkbox') {
      map[key] = false
    } else {
      map[key] = ''
    }
  }
  return map
}

function renderField(field, value, onChange, errors) {
  const id = `field-${field.key}`
  const common = {
    id,
    name: field.key,
    value: value ?? '',
    onChange: (e) => onChange(field.key, field.type === 'checkbox' ? e.target.checked : e.target.value),
  }
  const err = errors[field.key]

  switch (field.type) {
    case 'textarea':
      return (
        <div>
          <label htmlFor={id} style={labelStyle}>{field.label}{field.required && <span style={{ color: colors.red }}> *</span>}</label>
          <textarea {...common} rows={4} placeholder={field.placeholder} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', ...(err ? inputErrorStyle : {}) }} />
          {err && <p style={errorTextStyle}>{err}</p>}
        </div>
      )
    case 'select':
      return (
        <div>
          <label htmlFor={id} style={labelStyle}>{field.label}{field.required && <span style={{ color: colors.red }}> *</span>}</label>
          <select {...common} style={{ ...inputStyle, cursor: 'pointer', ...(err ? inputErrorStyle : {}) }}>
            <option value="">Select...</option>
            {(field.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          {err && <p style={errorTextStyle}>{err}</p>}
        </div>
      )
    case 'radio':
      return (
        <div style={{ marginBottom: 12 }}>
          <span style={{ ...labelStyle, marginBottom: 8 }}>{field.label}{field.required && <span style={{ color: colors.red }}> *</span>}</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            {(field.options || []).map((opt) => (
              <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: colors.gray700, cursor: 'pointer' }}>
                <input type="radio" name={field.key} value={opt} checked={value === opt} onChange={() => onChange(field.key, opt)} style={{ width: 16, height: 16 }} />
                {opt}
              </label>
            ))}
          </div>
          {err && <p style={errorTextStyle}>{err}</p>}
        </div>
      )
    case 'checkbox':
      return (
        <div style={{ marginBottom: 4 }}>
          <label htmlFor={id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: colors.gray700, cursor: 'pointer', lineHeight: 1.5 }}>
            <input id={id} type="checkbox" checked={!!value} onChange={common.onChange} style={{ marginTop: 3, width: 18, height: 18 }} />
            <span>{field.label}{field.required && <span style={{ color: colors.red }}> *</span>}</span>
          </label>
          {err && <p style={errorTextStyle}>{err}</p>}
        </div>
      )
    case 'signature':
      return (
        <div>
          <label htmlFor={id} style={labelStyle}>{field.label}{field.required && <span style={{ color: colors.red }}> *</span>}</label>
          <input
            id={id}
            name={field.key}
            type="text"
            value={value ?? ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder || 'Type full legal name to sign'}
            style={{
              width: '100%',
              padding: '10px 4px 6px',
              border: 'none',
              borderBottom: `2px solid ${colors.gray400 || colors.gray300}`,
              backgroundColor: 'transparent',
              color: colors.gray900,
              fontSize: 16,
              fontFamily: 'cursive, "Brush Script MT", cursive',
              boxSizing: 'border-box',
              ...(err ? { borderBottomColor: colors.red } : {}),
            }}
          />
          {err && <p style={errorTextStyle}>{err}</p>}
        </div>
      )
    default:
      return (
        <div>
          <label htmlFor={id} style={labelStyle}>{field.label}{field.required && <span style={{ color: colors.red }}> *</span>}</label>
          <input
            {...common}
            type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : field.type === 'date' ? 'date' : 'text'}
            placeholder={field.placeholder}
            style={{ ...inputStyle, ...(err ? inputErrorStyle : {}) }}
          />
          {err && <p style={errorTextStyle}>{err}</p>}
        </div>
      )
  }
}

export default function FormsPage() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [values, setValues] = useState({})
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await getFormTemplates()
        setTemplates(extractArray(res.data, 'forms'))
      } catch (err) {
        console.error('Failed to load form templates:', err)
        setError(err.message || 'Failed to load forms.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const openForm = (tpl) => {
    setSelected(tpl)
    setValues(buildInitialValues(tpl, user))
    setFieldErrors({})
    setError('')
    setSaved(null)
  }

  const handleChange = (key, val) => {
    setValues((prev) => ({ ...prev, [key]: val }))
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const validate = () => {
    const errs = {}
    for (const f of selected.fields || []) {
      const v = values[f.key]
      if (f.required && (v === undefined || v === null || v === '' || v === false)) {
        errs[f.key] = `${f.label} is required`
      }
    }
    return errs
  }

  const runValidation = () => {
    const errs = validate()
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) {
      setError('Please complete the required fields highlighted below.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return false
    }
    setError('')
    return true
  }

  const handleDownload = async (e) => {
    e.preventDefault()
    if (!runValidation()) return
    try {
      setBusy(true)
      const referenceNo = downloadFormPdf(selected, values, {
        patientName: values.full_name || values.patient_name || user?.full_name,
      })
      console.log('Form PDF downloaded:', referenceNo)
    } catch (err) {
      console.error('PDF generation failed:', err)
      setError('Failed to generate the PDF. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const handleSaveAndDownload = async (e) => {
    e.preventDefault()
    if (!runValidation()) return
    setBusy(true)
    try {
      const res = await createFormSubmission({
        template_id: selected.id,
        data: values,
      })
      const referenceNo = downloadFormPdf(selected, values, {
        referenceNo: res.data?.submission?.reference_no,
        patientName: values.full_name || values.patient_name || user?.full_name,
      })
      setSaved({ title: selected.title, referenceNo })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('Failed to save submission:', err)
      setError(err.message || 'Failed to save your submission. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const resetAll = () => {
    setSelected(null)
    setValues({})
    setFieldErrors({})
    setError('')
    setSaved(null)
  }

  /* ── Success state ── */
  if (saved) {
    return (
      <div style={{ padding: '64px 24px', maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: '#dcfce7', color: colors.green, fontSize: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          &#10003;
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: colors.gray900, marginBottom: 12 }}>Form Saved & Downloaded</h2>
        <p style={{ fontSize: 16, color: colors.gray500, marginBottom: 8, lineHeight: 1.6 }}>
          Your <strong>{saved.title}</strong> submission has been saved to your history and the completed PDF has been downloaded.
        </p>
        {saved.referenceNo && (
          <p style={{ fontSize: 14, color: colors.gray500, marginBottom: 24 }}>
            Reference No: <strong style={{ color: colors.gray900 }}>{saved.referenceNo}</strong>
          </p>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={resetAll} style={{ padding: '12px 24px', backgroundColor: colors.primary, color: colors.white, border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Fill Another Form
          </button>
          <Link to="/form-history" style={{ padding: '12px 24px', backgroundColor: colors.gray100, color: colors.gray700, border: `1px solid ${colors.gray300}`, borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
            View Form History
          </Link>
        </div>
      </div>
    )
  }

  /* ── Form fill view ── */
  if (selected) {
    return (
      <div style={{ padding: '48px 24px', maxWidth: 760, margin: '0 auto' }}>
        <button onClick={resetAll} style={{ background: 'none', border: 'none', fontSize: 14, color: colors.primary, cursor: 'pointer', marginBottom: 16, fontWeight: 600 }}>
          &larr; Back to all forms
        </button>
        <div style={{ backgroundColor: colors.white, borderRadius: 12, border: `1px solid ${colors.gray200}`, padding: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 32 }} aria-hidden="true">{selected.icon}</span>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.gray900 }}>{selected.title}</h2>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: colors.gray500, marginBottom: 24 }}>
            {selected.form_code && <span>Form Code: <strong>{selected.form_code}</strong></span>}
            {selected.revision && <span>Revision: <strong>{selected.revision}</strong></span>}
            {selected.category && <span>Category: <strong>{selected.category}</strong></span>}
          </div>
          {selected.description && (
            <p style={{ fontSize: 14, color: colors.gray600, lineHeight: 1.6, marginBottom: 20 }}>{selected.description}</p>
          )}

          {error && (
            <div role="alert" style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: colors.red, fontSize: 14, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleDownload}>
            <div className="grid-form-fields" style={{ gap: 16 }}>
              {(selected.fields || []).map((field) => (
                <div key={field.key} style={field.full ? { gridColumn: '1 / -1' } : {}}>
                  {renderField(field, values[field.key], handleChange, fieldErrors)}
                </div>
              ))}
            </div>

            <div style={{ height: 20 }} />

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={busy}
                style={{
                  padding: '13px 28px',
                  backgroundColor: busy ? colors.gray300 : colors.primary,
                  color: colors.white,
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: busy ? 'not-allowed' : 'pointer',
                }}
              >
                {busy ? 'Generating PDF...' : '⬇ Download Completed PDF'}
              </button>
              <button
                type="button"
                onClick={handleSaveAndDownload}
                disabled={busy}
                style={{
                  padding: '13px 28px',
                  backgroundColor: colors.gray100,
                  color: colors.gray700,
                  border: `1px solid ${colors.gray300}`,
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: busy ? 'not-allowed' : 'pointer',
                }}
              >
                Save to History & Download
              </button>
            </div>
            <p style={{ fontSize: 12, color: colors.gray500, marginTop: 12 }}>
              The PDF is generated with your entered data — it will never be a blank form.
            </p>
          </form>
        </div>
      </div>
    )
  }

  /* ── Form list view ── */
  return (
    <div style={{ padding: '48px 24px', maxWidth: 980, margin: '0 auto' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, color: colors.gray900, marginBottom: 8 }}>Downloadable Medical Forms</h1>
      <p style={{ fontSize: 16, color: colors.gray500, marginBottom: 8 }}>
        Select a form, fill in your details (auto-filled from your profile where possible), and download a completed PDF.
      </p>

      {error && (
        <div role="alert" style={{ padding: '12px 16px', borderRadius: 8, backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: colors.red, fontSize: 14, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div role="status" aria-live="polite" style={{ textAlign: 'center', padding: 60, color: colors.gray500 }}>Loading forms...</div>
      ) : templates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: colors.gray500 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }} aria-hidden="true">&#128196;</div>
          <p>No downloadable forms are available right now.</p>
        </div>
      ) : (
        <div className="grid-forms-select">
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => openForm(tpl)}
              style={{
                backgroundColor: colors.white,
                borderRadius: 12,
                border: `1px solid ${colors.gray200}`,
                padding: 28,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s, transform 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <span style={{ fontSize: 36 }} aria-hidden="true">{tpl.icon}</span>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: colors.gray900, margin: 0 }}>{tpl.title}</h3>
                  {tpl.form_code && <span style={{ fontSize: 12, color: colors.gray500 }}>{tpl.form_code}</span>}
                </div>
              </div>
              <p style={{ fontSize: 14, color: colors.gray500, lineHeight: 1.5, marginBottom: 14 }}>{tpl.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: colors.gray500 }}>
                  {(tpl.fields || []).length} fields · {tpl.category || 'general'}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: colors.primary }}>Fill &amp; Download →</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
