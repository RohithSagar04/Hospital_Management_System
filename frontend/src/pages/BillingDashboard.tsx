import { useState, useEffect } from 'react'
import { CreditCard, Search, Receipt, RefreshCw, UserRound, X, Printer, Download } from 'lucide-react'
import { getPatients, getBilling, generateBill, type Patient, type BillingRecord } from '../api'

// ── Invoice print styles injected into a new window ───────────────────────
const INVOICE_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a1a2e; padding: 0; }
  .page { max-width: 720px; margin: 0 auto; padding: 40px 48px; }

  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0; }
  .hospital-name { font-size: 22px; font-weight: 800; color: #1e293b; letter-spacing: -0.5px; }
  .hospital-sub  { font-size: 11px; color: #64748b; margin-top: 3px; }
  .invoice-badge { text-align: right; }
  .invoice-badge .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; }
  .invoice-badge .number { font-size: 18px; font-weight: 700; color: #6366f1; margin-top: 2px; }

  /* Patient info */
  .section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 600; margin-bottom: 10px; }
  .patient-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 28px; }
  .patient-field .field-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
  .patient-field .field-value { font-size: 13px; font-weight: 600; color: #1e293b; margin-top: 2px; }

  /* Line items */
  .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  .items-table thead tr { background: #f1f5f9; }
  .items-table th { text-align: left; padding: 10px 14px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; font-weight: 600; }
  .items-table th:last-child { text-align: right; }
  .items-table td { padding: 12px 14px; font-size: 13px; color: #334155; border-bottom: 1px solid #f1f5f9; }
  .items-table td:last-child { text-align: right; font-weight: 500; color: #1e293b; }
  .items-table .sno { color: #94a3b8; font-size: 11px; }

  /* Total */
  .total-row { display: flex; justify-content: flex-end; margin-bottom: 32px; }
  .total-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 24px; min-width: 240px; }
  .total-box .subtotal-line { display: flex; justify-content: space-between; font-size: 12px; color: #64748b; margin-bottom: 8px; }
  .total-box .grand-total { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 2px solid #e2e8f0; }
  .total-box .grand-label { font-size: 14px; font-weight: 700; color: #1e293b; }
  .total-box .grand-amount { font-size: 20px; font-weight: 800; color: #059669; }

  /* Footer */
  .footer { border-top: 1px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; align-items: center; }
  .footer .note { font-size: 11px; color: #94a3b8; max-width: 340px; line-height: 1.5; }
  .footer .generated { font-size: 10px; color: #cbd5e1; text-align: right; }
  .status-badge { display: inline-block; background: #d1fae5; color: #065f46; font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 6px; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 20px 28px; }
  }
`

function buildInvoiceHTML(patient: Patient, bill: BillingRecord): string {
  const fmt = (v: string) =>
    parseFloat(v).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 })

  const invoiceNo = `INV-${bill.id.toString().padStart(6, '0')}`
  const date = bill.created_at.split('T')[0]
  const now = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

  const lineItems = [
    { sno: 1, description: 'Doctor Consultation Fee', amount: bill.consultation_fee },
    { sno: 2, description: 'Laboratory / Diagnostic Test Charges', amount: bill.test_charges },
    { sno: 3, description: 'Pharmacy / Medicine Costs', amount: bill.medicine_costs },
  ]

  const rows = lineItems.map(item => `
    <tr>
      <td class="sno">${item.sno}</td>
      <td>${item.description}</td>
      <td>${fmt(item.amount)}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${invoiceNo} — ${patient.name}</title>
  <style>${INVOICE_STYLES}</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div>
      <div class="hospital-name">🏥 City Hospital</div>
      <div class="hospital-sub">Hospital Management System · Billing Department</div>
      <div class="hospital-sub">📞 +91-XXXX-XXXXXX &nbsp;|&nbsp; 📧 billing@cityhospital.in</div>
    </div>
    <div class="invoice-badge">
      <div class="label">Invoice</div>
      <div class="number">${invoiceNo}</div>
      <div style="font-size:11px;color:#64748b;margin-top:4px;">Date: ${date}</div>
      <div class="status-badge">Paid</div>
    </div>
  </div>

  <!-- Patient Info -->
  <div class="section-title">Patient Details</div>
  <div class="patient-grid">
    <div class="patient-field">
      <div class="field-label">Full Name</div>
      <div class="field-value">${patient.name}</div>
    </div>
    <div class="patient-field">
      <div class="field-label">Patient ID</div>
      <div class="field-value">${patient.patient_id}</div>
    </div>
    <div class="patient-field">
      <div class="field-label">Age / Gender</div>
      <div class="field-value">${patient.age} yrs${patient.gender ? ' / ' + patient.gender : ''}</div>
    </div>
    <div class="patient-field">
      <div class="field-label">Token No.</div>
      <div class="field-value">#${patient.token_number}</div>
    </div>
  </div>

  <!-- Line Items -->
  <div class="section-title">Billing Breakdown</div>
  <table class="items-table">
    <thead>
      <tr>
        <th style="width:40px">#</th>
        <th>Description</th>
        <th style="width:140px">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <!-- Total -->
  <div class="total-row">
    <div class="total-box">
      <div class="subtotal-line"><span>Consultation</span><span>${fmt(bill.consultation_fee)}</span></div>
      <div class="subtotal-line"><span>Lab Charges</span><span>${fmt(bill.test_charges)}</span></div>
      <div class="subtotal-line"><span>Medicines</span><span>${fmt(bill.medicine_costs)}</span></div>
      <div class="grand-total">
        <span class="grand-label">Total Amount</span>
        <span class="grand-amount">${fmt(bill.total_amount)}</span>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="note">
      Thank you for choosing City Hospital. Please retain this invoice for your records.
      For billing queries, contact the billing desk (Ground Floor) during OPD hours.
    </div>
    <div class="generated">
      Generated on<br/>${now}<br/>
      <span style="color:#6366f1;font-weight:600;">HMS · Billing System</span>
    </div>
  </div>

</div>
</body>
</html>`
}

// ── Main component ─────────────────────────────────────────────────────────
export default function BillingDashboard() {
  const [pidInput, setPidInput] = useState('')
  const [patient, setPatient] = useState<Patient | null>(null)
  const [bill, setBill] = useState<BillingRecord | null>(null)
  const [searchErr, setSearchErr] = useState('')
  const [generating, setGenerating] = useState(false)
  const [autoLoaded, setAutoLoaded] = useState(false)
  const [printing, setPrinting] = useState(false)

  // Auto-load logged-in patient on mount
  useEffect(() => {
    const stored = localStorage.getItem('hms_patient')
    if (stored) {
      const p = JSON.parse(stored) as { patient_id: string }
      setPidInput(p.patient_id)
      setAutoLoaded(true)
      searchById(p.patient_id)
    }
  }, [])

  const searchById = async (pid: string) => {
    setSearchErr(''); setPatient(null); setBill(null)
    if (!pid.trim()) return
    const res = await getPatients(pid.trim())
    if (!res.data.length) { setSearchErr('No patient found.'); return }
    const p = res.data[0]; setPatient(p)
    const bRes = await getBilling(p.patient_id)
    if (bRes.data.length) setBill(bRes.data[0])
  }

  const search = () => searchById(pidInput)

  const clearSearch = () => {
    setPidInput(''); setPatient(null); setBill(null); setSearchErr(''); setAutoLoaded(false)
  }

  const handleGenerate = async () => {
    if (!patient) return
    setGenerating(true)
    try {
      const res = await generateBill(patient.patient_id)
      setBill(res.data)
    } catch (err: any) {
      setSearchErr(err?.response?.data?.error || 'Failed to generate bill.')
    }
    setGenerating(false)
  }

  // ── Print / Download invoice ─────────────────────────────────────────────
  const handlePrintInvoice = () => {
    if (!patient || !bill) return
    setPrinting(true)

    const html = buildInvoiceHTML(patient, bill)
    const printWin = window.open('', '_blank', 'width=800,height=900,scrollbars=yes')
    if (!printWin) {
      // Fallback: download as HTML file
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Invoice-${patient.patient_id}-${bill.id}.html`
      a.click()
      URL.revokeObjectURL(url)
      setPrinting(false)
      return
    }

    printWin.document.write(html)
    printWin.document.close()

    // Wait for content to render, then trigger print dialog (Save as PDF)
    printWin.onload = () => {
      setTimeout(() => {
        printWin.focus()
        printWin.print()
        setPrinting(false)
      }, 300)
    }
  }

  const fmt = (v: string) =>
    parseFloat(v).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 })

  return (
    <div className="relative min-h-screen rounded-2xl border border-slate-800 bg-slate-950/60 backdrop-blur-sm overflow-hidden p-6">
      {/* Professional Dashboard Background Image */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10 bg-no-repeat bg-cover bg-center"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=1600&q=80')` }}
      />

      <div className="relative z-10 space-y-5">
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 sm:p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-5">
            <div className="rounded-xl bg-rose-500/15 p-2"><CreditCard size={20} className="text-rose-400" /></div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Billing Dashboard</h2>
              <p className="text-xs text-slate-400">View, generate, and print consolidated patient invoices</p>
            </div>
          </div>

          {/* Auto-loaded banner */}
          {autoLoaded && patient && (
            <div className="mb-3 flex items-center justify-between rounded-xl border border-cyan-500/25 bg-cyan-500/5 px-4 py-2">
              <div className="flex items-center gap-2 text-xs text-cyan-300">
                <UserRound size={13} /> Auto-loaded: <span className="font-semibold">{patient.name}</span> · {patient.patient_id}
              </div>
              <button onClick={clearSearch} className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 transition">
                <X size={12} /> Search other patient
              </button>
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <input
              className="input flex-1"
              placeholder="Enter Patient ID (e.g. PT-123456)"
              value={pidInput}
              onChange={e => setPidInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
            />
            <button className="btn w-32" onClick={search}><Search size={16} className="mr-1 inline" />Search</button>
            {pidInput && !autoLoaded && (
              <button onClick={clearSearch} className="btn bg-slate-700 hover:bg-slate-600 text-slate-200"><X size={15} /></button>
            )}
          </div>
          {searchErr && <p className="text-sm text-red-400 mb-3">{searchErr}</p>}

          {patient && (
            <div>
              {/* Patient info */}
              <div className="mb-5 rounded-xl bg-slate-800/60 border border-slate-700 p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  ['Name', patient.name],
                  ['Patient ID', patient.patient_id],
                  ['Age', String(patient.age)],
                  ['Token', String(patient.token_number)],
                ].map(([l, v]) => (
                  <div key={l} className="rounded-lg bg-slate-900/60 p-2 text-center">
                    <p className="text-xs text-slate-400">{l}</p>
                    <p className="font-semibold text-cyan-300 text-sm">{v}</p>
                  </div>
                ))}
              </div>

              {bill ? (
                <div className="rounded-xl border border-slate-700 bg-slate-800/40 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center gap-2 px-5 py-3 bg-slate-800/80 border-b border-slate-700">
                    <Receipt size={16} className="text-rose-400" />
                    <span className="font-semibold text-slate-100">Bill Summary</span>
                    <span className="text-xs text-slate-500 ml-auto">{bill.created_at.split('T')[0]}</span>
                  </div>

                  {/* Line items */}
                  <div className="p-5 space-y-3">
                    {[
                      ['Doctor Consultation Fee', bill.consultation_fee],
                      ['Laboratory / Test Charges', bill.test_charges],
                      ['Medicine Costs', bill.medicine_costs],
                    ].map(([label, val]) => (
                      <div key={label as string} className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">{label as string}</span>
                        <span className="font-medium text-slate-100">{fmt(val as string)}</span>
                      </div>
                    ))}
                    <div className="border-t border-slate-600 pt-3 flex items-center justify-between">
                      <span className="font-bold text-slate-100 text-base">Total Amount</span>
                      <span className="font-bold text-emerald-300 text-xl">{fmt(bill.total_amount)}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="px-5 pb-5 flex flex-wrap gap-3">
                    <button
                      className="btn flex items-center gap-2"
                      onClick={handleGenerate}
                      disabled={generating}
                    >
                      <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
                      {generating ? 'Recalculating…' : 'Recalculate Bill'}
                    </button>

                    <button
                      onClick={handlePrintInvoice}
                      disabled={printing}
                      className="flex items-center gap-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 px-4 py-2 text-sm font-semibold text-indigo-300 hover:bg-indigo-500/25 transition disabled:opacity-50"
                    >
                      <Printer size={15} />
                      {printing ? 'Opening…' : 'Print Invoice'}
                    </button>

                    <button
                      onClick={handlePrintInvoice}
                      disabled={printing}
                      className="flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/25 transition disabled:opacity-50"
                    >
                      <Download size={15} />
                      Download PDF
                    </button>
                  </div>

                  {/* Print hint */}
                  <div className="px-5 pb-4">
                    <p className="text-xs text-slate-500">
                      💡 A print preview will open. Choose <span className="text-slate-400 font-medium">Save as PDF</span> in the destination to download the invoice.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-600 p-8 text-center">
                  <Receipt size={36} className="mx-auto text-slate-600 mb-3" />
                  <p className="text-slate-400 text-sm mb-4">No bill generated yet for this patient.</p>
                  <button className="btn" onClick={handleGenerate} disabled={generating}>
                    {generating ? 'Generating…' : 'Generate Bill'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
