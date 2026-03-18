import { motion, AnimatePresence } from "framer-motion";
import { X, LucideIcon } from "lucide-react";
import { useEffect } from "react";

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  accent?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function DetailDrawer({
  open, onClose, title, subtitle, icon: Icon, accent = "#3B82F6", children, actions,
}: DetailDrawerProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* panel */}
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full z-50 w-full max-w-lg flex flex-col shadow-2xl"
            style={{ background: "#0A1020", borderLeft: "1px solid rgba(255,255,255,0.06)", fontFamily: "'Sora', sans-serif" }}
          >
            {/* header */}
            <div className="flex items-start gap-4 px-6 py-5 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {Icon && (
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${accent}18` }}>
                  <Icon className="w-5 h-5" style={{ color: accent }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-white leading-snug">{title}</h2>
                {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0 mt-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {children}
            </div>

            {/* footer actions */}
            {actions && (
              <div className="px-6 py-4 flex items-center gap-3 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                {actions}
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Drawer section ──────────────────────────────────────── */
export function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">{title}</p>
      {children}
    </div>
  );
}

/* ── Key-value row ───────────────────────────────────────── */
export function DrawerRow({ label, value, mono }: { label: string; value?: string | number | null; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <span className="text-xs text-slate-500 w-36 flex-shrink-0 mt-0.5">{label}</span>
      <span className="text-sm text-slate-200 flex-1" style={mono ? { fontFamily: "'JetBrains Mono', monospace" } : {}}>
        {value ?? <span className="text-slate-600">—</span>}
      </span>
    </div>
  );
}

/* ── Timeline item ───────────────────────────────────────── */
export function TimelineItem({ label, date, color = "#3B82F6", last }: {
  label: string; date?: string; color?: string; last?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: color }} />
        {!last && <div className="w-px flex-1 mt-1" style={{ background: "rgba(255,255,255,0.06)" }} />}
      </div>
      <div className="pb-4">
        <p className="text-sm text-slate-200">{label}</p>
        {date && <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{date}</p>}
      </div>
    </div>
  );
}
