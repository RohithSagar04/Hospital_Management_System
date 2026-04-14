import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UserRound, Stethoscope, Bot, Send, BadgeCheck, CalendarCheck, LogOut,
  Calendar, Phone, MapPin, Clock, Pin, ClipboardList, Pill, FlaskConical,
  Package, AlertCircle,
} from 'lucide-react'
import {
  getDoctors, getAppointments, createAppointment, aiChatbot,
  getConsultations, getPrescriptions, getDiagnostics, getPharmacy,
  type Patient, type Doctor, type Appointment,
  type ConsultationNote, type Prescription, type DiagnosticTest, type PharmacyDispense,
} from '../api'

interface ChatMsg { role: 'user' | 'bot'; text: string }
type HistoryTab = 'notes' | 'prescriptions' | 'labs' | 'medicines' | 'appointments'

function daysFromToday(dateStr: string) {
  const t = new Date(); t.setHours(0, 0, 0, 0)
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - t.getTime()) / 86400000)
}

function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    scheduled: 'bg-amber-500/15 text-amber-300',
    completed: 'bg-emerald-500/15 text-emerald-300',
    cancelled: 'bg-red-500/15 text-red-300',
    requested: 'bg-blue-500/15 text-blue-300',
    'in-progress': 'bg-violet-500/15 text-violet-300',
  }
  return <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${map[status] ?? 'bg-slate-700 text-slate-300'}`}>{status}</span>
}

function Empty({ msg }: { msg: string }) {
  return <p className="text-slate-500 text-sm text-center py-6">{msg}</p>
}

export default function PatientDashboard() {
  const navigate = useNavigate()
  const chatEndRef = useRef<HTMLDivElement>(null)
  const bookingRef = useRef<HTMLDivElement>(null)

  const [patient, setPatient] = useState<Patient | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [notes, setNotes] = useState<ConsultationNote[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [diagnostics, setDiagnostics] = useState<DiagnosticTest[]>([])
  const [dispenses, setDispenses] = useState<PharmacyDispense[]>([])
  const [historyTab, setHistoryTab] = useState<HistoryTab>('notes')
  const [historyLoading, setHistoryLoading] = useState(false)
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null)
  const [bookDate, setBookDate] = useState(new Date().toISOString().split('T')[0])
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookSuccess, setBookSuccess] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([])
  const [chatLoading, setChatLoading] = useState(false)

  const loadAll = async (p: Patient) => {
    setHistoryLoading(true)
    const [docs, appts, cons, rxs, diags, pharma] = await Promise.all([
      getDoctors(),
      getAppointments({ patient_id: p.patient_id }),
      getConsultations({ patient_id: p.patient_id }),
      getPrescriptions({ patient_id: p.patient_id }),
      getDiagnostics({ patient_id: p.patient_id }),
      getPharmacy(p.patient_id),
    ])
    setDoctors(docs.data)
    setAppointments(appts.data)
    setNotes(cons.data)
    setPrescriptions(rxs.data)
    setDiagnostics(diags.data)
    setDispenses(pharma.data)
    setHistoryLoading(false)
  }

  useEffect(() => {
    const stored = localStorage.getItem('hms_patient')
    if (stored) { const p: Patient = JSON.parse(stored); setPatient(p); loadAll(p) }
  }, [])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatHistory])

  const today = new Date().toISOString().split('T')[0]
  const nextAppt = appointments
    .filter(a => a.date >= today && a.status === 'scheduled')
    .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null

  const bookAppointment = async (e: FormEvent) => {
    e.preventDefault()
    if (!patient || !bookingDoctor) return
    setBookingLoading(true)
    await createAppointment({ patient: patient.id, doctor: bookingDoctor.id, date: bookDate, status: 'scheduled' })
    await loadAll(patient)
    setBookSuccess(`Appointment booked with Dr. ${bookingDoctor.name} on ${bookDate}!`)
    setBookingDoctor(null)
    setTimeout(() => setBookSuccess(''), 5000)
    setBookingLoading(false)
  }

  const sendChat = async () => {
    if (!chatInput.trim()) return
    const msg = chatInput.trim(); setChatInput('')
    setChatHistory(h => [...h, { role: 'user', text: msg }])
    setChatLoading(true)
    try {
      const res = await aiChatbot(msg)
      setChatHistory(h => [...h, { role: 'bot', text: res.data.reply }])
    } catch {
      setChatHistory(h => [...h, { role: 'bot', text: 'AI assistant is unavailable right now.' }])
    }
    setChatLoading(false)
  }

  const logout = () => { localStorage.removeItem('hms_patient'); navigate('/login') }

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!patient) {
    return (
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-12 text-center shadow-lg">
        <div className="rounded-full bg-slate-800 p-6 inline-flex mb-5"><UserRound size={44} className="text-slate-500" /></div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">Please Log In</h2>
        <p className="text-slate-400 text-sm mb-6">Use your Patient ID and password to access your health dashboard.</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button className="btn px-8 py-3 text-base font-semibold" onClick={() => navigate('/login')}>Login →</button>
          <button className="btn bg-slate-700 hover:bg-slate-600 text-slate-100 px-8 py-3 text-base" onClick={() => navigate('/register')}>New? Register</button>
        </div>
      </div>
    )
  }

  const historyTabs = [
    { key: 'notes' as HistoryTab, label: 'Consultations', icon: <ClipboardList size={13} />, count: notes.length },
    { key: 'prescriptions' as HistoryTab, label: 'Prescriptions', icon: <Pill size={13} />, count: prescriptions.length },
    { key: 'labs' as HistoryTab, label: 'Lab Tests', icon: <FlaskConical size={13} />, count: diagnostics.length },
    { key: 'medicines' as HistoryTab, label: 'Medicines', icon: <Package size={13} />, count: dispenses.length },
    { key: 'appointments' as HistoryTab, label: 'All Appointments', icon: <CalendarCheck size={13} />, count: appointments.length },
  ]

  return (
    <div className="space-y-5">

      {/* ── 1. Patient ID Card ── */}
      <div className="rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-950/40 via-slate-900/80 to-slate-900/70 p-6 shadow-lg">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-500/20 p-3"><UserRound size={26} className="text-cyan-400" /></div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Welcome back</p>
              <h2 className="text-xl font-bold text-slate-100">{patient.name}</h2>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition rounded-xl px-3 py-2 hover:bg-red-500/10 border border-transparent hover:border-red-500/20">
            <LogOut size={13} /> Logout
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[['Patient ID', patient.patient_id], ['Token No.', String(patient.token_number)], ['Age', `${patient.age} yrs`], ['Gender', patient.gender || '—']].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-slate-800/70 border border-slate-700/60 p-3 text-center">
              <p className="text-xs text-slate-400 mb-1">{l}</p>
              <p className="font-bold text-cyan-300 text-sm break-all">{v}</p>
            </div>
          ))}
        </div>
        {(patient.phone || patient.address) && (
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400 border-t border-slate-700/40 pt-3">
            {patient.phone && <span className="flex items-center gap-1.5"><Phone size={11} />{patient.phone}</span>}
            {patient.address && <span className="flex items-center gap-1.5"><MapPin size={11} />{patient.address}</span>}
          </div>
        )}
      </div>

      {/* ── 2. Pinned Next Appointment ── */}
      {nextAppt ? (
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 to-slate-900/70 p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Pin size={14} className="text-amber-400" />
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">📌 Pinned — Next Appointment</span>
          </div>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <p className="text-lg font-bold text-slate-100">Dr. {nextAppt.doctor_name}</p>
              <p className="text-sm text-violet-300 mt-0.5">{nextAppt.doctor_specialization}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-amber-300">{nextAppt.date}</p>
              {(() => {
                const d = daysFromToday(nextAppt.date)
                return <p className="text-xs text-amber-400/80 mt-0.5">{d === 0 ? '🔔 TODAY!' : d === 1 ? '🌅 Tomorrow' : `⏳ In ${d} days`}</p>
              })()}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-amber-500/20 flex items-center gap-2">
            <Badge status={nextAppt.status} />
            <span className="text-xs text-slate-500">Appointment confirmed with hospital</span>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <AlertCircle size={15} /> No upcoming appointments scheduled
          </div>
          <button className="btn text-xs py-1.5 px-4" onClick={() => bookingRef.current?.scrollIntoView({ behavior: 'smooth' })}>
            Book Now
          </button>
        </div>
      )}

      {bookSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <BadgeCheck size={16} /> {bookSuccess}
        </div>
      )}

      {/* ── 3. Complete Medical History ── */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList size={18} className="text-cyan-400" />
          <h3 className="font-semibold text-slate-100">Complete Medical History</h3>
        </div>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-1.5 mb-4 pb-4 border-b border-slate-800">
          {historyTabs.map(t => (
            <button key={t.key} onClick={() => setHistoryTab(t.key)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition whitespace-nowrap ${historyTab === t.key ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-800/60 text-slate-400 border border-slate-700/40 hover:bg-slate-700'}`}>
              {t.icon} {t.label}
              {t.count > 0 && <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${historyTab === t.key ? 'bg-cyan-500/30 text-cyan-200' : 'bg-slate-700 text-slate-400'}`}>{t.count}</span>}
            </button>
          ))}
        </div>

        {historyLoading ? <p className="text-slate-500 text-sm text-center py-8 animate-pulse">Loading your medical history…</p> : (
          <>
            {/* Consultations */}
            {historyTab === 'notes' && (notes.length === 0 ? <Empty msg="No consultation records yet." /> :
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {notes.map(n => (
                  <div key={n.id} className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-semibold text-slate-100">Dr. {n.doctor_name}</p>
                      <span className="text-xs text-slate-500 shrink-0">{n.created_at.split('T')[0]}</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{n.observations}</p>
                    {n.diagnosis_summary && (
                      <div className="mt-2 rounded-lg bg-slate-900/60 px-3 py-2">
                        <p className="text-xs text-slate-500 font-medium mb-0.5">Diagnosis</p>
                        <p className="text-sm text-cyan-300">{n.diagnosis_summary}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Prescriptions */}
            {historyTab === 'prescriptions' && (prescriptions.length === 0 ? <Empty msg="No prescriptions found." /> :
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {prescriptions.map(rx => (
                  <div key={rx.id} className="rounded-xl border border-slate-700 bg-slate-800/40 p-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-100">{rx.medicine_name}</p>
                      <p className="text-sm text-emerald-300 mt-0.5">{rx.dosage} · {rx.duration_days} day(s)</p>
                      {rx.notes && <p className="text-xs text-slate-400 mt-1 italic">{rx.notes}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate-500">{rx.created_at.split('T')[0]}</p>
                      <p className="text-xs text-violet-300 mt-0.5">Dr. {rx.doctor_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Lab Tests */}
            {historyTab === 'labs' && (diagnostics.length === 0 ? <Empty msg="No lab tests ordered yet." /> :
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {diagnostics.map(d => (
                  <div key={d.id} className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-semibold text-slate-100">{d.test_name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Dr. {d.doctor_name} · {d.created_at.split('T')[0]} · <span className="text-emerald-300">₹{d.lab_charge}</span></p>
                      </div>
                      <Badge status={d.status} />
                    </div>
                    {d.result ? (
                      <div className="rounded-lg bg-slate-900/60 px-3 py-2">
                        <p className="text-xs text-slate-500 mb-0.5 font-medium">Result</p>
                        <p className="text-sm text-slate-200">{d.result}</p>
                      </div>
                    ) : <p className="text-xs text-slate-500 italic">Result pending…</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Medicines */}
            {historyTab === 'medicines' && (dispenses.length === 0 ? <Empty msg="No medicines dispensed yet." /> :
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {dispenses.map(d => (
                  <div key={d.id} className="rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-100 text-sm">{d.medicine_name}</p>
                      <p className="text-xs text-slate-400">{d.dosage} · {d.created_at.split('T')[0]}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-emerald-300">₹{d.medicine_cost}</p>
                      <Badge status={d.dispensed ? 'completed' : 'requested'} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* All Appointments */}
            {historyTab === 'appointments' && (appointments.length === 0 ? <Empty msg="No appointments yet." /> :
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {appointments.sort((a, b) => b.date.localeCompare(a.date)).map(a => (
                  <div key={a.id} className={`flex items-center justify-between rounded-xl border px-4 py-3 gap-3 ${a.date < today ? 'border-slate-800 bg-slate-800/20 opacity-60' : 'border-slate-700 bg-slate-800/40'}`}>
                    <div>
                      <p className="font-medium text-slate-100 text-sm">{a.doctor_name}</p>
                      <p className="text-xs text-violet-300 mt-0.5">{a.doctor_specialization}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate-300 flex items-center gap-1 justify-end mb-1"><Calendar size={11} />{a.date}</p>
                      <Badge status={a.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── 4. Book Appointment ── */}
      <div ref={bookingRef} className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Stethoscope size={18} className="text-violet-400" />
          <h3 className="font-semibold text-slate-100">Book an Appointment</h3>
          <span className="text-xs text-slate-500 ml-1">— pick a doctor and date</span>
        </div>
        {doctors.length === 0 ? <p className="text-slate-500 text-sm">No doctors available. Please check with admin.</p> : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map(d => (
              <div key={d.id} className={`rounded-xl border p-4 transition-all ${bookingDoctor?.id === d.id ? 'border-violet-500/50 bg-violet-500/10' : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'}`}>
                <p className="font-semibold text-slate-100 leading-tight">{d.name}</p>
                <p className="text-xs text-violet-300 mt-0.5">{d.specialization}</p>
                <p className="text-xs text-slate-400 mt-1.5">Fee: <span className="text-cyan-300 font-semibold">₹{d.consultation_fee}</span></p>
                {bookingDoctor?.id !== d.id ? (
                  <button className="mt-3 btn text-xs py-1.5 px-3 w-full" onClick={() => { setBookingDoctor(d); setBookDate(new Date().toISOString().split('T')[0]) }}>
                    Book Appointment
                  </button>
                ) : (
                  <form onSubmit={bookAppointment} className="mt-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-violet-300"><Clock size={11} /> Select date</div>
                    <input type="date" className="input w-full text-sm py-1.5" value={bookDate} onChange={e => setBookDate(e.target.value)} min={new Date().toISOString().split('T')[0]} required />
                    <div className="flex gap-2">
                      <button type="submit" className="btn text-xs py-1.5 px-3 flex-1" disabled={bookingLoading}>{bookingLoading ? 'Booking…' : '✓ Confirm'}</button>
                      <button type="button" onClick={() => setBookingDoctor(null)} className="btn bg-slate-700 hover:bg-slate-600 text-slate-100 text-xs py-1.5 px-3">Cancel</button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 5. AI Chatbot ── */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <div className="rounded-xl bg-amber-500/15 p-2"><Bot size={18} className="text-amber-400" /></div>
          <div>
            <h3 className="font-semibold text-slate-100">Hospital AI Assistant</h3>
            <p className="text-xs text-slate-500">Ask about appointments, departments, or general health queries</p>
          </div>
        </div>
        <div className="h-52 overflow-y-auto space-y-2 mb-3 rounded-xl bg-slate-800/40 p-3">
          {chatHistory.length === 0 && <p className="text-slate-500 text-sm text-center mt-16">Ask anything about our hospital services…</p>}
          {chatHistory.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-line ${m.role === 'user' ? 'bg-cyan-600/30 text-cyan-100' : 'bg-slate-700/60 text-slate-200'}`}>{m.text}</div>
            </div>
          ))}
          {chatLoading && <div className="flex justify-start"><div className="rounded-xl px-3 py-2 bg-slate-700/60 text-slate-400 text-sm animate-pulse">Thinking…</div></div>}
          <div ref={chatEndRef} />
        </div>
        <div className="flex gap-2">
          <input className="input flex-1 text-sm" placeholder="Type your question and press Enter…"
            value={chatInput} onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !chatLoading && sendChat()} />
          <button className="btn px-4" onClick={sendChat} disabled={chatLoading}><Send size={15} /></button>
        </div>
      </div>

    </div>
  )
}

