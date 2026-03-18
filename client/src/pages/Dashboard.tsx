import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, Stethoscope, GraduationCap, ClipboardCheck,
  FileText, Search, Megaphone, Activity, TrendingDown, TrendingUp,
  Minus, Clock, XCircle, ArrowRight, Users, MapPin, Zap
} from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from "recharts";

/* ── tipos ───────────────────────────────────────────────── */
type Period = "mes" | "trimestre" | "semestre" | "ano";

/* ── tooltip customizado ─────────────────────────────────── */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 px-3 py-2 text-xs shadow-xl" style={{ background: "#0D1526" }}>
      <p className="text-slate-400 mb-1 font-medium">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <span className="font-bold text-white">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

/* ── sparkline minúsculo ─────────────────────────────────── */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const d = data.map(v => ({ v }));
  return (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart data={d} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ── KPI card ────────────────────────────────────────────── */
interface KpiProps {
  title: string; value: string | number; subtitle: string;
  icon: any; accent: string; trend?: number; delay: number;
  sparkline?: number[];
}
function KpiCard({ title, value, subtitle, icon: Icon, accent, trend, delay, sparkline }: KpiProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}
      className="relative rounded-2xl p-5 overflow-hidden border border-white/5 hover:border-white/10 transition-all duration-300 group"
      style={{ background: "#0D1526" }}>
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 transition-opacity group-hover:opacity-20" style={{ background: accent }} />
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${accent}18` }}>
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${trend < 0 ? "text-emerald-400 bg-emerald-400/10" : trend > 0 ? "text-red-400 bg-red-400/10" : "text-slate-400 bg-slate-400/10"}`}>
            {trend < 0 ? <TrendingDown className="w-3 h-3" /> : trend > 0 ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {trend !== 0 ? `${Math.abs(trend)}%` : "—"}
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
      <div className="text-xs font-medium text-slate-300 mt-1">{title}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{subtitle}</div>
      {sparkline && sparkline.length > 0 && (
        <div className="mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
          <Sparkline data={sparkline} color={accent} />
        </div>
      )}
    </motion.div>
  );
}

/* ── card métrica especial (TF/TG) ──────────────────────── */
function MetricCard({ label, value, unit, desc, accent, icon: Icon, delay }: {
  label: string; value: number; unit: string; desc: string; accent: string; icon: any; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}
      className="relative rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all duration-300 overflow-hidden"
      style={{ background: "#0D1526" }}>
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-10" style={{ background: accent }} />
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${accent}18` }}>
          <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
        </div>
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
        <span className="text-xs text-slate-500">{unit}</span>
      </div>
      <p className="text-[11px] text-slate-600 mt-1 leading-snug">{desc}</p>
    </motion.div>
  );
}

/* ── section header ──────────────────────────────────────── */
function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

/* ── card shell ──────────────────────────────────────────── */
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/5 p-5 ${className}`} style={{ background: "#0D1526" }}>
      {children}
    </div>
  );
}

/* ── filtro de período ───────────────────────────────────── */
const PERIODS: { key: Period; label: string }[] = [
  { key: "mes",       label: "Mês" },
  { key: "trimestre", label: "Trimestre" },
  { key: "semestre",  label: "Semestre" },
  { key: "ano",       label: "Ano" },
];

function PeriodFilter({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl border border-white/8" style={{ background: "rgba(255,255,255,0.03)" }}>
      {PERIODS.map(p => (
        <button key={p.key} onClick={() => onChange(p.key)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${value === p.key ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:text-white"}`}>
          {p.label}
        </button>
      ))}
    </div>
  );
}

/* ── skeleton ────────────────────────────────────────────── */
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`rounded-lg bg-white/5 animate-pulse ${className}`} />;
}

/* ══════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [period, setPeriod] = useState<Period>("mes");
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery({ period });

  const accSparkline = stats?.accidentSparkline ?? [];

  const kpis = [
    { title: "Acidentes",       value: stats?.accidents   ?? 0, subtitle: "no período selecionado",       icon: AlertTriangle,  accent: "#EF4444", trend: undefined, delay: 0.05, sparkline: accSparkline },
    { title: "Doenças Ocup.",   value: stats?.diseases    ?? 0, subtitle: "diagnósticos no período",      icon: Stethoscope,    accent: "#F97316", trend: undefined, delay: 0.10 },
    { title: "Treinamentos",    value: stats?.trainings   ?? 0, subtitle: "realizados no período",        icon: GraduationCap,  accent: "#22C55E", trend: undefined, delay: 0.15 },
    { title: "Inspeções",       value: stats?.inspections ?? 0, subtitle: "executadas no período",        icon: ClipboardCheck, accent: "#F59E0B", trend: undefined, delay: 0.20 },
    { title: "PPPs Ativos",     value: stats?.ppps        ?? 0, subtitle: "perfis cadastrados",           icon: FileText,       accent: "#A78BFA", delay: 0.25 },
    { title: "Investigações",   value: stats?.investigations ?? 0, subtitle: "total de investigações",    icon: Search,         accent: "#22D3EE", delay: 0.30 },
    { title: "Campanhas",       value: stats?.campaigns   ?? 0, subtitle: "campanhas registradas",        icon: Megaphone,      accent: "#F472B6", delay: 0.35 },
    { title: "Funcionários",    value: stats?.employees   ?? 0, subtitle: "colaboradores ativos",         icon: Users,          accent: "#60A5FA", delay: 0.40 },
  ];

  const hasAlerts =
    (stats?.alerts?.catPendente?.length ?? 0) > 0 ||
    (stats?.alerts?.invAbertas?.length ?? 0) > 0 ||
    (stats?.alerts?.planosAtrasados?.length ?? 0) > 0;

  const totalAlerts =
    (stats?.alerts?.catPendente?.length ?? 0) +
    (stats?.alerts?.invAbertas?.length ?? 0) +
    (stats?.alerts?.planosAtrasados?.length ?? 0);

  return (
    <MainLayout title="Dashboard">
      <div className="p-5 lg:p-7 space-y-6" style={{ fontFamily: "'Sora', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`}</style>

        {/* ── Header ─────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start sm:items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white">Visão Geral — SST</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <PeriodFilter value={period} onChange={setPeriod} />
            <div className="flex gap-2">
              {(["/acidentes", "/treinamentos", "/inspecoes"] as const).map((href, i) => {
                const labels = ["+ Acidente", "+ Treinamento", "+ Inspeção"];
                const icons = [AlertTriangle, GraduationCap, ClipboardCheck];
                const Icon = icons[i];
                return (
                  <Link key={href} href={href}>
                    <a className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all">
                      <Icon className="w-3.5 h-3.5" />{labels[i]}
                    </a>
                  </Link>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ── KPIs ───────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {kpis.map((kpi, i) => <KpiCard key={i} {...kpi} />)}
          </div>
        )}

        {/* ── Indicadores TF / TG / Dias Perdidos ────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)
          ) : (
            <>
              <MetricCard label="Taxa de Frequência" value={stats?.taxaFrequencia ?? 0} unit="TF"
                desc="Acidentes por milhão de horas trabalhadas" accent="#EF4444" icon={Activity} delay={0.45} />
              <MetricCard label="Taxa de Gravidade" value={stats?.taxaGravidade ?? 0} unit="TG"
                desc="Dias perdidos por milhão de horas trabalhadas" accent="#F97316" icon={Zap} delay={0.48} />
              <MetricCard label="Dias Perdidos" value={stats?.lostDays ?? 0} unit="dias"
                desc="Total de dias de afastamento no período" accent="#A78BFA" icon={Clock} delay={0.51} />
            </>
          )}
        </div>

        {/* ── Gráficos principais ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Área — tendência mensal */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="lg:col-span-2">
            <Card>
              <SectionTitle title="Acidentes & Doenças" subtitle="Tendência — últimos 7 meses" />
              {isLoading ? <Skeleton className="h-[200px]" /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={stats?.monthlyTrend ?? []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gAcc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="gDis" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#F97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                    <XAxis dataKey="mes" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="acidentes" name="Acidentes" stroke="#EF4444" strokeWidth={2} fill="url(#gAcc)" dot={{ fill: "#EF4444", r: 3 }} />
                    <Area type="monotone" dataKey="doencas"   name="Doenças"   stroke="#F97316" strokeWidth={2} fill="url(#gDis)" dot={{ fill: "#F97316", r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Card>
          </motion.div>

          {/* Pizza — severidade */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
            <Card>
              <SectionTitle title="Severidade" subtitle="Acidentes por classificação" />
              {isLoading ? <Skeleton className="h-[200px]" /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={stats?.severityBreakdown ?? []} cx="50%" cy="45%"
                      innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                      {(stats?.severityBreakdown ?? []).map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8}
                      formatter={(v) => <span style={{ color: "#94A3B8", fontSize: 11 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
          </motion.div>
        </div>

        {/* ── Linha inferior ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Barras — horas de treinamento */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card>
              <SectionTitle title="Horas de Treinamento" subtitle="Últimos 7 meses" />
              {isLoading ? <Skeleton className="h-[170px]" /> : (
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart data={stats?.trainingHours ?? []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="horas" name="Horas" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </motion.div>

          {/* Ranking de setores */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.63 }}>
            <Card className="h-full">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <SectionTitle title="Setores de Maior Risco" />
              </div>
              {isLoading ? (
                <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
              ) : (stats?.sectorRanking?.length ?? 0) === 0 ? (
                <p className="text-xs text-slate-600 text-center py-8">Sem acidentes registrados</p>
              ) : (
                <div className="space-y-3">
                  {(stats?.sectorRanking ?? []).map((item, i) => {
                    const max = stats!.sectorRanking[0].count;
                    const pct = max > 0 ? (item.count / max) * 100 : 0;
                    const colors = ["#EF4444","#F97316","#F59E0B","#22C55E","#3B82F6"];
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-300 truncate max-w-[70%]">{item.sector}</span>
                          <span className="text-xs font-bold text-white" style={{ fontFamily: "monospace" }}>{item.count}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5">
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ delay: 0.7 + i * 0.05, duration: 0.5 }}
                            className="h-full rounded-full"
                            style={{ background: colors[i] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </motion.div>

          {/* Alertas + Atividades */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.66 }}>
            <Card className="h-full flex flex-col gap-5">

              {/* Alertas */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-200">Alertas</h3>
                  {hasAlerts && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                      {totalAlerts}
                    </span>
                  )}
                </div>
                {isLoading ? (
                  <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
                ) : !hasAlerts ? (
                  <p className="text-xs text-slate-600 text-center py-3">Nenhum alerta pendente</p>
                ) : (
                  <div className="space-y-2">
                    {(stats?.alerts?.catPendente ?? []).slice(0, 2).map(a => (
                      <div key={a.id} className="flex items-start gap-2.5 p-2.5 rounded-xl border border-red-500/15" style={{ background: "rgba(239,68,68,0.05)" }}>
                        <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-slate-200 leading-snug">{a.title}</p>
                          <p className="text-[10px] text-red-400 mt-0.5">CAT pendente</p>
                        </div>
                      </div>
                    ))}
                    {(stats?.alerts?.invAbertas ?? []).slice(0, 1).map(a => (
                      <div key={a.id} className="flex items-start gap-2.5 p-2.5 rounded-xl border border-amber-500/15" style={{ background: "rgba(245,158,11,0.05)" }}>
                        <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-slate-200 leading-snug">{a.title}</p>
                          <p className="text-[10px] text-amber-400 mt-0.5">Investigação aberta</p>
                        </div>
                      </div>
                    ))}
                    {(stats?.alerts?.planosAtrasados ?? []).slice(0, 1).map(a => (
                      <div key={a.id} className="flex items-start gap-2.5 p-2.5 rounded-xl border border-orange-500/15" style={{ background: "rgba(249,115,22,0.05)" }}>
                        <XCircle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-slate-200 leading-snug">{a.title}</p>
                          <p className="text-[10px] text-orange-400 mt-0.5">Plano de ação em atraso</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Atividade recente */}
              <div className="border-t border-white/5 pt-4 flex-1">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Atividade Recente</h3>
                {isLoading ? (
                  <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
                ) : (stats?.recentActivities?.length ?? 0) === 0 ? (
                  <p className="text-xs text-slate-600 text-center py-3">Sem atividades registradas</p>
                ) : (
                  <div className="space-y-3">
                    {(stats?.recentActivities ?? []).map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${item.dot}`} />
                        <div>
                          <p className="text-xs text-slate-300 leading-snug">{item.text}</p>
                          <p className="text-[10px] text-slate-600 mt-0.5">{item.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Link href="/auditoria">
                  <a className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-blue-400 transition-colors mt-4">
                    Ver auditoria completa <ArrowRight className="w-3 h-3" />
                  </a>
                </Link>
              </div>

            </Card>
          </motion.div>
        </div>

      </div>
    </MainLayout>
  );
}
