import { motion, AnimatePresence } from "framer-motion";
import { X, Search, AlertCircle, LucideIcon, Inbox, Plus } from "lucide-react";
import { useState, useEffect, useRef } from "react";

/* ── Typography token ──────────────────────────────────────── */
const FONT = "'Sora', sans-serif";
const MONO = "'JetBrains Mono', monospace";

/* ── Card shell ─────────────────────────────────────────────── */
export function DarkCard({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: React.MouseEventHandler<HTMLDivElement> }) {
  return (
    <div className={`rounded-2xl border border-white/5 ${className}`} style={{ background: "#0D1526" }} onClick={onClick}>
      {children}
    </div>
  );
}

/* ── Page header ────────────────────────────────────────────── */
export function DarkPageHeader({
  title, description, icon: Icon, accent = "#3B82F6", action,
}: { title: string; description?: string; icon?: LucideIcon; accent?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${accent}18` }}>
            <Icon className="w-5 h-5" style={{ color: accent }} />
          </div>
        )}
        <div>
          <h2 className="text-lg font-semibold text-white" style={{ fontFamily: FONT }}>{title}</h2>
          {description && <p className="text-slate-500 text-sm mt-0.5">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ── Status badge dark ──────────────────────────────────────── */
const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pendente:      { label: "Pendente",      color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  em_progresso:  { label: "Em Progresso",  color: "#60A5FA", bg: "rgba(96,165,250,0.12)" },
  em_andamento:  { label: "Em Andamento",  color: "#60A5FA", bg: "rgba(96,165,250,0.12)" },
  concluida:     { label: "Concluída",     color: "#34D399", bg: "rgba(52,211,153,0.12)" },
  concluido:     { label: "Concluído",     color: "#34D399", bg: "rgba(52,211,153,0.12)" },
  planejado:     { label: "Planejado",     color: "#94A3B8", bg: "rgba(148,163,184,0.12)" },
  planejada:     { label: "Planejada",     color: "#94A3B8", bg: "rgba(148,163,184,0.12)" },
  aberta:        { label: "Aberta",        color: "#FB923C", bg: "rgba(251,146,60,0.12)" },
  fechada:       { label: "Fechada",       color: "#64748B", bg: "rgba(100,116,139,0.12)" },
  ativo:         { label: "Ativo",         color: "#34D399", bg: "rgba(52,211,153,0.12)" },
  finalizado:    { label: "Finalizado",    color: "#64748B", bg: "rgba(100,116,139,0.12)" },
  revisao:       { label: "Em Revisão",    color: "#A78BFA", bg: "rgba(167,139,250,0.12)" },
  diagnosticada: { label: "Diagnosticada", color: "#FB923C", bg: "rgba(251,146,60,0.12)" },
  afastada:      { label: "Afastada",      color: "#F87171", bg: "rgba(248,113,113,0.12)" },
  recuperada:    { label: "Recuperada",    color: "#34D399", bg: "rgba(52,211,153,0.12)" },
  cronica:       { label: "Crônica",       color: "#A78BFA", bg: "rgba(167,139,250,0.12)" },
};

const severityConfig: Record<string, { label: string; color: string; bg: string }> = {
  leve:     { label: "Leve",     color: "#34D399", bg: "rgba(52,211,153,0.12)" },
  moderado: { label: "Moderado", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  grave:    { label: "Grave",    color: "#F87171", bg: "rgba(248,113,113,0.12)" },
  fatal:    { label: "Fatal",    color: "#FCA5A5", bg: "rgba(127,29,29,0.4)" },
};

export function DarkBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || { label: status, color: "#94A3B8", bg: "rgba(148,163,184,0.1)" };
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium" style={{ color: cfg.color, background: cfg.bg, fontFamily: FONT }}>
      {cfg.label}
    </span>
  );
}

export function DarkSeverityBadge({ severity }: { severity: string }) {
  const cfg = severityConfig[severity] || { label: severity, color: "#94A3B8", bg: "rgba(148,163,184,0.1)" };
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold" style={{ color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

/* ── Skeleton loader ────────────────────────────────────────── */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/5 ${className}`} />;
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center" style={{ opacity: 1 - i * 0.12 }}>
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className={`h-8 ${j === 0 ? "w-1/4" : j === cols - 1 ? "w-16" : "flex-1"}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/5 p-5 space-y-3" style={{ background: "#0D1526" }}>
      <div className="flex gap-3 items-start">
        <Skeleton className="w-9 h-9 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

/* ── Empty state ────────────────────────────────────────────── */
export function DarkEmptyState({
  icon: Icon, title, description, action, accent = "#3B82F6"
}: { icon: LucideIcon; title: string; description?: string; action?: React.ReactNode; accent?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${accent}12` }}>
        <Icon className="w-7 h-7" style={{ color: accent }} />
      </div>
      <h3 className="text-base font-semibold text-slate-300 mb-1" style={{ fontFamily: FONT }}>{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-xs mb-6">{description}</p>}
      {action}
    </motion.div>
  );
}

/* ── Dark table ─────────────────────────────────────────────── */
export function DarkTable({ headers, children, loading, empty }: {
  headers: string[]; children: React.ReactNode; loading?: boolean; empty?: boolean;
}) {
  return (
    <DarkCard className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ fontFamily: FONT }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {headers.map(h => (
                <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={headers.length}><TableSkeleton rows={5} cols={headers.length} /></td></tr>
            ) : children}
          </tbody>
        </table>
      </div>
    </DarkCard>
  );
}

export function DarkTr({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      onClick={onClick}
      className={`border-b border-white/4 transition-colors ${onClick ? "cursor-pointer hover:bg-white/3" : ""}`}
      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      {children}
    </motion.tr>
  );
}

export function DarkTd({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: React.MouseEventHandler<HTMLTableCellElement> }) {
  return <td className={`px-5 py-4 text-slate-300 ${className}`} onClick={onClick}>{children}</td>;
}

/* ── Search bar dark ────────────────────────────────────────── */
export function DarkSearch({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
      <input value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder || "Buscar..."}
        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-slate-300 placeholder:text-slate-600 outline-none border border-white/8 focus:border-blue-500/50 transition-colors"
        style={{ background: "rgba(255,255,255,0.04)", fontFamily: FONT }} />
    </div>
  );
}

/* ── Filter pill ────────────────────────────────────────────── */
export function FilterPills({ options, value, onChange }: {
  options: { label: string; value: string }[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${value === opt.value ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white border border-white/8 hover:border-white/20"}`}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ── Action button ──────────────────────────────────────────── */
export function DarkButton({ children, onClick, variant = "primary", size = "md", className = "", disabled = false }: {
  children: React.ReactNode; onClick?: () => void;
  variant?: "primary" | "ghost" | "danger"; size?: "sm" | "md";
  className?: string; disabled?: boolean;
}) {
  const styles = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20",
    ghost: "border border-white/10 hover:border-white/20 text-slate-300 hover:text-white hover:bg-white/5",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20",
  };
  const sizes = { sm: "px-3 py-1.5 text-xs gap-1.5", md: "px-4 py-2 text-sm gap-2" };
  return (
    <motion.button whileTap={{ scale: 0.97 }} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center rounded-xl font-medium transition-all disabled:opacity-40 ${styles[variant]} ${sizes[size]} ${className}`}
      style={{ fontFamily: FONT }}>
      {children}
    </motion.button>
  );
}

/* ── Icon action button ─────────────────────────────────────── */
export function IconBtn({ icon: Icon, onClick, title, color = "text-slate-500 hover:text-blue-400" }: {
  icon: LucideIcon; onClick?: React.MouseEventHandler<HTMLButtonElement>; title?: string; color?: string;
}) {
  return (
    <button onClick={onClick} title={title}
      className={`p-1.5 rounded-lg transition-colors hover:bg-white/5 ${color}`}>
      <Icon className="w-4 h-4" />
    </button>
  );
}

/* ── Modal ──────────────────────────────────────────────────── */
export function DarkModal({ open, onClose, title, children, width = "max-w-xl" }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; width?: string;
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full ${width} rounded-2xl border border-white/10 shadow-2xl`}
            style={{ background: "#0D1526" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
              <h3 className="text-base font-semibold text-white" style={{ fontFamily: FONT }}>{title}</h3>
              <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ── Form field dark ────────────────────────────────────────── */
export function DarkField({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider" style={{ fontFamily: FONT }}>
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  );
}

const inputBase = `w-full bg-transparent text-white text-sm placeholder:text-slate-600 outline-none border border-white/10 rounded-xl px-3.5 py-2.5 focus:border-blue-500/60 transition-colors`;
const inputStyle = { background: "rgba(255,255,255,0.04)", fontFamily: MONO } as React.CSSProperties;

export function DarkInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className || ""}`} style={inputStyle} />;
}

export function DarkSelect({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${inputBase} ${props.className || ""}`} style={{ ...inputStyle, fontFamily: "'Sora', sans-serif" }}>
      {children}
    </select>
  );
}

export function DarkTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputBase} resize-none ${props.className || ""}`} style={{ ...inputStyle, fontFamily: "'Sora', sans-serif" }} />;
}

/* ── Stats mini bar ─────────────────────────────────────────── */
export function MiniStats({ items }: { items: { label: string; value: number | string; color?: string }[] }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {items.map(s => (
        <div key={s.label} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/6 text-sm" style={{ background: "rgba(255,255,255,0.03)" }}>
          <span className="font-bold text-white font-mono" style={{ color: s.color }}>{s.value}</span>
          <span className="text-slate-500 text-xs">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
