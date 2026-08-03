import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getFormTemplates, createFormSubmission } from '../api'
import { extractArray } from '../utils/api-helpers'
import { downloadFormPdf } from '../utils/pdf'
import { buildInitialValues, validateFields } from '../utils/form-utils'
import { renderField } from '../utils/form-renderer'
import { useAuth } from '../context/AuthContext'
import colors from '../utils/colors'

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

  const runValidation = () => {
    const errs = validateFields(selected?.fields, values)
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
    const hasPrefill = Object.values(values).some((v) => v !== undefined && v !== null && v !== '' && v !== false)
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

          {hasPrefill && (
            <div role="status" style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: '#dbeafe', border: '1px solid #93c5fd', color: '#1e40af', fontSize: 14, marginBottom: 16 }}>
              Prefilled from your medical record — review before downloading.
            </div>
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
        Select a form, fill in your details (auto-filled from your medical record where possible), and download a completed PDF.
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
