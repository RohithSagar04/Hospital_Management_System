import { useState, useEffect, type FormEvent } from 'react'
import { FlaskConical, Search, CheckCircle, Clock, Loader, UserRound, X, Send } from 'lucide-react'
import { getDiagnostics, getPatients, updateDiagnostic, sendLabReport, type DiagnosticTest, type Patient } from '../api'

const STATUS_COLORS: Record<string, string> = {
  requested: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  'in-progress': 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  completed: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
}
const STATUS_ICON: Record<string, React.ReactNode> = {
  requested: <Clock size={13} />,
  'in-progress': <Loader size={13} className="animate-spin" />,
  completed: <CheckCircle size={13} />,
}

export default function DiagnosisDashboard() {
  const [filterPid, setFilterPid] = useState('')
  const [filteredPatient, setFilteredPatient] = useState<Patient | null>(null)
  const [patientErr, setPatientErr] = useState('')
  const [tests, setTests] = useState<DiagnosticTest[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<Record<number, { result: string; status: string }>>({})
  const [saving, setSaving] = useState<Record<number, boolean>>({})
  const [sending, setSending] = useState<Record<number, boolean>>({})
  const [autoLoaded, setAutoLoaded] = useState(false)

  const load = async (pid?: string) => {
    setLoading(true); setPatientErr(''); setFilteredPatient(null)
    if (pid) {
      const pRes = await getPatients(pid)
      if (!pRes.data.length) {
        setPatientErr(`No patient found with ID "${pid}".`)
        setTests([]); setLoading(false); return
      }
      setFilteredPatient(pRes.data[0])
    }
    const res = await getDiagnostics(pid ? { patient_id: pid } : undefined)
    setTests(res.data)
    const initEdit: Record<number, { result: string; status: string }> = {}
    res.data.forEach(t => { initEdit[t.id] = { result: t.result, status: t.status } })
    setEditing(initEdit)
    setLoading(false)
  }

  // Auto-load logged-in patient on mount
  useEffect(() => {
    const stored = localStorage.getItem('hms_patient')
    if (stored) {
      const p = JSON.parse(stored) as { patient_id: string }
      setFilterPid(p.patient_id)
      setAutoLoaded(true)
      load(p.patient_id)
    } else {
      load()
    }
  }, [])

  const handleFilter = (e: FormEvent) => { e.preventDefault(); setAutoLoaded(false); load(filterPid.trim() || undefined) }
  const clearFilter = () => { setFilterPid(''); setFilteredPatient(null); setPatientErr(''); setAutoLoaded(false); load() }

  const saveResult = async (id: number) => {
    setSaving(s => ({ ...s, [id]: true }))
    const { result, status } = editing[id]
    await updateDiagnostic(id, { result, status })
    await load(filterPid.trim() || undefined)
    setSaving(s => ({ ...s, [id]: false }))
  }

  const dispatchReport = async (id: number) => {
    setSending(s => ({ ...s, [id]: true }))
    try { await sendLabReport(id) } catch { /* ignore */ }
    await load(filterPid.trim() || undefined)
    setSending(s => ({ ...s, [id]: false }))
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-5">
          <div className="rounded-xl bg-blue-500/15 p-2"><FlaskConical size={20} className="text-blue-400" /></div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Diagnosis Dashboard</h2>
            <p className="text-xs text-slate-400">View and update diagnostic test results</p>
          </div>
        </div>

        {/* Auto-loaded banner */}
        {autoLoaded && filteredPatient && (
          <div className="mb-3 flex items-center justify-between rounded-xl border border-cyan-500/25 bg-cyan-500/5 px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-cyan-300">
              <UserRound size={13} /> Auto-loaded: <span className="font-semibold">{filteredPatient.name}</span> · {filteredPatient.patient_id}
            </div>
            <button type="button" onClick={clearFilter} className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 transition">
              <X size={12} /> Show all patients
            </button>
          </div>
        )}

        {/* Filter bar */}
        <form onSubmit={handleFilter} className="flex gap-2 mb-3">
          <input className="input flex-1" placeholder="Filter by Patient ID (e.g. PT-123456) — leave blank to show all"
            value={filterPid} onChange={e => setFilterPid(e.target.value)} />
          <button className="btn w-28" type="submit"><Search size={14} className="mr-1 inline" />Filter</button>
          {filterPid && (
            <button type="button" className="btn bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center gap-1"
              onClick={clearFilter}><X size={14} /> Clear</button>
          )}
        </form>

        {/* Patient error */}
        {patientErr && (
          <p className="text-sm text-red-400 mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{patientErr}</p>
        )}

        {/* Patient info card when filtering */}
        {filteredPatient && (
          <div className="mb-5 rounded-xl border border-blue-500/25 bg-blue-500/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <UserRound size={15} className="text-blue-400" />
              <span className="text-sm font-semibold text-blue-300">Patient Details</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[['Name', filteredPatient.name], ['Patient ID', filteredPatient.patient_id], ['Age', `${filteredPatient.age} yrs`], ['Gender', filteredPatient.gender || '—']].map(([l, v]) => (
                <div key={l} className="rounded-lg bg-slate-800/60 border border-slate-700/60 p-2.5 text-center">
                  <p className="text-xs text-slate-400 mb-1">{l}</p>
                  <p className="font-semibold text-cyan-300 text-sm break-all">{v}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-10 text-slate-400 animate-pulse">Loading tests…</div>
        ) : tests.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            {filterPid && !patientErr ? 'No diagnostic tests found for this patient.' : 'No diagnostic tests found.'}
          </div>
        ) : (
          <div className="space-y-4">
            {tests.map(t => {
              const e = editing[t.id] ?? { result: t.result, status: t.status }
              const colorClass = STATUS_COLORS[t.status] ?? STATUS_COLORS['requested']
              return (
                <div key={t.id} className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="font-semibold text-slate-100">{t.test_name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Patient: <span className="text-cyan-300">{t.patient_name}</span> · <span className="text-slate-500">{t.patient_id_code}</span></p>
                      <p className="text-xs text-slate-500 mt-0.5">Ordered by Dr. {t.doctor_name} · {t.created_at.split('T')[0]}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Lab charge: <span className="text-emerald-300 font-medium">₹{t.lab_charge}</span></p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`flex items-center gap-1 text-xs font-medium rounded-full border px-2 py-1 ${colorClass}`}>
                        {STATUS_ICON[t.status] ?? STATUS_ICON['requested']}
                        {t.status}
                      </span>
                      {t.report_sent && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                          <Send size={9} /> Report Sent
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <select className="input w-full md:w-48" value={e.status}
                      onChange={ev => setEditing(ed => ({ ...ed, [t.id]: { ...e, status: ev.target.value } }))}>
                      <option value="requested">Requested</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                    <textarea className="input w-full h-20" placeholder="Enter test result / findings…"
                      value={e.result} onChange={ev => setEditing(ed => ({ ...ed, [t.id]: { ...e, result: ev.target.value } }))} />
                    <div className="flex flex-wrap gap-2">
                      <button className="btn" onClick={() => saveResult(t.id)} disabled={saving[t.id]}>
                        {saving[t.id] ? 'Saving…' : 'Save Result'}
                      </button>
                      {/* Send report once result is entered and not yet sent */}
                      {!t.report_sent && (
                        <button
                          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold border transition ${e.result.trim() ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30' : 'bg-slate-700/30 border-slate-700 text-slate-600 cursor-not-allowed'}`}
                          onClick={() => dispatchReport(t.id)}
                          disabled={sending[t.id] || !e.result.trim()}
                          title={!e.result.trim() ? 'Enter and save a result first before sending.' : 'Send report to patient and doctor'}>
                          <Send size={13} />
                          {sending[t.id] ? 'Sending…' : 'Send Report to Patient & Doctor'}
                        </button>
                      )}
                      {t.report_sent && (
                        <span className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          <CheckCircle size={13} /> Report Delivered
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
