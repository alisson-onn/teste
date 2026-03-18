import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, AlertTriangle, Stethoscope, GraduationCap, ClipboardCheck, FileText, X, ArrowRight, Command } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

type Result = { id: string; title: string; subtitle: string; href: string; icon: any; accent: string; category: string };

function useGlobalSearch(query: string) {
  const { data: accidents } = trpc.accidents.list.useQuery(undefined, { enabled: query.length > 1 });
  const { data: diseases } = trpc.diseases.list.useQuery(undefined, { enabled: query.length > 1 });
  const { data: trainings } = trpc.trainings.list.useQuery(undefined, { enabled: query.length > 1 });
  const { data: inspections } = trpc.inspections.list.useQuery(undefined, { enabled: query.length > 1 });
  const { data: ppps } = trpc.ppps.list.useQuery(undefined, { enabled: query.length > 1 });

  if (query.length < 2) return [];

  const q = query.toLowerCase();
  const results: Result[] = [];

  accidents?.filter(a => a.title?.toLowerCase().includes(q) || a.employeeName?.toLowerCase().includes(q))
    .slice(0, 3).forEach(a => results.push({
      id: `acc-${a.id}`, title: a.title, subtitle: a.employeeName || "Acidente de trabalho",
      href: "/acidentes", icon: AlertTriangle, accent: "#EF4444", category: "Acidentes",
    }));

  diseases?.filter(d => d.title?.toLowerCase().includes(q) || d.employeeName?.toLowerCase().includes(q))
    .slice(0, 3).forEach(d => results.push({
      id: `dis-${d.id}`, title: d.title, subtitle: d.employeeName || "Doença ocupacional",
      href: "/doencas", icon: Stethoscope, accent: "#F97316", category: "Doenças",
    }));

  trainings?.filter(t => t.title?.toLowerCase().includes(q))
    .slice(0, 3).forEach(t => results.push({
      id: `trn-${t.id}`, title: t.title, subtitle: t.instructor || "Treinamento",
      href: "/treinamentos", icon: GraduationCap, accent: "#22C55E", category: "Treinamentos",
    }));

  inspections?.filter(i => i.title?.toLowerCase().includes(q))
    .slice(0, 2).forEach(i => results.push({
      id: `ins-${i.id}`, title: i.title, subtitle: i.location || "Inspeção",
      href: "/inspecoes", icon: ClipboardCheck, accent: "#F59E0B", category: "Inspeções",
    }));

  ppps?.filter(p => p.employeeName?.toLowerCase().includes(q) || p.position?.toLowerCase().includes(q))
    .slice(0, 2).forEach(p => results.push({
      id: `ppp-${p.id}`, title: p.employeeName, subtitle: p.position || "PPP",
      href: "/ppps", icon: FileText, accent: "#A78BFA", category: "PPPs",
    }));

  return results;
}

export function GlobalSearchTrigger() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen(o => !o); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-slate-500 hover:text-slate-300 border border-white/8 hover:border-white/15 transition-all text-xs"
        style={{ background: "rgba(255,255,255,0.03)", fontFamily: "'Sora', sans-serif" }}>
        <Search className="w-3.5 h-3.5" />
        <span>Buscar...</span>
        <div className="flex items-center gap-0.5 ml-1 opacity-60">
          <Command className="w-3 h-3" /><span className="text-[10px]">K</span>
        </div>
      </button>
      <button onClick={() => setOpen(true)} className="sm:hidden p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
        <Search className="w-4 h-4" />
      </button>
      <GlobalSearchModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function GlobalSearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();
  const results = useGlobalSearch(query);

  useEffect(() => { if (open) { setQuery(""); setSelected(0); setTimeout(() => inputRef.current?.focus(), 50); } }, [open]);

  const go = useCallback((href: string) => { navigate(href); onClose(); }, [navigate, onClose]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === "Enter" && results[selected]) go(results[selected].href);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, results, selected, go]);

  const grouped = results.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {} as Record<string, Result[]>);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, y: -20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20 }}
            className="relative w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
            style={{ background: "#0D1526", fontFamily: "'Sora', sans-serif" }}>

            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/6">
              <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <input ref={inputRef} value={query} onChange={e => { setQuery(e.target.value); setSelected(0); }}
                placeholder="Buscar acidentes, treinamentos, PPPs..."
                className="flex-1 bg-transparent text-white placeholder:text-slate-600 text-sm outline-none" />
              {query && (
                <button onClick={() => setQuery("")} className="text-slate-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="text-[10px] text-slate-600 border border-white/10 rounded px-1.5 py-0.5">ESC</kbd>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto p-2">
              {query.length < 2 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-slate-500">Digite para buscar no sistema</p>
                  <p className="text-xs text-slate-600 mt-1">Acidentes, doenças, treinamentos, inspeções, PPPs...</p>
                </div>
              ) : results.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-slate-400">Nenhum resultado para "{query}"</p>
                </div>
              ) : (
                Object.entries(grouped).map(([category, items]) => (
                  <div key={category} className="mb-2">
                    <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 py-1.5">{category}</p>
                    {items.map((r) => {
                      const globalIdx = results.findIndex(x => x.id === r.id);
                      const isSelected = globalIdx === selected;
                      const Icon = r.icon;
                      return (
                        <motion.button key={r.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          onClick={() => go(r.href)}
                          onMouseEnter={() => setSelected(globalIdx)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${isSelected ? "bg-blue-600/15" : "hover:bg-white/4"}`}>
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: `${r.accent}15` }}>
                            <Icon className="w-3.5 h-3.5" style={{ color: r.accent }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{r.title}</p>
                            <p className="text-xs text-slate-500 truncate">{r.subtitle}</p>
                          </div>
                          {isSelected && <ArrowRight className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
                        </motion.button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 px-4 py-2.5 border-t border-white/4 text-[10px] text-slate-600">
              <span className="flex items-center gap-1"><kbd className="border border-white/10 rounded px-1">↑↓</kbd> navegar</span>
              <span className="flex items-center gap-1"><kbd className="border border-white/10 rounded px-1">↵</kbd> abrir</span>
              <span className="flex items-center gap-1"><kbd className="border border-white/10 rounded px-1">esc</kbd> fechar</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
