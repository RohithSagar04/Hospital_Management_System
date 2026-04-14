import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Activity, Lock, UserRound, Stethoscope, FlaskConical, Pill, CreditCard, Eye, EyeOff } from 'lucide-react'
import { loginPatient } from '../api'

export default function LoginPage() {
  const navigate = useNavigate()
  const [patientId, setPatientId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await loginPatient(patientId.trim().toUpperCase(), password)
      localStorage.setItem('hms_patient', JSON.stringify(res.data))
      navigate('/')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Login failed. Please check your Patient ID and password.')
    }
    setLoading(false)
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
            Welcome<br />back, <span className="text-cyan-400">Patient.</span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-10">
            Log in with your Patient ID and password to access your medical history, appointments, prescriptions, and more.
          </p>
          <div className="space-y-5">
            {[
              { icon: <Stethoscope size={18} className="text-violet-400" />, label: 'Book Doctor Appointments', bg: 'bg-violet-500/10' },
              { icon: <FlaskConical size={18} className="text-blue-400" />, label: 'View Lab Test Results', bg: 'bg-blue-500/10' },
              { icon: <Pill size={18} className="text-green-400" />, label: 'Track Prescriptions', bg: 'bg-green-500/10' },
              { icon: <CreditCard size={18} className="text-rose-400" />, label: 'View & Pay Bills', bg: 'bg-rose-500/10' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-3">
                <div className={`rounded-xl ${f.bg} p-2.5 shrink-0`}>{f.icon}</div>
                <p className="text-sm font-medium text-slate-300">{f.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-600">© 2026 Hospital Management System</p>
      </div>

      {/* ── Right login panel ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="rounded-xl bg-cyan-500/20 p-2"><Activity size={20} className="text-cyan-400" /></div>
            <p className="font-bold text-slate-100">Hospital Management System</p>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-xl bg-cyan-500/15 p-2"><Lock size={22} className="text-cyan-400" /></div>
            <h2 className="text-2xl font-bold text-slate-100">Patient Login</h2>
          </div>
          <p className="text-slate-400 text-sm mb-8 ml-1">Sign in to access your personal health dashboard.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Patient ID */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Patient ID <span className="text-slate-500">(generated during registration)</span>
              </label>
              <div className="relative">
                <UserRound size={16} className="absolute left-3 top-3.5 text-slate-500 pointer-events-none" />
                <input
                  className="input w-full pl-9 font-mono tracking-wider uppercase placeholder:normal-case placeholder:tracking-normal"
                  placeholder="PT-123456"
                  value={patientId}
                  onChange={e => setPatientId(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <p className="mt-1 text-xs text-slate-600">Your Patient ID starts with PT- and was shown when you registered.</p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3.5 text-slate-500 pointer-events-none" />
                <input
                  className="input w-full pl-9 pr-10"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button className="btn w-full py-3 text-base font-semibold" disabled={loading}>
              {loading ? 'Signing in…' : 'Login to Dashboard →'}
            </button>
          </form>

          {/* Forgot hint */}
          <div className="mt-4 rounded-xl bg-slate-800/40 border border-slate-700/40 px-4 py-3 text-xs text-slate-500">
            <span className="text-slate-400 font-medium">Forgot your Patient ID?</span> Your ID (PT-XXXXXX) was
            displayed on the registration success screen. Contact the hospital reception desk for assistance.
          </div>

          <p className="mt-5 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-medium transition">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
