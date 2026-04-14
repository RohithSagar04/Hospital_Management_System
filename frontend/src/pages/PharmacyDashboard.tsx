import { useState, useEffect } from 'react'
import { Pill, Search, CheckCircle, Clock, UserRound, X } from 'lucide-react'
import { getPatients, getPrescriptions, getPharmacy, dispensePharmacy, updatePharmacy, type Patient, type Prescription, type PharmacyDispense } from '../api'

export default function PharmacyDashboard() {
  const [patientIdInput, setPatientIdInput] = useState('')
  const [patient, setPatient] = useState<Patient | null>(null)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [dispenses, setDispenses] = useState<PharmacyDispense[]>([])
  const [searchErr, setSearchErr] = useState('')
  const [costs, setCosts] = useState<Record<number, string>>({})
  const [busy, setBusy] = useState<Record<number, boolean>>({})
  const [autoLoaded, setAutoLoaded] = useState(false)

  // Auto-load logged-in patient on mount
  useEffect(() => {
    const stored = localStorage.getItem('hms_patient')
    if (stored) {
      const p = JSON.parse(stored) as { patient_id: string }
      setPatientIdInput(p.patient_id)
      setAutoLoaded(true)
      searchById(p.patient_id)
    }
  }, [])

  const searchById = async (pid: string) => {
    setSearchErr(''); setPatient(null); setPrescriptions([]); setDispenses([])
    if (!pid.trim()) return
    const pRes = await getPatients(pid.trim())
    if (!pRes.data.length) { setSearchErr('No patient found.'); return }
    const p = pRes.data[0]; setPatient(p)
    const [rxRes, dRes] = await Promise.all([
      getPrescriptions({ patient_id: p.patient_id }),
      getPharmacy(p.patient_id),
    ])
    setPrescriptions(rxRes.data)
    setDispenses(dRes.data)
    const initialCosts: Record<number, string> = {}
    rxRes.data.forEach(rx => { initialCosts[rx.id] = '0' })
    setCosts(initialCosts)
  }

  const search = () => searchById(patientIdInput)

  const clearSearch = () => {
    setPatientIdInput(''); setPatient(null); setPrescriptions([]); setDispenses([]); setSearchErr(''); setAutoLoaded(false)
  }

  const dispenseRx = async (rx: Prescription) => {
    if (!patient) return
    setBusy(b => ({ ...b, [rx.id]: true }))
    const existingDispense = dispenses.find(d => d.prescription === rx.id)
    if (existingDispense) {
      await updatePharmacy(existingDispense.id, { dispensed: true, medicine_cost: Number(costs[rx.id] || 0) })
    } else {
      await dispensePharmacy(rx.id, patient.id, Number(costs[rx.id] || 0))
    }
    const dRes = await getPharmacy(patient.patient_id)
    setDispenses(dRes.data)
    setBusy(b => ({ ...b, [rx.id]: false }))
  }

  const isDispensed = (rxId: number) => dispenses.some(d => d.prescription === rxId && d.dispensed)

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-5">
          <div className="rounded-xl bg-green-500/15 p-2"><Pill size={20} className="text-green-400" /></div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Pharmacy Dashboard</h2>
            <p className="text-xs text-slate-400">Enter Patient ID to retrieve and dispense prescriptions</p>
          </div>
        </div>

        {/* Auto-loaded banner */}
        {autoLoaded && patient && (
          <div className="mb-3 flex items-center justify-between rounded-xl border border-cyan-500/25 bg-cyan-500/8 px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-cyan-300">
              <UserRound size={13} /> Auto-loaded from your session: <span className="font-semibold">{patient.name}</span>
            </div>
            <button onClick={clearSearch} className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 transition">
              <X size={12} /> Search other patient
            </button>
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <input className="input flex-1" placeholder="Enter Patient ID (e.g. PT-123456)"
            value={patientIdInput} onChange={e => setPatientIdInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()} />
          <button className="btn w-32" onClick={search}><Search size={16} className="mr-1 inline" />Search</button>
          {patientIdInput && !autoLoaded && (
            <button onClick={clearSearch} className="btn bg-slate-700 hover:bg-slate-600 text-slate-200"><X size={15}/></button>
          )}
        </div>
        {searchErr && <p className="text-sm text-red-400 mb-3">{searchErr}</p>}

        {patient && (
          <div>
            {/* Patient Info */}
            <div className="mb-4 rounded-xl bg-slate-800/60 border border-slate-700 p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[['Name', patient.name], ['Patient ID', patient.patient_id], ['Age', String(patient.age)], ['Token', String(patient.token_number)]].map(([l, v]) => (
                <div key={l} className="rounded-lg bg-slate-900/60 p-2 text-center">
                  <p className="text-xs text-slate-400">{l}</p>
                  <p className="font-semibold text-cyan-300 text-sm">{v}</p>
                </div>
              ))}
            </div>

            {/* Prescriptions */}
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Prescriptions</h3>
            {prescriptions.length === 0 ? (
              <p className="text-slate-500 text-sm">No prescriptions found for this patient.</p>
            ) : (
              <div className="space-y-3">
                {prescriptions.map(rx => {
                  const dispensed = isDispensed(rx.id)
                  return (
                    <div key={rx.id} className={`rounded-xl border p-4 ${dispensed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-700 bg-slate-800/40'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-slate-100">{rx.medicine_name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{rx.dosage} · {rx.duration_days} day(s)</p>
                          <p className="text-xs text-slate-500 mt-0.5">Prescribed by Dr. {rx.doctor_name}</p>
                          {rx.notes && <p className="text-xs text-slate-400 mt-1 italic">{rx.notes}</p>}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-medium rounded-full px-2 py-1 shrink-0 ml-3">
                          {dispensed
                            ? <><CheckCircle size={14} className="text-emerald-400" /><span className="text-emerald-400">Dispensed</span></>
                            : <><Clock size={14} className="text-amber-400" /><span className="text-amber-400">Pending</span></>}
                        </div>
                      </div>
                      {!dispensed && (
                        <div className="flex gap-2 mt-2">
                          <input className="input w-40" type="number" placeholder="Medicine cost (₹)"
                            value={costs[rx.id] ?? '0'} onChange={e => setCosts(c => ({ ...c, [rx.id]: e.target.value }))} min="0" />
                          <button className="btn" onClick={() => dispenseRx(rx)} disabled={busy[rx.id]}>
                            {busy[rx.id] ? 'Dispensing…' : 'Mark Dispensed'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
