import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ShieldAlert, Lock, Eye, EyeOff, LayoutDashboard, User } from 'lucide-react'
import { loginAdmin } from '../api'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('Please provide both username and password.')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await loginAdmin(username, password)
      if (res.data.is_admin) {
        // Clear conflicting user sessions to enforce strict boundary
        localStorage.removeItem('hms_patient')
        localStorage.removeItem('hms_doctor')
        
        // Save the authenticated admin state
        localStorage.setItem('hms_admin', 'true')
        localStorage.setItem('hms_admin_user', res.data.username)
        
        // Dispatch window storage event to force header rerender
        window.dispatchEvent(new Event('storage'))
        
        // Redirect to admin dashboard
        navigate('/admin')
      } else {
        setError('Unauthorized access. Administrative permissions required.')
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.error || 
        'Invalid credentials. Please verify your administrator username and password.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Premium backdrop clinical center image */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20 bg-cover bg-center filter blur-[2px]"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=80')` }}
      />
      
      {/* Decorative ambient lighting */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-slate-900/80 border border-slate-700/60 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="rounded-2xl bg-indigo-500/15 border border-indigo-500/30 p-3.5 inline-flex mb-4">
            <LayoutDashboard size={32} className="text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Admin Control Center</h2>
          <p className="text-slate-400 text-xs mt-1">Hospital Management Operator Authentication</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
              <User size={12} className="text-slate-500" /> Administrator Username *
            </label>
            <input
              className="input w-full"
              placeholder="e.g. admin"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
              <Lock size={12} className="text-slate-500" /> Security Password *
            </label>
            <div className="relative">
              <input
                className="input w-full pr-9"
                type={showPwd ? 'text' : 'password'}
                placeholder="Enter admin password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-2.5 top-3 text-slate-500 hover:text-slate-300 transition"
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs text-red-400 flex items-start gap-2">
              <ShieldAlert size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            className="btn w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold flex items-center justify-center gap-2 border-indigo-500/30"
            disabled={loading}
          >
            {loading ? 'Authenticating…' : 'Access Dashboard →'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500">
            For development access, use fallback credentials:
            <br />
            <span className="font-mono text-cyan-400 font-semibold bg-cyan-950/40 border border-cyan-800/30 rounded px-1 py-0.5 mt-1 inline-block">
              admin / admin123
            </span>
          </p>
          <div className="mt-4">
            <Link to="/" className="text-slate-400 hover:text-slate-200 transition text-xs">
              ← Return to Main Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
