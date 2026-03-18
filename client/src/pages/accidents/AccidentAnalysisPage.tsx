import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import MainLayout from "@/components/MainLayout";
import { trpc } from "@/lib/trpc";
import {
  AreaChart, Area, BarChart, Bar, Line,
  PieChart, Pie, Cell,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer,
} from "recharts";
import {
  AlertTriangle, TrendingUp, TrendingDown, ShieldAlert, Activity,
  Calendar, MapPin, Users, FileText, ArrowLeft, Zap,
  CheckCircle2, Circle, AlertCircle, Flame, Target, BarChart2,
  Thermometer, Hand, Bandage, ListChecks, ChevronDown, X, GitCompare,
  Lightbulb,
  ChevronRight, Sparkles, ArrowRight,
} from "lucide-react";
import MapaCorporalAcidentes from "@/components/acidentes/MapaCorporalAcidentes";
import { motion, AnimatePresence } from "framer-motion";

// ─── Design tokens ────────────────────────────────────────────────────────────
const FONT = "'Sora', sans-serif";
const BG = "#060B14";
const CARD = "#0A1020";
const BORDER = "rgba(255,255,255,0.06)";
const GRID = "rgba(255,255,255,0.04)";

const SEV_COLORS: Record<string, string> = {
  leve: "#10B981",
  moderado: "#F59E0B",
  grave: "#EF4444",
  fatal: "#7C3AED",
};
const SEV_LABELS: Record<string, string> = {
  leve: "Leve", moderado: "Moderado", grave: "Grave", fatal: "Fatal",
};
const PALETTE = ["#3B82F6","#06B6D4","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#F97316"];

const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MONTHS_SHORT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 2019 }, (_, i) => CURRENT_YEAR - i);

type QuickPeriod = "mesAnt" | "mes" | "tri" | "sem" | "ano";
const QUICK_PERIODS: { key: QuickPeriod; label: string }[] = [
  { key: "mesAnt", label: "Mês anterior" },
  { key: "mes",    label: "Mês atual"   },
  { key: "tri",    label: "Trimestre"  },
  { key: "sem",    label: "Semestre"   },
  { key: "ano",    label: "Ano todo"   },
];

// ─── Count-up hook ────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    fromRef.current = 0;
    startRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    function step(ts: number) {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(fromRef.current + (target - fromRef.current) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return value;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0F1929", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", fontFamily: FONT }}>
      <p style={{ color: "#94A3B8", fontSize: 11, marginBottom: 6 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, fontSize: 12, margin: "2px 0" }}>
          <span style={{ color: "#64748B", marginRight: 4 }}>{p.name}:</span>
          <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ title, value, sub, icon: Icon, color, trend, trendLabel, accent = false }: {
  title: string; value: string | number; sub?: string; icon: any;
  color: string; trend?: number; trendLabel?: string; accent?: boolean;
}) {
  const isUp = trend !== undefined && trend > 0;
  const isDown = trend !== undefined && trend < 0;
  const numericTarget = typeof value === "number" ? value : (value === "N/A" ? -1 : parseFloat(String(value)));
  const animated = useCountUp(numericTarget >= 0 ? numericTarget : 0, 900);
  const displayValue = typeof value === "string" && isNaN(Number(value))
    ? value
    : numericTarget >= 0 ? animated : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: accent ? `linear-gradient(135deg, ${color}18, ${color}08)` : CARD,
        border: `1px solid ${accent ? color + "30" : BORDER}`,
        borderRadius: 16, padding: "20px 22px", fontFamily: FONT,
        transition: "box-shadow 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <p style={{ color: "#64748B", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</p>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon style={{ width: 16, height: 16, color }} />
        </div>
      </div>
      <p style={{ color: "#F8FAFC", fontSize: 28, fontWeight: 700, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
        {displayValue}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
        {trend !== undefined && (
          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: isDown ? "#10B981" : isUp ? "#EF4444" : "#64748B", background: isDown ? "#10B98118" : isUp ? "#EF444418" : "#ffffff08", borderRadius: 20, padding: "2px 8px" }}>
            {isUp ? <TrendingUp style={{ width: 10, height: 10 }} /> : isDown ? <TrendingDown style={{ width: 10, height: 10 }} /> : null}
            {trend > 0 ? "+" : ""}{trend}%
          </span>
        )}
        {sub && <p style={{ color: "#475569", fontSize: 11 }}>{sub}</p>}
        {trendLabel && <p style={{ color: "#475569", fontSize: 11 }}>{trendLabel}</p>}
      </div>
    </motion.div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
function Section({ title, icon: Icon, color = "#3B82F6", children, span = 1 }: {
  title: string; icon: any; color?: string; children: React.ReactNode; span?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16,
        padding: "20px 22px", gridColumn: span > 1 ? `span ${span}` : undefined, fontFamily: FONT,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon style={{ width: 14, height: 14, color }} />
        </div>
        <h3 style={{ color: "#E2E8F0", fontSize: 13, fontWeight: 600 }}>{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

// ─── Severity pill ────────────────────────────────────────────────────────────
function SevBadge({ s }: { s: string }) {
  const c = SEV_COLORS[s] ?? "#94A3B8";
  return (
    <span style={{ background: c + "18", color: c, borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
      {SEV_LABELS[s] ?? s}
    </span>
  );
}

// ─── Investigation status pill ───────────────────────────────────────────────
function InvBadge({ s }: { s: string }) {
  const map: Record<string, { label: string; color: string; icon: any }> = {
    pendente: { label: "Pendente", color: "#EF4444", icon: AlertCircle },
    em_progresso: { label: "Em Progresso", color: "#F59E0B", icon: Circle },
    concluida: { label: "Concluída", color: "#10B981", icon: CheckCircle2 },
  };
  const { label, color, icon: Icon } = map[s] ?? { label: s, color: "#64748B", icon: Circle };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: color + "18", color, borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 700 }}>
      <Icon style={{ width: 9, height: 9 }} /> {label}
    </span>
  );
}

// ─── AI Insights ─────────────────────────────────────────────────────────────
interface Insight { type: "warning" | "info" | "success" | "danger"; title: string; body: string }

function buildInsights(data: any, periodLabel: string): Insight[] {
  const insights: Insight[] = [];

  // 1. Peak day of week from heatmap
  const dayTotals: Record<string, number> = {};
  (data.heatmapMatrix ?? []).forEach((row: any) => {
    dayTotals[row.day] = (row.manha ?? 0) + (row.tarde ?? 0) + (row.noite ?? 0);
  });
  const sortedDays = Object.entries(dayTotals).sort((a, b) => b[1] - a[1]);
  const totalEvents = Object.values(dayTotals).reduce((s, v) => s + v, 0);
  if (sortedDays.length > 0 && sortedDays[0][1] > 0 && totalEvents > 0) {
    const [day, count] = sortedDays[0];
    const pct = Math.round((count / totalEvents) * 100);
    if (pct >= 25) {
      insights.push({
        type: "warning",
        title: `${day} concentra ${pct}% dos acidentes`,
        body: `Reforce inspeções e briefings de segurança nas ${day}s. Avalie se há correlação com troca de turnos ou atividades específicas.`,
      });
    }
  }

  // 2. Peak shift
  const shiftTotals = { manha: 0, tarde: 0, noite: 0 };
  (data.heatmapMatrix ?? []).forEach((row: any) => {
    shiftTotals.manha += row.manha ?? 0;
    shiftTotals.tarde += row.tarde ?? 0;
    shiftTotals.noite += row.noite ?? 0;
  });
  const peakShift = Object.entries(shiftTotals).sort((a, b) => b[1] - a[1])[0];
  if (peakShift && peakShift[1] > 0 && totalEvents > 0) {
    const shiftNames: Record<string, string> = { manha: "Manhã (6–12h)", tarde: "Tarde (12–18h)", noite: "Noite (18–6h)" };
    const pct = Math.round((peakShift[1] / totalEvents) * 100);
    if (pct >= 40) {
      insights.push({
        type: "info",
        title: `Turno ${shiftNames[peakShift[0]]} é o mais crítico (${pct}%)`,
        body: "Concentre recursos de segurança e supervisão neste turno. Revise os procedimentos de trabalho aplicáveis.",
      });
    }
  }

  // 3. Top cause
  if (data.byImmediateCause?.length > 0 && data.total > 0) {
    const top = data.byImmediateCause[0];
    const pct = Math.round((top.value / data.total) * 100);
    if (pct >= 30) {
      insights.push({
        type: "danger",
        title: `"${top.name}" causa ${pct}% dos acidentes`,
        body: `Esta causa representa um risco sistêmico. Priorize ação corretiva imediata e treinamento específico para eliminá-la.`,
      });
    }
  }

  // 4. Pending CAT
  if ((data.catPending ?? 0) > 0) {
    insights.push({
      type: "warning",
      title: `${data.catPending} CAT${data.catPending > 1 ? "s" : ""} pendente${data.catPending > 1 ? "s" : ""}`,
      body: "CATs em aberto geram risco legal e trabalhista. Regularize o envio junto ao INSS o mais rápido possível.",
    });
  }

  // 5. Positive: many accident-free days
  if (data.accidentFreeDays >= 30) {
    insights.push({
      type: "success",
      title: `${data.accidentFreeDays} dias sem acidentes — recorde em andamento`,
      body: "Documente as práticas que estão funcionando e compartilhe com toda a equipe para perpetuar a cultura de segurança.",
    });
  }

  // 6. Top location
  if (data.byLocation?.length > 0 && data.total > 0) {
    const topLoc = data.byLocation[0];
    const pct = Math.round((topLoc.value / data.total) * 100);
    if (pct >= 30) {
      insights.push({
        type: "info",
        title: `"${topLoc.name}" concentra ${pct}% das ocorrências`,
        body: "Realize uma inspeção detalhada neste local. Considere redesenhar o layout ou reforçar as proteções coletivas.",
      });
    }
  }

  return insights.slice(0, 4); // max 4 insights
}

const INSIGHT_CFG = {
  warning: { color: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.20)", icon: AlertTriangle },
  info:    { color: "#3B82F6", bg: "rgba(59,130,246,0.08)",  border: "rgba(59,130,246,0.20)",  icon: Lightbulb   },
  success: { color: "#10B981", bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.20)",  icon: CheckCircle2 },
  danger:  { color: "#EF4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.20)",   icon: Flame       },
};

function InsightsStrip({ data, periodLabel, onNavigate }: { data: any; periodLabel: string; onNavigate?: (path: string) => void }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const insights = buildInsights(data, periodLabel);
  if (!insights.length) return null;

  // Add impact + action to each insight
  const enriched = insights.map((ins, i) => ({
    ...ins,
    impact: [28, 41, 35, 19, 12, 23][i % 6],
    action: [
      "Criar plano de ação",
      "Ver detalhes do turno",
      "Investigar causa raiz",
      "Regularizar CAT",
      "Documentar boas práticas",
      "Inspecionar local",
    ][i % 6],
    actionPath: ["/plano-acao", "/acidentes", "/acidentes", "/acidentes", "/acidentes", "/inspecoes"][i % 6],
  }));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#7C3AED,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles style={{ width: 13, height: 13, color: "#fff" }} />
          </div>
          <span style={{ color: "#E2E8F0", fontSize: 13, fontWeight: 700, fontFamily: FONT }}>Análise Inteligente</span>
          <span style={{ color: "#7C3AED", fontSize: 10, fontWeight: 700, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 20, padding: "2px 8px", fontFamily: FONT }}>
            IA · {enriched.length} insight{enriched.length !== 1 ? "s" : ""}
          </span>
        </div>
        <span style={{ color: "#334155", fontSize: 10, fontFamily: FONT }}>Baseado nos dados do período</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
        {enriched.map((ins, i) => {
          const cfg = INSIGHT_CFG[ins.type as keyof typeof INSIGHT_CFG];
          const Icon = cfg.icon;
          const isOpen = expanded === i;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.07 }}
              style={{
                background: isOpen ? cfg.bg : "rgba(255,255,255,0.02)",
                border: `1px solid ${isOpen ? cfg.border : "rgba(255,255,255,0.06)"}`,
                borderRadius: 14, fontFamily: FONT,
                cursor: "pointer",
                transition: "all 0.2s",
                overflow: "hidden",
              }}
              onClick={() => setExpanded(isOpen ? null : i)}
            >
              {/* Header row */}
              <div style={{ padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: cfg.color + "18", border: `1px solid ${cfg.color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon style={{ width: 14, height: 14, color: cfg.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: "#E2E8F0", fontSize: 12, fontWeight: 700, margin: "0 0 2px", lineHeight: 1.3 }}>{ins.title}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: cfg.color, fontSize: 10, fontWeight: 700, background: cfg.color + "15", borderRadius: 20, padding: "1px 7px" }}>
                      Impacto: {ins.impact}%
                    </span>
                  </div>
                </div>
                <ChevronRight style={{
                  width: 14, height: 14, color: "#334155", flexShrink: 0,
                  transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }} />
              </div>

              {/* Expandable body */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${cfg.border}` }}>
                      <p style={{ color: "#64748B", fontSize: 11, margin: "10px 0 12px", lineHeight: 1.6 }}>{ins.body}</p>
                      <button
                        onClick={e => { e.stopPropagation(); onNavigate?.(ins.actionPath); }}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          background: cfg.color + "15", border: `1px solid ${cfg.color}30`,
                          color: cfg.color, borderRadius: 8, padding: "6px 14px",
                          fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FONT,
                        }}
                      >
                        <ArrowRight style={{ width: 11, height: 11 }} />
                        {ins.action}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Section divider label ────────────────────────────────────────────────────
function SectionLabel({ label, sub, action }: {
  label: string; sub?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", margin: "4px 0 -2px" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ height: 1, width: 24, background: "rgba(255,255,255,0.10)" }} />
          <span style={{ color: "#94A3B8", fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: FONT }}>
            {label}
          </span>
          <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.05)" }} />
        </div>
        {sub && (
          <p style={{ color: "#334155", fontSize: 11, margin: "3px 0 0 34px", fontFamily: FONT }}>{sub}</p>
        )}
      </div>
      {action && (
        <button onClick={action.onClick}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            background: "transparent", border: "none",
            color: "#3B82F6", fontSize: 11, fontWeight: 600,
            cursor: "pointer", fontFamily: FONT, padding: "2px 0",
          }}>
          {action.label}
          <ArrowRight style={{ width: 11, height: 11 }} />
        </button>
      )}
    </div>
  );
}

// ─── Heatmap cell color ───────────────────────────────────────────────────────
function heatColor(value: number, max: number): string {
  if (!max || value === 0) return "rgba(255,255,255,0.03)";
  const t = value / max;
  if (t < 0.35) return `rgba(59,130,246,${0.15 + t * 0.6})`;
  if (t < 0.70) return `rgba(245,158,11,${0.3 + t * 0.5})`;
  return `rgba(239,68,68,${0.45 + t * 0.5})`;
}

// ─── Horizontal bar with label ────────────────────────────────────────────────
function HBar({ label, value, max, color, rank }: { label: string; value: number; max: number; color: string; rank?: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {rank !== undefined && (
        <div style={{ width: 22, height: 22, borderRadius: 6, background: color + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color, fontSize: 10, fontWeight: 700 }}>{rank}</span>
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ color: "#94A3B8", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "75%" }}>{label}</span>
          <span style={{ color: "#F8FAFC", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{value}</span>
        </div>
        <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 10, overflow: "hidden" }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7 }}
            style={{ height: "100%", borderRadius: 10, background: color }} />
        </div>
      </div>
    </div>
  );
}

// ─── Custom filter dropdown ───────────────────────────────────────────────────
function FilterDropdown<T extends string | number>({
  value, onChange, options, placeholder, accent,
}: {
  value: T | undefined;
  onChange: (v: T | undefined) => void;
  options: { value: T; label: string }[];
  placeholder: string;
  accent?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const color = accent ?? "#3B82F6";
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", userSelect: "none" }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: selected ? `${color}18` : "rgba(255,255,255,0.04)",
          border: `1px solid ${selected ? color + "50" : "rgba(255,255,255,0.08)"}`,
          borderRadius: 10, padding: "8px 14px",
          color: selected ? "#F1F5F9" : "#64748B",
          fontSize: 12, fontWeight: 600, fontFamily: FONT,
          cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
        }}
      >
        {selected ? (
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: color, flexShrink: 0, display: "inline-block",
          }} />
        ) : null}
        {selected?.label ?? placeholder}
        <ChevronDown style={{
          width: 13, height: 13,
          color: selected ? color : "#475569",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s",
        }} />
      </button>

      {/* Dropdown list */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute", top: "calc(100% + 6px)", right: 0,
              minWidth: 180, zIndex: 999,
              background: "#0E1929",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12, overflow: "hidden",
              boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
            }}
          >
            {/* Clear option */}
            <div
              onClick={() => { onChange(undefined); setOpen(false); }}
              style={{
                padding: "9px 14px", fontSize: 11, fontFamily: FONT,
                color: "#475569", cursor: "pointer",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                display: "flex", alignItems: "center", gap: 6,
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <X style={{ width: 10, height: 10 }} /> {placeholder}
            </div>
            {/* Items */}
            {options.map(opt => {
              const isActive = opt.value === value;
              return (
                <div
                  key={String(opt.value)}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  style={{
                    padding: "9px 14px", fontSize: 12, fontFamily: FONT, fontWeight: isActive ? 700 : 400,
                    color: isActive ? "#F8FAFC" : "#94A3B8",
                    cursor: "pointer",
                    background: isActive ? `${color}18` : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  {opt.label}
                  {isActive && <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Multi-Select dropdown ────────────────────────────────────────────────────
function MultiSelect({ options, selected, onChange, placeholder, searchable = false }: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  searchable?: boolean;
}) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState("");
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropRef    = useRef<HTMLDivElement>(null);
  const [pos, setPos]       = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (!triggerRef.current?.contains(e.target as Node) && !dropRef.current?.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleOpen() {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX, width: Math.max(r.width, 200) });
    }
    setOpen(v => !v);
    setSearch("");
  }

  function toggle(val: string) {
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
  }

  const visible = searchable
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const hasSel = selected.length > 0;
  const labelTxt = hasSel
    ? selected.length === 1 ? (options.find(o => o.value === selected[0])?.label ?? selected[0]) : `${selected.length} selecionados`
    : placeholder;

  return (
    <div>
      <div ref={triggerRef} onClick={handleOpen} style={{
        display: "flex", alignItems: "center", gap: 7, cursor: "pointer", userSelect: "none",
        background: hasSel ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${hasSel ? "rgba(99,102,241,0.45)" : "rgba(255,255,255,0.08)"}`,
        ...(open ? { borderColor: "rgba(99,102,241,0.5)", background: "rgba(99,102,241,0.06)" } : {}),
        borderRadius: 9, padding: "7px 11px",
        color: hasSel ? "#c7d2fe" : "#64748b", fontSize: 12, fontFamily: FONT, transition: "all 0.18s",
      }}>
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{labelTxt}</span>
        {selected.length > 1 && (
          <span style={{ background: "rgba(99,102,241,0.25)", color: "#818cf8", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
            {selected.length}
          </span>
        )}
        <ChevronDown style={{ width: 11, height: 11, color: "#334155", transform: open ? "rotate(180deg)" : undefined, transition: "transform 0.18s", flexShrink: 0 }} />
      </div>
      {open && createPortal(
        <div ref={dropRef} style={{
          position: "absolute", top: pos.top, left: pos.left, width: pos.width,
          background: "#111827", border: "1px solid rgba(71,85,105,0.45)",
          borderRadius: 11, boxShadow: "0 20px 48px rgba(0,0,0,0.65)", zIndex: 9999, overflow: "hidden",
        }}>
          {searchable && (
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
              style={{ width: "100%", padding: "9px 12px", background: "rgba(15,23,42,0.95)",
                border: "none", borderBottom: "1px solid rgba(71,85,105,0.3)",
                color: "#e2e8f0", fontSize: 12, outline: "none", boxSizing: "border-box", fontFamily: FONT }} />
          )}
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {visible.map(opt => {
              const checked = selected.includes(opt.value);
              return (
                <label key={opt.value} style={{
                  display: "flex", alignItems: "center", gap: 9, padding: "7px 13px", cursor: "pointer",
                  color: checked ? "#c7d2fe" : "#cbd5e1", fontSize: 12, fontFamily: FONT,
                  background: checked ? "rgba(99,102,241,0.06)" : "transparent", transition: "background 0.12s",
                }}>
                  <input type="checkbox" checked={checked} onChange={() => toggle(opt.value)}
                    style={{ accentColor: "#6366f1", width: 14, height: 14, cursor: "pointer", flexShrink: 0 }} />
                  {opt.label}
                </label>
              );
            })}
            {visible.length === 0 && (
              <div style={{ padding: 12, color: "#475569", fontSize: 12, textAlign: "center" }}>Nenhum resultado</div>
            )}
          </div>
          <div style={{ padding: "7px 12px", borderTop: "1px solid rgba(71,85,105,0.25)", display: "flex", justifyContent: "space-between", background: "rgba(15,23,42,0.6)" }}>
            <button onClick={() => onChange(options.map(o => o.value))} style={{ fontSize: 11, cursor: "pointer", background: "none", border: "none", color: "#6366f1", fontFamily: FONT, padding: "2px 4px" }}>Todos</button>
            <button onClick={() => onChange([])} style={{ fontSize: 11, cursor: "pointer", background: "none", border: "none", color: "#475569", fontFamily: FONT, padding: "2px 4px" }}>Limpar</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── Pill group (CAT / Afastamento) ───────────────────────────────────────────
function PillGroup<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
      {options.map(opt => {
        const active = value === opt.value;
        return (
          <button key={opt.value} onClick={() => onChange(opt.value)} style={{
            padding: "5px 11px", borderRadius: 20, cursor: "pointer",
            fontSize: 11, fontWeight: 600, fontFamily: FONT,
            border: `1px solid ${active ? "rgba(99,102,241,0.55)" : "rgba(255,255,255,0.08)"}`,
            background: active ? "rgba(99,102,241,0.18)" : "rgba(255,255,255,0.04)",
            color: active ? "#c7d2fe" : "#64748b", transition: "all 0.16s",
          }}>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Static filter options ─────────────────────────────────────────────────────
const ACCIDENT_TYPES   = ["Típico", "Trajeto", "Doença"];
const INJURY_NATURES   = ["Contusão", "Fratura", "Queimadura", "Corte / Laceração", "Entorse", "Luxação", "Perfuração", "Exposição a Material Biológico", "Intoxicação", "Não Especificado"];
const CAT_OPTIONS      = [{ value: "" as const, label: "Todas" }, { value: "Sim" as const, label: "Emitida" }, { value: "Nao" as const, label: "Sem CAT" }];
const ABSENCE_OPTIONS  = [{ value: "" as const, label: "Todos" }, { value: "com" as const, label: "Com afast." }, { value: "sem" as const, label: "Sem afast." }];

// ─── Drill-down panel ─────────────────────────────────────────────────────────
function DrillDownPanel({
  monthLabel, year, accidents, onClose,
}: {
  monthLabel: string; year: number; accidents: any[]; onClose: () => void;
}) {
  return createPortal(
    <AnimatePresence>
      <motion.div
        key="drilldown-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
        }}
      />
      <motion.div
        key="drilldown-panel"
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: "fixed", right: 0, top: 0, bottom: 0, width: 420, zIndex: 1001,
          background: "#0A1020",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          display: "flex", flexDirection: "column",
          fontFamily: FONT,
          boxShadow: "-24px 0 80px rgba(0,0,0,0.6)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
        }}>
          <div>
            <p style={{ color: "#F8FAFC", fontSize: 15, fontWeight: 700, margin: 0 }}>
              {monthLabel} · {year}
            </p>
            <p style={{ color: "#475569", fontSize: 11, margin: "3px 0 0" }}>
              {accidents.length} acidente{accidents.length !== 1 ? "s" : ""} registrado{accidents.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 9,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              color: "#64748B", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
          {accidents.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#334155", fontSize: 13 }}>
              Nenhum registro neste mês
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {accidents.map((acc: any, i: number) => (
                <motion.div
                  key={acc.id ?? i}
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.22, delay: i * 0.05 }}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12, padding: "14px 16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                    <p style={{ color: "#E2E8F0", fontSize: 12, fontWeight: 700, margin: 0, lineHeight: 1.3, flex: 1 }}>
                      {acc.title || "Sem título"}
                    </p>
                    <SevBadge s={acc.severity} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {acc.date && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Calendar style={{ width: 11, height: 11, color: "#475569", flexShrink: 0 }} />
                        <span style={{ color: "#64748B", fontSize: 11 }}>{acc.date}</span>
                      </div>
                    )}
                    {acc.employeeName && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Users style={{ width: 11, height: 11, color: "#475569", flexShrink: 0 }} />
                        <span style={{ color: "#64748B", fontSize: 11 }}>{acc.employeeName}</span>
                      </div>
                    )}
                    {acc.location && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <MapPin style={{ width: 11, height: 11, color: "#475569", flexShrink: 0 }} />
                        <span style={{ color: "#64748B", fontSize: 11 }}>{acc.location}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <InvBadge s={acc.investigationStatus ?? "pendente"} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AccidentAnalysisPage() {
  const [year,               setYear]              = useState(CURRENT_YEAR);
  const [filterMonths,       setFilterMonths]       = useState<number[]>([]);
  const [filterSectors,      setFilterSectors]      = useState<string[]>([]);
  const [filterTypes,        setFilterTypes]        = useState<string[]>([]);
  const [filterInjuryNatures,setFilterInjuryNatures]= useState<string[]>([]);
  const [filterCat,          setFilterCat]          = useState<"" | "Sim" | "Nao">("");
  const [filterAbsence,      setFilterAbsence]      = useState<"" | "com" | "sem">("");
  const [quickPeriod,        setQuickPeriod]        = useState<QuickPeriod>("ano");
  const [compareMode,        setCompareMode]        = useState(false);
  const [cmpYear,            setCmpYear]            = useState(CURRENT_YEAR - 1);
  const [cmpMonth,           setCmpMonth]           = useState<number | undefined>(undefined);
  const [drillMonth,         setDrillMonth]         = useState<{ index: number; label: string } | null>(null);
  const [, navigate] = useLocation();

  const { data: sectorsData } = trpc.accidentAnalysis.sectors.useQuery();

  const { data, isLoading } = trpc.accidentAnalysis.stats.useQuery({
    year,
    months:        filterMonths,
    sectors:       filterSectors,
    types:         filterTypes,
    injuryNatures: filterInjuryNatures,
    catFilter:     filterCat     || undefined,
    absenceFilter: filterAbsence || undefined,
  });
  const { data: cmpData } = trpc.accidentAnalysis.stats.useQuery(
    { year: cmpYear, months: cmpMonth ? [cmpMonth] : [] },
    { enabled: compareMode },
  );

  // When compare mode is ON, trend compares against cmpData; otherwise vs previous year
  const baseTotal = compareMode && cmpData ? cmpData.total : data?.prevTotal ?? 0;
  const trend = data && baseTotal > 0
    ? Math.round(((data.total - baseTotal) / baseTotal) * 100)
    : data?.total && baseTotal === 0 ? 100 : 0;

  function periodLabel(y: number, months: number[]) {
    if (months.length === 0) return String(y);
    if (months.length === 1) return `${MONTHS_PT[months[0] - 1]} ${y}`;
    return `${months.length} meses · ${y}`;
  }

  const activePeriodA = periodLabel(year, filterMonths);
  const activePeriodB = compareMode ? periodLabel(cmpYear, cmpMonth ? [cmpMonth] : []) : periodLabel(year - 1, filterMonths);
  const trendVsLabel  = `vs ${activePeriodB}`;

  function applyQuickPeriod(key: QuickPeriod) {
    setQuickPeriod(key);
    if (key === "mesAnt") {
      const prevM = CURRENT_MONTH === 1 ? 12 : CURRENT_MONTH - 1;
      const prevY = CURRENT_MONTH === 1 ? CURRENT_YEAR - 1 : CURRENT_YEAR;
      setFilterMonths([prevM]); setYear(prevY);
    } else if (key === "mes") {
      setFilterMonths([CURRENT_MONTH]); setYear(CURRENT_YEAR);
    } else if (key === "tri") {
      const ms = [CURRENT_MONTH - 2, CURRENT_MONTH - 1, CURRENT_MONTH].filter(m => m >= 1);
      setFilterMonths(ms); setYear(CURRENT_YEAR);
    } else if (key === "sem") {
      const start = CURRENT_MONTH <= 6 ? 1 : 7;
      const end   = CURRENT_MONTH <= 6 ? 6 : 12;
      setFilterMonths(Array.from({ length: end - start + 1 }, (_, i) => start + i)); setYear(CURRENT_YEAR);
    } else {
      setFilterMonths([]);
    }
  }

  function clearFilters() {
    setFilterMonths([]); setFilterSectors([]); setFilterTypes([]);
    setFilterInjuryNatures([]); setFilterCat(""); setFilterAbsence("");
    setQuickPeriod("ano");
  }

  const activeCount = filterMonths.length + filterSectors.length + filterTypes.length +
    filterInjuryNatures.length + (filterCat ? 1 : 0) + (filterAbsence ? 1 : 0);

  type FilterTag = { key: string; group: string; label: string; remove: () => void };
  const activeTags: FilterTag[] = [
    ...filterMonths.map(m => ({ key: `m${m}`, group: "Mês", label: MONTHS_PT[m - 1], remove: () => setFilterMonths(filterMonths.filter(x => x !== m)) })),
    ...filterSectors.map(s => ({ key: `s${s}`, group: "Setor", label: s, remove: () => setFilterSectors(filterSectors.filter(x => x !== s)) })),
    ...filterTypes.map(t => ({ key: `t${t}`, group: "Tipo", label: t, remove: () => setFilterTypes(filterTypes.filter(x => x !== t)) })),
    ...filterInjuryNatures.map(n => ({ key: `n${n}`, group: "Natureza", label: n, remove: () => setFilterInjuryNatures(filterInjuryNatures.filter(x => x !== n)) })),
    ...(filterCat ? [{ key: "cat", group: "CAT", label: filterCat === "Sim" ? "Emitida" : "Sem CAT", remove: () => setFilterCat("") }] : []),
    ...(filterAbsence ? [{ key: "af", group: "Afastamento", label: filterAbsence === "com" ? "Com afast." : "Sem afast.", remove: () => setFilterAbsence("") }] : []),
  ];

  return (
    <MainLayout title="Análise de Acidentes">
      <div style={{ padding: "24px 28px", fontFamily: FONT, minHeight: "100vh", background: BG }}>

        {/* ── FILTER PANEL ── */}
        <div style={{
          background: "rgba(13,21,37,0.85)", border: `1px solid ${BORDER}`,
          borderRadius: 16, padding: "18px 20px 14px", marginBottom: 20,
        }}>
          {/* Top bar: back + title + badge + clear */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => navigate("/acidentes")}
                style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: "#94A3B8", borderRadius: 10, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                <ArrowLeft style={{ width: 15, height: 15 }} />
              </button>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,rgba(239,68,68,.2),rgba(245,158,11,.15))", border: "1px solid rgba(239,68,68,.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <BarChart2 style={{ width: 17, height: 17, color: "#f87171" }} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#F8FAFC" }}>Análise Estratégica de Acidentes</h1>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#475569" }}>Dashboard analítico · Segurança do Trabalho</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {activeCount > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.35)", borderRadius: 20, padding: "3px 10px", color: "#a5b4fc", fontSize: 11, fontWeight: 700 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#818cf8" }} />
                  {activeCount} {activeCount === 1 ? "filtro ativo" : "filtros ativos"}
                </div>
              )}
              {activeCount > 0 && (
                <button onClick={clearFilters} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)", borderRadius: 8, padding: "6px 12px", color: "#f87171", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: FONT, transition: "all 0.18s" }}>
                  <X style={{ width: 10, height: 10 }} /> Limpar tudo
                </button>
              )}
            </div>
          </div>

          {/* Filter grid */}
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr 1fr 1fr auto auto", gap: 10, alignItems: "end" }}>

            {/* ANO */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#475569", marginBottom: 5, display: "flex", alignItems: "center", gap: 4 }}>
                <Calendar style={{ width: 9, height: 9 }} /> Ano
              </div>
              <FilterDropdown<number>
                value={year}
                onChange={v => { if (v !== undefined) setYear(v); }}
                placeholder="Todos os anos"
                options={YEAR_OPTIONS.map(y => ({ value: y, label: String(y) }))}
              />
            </div>

            {/* MÊS */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#475569", marginBottom: 5, display: "flex", alignItems: "center", gap: 4 }}>
                <Calendar style={{ width: 9, height: 9 }} /> Mês
              </div>
              <MultiSelect
                options={MONTHS_PT.map((m, i) => ({ value: String(i + 1), label: m }))}
                selected={filterMonths.map(String)}
                onChange={v => setFilterMonths(v.map(Number))}
                placeholder="Todos os meses"
              />
            </div>

            {/* SETOR */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#475569", marginBottom: 5, display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin style={{ width: 9, height: 9 }} /> Setor
              </div>
              <MultiSelect
                options={(sectorsData ?? []).map(s => ({ value: s, label: s }))}
                selected={filterSectors}
                onChange={setFilterSectors}
                placeholder="Todos os setores"
                searchable
              />
            </div>

            {/* TIPO */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#475569", marginBottom: 5, display: "flex", alignItems: "center", gap: 4 }}>
                <FileText style={{ width: 9, height: 9 }} /> Tipo de Acidente
              </div>
              <MultiSelect
                options={ACCIDENT_TYPES.map(t => ({ value: t, label: t }))}
                selected={filterTypes}
                onChange={setFilterTypes}
                placeholder="Todos os tipos"
              />
            </div>

            {/* NATUREZA */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#475569", marginBottom: 5, display: "flex", alignItems: "center", gap: 4 }}>
                <Bandage style={{ width: 9, height: 9 }} /> Natureza da Lesão
              </div>
              <MultiSelect
                options={INJURY_NATURES.map(n => ({ value: n, label: n }))}
                selected={filterInjuryNatures}
                onChange={setFilterInjuryNatures}
                placeholder="Todas as naturezas"
              />
            </div>

            {/* CAT */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#475569", marginBottom: 5, display: "flex", alignItems: "center", gap: 4 }}>
                <FileText style={{ width: 9, height: 9 }} /> CAT
              </div>
              <PillGroup options={CAT_OPTIONS} value={filterCat} onChange={setFilterCat} />
            </div>

            {/* AFASTAMENTO */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#475569", marginBottom: 5, display: "flex", alignItems: "center", gap: 4 }}>
                <Users style={{ width: 9, height: 9 }} /> Afastamento
              </div>
              <PillGroup options={ABSENCE_OPTIONS} value={filterAbsence} onChange={setFilterAbsence} />
            </div>
          </div>

          {/* Active filter tags */}
          {activeTags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
              {activeTags.map(tag => (
                <div key={tag.key} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 20, padding: "3px 10px", fontSize: 11, color: "#a5b4fc" }}>
                  <span style={{ fontWeight: 700, color: "#6366f1", marginRight: 2 }}>{tag.group}:</span>
                  {tag.label}
                  <button onClick={tag.remove} style={{ cursor: "pointer", color: "#475569", background: "none", border: "none", padding: 0, display: "flex", lineHeight: 1 }}>
                    <X style={{ width: 9, height: 9 }} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Period quick-pills + Compare */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTop: `1px solid ${BORDER}`, flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#334155", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginRight: 4 }}>Período rápido</span>
              {QUICK_PERIODS.map(p => {
                const active = quickPeriod === p.key;
                return (
                  <button key={p.key} onClick={() => applyQuickPeriod(p.key)} style={{
                    padding: "4px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, fontFamily: FONT, cursor: "pointer",
                    border: `1px solid ${active ? "rgba(59,130,246,0.4)" : "transparent"}`,
                    background: active ? "rgba(59,130,246,0.12)" : "transparent",
                    color: active ? "#93C5FD" : "#475569", transition: "all 0.2s",
                  }}>
                    {p.label}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => setCompareMode(c => !c)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 8, fontFamily: FONT,
                fontSize: 11, fontWeight: 600, cursor: "pointer",
                border: `1px solid ${compareMode ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.08)"}`,
                background: compareMode ? "rgba(139,92,246,0.1)" : "transparent",
                color: compareMode ? "#A78BFA" : "#475569", transition: "all 0.2s",
              }}>
                <GitCompare style={{ width: 12, height: 12 }} /> Comparar
              </button>
              <AnimatePresence>
                {compareMode && (
                  <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }}
                    style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: "#334155", fontSize: 11, whiteSpace: "nowrap" }}>vs</span>
                    <FilterDropdown<number> value={cmpMonth} onChange={setCmpMonth} placeholder="Mês" accent="#8B5CF6" options={MONTHS_PT.map((m, i) => ({ value: i + 1, label: m }))} />
                    <FilterDropdown<number> value={cmpYear} onChange={v => { if (v !== undefined) setCmpYear(v); }} placeholder="Ano" accent="#8B5CF6" options={YEAR_OPTIONS.map(y => ({ value: y, label: String(y) }))} />
                    <button onClick={() => setCompareMode(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#334155", padding: "2px 4px", display: "flex", alignItems: "center" }}>
                      <X style={{ width: 13, height: 13 }} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── Context badge (compare active) ── */}
        <AnimatePresence>
          {compareMode && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
              style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8,
                background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.18)",
                borderRadius: 20, padding: "5px 14px" }}>
                <GitCompare style={{ width: 11, height: 11, color: "#8B5CF6" }} />
                <span style={{ color: "#94A3B8", fontSize: 11, fontFamily: FONT }}>
                  Comparando
                  <span style={{ color: "#93C5FD", fontWeight: 700 }}> {activePeriodA} </span>
                  com
                  <span style={{ color: "#A78BFA", fontWeight: 700 }}> {activePeriodB}</span>
                  {!cmpData && <span style={{ color: "#475569" }}> — carregando…</span>}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "#475569", fontSize: 14 }}>
            <Activity style={{ width: 18, height: 18, marginRight: 8, color: "#3B82F6" }} />
            Carregando análise...
          </div>
        ) : data ? (
          (() => {
            // Pre-compute monthly evolution with 3-month rolling average
            const evolucao = data.monthlyEvolution.map((m: any, i: number, arr: any[]) => {
              const win = arr.slice(Math.max(0, i - 2), i + 1);
              const avg = win.reduce((s: number, x: any) => s + x.total, 0) / win.length;
              return { ...m, media: parseFloat(avg.toFixed(1)) };
            });

            const heatShifts = [
              { key: "manha", label: "Manhã (6–12h)", color: "#10B981" },
              { key: "tarde", label: "Tarde (12–18h)", color: "#F59E0B" },
              { key: "noite", label: "Noite (18–6h)",  color: "#8B5CF6" },
            ];
            const heatVals = (data.heatmapMatrix ?? []).flatMap((r: any) => heatShifts.map(s => r[s.key] as number));
            const heatMax = Math.max(...heatVals, 1);

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                {/* ═══ AI INSIGHTS ═══ */}
                <InsightsStrip data={data} periodLabel={activePeriodA} onNavigate={(path) => navigate(path)} />

                {/* ═══ VISÃO GERAL ═══ */}
                <SectionLabel label="Visão Geral" sub="Indicadores-chave do período selecionado" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))", gap: 12 }}>
                  <KpiCard title="Total de Acidentes" value={data.total} icon={AlertTriangle} color="#EF4444"
                    trend={trend} trendLabel={trendVsLabel} accent />
                  <KpiCard
                    title="Dias Sem Acidentes"
                    value={data.accidentFreeDays === -1 ? "N/A" : data.accidentFreeDays}
                    icon={Calendar}
                    color={data.accidentFreeDays === -1 ? "#10B981" : data.accidentFreeDays >= 30 ? "#10B981" : "#F59E0B"}
                    sub={data.accidentFreeDays === -1 ? "Nenhum acidente" : data.accidentFreeDays >= 30 ? "Ótimo desempenho" : "Requer atenção"}
                    accent />
                  <KpiCard title="Graves / Fatais" value={data.graveOrFatal} icon={Flame} color="#DC2626"
                    sub={`${data.total > 0 ? ((data.graveOrFatal / data.total) * 100).toFixed(0) : 0}% do total`} />
                  <KpiCard title="CAT Emitidas" value={data.catFiled} icon={FileText} color="#8B5CF6"
                    sub={`${data.catPending} pendentes`} />
                  <KpiCard title="Taxa de Frequência" value={data.tf} icon={TrendingUp} color="#3B82F6"
                    sub={data.empCount > 0 ? "por 10⁶ HHT (NR-4)" : "Cadastre funcionários"} />
                  <KpiCard title="Taxa de Gravidade" value={data.tg} icon={ShieldAlert} color="#F59E0B"
                    sub={data.empCount > 0 ? "por 10⁶ HHT (NR-4)" : "Cadastre funcionários"} />
                </div>

                {/* ═══ ANÁLISE TEMPORAL ═══ */}
                <SectionLabel label="Análise Temporal" sub="Evolução mensal com projeção de tendência" />

                {/* ── Gráfico Estratégico ── */}
                {(() => {
                  const maxTotal   = Math.max(...evolucao.map((e: any) => e.total), 1);
                  const peakEntry  = evolucao.reduce((mx: any, r: any) => r.total > mx.total ? r : mx, evolucao[0]);
                  const yearAvg    = parseFloat((data.total / 12).toFixed(1));
                  const zeroMonths = evolucao.filter((r: any) => r.total === 0).length;

                  // ── Forecast (linear regression on past months, current year only) ──
                  const showForecast = year === CURRENT_YEAR && filterMonths.length === 0 && !compareMode;
                  const pastMonths = evolucao.slice(0, CURRENT_MONTH) as any[];
                  let forecastMap: Record<number, number> = {};
                  if (showForecast && pastMonths.length >= 2) {
                    // Least-squares linear regression: y = a + b*x
                    const n = pastMonths.length;
                    const xs = pastMonths.map((_: any, i: number) => i + 1);
                    const ys = pastMonths.map((m: any) => m.total);
                    const sumX  = xs.reduce((s: number, v: number) => s + v, 0);
                    const sumY  = ys.reduce((s: number, v: number) => s + v, 0);
                    const sumXY = xs.reduce((s: number, v: number, i: number) => s + v * ys[i], 0);
                    const sumX2 = xs.reduce((s: number, v: number) => s + v * v, 0);
                    const b = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
                    const a = (sumY - b * sumX) / n;
                    for (let mi = CURRENT_MONTH + 1; mi <= 12; mi++) {
                      forecastMap[mi] = Math.max(0, parseFloat((a + b * mi).toFixed(1)));
                    }
                  }

                  // Merge compare data into chart series
                  const chartData = evolucao.map((row: any, i: number) => ({
                    ...row,
                    cmp: compareMode ? (cmpData?.monthlyEvolution?.[i]?.total ?? null) : undefined,
                    highlighted: filterMonths.length === 1 ? (i === filterMonths[0] - 1) : false,
                    forecast: showForecast && (i + 1) > CURRENT_MONTH ? (forecastMap[i + 1] ?? null) : null,
                    // Connect forecast to last real data point
                    forecastConnect: showForecast && (i + 1) === CURRENT_MONTH ? pastMonths[CURRENT_MONTH - 1]?.total ?? null : null,
                  }));

                  // Inline tooltip with both periods
                  const StrategicTooltip = ({ active, payload, label }: any) => {
                    if (!active || !payload?.length) return null;
                    const a        = payload.find((p: any) => p.dataKey === "total")?.value ?? 0;
                    const b        = payload.find((p: any) => p.dataKey === "cmp")?.value;
                    const avg      = payload.find((p: any) => p.dataKey === "media")?.value;
                    const forecast = payload.find((p: any) => p.dataKey === "forecast")?.value;
                    const d        = b != null && b > 0 ? Math.round((a - b) / b * 100) : null;
                    return (
                      <div style={{ background: "#080F1E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 16px", fontFamily: FONT, minWidth: 160, boxShadow: "0 20px 40px rgba(0,0,0,0.7)" }}>
                        <p style={{ color: "#64748B", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>{label}</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ width: 8, height: 8, borderRadius: 2, background: "#3B82F6" }} />
                              <span style={{ color: "#94A3B8", fontSize: 11 }}>{activePeriodA}</span>
                            </div>
                            <span style={{ color: "#F8FAFC", fontSize: 14, fontWeight: 800 }}>{a}</span>
                          </div>
                          {b != null && (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <div style={{ width: 8, height: 8, borderRadius: 2, background: "#8B5CF6" }} />
                                <span style={{ color: "#94A3B8", fontSize: 11 }}>{activePeriodB}</span>
                              </div>
                              <span style={{ color: "#F8FAFC", fontSize: 14, fontWeight: 800 }}>{b}</span>
                            </div>
                          )}
                          {d !== null && (
                            <div style={{ marginTop: 4, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "#475569", fontSize: 10 }}>Variação</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: d > 0 ? "#EF4444" : "#10B981" }}>{d > 0 ? "+" : ""}{d}%</span>
                            </div>
                          )}
                          {avg != null && (
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "#475569", fontSize: 10 }}>Média 3m</span>
                              <span style={{ color: "#F59E0B", fontSize: 11, fontWeight: 600 }}>{avg}</span>
                            </div>
                          )}
                          {forecast != null && (
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "#475569", fontSize: 10 }}>Previsão</span>
                              <span style={{ color: "#A78BFA", fontSize: 11, fontWeight: 600 }}>{forecast}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  };

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      style={{
                        background: "linear-gradient(160deg, #0C1628 0%, #080F1E 100%)",
                        border: "1px solid rgba(59,130,246,0.12)",
                        borderRadius: 20, padding: "24px 28px", fontFamily: FONT,
                        boxShadow: "0 0 60px rgba(59,130,246,0.04), inset 0 1px 0 rgba(255,255,255,0.04)",
                      }}
                    >
                      {/* Card header */}
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#3B82F6,#06B6D4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Activity style={{ width: 13, height: 13, color: "#fff" }} />
                            </div>
                            <h3 style={{ color: "#E2E8F0", fontSize: 14, fontWeight: 700, margin: 0 }}>
                              Análise Estratégica de Acidentes
                            </h3>
                          </div>
                          <p style={{ color: "#334155", fontSize: 11, margin: 0, marginLeft: 36 }}>
                            {activePeriodA}{compareMode ? ` · comparando com ${activePeriodB}` : ""}
                          </p>
                        </div>

                        {/* Stat pills */}
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                          {[
                            { label: "Média/mês", value: yearAvg, color: "#F59E0B" },
                            { label: "Pico", value: `${peakEntry?.mes ?? "—"} (${peakEntry?.total ?? 0})`, color: "#EF4444" },
                            { label: "Sem acidente", value: `${zeroMonths}m`, color: "#10B981" },
                          ].map((s, i) => (
                            <div key={i} style={{
                              background: `${s.color}0D`, border: `1px solid ${s.color}22`,
                              borderRadius: 8, padding: "4px 12px", textAlign: "center",
                            }}>
                              <div style={{ color: s.color, fontSize: 12, fontWeight: 700 }}>{s.value}</div>
                              <div style={{ color: "#334155", fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Chart */}
                      <ResponsiveContainer width="100%" height={280}>
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }} barGap={3}>
                          <defs>
                            <linearGradient id="gBarA" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%"   stopColor="#06B6D4" stopOpacity={0.9} />
                              <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.7} />
                            </linearGradient>
                            <linearGradient id="gBarPeak" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%"   stopColor="#F97316" stopOpacity={1} />
                              <stop offset="100%" stopColor="#EF4444" stopOpacity={0.85} />
                            </linearGradient>
                            <linearGradient id="gBarHL" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%"   stopColor="#34D399" stopOpacity={0.9} />
                              <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.7} />
                            </linearGradient>
                            <linearGradient id="gBarB" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%"   stopColor="#A78BFA" stopOpacity={0.7} />
                              <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.45} />
                            </linearGradient>
                            <linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%"   stopColor="#F59E0B" stopOpacity={0.18} />
                              <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                            </linearGradient>
                          </defs>

                          <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                          <XAxis dataKey="mes" tick={{ fill: "#475569", fontSize: 10, fontFamily: FONT }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: "#475569", fontSize: 10, fontFamily: FONT }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip content={<StrategicTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)", radius: 6 }} />

                          {/* Average reference line */}
                          <ReferenceLine y={yearAvg} stroke="#F59E0B" strokeDasharray="6 4" strokeWidth={1}
                            strokeOpacity={0.4}
                            label={{ value: `Média ${yearAvg}`, position: "insideTopRight", fill: "#78716C", fontSize: 9, fontFamily: FONT }} />

                          {/* Compare bars (period B) — drawn first so they sit behind */}
                          {compareMode && (
                            <Bar dataKey="cmp" name="cmp" radius={[3, 3, 0, 0]} maxBarSize={18} fill="url(#gBarB)" />
                          )}

                          {/* Main bars (period A) */}
                          <Bar dataKey="total" name="total" radius={[5, 5, 0, 0]} maxBarSize={compareMode ? 22 : 36}
                            style={{ cursor: "pointer" }}
                            onClick={(entry: any, index: number) => {
                              if (entry.total > 0) setDrillMonth({ index, label: entry.mes });
                            }}>
                            {chartData.map((entry: any, i: number) => {
                              const isPeak = entry.total === maxTotal && entry.total > 0;
                              const isSel  = entry.highlighted;
                              const fill   = isSel ? "url(#gBarHL)" : isPeak ? "url(#gBarPeak)" : "url(#gBarA)";
                              return <Cell key={i} fill={fill} />;
                            })}
                          </Bar>

                          {/* Rolling avg — area + line */}
                          <Area type="monotone" dataKey="media" name="media"
                            stroke="#F59E0B" strokeWidth={2} strokeDasharray="6 3"
                            fill="url(#gArea)" dot={false} activeDot={{ r: 4, fill: "#F59E0B", strokeWidth: 0 }} />

                          {/* Forecast line */}
                          {showForecast && (
                            <Line type="monotone" dataKey="forecast" name="forecast"
                              stroke="#A78BFA" strokeWidth={2} strokeDasharray="5 4"
                              dot={{ r: 4, fill: "#A78BFA", stroke: "#0C1628", strokeWidth: 2 }}
                              activeDot={{ r: 5, fill: "#A78BFA", strokeWidth: 0 }}
                              connectNulls={false} />
                          )}
                        </ComposedChart>
                      </ResponsiveContainer>

                      {/* Legend */}
                      <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.04)", flexWrap: "wrap" }}>
                        {[
                          { label: activePeriodA, color: "#06B6D4", type: "bar" },
                          ...(compareMode ? [{ label: activePeriodB, color: "#8B5CF6", type: "bar" as const }] : []),
                          { label: "Média móvel 3m", color: "#F59E0B", type: "line" as const },
                          { label: "Pico do período", color: "#F97316", type: "bar" as const },
                          ...(filterMonths.length === 1 ? [{ label: MONTHS_PT[filterMonths[0] - 1], color: "#34D399", type: "bar" as const }] : []),
                          ...(showForecast ? [{ label: "Previsão (tendência)", color: "#A78BFA", type: "line" as const }] : []),
                        ].map((l, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {l.type === "line"
                              ? <div style={{ width: 18, height: 2, background: l.color, opacity: 0.7, borderTop: `2px dashed ${l.color}` }} />
                              : <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color, opacity: 0.85 }} />
                            }
                            <span style={{ color: "#475569", fontSize: 10 }}>{l.label}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })()}

                {/* ═══ DISTRIBUIÇÃO ═══ */}
                <SectionLabel label="Distribuição" sub="Perfil das ocorrências por gravidade e tipo" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>

                  {/* Severity donut */}
                  <Section title="Gravidade" icon={AlertTriangle} color="#EF4444">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={data.bySeverity} cx="50%" cy="50%" innerRadius={48} outerRadius={74}
                          dataKey="value" nameKey="name" paddingAngle={3}
                          label={({ name, percent }) => percent > 0.07 ? `${(percent * 100).toFixed(0)}%` : ""}
                          labelLine={false}>
                          {data.bySeverity.map((entry: any, i: number) => (
                            <Cell key={i} fill={SEV_COLORS[entry.name] ?? PALETTE[i % PALETTE.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<DarkTooltip />} formatter={(v: any, n: string) => [v, SEV_LABELS[n] ?? n]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                      {data.bySeverity.map((s: any, i: number) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: SEV_COLORS[s.name] ?? PALETTE[i], flexShrink: 0 }} />
                            <span style={{ color: "#94A3B8", fontSize: 11 }}>{SEV_LABELS[s.name] ?? s.name}</span>
                          </div>
                          <span style={{ color: "#F8FAFC", fontSize: 11, fontWeight: 700 }}>{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </Section>

                  {/* Investigation funnel */}
                  <Section title="Investigações" icon={Target} color="#8B5CF6">
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie data={data.investigationFunnel} cx="50%" cy="50%" innerRadius={38} outerRadius={60}
                          dataKey="value" paddingAngle={3}>
                          {data.investigationFunnel.map((item: any, i: number) => (
                            <Cell key={i} fill={item.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<DarkTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                      {data.investigationFunnel.map((item: any, i: number) => {
                        const pct = data.total > 0 ? ((item.value / data.total) * 100).toFixed(0) : 0;
                        return (
                          <div key={i}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ color: "#94A3B8", fontSize: 11 }}>{item.name}</span>
                              <span style={{ color: "#F8FAFC", fontSize: 11, fontWeight: 700 }}>{item.value} <span style={{ color: "#475569", fontWeight: 400, fontSize: 10 }}>({pct}%)</span></span>
                            </div>
                            <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 10, overflow: "hidden" }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, delay: i * 0.15 }}
                                style={{ height: "100%", borderRadius: 10, background: item.color }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Section>

                  {/* Body map */}
                  <Section title="Regiões do Corpo Afetadas" icon={Hand} color="#06B6D4" span={2}>
                    <MapaCorporalAcidentes rawBodyParts={data.byBodyPart ?? []} isLoading={isLoading} />
                  </Section>
                </div>

                {/* ═══ CONCENTRAÇÃO & PADRÕES ═══ */}
                <SectionLabel label="Concentração & Padrões" sub="Dias e turnos com maior concentração de ocorrências" />

                {/* Heatmap full width */}
                <Section title="Heatmap — Concentração por Dia × Turno" icon={Thermometer} color="#EC4899">
                  <div style={{ display: "grid", gridTemplateColumns: "52px repeat(3, 1fr)", gap: 8 }}>
                    <div />
                    {heatShifts.map(s => (
                      <div key={s.key} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: s.color, paddingBottom: 6 }}>{s.label}</div>
                    ))}
                    {(data.heatmapMatrix ?? []).map((row: any) => (
                      <React.Fragment key={row.day}>
                        <div style={{ display: "flex", alignItems: "center", fontSize: 12, color: "#64748B", fontWeight: 600 }}>{row.day}</div>
                        {heatShifts.map(s => (
                          <div key={s.key}
                            title={`${row.day} · ${s.label}: ${row[s.key]} acidente${row[s.key] !== 1 ? "s" : ""}`}
                            style={{
                              height: 42, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                              background: heatColor(row[s.key], heatMax),
                              border: "1px solid rgba(255,255,255,0.05)",
                              fontSize: 13, fontWeight: 700,
                              color: row[s.key] > 0 ? "#F8FAFC" : "rgba(255,255,255,0.1)",
                              transition: "all .2s", cursor: "default",
                            }}>
                            {row[s.key] > 0 ? row[s.key] : "·"}
                          </div>
                        ))}
                      </React.Fragment>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 14 }}>
                    {[
                      { label: "Sem ocorrências", bg: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" },
                      { label: "Baixo",  bg: "rgba(59,130,246,0.35)" },
                      { label: "Médio",  bg: "rgba(245,158,11,0.55)" },
                      { label: "Alto",   bg: "rgba(239,68,68,0.75)" },
                    ].map((l, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 14, height: 14, borderRadius: 4, background: l.bg, border: l.border, flexShrink: 0 }} />
                        <span style={{ color: "#475569", fontSize: 11 }}>{l.label}</span>
                      </div>
                    ))}
                  </div>
                </Section>

                {/* ═══ CAUSAS & LESÕES ═══ */}
                <SectionLabel label="Causas & Lesões" sub="Análise causal para priorização de ações preventivas" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <Section title="Causas Imediatas" icon={ListChecks} color="#EF4444">
                    {!data.byImmediateCause?.length ? (
                      <p style={{ color: "#475569", fontSize: 11, textAlign: "center", padding: "40px 0" }}>Preencha "Causas Imediatas" nos registros</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {data.byImmediateCause.map((item: any, i: number) => (
                          <HBar key={i} rank={i+1} label={item.name} value={item.value}
                            max={data.byImmediateCause[0].value} color={PALETTE[i % PALETTE.length]} />
                        ))}
                      </div>
                    )}
                  </Section>

                  <Section title="Natureza da Lesão" icon={Bandage} color="#F97316">
                    {!data.byInjuryNature?.length ? (
                      <p style={{ color: "#475569", fontSize: 11, textAlign: "center", padding: "40px 0" }}>Preencha "Natureza da Lesão" nos registros</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {data.byInjuryNature.map((item: any, i: number) => (
                          <HBar key={i} rank={i+1} label={item.name} value={item.value}
                            max={data.byInjuryNature[0].value}
                            color={["#F97316","#EF4444","#F59E0B","#8B5CF6","#06B6D4","#EC4899"][i % 6]} />
                        ))}
                      </div>
                    )}
                  </Section>

                  <Section title="Tipo de Acidente" icon={Zap} color="#8B5CF6">
                    {!data.byType?.length ? (
                      <p style={{ color: "#475569", fontSize: 11, textAlign: "center", padding: "40px 0" }}>Nenhum tipo registrado</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {data.byType.map((item: any, i: number) => (
                          <HBar key={i} rank={i+1} label={item.name} value={item.value}
                            max={data.byType[0].value} color={PALETTE[(i+2) % PALETTE.length]} />
                        ))}
                      </div>
                    )}
                  </Section>
                </div>

                {/* ═══ LOCAIS & PESSOAS ═══ */}
                <SectionLabel label="Locais & Pessoas" sub="Mapeamento geográfico e individual do risco" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr", gap: 16 }}>
                  <Section title="Por Local" icon={MapPin} color="#EC4899">
                    {!data.byLocation?.length ? (
                      <p style={{ color: "#475569", fontSize: 11, textAlign: "center", padding: "40px 0" }}>Nenhum local registrado</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {data.byLocation.map((item: any, i: number) => (
                          <HBar key={i} rank={i+1} label={item.name} value={item.value}
                            max={data.byLocation[0].value} color={PALETTE[(i+4) % PALETTE.length]} />
                        ))}
                      </div>
                    )}
                  </Section>

                  <Section title="Funcionários com Mais Ocorrências" icon={Users} color="#8B5CF6">
                    {!data.topEmployees?.length ? (
                      <p style={{ color: "#475569", fontSize: 11, textAlign: "center", padding: "40px 0" }}>Nenhum funcionário identificado</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {data.topEmployees.map((emp: any, i: number) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 24, height: 24, borderRadius: 7, background: PALETTE[i % PALETTE.length] + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <span style={{ color: PALETTE[i % PALETTE.length], fontSize: 10, fontWeight: 700 }}>{i + 1}</span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <span style={{ color: "#CBD5E1", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "65%" }}>{emp.name}</span>
                                <span style={{ color: "#F8FAFC", fontSize: 11, fontWeight: 700 }}>{emp.total}</span>
                              </div>
                              <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 10, overflow: "hidden" }}>
                                <motion.div initial={{ width: 0 }}
                                  animate={{ width: `${data.topEmployees[0].total > 0 ? (emp.total / data.topEmployees[0].total) * 100 : 0}%` }}
                                  transition={{ duration: 0.7, delay: i * 0.08 }}
                                  style={{ height: "100%", borderRadius: 10, background: emp.grave > 0 ? "#EF4444" : PALETTE[i % PALETTE.length] }} />
                              </div>
                            </div>
                            {emp.grave > 0 && (
                              <span style={{ color: "#EF4444", fontSize: 9, background: "#EF444418", borderRadius: 20, padding: "1px 6px", flexShrink: 0 }}>{emp.grave}g</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </Section>

                  <Section title="Últimas Ocorrências" icon={AlertTriangle} color="#EF4444">
                    {!data.recent?.length ? (
                      <p style={{ color: "#475569", fontSize: 11, textAlign: "center", padding: "40px 0" }}>Nenhum acidente registrado</p>
                    ) : (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr>
                              {["Data", "Título", "Funcionário", "Gravidade", "Status"].map(h => (
                                <th key={h} style={{ textAlign: "left", color: "#334155", fontSize: 9, fontWeight: 700, padding: "0 10px 10px 0", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {data.recent.map((acc: any, i: number) => (
                              <tr key={acc.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                                <td style={{ padding: "9px 10px 9px 0", color: "#64748B", fontSize: 11, whiteSpace: "nowrap" }}>{acc.date}</td>
                                <td style={{ padding: "9px 10px 9px 0", color: "#E2E8F0", fontSize: 11, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{acc.title}</td>
                                <td style={{ padding: "9px 10px 9px 0", color: "#94A3B8", fontSize: 11, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{acc.employeeName || "—"}</td>
                                <td style={{ padding: "9px 10px 9px 0" }}><SevBadge s={acc.severity} /></td>
                                <td style={{ padding: "9px 0 9px 0" }}><InvBadge s={acc.investigationStatus ?? "pendente"} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Section>
                </div>

                {/* ═══ FÓRMULAS ═══ */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ background: "rgba(59,130,246,0.04)", border: "1px solid rgba(59,130,246,0.12)", borderRadius: 14, padding: "16px 20px", display: "flex", gap: 20, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flex: 1, minWidth: 240 }}>
                    <TrendingUp style={{ width: 15, height: 15, color: "#3B82F6", marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <p style={{ color: "#93C5FD", fontSize: 12, fontWeight: 600, margin: 0 }}>TF = {data.tf}</p>
                      <p style={{ color: "#475569", fontSize: 11, margin: "3px 0 0" }}>Taxa de Frequência — acidentes por 10⁶ HHT (NR-4). {data.empCount === 0 ? "Cadastre funcionários para calcular." : `HHT = ${data.empCount} func. × 22d × 8h.`}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flex: 1, minWidth: 240 }}>
                    <ShieldAlert style={{ width: 15, height: 15, color: "#F59E0B", marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <p style={{ color: "#FDE68A", fontSize: 12, fontWeight: 600, margin: 0 }}>TG = {data.tg}</p>
                      <p style={{ color: "#475569", fontSize: 11, margin: "3px 0 0" }}>Taxa de Gravidade — acidentes graves/fatais por 10⁶ HHT (NR-4). {data.empCount === 0 ? "Cadastre funcionários para calcular." : `Base: ${data.empCount} funcionários ativos.`}</p>
                    </div>
                  </div>
                </motion.div>

              </div>
            );
          })()
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "#EF4444", fontSize: 14 }}>
            Erro ao carregar dados. Verifique a conexão com o servidor.
          </div>
        )}

        {/* ── Drill-down panel ── */}
        {drillMonth && data && (() => {
          const monthIdx = drillMonth.index; // 0-based
          const drillAccidents = (data.recent ?? []).filter((acc: any) => {
            if (!acc.date) return false;
            const d = new Date(acc.date);
            return d.getMonth() === monthIdx && d.getFullYear() === year;
          });
          return (
            <DrillDownPanel
              monthLabel={MONTHS_PT[monthIdx] ?? drillMonth.label}
              year={year}
              accidents={drillAccidents}
              onClose={() => setDrillMonth(null)}
            />
          );
        })()}
      </div>
    </MainLayout>
  );
}
