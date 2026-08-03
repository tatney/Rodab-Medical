import React from 'react'
import colors from './colors'
import { fieldInputType } from './form-utils'

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

/**
 * Renders a single form-template field (all 10 supported types).
 * @param {object} field    - { key, label, type, placeholder, required, options[], full }
 * @param {any}    value    - current field value
 * @param {function} onChange - (key, value) => void
 * @param {object} errors   - { key: message }
 */
export function renderField(field, value, onChange, errors = {}) {
  const id = `field-${field.key}`
  const err = errors[field.key]
  const common = {
    id,
    name: field.key,
    value: value ?? '',
    onChange: (e) => onChange(field.key, field.type === 'checkbox' ? e.target.checked : e.target.value),
  }

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
              borderBottom: `2px solid ${colors.gray300}`,
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
            type={fieldInputType(field)}
            placeholder={field.placeholder}
            style={{ ...inputStyle, ...(err ? inputErrorStyle : {}) }}
          />
          {err && <p style={errorTextStyle}>{err}</p>}
        </div>
      )
  }
}
