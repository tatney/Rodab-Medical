const HOSPITAL = {
  name: 'Rodab Medical Hospital',
  address: 'P.O. Box 167187, Nakawuka Rd, Kajjansi, Entebbe, Uganda',
  phone: '+353 83 125 7105 / +256 706 560 730',
  email: 'info@rodabmedical.com',
}

const NAVY = [18, 23, 92]
const TEXT_DARK = [17, 24, 39]
const TEXT_GRAY = [75, 85, 99]

function formatValue(field, value, emptyMarker) {
  if (value === undefined || value === null || value === '') return emptyMarker
  if (field.type === 'checkbox') return value ? 'Yes' : 'No'
  return String(value)
}

function todayString() {
  return new Date().toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function makeReferenceNo() {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `REF-${ymd}-${rand}`
}

function slugify(text) {
  return (text || 'form')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Generates and downloads a fully-populated PDF for a form template.
 * The PDF always contains international-standard header info, the form's
 * metadata, and every field label rendered with the user's entered value —
 * never a blank form.
 *
 * @param {object} template - form_templates row (with .fields, .title, ...)
 * @param {object} values   - key/value map for the template fields
 * @param {object} options  - { referenceNo, patientName, blank }
 */
export async function downloadFormPdf(template, values = {}, options = {}) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const referenceNo = options.referenceNo || makeReferenceNo()
  const issued = todayString()
  const emptyMarker = options.blank ? '' : '—'

  /* ── Header band ── */
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, pageWidth, 26, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text(HOSPITAL.name, margin, 11)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.text(HOSPITAL.address, margin, 18)

  doc.setFontSize(8.5)
  doc.text(`Form Code: ${template.form_code || '—'}`, pageWidth - margin, 11, { align: 'right' })
  doc.text(`Revision: ${template.revision || '—'}`, pageWidth - margin, 17, { align: 'right' })
  doc.text(`Issued: ${issued}`, pageWidth - margin, 23, { align: 'right' })

  /* ── Title & description ── */
  doc.setTextColor(...TEXT_DARK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(template.title || 'Medical Form', margin, 38)

  if (template.description) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...TEXT_GRAY)
    const lines = doc.splitTextToSize(template.description, pageWidth - margin * 2)
    doc.text(lines, margin, 45)
  }

  let y = 52
  if (template.description) {
    const descLines = doc.splitTextToSize(template.description, pageWidth - margin * 2)
    y = 52 + descLines.length * 3.4
  }

  /* ── Reference / patient meta table ── */
  autoTable(doc, {
    startY: y + 4,
    head: [['Reference No.', 'Patient', 'Category', 'Submitted']],
    body: [[referenceNo, options.patientName || '—', template.category || 'general', issued]],
    theme: 'grid',
    headStyles: { fillColor: NAVY, fontSize: 8.5 },
    styles: { fontSize: 8.5, cellPadding: 2 },
    margin: { left: margin, right: margin },
  })

  /* ── Fields (label + user-entered value) ── */
  const fields = Array.isArray(template.fields) ? template.fields : []
  const body = fields.map((f) => [f.label || f.key, formatValue(f, values[f.key], emptyMarker)])

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 6,
    head: [['Field', 'Response']],
    body,
    theme: 'striped',
    headStyles: { fillColor: NAVY, fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak', valign: 'top' },
    columnStyles: { 0: { cellWidth: 72 }, 1: { cellWidth: 108 } },
    margin: { left: margin, right: margin },
  })

  /* ── Confirmation note ── */
  const noteY = doc.lastAutoTable.finalY + 8
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.setTextColor(...TEXT_GRAY)
  const note = doc.splitTextToSize(
    'I declare that the information provided in this form is true and accurate to the best of my knowledge. This form was generated electronically by Rodab Medical Hospital from the data submitted by the patient.',
    pageWidth - margin * 2,
  )
  doc.text(note, margin, noteY)

  /* ── Footer on every page ── */
  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(130, 130, 130)
    doc.text(`${HOSPITAL.name} — ${HOSPITAL.phone} — ${HOSPITAL.email}`, margin, pageHeight - 8)
    doc.text(`Page ${i} of ${total}`, pageWidth - margin, pageHeight - 8, { align: 'right' })
  }

  doc.save(`${slugify(template.title)}-${referenceNo}.pdf`)
  return referenceNo
}

/**
 * Generates and downloads a PDF summary of a patient's digital medical record.
 * @param {object} patient     - profiles row (full_name, email, phone, date_of_birth, gender, medical_profile, onboarding_status)
 * @param {object} fieldLabels - map of field key -> human-readable label
 */
export async function downloadMedicalRecordPdf(patient = {}, fieldLabels = {}) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const issued = todayString()

  /* ── Header band ── */
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, pageWidth, 26, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text(HOSPITAL.name, margin, 11)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.text(HOSPITAL.address, margin, 18)

  doc.setFontSize(8.5)
  doc.text(`Issued: ${issued}`, pageWidth - margin, 11, { align: 'right' })
  doc.text(`Onboarding: ${patient.onboarding_status || '—'}`, pageWidth - margin, 17, { align: 'right' })

  /* ── Title ── */
  doc.setTextColor(...TEXT_DARK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(`Medical Record — ${patient.full_name || 'Patient'}`, margin, 38)

  /* ── Patient meta ── */
  autoTable(doc, {
    startY: 44,
    head: [['Patient', 'Email', 'Phone', 'Date of Birth', 'Gender']],
    body: [[patient.full_name || '—', patient.email || '—', patient.phone || '—', patient.date_of_birth || '—', patient.gender || '—']],
    theme: 'grid',
    headStyles: { fillColor: NAVY, fontSize: 8.5 },
    styles: { fontSize: 8.5, cellPadding: 2 },
    margin: { left: margin, right: margin },
  })

  /* ── Record fields ── */
  const mp = patient.medical_profile || {}
  const body = Object.entries(mp).map(([key, value]) => {
    const label = fieldLabels[key] || key
    let display = String(value)
    if (typeof value === 'boolean') display = value ? 'Yes' : 'No'
    return [label, display]
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 6,
    head: [['Field', 'Value']],
    body: body.length ? body : [['', 'No digital medical record on file.']],
    theme: 'striped',
    headStyles: { fillColor: NAVY, fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak', valign: 'top' },
    columnStyles: { 0: { cellWidth: 72 }, 1: { cellWidth: 108 } },
    margin: { left: margin, right: margin },
  })

  /* ── Footer on every page ── */
  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(130, 130, 130)
    doc.text(`${HOSPITAL.name} — ${HOSPITAL.phone} — ${HOSPITAL.email}`, margin, pageHeight - 8)
    doc.text(`Page ${i} of ${total}`, pageWidth - margin, pageHeight - 8, { align: 'right' })
  }

  doc.save(`${slugify(patient.full_name || 'medical-record')}-record.pdf`)
  return true
}
