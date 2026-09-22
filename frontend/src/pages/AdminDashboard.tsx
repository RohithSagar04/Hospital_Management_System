import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Users, Stethoscope, CalendarCheck, RefreshCw,
  PlusCircle, CheckCircle, XCircle, Clock, BadgeCheck, TrendingUp, Trash2, AlertTriangle, Key,
} from 'lucide-react'
import {
  getAdminSummary, addDoctor, getPendingDoctors, approveDoctor, deleteDoctor, setDoctorCredentials,
  getDoctors, type AdminSummary, type DoctorProfile,
} from '../api'
import { DoctorsBySpecialization, AppointmentAnalysis } from '../components/DoctorCharts'

// ── Confirm-delete modal ───────────────────────────────────────────────────
function DeleteConfirmModal({
  doctorName,
  onConfirm,
  onCancel,
  loading,
}: {
  doctorName: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onCancel} />
      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-2xl border border-red-500/30 bg-slate-900 shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-xl bg-red-500/15 p-2.5">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100">Remove Doctor</h3>
            <p className="text-xs text-slate-400">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-slate-300 mb-1">
          You are about to permanently remove:
        </p>
        <p className="text-base font-bold text-red-300 mb-4 truncate">Dr. {doctorName}</p>
        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          This will also delete all associated appointments, consultation notes,
          prescriptions, and diagnostic tests linked to this doctor.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-red-500/20 border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Trash2 size={14} />
            {loading ? 'Removing…' : 'Yes, Remove'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAddDoctor, setShowAddDoctor] = useState(false)
  const [dName, setDName] = useState('')
  const [dSpec, setDSpec] = useState('')
  const [dFee, setDFee] = useState('0')
  const [dEmail, setDEmail] = useState('')
  const [dPassword, setDPassword] = useState('')
  const [saving, setSaving] = useState(false)

  // Doctor approval
  const [pendingDoctors, setPendingDoctors] = useState<DoctorProfile[]>([])
  const [allDoctorProfiles, setAllDoctorProfiles] = useState<DoctorProfile[]>([])
  const [approvalFilter, setApprovalFilter] = useState<'pending' | 'all'>('pending')
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({})
  const [actionMsg, setActionMsg] = useState('')

  // Delete doctor
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteMsg, setDeleteMsg] = useState('')

  // Doctor Credentials
  const [credentialsTarget, setCredentialsTarget] = useState<{ id: number; name: string } | null>(null)
  const [credentialsLoading, setCredentialsLoading] = useState(false)
  const [credentialsMsg, setCredentialsMsg] = useState('')

  // Direct Credential Provisioning states (Option 2)
  const [showManageCredentials, setShowManageCredentials] = useState(false)
  const [allDoctors, setAllDoctors] = useState<any[]>([])
  const [credDoctorId, setCredDoctorId] = useState<number>(0)
  const [credEmail, setCredEmail] = useState('')
  const [credPassword, setCredPassword] = useState('')
  const [credPhone, setCredPhone] = useState('')
  const [credRegNum, setCredRegNum] = useState('')
  const [credHasProfile, setCredHasProfile] = useState(false)
  const [credSaving, setCredSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [sumRes, pendRes, allRes, docRes] = await Promise.all([
        getAdminSummary(),
        getPendingDoctors('pending'),
        getPendingDoctors(),
        getDoctors(),
      ])
      setSummary(sumRes.data)
      setPendingDoctors(pendRes.data)
      setAllDoctorProfiles(allRes.data)
      setAllDoctors(docRes.data)
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || err?.message || 'Failed to load dashboard data. Please try again.'
      setError(errorMsg)
      console.error('Dashboard load error:', err)
    }
    setLoading(false)
  }

  const handleSetDoctorCredentialsDirect = async () => {
    if (!credDoctorId || !credEmail.trim()) return
    setCredSaving(true)
    setError('')
    try {
      await setDoctorCredentials({
        doctor_id: credDoctorId,
        email: credEmail,
        password: credPassword || undefined,
        phone: credPhone || undefined,
        registration_number: credRegNum || undefined,
      })
      setCredentialsMsg(`Credentials successfully provisioned for the selected doctor!`)
      setTimeout(() => setCredentialsMsg(''), 5000)
      setShowManageCredentials(false)
      setCredDoctorId(0)
      setCredEmail('')
      setCredPassword('')
      setCredPhone('')
      setCredRegNum('')
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to provision doctor credentials.')
    } finally {
      setCredSaving(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleAddDoctor = async () => {
    if (!dName.trim() || !dSpec.trim()) return
    setSaving(true)
    try {
      const res = await addDoctor({ name: dName, specialization: dSpec, consultation_fee: dFee })
      const newDoc = res.data
      if (dEmail.trim() && newDoc?.id) {
        await setDoctorCredentials({
          doctor_id: newDoc.id,
          email: dEmail,
          password: dPassword,
        })
        setCredentialsMsg(`Dr. ${newDoc.name} added and login credentials set successfully!`)
        setTimeout(() => setCredentialsMsg(''), 5000)
      } else {
        setCredentialsMsg(`Dr. ${newDoc.name} added successfully (no login credentials set yet).`)
        setTimeout(() => setCredentialsMsg(''), 5000)
      }
      setDName(''); setDSpec(''); setDFee('0'); setDEmail(''); setDPassword(''); setShowAddDoctor(false)
      await load()
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Failed to add doctor.'
      alert(errorMsg)
    }
    setSaving(false)
  }

  const handleSaveCredentials = async (data: { email: string; password?: string; phone?: string; regNumber?: string }) => {
    if (!credentialsTarget) return
    setCredentialsLoading(true)
    try {
      await setDoctorCredentials({
        doctor_id: credentialsTarget.id,
        email: data.email,
        password: data.password,
        phone: data.phone,
        registration_number: data.regNumber,
      })
      setCredentialsMsg(`Login credentials successfully saved for Dr. ${credentialsTarget.name}.`)
      setTimeout(() => setCredentialsMsg(''), 5000)
      setCredentialsTarget(null)
      await load()
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Failed to save login credentials.'
      alert(errorMsg)
    }
    setCredentialsLoading(false)
  }

  const handleApproval = async (profileId: number, action: 'approve' | 'reject') => {
    setActionLoading(s => ({ ...s, [profileId]: true }))
    await approveDoctor(profileId, action)
    setActionMsg(action === 'approve' ? 'Doctor approved successfully.' : 'Doctor registration rejected.')
    setTimeout(() => setActionMsg(''), 4000)
    await load()
    setActionLoading(s => ({ ...s, [profileId]: false }))
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteDoctor(deleteTarget.id)
      setDeleteMsg(`Dr. ${deleteTarget.name} has been removed.`)
      setTimeout(() => setDeleteMsg(''), 5000)
      setDeleteTarget(null)
      await load()
    } catch (err: any) {
      setDeleteMsg(err?.response?.data?.error || 'Failed to remove doctor.')
      setTimeout(() => setDeleteMsg(''), 5000)
      setDeleteTarget(null)
    }
    setDeleteLoading(false)
  }

  const displayedProfiles = approvalFilter === 'pending' ? pendingDoctors : allDoctorProfiles

  return (
    <div className="relative min-h-screen rounded-2xl border border-slate-800 bg-slate-950/60 backdrop-blur-sm overflow-hidden p-6">
      {/* Professional Dashboard Background Image */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10 bg-no-repeat bg-cover bg-center"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=80')` }}
      />

      <div className="relative z-10 space-y-5">
        {/* Delete confirmation modal */}
        {deleteTarget && (
          <DeleteConfirmModal
            doctorName={deleteTarget.name}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeleteTarget(null)}
            loading={deleteLoading}
          />
        )}

        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 sm:p-6 shadow-lg">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-500/15 p-2"><LayoutDashboard size={20} className="text-indigo-400" /></div>
              <div>
                <h2 className="text-lg font-semibold text-slate-100">Admin Dashboard</h2>
                <p className="text-xs text-slate-400">Hospital-wide overview and management</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                className={`btn flex items-center gap-2 text-sm ${showAddDoctor ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300' : ''}`}
                onClick={() => {
                  setShowAddDoctor(v => !v)
                  setShowManageCredentials(false)
                }}
              >
                <PlusCircle size={15} />Add Doctor Profile
              </button>
              <button
                className={`btn flex items-center gap-2 text-sm bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25 ${showManageCredentials ? 'bg-indigo-500/30 border-indigo-500/50 text-indigo-300' : ''}`}
                onClick={() => {
                  setShowManageCredentials(v => !v)
                  setShowAddDoctor(false)
                }}
              >
                <Key size={15} />Provision Credentials
              </button>
              <button className="btn bg-slate-700 hover:bg-slate-600 flex items-center gap-2 text-sm" onClick={load} disabled={loading}>
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />Refresh
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3">
              <div className="text-red-400 pt-0.5">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-red-300 font-medium text-sm">{error}</p>
                <button onClick={load} className="mt-2 text-xs text-red-400 hover:text-red-300 font-semibold">
                  Try Again →
                </button>
              </div>
            </div>
          )}

          {/* Delete success/error message */}
          {deleteMsg && (
            <div className={`mb-5 rounded-xl border px-4 py-3 text-sm flex items-center gap-2 ${
              deleteMsg.includes('removed')
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-red-500/30 bg-red-500/10 text-red-300'
            }`}>
              {deleteMsg.includes('removed') ? <CheckCircle size={14} /> : <XCircle size={14} />}
              {deleteMsg}
            </div>
          )}

          {/* Credentials success message */}
          {credentialsMsg && (
            <div className="mb-5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 px-4 py-3 text-sm flex items-center gap-2">
              <Key size={14} className="text-indigo-400" />
              {credentialsMsg}
            </div>
          )}

          {/* Add Doctor Form */}
          {showAddDoctor && (
            <div className="mb-5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-5 space-y-4 shadow-lg">
              <div>
                <p className="font-semibold text-indigo-300">Add New Doctor Profile</p>
                <p className="text-xs text-slate-400">Fill in the basic details below to register the doctor</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input className="input text-sm" placeholder="Doctor Name (e.g. Dr. Arjun Mehta) *" value={dName} onChange={e => setDName(e.target.value)} />
                <input className="input text-sm" placeholder="Specialization (e.g. Cardiology) *" value={dSpec} onChange={e => setDSpec(e.target.value)} />
                <input className="input text-sm" type="number" placeholder="Consultation Fee (₹) *" value={dFee} onChange={e => setDFee(e.target.value)} min="0" />
              </div>

              <div className="border-t border-indigo-500/20 pt-4">
                <div className="mb-2">
                  <p className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5"><Key size={11} /> Optional: Create Doctor Login Account</p>
                  <p className="text-[10px] text-slate-400">Providing an email will auto-generate an approved doctor login account</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input className="input text-sm" type="email" placeholder="Login Email (e.g. arjun@hospital.com)" value={dEmail} onChange={e => setDEmail(e.target.value)} />
                  <input className="input text-sm" type="password" placeholder="Login Password (default is 'hms12345')" value={dPassword} onChange={e => setDPassword(e.target.value)} />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button className="btn text-sm py-2 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition" onClick={handleAddDoctor} disabled={saving}>{saving ? 'Saving…' : 'Add Doctor & Save'}</button>
                <button className="btn bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm py-2 px-5 border border-slate-700" onClick={() => { setShowAddDoctor(false); setDName(''); setDSpec(''); setDFee('0'); setDEmail(''); setDPassword('') }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Provision Credentials Form (Option 2) */}
          {showManageCredentials && (
            <div className="mb-5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-5 space-y-4 shadow-lg">
              <div>
                <p className="font-semibold text-indigo-300 flex items-center gap-1.5"><Key size={16} /> Provision / Manage Doctor Credentials</p>
                <p className="text-xs text-slate-400">Select an existing doctor to assign or modify secure login credentials</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Select Doctor *</label>
                  <select
                    className="input w-full bg-slate-900 text-slate-100"
                    value={credDoctorId}
                    onChange={e => {
                      const id = Number(e.target.value)
                      setCredDoctorId(id)
                      const prof = allDoctorProfiles.find(p => p.doctor_id === id)
                      if (prof) {
                        setCredEmail(prof.email)
                        setCredPhone(prof.phone || '')
                        setCredRegNum(prof.registration_number || '')
                        setCredHasProfile(true)
                      } else {
                        setCredEmail('')
                        setCredPhone('')
                        setCredRegNum('')
                        setCredHasProfile(false)
                      }
                      setCredPassword('')
                    }}
                  >
                    <option value="">-- Choose Doctor --</option>
                    {allDoctors.map(doc => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} ({doc.specialization})
                      </option>
                    ))}
                  </select>
                </div>

                {credDoctorId > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Current Account Status</label>
                    <div className="mt-2.5">
                      {credHasProfile ? (
                        <span className="text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
                          ⚡ Credentials Provisioned (Approved)
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-1">
                          ⚠️ No Login Credentials Set Yet
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {credDoctorId > 0 && (
                <div className="border-t border-indigo-500/20 pt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Login Email address *</label>
                      <input
                        className="input w-full text-sm"
                        type="email"
                        placeholder="doctor@hospital.com"
                        value={credEmail}
                        onChange={e => setCredEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">
                        {credHasProfile ? 'Reset Password (leave empty to keep current)' : 'Account Password *'}
                      </label>
                      <input
                        className="input w-full text-sm"
                        type="password"
                        placeholder={credHasProfile ? "Enter new password if changing" : "Create password (default 'hms12345')"}
                        value={credPassword}
                        onChange={e => setCredPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Phone Number</label>
                      <input
                        className="input w-full text-sm"
                        placeholder="+91 XXXXX XXXXX"
                        value={credPhone}
                        onChange={e => setCredPhone(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Medical Registration Number</label>
                      <input
                        className="input w-full text-sm"
                        placeholder="MCI-XXXXXX"
                        value={credRegNum}
                        onChange={e => setCredRegNum(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      className="btn text-sm py-2 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
                      onClick={handleSetDoctorCredentialsDirect}
                      disabled={credSaving}
                    >
                      {credSaving ? 'Saving…' : credHasProfile ? 'Update Credentials' : 'Provision Credentials'}
                    </button>
                    <button
                      className="btn bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm py-2 px-5 border border-slate-700"
                      onClick={() => {
                        setShowManageCredentials(false)
                        setCredDoctorId(0)
                        setCredEmail('')
                        setCredPassword('')
                        setCredPhone('')
                        setCredRegNum('')
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {loading && !summary ? (
            <div className="text-center py-10 text-slate-400">Loading dashboard…</div>
          ) : summary ? (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <StatCard icon={<Users size={22} className="text-cyan-400" />} label="Total Patients" value={summary.total_patients} color="bg-cyan-500/10 border-cyan-500/30" />
                <StatCard icon={<Stethoscope size={22} className="text-violet-400" />} label="Total Doctors" value={summary.total_doctors} color="bg-violet-500/10 border-violet-500/30" />
                <StatCard icon={<CalendarCheck size={22} className="text-emerald-400" />} label="Total Appointments" value={summary.total_appointments} color="bg-emerald-500/10 border-emerald-500/30" />
              </div>

              {/* Doctor Workload — with delete button */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Doctor Appointment Workload</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {summary.appointments_by_doctor.map(d => (
                    <div key={d.id} className="rounded-xl border border-slate-700 bg-slate-800/40 p-4 flex items-center gap-3 group">
                      <div className="rounded-lg bg-violet-500/15 p-2 shrink-0"><Stethoscope size={18} className="text-violet-400" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-100 truncate">{d.name}</p>
                        <p className="text-xs text-slate-400 truncate">{d.specialization}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <p className="text-xl font-bold text-cyan-300">{d.total}</p>
                          <p className="text-xs text-slate-500">appts</p>
                        </div>
                        <button
                          onClick={() => setDeleteTarget({ id: d.id, name: d.name })}
                          title="Remove doctor"
                          className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg bg-red-500/10 border border-red-500/20 p-1.5 text-red-400 hover:bg-red-500/25 hover:text-red-300"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Doctors by Specialization ── */}
              <div className="mb-6 rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 sm:p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <div className="rounded-xl bg-violet-500/15 p-2"><Stethoscope size={18} className="text-violet-400" /></div>
                  <div>
                    <h3 className="font-semibold text-slate-100">Doctors by Specialization</h3>
                    <p className="text-xs text-slate-400">Click a specialty to expand · click key icon to set login credentials</p>
                  </div>
                </div>
                <DoctorsBySpecialization 
                  summary={summary} 
                  onDeleteDoctor={setDeleteTarget} 
                  onManageCredentials={setCredentialsTarget}
                />
              </div>

              {/* ── Appointment Analysis ── */}
              <div className="mb-6 rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 sm:p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <div className="rounded-xl bg-indigo-500/15 p-2"><TrendingUp size={18} className="text-indigo-400" /></div>
                  <div>
                    <h3 className="font-semibold text-slate-100">Appointment Analysis</h3>
                    <p className="text-xs text-slate-400">Multi-view analytics — trend, by doctor, specialty, status</p>
                  </div>
                </div>
                <AppointmentAnalysis summary={summary} />
              </div>

              {/* Recent Appointments Table */}
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent Appointments</h3>
                {summary.recent_appointments.length === 0 ? (
                  <p className="text-slate-500 text-sm">No appointments yet.</p>
                ) : (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-700">
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
                                <AppointmentStatusBadge status={a.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                      {summary.recent_appointments.map(a => (
                        <div key={a.id} className="rounded-xl border border-slate-700 bg-slate-800/40 p-4 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-semibold text-slate-100 text-sm">{a.patient_name}</p>
                              <p className="text-xs text-cyan-300 font-mono">{a.patient_id_code}</p>
                            </div>
                            <AppointmentStatusBadge status={a.status} />
                          </div>
                          <div className="border-t border-slate-700/50 pt-2 grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-slate-400">Doctor</p>
                              <p className="text-slate-200 font-medium">{a.doctor_name}</p>
                              <p className="text-slate-500 text-xs">{a.doctor_specialization}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Date</p>
                              <p className="text-slate-300 font-medium">{a.date}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* ── Doctor Registration Approvals ── */}
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 sm:p-6 shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Stethoscope size={18} className="text-violet-400" />
              <h3 className="font-semibold text-slate-100">Doctor Registrations</h3>
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
                All
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
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-semibold text-slate-100 truncate">{dp.doctor_name}</p>
                        <StatusPill status={dp.status} />
                      </div>
                      <p className="text-sm text-violet-300">{dp.specialization} · <span className="text-emerald-300">₹{dp.consultation_fee}</span></p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{dp.email}{dp.phone ? ` · ${dp.phone}` : ''}</p>
                      {dp.registration_number && <p className="text-xs text-slate-500 mt-0.5">Reg: {dp.registration_number}</p>}
                      <p className="text-xs text-slate-600 mt-1">Registered: {dp.created_at.split('T')[0]}</p>
                    </div>
                    <div className="flex gap-2 shrink-0 flex-wrap">
                      {dp.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproval(dp.id, 'approve')}
                            disabled={actionLoading[dp.id]}
                            className="flex items-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50">
                            <CheckCircle size={13} /> {actionLoading[dp.id] ? '…' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleApproval(dp.id, 'reject')}
                            disabled={actionLoading[dp.id]}
                            className="flex items-center gap-1.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50">
                            <XCircle size={13} /> Reject
                          </button>
                        </>
                      )}
                      {/* Remove doctor button — always visible */}
                      <button
                        onClick={() => setDeleteTarget({ id: dp.doctor_id, name: dp.doctor_name })}
                        className="flex items-center gap-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 px-3 py-1.5 text-xs font-semibold transition">
                        <Trash2 size={13} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Credentials Modal Mount */}
        {credentialsTarget && (
          <CredentialsModal
            doctor={credentialsTarget}
            onConfirm={handleSaveCredentials}
            onCancel={() => setCredentialsTarget(null)}
            loading={credentialsLoading}
          />
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
    <div className={`rounded-xl border p-4 sm:p-5 flex items-center gap-3 sm:gap-4 ${color}`}>
      <div className="rounded-lg bg-slate-900/40 p-2 sm:p-3 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-2xl sm:text-3xl font-bold text-slate-100">{value}</p>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

function AppointmentStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    scheduled: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
    completed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    cancelled: 'bg-red-500/15 text-red-300 border-red-500/25',
    requested: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
    'in-progress': 'bg-violet-500/15 text-violet-300 border-violet-500/25',
    processed: 'bg-teal-500/15 text-teal-300 border-teal-500/25',
  }
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium shrink-0 inline-block capitalize ${map[status] ?? 'bg-slate-700 border-slate-600 text-slate-400'}`}>
      {status}
    </span>
  )
}

function CredentialsModal({
  doctor,
  onConfirm,
  onCancel,
  loading,
}: {
  doctor: { id: number; name: string }
  onConfirm: (data: { email: string; password?: string; phone?: string; regNumber?: string }) => void
  onCancel: () => void
  loading: boolean
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [regNumber, setRegNumber] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onCancel} />
      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-indigo-500/30 bg-slate-900 shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-xl bg-indigo-500/15 p-2.5">
            <Key size={20} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm">Set Doctor Credentials</h3>
            <p className="text-xs text-slate-400">Give doctor direct login access</p>
          </div>
        </div>
        
        <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Doctor</p>
        <p className="text-sm font-bold text-slate-200 mb-4">{doctor.name}</p>
        
        {errorMsg && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1.5 mb-4">{errorMsg}</p>
        )}

        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Email address *</label>
            <input 
              type="email"
              className="input w-full text-sm"
              placeholder="e.g. doctor@hospital.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Password (leave blank for 'hms12345')</label>
            <input 
              type="password"
              className="input w-full text-sm"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Phone (optional)</label>
              <input 
                type="text"
                className="input w-full text-sm"
                placeholder="Phone number"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Registration # (optional)</label>
              <input 
                type="text"
                className="input w-full text-sm"
                placeholder="Reg number"
                value={regNumber}
                onChange={e => setRegNumber(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!email.trim()) {
                setErrorMsg('Email address is required')
                return
              }
              onConfirm({ email, password, phone, regNumber })
            }}
            disabled={loading}
            className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/40 px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Saving…' : 'Save Credentials'}
          </button>
        </div>
      </div>
    </div>
  )
}
