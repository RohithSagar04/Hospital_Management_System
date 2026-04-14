import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Activity, Stethoscope, Lock, Mail, Eye, EyeOff, ClipboardList, Pill, FlaskConical, CalendarCheck } from 'lucide-react'
import { loginDoctor } from '../api'

export default function DoctorLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(''); setIsPending(false)
    try {
      const res = await loginDoctor(email.trim().toLowerCase(), password)
      localStorage.setItem('hms_doctor', JSON.stringify(res.data))
      navigate('/doctor')
    } catch (err: any) {
      const msg: string = err?.response?.data?.error || 'Login failed.'
      if (msg.toLowerCase().includes('pending')) setIsPending(true)
      setError(msg)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Left branding */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 p-12">
        <div>
          <div className="flex items-center gap-3 mb-14">
            <div className="rounded-xl bg-violet-500/20 p-2.5"><Stethoscope size={24} className="text-violet-400" /></div>
            <div>
              <p className="font-bold text-slate-100 leading-tight">Hospital Management System</p>
              <p className="text-xs text-slate-500">Doctor Portal</p>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-100 leading-tight mb-4">
            Welcome back,<br /><span className="text-violet-400">Doctor.</span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-10">
            Access your patient appointments, medical records, prescriptions, and lab reports from one unified dashboard.
          </p>
          <div className="space-y-4">
            {[
              { icon: <CalendarCheck size={17} className="text-violet-400" />, label: "View All Patient Appointments", bg: "bg-violet-500/10" },
              { icon: <ClipboardList size={17} className="text-cyan-400" />, label: "Add Consultation Notes", bg: "bg-cyan-500/10" },
              { icon: <Pill size={17} className="text-emerald-400" />, label: "Prescribe Medicines", bg: "bg-emerald-500/10" },
              { icon: <FlaskConical size={17} className="text-blue-400" />, label: "Order & Track Lab Tests", bg: "bg-blue-500/10" },
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

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="rounded-xl bg-violet-500/20 p-2"><Activity size={20} className="text-violet-400" /></div>
            <p className="font-bold text-slate-100">Hospital Management System</p>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-xl bg-violet-500/15 p-2"><Lock size={22} className="text-violet-400" /></div>
            <h2 className="text-2xl font-bold text-slate-100">Doctor Login</h2>
          </div>
          <p className="text-slate-400 text-sm mb-8 ml-1">Sign in with your registered email and password.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5"><Mail size={11} className="inline mr-1" />Email Address</label>
              <input className="input w-full" type="email" placeholder="doctor@hospital.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3.5 text-slate-500 pointer-events-none" />
                <input className="input w-full pl-9 pr-10" type={showPwd ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className={`rounded-xl border px-4 py-3 text-sm ${isPending ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                {isPending && <p className="font-semibold mb-1">⏳ Account Pending Approval</p>}
                {error}
              </div>
            )}

            <button className="btn w-full py-3 text-base font-semibold bg-violet-600 hover:bg-violet-500" disabled={loading}>
              {loading ? 'Signing in…' : 'Login to Doctor Dashboard →'}
            </button>
          </form>

          <div className="mt-4 rounded-xl bg-slate-800/40 border border-slate-700/40 px-4 py-3 text-xs text-slate-500">
            <span className="text-slate-400 font-medium">New doctor?</span> Register yourself and wait for admin approval before logging in.
          </div>

          <p className="mt-5 text-center text-sm text-slate-500">
            Not registered yet?{' '}
            <Link to="/doctor-register" className="text-violet-400 hover:text-violet-300 font-medium transition">Register as Doctor</Link>
          </p>
          <p className="mt-2 text-center">
            <Link to="/" className="text-xs text-slate-600 hover:text-slate-400 transition">← Back to main dashboard</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
