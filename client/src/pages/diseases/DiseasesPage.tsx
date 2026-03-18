import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Stethoscope, Plus, Trash2, Eye, Edit2, TrendingUp, TrendingDown,
  Activity, Shield, BarChart2, Layers,
  ArrowRight, Download, Clock,
  Info, ChevronDown, ChevronUp, Sparkles, AlertTriangle, Siren,
  ArrowUpRight, ArrowDownRight, Minus,
} from "lucide-react";

// ─── Count-up hook ────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    function step(ts: number) {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return value;
}
import {
  ComposedChart, AreaChart, Area, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, BarChart,
} from "recharts";
import MainLayout from "@/components/MainLayout";
import { trpc } from "@/lib/trpc";
import {
  DarkPageHeader, DarkTable, DarkTr, DarkTd, DarkBadge,
  DarkSearch, FilterPills, DarkButton, IconBtn, DarkModal,
  DarkField, DarkInput, DarkSelect, DarkTextarea, DarkEmptyState, TableSkeleton,
} from "@/components/shared/DarkUI";
import { DetailDrawer, DrawerSection, DrawerRow } from "@/components/shared/DetailDrawer";
import { ExportButton, generateCSV, downloadCSV } from "@/components/shared/ExportButton";

// ─── Constants ──────────────────────────────────────────────────────────────
const FILTERS = [
  { label: "Todas", value: "todos" },
  { label: "Diagnosticada", value: "diagnosticada" },
  { label: "Afastada", value: "afastada" },
  { label: "Recuperada", value: "recuperada" },
  { label: "Crônica", value: "cronica" },
];
const HEADERS = ["Diagnóstico", "CID-10", "Colaborador", "Data Diagnóstico", "Status", ""];

type Form = {
  title: string; cid10: string; employeeName: string; employeeId: string;
  diagnosisDate: string; status: string; description: string;
  absenceStartDate: string; absenceEndDate: string;
};
const EMPTY: Form = {
  title: "", cid10: "", employeeName: "", employeeId: "",
  diagnosisDate: "", status: "diagnosticada", description: "",
  absenceStartDate: "", absenceEndDate: "",
};

const SECTOR_COLORS = [
  "#F97316", "#FB923C", "#FBBF24", "#F59E0B",
  "#EF4444", "#EC4899", "#A78BFA", "#60A5FA",
];

const CID_COLORS = [
  "#F97316", "#EF4444", "#A78BFA", "#60A5FA",
  "#34D399", "#FBBF24", "#EC4899", "#06B6D4",
  "#8B5CF6", "#10B981",
];

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, color, delay = 0,
  trend, barPct, anomaly,
}: {
  label: string; value: number | string; sub?: string;
  icon: any; color: string; delay?: number;
  trend?: number; barPct?: number; anomaly?: string;
}) {
  const numericVal = typeof value === "number" ? value : parseFloat(String(value)) || 0;
  const animated = useCountUp(numericVal, 900);
  const displayVal = typeof value === "string" && isNaN(Number(value)) ? value : animated;

  const TrendIcon = trend === undefined ? Minus : trend > 0 ? ArrowUpRight : ArrowDownRight;
  const trendColor = trend === undefined ? "#475569" : trend > 0 ? "#EF4444" : "#10B981";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="relative overflow-hidden rounded-2xl p-5 flex flex-col gap-3"
      style={{
        background: "linear-gradient(135deg, #0D1526 0%, #080F1E 100%)",
        border: `1px solid ${anomaly ? color + "40" : "rgba(255,255,255,0.06)"}`,
        boxShadow: anomaly ? `0 0 20px ${color}12` : "none",
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
      {anomaly && (
        <div className="absolute top-3 right-3">
          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ background: color + "20", color, border: `1px solid ${color}40` }}>
            {anomaly}
          </span>
        </div>
      )}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "rgba(148,163,184,0.7)" }}>{label}</span>
          <span className="text-3xl font-bold text-white tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{displayVal}</span>
          {sub && <span className="text-xs mt-0.5" style={{ color: "rgba(148,163,184,0.6)" }}>{sub}</span>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          {trend !== undefined && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: trendColor + "15", color: trendColor }}>
              <TrendIcon className="w-3 h-3" />
              {Math.abs(trend)}%
            </div>
          )}
        </div>
      </div>
      <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(barPct ?? 100, 100)}%` }}
          transition={{ duration: 1, delay: delay + 0.2 }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
        />
      </div>
    </motion.div>
  );
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
function TemporalTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-3 shadow-2xl border text-xs" style={{ background: "#0D1526", borderColor: "rgba(249,115,22,0.3)" }}>
      <p className="font-semibold text-white mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span style={{ color: "rgba(148,163,184,0.8)" }}>{p.name}:</span>
          <span className="font-mono font-semibold text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-3 shadow-2xl border text-xs" style={{ background: "#0D1526", borderColor: "rgba(249,115,22,0.3)" }}>
      <p className="font-semibold text-white mb-1 truncate max-w-[180px]">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
          <div className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="font-mono font-semibold text-white">{p.value}</span>
          <span style={{ color: "rgba(148,163,184,0.7)" }}>{p.name}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Disease Risk Index ───────────────────────────────────────────────────────
function DiseaseRiskGauge({ score }: { score: number }) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    const duration = 1200;
    function step(ts: number) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setAnimated(Math.round(score * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [score]);

  const clamp = Math.max(0, Math.min(100, animated));
  const SIZE = 140; const CX = SIZE / 2; const CY = SIZE / 2 + 8;
  const R = 50; const STROKE = 9;
  const START = 225; const SWEEP = 270;
  const pct = clamp / 100;

  function polar(cx: number, cy: number, r: number, deg: number) {
    const rad = (deg - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }
  function arc(startDeg: number, endDeg: number) {
    const s = polar(CX, CY, R, startDeg); const e = polar(CX, CY, R, endDeg);
    return `M ${s.x} ${s.y} A ${R} ${R} 0 ${endDeg - startDeg > 180 ? 1 : 0} 1 ${e.x} ${e.y}`;
  }

  // For disease risk: higher score = MORE risk (inverse of safety score)
  const riskColor = clamp <= 25 ? "#10B981" : clamp <= 55 ? "#F59E0B" : "#EF4444";
  const riskLabel = clamp <= 25 ? "Baixo" : clamp <= 55 ? "Moderado" : "Alto";
  const needleAngle = START + SWEEP * pct;
  const tip = polar(CX, CY, R - 4, needleAngle);
  const b1  = polar(CX, CY, 7, needleAngle + 90);
  const b2  = polar(CX, CY, 7, needleAngle - 90);

  return (
    <div className="flex flex-col items-center">
      <svg width={SIZE} height={SIZE * 0.72} viewBox={`0 0 ${SIZE} ${SIZE * 0.72}`} style={{ overflow: "visible" }}>
        <path d={arc(START, START + SWEEP)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={STROKE} strokeLinecap="round" />
        {pct > 0 && (
          <path d={arc(START, Math.min(START + SWEEP * pct, START + SWEEP - 0.01))}
            fill="none" stroke={riskColor} strokeWidth={STROKE} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 5px ${riskColor}70)` }} />
        )}
        <polygon points={`${tip.x},${tip.y} ${b1.x},${b1.y} ${b2.x},${b2.y}`} fill={riskColor} opacity={0.9} />
        <circle cx={CX} cy={CY} r={4.5} fill={riskColor} />
        <text x={CX} y={CY - 12} textAnchor="middle" style={{ fill: "#F8FAFC", fontSize: 22, fontWeight: 800, fontFamily: "'Sora', sans-serif" }}>{clamp}</text>
        <text x={CX} y={CY + 3} textAnchor="middle" style={{ fill: "#475569", fontSize: 8, fontFamily: "'Sora', sans-serif", textTransform: "uppercase" }}>/100</text>
      </svg>
      <div className="flex flex-col items-center gap-0.5 -mt-2">
        <span className="text-xs font-bold" style={{ color: riskColor }}>{riskLabel}</span>
        <span className="text-[9px] text-slate-600 uppercase tracking-wider">Índice de Risco</span>
      </div>
    </div>
  );
}

function DiseaseRiskCard({ total, afastados, cronicos, trend }: {
  total: number; afastados: number; cronicos: number; trend: number;
}) {
  const [expanded, setExpanded] = useState(false);

  // Score: 0 = sem risco, 100 = risco máximo
  const absencePenalty = Math.min(afastados * 12, 40);
  const chronicPenalty = Math.min(cronicos * 8, 24);
  const volumePenalty  = Math.min(total * 3, 24);
  const trendPenalty   = trend > 20 ? 12 : trend > 0 ? 6 : 0;
  const score = Math.min(100, Math.round(absencePenalty + chronicPenalty + volumePenalty + trendPenalty));

  const riskColor = score <= 25 ? "#10B981" : score <= 55 ? "#F59E0B" : "#EF4444";
  const mainDriver = absencePenalty >= 20 ? "afastamentos ativos" : chronicPenalty >= 16 ? "casos crônicos" : volumePenalty >= 16 ? "volume de diagnósticos" : "tendência de crescimento";

  const factors = [
    { label: "Afastamentos ativos", value: absencePenalty, max: 40, desc: `${afastados} afastamentos × 12pts`, color: "#EF4444" },
    { label: "Casos crônicos",      value: chronicPenalty, max: 24, desc: `${cronicos} crônicos × 8pts`,     color: "#A78BFA" },
    { label: "Volume de casos",     value: volumePenalty,  max: 24, desc: `${total} diagnósticos × 3pts`,    color: "#F97316" },
    { label: "Tendência temporal",  value: trendPenalty,   max: 12, desc: trend > 0 ? `+${trend}% mês ant.` : "Estável",      color: "#F59E0B" },
  ];

  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
      className="rounded-2xl p-5 flex flex-col gap-4 h-full"
      style={{ background: "linear-gradient(160deg, #0C1628 0%, #080F1E 100%)", border: `1px solid ${riskColor}22`, boxShadow: `0 0 30px ${riskColor}08` }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(249,115,22,0.15)" }}>
          <Activity className="w-3.5 h-3.5 text-orange-400" />
        </div>
        <div>
          <p className="text-xs font-bold text-orange-400 uppercase tracking-widest">Índice de Risco</p>
          <p className="text-[10px] text-slate-500">Período atual</p>
        </div>
      </div>

      {/* Gauge */}
      <div className="flex justify-center">
        <DiseaseRiskGauge score={score} />
      </div>

      {/* Main driver */}
      {score > 0 && (
        <div className="rounded-xl px-3 py-2 text-center" style={{ background: riskColor + "10", border: `1px solid ${riskColor}25` }}>
          <p className="text-[10px] text-slate-500 mb-0.5">Principal fator</p>
          <p className="text-xs font-bold" style={{ color: riskColor }}>↑ {mainDriver}</p>
        </div>
      )}

      {/* Factor bars */}
      <div className="flex flex-col gap-2.5">
        {factors.map((f, i) => (
          <div key={i}>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-slate-500">{f.label}</span>
              <span className="text-[10px] font-bold" style={{ color: f.value > 0 ? f.color : "#334155" }}>+{f.value}pts</span>
            </div>
            <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${f.max > 0 ? (f.value / f.max) * 100 : 0}%` }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                className="h-full rounded-full" style={{ background: f.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Expand toggle */}
      <button onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-1.5 text-[10px] font-semibold mt-auto"
        style={{ color: "#3B82F6", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
        <Info className="w-3 h-3" />
        {expanded ? "Ocultar metodologia" : "Como é calculado"}
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
            <div className="pt-3 border-t border-white/5 space-y-1.5">
              {factors.map((f, i) => (
                <div key={i} className="flex justify-between text-[10px]">
                  <span className="text-slate-500">{f.desc}</span>
                  <span className="font-bold" style={{ color: f.color }}>+{f.value}</span>
                </div>
              ))}
              <p className="text-[9px] text-slate-600 pt-1">Score = soma das penalidades · máx 100pts</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── AI Insights Panel ───────────────────────────────────────────────────────
function buildDiseaseInsights(analytics: any, afastados: number, cronicos: number, total: number, trend: number) {
  const insights: { type: "warning" | "danger" | "info" | "success"; title: string; body: string; impact: number; action: string; actionPath: string }[] = [];

  const topSector = analytics?.topSector;
  const mainCid   = analytics?.mainCid;
  const avgDays   = analytics?.avgAbsenceDays ?? 0;

  if (topSector?.total > 0 && total > 0) {
    const pct = Math.round((topSector.total / total) * 100);
    insights.push({
      type: pct >= 40 ? "danger" : "warning",
      title: `${topSector.sector} concentra ${pct}% dos diagnósticos`,
      body: `Este setor tem ${topSector.total} casos e ${topSector.afastamentos} afastamentos. Investigue as condições ergonômicas, químicas e organizacionais.`,
      impact: pct,
      action: "Ver relatórios",
      actionPath: "/relatorios",
    });
  }
  if (mainCid?.total > 0 && total > 0) {
    const pct = Math.round((mainCid.total / total) * 100);
    insights.push({
      type: pct >= 30 ? "danger" : "info",
      title: `${mainCid.cid10} é a patologia mais frequente (${pct}%)`,
      body: `"${mainCid.title}" afeta ${mainCid.total} colaboradores. Padrão recorrente exige revisão do PCMSO e análise de nexo causal.`,
      impact: pct,
      action: "Ver exames (ASO)",
      actionPath: "/exames",
    });
  }
  if (avgDays >= 15) {
    insights.push({
      type: "warning",
      title: `Média de ${avgDays} dias por afastamento — acima do esperado`,
      body: "Afastamentos prolongados impactam produtividade e elevam o custo previdenciário. Acione reabilitação profissional preventiva.",
      impact: Math.min(99, Math.round(avgDays * 2)),
      action: "Ver afastamentos",
      actionPath: "/absenteismo",
    });
  }
  if (trend > 15) {
    insights.push({
      type: "danger",
      title: `Crescimento de ${trend}% em diagnósticos vs mês anterior`,
      body: "Tendência ascendente indica deterioração das condições de saúde. Convoque reunião do SESMT e reforce as ações do PCMSO.",
      impact: Math.min(99, trend),
      action: "Ver agenda",
      actionPath: "/agenda",
    });
  }
  if (cronicos > 0) {
    insights.push({
      type: "info",
      title: `${cronicos} caso${cronicos > 1 ? "s" : ""} crônico${cronicos > 1 ? "s" : ""} exige${cronicos > 1 ? "m" : ""} PCMSO atualizado`,
      body: "Doenças crônicas requerem acompanhamento semestral documentado. Garanta que os ASOs estejam em dia para todos.",
      impact: Math.min(99, cronicos * 18),
      action: "Ver exames (ASO)",
      actionPath: "/exames",
    });
  }
  if (afastados >= 1) {
    insights.push({
      type: afastados >= 3 ? "danger" : "warning",
      title: `${afastados} colaborador${afastados > 1 ? "es" : ""} em afastamento ativo`,
      body: "Acompanhe os prazos de retorno, comunique o RH e acione o médico do trabalho para planejamento de reintegração.",
      impact: Math.min(99, afastados * 20),
      action: "Ver afastamentos",
      actionPath: "/absenteismo",
    });
  }

  return insights.slice(0, 4);
}

const INSIGHT_COLORS = {
  danger:  { color: "#EF4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.20)"   },
  warning: { color: "#F59E0B", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.20)"  },
  info:    { color: "#3B82F6", bg: "rgba(59,130,246,0.08)",  border: "rgba(59,130,246,0.20)"  },
  success: { color: "#10B981", bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.20)"  },
};
const INSIGHT_ICONS = { danger: Siren, warning: AlertTriangle, info: Activity, success: Shield };

function InsightCard({ analytics, afastados, cronicos, total, trend, onNavigate }: {
  analytics: any; afastados: number; cronicos: number; total: number; trend: number;
  onNavigate: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const insights = buildDiseaseInsights(analytics, afastados, cronicos, total, trend);

  if (!insights.length) return null;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl p-5 flex flex-col gap-3 h-full"
      style={{ background: "linear-gradient(160deg, #0C1628 0%, #080F1E 100%)", border: "1px solid rgba(249,115,22,0.12)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(59,130,246,0.2))" }}>
          <Sparkles className="w-4 h-4" style={{ color: "#A78BFA" }} />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#A78BFA" }}>Análise Inteligente</p>
          <p className="text-[10px] text-slate-500">{insights.length} insight{insights.length > 1 ? "s" : ""} detectado{insights.length > 1 ? "s" : ""}</p>
        </div>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: "rgba(124,58,237,0.15)", color: "#A78BFA", border: "1px solid rgba(124,58,237,0.25)" }}>
          IA
        </span>
      </div>

      {/* Insight cards */}
      <div className="flex flex-col gap-2">
        {insights.map((ins, i) => {
          const cfg = INSIGHT_COLORS[ins.type];
          const Icon = INSIGHT_ICONS[ins.type];
          const isOpen = expanded === i;
          return (
            <div key={i}
              onClick={() => setExpanded(isOpen ? null : i)}
              className="rounded-xl cursor-pointer transition-all duration-200"
              style={{
                background: isOpen ? cfg.bg : "rgba(255,255,255,0.02)",
                border: `1px solid ${isOpen ? cfg.border : "rgba(255,255,255,0.05)"}`,
              }}
            >
              <div className="flex items-start gap-3 p-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: cfg.color + "18" }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white leading-tight">{ins.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: cfg.color + "18", color: cfg.color }}>
                      Impacto {ins.impact}%
                    </span>
                  </div>
                </div>
                {isOpen
                  ? <ChevronUp className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                  : <ChevronDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                }
              </div>
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} style={{ overflow: "hidden" }}>
                    <div className="px-3 pb-3" style={{ borderTop: `1px solid ${cfg.border}` }}>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-2 mb-3">{ins.body}</p>
                      <button className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg"
                        style={{ background: cfg.color + "15", color: cfg.color, border: `1px solid ${cfg.color}25`, cursor: "pointer" }}
                        onClick={e => { e.stopPropagation(); onNavigate(ins.actionPath); }}>
                        <ArrowRight className="w-3 h-3" />
                        {ins.action}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Heatmap ─────────────────────────────────────────────────────────────────
function Heatmap({ heatmap, months }: { heatmap: any[]; months: { ym: string; label: string }[] }) {
  if (!heatmap?.length || !months?.length) return null;

  const maxVal = Math.max(1, ...heatmap.flatMap(row => months.map(m => row[m.ym] ?? 0)));

  const getColor = (val: number) => {
    if (val === 0) return "rgba(255,255,255,0.03)";
    const intensity = val / maxVal;
    if (intensity < 0.25) return "rgba(249,115,22,0.15)";
    if (intensity < 0.5) return "rgba(249,115,22,0.35)";
    if (intensity < 0.75) return "rgba(249,115,22,0.6)";
    return "rgba(249,115,22,0.85)";
  };

  const getTextColor = (val: number) => {
    if (val === 0) return "rgba(148,163,184,0.25)";
    const intensity = val / maxVal;
    return intensity >= 0.5 ? "#fff" : "rgba(249,115,22,0.9)";
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-separate" style={{ borderSpacing: "3px" }}>
        <thead>
          <tr>
            <th className="text-left pb-2 pr-3 font-medium text-slate-500 uppercase tracking-wider" style={{ minWidth: 130 }}>Setor</th>
            {months.map(m => (
              <th key={m.ym} className="text-center pb-2 font-medium text-slate-400 uppercase tracking-wider capitalize" style={{ minWidth: 52 }}>{m.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {heatmap.map((row, i) => (
            <motion.tr key={row.sector} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
              <td className="pr-3 py-1.5 text-slate-300 font-medium truncate" style={{ maxWidth: 130 }}>{row.sector}</td>
              {months.map(m => {
                const val = row[m.ym] ?? 0;
                return (
                  <td key={m.ym} className="text-center py-1.5">
                    <div
                      className="w-full h-9 rounded-lg flex items-center justify-center font-mono font-semibold transition-all duration-300 hover:scale-110 cursor-default"
                      style={{ background: getColor(val), color: getTextColor(val) }}
                      title={`${row.sector} — ${m.label}: ${val} caso(s)`}
                    >
                      {val > 0 ? val : "·"}
                    </div>
                  </td>
                );
              })}
            </motion.tr>
          ))}
        </tbody>
      </table>
      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-xs text-slate-500">Intensidade:</span>
        {["Sem", "Baixo", "Médio", "Alto", "Crítico"].map((l, i) => (
          <div key={l} className="flex items-center gap-1">
            <div className="w-5 h-3 rounded" style={{
              background: i === 0 ? "rgba(255,255,255,0.03)" : `rgba(249,115,22,${[0.15,0.35,0.6,0.85][i-1]})`
            }} />
            <span className="text-xs text-slate-500">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function ChartCard({
  title, subtitle, icon: Icon, accentColor = "#F97316", children, delay = 0,
}: {
  title: string; subtitle?: string; icon?: any;
  accentColor?: string; children: React.ReactNode; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      className="rounded-2xl p-5"
      style={{
        background: "linear-gradient(160deg, #0C1628 0%, #080F1E 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center gap-3 mb-5">
        {Icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${accentColor}15` }}>
            <Icon className="w-4 h-4" style={{ color: accentColor }} />
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className="ml-auto w-24 h-0.5 rounded-full" style={{ background: `linear-gradient(90deg, ${accentColor}40, transparent)` }} />
      </div>
      {children}
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
type EditForm = { status: string; absenceStartDate: string; absenceEndDate: string; description: string };
const EDIT_EMPTY: EditForm = { status: "diagnosticada", absenceStartDate: "", absenceEndDate: "", description: "" };

export function DiseasesList() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todos");
  const [sectorFilter, setSectorFilter] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [selected, setSelected] = useState<any>(null);
  const [errors, setErrors] = useState<Partial<Form>>({});
  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(EDIT_EMPTY);
  const [editErrors, setEditErrors] = useState<Partial<EditForm>>({});

  const { data = [], isLoading, refetch } = trpc.diseases.list.useQuery();
  const { data: analytics, isLoading: analyticsLoading } = trpc.diseases.analytics.useQuery();
  const { data: employees = [] } = trpc.employees.list.useQuery();
  const createMut = trpc.diseases.create.useMutation({ onSuccess: () => { setShowCreate(false); setForm(EMPTY); refetch(); } });
  const updateMut = trpc.diseases.update.useMutation({ onSuccess: () => { setShowEdit(false); setSelected(null); refetch(); } });
  const deleteMut = trpc.diseases.delete.useMutation({ onSuccess: () => { setSelected(null); refetch(); } });

  const openEdit = (record: any) => {
    setEditId(record.id);
    setEditForm({
      status: record.status ?? "diagnosticada",
      absenceStartDate: record.absenceStartDate ?? "",
      absenceEndDate: record.absenceEndDate ?? "",
      description: record.description ?? "",
    });
    setShowEdit(true);
  };

  const filtered = data.filter(d => {
    const q = search.toLowerCase();
    const match = d.title?.toLowerCase().includes(q) || d.employeeName?.toLowerCase().includes(q) || d.cid10?.toLowerCase().includes(q);
    const sectorMatch = !sectorFilter || (d as any).sector === sectorFilter;
    return match && (filter === "todos" || d.status === filter) && sectorMatch;
  });

  const CID_REGEX = /^[A-Za-z][0-9]{2}(\.[0-9A-Za-z]{0,2})?$/;

  const validate = () => {
    const e: Partial<Form> = {};
    if (!form.title.trim()) e.title = "Obrigatório";
    if (!form.cid10.trim()) e.cid10 = "Obrigatório";
    else if (!CID_REGEX.test(form.cid10.trim())) e.cid10 = "Formato inválido (ex: M54.5)";
    if (!form.employeeId && !form.employeeName.trim()) e.employeeName = "Selecione um colaborador";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const validateEdit = () => {
    const e: Partial<EditForm> = {};
    if (!editForm.status) e.status = "Obrigatório";
    setEditErrors(e);
    return !Object.keys(e).length;
  };

  const f = (k: keyof Form) => (e: React.ChangeEvent<any>) => setForm(p => ({ ...p, [k]: e.target.value }));
  const ef = (k: keyof EditForm) => (e: React.ChangeEvent<any>) => setEditForm(p => ({ ...p, [k]: e.target.value }));

  const handleSelectEmployee = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const empId = e.target.value;
    const emp = employees.find(emp => String(emp.id) === empId);
    setForm(p => ({ ...p, employeeId: empId, employeeName: emp?.name ?? "" }));
  };

  const handleExport = () => {
    const csv = generateCSV(
      ["ID", "Diagnóstico", "CID-10", "Colaborador", "Data Diagnóstico", "Status", "Início Afastamento", "Fim Afastamento"],
      data.map(d => [d.id, d.title, d.cid10, d.employeeName ?? "", d.diagnosisDate ?? "", d.status ?? "", d.absenceStartDate ?? "", d.absenceEndDate ?? ""])
    );
    downloadCSV(csv, `doencas_${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.csv`);
  };

  // Stats from list data
  const total = data.length;
  const afastados = data.filter(d => d.status === "afastada").length;
  const cronicos = data.filter(d => d.status === "cronica").length;
  const recuperados = data.filter(d => d.status === "recuperada").length;

  // Trend: last month vs previous
  const monthly = analytics?.monthly ?? [];
  const lastM = monthly[monthly.length - 1];
  const prevM = monthly[monthly.length - 2];
  const trend = lastM && prevM && prevM.total > 0
    ? Math.round(((lastM.total - prevM.total) / prevM.total) * 100)
    : 0;

  // bySector for chart: trim label
  const sectorData = useMemo(() =>
    (analytics?.bySector ?? []).map((r: any) => ({
      ...r,
      label: r.sector.length > 20 ? r.sector.slice(0, 18) + "…" : r.sector,
    })), [analytics]);

  // topCids for chart
  const cidData = useMemo(() =>
    (analytics?.topCids ?? []).slice(0, 8).map((r: any) => ({
      ...r,
      label: r.cid10,
      fullLabel: `${r.cid10} — ${r.title}`,
    })), [analytics]);

  return (
    <MainLayout title="Doenças Ocupacionais">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .disease-page * { font-family: 'Sora', sans-serif; }
        .disease-page .mono { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      <div className="disease-page p-5 lg:p-7 space-y-5">
        {/* ── Header ── */}
        <DarkPageHeader
          title="Doenças Ocupacionais"
          description="Análise epidemiológica e monitoramento de afastamentos"
          icon={Stethoscope}
          accent="#F97316"
          action={
            <div className="flex gap-2">
              <ExportButton onExportCSV={handleExport} />
              <DarkButton onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4" />Registrar
              </DarkButton>
            </div>
          }
        />

        {/* ── CTA Action Bar ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="rounded-2xl flex items-center justify-between gap-4 flex-wrap"
          style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.06)", padding: "10px 16px" }}
        >
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>Dados em tempo real · <strong className="text-slate-400">{total} caso{total !== 1 ? "s" : ""}</strong> registrado{total !== 1 ? "s" : ""}</span>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#64748B" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#E2E8F0"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#64748B"; }}
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
        </motion.div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Total de Casos" value={total} icon={Stethoscope} color="#F97316"
            trend={trend}
            barPct={total > 0 ? Math.min(100, total * 10) : 0}
            sub={trend !== 0 ? `vs mês anterior` : "Sem variação mensal"}
            delay={0} />
          <KpiCard label="Afastamentos Ativos" value={afastados} icon={AlertTriangle} color="#EF4444"
            barPct={total > 0 ? Math.round((afastados / total) * 100) : 0}
            sub={`${total > 0 ? Math.round((afastados / total) * 100) : 0}% do total`}
            anomaly={afastados >= 3 ? "Atenção" : undefined}
            delay={0.06} />
          <KpiCard label="Casos Crônicos" value={cronicos} icon={Activity} color="#A78BFA"
            barPct={total > 0 ? Math.round((cronicos / total) * 100) : 0}
            sub={`${total > 0 ? Math.round((cronicos / total) * 100) : 0}% do total`}
            delay={0.12} />
          <KpiCard label="Recuperados" value={recuperados} icon={Shield} color="#34D399"
            barPct={total > 0 ? Math.round((recuperados / total) * 100) : 0}
            sub={`${total > 0 ? Math.round((recuperados / total) * 100) : 0}% do total`}
            delay={0.18} />
        </div>

        {/* ── Temporal Chart + Risk + Insights ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Temporal evolution — 3/5 */}
          <div className="lg:col-span-3">
            <ChartCard
              title="Evolução Temporal — 12 Meses"
              subtitle="Tendência de diagnósticos, afastamentos e casos crônicos"
              icon={Activity}
              accentColor="#F97316"
              delay={0.1}
            >
              <div className="h-64">
                {analyticsLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="dAreaTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="mes" tick={{ fill: "rgba(148,163,184,0.6)", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "rgba(148,163,184,0.5)", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<TemporalTooltip />} />
                      <Area type="monotone" dataKey="total" name="Total" stroke="#F97316" strokeWidth={2}
                        fill="url(#dAreaTotal)" dot={false} activeDot={{ r: 5, fill: "#F97316" }} />
                      <Bar dataKey="afastamentos" name="Afastamentos" fill="#EF4444" opacity={0.8} radius={[3, 3, 0, 0]} maxBarSize={18} />
                      <Line type="monotone" dataKey="cronicas" name="Crônicos" stroke="#A78BFA"
                        strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="flex items-center gap-4 mt-3 justify-center">
                {[
                  { color: "#F97316", label: "Total de diagnósticos" },
                  { color: "#EF4444", label: "Afastamentos" },
                  { color: "#A78BFA", label: "Crônicos", dashed: true },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    {l.dashed
                      ? <div className="w-4 h-0 border-t-2 border-dashed" style={{ borderColor: l.color }} />
                      : <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                    }
                    <span className="text-xs text-slate-400">{l.label}</span>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>

          {/* Right column: Risk Index + Insights — 2/5 */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {analyticsLoading ? (
              <div className="flex-1 rounded-2xl flex items-center justify-center" style={{ background: "#0D1526", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-8 h-8 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin" />
              </div>
            ) : (
              <>
                <DiseaseRiskCard total={total} afastados={afastados} cronicos={cronicos} trend={trend} />
                <InsightCard analytics={analytics} afastados={afastados} cronicos={cronicos} total={total} trend={trend} onNavigate={navigate} />
              </>
            )}
          </div>
        </div>

        {/* ── Section label: Distribuição ── */}
        <div className="flex items-center gap-3 mt-1">
          <div className="h-px w-6" style={{ background: "rgba(255,255,255,0.12)" }} />
          <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Distribuição por Setor e Patologia</span>
          <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.05)" }} />
          <span className="text-xs text-slate-600">Priorize os setores com maior concentração de afastamentos</span>
        </div>

        {/* ── Sector Ranking + Top CIDs ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Ranking por Setor */}
          <ChartCard
            title="Ranking por Setor"
            subtitle={sectorFilter ? `Filtrado: ${sectorFilter} — clique na barra para limpar` : "Clique em uma barra para filtrar a tabela"}
            icon={BarChart2}
            accentColor="#F97316"
            delay={0.15}
          >
            <div className="h-60">
              {analyticsLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin" />
                </div>
              ) : sectorData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">Sem dados</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectorData} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "rgba(148,163,184,0.5)", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="label" tick={{ fill: "rgba(148,163,184,0.7)", fontSize: 10 }} axisLine={false} tickLine={false} width={100} />
                    <Tooltip content={<BarTooltip />} cursor={{ fill: "rgba(249,115,22,0.05)" }} />
                    <Bar dataKey="total" name="Casos" radius={[0, 4, 4, 0]} maxBarSize={20}
                      style={{ cursor: "pointer" }}
                      onClick={(entry: any) => setSectorFilter(s => s === entry.sector ? null : entry.sector)}>
                      {sectorData.map((row: any, i: number) => (
                        <Cell key={i}
                          fill={sectorFilter && sectorFilter !== row.sector ? SECTOR_COLORS[i % SECTOR_COLORS.length] + "40" : SECTOR_COLORS[i % SECTOR_COLORS.length]}
                        />
                      ))}
                    </Bar>
                    <Bar dataKey="afastamentos" name="Afastamentos" radius={[0, 4, 4, 0]} maxBarSize={20}
                      style={{ cursor: "pointer" }}
                      onClick={(entry: any) => setSectorFilter(s => s === entry.sector ? null : entry.sector)}>
                      {sectorData.map((row: any, i: number) => (
                        <Cell key={i}
                          fill={sectorFilter && sectorFilter !== row.sector ? SECTOR_COLORS[i % SECTOR_COLORS.length] + "20" : `${SECTOR_COLORS[i % SECTOR_COLORS.length]}60`}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </ChartCard>

          {/* Top CIDs */}
          <ChartCard
            title="Top CIDs / Patologias"
            subtitle="Diagnósticos mais frequentes por código"
            icon={Layers}
            accentColor="#EF4444"
            delay={0.2}
          >
            <div className="h-60">
              {analyticsLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-red-500/30 border-t-red-500 animate-spin" />
                </div>
              ) : cidData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">Sem dados</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cidData} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "rgba(148,163,184,0.5)", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="label" tick={{ fill: "rgba(148,163,184,0.7)", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} width={58} />
                    <Tooltip content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-xl p-3 shadow-2xl border text-xs" style={{ background: "#0D1526", borderColor: "rgba(239,68,68,0.3)", maxWidth: 220 }}>
                          <p className="font-mono font-bold text-red-300 mb-1">{d.cid10}</p>
                          <p className="text-white mb-2 text-xs leading-tight">{d.title}</p>
                          <div className="flex gap-3">
                            <span className="text-orange-300 font-semibold">{d.total} casos</span>
                            <span className="text-red-400">{d.afastamentos} afastamentos</span>
                          </div>
                        </div>
                      );
                    }} cursor={{ fill: "rgba(239,68,68,0.05)" }} />
                    <Bar dataKey="total" name="Casos" radius={[0, 4, 4, 0]} maxBarSize={18}>
                      {cidData.map((_: any, i: number) => (
                        <Cell key={i} fill={CID_COLORS[i % CID_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </ChartCard>
        </div>

        {/* ── Section label: Heatmap ── */}
        <div className="flex items-center gap-3 mt-1">
          <div className="h-px w-6" style={{ background: "rgba(255,255,255,0.12)" }} />
          <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Concentração Temporal por Setor</span>
          <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.05)" }} />
          <span className="text-xs text-slate-600">Identifique padrões sazonais de adoecimento</span>
        </div>

        {/* ── Heatmap ── */}
        <ChartCard
          title="Mapa de Calor — Setor × Mês"
          subtitle="Concentração de diagnósticos nos últimos 6 meses por departamento"
          icon={Layers}
          accentColor="#F97316"
          delay={0.25}
        >
          {analyticsLoading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin" />
            </div>
          ) : (
            <Heatmap
              heatmap={analytics?.heatmap ?? []}
              months={analytics?.heatmapMonths ?? []}
            />
          )}
        </ChartCard>

        {/* ── Section label: Registros ── */}
        <div className="flex items-center gap-3 mt-1">
          <div className="h-px w-6" style={{ background: "rgba(255,255,255,0.12)" }} />
          <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Registros de Doenças</span>
          <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.05)" }} />
          <span className="text-xs text-slate-600">{filtered.length} registro{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* ── Table ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex flex-col sm:flex-row gap-3 mb-4 flex-wrap">
            <div className="flex-1 max-w-sm">
              <DarkSearch value={search} onChange={setSearch} placeholder="CID, colaborador, diagnóstico..." />
            </div>
            <FilterPills options={FILTERS} value={filter} onChange={setFilter} />
            {sectorFilter && (
              <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                onClick={() => setSectorFilter(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.30)", color: "#FB923C", cursor: "pointer" }}>
                Setor: {sectorFilter}
                <span className="ml-1 text-orange-400 hover:text-white">×</span>
              </motion.button>
            )}
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: "#0D1526" }}>
              <TableSkeleton rows={4} cols={6} />
            </div>
          ) : filtered.length === 0 ? (
            <DarkEmptyState icon={Stethoscope} accent="#F97316"
              title={search || filter !== "todos" ? "Nenhum resultado" : "Nenhuma doença registrada"}
              description="Registre doenças e afastamentos ocupacionais."
              action={!search && filter === "todos" && (
                <DarkButton onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" />Registrar doença</DarkButton>
              )}
            />
          ) : (
            <DarkTable headers={HEADERS}>
              {filtered.map((d, i) => (
                <DarkTr key={d.id} onClick={() => setSelected(d)}>
                  <DarkTd>
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="font-medium text-white text-sm">{d.title}</motion.p>
                  </DarkTd>
                  <DarkTd>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-md text-orange-300" style={{ background: "rgba(249,115,22,0.1)" }}>{d.cid10}</span>
                  </DarkTd>
                  <DarkTd><span className="text-slate-400 text-xs">{d.employeeName ?? "—"}</span></DarkTd>
                  <DarkTd><span className="font-mono text-xs text-slate-400">{d.diagnosisDate ? new Date(d.diagnosisDate).toLocaleDateString("pt-BR") : "—"}</span></DarkTd>
                  <DarkTd><DarkBadge status={d.status ?? ""} /></DarkTd>
                  <DarkTd className="text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <IconBtn icon={Eye} onClick={() => setSelected(d)} />
                      <IconBtn icon={Edit2} onClick={() => openEdit(d)} />
                      <IconBtn icon={Trash2} color="text-slate-500 hover:text-red-400"
                        onClick={() => { if (confirm("Excluir?")) deleteMut.mutate({ id: d.id }); }} />
                    </div>
                  </DarkTd>
                </DarkTr>
              ))}
            </DarkTable>
          )}
        </motion.div>
      </div>

      {/* ── Create Modal ── */}
      <DarkModal open={showCreate} onClose={() => setShowCreate(false)} title="Registrar Doença Ocupacional" width="max-w-2xl">
        <div className="space-y-4">
          <DarkField label="Diagnóstico" required error={errors.title}>
            <DarkInput value={form.title} onChange={f("title")} placeholder="Ex: Lombralgia Ocupacional" />
          </DarkField>
          <div className="grid grid-cols-2 gap-4">
            <DarkField label="CID-10" required error={errors.cid10}>
              <DarkInput value={form.cid10} onChange={f("cid10")} placeholder="M54.5" />
            </DarkField>
            <DarkField label="Status">
              <DarkSelect value={form.status} onChange={f("status")}>
                <option value="diagnosticada">Diagnosticada</option>
                <option value="afastada">Afastada</option>
                <option value="recuperada">Recuperada</option>
                <option value="cronica">Crônica</option>
              </DarkSelect>
            </DarkField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DarkField label="Colaborador" required error={errors.employeeName}>
              <DarkSelect value={form.employeeId} onChange={handleSelectEmployee}>
                <option value="">Selecione o colaborador</option>
                {employees.filter(e => e.status !== "desligado").map(e => (
                  <option key={e.id} value={String(e.id)}>{e.name}</option>
                ))}
              </DarkSelect>
            </DarkField>
            <DarkField label="Data do Diagnóstico">
              <DarkInput type="date" value={form.diagnosisDate} onChange={f("diagnosisDate")} />
            </DarkField>
          </div>
          {form.status === "afastada" && (
            <div className="grid grid-cols-2 gap-4">
              <DarkField label="Início do Afastamento">
                <DarkInput type="date" value={form.absenceStartDate} onChange={f("absenceStartDate")} />
              </DarkField>
              <DarkField label="Fim do Afastamento">
                <DarkInput type="date" value={form.absenceEndDate} onChange={f("absenceEndDate")} />
              </DarkField>
            </div>
          )}
          <DarkField label="Observações">
            <DarkTextarea value={form.description} onChange={f("description")} rows={3} placeholder="Nexo causal, restrições, histórico..." />
          </DarkField>
          <div className="flex justify-end gap-3 pt-2 border-t border-white/6">
            <DarkButton variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</DarkButton>
            <DarkButton onClick={() => validate() && createMut.mutate(form as any)} disabled={createMut.isPending}>
              {createMut.isPending ? "Salvando..." : "Registrar"}
            </DarkButton>
          </div>
        </div>
      </DarkModal>

      {/* ── Detail Drawer ── */}
      <DetailDrawer
        open={!!selected} onClose={() => setSelected(null)}
        title={selected?.title ?? ""} subtitle={`Doença Ocupacional — CID ${selected?.cid10 ?? ""}`}
        icon={Stethoscope} accent="#F97316"
        actions={
          <>
            <DarkButton variant="danger" onClick={() => { if (confirm("Excluir?")) deleteMut.mutate({ id: selected?.id }); }}>
              <Trash2 className="w-3.5 h-3.5" />Excluir
            </DarkButton>
            <DarkButton variant="ghost" onClick={() => { if (selected) openEdit(selected); }}>
              <Edit2 className="w-3.5 h-3.5" />Editar
            </DarkButton>
            <span className="flex-1" />
            <DarkButton variant="ghost" onClick={() => setSelected(null)}>Fechar</DarkButton>
          </>
        }
      >
        {selected && (() => {
          const start = selected.absenceStartDate ? new Date(selected.absenceStartDate) : null;
          const end = selected.absenceEndDate ? new Date(selected.absenceEndDate) : null;
          const daysAbsent = start
            ? Math.round(((end ?? new Date()).getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
            : null;
          return (
            <>
              <DrawerSection title="Dados Clínicos">
                <DrawerRow label="CID-10" value={selected.cid10} mono />
                <DrawerRow label="Colaborador" value={selected.employeeName} />
                <DrawerRow label="Data do Diagnóstico" value={selected.diagnosisDate ? new Date(selected.diagnosisDate).toLocaleDateString("pt-BR") : undefined} />
                <DrawerRow label="Status" value={selected.status ?? "—"} />
              </DrawerSection>
              {(selected.absenceStartDate || selected.absenceEndDate) && (
                <DrawerSection title="Afastamento">
                  <DrawerRow label="Início" value={selected.absenceStartDate ? new Date(selected.absenceStartDate).toLocaleDateString("pt-BR") : undefined} />
                  <DrawerRow label="Término" value={selected.absenceEndDate ? new Date(selected.absenceEndDate).toLocaleDateString("pt-BR") : "Em andamento"} />
                  {daysAbsent !== null && (
                    <DrawerRow label="Duração" value={`${daysAbsent} dia${daysAbsent !== 1 ? "s" : ""}${!selected.absenceEndDate ? " (em andamento)" : ""}`} />
                  )}
                </DrawerSection>
              )}
              {selected.description && (
                <DrawerSection title="Observações">
                  <p className="text-sm text-slate-300 leading-relaxed">{selected.description}</p>
                </DrawerSection>
              )}
            </>
          );
        })()}
      </DetailDrawer>

      {/* ── Edit Modal ── */}
      <DarkModal open={showEdit} onClose={() => setShowEdit(false)} title="Editar Registro" width="max-w-lg">
        <div className="space-y-4">
          <DarkField label="Status" required error={editErrors.status}>
            <DarkSelect value={editForm.status} onChange={ef("status")}>
              <option value="diagnosticada">Diagnosticada</option>
              <option value="afastada">Afastada</option>
              <option value="recuperada">Recuperada</option>
              <option value="cronica">Crônica</option>
            </DarkSelect>
          </DarkField>
          {editForm.status === "afastada" && (
            <div className="grid grid-cols-2 gap-4">
              <DarkField label="Início do Afastamento">
                <DarkInput type="date" value={editForm.absenceStartDate} onChange={ef("absenceStartDate")} />
              </DarkField>
              <DarkField label="Fim do Afastamento">
                <DarkInput type="date" value={editForm.absenceEndDate} onChange={ef("absenceEndDate")} />
              </DarkField>
            </div>
          )}
          <DarkField label="Observações">
            <DarkTextarea value={editForm.description} onChange={ef("description")} rows={3} placeholder="Atualização do quadro clínico..." />
          </DarkField>
          <div className="flex justify-end gap-3 pt-2 border-t border-white/6">
            <DarkButton variant="ghost" onClick={() => setShowEdit(false)}>Cancelar</DarkButton>
            <DarkButton
              onClick={() => {
                if (validateEdit() && editId !== null) {
                  updateMut.mutate({
                    id: editId,
                    status: editForm.status as any,
                    absenceStartDate: editForm.absenceStartDate || undefined,
                    absenceEndDate: editForm.absenceEndDate || undefined,
                    description: editForm.description || undefined,
                  });
                }
              }}
              disabled={updateMut.isPending}
            >
              {updateMut.isPending ? "Salvando..." : "Salvar"}
            </DarkButton>
          </div>
        </div>
      </DarkModal>
    </MainLayout>
  );
}

export function DiseaseForm() { return <DiseasesList />; }
