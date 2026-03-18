import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, AlertTriangle, Clock, GraduationCap, ClipboardCheck, ChevronRight, CheckCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";

type NotifItem = {
  id: string; type: "urgent" | "warning" | "info";
  title: string; desc: string; time: string; href: string; icon: any;
};

function buildNotifications(stats: any): NotifItem[] {
  if (!stats) return [];
  const items: NotifItem[] = [];
  if (stats.accidents > 0) items.push({
    id: "acc", type: "urgent", icon: AlertTriangle,
    title: `${stats.accidents} acidente(s) registrado(s)`,
    desc: "Verifique os registros e status das investigações",
    time: "Agora", href: "/acidentes",
  });
  if (stats.pendingInvestigations?.length > 0) items.push({
    id: "inv", type: "urgent", icon: Clock,
    title: `${stats.pendingInvestigations.length} investigação(ões) abertas`,
    desc: "Investigações aguardando análise e conclusão",
    time: "Pendente", href: "/investigacoes",
  });
  if (stats.trainings > 0) items.push({
    id: "train", type: "info", icon: GraduationCap,
    title: `${stats.trainings} treinamento(s) ativo(s)`,
    desc: "Acompanhe o status e certificações pendentes",
    time: "Em andamento", href: "/treinamentos",
  });
  if (stats.inspections > 0) items.push({
    id: "insp", type: "warning", icon: ClipboardCheck,
    title: `${stats.inspections} inspeção(ões) no sistema`,
    desc: "Verifique não-conformidades pendentes",
    time: "Atenção", href: "/inspecoes",
  });
  return items;
}

const typeStyle = {
  urgent: { dot: "bg-red-500", accent: "#F87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.15)" },
  warning: { dot: "bg-amber-500", accent: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.15)" },
  info: { dot: "bg-blue-500", accent: "#60A5FA", bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.15)" },
};

export function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const { data: stats } = trpc.dashboard.stats.useQuery();

  const all = buildNotifications(stats);
  const items = all.filter(n => !dismissed.has(n.id));
  const urgentCount = items.filter(n => n.type === "urgent").length;

  return (
    <>
      {/* Bell button */}
      <button onClick={() => setOpen(true)}
        className="relative p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
        <Bell className="w-4 h-4" />
        <AnimatePresence>
          {items.length > 0 && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{ background: urgentCount > 0 ? "#EF4444" : "#3B82F6" }}>
              {items.length}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Overlay + panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, x: 20, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 20 }}
              className="fixed top-14 right-4 z-50 w-80 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
              style={{ background: "#0D1526", fontFamily: "'Sora', sans-serif" }}>

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold text-white">Notificações</span>
                  {items.length > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: "#EF4444" }}>
                      {items.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {items.length > 0 && (
                    <button onClick={() => setDismissed(new Set(all.map(n => n.id)))}
                      className="text-[11px] text-slate-500 hover:text-blue-400 transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/5">
                      <CheckCheck className="w-3 h-3" />Limpar
                    </button>
                  )}
                  <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Items */}
              <div className="max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {items.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(52,211,153,0.1)" }}>
                        <CheckCheck className="w-5 h-5 text-emerald-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-300">Tudo em dia!</p>
                      <p className="text-xs text-slate-500 mt-1">Sem pendências no momento.</p>
                    </motion.div>
                  ) : (
                    items.map((item) => {
                      const s = typeStyle[item.type];
                      const Icon = item.icon;
                      return (
                        <motion.div key={item.id} layout
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                          className="relative group border-b border-white/4 last:border-0">
                          <a href={item.href} onClick={() => setOpen(false)}
                            className="flex items-start gap-3 px-4 py-3.5 hover:bg-white/3 transition-colors">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                              <Icon className="w-3.5 h-3.5" style={{ color: s.accent }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-white leading-snug">{item.title}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                              <p className="text-[10px] text-slate-600 mt-1.5 font-mono">{item.time}</p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-600 mt-1 flex-shrink-0 group-hover:text-slate-400 transition-colors" />
                          </a>
                          <button onClick={() => setDismissed(prev => new Set([...prev, item.id]))}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-white/10 text-slate-500 hover:text-white">
                            <X className="w-3 h-3" />
                          </button>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
