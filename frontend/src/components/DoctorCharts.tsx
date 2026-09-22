import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts'
import { TrendingUp, Activity, PieChart as PieIcon, BarChart2, Radar as RadarIcon, Trash2, Key } from 'lucide-react'
import type { AdminSummary } from '../api'

// ── Palette ────────────────────────────────────────────────────────────────
const PALETTE = [
  '#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444',
  '#06b6d4', '#8b5cf6', '#f97316', '#14b8a6', '#a855f7',
]

const STATUS_COLORS: Record<string, string> = {
  scheduled: '#f59e0b',
  completed: '#10b981',
  cancelled: '#ef4444',
  pending:   '#6366f1',
}

const DEPARTMENT_IMAGES: Record<string, string> = {
  cardiology: 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?auto=format&fit=crop&w=600&q=80',
  neurology: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=600&q=80',
  pediatrics: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=600&q=80',
  orthopedics: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80',
  dermatology: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
  'general medicine': 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
  general: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
  gynecology: 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?auto=format&fit=crop&w=600&q=80',
  ophthalmology: 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?auto=format&fit=crop&w=600&q=80',
  oncology: 'https://images.unsplash.com/photo-1579154204601-01588f35116f?auto=format&fit=crop&w=600&q=80',
  psychiatry: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80',
  ent: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&w=600&q=80',
  default: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
}

// ── Shared tooltip style ───────────────────────────────────────────────────
const tooltipStyle = {
  contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0', fontSize: 12 },
  itemStyle: { color: '#94a3b8' },
  labelStyle: { color: '#cbd5e1', fontWeight: 600 },
}

// ── Custom label for pie ───────────────────────────────────────────────────
const renderPieLabel = ({ name, percent }: any) =>
  percent && percent > 0.04 ? `${name} ${(percent * 100).toFixed(0)}%` : ''

interface Props {
  summary: AdminSummary
  onDeleteDoctor?: (target: { id: number; name: string }) => void
  onManageCredentials?: (doctor: { id: number; name: string }) => void
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. DOCTORS BY SPECIALIZATION BLOCK
// ══════════════════════════════════════════════════════════════════════════════
export function DoctorsBySpecialization({ summary, onDeleteDoctor, onManageCredentials }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (!summary.doctors_by_specialization?.length) {
    return (
      <p className="text-slate-500 text-sm text-center py-6">No doctor data available.</p>
    )
  }

  return (
    <div className="space-y-3">
      {summary.doctors_by_specialization.map((group, gi) => {
        const imgUrl = DEPARTMENT_IMAGES[group.specialization.toLowerCase()] || DEPARTMENT_IMAGES.default
        const color = PALETTE[gi % PALETTE.length]
        const isOpen = expanded === group.specialization
        return (
          <div
            key={group.specialization}
            className="rounded-xl border border-slate-700 bg-slate-800/40 overflow-hidden transition-all shadow-md"
          >
            {/* Header row — click to expand */}
            <button
              className="w-full relative flex items-center justify-between px-5 py-5 transition text-left overflow-hidden group/item"
              onClick={() => setExpanded(isOpen ? null : group.specialization)}
            >
              {/* Realistic Background Image with Hover Scale */}
              <div 
                className="absolute inset-0 transition-transform duration-700 ease-out group-hover/item:scale-105 pointer-events-none"
                style={{
                  backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.95) 25%, rgba(15, 23, 42, 0.6) 75%, rgba(15, 23, 42, 0.3) 100%), url(${imgUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              
              <div className="relative z-10 flex items-center gap-3">
                <span
                  className="inline-flex items-center justify-center rounded-lg w-8 h-8 shrink-0 text-white text-xs font-bold shadow-inner"
                  style={{ background: color + '33', border: `1px solid ${color}55`, color }}
                >
                  {group.doctors.length}
                </span>
                <div>
                  <p className="font-semibold text-slate-100 text-sm">{group.specialization}</p>
                  <p className="text-xs text-slate-300">
                    {group.doctors.length} doctor{group.doctors.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <svg
                className={`relative z-10 w-4 h-4 text-slate-300 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Expanded doctor list */}
            {isOpen && (
              <div className="border-t border-slate-700/60 divide-y divide-slate-700/40">
                {group.doctors.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-800/30 transition group/doc">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="rounded-full w-7 h-7 flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{ background: color + '22', color }}
                      >
                        {doc.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-100">{doc.name}</p>
                        <p className="text-xs text-slate-500">{doc.designation}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                        ₹{doc.consultation_fee}
                      </span>
                      {onManageCredentials && (
                        <button
                          onClick={() => onManageCredentials({ id: doc.id, name: doc.name })}
                          title="Manage Login Credentials"
                          className="opacity-0 group-hover/doc:opacity-100 transition-opacity rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-1.5 text-indigo-400 hover:bg-indigo-500/25 hover:text-indigo-300"
                        >
                          <Key size={12} />
                        </button>
                      )}
                      {onDeleteDoctor && (
                        <button
                          onClick={() => onDeleteDoctor({ id: doc.id, name: doc.name })}
                          title="Remove doctor"
                          className="opacity-0 group-hover/doc:opacity-100 transition-opacity rounded-lg bg-red-500/10 border border-red-500/20 p-1.5 text-red-400 hover:bg-red-500/25 hover:text-red-300"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. APPOINTMENTS ANALYSIS CHARTS
// ══════════════════════════════════════════════════════════════════════════════
type ChartTab = 'trend' | 'byDoctor' | 'bySpec' | 'byStatus' | 'radar'

const TABS: { id: ChartTab; label: string; icon: React.ReactNode }[] = [
  { id: 'trend',    label: 'Trend',       icon: <TrendingUp size={13} /> },
  { id: 'byDoctor', label: 'By Doctor',   icon: <BarChart2 size={13} /> },
  { id: 'bySpec',   label: 'By Specialty',icon: <PieIcon size={13} /> },
  { id: 'byStatus', label: 'By Status',   icon: <Activity size={13} /> },
  { id: 'radar',    label: 'Radar',       icon: <RadarIcon size={13} /> },
]

export function AppointmentAnalysis({ summary }: Props) {
  const [tab, setTab] = useState<ChartTab>('trend')

  const doctorData = [...(summary.appointments_by_doctor ?? [])]
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  const specData = (summary.appointments_by_specialization ?? []).map((s, i) => ({
    ...s,
    fill: PALETTE[i % PALETTE.length],
  }))

  const statusData = (summary.appointments_by_status ?? []).map(s => ({
    ...s,
    fill: STATUS_COLORS[s.status] ?? '#6366f1',
  }))

  const trendData = summary.appointments_trend ?? []

  // Radar: top 6 doctors by appointment count
  const radarData = doctorData.slice(0, 6).map(d => ({
    doctor: d.name.split(' ').slice(-1)[0], // last name only for brevity
    appointments: d.total,
  }))

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 text-xs font-semibold rounded-xl px-3 py-1.5 border transition ${
              tab === t.id
                ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── Trend line chart ── */}
      {tab === 'trend' && (
        <div>
          <p className="text-xs text-slate-500 mb-3">Daily appointment volume — last 30 days</p>
          {trendData.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-10">No appointment data in the last 30 days.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={d => d.slice(5)} // MM-DD
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} />
                <Tooltip {...tooltipStyle} labelFormatter={l => `Date: ${l}`} />
                <Line
                  type="monotone" dataKey="total" name="Appointments"
                  stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366f1' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* ── By Doctor bar chart ── */}
      {tab === 'byDoctor' && (
        <div>
          <p className="text-xs text-slate-500 mb-3">Top 10 doctors by total appointments</p>
          {doctorData.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-10">No appointment data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(260, doctorData.length * 38)}>
              <BarChart data={doctorData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} />
                <YAxis
                  dataKey="name" type="category"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  width={95}
                  tickFormatter={n => n.length > 14 ? n.slice(0, 13) + '…' : n}
                />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="total" name="Appointments" radius={[0, 6, 6, 0]}>
                  {doctorData.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* ── By Specialization pie ── */}
      {tab === 'bySpec' && (
        <div>
          <p className="text-xs text-slate-500 mb-3">Appointment distribution across specializations</p>
          {specData.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-10">No data yet.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={specData} dataKey="total" nameKey="specialization"
                    cx="50%" cy="50%" outerRadius={100} innerRadius={45}
                    label={renderPieLabel} labelLine={false}
                  >
                    {specData.map((s, i) => (
                      <Cell key={i} fill={s.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(v: any, n: any) => [v, n]}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="space-y-2">
                {specData.map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.fill }} />
                      <span className="text-xs text-slate-300 truncate">{s.specialization}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-100 shrink-0">{s.total}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── By Status donut ── */}
      {tab === 'byStatus' && (
        <div>
          <p className="text-xs text-slate-500 mb-3">Appointment status breakdown</p>
          {statusData.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-10">No data yet.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={statusData} dataKey="total" nameKey="status"
                    cx="50%" cy="50%" outerRadius={95} innerRadius={50}
                    label={({ name, percent }: any) => percent ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                    labelLine={false}
                  >
                    {statusData.map((s, i) => (
                      <Cell key={i} fill={s.fill} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {statusData.map((s, i) => {
                  const total = statusData.reduce((acc, x) => acc + x.total, 0)
                  const pct = total ? ((s.total / total) * 100).toFixed(1) : '0'
                  return (
                    <div key={i} className="rounded-xl border border-slate-700 bg-slate-800/40 p-3 flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: s.fill }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-100 capitalize">{s.status}</p>
                        <div className="mt-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: s.fill }} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-slate-100">{s.total}</p>
                        <p className="text-xs text-slate-500">{pct}%</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Radar chart ── */}
      {tab === 'radar' && (
        <div>
          <p className="text-xs text-slate-500 mb-3">Appointment load comparison — top 6 doctors</p>
          {radarData.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-10">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={110}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="doctor" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fill: '#475569', fontSize: 9 }} />
                <Radar
                  name="Appointments" dataKey="appointments"
                  stroke="#6366f1" fill="#6366f1" fillOpacity={0.25}
                />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  )
}

// ── Legacy export kept for any existing imports ────────────────────────────
export const DoctorCharts = ({ summary }: Props) => (
  <div className="space-y-6">
    <DoctorsBySpecialization summary={summary} />
    <AppointmentAnalysis summary={summary} />
  </div>
)
