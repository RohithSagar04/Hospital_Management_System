import { useMemo, useState, useEffect } from 'react'
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { Activity, CreditCard, FlaskConical, LayoutDashboard, Pill, Stethoscope, UserRound, UserPlus, LogOut, LogIn } from 'lucide-react'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DoctorLoginPage from './pages/DoctorLoginPage'
import DoctorRegisterPage from './pages/DoctorRegisterPage'
import PatientDashboard from './pages/PatientDashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import PharmacyDashboard from './pages/PharmacyDashboard'
import DiagnosisDashboard from './pages/DiagnosisDashboard'
import BillingDashboard from './pages/BillingDashboard'
import AdminDashboard from './pages/AdminDashboard'

const navItems = [
  { to: '/', label: 'Patient', icon: <UserRound size={16} /> },
  { to: '/doctor', label: 'Doctor', icon: <Stethoscope size={16} /> },
  { to: '/pharmacy', label: 'Pharmacy', icon: <Pill size={16} /> },
  { to: '/diagnosis', label: 'Diagnosis', icon: <FlaskConical size={16} /> },
  { to: '/billing', label: 'Billing', icon: <CreditCard size={16} /> },
  { to: '/admin', label: 'Admin', icon: <LayoutDashboard size={16} /> },
]

// ── Sidebar + header layout (used by all dashboard pages) ──────────────────
function MainApp() {
  const activeClass = useMemo(
    () => 'flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3 py-2 text-cyan-300',
    [],
  )
  const navigate = useNavigate()

  // Re-read localStorage whenever the component re-renders (catches logout from child pages)
  const [patientKey, setPatientKey] = useState(0)
  useEffect(() => {
    const handler = () => setPatientKey(k => k + 1)
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const storedPatient = localStorage.getItem('hms_patient')
  const patient = storedPatient ? JSON.parse(storedPatient) as { name: string; patient_id: string } : null

  const storedDoctor = localStorage.getItem('hms_doctor')
  const doctorSession = storedDoctor
    ? (JSON.parse(storedDoctor) as { profile: { doctor_name: string; specialization: string }; doctor: { id: number } })
    : null

  const handleDoctorLogout = () => {
    localStorage.removeItem('hms_doctor')
    setPatientKey(k => k + 1)
    navigate('/doctor-login')
  }

  const handleLogout = () => {
    localStorage.removeItem('hms_patient')
    setPatientKey(k => k + 1)   // force header re-render
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" key={patientKey}>
      {/* ── Sticky Header ── */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-500/20 p-2">
              <Activity size={20} className="text-cyan-400" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-100 leading-tight">Hospital Management System</h1>
              <p className="text-xs text-slate-500">React · Django · MySQL</p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Online
            </span>

            {patient ? (
              /* ── Logged-in patient pill + Logout ── */
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 pl-2 pr-3 py-1">
                  <div className="rounded-full bg-cyan-500/30 p-1"><UserRound size={11} className="text-cyan-300" /></div>
                  <div className="leading-tight">
                    <p className="text-xs font-semibold text-cyan-300 leading-none">{patient.name}</p>
                    <p className="text-[10px] text-slate-500 leading-none mt-0.5">{patient.patient_id}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout / Switch Patient"
                  className="flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 hover:text-red-300 transition font-medium">
                  <LogOut size={12} /> Logout
                </button>
              </div>
            ) : (
              /* ── No patient — Login + Register buttons ── */
              <div className="flex items-center gap-2">
                <button onClick={() => navigate('/login')}
                  className="flex items-center gap-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 px-3 py-1.5 text-xs text-cyan-300 hover:bg-cyan-500/25 transition font-medium">
                  <LogIn size={12} /> Login
                </button>
                <button onClick={() => navigate('/register')}
                  className="hidden sm:flex items-center gap-1.5 rounded-full bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition font-medium">
                  <UserPlus size={12} /> Register
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Page layout ── */}
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 md:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="h-fit rounded-2xl border border-slate-800 bg-slate-900/60 p-3 sticky top-20">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Dashboards</p>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}
                className={({ isActive }) =>
                  isActive ? activeClass
                    : 'flex items-center gap-2 rounded-xl px-3 py-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100'
                }>
                {item.icon}
                <span className="text-sm">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Patient card in sidebar */}
          {patient ? (
            <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                <UserRound size={13} className="text-cyan-400" />
                <span className="text-xs font-semibold text-cyan-300">Active Patient</span>
              </div>
              <p className="text-sm font-bold text-slate-100 truncate">{patient.name}</p>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{patient.patient_id}</p>
              <button onClick={handleLogout}
                className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 transition">
                <LogOut size={11} /> Logout / Switch Patient
              </button>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-cyan-500/30 bg-cyan-500/5 p-3 text-center space-y-2">
              <p className="text-xs text-slate-400">Patient portal</p>
              <button onClick={() => navigate('/login')}
                className="btn text-xs py-1.5 w-full flex items-center justify-center gap-1.5">
                <LogIn size={11} /> Login
              </button>
              <button onClick={() => navigate('/register')}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition">
                <UserPlus size={11} /> New? Register
              </button>
            </div>
          )}

          {/* Doctor card in sidebar */}
          {doctorSession ? (
            <div className="mt-3 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Stethoscope size={13} className="text-violet-400" />
                <span className="text-xs font-semibold text-violet-300">Active Doctor</span>
              </div>
              <p className="text-sm font-bold text-slate-100 truncate">{doctorSession.profile.doctor_name}</p>
              <p className="text-xs text-slate-400 mt-0.5 truncate">{doctorSession.profile.specialization}</p>
              <button onClick={handleDoctorLogout}
                className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 transition">
                <LogOut size={11} /> Doctor Logout
              </button>
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-violet-500/20 bg-violet-500/5 p-3 text-center space-y-2">
              <p className="text-xs text-slate-400">Doctor portal</p>
              <button onClick={() => navigate('/doctor-login')}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-violet-600/20 border border-violet-500/30 px-3 py-1.5 text-xs text-violet-300 hover:bg-violet-600/30 transition font-medium">
                <LogIn size={11} /> Doctor Login
              </button>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="min-w-0">
          <Routes>
            <Route path="/" element={<PatientDashboard />} />
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="/pharmacy" element={<PharmacyDashboard />} />
            <Route path="/diagnosis" element={<DiagnosisDashboard />} />
            <Route path="/billing" element={<BillingDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

// ── Root: full-page auth routes first, then MainApp for everything else ──────
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/doctor-login" element={<DoctorLoginPage />} />
      <Route path="/doctor-register" element={<DoctorRegisterPage />} />
      <Route path="/*" element={<MainApp />} />
    </Routes>
  )
}



