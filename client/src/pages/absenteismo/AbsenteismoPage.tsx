import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  CalendarOff, TrendingDown, Users, Clock,
  FileText, Stethoscope, ArrowRight, Activity,
} from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ComposedChart, Area, PieChart, Pie, Cell,
  Line, LineChart,
} from "recharts";

const FONT = "'Sora', sans-serif";
const BG = "#0D1526";
const SECTOR_COLORS = ["#3B82F6", "#22C55E", "#F59E0B", "#EF4444", "#A78BFA", "#22D3EE", "#F472B6", "#34D399"];
const TYPE_COLORS = ["#3B82F6", "#F59E0B"];

/* taxa thresholds (OIT reference) */
function taxaColor(t: number) {
  if (t === 0) return { color: "#64748B", label: "Sem dados", bg: "rgba(100,116,139,0.1)" };
  if (t < 2)   return { color: "#34D399", label: "Dentro do ideal",  bg: "rgba(52,211,153,0.1)" };
  if (t < 5)   return { color: "#F59E0B", label: "Atenção",          bg: "rgba(245,158,11,0.1)" };
  return              { color: "#EF4444", label: "Crítico",           bg: "rgba(239,68,68,0.1)"  };
}

type Period = "mes-anterior" | "mes" | "trimestre" | "semestre" | "ano" | "tudo";
const PERIODS: { key: Period; label: string }[] = [
  { key: "mes-anterior", label: "Mês anterior" },
  { key: "mes",          label: "Este mês"     },
  { key: "trimestre",    label: "Trimestre"    },
  { key: "semestre",     label: "Semestre"     },
  { key: "ano",          label: "Ano"          },
  { key: "tudo",         label: "Tudo"         },
];

/* map frontend period key → backend enum */
function toBackendPeriod(p: Period): "mes" | "trimestre" | "semestre" | "ano" | "tudo" {
  return p === "mes-anterior" ? "mes" : p;
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`rounded-lg bg-white/5 animate-pulse ${className}`} />;
}
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/5 p-5 ${className}`} style={{ background: BG }}>
      {children}
    </div>
  );
}
function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 px-3 py-2 text-xs shadow-xl" style={{ background: "#060B14" }}>
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? p.stroke }}>{p.name}: <b className="text-white">{p.value}{p.name === "Taxa %" ? "%" : ""}</b></p>
      ))}
    </div>
  );
}

export default function AbsenteismoPage() {
  const [period, setPeriod] = useState<Period>("tudo");
  const [sectorFilter, setSectorFilter] = useState<string>("todos");

  const { data: stats, isLoading } = trpc.absenteismo.stats.useQuery({ period: toBackendPeriod(period) });

  const taxa = stats?.taxa ?? 0;
  const tc = taxaColor(taxa);

  /* monthly data enriched with taxa % per month */
  const monthlyWithTaxa = useMemo(() => (stats?.monthly ?? []).map(m => ({
    ...m,
    taxa: stats && stats.empCount > 0
      ? parseFloat(((m.diasAtestados + m.diasAfastamentos) / (stats.empCount * 22) * 100).toFixed(2))
      : 0,
    diasTotal: m.diasAtestados + m.diasAfastamentos,
  })), [stats]);

  const pieData = stats ? [
    { name: "Atestados", value: stats.daysAtestados },
    { name: "Afastamentos", value: stats.daysAfastamentos },
  ] : [];

  const sectorOptions = useMemo(() => ["todos", ...(stats?.bySector ?? []).map((s: any) => s.sector)], [stats]);
  const filteredSector = useMemo(() =>
    sectorFilter === "todos" ? (stats?.bySector ?? []) : (stats?.bySector ?? []).filter((s: any) => s.sector === sectorFilter),
    [stats, sectorFilter]);
  const filteredRanking = useMemo(() =>
    sectorFilter === "todos" ? (stats?.ranking ?? []) : (stats?.ranking ?? []),
    [stats, sectorFilter]);

  /* month-over-month change */
  const lastTwo = monthlyWithTaxa.slice(-2);
  const momChange = lastTwo.length === 2 && lastTwo[0].diasTotal > 0
    ? parseFloat((((lastTwo[1].diasTotal - lastTwo[0].diasTotal) / lastTwo[0].diasTotal) * 100).toFixed(1))
    : null;

  return (
    <MainLayout title="Absenteísmo">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`}</style>
      <div className="p-5 lg:p-7 space-y-6" style={{ fontFamily: FONT }}>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.12)" }}>
                <CalendarOff className="w-4 h-4 text-red-400" />
              </div>
              <h1 className="text-xl font-bold text-white">Absenteísmo</h1>
            </div>
            <p className="text-xs text-slate-500 ml-12">Visão consolidada de ausências — atestados e afastamentos por doenças</p>
          </div>

          {/* Period pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider mr-1">Período:</span>
            {PERIODS.map(p => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${period === p.key ? "border-blue-500/45 text-blue-300" : "border-white/12 text-slate-500 hover:text-slate-300 hover:bg-white/4 hover:border-white/22"}`}
                style={period === p.key ? { background: "rgba(59,130,246,0.12)" } : {}}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40" />)}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Taxa — color-coded */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="relative rounded-2xl p-5 border hover:border-white/10 transition-all duration-300 overflow-hidden"
              style={{ background: BG, borderColor: `${tc.color}30` }}>
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-15" style={{ background: tc.color }} />
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: tc.bg }}>
                <TrendingDown className="w-4 h-4" style={{ color: tc.color }} />
              </div>
              <div className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace", color: tc.color }}>
                {stats.empCount > 0 ? `${taxa}%` : "—"}
              </div>
              <div className="text-xs font-medium text-slate-300 mt-1">Taxa de Absenteísmo</div>
              <div className="text-[11px] mt-0.5" style={{ color: tc.color }}>{tc.label}</div>
              <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(taxa / 10 * 100, 100)}%` }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="h-full rounded-full" style={{ background: tc.color }} />
              </div>
              <div className="text-[9px] text-slate-600 mt-1">ref: &lt;2% ideal · 2–5% atenção · &gt;5% crítico</div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="relative rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all overflow-hidden"
              style={{ background: BG }}>
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10" style={{ background: "#F59E0B" }} />
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(245,158,11,0.12)" }}>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{stats.totalDias}</div>
              <div className="text-xs font-medium text-slate-300 mt-1">Dias Perdidos</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{stats.daysAtestados}d atestados · {stats.daysAfastamentos}d afastamentos</div>
              {momChange !== null && (
                <div className={`text-[11px] font-semibold mt-2 ${momChange > 0 ? "text-red-400" : "text-emerald-400"}`}>
                  {momChange > 0 ? "▲" : "▼"} {Math.abs(momChange)}% vs mês anterior
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="relative rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all overflow-hidden"
              style={{ background: BG }}>
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10" style={{ background: "#3B82F6" }} />
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(59,130,246,0.12)" }}>
                <CalendarOff className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{stats.totalOcorrencias}</div>
              <div className="text-xs font-medium text-slate-300 mt-1">Ocorrências</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{stats.totalAtestados} atestados · {stats.totalAfastamentos} afastamentos</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Média: {stats.avgDias}d por ocorrência</div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="relative rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all overflow-hidden"
              style={{ background: BG }}>
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10" style={{ background: "#A78BFA" }} />
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(167,139,250,0.12)" }}>
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{stats.uniqueEmployees}</div>
              <div className="text-xs font-medium text-slate-300 mt-1">Funcionários Afetados</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {stats.empCount > 0 ? `${((stats.uniqueEmployees / stats.empCount) * 100).toFixed(1)}% da força de trabalho` : "Cadastre funcionários"}
              </div>
            </motion.div>
          </div>
        )}

        {/* Evolução Mensal (ComposedChart: barras count + linha taxa%) */}
        <Card>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <SectionTitle title="Evolução Mensal" subtitle="Ocorrências (barras) e taxa de absenteísmo % (linha)" />
            <span className="text-[10px] text-slate-600">Últimos 7 meses</span>
          </div>
          {isLoading ? <Skeleton className="h-56" /> : (
            <ResponsiveContainer width="100%" height={230}>
              <ComposedChart data={monthlyWithTaxa} margin={{ top: 5, right: 40, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gAt2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gAf2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="mes" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: "#F59E0B", fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }}
                  formatter={(v) => <span style={{ color: "#94A3B8" }}>{v}</span>} />
                <Area yAxisId="left" type="monotone" dataKey="atestados" name="Atestados" stroke="#3B82F6" strokeWidth={2} fill="url(#gAt2)" />
                <Area yAxisId="left" type="monotone" dataKey="afastamentos" name="Afastamentos" stroke="#F59E0B" strokeWidth={2} fill="url(#gAf2)" />
                <Line yAxisId="right" type="monotone" dataKey="taxa" name="Taxa %" stroke="#EF4444" strokeWidth={2.5}
                  dot={{ fill: "#EF4444", r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} strokeDasharray="5 3" />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Por Setor + Ranking */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <SectionTitle title="Dias Perdidos por Setor" />
              {sectorOptions.length > 1 && (
                <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}
                  className="text-[11px] rounded-lg border border-white/10 text-slate-300 px-2 py-1 outline-none cursor-pointer"
                  style={{ background: "#060B14" }}>
                  {sectorOptions.map(s => <option key={s} value={s} style={{ background: "#060B14" }}>{s === "todos" ? "Todos os setores" : s}</option>)}
                </select>
              )}
            </div>
            {isLoading ? <Skeleton className="h-56" /> : filteredSector.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-10">Sem dados no período</p>
            ) : (
              <div className="space-y-3">
                {filteredSector.map((s: any, i: number) => {
                  const max = filteredSector[0]?.dias ?? 1;
                  return (
                    <div key={s.sector}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-300 truncate max-w-[160px]">{s.sector}</span>
                        <div className="flex items-center gap-3 text-right flex-shrink-0">
                          <span className="text-[10px] text-slate-500">{s.n} ocorr.</span>
                          <span className="text-xs font-bold font-mono text-white">{s.dias}d</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(s.dias / max) * 100}%` }}
                          transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                          className="h-full rounded-full" style={{ background: SECTOR_COLORS[i % SECTOR_COLORS.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle title="Ranking de Ausências" subtitle="Funcionários com mais dias perdidos" />
            {isLoading ? (
              <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : filteredRanking.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-8">Nenhuma ausência registrada no período.</p>
            ) : (
              <div className="space-y-1.5">
                {filteredRanking.map((emp: any, i: number) => {
                  const maxDias = filteredRanking[0]?.dias ?? 1;
                  const pct = Math.round((emp.dias / maxDias) * 100);
                  const barColor = i === 0 ? "#EF4444" : i < 3 ? "#F59E0B" : "#3B82F6";
                  return (
                    <motion.div key={emp.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl border border-white/4 hover:border-white/8 transition-colors"
                      style={{ background: "rgba(255,255,255,0.02)" }}>
                      <span className="text-[10px] font-bold font-mono w-4 flex-shrink-0" style={{ color: barColor }}>#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{emp.name}</p>
                        <div className="h-1 rounded-full mt-1.5" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold font-mono text-white">{emp.dias}d</p>
                        <p className="text-[9px] text-slate-500">{emp.atestados}at · {emp.afastamentos}af</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Dias por Tipo (responsive) + Taxa mensal chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card>
            <SectionTitle title="Dias por Tipo" subtitle="Distribuição de dias perdidos" />
            {isLoading ? <Skeleton className="h-52" /> : stats && stats.totalDias > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={68} dataKey="value" paddingAngle={3}>
                      {pieData.map((_, i) => <Cell key={i} fill={TYPE_COLORS[i]} stroke="transparent" />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-2">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: TYPE_COLORS[i] }} />
                        <span className="text-slate-400">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 text-[10px]">{stats.totalDias > 0 ? `${((d.value / stats.totalDias) * 100).toFixed(0)}%` : ""}</span>
                        <span className="font-mono text-white font-medium">{d.value}d</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-600 text-center py-10">Sem dados no período</p>
            )}
          </Card>

          <Card className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-red-400" />
              <SectionTitle title="Taxa de Absenteísmo por Mês" subtitle="Evolução percentual — referência OIT < 2%" />
            </div>
            {isLoading ? <Skeleton className="h-48" /> : (
              <ResponsiveContainer width="100%" height={185}>
                <LineChart data={monthlyWithTaxa} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="mes" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                  {/* Reference lines */}
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="taxa" name="Taxa %" stroke="#EF4444" strokeWidth={2.5}
                    dot={(props: any) => {
                      const v = props.payload?.taxa ?? 0;
                      const c = v < 2 ? "#34D399" : v < 5 ? "#F59E0B" : "#EF4444";
                      return <circle key={props.key} cx={props.cx} cy={props.cy} r={5} fill={c} stroke="transparent" />;
                    }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/* Links para módulos relacionados */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/atestados">
            <a className="flex items-center gap-4 p-4 rounded-2xl border border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(59,130,246,0.12)" }}>
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Atestados Médicos</p>
                <p className="text-xs text-slate-500">Ver todos os atestados, análise comparativa e heatmap</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600" />
            </a>
          </Link>
          <Link href="/doencas">
            <a className="flex items-center gap-4 p-4 rounded-2xl border border-orange-500/20 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(249,115,22,0.12)" }}>
                <Stethoscope className="w-5 h-5 text-orange-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Doenças Ocupacionais</p>
                <p className="text-xs text-slate-500">Ver afastamentos por doenças ocupacionais com CID-10</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600" />
            </a>
          </Link>
        </div>

      </div>
    </MainLayout>
  );
}
