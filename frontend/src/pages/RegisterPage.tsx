import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Activity, UserRound, BadgeCheck, Stethoscope, Pill, FlaskConical, CreditCard, Lock, Eye, EyeOff } from 'lucide-react'
import { registerPatient, type Patient } from '../api'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [registered, setRegistered] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.'); return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.'); return
    }
    setLoading(true); setError('')
    try {
      const token = Math.floor(1000 + Math.random() * 9000)
      const patientId = `PT-${Date.now().toString().slice(-6)}`
      const res = await registerPatient({ name, age: Number(age), gender, phone, address, patient_id: patientId, token_number: token, password })
      localStorage.setItem('hms_patient', JSON.stringify(res.data))
      setRegistered(res.data)
      setTimeout(() => navigate('/'), 3000)
    } catch {
      setError('Registration failed. Please check your details and try again.')
    }
    setLoading(false)
  }

  if (registered) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <div className="rounded-full bg-emerald-500/15 border border-emerald-500/30 p-6 inline-flex mb-5">
            <BadgeCheck size={52} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Registration Successful!</h2>
          <p className="text-slate-400 mb-4 text-sm">
            Save your <span className="text-cyan-300 font-semibold">Patient ID</span> — you'll need it along with your password to log in.
          </p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[['Patient ID', registered.patient_id], ['Token No.', String(registered.token_number)], ['Full Name', registered.name], ['Age', `${registered.age} yrs`]].map(([l, v]) => (
              <div key={l} className="rounded-xl bg-slate-800/60 border border-slate-700 p-4 text-center">
                <p className="text-xs text-slate-400 mb-1">{l}</p>
                <p className="font-bold text-cyan-300 break-all">{v}</p>
              </div>
            ))}
          </div>
          <p className="text-slate-500 text-sm animate-pulse">Redirecting to your dashboard…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 p-12">
        <div>
          <div className="flex items-center gap-3 mb-14">
            <div className="rounded-xl bg-cyan-500/20 p-2.5"><Activity size={24} className="text-cyan-400" /></div>
            <div>
              <p className="font-bold text-slate-100 leading-tight">Hospital Management System</p>
              <p className="text-xs text-slate-500">Integrated Patient Care</p>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-100 leading-tight mb-4">
            Your health,<br />our <span className="text-cyan-400">priority.</span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-10">
            Register once to access all hospital services — doctor consultations, lab diagnostics, pharmacy and billing — all in one place.
          </p>
          <div className="space-y-5">
            {[
              { icon: <Stethoscope size={18} className="text-violet-400" />, label: 'Doctor Consultations', desc: 'Book appointments with specialists', bg: 'bg-violet-500/10' },
              { icon: <FlaskConical size={18} className="text-blue-400" />, label: 'Diagnostic Tests', desc: 'Track lab results and reports', bg: 'bg-blue-500/10' },
              { icon: <Pill size={18} className="text-green-400" />, label: 'Pharmacy', desc: 'Prescription fulfilment & tracking', bg: 'bg-green-500/10' },
              { icon: <CreditCard size={18} className="text-rose-400" />, label: 'Billing', desc: 'Consolidated bills, one view', bg: 'bg-rose-500/10' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-3">
                <div className={`rounded-xl ${f.bg} p-2.5 shrink-0`}>{f.icon}</div>
                <div>
                  <p className="text-sm font-medium text-slate-200">{f.label}</p>
                  <p className="text-xs text-slate-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-600">© 2026 Hospital Management System</p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="rounded-xl bg-cyan-500/20 p-2"><Activity size={20} className="text-cyan-400" /></div>
            <p className="font-bold text-slate-100">Hospital Management System</p>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-xl bg-cyan-500/15 p-2"><UserRound size={22} className="text-cyan-400" /></div>
            <h2 className="text-2xl font-bold text-slate-100">Patient Registration</h2>
          </div>
          <p className="text-slate-400 text-sm mb-8 ml-1">Create your account to access all hospital services.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name *</label>
              <input className="input w-full" placeholder="e.g. Rajesh Kumar" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Age *</label>
                <input className="input w-full" type="number" placeholder="25" value={age} onChange={e => setAge(e.target.value)} required min="0" max="150" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Gender</label>
                <select className="input w-full" value={gender} onChange={e => setGender(e.target.value)}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Phone Number</label>
              <input className="input w-full" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Address</label>
              <textarea className="input w-full h-16 resize-none" placeholder="Your home address" value={address} onChange={e => setAddress(e.target.value)} />
            </div>

            {/* Password */}
            <div className="pt-1 border-t border-slate-800">
              <p className="text-xs font-semibold text-slate-400 mb-3 flex items-center gap-1.5">
                <Lock size={12} /> Create a Password <span className="text-slate-600 font-normal">(used to log in later)</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Password * <span className="text-slate-600">(min 6 chars)</span></label>
                  <div className="relative">
                    <input className="input w-full pr-9" type={showPwd ? 'text' : 'password'}
                      placeholder="Create password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                    <button type="button" onClick={() => setShowPwd(v => !v)}
                      className="absolute right-2.5 top-3 text-slate-500 hover:text-slate-300 transition">
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Confirm Password *</label>
                  <div className="relative">
                    <input className={`input w-full pr-9 ${confirmPassword && confirmPassword !== password ? 'border-red-500/50' : ''}`}
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Repeat password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-2.5 top-3 text-slate-500 hover:text-slate-300 transition">
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-xs text-red-400 mt-1">Passwords don't match</p>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <p className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400">{error}</p>
            )}
            <button className="btn w-full py-3 text-base font-semibold" disabled={loading}>
              {loading ? 'Registering…' : 'Register & Go to Dashboard →'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
