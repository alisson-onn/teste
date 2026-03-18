import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, BarChart2, Table2, Plus, TrendingUp, Users, Calendar,
  Building2, Trash2, Search, X, ChevronDown, AlertCircle, GitCompare,
  Download,
} from "lucide-react";
import { exportAtestadosPDF } from "@/lib/exportPDF";
import MainLayout from "@/components/MainLayout";
import { trpc } from "@/lib/trpc";
import { useForm } from "react-hook-form";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line, ComposedChart,
} from "recharts";

const FONT = "'Sora', sans-serif";
const BG  = "#0D1526";
const COLORS = ["#3B82F6","#22C55E","#F59E0B","#EF4444","#A78BFA","#22D3EE","#F472B6","#34D399"];
const DUR_COLORS = ["#22C55E","#F59E0B","#EF4444","#7F1D1D"];

/* ── MultiSelect ─────────────────────────────────────────── */
function MultiSelect({ options, selected, onChange, placeholder, searchable = true }: {
  options: string[]; selected: string[]; onChange: (v: string[]) => void;
  placeholder: string; searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter(s => s !== v) : [...selected, v]);

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all min-w-[140px] justify-between ${selected.length > 0 ? "border-blue-500/50 bg-blue-500/8 text-blue-300" : "border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300"}`}
        style={{ background: selected.length > 0 ? "rgba(59,130,246,0.08)" : "rgba(13,21,38,0.9)" }}>
        <span className="truncate max-w-[120px]">
          {selected.length === 0 ? placeholder : selected.length === 1 ? selected[0] : `${selected.length} selecionados`}
        </span>
        <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setSearch(""); }} />
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 top-full mt-1.5 left-0 w-56 rounded-xl border border-white/10 shadow-2xl overflow-hidden"
              style={{ background: "#060B14" }}>
              {searchable && (
                <div className="p-2 border-b border-white/5">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Buscar..." autoFocus
                      className="w-full bg-white/5 text-white text-xs pl-7 pr-3 py-1.5 rounded-lg outline-none placeholder:text-slate-600" />
                  </div>
                </div>
              )}
              <div className="max-h-52 overflow-y-auto py-1">
                {filtered.length === 0 ? (
                  <p className="text-xs text-slate-600 text-center py-4">Nenhum resultado</p>
                ) : filtered.map(o => (
                  <label key={o} className="flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 cursor-pointer transition-colors">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${selected.includes(o) ? "bg-blue-500 border-blue-500" : "border-white/20"}`}>
                      {selected.includes(o) && <span className="text-white text-[10px] font-bold">✓</span>}
                    </div>
                    <input type="checkbox" checked={selected.includes(o)} onChange={() => toggle(o)} className="sr-only" />
                    <span className="text-xs text-slate-300 truncate">{o}</span>
                  </label>
                ))}
              </div>
              {selected.length > 0 && (
                <div className="p-2 border-t border-white/5">
                  <button onClick={() => { onChange([]); setOpen(false); setSearch(""); }}
                    className="w-full text-[11px] text-slate-500 hover:text-red-400 transition-colors py-1">
                    Limpar seleção ({selected.length})
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

type Period = "mes" | "trimestre" | "semestre" | "ano" | "tudo";
type ViewMode = "painel" | "graficos" | "tabela" | "novo";

const PERIODS: { key: Period; label: string }[] = [
  { key: "mes",       label: "Mês"       },
  { key: "trimestre", label: "Trimestre" },
  { key: "semestre",  label: "Semestre"  },
  { key: "ano",       label: "Ano"       },
  { key: "tudo",      label: "Tudo"      },
];

const SETORES = [
  "Administrativo","Almoxarifado","Centro Cirúrgico","Emergência","Farmácia",
  "Higienização","Lavanderia","Manutenção","Nutrição","Pronto Atendimento",
  "RH","Radiologia","Segurança","TI","UTI","Outros",
];

/* ── helpers ─────────────────────────────────────────────── */
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/5 p-5 ${className}`} style={{ background: BG }}>
      {children}
    </div>
  );
}
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`rounded-xl bg-white/5 animate-pulse ${className}`} />;
}
function Tooltip2({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 px-3 py-2 text-xs shadow-xl" style={{ background: "#060B14" }}>
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <b className="text-white">{p.value}</b></p>
      ))}
    </div>
  );
}

/* ── KPI card ────────────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, sub, accent, delay }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}
      className="relative rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-all overflow-hidden group"
      style={{ background: BG }}>
      <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" style={{ background: accent }} />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${accent}18` }}>
          <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
        </div>
        <div className="text-[11px] font-medium text-slate-400 leading-tight">{label}</div>
      </div>
      <div className="text-xl font-bold text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
    </motion.div>
  );
}

/* ── heatmap ─────────────────────────────────────────────── */
function Heatmap({ data, labels }: { data: any[]; labels: string[] }) {
  if (!data.length) return <p className="text-xs text-slate-600 text-center py-6">Dados insuficientes</p>;
  const max = Math.max(...data.flatMap(row => labels.map(l => row[l] ?? 0)), 1);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr>
            <th className="text-left text-slate-600 pb-2 pr-3 font-normal">Setor</th>
            {labels.map(l => <th key={l} className="text-slate-600 pb-2 px-1 font-normal">{l}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <td className="text-slate-400 pr-3 py-1 truncate max-w-[120px]">{row.sector}</td>
              {labels.map(l => {
                const v = row[l] ?? 0;
                const intensity = v / max;
                return (
                  <td key={l} className="px-1 py-1 text-center">
                    <div className="w-8 h-7 rounded flex items-center justify-center text-[10px] font-bold mx-auto transition-all"
                      style={{ background: `rgba(59,130,246,${intensity * 0.8 + 0.05})`, color: intensity > 0.4 ? "#fff" : "#64748B" }}>
                      {v > 0 ? v : ""}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════ */
export default function AtestadosPage() {
  const [view, setView] = useState<ViewMode>("painel");
  const [period, setPeriod] = useState<Period>("tudo");
  const [search, setSearch] = useState("");
  const [filterSector, setFilterSector] = useState("");
  const [success, setSuccess] = useState(false);

  // Evolução Temporal
  const [tempSectors, setTempSectors] = useState<string[]>([]);
  const [tempCids, setTempCids] = useState<string[]>([]);
  const [tempFunctions, setTempFunctions] = useState<string[]>([]);
  const [tempMinDays, setTempMinDays] = useState("");
  const [tempMaxDays, setTempMaxDays] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [customA, setCustomA] = useState(false);
  const [shortcut, setShortcut] = useState<string>("3m");
  const [chartTab, setChartTab] = useState<"evolucao" | "setor" | "cid">("evolucao");

  const toYM = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const monthOptions = Array.from({ length: 24 }, (_, i) => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (23 - i));
    return { ym: toYM(d), label: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "") };
  });

  const [startA, setStartA] = useState(() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 2); return toYM(d); });
  const [endA,   setEndA]   = useState(() => toYM(new Date()));
  const [startB, setStartB] = useState(() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 5); return toYM(d); });
  const [endB,   setEndB]   = useState(() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 3); return toYM(d); });

  const applyShortcut = (key: string) => {
    setShortcut(key);
    setCustomA(false);
    const now = new Date(); now.setDate(1);
    const end = toYM(now);
    if (key === "este-mes") {
      setStartA(end); setEndA(end);
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      setStartB(toYM(prev)); setEndB(toYM(prev));
    } else if (key === "3m") {
      const s = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      setStartA(toYM(s)); setEndA(end);
      const bs = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const be = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      setStartB(toYM(bs)); setEndB(toYM(be));
    } else if (key === "6m") {
      const s = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      setStartA(toYM(s)); setEndA(end);
      const bs = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      const be = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      setStartB(toYM(bs)); setEndB(toYM(be));
    } else if (key === "mes-anterior") {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevYM = toYM(prev);
      setStartA(prevYM); setEndA(prevYM);
      const prev2 = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      setStartB(toYM(prev2)); setEndB(toYM(prev2));
    } else if (key === "ano") {
      setStartA(`${now.getFullYear()}-01`); setEndA(end);
      setStartB(`${now.getFullYear() - 1}-01`); setEndB(`${now.getFullYear() - 1}-12`);
    }
  };

  const toggleCompare = () => {
    if (!compareMode) {
      setCustomA(false); // mutually exclusive: turning on compare hides Personalizar
      const [sy, sm] = startA.split("-").map(Number);
      const [ey, em] = endA.split("-").map(Number);
      const dur = (ey - sy) * 12 + (em - sm);
      const beD = new Date(sy, sm - 2, 1);
      const bsD = new Date(beD.getFullYear(), beD.getMonth() - dur, 1);
      setStartB(toYM(bsD)); setEndB(toYM(beD));
    }
    setCompareMode(c => !c);
  };

  const ymLabel = (ym: string) => monthOptions.find(m => m.ym === ym)?.label ?? ym;
  const rangeLabel = (s: string, e: string) => s === e ? ymLabel(s) : `${ymLabel(s)} → ${ymLabel(e)}`;

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.atestados.stats.useQuery({
    period,
    sectors:      tempSectors,
    cids:         tempCids,
    jobFunctions: tempFunctions,
  });
  const { data: list = [], isLoading: listLoading, refetch: refetchList } = trpc.atestados.list.useQuery({ period, sector: filterSector || undefined });
  const { data: options } = trpc.atestados.options.useQuery();
  const { data: temporal, isLoading: temporalLoading } = trpc.atestados.temporal.useQuery({
    startA, endA,
    startB: compareMode ? startB : undefined,
    endB:   compareMode ? endB   : undefined,
    sectors:      tempSectors,
    cids:         tempCids,
    jobFunctions: tempFunctions,
    minDays: tempMinDays !== "" ? Number(tempMinDays) : undefined,
    maxDays: tempMaxDays !== "" ? Number(tempMaxDays) : undefined,
  });
  const removeMut = trpc.atestados.remove.useMutation({ onSuccess: () => { refetchList(); refetchStats(); } });
  const createMut = trpc.atestados.create.useMutation({
    onSuccess: () => {
      setSuccess(true); reset(); refetchList(); refetchStats();
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>();
  const onSubmit = (data: any) => createMut.mutate({ ...data, days: Number(data.days) });

  const filtered = list.filter((r: any) =>
    !search || r.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
    r.cid?.toLowerCase().includes(search.toLowerCase()) ||
    r.sector?.toLowerCase().includes(search.toLowerCase())
  );

  const [exporting, setExporting] = useState(false);

  async function handleExportPDF() {
    setExporting(true);
    try {
      exportAtestadosPDF({
        list,
        stats,
        period,
        filters: {
          sectors:   tempSectors.length   ? tempSectors   : undefined,
          cids:      tempCids.length      ? tempCids      : undefined,
          functions: tempFunctions.length ? tempFunctions : undefined,
        },
      });
    } finally {
      setExporting(false);
    }
  }

  const views: { key: ViewMode; label: string; icon: any }[] = [
    { key: "painel",   label: "Painel",   icon: BarChart2  },
    { key: "graficos", label: "Gráficos", icon: TrendingUp },
    { key: "tabela",   label: "Registros", icon: Table2    },
    { key: "novo",     label: "Novo",     icon: Plus       },
  ];

  const inputCls = "w-full rounded-xl border border-white/10 bg-white/4 text-white text-sm px-3 py-2.5 outline-none focus:border-blue-500/60 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all placeholder:text-slate-600";
  const labelCls = "text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-1 block";

  return (
    <MainLayout title="Atestados">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`}</style>
      <div className="p-5 lg:p-7 space-y-4" style={{ fontFamily: FONT }}>

        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex items-start sm:items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Atestados Médicos
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Controle de afastamentos e absenteísmo</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Export PDF button */}
            <button
              onClick={handleExportPDF}
              disabled={exporting || listLoading || !list.length}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                border: "1px solid rgba(59,130,246,0.35)",
                background: exporting ? "rgba(59,130,246,0.18)" : "rgba(59,130,246,0.08)",
                color: "#93C5FD",
              }}
              title="Exportar relatório em PDF"
            >
              <Download className={`w-3.5 h-3.5 ${exporting ? "animate-bounce" : ""}`} />
              {exporting ? "Gerando…" : "Exportar PDF"}
            </button>

            {/* View tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl border border-white/8" style={{ background: "rgba(255,255,255,0.03)" }}>
              {views.map(v => (
                <button key={v.key} onClick={() => setView(v.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${view === v.key ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:text-white"}`}>
                  <v.icon className="w-3.5 h-3.5" />{v.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Filtro de período (sempre visível) ─────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider">Período:</span>
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${period === p.key ? "border-blue-500 bg-blue-500/10 text-blue-300" : "border-white/10 text-slate-400 hover:text-white hover:border-white/20"}`}>
              {p.label}
            </button>
          ))}
          <span className="text-[11px] text-slate-600 ml-2">{stats?.total ?? 0} registros</span>
        </div>

        {/* ═══════════ PAINEL ════════════════════════════════ */}
        <AnimatePresence mode="wait">
        {view === "painel" && (
          <motion.div key="painel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">

            {/* KPIs */}
            {statsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-24"/>)}</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <KpiCard icon={FileText}   label="Total de Atestados"    value={stats?.total ?? 0}           sub="no período"               accent="#3B82F6" delay={0.05} />
                <KpiCard icon={Calendar}   label="Dias de Afastamento"   value={stats?.totalDays ?? 0}        sub="dias acumulados"          accent="#EF4444" delay={0.10} />
                <KpiCard icon={TrendingUp} label="Média por Atestado"    value={`${stats?.avgDays ?? 0}d`}    sub="média de duração"         accent="#F59E0B" delay={0.15} />
                <KpiCard icon={Building2}  label="Setores Afetados"      value={stats?.sectors ?? 0}          sub="setores distintos"        accent="#A78BFA" delay={0.20} />
                <KpiCard icon={Users}      label="Funcionários Únicos"   value={stats?.uniqueEmployees ?? 0}  sub="com ao menos 1 atestado"  accent="#22C55E" delay={0.25} />
              </div>
            )}

            {/* ── Evolução Temporal ─────────────────────── */}
            <Card>
              <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <GitCompare className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-semibold text-slate-200">Evolução Temporal de Atestados</h3>
                </div>
                {/* Chart tabs — inline with title */}
                <div className="flex gap-1 p-0.5 rounded-lg border border-white/8" style={{ background: "rgba(15,23,42,0.6)" }}>
                  {([
                    { key: "evolucao", label: "Evolução"  },
                    { key: "setor",    label: "Por Setor" },
                    { key: "cid",      label: "Por CID"   },
                  ] as const).map(t => (
                    <button key={t.key} onClick={() => setChartTab(t.key)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${chartTab === t.key ? "text-blue-300 border border-blue-500/30" : "text-slate-500 hover:text-slate-300"}`}
                      style={chartTab === t.key ? { background: "rgba(59,130,246,0.18)" } : {}}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Filter Panel ── */}
              <div className="rounded-xl border border-white/8 p-2.5 mb-3 space-y-2" style={{ background: "rgba(15,23,42,0.55)" }}>

                {/* Row 1: shortcuts + Personalizar + Compare (mutually exclusive) */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">Período:</span>

                  {([
                    { key: "mes-anterior", label: "Mês anterior" },
                    { key: "este-mes",     label: "Este mês"     },
                    { key: "3m",           label: "3 meses"      },
                    { key: "6m",       label: "6 meses"  },
                    { key: "ano",      label: "Este ano" },
                  ] as const).map(s => (
                    <button key={s.key} onClick={() => applyShortcut(s.key)}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${shortcut === s.key && !customA ? "border-blue-500/45 text-blue-300" : "border-white/12 text-slate-500 hover:text-slate-300 hover:bg-white/4 hover:border-white/22"}`}
                      style={shortcut === s.key && !customA ? { background: "rgba(59,130,246,0.12)" } : {}}>
                      {s.label}
                    </button>
                  ))}

                  {/* Personalizar — hidden while Compare is active */}
                  {!compareMode && (
                    <button onClick={() => { setCustomA(c => !c); if (!customA) setShortcut(""); }}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${customA ? "border-blue-400/40 text-blue-300" : "border-white/12 text-slate-500 hover:text-slate-300 hover:border-white/22"}`}
                      style={customA ? { background: "rgba(59,130,246,0.08)" } : {}}>
                      ✎ Personalizar
                    </button>
                  )}

                  {/* Active period badge */}
                  <span className="text-[10px] text-slate-600 font-mono">{rangeLabel(startA, endA)}</span>

                  {/* Compare — disabled while Personalizar is active */}
                  <button onClick={toggleCompare} disabled={customA}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ml-auto
                      ${customA ? "border-white/6 text-slate-700 cursor-not-allowed" : compareMode ? "border-emerald-500/45 text-emerald-300" : "border-white/12 text-slate-500 hover:text-emerald-300 hover:border-emerald-500/30"}`}
                    style={compareMode && !customA ? { background: "rgba(16,185,129,0.1)" } : {}}>
                    {compareMode ? "● Comparar ativo" : "Comparar períodos"}
                  </button>
                </div>

                {/* Personalizar expands Period A date pickers */}
                <AnimatePresence>
                  {customA && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }} className="overflow-hidden">
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#3b82f6" }} />
                        <span className="text-[11px] text-slate-400 font-medium shrink-0">De:</span>
                        <select value={startA} onChange={e => setStartA(e.target.value)}
                          className="rounded-lg border border-white/10 bg-white/4 text-slate-200 text-[11px] px-2 py-1.5 outline-none cursor-pointer">
                          {monthOptions.filter(m => m.ym <= endA).map(m => <option key={m.ym} value={m.ym} style={{ background: "#0A1020" }}>{m.label}</option>)}
                        </select>
                        <span className="text-slate-600 text-xs">até</span>
                        <select value={endA} onChange={e => setEndA(e.target.value)}
                          className="rounded-lg border border-white/10 bg-white/4 text-slate-200 text-[11px] px-2 py-1.5 outline-none cursor-pointer">
                          {monthOptions.filter(m => m.ym >= startA).map(m => <option key={m.ym} value={m.ym} style={{ background: "#0A1020" }}>{m.label}</option>)}
                        </select>
                        <span className="text-[10px] text-slate-500 ml-1">
                          Para comparar períodos, feche o Personalizar primeiro.
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Compare: Period B — editable inline selectors */}
                <AnimatePresence>
                  {compareMode && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="flex items-center gap-2 pt-2 border-t border-white/5 flex-wrap">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#10b981" }} />
                        <span className="text-[11px] text-slate-400 font-medium shrink-0">Comparar com:</span>
                        <select value={startB} onChange={e => setStartB(e.target.value)}
                          className="rounded-lg border border-emerald-500/25 text-emerald-200 text-[11px] px-2 py-1.5 outline-none cursor-pointer focus:border-emerald-400/50 transition-colors"
                          style={{ background: "rgba(16,185,129,0.06)" }}>
                          {monthOptions.filter(m => m.ym <= endB).map(m => <option key={m.ym} value={m.ym} style={{ background: "#0A1020" }}>{m.label}</option>)}
                        </select>
                        <span className="text-slate-600 text-xs">até</span>
                        <select value={endB} onChange={e => setEndB(e.target.value)}
                          className="rounded-lg border border-emerald-500/25 text-emerald-200 text-[11px] px-2 py-1.5 outline-none cursor-pointer focus:border-emerald-400/50 transition-colors"
                          style={{ background: "rgba(16,185,129,0.06)" }}>
                          {monthOptions.filter(m => m.ym >= startB).map(m => <option key={m.ym} value={m.ym} style={{ background: "#0A1020" }}>{m.label}</option>)}
                        </select>
                        <span className="text-[10px] text-slate-600">
                          Ajuste livremente — ex: jan/25 vs out/25
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Divider */}
                <div className="border-t border-white/5" />

                {/* Multi-selects + days range + clear */}
                <div className="flex items-center gap-2 flex-wrap">
                  <MultiSelect options={options?.sectors ?? SETORES} selected={tempSectors} onChange={setTempSectors} placeholder="Setores" />
                  <MultiSelect options={options?.cids ?? []} selected={tempCids} onChange={setTempCids} placeholder="CIDs" />
                  <MultiSelect options={options?.functions ?? []} selected={tempFunctions} onChange={setTempFunctions} placeholder="Funções" />

                  {/* Days range */}
                  <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all ${tempMinDays || tempMaxDays ? "border-blue-500/40" : "border-white/10"}`}
                    style={{ background: tempMinDays || tempMaxDays ? "rgba(59,130,246,0.07)" : "rgba(255,255,255,0.03)" }}>
                    <span className="text-[11px] text-slate-500 shrink-0">Dias:</span>
                    <input type="number" min="0" placeholder="mín" value={tempMinDays} onChange={e => setTempMinDays(e.target.value)}
                      className="w-10 bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-600 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                    <span className="text-slate-600 text-xs">–</span>
                    <input type="number" min="0" placeholder="máx" value={tempMaxDays} onChange={e => setTempMaxDays(e.target.value)}
                      className="w-10 bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-600 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                    {(tempMinDays || tempMaxDays) && (
                      <button onClick={() => { setTempMinDays(""); setTempMaxDays(""); }} className="text-slate-600 hover:text-red-400 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {(tempSectors.length > 0 || tempCids.length > 0 || tempFunctions.length > 0 || tempMinDays || tempMaxDays) && (
                    <button onClick={() => { setTempSectors([]); setTempCids([]); setTempFunctions([]); setTempMinDays(""); setTempMaxDays(""); }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-red-500/22 text-red-400 text-[11px] font-semibold hover:border-red-500/40 transition-all ml-auto"
                      style={{ background: "rgba(239,68,68,0.08)" }}>
                      <X className="w-3 h-3" /> Limpar filtros
                    </button>
                  )}
                </div>
              </div>

              {/* Period legend + mini KPIs inline */}
              <div className="flex items-center gap-4 mb-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-0.5 rounded" style={{ background: "#3b82f6" }} />
                  <span className="text-[11px] text-slate-400">A: {rangeLabel(startA, endA)}</span>
                  <span className="font-mono text-[11px] text-blue-300 font-semibold ml-1">{temporal?.kpiA?.total ?? 0} at.</span>
                  <span className="font-mono text-[11px] text-blue-400/70">{temporal?.kpiA?.days ?? 0}d</span>
                </div>
                {compareMode && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-0.5 rounded border-t-2 border-dashed" style={{ borderColor: "#10b981" }} />
                    <span className="text-[11px] text-slate-400">B: {rangeLabel(startB, endB)}</span>
                    <span className="font-mono text-[11px] text-emerald-300 font-semibold ml-1">{temporal?.kpiB?.total ?? 0} at.</span>
                    <span className="font-mono text-[11px] text-emerald-400/70">{temporal?.kpiB?.days ?? 0}d</span>
                  </div>
                )}
              </div>

              {/* Chart */}
              <div style={{ width: "100%", minWidth: 0 }}>
              {temporalLoading ? <Skeleton className="h-64" /> : (
                <>
                  {chartTab === "evolucao" && (
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={temporal?.chartData ?? []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                        <XAxis dataKey="x" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip content={<Tooltip2 />} />
                        <Line type="monotone" dataKey="a" name="Período A" stroke="#3b82f6" strokeWidth={2.5}
                          dot={{ fill: "#3b82f6", r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                        {compareMode && (
                          <Line type="monotone" dataKey="b" name="Período B" stroke="#10b981" strokeWidth={2.5}
                            strokeDasharray="6 3" dot={{ fill: "#10b981", r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  )}

                  {chartTab === "setor" && (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={temporal?.bySector ?? []} layout="vertical" margin={{ top: 0, right: 40, left: 10, bottom: 0 }}>
                        <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
                        <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <YAxis type="category" dataKey="sector" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                        <Tooltip content={<Tooltip2 />} />
                        <Bar dataKey="a" name="Período A" fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={16} />
                        {compareMode && <Bar dataKey="b" name="Período B" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={16} />}
                      </BarChart>
                    </ResponsiveContainer>
                  )}

                  {chartTab === "cid" && (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={temporal?.byCid ?? []} layout="vertical" margin={{ top: 0, right: 40, left: 10, bottom: 0 }}>
                        <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
                        <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <YAxis type="category" dataKey="cid" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                        <Tooltip content={<Tooltip2 />} />
                        <Bar dataKey="a" name="Período A" fill="#a78bfa" radius={[0, 4, 4, 0]} maxBarSize={16} />
                        {compareMode && <Bar dataKey="b" name="Período B" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={16} />}
                      </BarChart>
                    </ResponsiveContainer>
                  )}

                  {(temporal?.chartData?.length === 0 && temporal?.bySector?.length === 0) && (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-600">
                      <GitCompare className="w-8 h-8 mb-2 opacity-40" />
                      <p className="text-sm">Sem dados para o período selecionado</p>
                    </div>
                  )}
                </>
              )}
              </div>
            </Card>

            {/* Evolução Mensal + Duração */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <motion.div className="lg:col-span-2" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.3}}>
                <Card>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-200">Evolução Mensal</h3>
                    <span className="text-[10px] text-slate-600">Últimos 7 meses</span>
                  </div>
                  {statsLoading ? <Skeleton className="h-44" /> : (
                    <ResponsiveContainer width="100%" height={180}>
                      <ComposedChart data={stats?.monthlyEvolution ?? []} margin={{top:5,right:40,left:-20,bottom:0}}>
                        <defs>
                          <linearGradient id="gAt" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="gDi" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3"/>
                        <XAxis dataKey="mes" tick={{fill:"#64748B",fontSize:11}} axisLine={false} tickLine={false}/>
                        {/* Left axis: atestados count */}
                        <YAxis yAxisId="left" tick={{fill:"#3B82F6",fontSize:10}} axisLine={false} tickLine={false} allowDecimals={false}/>
                        {/* Right axis: dias — different scale */}
                        <YAxis yAxisId="right" orientation="right" tick={{fill:"#EF4444",fontSize:10}} axisLine={false} tickLine={false} allowDecimals={false}/>
                        <Tooltip content={<Tooltip2/>}/>
                        <Legend iconType="circle" iconSize={8} formatter={(v)=><span style={{color:"#94A3B8",fontSize:10}}>{v}</span>}/>
                        <Area yAxisId="left"  type="monotone" dataKey="atestados" name="Atestados" stroke="#3B82F6" strokeWidth={2} fill="url(#gAt)" dot={{fill:"#3B82F6",r:3}}/>
                        <Area yAxisId="right" type="monotone" dataKey="dias"      name="Dias afastados" stroke="#EF4444" strokeWidth={2} fill="url(#gDi)" dot={{fill:"#EF4444",r:3}}/>
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </Card>
              </motion.div>

              <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.35}}>
                <Card>
                  <h3 className="text-sm font-semibold text-slate-200 mb-3">Duração dos Afastamentos</h3>
                  {statsLoading ? <Skeleton className="h-44"/> : (
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={stats?.durDist ?? []} dataKey="count" nameKey="label" cx="50%" cy="42%" innerRadius={40} outerRadius={65} paddingAngle={3}>
                          {(stats?.durDist ?? []).map((_: any, i: number) => <Cell key={i} fill={DUR_COLORS[i]} stroke="transparent"/>)}
                        </Pie>
                        <Tooltip content={<Tooltip2/>}/>
                        <Legend iconType="circle" iconSize={8} formatter={(v)=><span style={{color:"#94A3B8",fontSize:10}}>{v}</span>}/>
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Card>
              </motion.div>
            </div>

            {/* Top CIDs + Setores */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Top CIDs</h3>
                {statsLoading ? <Skeleton className="h-44"/> : (stats?.topCids?.length ?? 0) === 0 ? (
                  <p className="text-xs text-slate-600 text-center py-8">Sem dados</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stats?.topCids ?? []} layout="vertical" margin={{top:0,right:40,left:10,bottom:0}}>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false}/>
                      <XAxis type="number" tick={{fill:"#64748B",fontSize:10}} axisLine={false} tickLine={false}/>
                      <YAxis type="category" dataKey="cid" tick={{fill:"#94A3B8",fontSize:11}} axisLine={false} tickLine={false} width={60}/>
                      <Tooltip content={<Tooltip2/>}/>
                      <Bar dataKey="n" name="Casos" radius={[0,4,4,0]}>
                        {(stats?.topCids ?? []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <Card>
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Atestados por Setor</h3>
                {statsLoading ? <Skeleton className="h-44"/> : (stats?.bySector?.length ?? 0) === 0 ? (
                  <p className="text-xs text-slate-600 text-center py-8">Sem dados</p>
                ) : (
                  <div className="space-y-2.5 mt-2">
                    {(stats?.bySector ?? []).slice(0,7).map((s: any, i: number) => {
                      const max = stats!.bySector[0].n;
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-300 truncate">{s.sector}</span>
                            <span className="text-xs font-bold text-white font-mono">{s.n}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/5">
                            <motion.div initial={{width:0}} animate={{width:`${(s.n/max)*100}%`}} transition={{delay:0.4+i*0.05,duration:0.5}}
                              className="h-full rounded-full" style={{background: COLORS[i % COLORS.length]}}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>

          </motion.div>
        )}

        {/* ═══════════ GRÁFICOS ══════════════════════════════ */}
        {view === "graficos" && (
          <motion.div key="graficos" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-4">

            {/* Ranking de funcionários */}
            {statsLoading ? <Skeleton className="h-52"/> : (stats?.employeeRanking?.length ?? 0) === 0 ? (
              <Card><p className="text-xs text-slate-600 text-center py-8">Sem dados no período</p></Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card>
                  <h3 className="text-sm font-semibold text-slate-200 mb-4">Nº de Atestados por Funcionário</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stats?.employeeRanking ?? []} layout="vertical" margin={{top:0,right:40,left:20,bottom:0}}>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false}/>
                      <XAxis type="number" tick={{fill:"#64748B",fontSize:10}} axisLine={false} tickLine={false} allowDecimals={false}/>
                      <YAxis type="category" dataKey="name" tick={{fill:"#94A3B8",fontSize:11}} axisLine={false} tickLine={false} width={130}/>
                      <Tooltip content={<Tooltip2/>}/>
                      <Bar dataKey="count" name="Atestados" fill="#3B82F6" radius={[0,4,4,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
                <Card>
                  <h3 className="text-sm font-semibold text-slate-200 mb-4">Dias de Afastamento por Funcionário</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stats?.employeeRanking ?? []} layout="vertical" margin={{top:0,right:40,left:20,bottom:0}}>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false}/>
                      <XAxis type="number" tick={{fill:"#64748B",fontSize:10}} axisLine={false} tickLine={false} allowDecimals={false}/>
                      <YAxis type="category" dataKey="name" tick={{fill:"#94A3B8",fontSize:11}} axisLine={false} tickLine={false} width={130}/>
                      <Tooltip content={<Tooltip2/>}/>
                      <Bar dataKey="days" name="Dias" fill="#EF4444" radius={[0,4,4,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            )}

            {/* Heatmap setor × mês */}
            <Card>
              <h3 className="text-sm font-semibold text-slate-200 mb-1">Mapa de Calor — Setor × Mês</h3>
              <p className="text-xs text-slate-500 mb-4">Concentração de atestados por setor nos últimos 6 meses</p>
              {statsLoading ? <Skeleton className="h-40"/> : <Heatmap data={stats?.heatmap ?? []} labels={stats?.heatLabels ?? []}/>}
            </Card>

            {/* Evolução dias + atestados lado a lado */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card>
                <h3 className="text-sm font-semibold text-slate-200 mb-4">Atestados por Mês</h3>
                {statsLoading ? <Skeleton className="h-48"/> : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={stats?.monthlyEvolution ?? []} margin={{top:5,right:5,left:-20,bottom:0}}>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" vertical={false}/>
                      <XAxis dataKey="mes" tick={{fill:"#64748B",fontSize:11}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fill:"#64748B",fontSize:11}} axisLine={false} tickLine={false} allowDecimals={false}/>
                      <Tooltip content={<Tooltip2/>}/>
                      <Bar dataKey="atestados" name="Atestados" fill="#3B82F6" radius={[4,4,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
              <Card>
                <h3 className="text-sm font-semibold text-slate-200 mb-4">Dias de Afastamento por Mês</h3>
                {statsLoading ? <Skeleton className="h-48"/> : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={stats?.monthlyEvolution ?? []} margin={{top:5,right:5,left:-20,bottom:0}}>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" vertical={false}/>
                      <XAxis dataKey="mes" tick={{fill:"#64748B",fontSize:11}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fill:"#64748B",fontSize:11}} axisLine={false} tickLine={false} allowDecimals={false}/>
                      <Tooltip content={<Tooltip2/>}/>
                      <Bar dataKey="dias" name="Dias" fill="#EF4444" radius={[4,4,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </div>

          </motion.div>
        )}

        {/* ═══════════ TABELA ════════════════════════════════ */}
        {view === "tabela" && (
          <motion.div key="tabela" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <Card>
              {/* Toolbar */}
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                  <input value={search} onChange={e=>setSearch(e.target.value)}
                    placeholder="Buscar funcionário, CID, setor..." type="text"
                    className="w-full rounded-xl border border-white/10 bg-white/4 text-white text-sm pl-9 pr-4 py-2 outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600"/>
                  {search && <button onClick={()=>setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X className="w-3.5 h-3.5"/></button>}
                </div>
                <div className="relative">
                  <select value={filterSector} onChange={e=>setFilterSector(e.target.value)}
                    className="appearance-none rounded-xl border border-white/10 bg-white/4 text-slate-300 text-xs pr-7 pl-3 py-2 outline-none focus:border-blue-500/50 transition-all cursor-pointer"
                    style={{background:"rgba(13,21,38,0.95)"}}>
                    <option value="">Todos os setores</option>
                    {SETORES.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none"/>
                </div>
                <span className="text-[11px] text-slate-500">{filtered.length} registro{filtered.length !== 1 ? "s" : ""}</span>
              </div>

              {/* Table */}
              {listLoading ? (
                <div className="space-y-2">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-12"/>)}</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                  <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3"/>
                  <p className="text-sm text-slate-500">Nenhum atestado encontrado</p>
                  <button onClick={()=>setView("novo")} className="mt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 mx-auto">
                    <Plus className="w-3.5 h-3.5"/> Registrar primeiro atestado
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/5">
                        {["Data","Funcionário","Matrícula","Setor","CID","Diagnóstico","Local","Dias",""].map((h,i)=>(
                          <th key={i} className="text-left text-slate-500 font-medium pb-3 pr-4 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r: any) => (
                        <tr key={r.id} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                          <td className="py-3 pr-4 text-slate-400 whitespace-nowrap font-mono">{r.startDate}</td>
                          <td className="py-3 pr-4 text-slate-200 font-medium whitespace-nowrap">{r.employeeName}</td>
                          <td className="py-3 pr-4 text-slate-500 font-mono">{r.matricula || "—"}</td>
                          <td className="py-3 pr-4 text-slate-400 whitespace-nowrap">{r.sector}</td>
                          <td className="py-3 pr-4">
                            <span className="px-2 py-0.5 rounded-md text-purple-300 font-mono text-[10px]" style={{background:"rgba(139,92,246,0.15)"}}>
                              {r.cid}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-slate-300 max-w-[180px] truncate">{r.diagnosis}</td>
                          <td className="py-3 pr-4">
                            {r.careLocation && (
                              <span className="px-2 py-0.5 rounded-md text-cyan-300 text-[10px]" style={{background:"rgba(34,211,238,0.1)"}}>
                                {r.careLocation}
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            <span className="px-2 py-0.5 rounded-md font-bold font-mono text-[10px]"
                              style={{
                                background: r.days <= 2 ? "rgba(34,197,94,0.12)" : r.days <= 5 ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)",
                                color:      r.days <= 2 ? "#4ade80"               : r.days <= 5 ? "#fbbf24"               : "#f87171",
                              }}>
                              {r.days}d
                            </span>
                          </td>
                          <td className="py-3">
                            <button onClick={()=>{ if(confirm("Excluir este atestado?")) removeMut.mutate({id:r.id}); }}
                              className="text-slate-600 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-400/10">
                              <Trash2 className="w-3.5 h-3.5"/>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* ═══════════ NOVO ATESTADO ═════════════════════════ */}
        {view === "novo" && (
          <motion.div key="novo" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="max-w-2xl">
            <Card>
              <h3 className="text-sm font-semibold text-slate-200 mb-6">Registrar Atestado</h3>

              <AnimatePresence>
                {success && (
                  <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}}
                    className="flex items-center gap-2 p-3 rounded-xl mb-4 text-emerald-400 text-sm border border-emerald-500/20"
                    style={{background:"rgba(34,197,94,0.08)"}}>
                    Atestado registrado com sucesso!
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Funcionário *</label>
                    <input {...register("employeeName",{required:true})} placeholder="Nome completo" className={inputCls}/>
                    {errors.employeeName && <p className="text-red-400 text-[10px] mt-1">Obrigatório</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Matrícula</label>
                    <input {...register("matricula")} placeholder="Ex: 001234" className={inputCls}/>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Setor *</label>
                    <select {...register("sector",{required:true})} className={inputCls} style={{background:"rgba(13,21,38,0.95)"}}>
                      <option value="">Selecione...</option>
                      {SETORES.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.sector && <p className="text-red-400 text-[10px] mt-1">Obrigatório</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Função</label>
                    <input {...register("jobFunction")} placeholder="Ex: Técnico de Enfermagem" className={inputCls}/>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>CID *</label>
                    <input {...register("cid",{required:true})} placeholder="Ex: J06, M54.5" className={inputCls}/>
                    {errors.cid && <p className="text-red-400 text-[10px] mt-1">Obrigatório</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Diagnóstico *</label>
                    <input {...register("diagnosis",{required:true})} placeholder="Ex: Infecção das vias aéreas" className={inputCls}/>
                    {errors.diagnosis && <p className="text-red-400 text-[10px] mt-1">Obrigatório</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Data de Início *</label>
                    <input type="date" {...register("startDate",{required:true})} className={inputCls}
                      style={{colorScheme:"dark"}}/>
                    {errors.startDate && <p className="text-red-400 text-[10px] mt-1">Obrigatório</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Dias de Afastamento *</label>
                    <input type="number" min={1} {...register("days",{required:true,min:1})} placeholder="Ex: 3" className={inputCls}/>
                    {errors.days && <p className="text-red-400 text-[10px] mt-1">Mínimo 1 dia</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Local de Atendimento</label>
                    <input {...register("careLocation")} placeholder="Ex: UPA, Hospital, Clínica" className={inputCls}/>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Observações</label>
                  <textarea {...register("observations")} rows={3} placeholder="Informações adicionais..." className={`${inputCls} resize-none`}/>
                </div>

                <div className="flex gap-3 pt-2">
                  <motion.button type="submit" disabled={createMut.isPending} whileTap={{scale:0.98}}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-60">
                    {createMut.isPending ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Salvando...</> : <><Plus className="w-4 h-4"/>Registrar Atestado</>}
                  </motion.button>
                  <button type="button" onClick={reset} className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white border border-white/10 hover:border-white/20 text-sm transition-all">
                    Limpar
                  </button>
                </div>

                {createMut.isError && (
                  <div className="flex items-center gap-2 text-red-400 text-xs mt-2">
                    <AlertCircle className="w-4 h-4"/>
                    {createMut.error.message}
                  </div>
                )}
              </form>
            </Card>
          </motion.div>
        )}
        </AnimatePresence>

      </div>
    </MainLayout>
  );
}
