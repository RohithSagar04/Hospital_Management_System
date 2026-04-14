import { useState, useEffect } from 'react'
import { LayoutDashboard, Users, Stethoscope, CalendarCheck, RefreshCw, PlusCircle, CheckCircle, XCircle, Clock, BadgeCheck } from 'lucide-react'
import { getAdminSummary, addDoctor, getPendingDoctors, approveDoctor, type AdminSummary, type DoctorProfile } from '../api'

export default function AdminDashboard() {
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAddDoctor, setShowAddDoctor] = useState(false)
  const [dName, setDName] = useState(''); const [dSpec, setDSpec] = useState(''); const [dFee, setDFee] = useState('0')
  const [saving, setSaving] = useState(false)

  // Doctor approval
  const [pendingDoctors, setPendingDoctors] = useState<DoctorProfile[]>([])
  const [allDoctorProfiles, setAllDoctorProfiles] = useState<DoctorProfile[]>([])
  const [approvalFilter, setApprovalFilter] = useState<'pending' | 'all'>('pending')
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({})
  const [actionMsg, setActionMsg] = useState('')

  const load = async () => {
    setLoading(true)
    const [sumRes, pendRes, allRes] = await Promise.all([
      getAdminSummary(),
      getPendingDoctors('pending'),
      getPendingDoctors(),
    ])
    setSummary(sumRes.data)
    setPendingDoctors(pendRes.data)
    setAllDoctorProfiles(allRes.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleAddDoctor = async () => {
    if (!dName.trim() || !dSpec.trim()) return
    setSaving(true)
    await addDoctor({ name: dName, specialization: dSpec, consultation_fee: dFee })
    setDName(''); setDSpec(''); setDFee('0'); setShowAddDoctor(false)
    await load()
    setSaving(false)
  }

  const handleApproval = async (profileId: number, action: 'approve' | 'reject') => {
    setActionLoading(s => ({ ...s, [profileId]: true }))
    await approveDoctor(profileId, action)
    setActionMsg(action === 'approve' ? 'Doctor approved successfully.' : 'Doctor registration rejected.')
    setTimeout(() => setActionMsg(''), 4000)
    await load()
    setActionLoading(s => ({ ...s, [profileId]: false }))
  }

  const displayedProfiles = approvalFilter === 'pending' ? pendingDoctors : allDoctorProfiles

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-500/15 p-2"><LayoutDashboard size={20} className="text-indigo-400" /></div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Admin Dashboard</h2>
              <p className="text-xs text-slate-400">Hospital-wide overview and management</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn flex items-center gap-2" onClick={() => setShowAddDoctor(v => !v)}>
              <PlusCircle size={15} />Add Doctor
            </button>
            <button className="btn bg-slate-700 hover:bg-slate-600 flex items-center gap-2" onClick={load} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />Refresh
            </button>
          </div>
        </div>

        {/* Add Doctor Form */}
        {showAddDoctor && (
          <div className="mb-5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4">
            <p className="font-medium text-indigo-300 mb-3">Add New Doctor</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input className="input" placeholder="Doctor name *" value={dName} onChange={e => setDName(e.target.value)} />
              <input className="input" placeholder="Specialization *" value={dSpec} onChange={e => setDSpec(e.target.value)} />
              <input className="input" type="number" placeholder="Consultation fee (₹)" value={dFee} onChange={e => setDFee(e.target.value)} min="0" />
            </div>
            <div className="flex gap-2 mt-3">
              <button className="btn" onClick={handleAddDoctor} disabled={saving}>{saving ? 'Saving…' : 'Add Doctor'}</button>
              <button className="btn bg-slate-700 hover:bg-slate-600" onClick={() => setShowAddDoctor(false)}>Cancel</button>
            </div>
          </div>
        )}

        {!summary ? (
          <div className="text-center py-10 text-slate-400">Loading dashboard…</div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <StatCard icon={<Users size={22} className="text-cyan-400" />} label="Total Patients" value={summary.total_patients} color="bg-cyan-500/10 border-cyan-500/30" />
              <StatCard icon={<Stethoscope size={22} className="text-violet-400" />} label="Total Doctors" value={summary.total_doctors} color="bg-violet-500/10 border-violet-500/30" />
              <StatCard icon={<CalendarCheck size={22} className="text-emerald-400" />} label="Total Appointments" value={summary.total_appointments} color="bg-emerald-500/10 border-emerald-500/30" />
            </div>

            {/* Doctor Workload */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Doctor Appointment Workload</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {summary.appointments_by_doctor.map(d => (
                  <div key={d.id} className="rounded-xl border border-slate-700 bg-slate-800/40 p-4 flex items-center gap-3">
                    <div className="rounded-lg bg-violet-500/15 p-2 shrink-0"><Stethoscope size={18} className="text-violet-400" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-100 truncate">{d.name}</p>
                      <p className="text-xs text-slate-400 truncate">{d.specialization}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-bold text-cyan-300">{d.total}</p>
                      <p className="text-xs text-slate-500">appts</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Appointments Table */}
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent Appointments</h3>
              {summary.recent_appointments.length === 0 ? (
                <p className="text-slate-500 text-sm">No appointments yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-700">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800/60">
                      <tr>
                        {['Patient', 'Patient ID', 'Doctor', 'Specialization', 'Date', 'Status'].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {summary.recent_appointments.map(a => (
                        <tr key={a.id} className="hover:bg-slate-800/30 transition">
                          <td className="px-4 py-3 text-slate-100 whitespace-nowrap">{a.patient_name}</td>
                          <td className="px-4 py-3 text-cyan-300 whitespace-nowrap font-mono text-xs">{a.patient_id_code}</td>
                          <td className="px-4 py-3 text-slate-200 whitespace-nowrap">{a.doctor_name}</td>
                          <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">{a.doctor_specialization}</td>
                          <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{a.date}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.status === 'scheduled' ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Doctor Registration Approvals ── */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Stethoscope size={18} className="text-violet-400" />
            <h3 className="font-semibold text-slate-100">Doctor Registration Approvals</h3>
            {pendingDoctors.length > 0 && (
              <span className="rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold px-2 py-0.5">
                {pendingDoctors.length} pending
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setApprovalFilter('pending')}
              className={`text-xs rounded-xl px-3 py-1.5 border transition ${approvalFilter === 'pending' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}>
              Pending
            </button>
            <button onClick={() => setApprovalFilter('all')}
              className={`text-xs rounded-xl px-3 py-1.5 border transition ${approvalFilter === 'all' ? 'bg-violet-500/15 text-violet-300 border-violet-500/30' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}>
              All Doctors
            </button>
          </div>
        </div>

        {actionMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
            <BadgeCheck size={14} /> {actionMsg}
          </div>
        )}

        {displayedProfiles.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">
            {approvalFilter === 'pending' ? 'No pending doctor registrations.' : 'No doctor registrations found.'}
          </p>
        ) : (
          <div className="space-y-3">
            {displayedProfiles.map(dp => (
              <div key={dp.id} className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-slate-100">{dp.doctor_name}</p>
                      <StatusPill status={dp.status} />
                    </div>
                    <p className="text-sm text-violet-300">{dp.specialization} · <span className="text-emerald-300">₹{dp.consultation_fee}</span></p>
                    <p className="text-xs text-slate-400 mt-0.5">{dp.email}{dp.phone ? ` · ${dp.phone}` : ''}</p>
                    {dp.registration_number && <p className="text-xs text-slate-500 mt-0.5">Reg: {dp.registration_number}</p>}
                    <p className="text-xs text-slate-600 mt-1">Registered: {dp.created_at.split('T')[0]}</p>
                  </div>
                  {dp.status === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleApproval(dp.id, 'approve')}
                        disabled={actionLoading[dp.id]}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 px-3 py-1.5 text-xs font-semibold transition">
                        <CheckCircle size={13} /> {actionLoading[dp.id] ? '…' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleApproval(dp.id, 'reject')}
                        disabled={actionLoading[dp.id]}
                        className="flex items-center gap-1.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 px-3 py-1.5 text-xs font-semibold transition">
                        <XCircle size={13} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
    approved: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    rejected: 'bg-red-500/10 border-red-500/25 text-red-400',
  }
  const icons: Record<string, React.ReactNode> = {
    pending: <Clock size={10} />, approved: <CheckCircle size={10} />, rejected: <XCircle size={10} />,
  }
  return (
    <span className={`flex items-center gap-1 text-[10px] font-semibold rounded-full border px-2 py-0.5 ${map[status] ?? ''}`}>
      {icons[status]} {status}
    </span>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl border p-5 flex items-center gap-4 ${color}`}>
      <div className="rounded-lg bg-slate-900/40 p-3">{icon}</div>
      <div>
        <p className="text-3xl font-bold text-slate-100">{value}</p>
        <p className="text-xs text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  )
}
