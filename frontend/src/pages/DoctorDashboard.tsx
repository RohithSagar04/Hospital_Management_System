import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Stethoscope, Search, ClipboardList, FlaskConical, Pill, Bot,
  UserRound, LogOut, CalendarCheck, Send, BadgeCheck, AlertCircle,
  Calendar,
} from 'lucide-react'
import {
  getPatients, getConsultations, getPrescriptions, getDiagnostics,
  getAppointments, addConsultation, addPrescription, addDiagnostic, aiDrugRecommendation,
  type Doctor, type Patient, type ConsultationNote, type Prescription,
  type DiagnosticTest, type Appointment, type DoctorProfile,
} from '../api'

function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    scheduled: 'bg-amber-500/15 text-amber-300', completed: 'bg-emerald-500/15 text-emerald-300',
    cancelled: 'bg-red-500/15 text-red-300', requested: 'bg-blue-500/15 text-blue-300',
    'in-progress': 'bg-violet-500/15 text-violet-300',
  }
  return <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${map[status] ?? 'bg-slate-700 text-slate-400'}`}>{status}</span>
}
function Empty({ msg }: { msg: string }) {
  return <p className="text-slate-500 text-sm text-center py-5">{msg}</p>
}
type DashTab = 'appointments' | 'search'
type PatientTab = 'history' | 'add-note' | 'prescription' | 'diagnostic' | 'ai'

export default function DoctorDashboard() {
  const navigate = useNavigate()
  const [session, setSession] = useState<{ profile: DoctorProfile; doctor: Doctor } | null>(null)
  const [dashTab, setDashTab] = useState<DashTab>('appointments')
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([])
  const [apptLoading, setApptLoading] = useState(false)
  const [patientId, setPatientId] = useState('')
  const [patient, setPatient] = useState<Patient | null>(null)
  const [searchErr, setSearchErr] = useState('')
  const [patientTab, setPatientTab] = useState<PatientTab>('history')
  const [notes, setNotes] = useState<ConsultationNote[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [diagnostics, setDiagnostics] = useState<DiagnosticTest[]>([])
  const [obs, setObs] = useState(''); const [diagSum, setDiagSum] = useState('')
  const [med, setMed] = useState(''); const [dosage, setDosage] = useState('')
  const [days, setDays] = useState('1'); const [medNotes, setMedNotes] = useState('')
  const [testName, setTestName] = useState(''); const [labCharge, setLabCharge] = useState('0')
  const [saving, setSaving] = useState(false); const [saveMsg, setSaveMsg] = useState('')
  const [aiDisease, setAiDisease] = useState(''); const [aiSymptoms, setAiSymptoms] = useState('')
  const [aiResult, setAiResult] = useState(''); const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('hms_doctor')
    if (stored) {
      const s = JSON.parse(stored) as { profile: DoctorProfile; doctor: Doctor }
      setSession(s); loadAppointments(s.doctor.id)
    }
  }, [])

  const loadAppointments = async (doctorId: number) => {
    setApptLoading(true)
    const res = await getAppointments({ doctor: doctorId })
    setAllAppointments(res.data); setApptLoading(false)
  }

  const logout = () => { localStorage.removeItem('hms_doctor'); navigate('/doctor-login') }

  const searchPatient = async () => {
    setSearchErr(''); setPatient(null)
    if (!patientId.trim()) return
    const res = await getPatients(patientId.trim())
    if (!res.data.length) { setSearchErr('No patient found with that ID.'); return }
    const p = res.data[0]; setPatient(p); setPatientTab('history'); await refreshHistory(p)
  }

  const refreshHistory = async (p: Patient) => {
    const [n, rx, dx] = await Promise.all([
      getConsultations({ patient_id: p.patient_id }),
      getPrescriptions({ patient_id: p.patient_id }),
      getDiagnostics({ patient_id: p.patient_id }),
    ])
    setNotes(n.data); setPrescriptions(rx.data); setDiagnostics(dx.data)
  }

  const flash = (msg: string) => { setSaveMsg(msg); setTimeout(() => setSaveMsg(''), 4000) }

  const saveNote = async (e: FormEvent) => {
    e.preventDefault(); if (!patient || !session) return; setSaving(true)
    await addConsultation({ patient: patient.id, doctor: session.doctor.id, observations: obs, diagnosis_summary: diagSum })
    setObs(''); setDiagSum(''); await refreshHistory(patient); setSaving(false); setPatientTab('history'); flash('Consultation note saved.')
  }

  const saveRx = async (e: FormEvent) => {
    e.preventDefault(); if (!patient || !session) return; setSaving(true)
    await addPrescription({ patient: patient.id, doctor: session.doctor.id, medicine_name: med, dosage, duration_days: Number(days), notes: medNotes })
    setMed(''); setDosage(''); setDays('1'); setMedNotes(''); await refreshHistory(patient); setSaving(false); setPatientTab('history'); flash('Prescription added.')
  }

  const saveTest = async (e: FormEvent) => {
    e.preventDefault(); if (!patient || !session) return; setSaving(true)
    await addDiagnostic({ patient: patient.id, doctor: session.doctor.id, test_name: testName, lab_charge: Number(labCharge) })
    setTestName(''); setLabCharge('0'); await refreshHistory(patient); setSaving(false); setPatientTab('history'); flash('Diagnostic test ordered.')
  }

  const runAI = async () => {
    setAiLoading(true); setAiResult('')
    try { const res = await aiDrugRecommendation(aiDisease, aiSymptoms, patient?.age); setAiResult(res.data.recommendation) }
    catch { setAiResult('AI service unavailable.') }
    setAiLoading(false)
  }

  if (!session) {
    return (
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-12 text-center shadow-lg">
        <div className="rounded-full bg-violet-500/10 p-6 inline-flex mb-5"><Stethoscope size={44} className="text-violet-400" /></div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">Doctor Login Required</h2>
        <p className="text-slate-400 text-sm mb-6">Log in to access your appointments, patient records, and clinical tools.</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button className="btn px-8 py-3 text-base font-semibold bg-violet-600 hover:bg-violet-500" onClick={() => navigate('/doctor-login')}>Doctor Login →</button>
          <button className="btn bg-slate-700 hover:bg-slate-600 text-slate-100 px-8 py-3 text-base" onClick={() => navigate('/doctor-register')}>Register as Doctor</button>
        </div>
      </div>
    )
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-5">

      {/* Doctor Identity Card */}
      <div className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/40 via-slate-900/80 to-slate-900/70 p-6 shadow-lg">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-500/20 p-3"><Stethoscope size={26} className="text-violet-400" /></div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Logged in as Doctor</p>
              <h2 className="text-xl font-bold text-slate-100">{session.profile.doctor_name}</h2>
              <p className="text-sm text-violet-300 mt-0.5">{session.profile.specialization}</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition rounded-xl px-3 py-2 hover:bg-red-500/10 border border-transparent hover:border-red-500/20">
            <LogOut size={13} /> Logout
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[['Email', session.profile.email], ['Phone', session.profile.phone || '—'], ['Reg. No.', session.profile.registration_number || '—'], ['Fee', `₹${session.profile.consultation_fee}`]].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-slate-800/70 border border-slate-700/60 p-3 text-center">
              <p className="text-xs text-slate-400 mb-1">{l}</p>
              <p className="font-bold text-violet-300 text-sm break-all">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Tab Bar */}
      <div className="flex gap-2">
        {([
          { key: 'appointments' as DashTab, label: 'All Appointments', icon: <CalendarCheck size={14} />, count: allAppointments.length },
          { key: 'search' as DashTab, label: 'Patient Lookup', icon: <Search size={14} /> },
        ]).map(t => (
          <button key={t.key} onClick={() => setDashTab(t.key)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition border ${ dashTab === t.key ? 'bg-violet-500/20 text-violet-300 border-violet-500/40' : 'bg-slate-800/60 text-slate-400 border-slate-700/40 hover:bg-slate-700'}`}>
            {t.icon} {t.label}
            {'count' in t && t.count > 0 && <span className="rounded-full bg-violet-500/30 text-violet-200 text-xs px-1.5 py-0.5 font-bold leading-none">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ── APPOINTMENTS TAB ── */}
      {dashTab === 'appointments' && (
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CalendarCheck size={18} className="text-violet-400" />
              <h3 className="font-semibold text-slate-100">My Patient Appointments</h3>
            </div>
            <button onClick={() => loadAppointments(session.doctor.id)} className="text-xs text-slate-400 hover:text-slate-200 border border-slate-700 rounded-xl px-3 py-1.5 transition hover:bg-slate-800">↻ Refresh</button>
          </div>
          {apptLoading ? <p className="text-slate-500 text-sm text-center py-8 animate-pulse">Loading appointments…</p>
            : allAppointments.length === 0 ? <Empty msg="No appointments assigned to you yet." />
            : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {allAppointments.map(a => (
                  <div key={a.id} className={`flex items-center justify-between rounded-xl border px-4 py-3 gap-3 ${a.date < today ? 'border-slate-800 bg-slate-800/20 opacity-70' : 'border-slate-700 bg-slate-800/40 hover:bg-slate-800/60'}`}>
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-slate-700/50 p-2 shrink-0"><UserRound size={16} className="text-slate-400" /></div>
                      <div>
                        <p className="font-semibold text-slate-100 text-sm">{a.patient_name}</p>
                        <p className="text-xs text-cyan-400 font-mono mt-0.5">{a.patient_id_code}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm text-slate-200 flex items-center gap-1 justify-end mb-1"><Calendar size={11} />{a.date}</p>
                      <Badge status={a.status} />
                    </div>
                    <button onClick={() => { setDashTab('search'); setPatientId(a.patient_id_code); setTimeout(() => document.getElementById('dr-pid-input')?.focus(), 100) }}
                      className="shrink-0 text-xs text-violet-400 hover:text-violet-300 border border-violet-500/30 rounded-lg px-2 py-1 hover:bg-violet-500/10 transition">
                      View →
                    </button>
                  </div>
                ))}
              </div>
            )}
        </div>
      )}

      {/* ── PATIENT SEARCH TAB ── */}
      {dashTab === 'search' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5 shadow-lg">
            <h3 className="font-semibold text-slate-100 flex items-center gap-2 mb-3"><Search size={16} className="text-cyan-400" /> Patient Lookup</h3>
            <div className="flex gap-2">
              <input id="dr-pid-input" className="input flex-1" placeholder="Enter Patient ID (e.g. PT-123456)"
                value={patientId} onChange={e => setPatientId(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchPatient()} />
              <button className="btn w-32" onClick={searchPatient}>Search</button>
            </div>
            {searchErr && <p className="mt-2 text-sm text-red-400">{searchErr}</p>}
          </div>

          {saveMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              <BadgeCheck size={15} /> {saveMsg}
            </div>
          )}

          {patient && (
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5 shadow-lg">
              {/* Patient identity bar */}
              <div className="rounded-xl bg-slate-800/60 border border-slate-700 p-4 mb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[['Name', patient.name], ['Patient ID', patient.patient_id], ['Age', `${patient.age} yrs`], ['Gender', patient.gender || '—']].map(([l, v]) => (
                    <div key={l} className="rounded-lg bg-slate-900/60 p-2.5 text-center">
                      <p className="text-xs text-slate-400 mb-1">{l}</p>
                      <p className="font-semibold text-cyan-300 text-sm break-all">{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inner tab bar */}
              <div className="flex flex-wrap gap-1.5 mb-4 pb-4 border-b border-slate-800">
                {([
                  { key: 'history', label: 'History', icon: <ClipboardList size={13} /> },
                  { key: 'add-note', label: 'Consultation Note', icon: <Stethoscope size={13} /> },
                  { key: 'prescription', label: 'Prescribe', icon: <Pill size={13} /> },
                  { key: 'diagnostic', label: 'Order Test', icon: <FlaskConical size={13} /> },
                  { key: 'ai', label: 'AI Drug Assistant', icon: <Bot size={13} /> },
                ] as { key: PatientTab; label: string; icon: React.ReactNode }[]).map(t => (
                  <button key={t.key} onClick={() => setPatientTab(t.key)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition whitespace-nowrap border ${patientTab === t.key ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-slate-800/60 text-slate-400 border-slate-700/40 hover:bg-slate-700'}`}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              {/* History */}
              {patientTab === 'history' && (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Consultation Notes</p>
                    {notes.length === 0 ? <Empty msg="No notes yet." /> : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {notes.map(n => (
                          <div key={n.id} className="rounded-xl border border-slate-700 bg-slate-800/40 p-3">
                            <div className="flex justify-between gap-2 mb-1">
                              <p className="text-sm font-semibold text-slate-100">Dr. {n.doctor_name}</p>
                              <span className="text-xs text-slate-500">{n.created_at.split('T')[0]}</span>
                            </div>
                            <p className="text-sm text-slate-300">{n.observations}</p>
                            {n.diagnosis_summary && <p className="text-xs text-cyan-300 mt-1 italic">{n.diagnosis_summary}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Prescriptions</p>
                    {prescriptions.length === 0 ? <Empty msg="No prescriptions yet." /> : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {prescriptions.map(rx => (
                          <div key={rx.id} className="rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-3 flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-100 text-sm">{rx.medicine_name}</p>
                              <p className="text-xs text-emerald-300 mt-0.5">{rx.dosage} · {rx.duration_days} day(s)</p>
                              {rx.notes && <p className="text-xs text-slate-400 mt-0.5 italic">{rx.notes}</p>}
                            </div>
                            <p className="text-xs text-slate-500 shrink-0">{rx.created_at.split('T')[0]}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Lab Tests & Reports</p>
                    {diagnostics.length === 0 ? <Empty msg="No lab tests ordered yet." /> : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {diagnostics.map(d => (
                          <div key={d.id} className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <p className="font-semibold text-slate-100">{d.test_name}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{d.created_at.split('T')[0]} · <span className="text-emerald-300">₹{d.lab_charge}</span></p>
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <Badge status={d.status} />
                                {d.report_sent && (
                                  <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                                    <Send size={9} /> Report Sent
                                  </span>
                                )}
                              </div>
                            </div>
                            {d.result ? (
                              <div className="rounded-lg bg-slate-900/60 px-3 py-2">
                                <p className="text-xs text-slate-500 mb-0.5 font-medium">Result</p>
                                <p className="text-sm text-slate-200 whitespace-pre-line">{d.result}</p>
                              </div>
                            ) : <p className="text-xs text-slate-500 italic">Awaiting lab result…</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {patientTab === 'add-note' && (
                <form onSubmit={saveNote} className="space-y-3">
                  <textarea className="input w-full h-24 resize-none" placeholder="Observations / examination findings *" value={obs} onChange={e => setObs(e.target.value)} required />
                  <textarea className="input w-full h-20 resize-none" placeholder="Diagnosis summary (optional)" value={diagSum} onChange={e => setDiagSum(e.target.value)} />
                  <button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save Consultation Note'}</button>
                </form>
              )}

              {patientTab === 'prescription' && (
                <form onSubmit={saveRx} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="input" placeholder="Medicine name *" value={med} onChange={e => setMed(e.target.value)} required />
                  <input className="input" placeholder="Dosage (e.g. 500mg twice daily) *" value={dosage} onChange={e => setDosage(e.target.value)} required />
                  <input className="input" type="number" placeholder="Duration (days)" value={days} onChange={e => setDays(e.target.value)} min="1" />
                  <input className="input" placeholder="Additional notes (optional)" value={medNotes} onChange={e => setMedNotes(e.target.value)} />
                  <button className="btn md:col-span-2" disabled={saving}>{saving ? 'Saving…' : 'Add Prescription'}</button>
                </form>
              )}

              {patientTab === 'diagnostic' && (
                <form onSubmit={saveTest} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="input" placeholder="Test name (e.g. CBC, X-Ray, MRI) *" value={testName} onChange={e => setTestName(e.target.value)} required />
                  <input className="input" type="number" placeholder="Lab charge (₹)" value={labCharge} onChange={e => setLabCharge(e.target.value)} min="0" />
                  <button className="btn md:col-span-2" disabled={saving}>{saving ? 'Saving…' : 'Order Diagnostic Test'}</button>
                </form>
              )}

              {patientTab === 'ai' && (
                <div className="space-y-3">
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-300 flex items-start gap-2">
                    <AlertCircle size={13} className="mt-0.5 shrink-0" />
                    AI Drug Recommendation — for doctor reference only. Always verify with clinical guidelines before prescribing.
                  </div>
                  <input className="input" placeholder="Disease / Diagnosis (e.g. Hypertension)" value={aiDisease} onChange={e => setAiDisease(e.target.value)} />
                  <input className="input" placeholder="Symptoms (e.g. headache, dizziness)" value={aiSymptoms} onChange={e => setAiSymptoms(e.target.value)} />
                  <p className="text-xs text-slate-500">Patient age: <span className="text-slate-300 font-medium">{patient.age} years</span> — included in recommendation</p>
                  <button className="btn" onClick={runAI} disabled={aiLoading || (!aiDisease && !aiSymptoms)}>{aiLoading ? 'Analysing…' : 'Get AI Recommendation'}</button>
                  {aiResult && <pre className="whitespace-pre-wrap rounded-xl bg-slate-800/60 border border-slate-700 p-4 text-sm text-slate-200 leading-relaxed max-h-96 overflow-y-auto">{aiResult}</pre>}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
