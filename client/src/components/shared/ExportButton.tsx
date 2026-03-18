import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, FileSpreadsheet, FileText, ChevronDown, Check } from "lucide-react";

interface ExportButtonProps {
  onExportCSV: () => void;
  onExportPDF?: () => void;
  label?: string;
}

/* ── CSV generator ──────────────────────────────────────── */
export function generateCSV(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const escape = (v: string | number | boolean | null | undefined) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows].map(row => row.map(escape).join(",")).join("\n");
}

export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function ExportButton({ onExportCSV, onExportPDF, label = "Exportar" }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const trigger = (fn: () => void, key: string) => {
    fn();
    setDone(key);
    setOpen(false);
    setTimeout(() => setDone(null), 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 border border-white/10 hover:border-white/20 hover:text-white hover:bg-white/5 transition-all"
        style={{ fontFamily: "'Sora', sans-serif" }}
      >
        {done ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
        {done ? "Exportado!" : label}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              className="absolute right-0 top-full mt-1.5 z-20 w-44 rounded-xl border border-white/10 shadow-xl overflow-hidden"
              style={{ background: "#0D1526" }}
            >
              <button
                onClick={() => trigger(onExportCSV, "csv")}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                Excel / CSV
              </button>
              {onExportPDF && (
                <button
                  onClick={() => trigger(onExportPDF, "pdf")}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left border-t border-white/5"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  <FileText className="w-4 h-4 text-red-400" />
                  PDF
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
