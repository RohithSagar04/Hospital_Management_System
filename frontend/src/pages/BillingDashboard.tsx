import { useState, useEffect } from 'react'
import { CreditCard, Search, Receipt, RefreshCw, UserRound, X } from 'lucide-react'
import { getPatients, getBilling, generateBill, type Patient, type BillingRecord } from '../api'

export default function BillingDashboard() {
  const [pidInput, setPidInput] = useState('')
  const [patient, setPatient] = useState<Patient | null>(null)
  const [bill, setBill] = useState<BillingRecord | null>(null)
  const [searchErr, setSearchErr] = useState('')
  const [generating, setGenerating] = useState(false)
  const [autoLoaded, setAutoLoaded] = useState(false)

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

  const fmt = (v: string) => parseFloat(v).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 })

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-5">
          <div className="rounded-xl bg-rose-500/15 p-2"><CreditCard size={20} className="text-rose-400" /></div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Billing Dashboard</h2>
            <p className="text-xs text-slate-400">View and generate consolidated patient bills</p>
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
          <input className="input flex-1" placeholder="Enter Patient ID (e.g. PT-123456)"
            value={pidInput} onChange={e => setPidInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()} />
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
              {[['Name', patient.name], ['Patient ID', patient.patient_id], ['Age', String(patient.age)], ['Token', String(patient.token_number)]].map(([l, v]) => (
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

                <div className="px-5 pb-4">
                  <button className="btn flex items-center gap-2" onClick={handleGenerate} disabled={generating}>
                    <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
                    {generating ? 'Recalculating…' : 'Recalculate Bill'}
                  </button>
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
  )
}
