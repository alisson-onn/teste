import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays, Plus, ChevronLeft, ChevronRight, X,
  Clock, MapPin, User, RefreshCw, CheckCircle2, XCircle, Calendar,
  Trash2, Edit3, Copy,
} from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { trpc } from "@/lib/trpc";

const FONT = "'Sora', sans-serif";
const BG   = "#0D1526";
const BG2  = "#060B14";

/* ── Event types ── */
const EVENT_TYPES: Record<string, { label: string; color: string; bg: string }> = {
  treinamento: { label: "Treinamento",  color: "#22C55E", bg: "rgba(34,197,94,0.12)"   },
  integracao:  { label: "Integração",   color: "#3B82F6", bg: "rgba(59,130,246,0.12)"  },
  reuniao:     { label: "Reunião",      color: "#A78BFA", bg: "rgba(167,139,250,0.12)" },
  inspecao:    { label: "Inspeção",     color: "#F59E0B", bg: "rgba(245,158,11,0.12)"  },
  simulado:    { label: "Simulado",     color: "#EF4444", bg: "rgba(239,68,68,0.12)"   },
  campanha:    { label: "Campanha",     color: "#F97316", bg: "rgba(249,115,22,0.12)"  },
  outro:       { label: "Outro",        color: "#64748B", bg: "rgba(100,116,139,0.12)" },
};

const RECURRENCES = [
  { value: "nenhuma",  label: "Não se repete"   },
  { value: "semanal",  label: "Semanal"          },
  { value: "mensal",   label: "Mensal"           },
  { value: "anual",    label: "Anual"            },
];

const TECHNICIANS = [
  { name: "Alisson",  initials: "AL", color: "#3B82F6", bg: "rgba(59,130,246,0.18)"  },
  { name: "Gleydson", initials: "GL", color: "#22C55E", bg: "rgba(34,197,94,0.18)"   },
  { name: "Juliane",  initials: "JU", color: "#F59E0B", bg: "rgba(245,158,11,0.18)"  },
  { name: "Gabriela", initials: "GA", color: "#EC4899", bg: "rgba(236,72,153,0.18)"  },
];

const WEEK_DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

/* ── helpers ── */
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`rounded-xl bg-white/5 animate-pulse ${className}`} />;
}
const inputCls = "w-full rounded-xl border border-white/10 bg-white/4 text-white text-sm px-3 py-2.5 outline-none focus:border-blue-500/50 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.08)] transition-all placeholder:text-slate-600";
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 block">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
function TypeBadge({ type }: { type: string }) {
  const t = EVENT_TYPES[type] ?? EVENT_TYPES.outro;
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: t.color, background: t.bg }}>
      {t.label}
    </span>
  );
}
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    agendado:  { label: "Agendado",  color: "#3B82F6", bg: "rgba(59,130,246,0.1)"  },
    realizado: { label: "Realizado", color: "#22C55E", bg: "rgba(34,197,94,0.1)"   },
    cancelado: { label: "Cancelado", color: "#EF4444", bg: "rgba(239,68,68,0.1)"   },
  };
  const s = map[status] ?? map.agendado;
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: s.color, background: s.bg }}>{s.label}</span>;
}

type Form = {
  title: string; type: string; date: string; time: string;
  endDate: string; endTime: string; location: string;
  description: string; responsible: string; recurrence: string;
};
const EMPTY: Form = {
  title: "", type: "treinamento", date: "", time: "", endDate: "", endTime: "",
  location: "", description: "", responsible: "", recurrence: "nenhuma",
};

/* ── batch state ── */
type BatchForm = {
  title: string; type: string; time: string; endTime: string;
  location: string; description: string; responsible: string;
  selectedDates: string[];
};
const EMPTY_BATCH: BatchForm = {
  title: "", type: "integracao", time: "", endTime: "",
  location: "", description: "", responsible: "", selectedDates: [],
};

export default function AgendaPage() {
  const now = new Date();
  const [currentYear,  setCurrentYear]  = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [showForm,     setShowForm]     = useState(false);
  const [showBatch,    setShowBatch]    = useState(false);
  const [form,         setForm]         = useState<Form>(EMPTY);
  const [formErrors,   setFormErrors]   = useState<Partial<Form>>({});
  const [selected,     setSelected]     = useState<any>(null);
  const [editMode,     setEditMode]     = useState(false);
  const [editForm,     setEditForm]     = useState<Partial<Form>>({});
  const [filterType,   setFilterType]   = useState("todos");
  const [filterTech,   setFilterTech]   = useState("todos");
  const [batchForm,    setBatchForm]    = useState<BatchForm>(EMPTY_BATCH);
  const [batchMonth,   setBatchMonth]   = useState(now.getMonth());
  const [batchYear,    setBatchYear]    = useState(now.getFullYear());

  /* queries */
  const { data: monthEvents = [], isLoading, refetch } = trpc.events.list.useQuery({ month: currentMonth, year: currentYear });
  const { data: upcoming = [] } = trpc.events.upcoming.useQuery();

  const createMut = trpc.events.create.useMutation({
    onSuccess: () => { setShowForm(false); setForm(EMPTY); setFormErrors({}); refetch(); },
  });
  const batchMut = trpc.events.createBatch.useMutation({
    onSuccess: () => { setShowBatch(false); setBatchForm(EMPTY_BATCH); refetch(); },
  });
  const updateMut = trpc.events.update.useMutation({
    onSuccess: (updated) => { setSelected(updated); setEditMode(false); refetch(); },
  });
  const deleteMut = trpc.events.delete.useMutation({
    onSuccess: () => { setSelected(null); refetch(); },
  });

  /* form helpers */
  const f  = (k: keyof Form)      => (e: React.ChangeEvent<any>) => setForm(p => ({ ...p, [k]: e.target.value }));
  const ef = (k: keyof Form)      => (e: React.ChangeEvent<any>) => setEditForm(p => ({ ...p, [k]: e.target.value }));
  const bf = (k: keyof BatchForm) => (e: React.ChangeEvent<any>) => setBatchForm(p => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const e: Partial<Form> = {};
    if (!form.title.trim()) e.title = "Obrigatório";
    if (!form.date)         e.date  = "Obrigatório";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  /* calendar grid */
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const pad = (firstDay + 6) % 7; // Monday start
    const total = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < pad; i++) days.push(null);
    for (let i = 1; i <= total; i++) days.push(i);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [currentYear, currentMonth]);

  /* batch calendar grid */
  const batchDays = useMemo(() => {
    const firstDay = new Date(batchYear, batchMonth, 1).getDay();
    const pad = (firstDay + 6) % 7;
    const total = new Date(batchYear, batchMonth + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < pad; i++) days.push(null);
    for (let i = 1; i <= total; i++) days.push(i);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [batchYear, batchMonth]);

  /* events by day */
  const eventsByDay = useMemo(() => {
    const map: Record<number, any[]> = {};
    monthEvents.forEach((ev: any) => {
      const d = new Date(ev.date + "T00:00:00").getDate();
      if (!map[d]) map[d] = [];
      map[d].push(ev);
    });
    return map;
  }, [monthEvents]);

  const applyFilters = (evs: any[]) => {
    let r = evs;
    if (filterType !== "todos") r = r.filter((e: any) => e.type === filterType);
    if (filterTech !== "todos") r = r.filter((e: any) => e.responsible === filterTech);
    return r;
  };

  const filteredEvents = applyFilters(monthEvents);
  const filteredUpcoming = applyFilters(upcoming);

  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  const isToday = (day: number) => currentYear === now.getFullYear() && currentMonth === now.getMonth() && day === now.getDate();

  const prevMonth = () => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y-1); } else setCurrentMonth(m => m-1); };
  const nextMonth = () => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y+1); } else setCurrentMonth(m => m+1); };

  const batchPrevMonth = () => { if (batchMonth === 0) { setBatchMonth(11); setBatchYear(y => y-1); } else setBatchMonth(m => m-1); };
  const batchNextMonth = () => { if (batchMonth === 11) { setBatchMonth(0); setBatchYear(y => y+1); } else setBatchMonth(m => m+1); };

  const toggleBatchDate = (day: number) => {
    const d = `${batchYear}-${String(batchMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    setBatchForm(p => ({
      ...p,
      selectedDates: p.selectedDates.includes(d)
        ? p.selectedDates.filter(x => x !== d)
        : [...p.selectedDates, d],
    }));
  };

  /* KPIs */
  const kpiTotal    = monthEvents.length;
  const kpiDone     = monthEvents.filter((e: any) => e.status === "realizado").length;
  const kpiPending  = monthEvents.filter((e: any) => e.status === "agendado").length;
  const kpiNext7    = upcoming.filter((e: any) => {
    const diff = (new Date(e.date).getTime() - now.getTime()) / 86400000;
    return diff >= 0 && diff <= 7;
  }).length;

  return (
    <MainLayout title="Agenda Inteligente">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`}</style>
      <div className="p-5 lg:p-7 space-y-5" style={{ fontFamily: FONT }}>

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(59,130,246,0.12)" }}>
              <CalendarDays className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Agenda Inteligente</h1>
              <p className="text-xs text-slate-500">Planejamento integrado de ações, treinamentos e inspeções</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowBatch(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-500/25 text-blue-300 text-xs font-semibold hover:border-blue-500/50 hover:bg-blue-500/5 transition-all">
              <Copy className="w-3.5 h-3.5" /> Lançar em lote
            </button>
            <button onClick={() => { setShowForm(true); setForm(EMPTY); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold hover:opacity-90 transition-all"
              style={{ background: "linear-gradient(135deg,#3B82F6,#2563EB)" }}>
              <Plus className="w-3.5 h-3.5" /> Novo Evento
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Este mês",        value: kpiTotal,   color: "#3B82F6" },
            { label: "Realizados",      value: kpiDone,    color: "#22C55E" },
            { label: "Agendados",       value: kpiPending, color: "#F59E0B" },
            { label: "Próximos 7 dias", value: kpiNext7,   color: "#A78BFA" },
          ].map((k, i) => (
            <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-white/5 px-4 py-3 relative overflow-hidden" style={{ background: BG }}>
              <div className="absolute top-0 right-0 w-14 h-14 rounded-full blur-xl opacity-15" style={{ background: k.color }} />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{k.label}</p>
              <p className="text-2xl font-black" style={{ fontFamily: "'JetBrains Mono', monospace", color: k.color }}>{k.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters row */}
        <div className="flex flex-col gap-2.5">
          {/* Type filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest w-14 flex-shrink-0">Tipo</span>
            <button onClick={() => setFilterType("todos")}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${filterType === "todos" ? "border-blue-500/40 text-blue-300" : "border-white/10 text-slate-500 hover:text-slate-300"}`}
              style={filterType === "todos" ? { background: "rgba(59,130,246,0.1)" } : {}}>
              Todos
            </button>
            {Object.entries(EVENT_TYPES).map(([key, t]) => (
              <button key={key} onClick={() => setFilterType(key === filterType ? "todos" : key)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${filterType === key ? "opacity-100" : "opacity-60 hover:opacity-90"}`}
                style={{ borderColor: `${t.color}40`, color: t.color, background: filterType === key ? t.bg : "transparent" }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: t.color }} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Technician filter — segmented control */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest w-14 flex-shrink-0">Técnico</span>
            <div className="flex items-center rounded-xl p-0.5 gap-0.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {[{ name: "todos", initials: "", color: "" }, ...TECHNICIANS].map((tech) => {
                const active = filterTech === tech.name;
                const isTodos = tech.name === "todos";
                return (
                  <div key={tech.name} className="relative">
                    {active && (
                      <motion.div layoutId="techSegment"
                        className="absolute inset-0 rounded-lg"
                        style={{ background: isTodos ? "rgba(255,255,255,0.09)" : tech.color + "28", border: `1px solid ${isTodos ? "rgba(255,255,255,0.15)" : tech.color + "60"}` }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
                      />
                    )}
                    <button
                      onClick={() => setFilterTech(tech.name)}
                      className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {!isTodos && (
                        <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black flex-shrink-0 transition-all"
                          style={{ background: active ? tech.color : `${tech.color}35`, color: active ? "#fff" : tech.color }}>
                          {tech.initials[0]}
                        </span>
                      )}
                      <span className={`text-[11px] font-semibold transition-colors whitespace-nowrap ${active ? (isTodos ? "text-white" : "") : "text-slate-500"}`}
                        style={active && !isTodos ? { color: tech.color } : {}}>
                        {isTodos ? "Todos" : tech.name}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main grid: Calendar + Upcoming */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Calendar */}
          <div className="lg:col-span-2 rounded-2xl border border-white/5 overflow-hidden" style={{ background: BG }}>
            {/* Month nav */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <button onClick={prevMonth} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-sm font-bold text-white">
                {MONTHS_PT[currentMonth]} {currentYear}
              </h2>
              <button onClick={nextMonth} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Week headers */}
            <div className="grid grid-cols-7 border-b border-white/5">
              {WEEK_DAYS.map(d => (
                <div key={d} className="py-2 text-center text-[10px] font-bold text-slate-600 uppercase tracking-wider">{d}</div>
              ))}
            </div>

            {/* Days grid */}
            {isLoading ? (
              <div className="p-4 grid grid-cols-7 gap-1">
                {[...Array(35)].map((_, i) => <Skeleton key={i} className="h-14" />)}
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {calendarDays.map((day, i) => {
                  const dayEvents = day ? (eventsByDay[day] ?? []) : [];
                  const filtered = applyFilters(dayEvents);
                  const today = day !== null && isToday(day);
                  return (
                    <div key={i}
                      className={`min-h-[72px] p-1.5 border-b border-r border-white/4 transition-colors ${day ? "cursor-default hover:bg-white/2" : "opacity-0"}`}>
                      {day !== null && (
                        <>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 mx-auto ${today ? "text-white" : "text-slate-500"}`}
                            style={today ? { background: "#3B82F6" } : {}}>
                            {day}
                          </div>
                          <div className="space-y-0.5">
                            {filtered.slice(0, 3).map((ev: any) => {
                              const t = EVENT_TYPES[ev.type] ?? EVENT_TYPES.outro;
                              return (
                                <button key={ev.id} onClick={() => { setSelected(ev); setEditMode(false); }}
                                  className="w-full text-left px-1.5 py-0.5 rounded text-[9px] font-semibold truncate transition-all hover:opacity-80 flex items-center gap-1"
                                  style={{ background: t.bg, color: t.color }}>
                                  {(() => {
                                    const tech = TECHNICIANS.find(tc => tc.name === ev.responsible);
                                    return tech ? (
                                      <span className="w-3 h-3 rounded-full flex-shrink-0 inline-flex items-center justify-center text-[7px] font-black text-white"
                                        style={{ background: tech.color }}>
                                        {tech.initials[0]}
                                      </span>
                                    ) : null;
                                  })()}
                                  <span className="truncate">{ev.time ? `${ev.time.slice(0,5)} ` : ""}{ev.title}</span>
                                </button>
                              );
                            })}
                            {filtered.length > 3 && (
                              <p className="text-[9px] text-slate-600 text-center">+{filtered.length - 3}</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming events */}
          <div className="rounded-2xl border border-white/5 flex flex-col" style={{ background: BG }}>
            <div className="px-5 py-4 border-b border-white/5">
              <h3 className="text-sm font-bold text-white">Próximos Eventos</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">A partir de hoje</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredUpcoming.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Calendar className="w-8 h-8 text-slate-700 mb-2" />
                  <p className="text-xs text-slate-600">Nenhum evento próximo</p>
                </div>
              ) : (
                <div className="divide-y divide-white/4">
                  {filteredUpcoming.map((ev: any) => {
                    const t = EVENT_TYPES[ev.type] ?? EVENT_TYPES.outro;
                    const evDate = new Date(ev.date + "T00:00:00");
                    const diff = Math.round((evDate.getTime() - now.setHours(0,0,0,0)) / 86400000);
                    return (
                      <button key={ev.id} onClick={() => { setSelected(ev); setEditMode(false); }}
                        className="w-full flex items-start gap-3 px-5 py-3.5 hover:bg-white/3 transition-colors text-left">
                        <div className="w-1 h-full min-h-[36px] rounded-full flex-shrink-0 mt-0.5" style={{ background: t.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{ev.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[10px] text-slate-500">
                              {evDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                              {ev.time ? ` · ${ev.time.slice(0,5)}` : ""}
                            </span>
                            {ev.location && <span className="text-[10px] text-slate-600 truncate max-w-[100px]">{ev.location}</span>}
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <TypeBadge type={ev.type} />
                          <p className="text-[10px] mt-1" style={{ color: diff === 0 ? "#22C55E" : diff <= 3 ? "#F59E0B" : "#64748B" }}>
                            {diff === 0 ? "Hoje" : diff === 1 ? "Amanhã" : `em ${diff}d`}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* This month list */}
        {filteredEvents.length > 0 && (
          <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: BG }}>
            <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{MONTHS_PT[currentMonth]} — todos os eventos</h3>
              <span className="text-[11px] text-slate-500">{filteredEvents.length} evento{filteredEvents.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="divide-y divide-white/4">
              {filteredEvents.map((ev: any) => {
                const t = EVENT_TYPES[ev.type] ?? EVENT_TYPES.outro;
                return (
                  <button key={ev.id} onClick={() => { setSelected(ev); setEditMode(false); }}
                    className="w-full flex items-center gap-4 px-5 py-3 hover:bg-white/3 transition-colors text-left">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: t.bg }}>
                      <CalendarDays className="w-3.5 h-3.5" style={{ color: t.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{ev.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] text-slate-500">
                          {new Date(ev.date + "T00:00:00").toLocaleDateString("pt-BR")}
                          {ev.time ? ` · ${ev.time.slice(0,5)}` : ""}
                        </span>
                        {ev.location && <span className="text-[11px] text-slate-600">{ev.location}</span>}
                        {ev.responsible && <span className="text-[11px] text-slate-600">{ev.responsible}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <TypeBadge type={ev.type} />
                      <StatusBadge status={ev.status ?? "agendado"} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ══ CREATE MODAL ══ */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/8"
              style={{ background: "#0A1020", fontFamily: FONT }}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/6" style={{ background: "#0A1020" }}>
                <div>
                  <p className="text-sm font-bold text-white">Novo Evento</p>
                  <p className="text-[11px] text-slate-500">Adicionar à Agenda SST</p>
                </div>
                <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-white/8 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <Field label="Título" required>
                  <input value={form.title} onChange={f("title")} placeholder="Ex: Treinamento NR-35 — Turma A" className={inputCls} />
                  {formErrors.title && <p className="text-[11px] text-red-400 mt-1">{formErrors.title}</p>}
                </Field>

                <Field label="Tipo de Evento">
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(EVENT_TYPES).map(([key, t]) => (
                      <button key={key} type="button" onClick={() => setForm(p => ({ ...p, type: key }))}
                        className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-center transition-all ${form.type === key ? "opacity-100" : "opacity-40 hover:opacity-70"}`}
                        style={{ borderColor: `${t.color}50`, background: form.type === key ? t.bg : "transparent" }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                        <span className="text-[10px] font-semibold" style={{ color: t.color }}>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </Field>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Field label="Data" required>
                    <input type="date" value={form.date} onChange={f("date")} className={inputCls} />
                    {formErrors.date && <p className="text-[11px] text-red-400 mt-1">{formErrors.date}</p>}
                  </Field>
                  <Field label="Hora início">
                    <input type="time" value={form.time} onChange={f("time")} className={inputCls} />
                  </Field>
                  <Field label="Data término">
                    <input type="date" value={form.endDate} onChange={f("endDate")} className={inputCls} />
                  </Field>
                  <Field label="Hora término">
                    <input type="time" value={form.endTime} onChange={f("endTime")} className={inputCls} />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Local">
                    <input value={form.location} onChange={f("location")} placeholder="Sala, planta, área..." className={inputCls} />
                  </Field>
                  <Field label="Responsável">
                    <select value={form.responsible} onChange={f("responsible")} className={inputCls} style={{ background: "#0A1020" }}>
                      <option value="">Selecione o técnico</option>
                      {TECHNICIANS.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                    </select>
                  </Field>
                </div>

                <Field label="Recorrência">
                  <select value={form.recurrence} onChange={f("recurrence")} className={inputCls} style={{ background: "#0A1020" }}>
                    {RECURRENCES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </Field>

                <Field label="Descrição / Observações">
                  <textarea value={form.description} onChange={f("description")} rows={3}
                    placeholder="Conteúdo programático, pauta, instruções..." className={`${inputCls} resize-none`} />
                </Field>

                <div className="flex justify-end gap-3 pt-2 border-t border-white/6">
                  <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white border border-white/10 hover:border-white/20 transition-all">Cancelar</button>
                  <button onClick={() => validate() && createMut.mutate(form as any)} disabled={createMut.isPending}
                    className="px-5 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#3B82F6,#2563EB)" }}>
                    {createMut.isPending ? "Criando..." : "Criar Evento"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ BATCH MODAL ══ */}
      <AnimatePresence>
        {showBatch && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border border-white/8"
              style={{ background: "#0A1020", fontFamily: FONT }}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/6" style={{ background: "#0A1020" }}>
                <div>
                  <p className="text-sm font-bold text-white">Lançamento em Lote</p>
                  <p className="text-[11px] text-slate-500">Selecione múltiplas datas para criar eventos de uma vez (ideal para calendário anual de integrações)</p>
                </div>
                <button onClick={() => setShowBatch(false)} className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-white/8 transition-all"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: event details */}
                <div className="space-y-4">
                  <Field label="Título">
                    <input value={batchForm.title} onChange={bf("title")} placeholder="Ex: Integração de Novos Colaboradores" className={inputCls} />
                  </Field>
                  <Field label="Tipo">
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(EVENT_TYPES).map(([key, t]) => (
                        <button key={key} type="button" onClick={() => setBatchForm(p => ({ ...p, type: key }))}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${batchForm.type === key ? "opacity-100" : "opacity-35 hover:opacity-60"}`}
                          style={{ borderColor: `${t.color}50`, color: t.color, background: batchForm.type === key ? t.bg : "transparent" }}>
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t.color }} />
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Hora início"><input type="time" value={batchForm.time} onChange={bf("time")} className={inputCls} /></Field>
                    <Field label="Hora término"><input type="time" value={batchForm.endTime} onChange={bf("endTime")} className={inputCls} /></Field>
                  </div>
                  <Field label="Local"><input value={batchForm.location} onChange={bf("location")} placeholder="Local do evento" className={inputCls} /></Field>
                  <Field label="Responsável">
                    <select value={batchForm.responsible} onChange={bf("responsible")} className={inputCls} style={{ background: "#0A1020" }}>
                      <option value="">Selecione o técnico</option>
                      {TECHNICIANS.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Descrição"><textarea value={batchForm.description} onChange={bf("description")} rows={3} className={`${inputCls} resize-none`} /></Field>

                  {batchForm.selectedDates.length > 0 && (
                    <div className="rounded-xl border border-blue-500/20 p-3" style={{ background: "rgba(59,130,246,0.06)" }}>
                      <p className="text-[11px] font-bold text-blue-400 mb-2">{batchForm.selectedDates.length} data{batchForm.selectedDates.length > 1 ? "s" : ""} selecionada{batchForm.selectedDates.length > 1 ? "s" : ""}:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {batchForm.selectedDates.sort().map(d => (
                          <span key={d} className="text-[10px] font-mono px-2 py-0.5 rounded-md text-blue-300" style={{ background: "rgba(59,130,246,0.15)" }}>
                            {new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: mini calendar picker */}
                <div>
                  <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: BG2 }}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
                      <button onClick={batchPrevMonth} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-all"><ChevronLeft className="w-3.5 h-3.5" /></button>
                      <span className="text-xs font-bold text-white">{MONTHS_PT[batchMonth]} {batchYear}</span>
                      <button onClick={batchNextMonth} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-all"><ChevronRight className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="grid grid-cols-7 border-b border-white/4">
                      {WEEK_DAYS.map(d => <div key={d} className="py-1.5 text-center text-[9px] font-bold text-slate-600">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 p-1 gap-0.5">
                      {batchDays.map((day, i) => {
                        if (!day) return <div key={i} />;
                        const d = `${batchYear}-${String(batchMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                        const sel = batchForm.selectedDates.includes(d);
                        const past = d < todayStr;
                        return (
                          <button key={i} onClick={() => !past && toggleBatchDate(day)} disabled={past}
                            className={`h-8 w-full rounded-lg text-xs font-semibold transition-all ${past ? "text-slate-700 cursor-not-allowed" : sel ? "text-white" : "text-slate-400 hover:bg-white/8 hover:text-white"}`}
                            style={sel ? { background: EVENT_TYPES[batchForm.type]?.color ?? "#3B82F6" } : {}}>
                            {day}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-slate-600 text-center pb-3">Clique nas datas para selecionar</p>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6 flex justify-end gap-3 border-t border-white/6 pt-4">
                <button onClick={() => setShowBatch(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white border border-white/10 hover:border-white/20 transition-all">Cancelar</button>
                <button
                  onClick={() => batchForm.title && batchForm.selectedDates.length > 0 && batchMut.mutate({ ...batchForm, dates: batchForm.selectedDates })}
                  disabled={batchMut.isPending || !batchForm.title || batchForm.selectedDates.length === 0}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg,#3B82F6,#2563EB)" }}>
                  {batchMut.isPending ? "Criando..." : `Criar ${batchForm.selectedDates.length} evento${batchForm.selectedDates.length !== 1 ? "s" : ""}`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ DETAIL DRAWER ══ */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black" onClick={() => { setSelected(null); setEditMode(false); }} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full z-50 w-full max-w-md overflow-y-auto border-l border-white/6"
              style={{ background: "#0A1020", fontFamily: FONT }}>

              {/* Drawer header */}
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-white/6" style={{ background: "#0A1020" }}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: EVENT_TYPES[selected.type]?.bg ?? EVENT_TYPES.outro.bg }}>
                    <CalendarDays className="w-4 h-4" style={{ color: EVENT_TYPES[selected.type]?.color ?? "#64748B" }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{selected.title}</p>
                    <p className="text-[11px] text-slate-500">{EVENT_TYPES[selected.type]?.label ?? "Evento"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {!editMode ? (
                    <>
                      <button onClick={() => { setEditMode(true); setEditForm({ ...selected }); }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-all">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { setSelected(null); setEditMode(false); }}
                        className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-white/8 transition-all">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => updateMut.mutate({ id: selected.id, ...editForm } as any)} disabled={updateMut.isPending}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50"
                        style={{ background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.3)" }}>
                        {updateMut.isPending ? "Salvando..." : "Salvar"}
                      </button>
                      <button onClick={() => setEditMode(false)} className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-white/8 transition-all"><X className="w-4 h-4" /></button>
                    </>
                  )}
                </div>
              </div>

              <div className="p-5 space-y-5">
                {!editMode ? (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <TypeBadge type={selected.type} />
                      <StatusBadge status={selected.status ?? "agendado"} />
                      {selected.recurrence !== "nenhuma" && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <RefreshCw className="w-3 h-3" />{RECURRENCES.find(r => r.value === selected.recurrence)?.label}
                        </span>
                      )}
                      {/* Status quick change */}
                      <select value={selected.status ?? "agendado"}
                        onChange={e => updateMut.mutate({ id: selected.id, status: e.target.value })}
                        className="ml-auto text-[11px] rounded-lg border border-white/10 text-slate-300 px-2 py-1 outline-none cursor-pointer"
                        style={{ background: "#060B14" }}>
                        <option value="agendado">Agendado</option>
                        <option value="realizado">Realizado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                      <div className="col-span-2">
                        <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-0.5">Data</p>
                        <p className="text-slate-200 font-medium capitalize">
                          {new Date(selected.date + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                        </p>
                      </div>
                      {selected.time && (
                        <div>
                          <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-0.5">Horário</p>
                          <p className="text-slate-200 font-medium">
                            {selected.time.slice(0,5)}{selected.endTime ? ` → ${selected.endTime.slice(0,5)}` : ""}
                          </p>
                        </div>
                      )}
                      {selected.location && (
                        <div>
                          <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-0.5">Local</p>
                          <p className="text-slate-200 font-medium">{selected.location}</p>
                        </div>
                      )}
                      {selected.responsible && (() => {
                        const tech = TECHNICIANS.find(t => t.name === selected.responsible);
                        return (
                          <div>
                            <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Responsável</p>
                            <div className="flex items-center gap-2">
                              {tech ? (
                                <>
                                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 text-white"
                                    style={{ background: tech.color }}>
                                    {tech.initials}
                                  </span>
                                  <span className="font-semibold" style={{ color: tech.color }}>{tech.name}</span>
                                </>
                              ) : (
                                <span className="text-slate-200 font-medium">{selected.responsible}</span>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {selected.description && (
                      <div>
                        <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1.5">Descrição</p>
                        <p className="text-xs text-slate-300 leading-relaxed">{selected.description}</p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-white/5">
                      <button onClick={() => { if (confirm("Excluir este evento?")) deleteMut.mutate({ id: selected.id }); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/5 transition-all">
                        <Trash2 className="w-3.5 h-3.5" /> Excluir evento
                      </button>
                    </div>
                  </>
                ) : (
                  /* Edit mode */
                  <div className="space-y-4">
                    <Field label="Título"><input value={editForm.title ?? ""} onChange={ef("title")} className={inputCls} /></Field>
                    <Field label="Tipo">
                      <select value={editForm.type ?? "outro"} onChange={ef("type")} className={inputCls} style={{ background: "#0A1020" }}>
                        {Object.entries(EVENT_TYPES).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
                      </select>
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Data"><input type="date" value={editForm.date ?? ""} onChange={ef("date")} className={inputCls} /></Field>
                      <Field label="Hora"><input type="time" value={editForm.time ?? ""} onChange={ef("time")} className={inputCls} /></Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Local"><input value={editForm.location ?? ""} onChange={ef("location")} className={inputCls} /></Field>
                      <Field label="Responsável">
                        <select value={editForm.responsible ?? ""} onChange={ef("responsible")} className={inputCls} style={{ background: "#0A1020" }}>
                          <option value="">Selecione o técnico</option>
                          {TECHNICIANS.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                        </select>
                      </Field>
                    </div>
                    <Field label="Recorrência">
                      <select value={editForm.recurrence ?? "nenhuma"} onChange={ef("recurrence")} className={inputCls} style={{ background: "#0A1020" }}>
                        {RECURRENCES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </Field>
                    <Field label="Descrição"><textarea value={editForm.description ?? ""} onChange={ef("description")} rows={3} className={`${inputCls} resize-none`} /></Field>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}
