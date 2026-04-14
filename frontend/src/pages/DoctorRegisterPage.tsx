import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Activity, Stethoscope, BadgeCheck, Lock, Eye, EyeOff, Mail, Phone, Hash, IndianRupee } from 'lucide-react'
import { registerDoctor } from '../api'

export default function DoctorRegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', specialization: '', email: '', phone: '',
    registration_number: '', consultation_fee: '', password: '', confirmPassword: '',
  })
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true); setError('')
    try {
      await registerDoctor({
        name: form.name, specialization: form.specialization,
        email: form.email, phone: form.phone,
        registration_number: form.registration_number,
        consultation_fee: Number(form.consultation_fee) || 0,
        password: form.password,
      })
      setSuccess(true)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Registration failed. Please try again.')
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <div className="rounded-full bg-amber-500/15 border border-amber-500/30 p-6 inline-flex mb-5">
            <BadgeCheck size={52} className="text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Registration Submitted!</h2>
          <p className="text-slate-400 text-sm mb-6">
            Your account is <span className="text-amber-300 font-semibold">pending admin approval</span>.
            You will be able to log in once the admin approves your registration.
          </p>
          <Link to="/doctor-login" className="btn px-8 py-3 text-base font-semibold inline-block">
            Go to Doctor Login →
          </Link>
        </div>
      </div>
    )
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
            Join our <span className="text-violet-400">medical team.</span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Register your credentials. Once approved by the hospital admin, you'll get full access to patient records, appointments, prescriptions, and diagnostics.
          </p>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <p className="text-xs text-amber-300 font-semibold mb-1">⏳ Approval Required</p>
            <p className="text-xs text-slate-400">Your registration will be reviewed by the admin before you can log in. This typically takes 1–2 business days.</p>
          </div>
        </div>
        <p className="text-xs text-slate-600">© 2026 Hospital Management System</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-lg py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-xl bg-violet-500/15 p-2"><Stethoscope size={22} className="text-violet-400" /></div>
            <h2 className="text-2xl font-bold text-slate-100">Doctor Registration</h2>
          </div>
          <p className="text-slate-400 text-sm mb-6 ml-1">Fill in your details to request access to the doctor portal.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name *</label>
                <input className="input w-full" placeholder="Dr. Arjun Mehta" value={form.name} onChange={set('name')} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Specialization *</label>
                <input className="input w-full" placeholder="Cardiology" value={form.specialization} onChange={set('specialization')} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5"><Mail size={11} className="inline mr-1" />Email *</label>
                <input className="input w-full" type="email" placeholder="doctor@hospital.com" value={form.email} onChange={set('email')} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5"><Phone size={11} className="inline mr-1" />Phone</label>
                <input className="input w-full" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5"><Hash size={11} className="inline mr-1" />Medical Reg. Number</label>
                <input className="input w-full" placeholder="MCI-XXXXXX" value={form.registration_number} onChange={set('registration_number')} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5"><IndianRupee size={11} className="inline mr-1" />Consultation Fee (₹)</label>
                <input className="input w-full" type="number" placeholder="500" min="0" value={form.consultation_fee} onChange={set('consultation_fee')} />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <p className="text-xs font-semibold text-slate-400 mb-3 flex items-center gap-1.5"><Lock size={12} /> Set Login Password</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Password * <span className="text-slate-600">(min 6)</span></label>
                  <div className="relative">
                    <input className="input w-full pr-9" type={showPwd ? 'text' : 'password'} placeholder="Create password" value={form.password} onChange={set('password')} required minLength={6} />
                    <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-2.5 top-3 text-slate-500 hover:text-slate-300 transition">{showPwd ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Confirm Password *</label>
                  <div className="relative">
                    <input className={`input w-full pr-9 ${form.confirmPassword && form.confirmPassword !== form.password ? 'border-red-500/50' : ''}`} type={showConfirm ? 'text' : 'password'} placeholder="Repeat password" value={form.confirmPassword} onChange={set('confirmPassword')} required />
                    <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-2.5 top-3 text-slate-500 hover:text-slate-300 transition">{showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                  </div>
                  {form.confirmPassword && form.confirmPassword !== form.password && <p className="text-xs text-red-400 mt-1">Passwords don't match</p>}
                </div>
              </div>
            </div>

            {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{error}</div>}

            <button className="btn w-full py-3 text-base font-semibold" disabled={loading}>
              {loading ? 'Submitting…' : 'Submit Registration →'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            Already registered?{' '}
            <Link to="/doctor-login" className="text-violet-400 hover:text-violet-300 font-medium transition">Login here</Link>
          </p>
          <p className="mt-2 text-center text-sm text-slate-500">
            <Link to="/" className="text-slate-500 hover:text-slate-300 transition text-xs">← Back to main dashboard</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
