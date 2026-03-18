import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, Plus, Trash2, Eye, BarChart2, ChevronDown,
  User, MapPin, Clock, FileWarning, Search, X, CheckCircle2,
  AlertCircle, Activity, ClipboardList,
} from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { trpc } from "@/lib/trpc";

const FONT = "'Sora', sans-serif";
const BG = "#0D1526";

/* ── helpers ── */
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`rounded-xl bg-white/5 animate-pulse ${className}`} />;
}
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/5 p-5 ${className}`} style={{ background: BG }}>
      {children}
    </div>
  );
}
function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 block">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
    </div>
  );
}
const inputCls = "w-full rounded-xl border border-white/10 bg-white/4 text-white text-sm px-3 py-2.5 outline-none focus:border-blue-500/50 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.08)] transition-all placeholder:text-slate-600";
const textareaCls = `${inputCls} resize-none`;

function SevBadge({ severity }: { severity: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    leve:     { label: "Leve",     color: "#34D399", bg: "rgba(52,211,153,0.1)"  },
    moderado: { label: "Moderado", color: "#F59E0B", bg: "rgba(245,158,11,0.1)"  },
    grave:    { label: "Grave",    color: "#EF4444", bg: "rgba(239,68,68,0.1)"   },
    fatal:    { label: "Fatal",    color: "#7F1D1D", bg: "rgba(127,29,29,0.3)"   },
  };
  const s = map[severity] ?? { label: severity, color: "#64748B", bg: "rgba(100,116,139,0.1)" };
  return (
    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ color: s.color, background: s.bg }}>
      {s.label}
    </span>
  );
}
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    pendente:     { label: "Pendente",       color: "#F59E0B", bg: "rgba(245,158,11,0.1)"  },
    em_progresso: { label: "Em Investigação", color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
    concluida:    { label: "Concluída",       color: "#34D399", bg: "rgba(52,211,153,0.1)" },
  };
  const s = map[status] ?? { label: status, color: "#64748B", bg: "rgba(100,116,139,0.1)" };
  return (
    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ color: s.color, background: s.bg }}>
      {s.label}
    </span>
  );
}

/* ── form state ── */
type Form = {
  title: string; date: string; time: string; location: string; sector: string;
  employeeName: string; employeeId: string; type: string; severity: string;
  description: string; immediateCauses: string; rootCauses: string;
  correctives: string; witnesses: string; bodyPart: string; injuryNature: string;
  catFiled: boolean; catNumber: string; cid: string; leaveDays: string; leaveStartDate: string;
};
const EMPTY: Form = {
  title: "", date: "", time: "", location: "", sector: "",
  employeeName: "", employeeId: "", type: "Típico", severity: "leve",
  description: "", immediateCauses: "", rootCauses: "",
  correctives: "", witnesses: "", bodyPart: "", injuryNature: "",
  catFiled: false, catNumber: "", cid: "", leaveDays: "", leaveStartDate: "",
};

const BODY_PARTS = [
  "Cabeça / Crânio", "Olhos / Face", "Pescoço", "Tronco / Costas",
  "Membros Superiores (braço/antebraço)", "Mãos / Dedos",
  "Membros Inferiores (coxa/perna)", "Pés / Tornozelo",
  "Múltiplas Regiões", "Outro",
];
const INJURY_NATURES = [
  "Fratura", "Corte / Laceração", "Contusão / Hematoma",
  "Queimadura", "Entorse / Luxação", "Amputação",
  "Intoxicação / Envenenamento", "Choque Elétrico",
  "Corpo Estranho", "Esmagamento", "Outro",
];

/* ── section header ── */
function Section({ title, icon: Icon, accent = "#3B82F6" }: { title: string; icon: any; accent?: string }) {
  return (
    <div className="flex items-center gap-2 pb-2 mb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${accent}18` }}>
        <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
      </div>
      <span className="text-sm font-semibold text-slate-200">{title}</span>
    </div>
  );
}

export default function AcidentesTrabalhoPage() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [filterSev, setFilterSev] = useState("todos");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [selected, setSelected] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Form>>({});

  const { data = [], isLoading, refetch } = trpc.accidents.list.useQuery();
  const createMut = trpc.accidents.create.useMutation({
    onSuccess: () => { setShowForm(false); setForm(EMPTY); setErrors({}); refetch(); },
  });
  const updateMut = trpc.accidents.update.useMutation({
    onSuccess: (updated) => { setSelected(updated); setEditMode(false); refetch(); },
  });
  const deleteMut = trpc.accidents.delete.useMutation({
    onSuccess: () => { setSelected(null); refetch(); },
  });

  const f = (k: keyof Form) => (e: React.ChangeEvent<any>) =>
    setForm(p => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const ef = (k: keyof Form) => (e: React.ChangeEvent<any>) =>
    setEditForm(p => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const validate = () => {
    const e: Partial<Record<keyof Form, string>> = {};
    if (!form.title.trim()) e.title = "Obrigatório";
    if (!form.date) e.date = "Obrigatório";
    if (!form.severity) e.severity = "Obrigatório";
    if (!form.employeeName.trim()) e.employeeName = "Obrigatório";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = () => {
    if (!validate()) return;
    createMut.mutate({
      ...form,
      catFiled: form.catFiled,
      leaveDays: form.leaveDays ? Number(form.leaveDays) : undefined,
    } as any);
  };

  const handleUpdate = () => {
    if (!selected) return;
    updateMut.mutate({
      id: selected.id,
      ...editForm,
      leaveDays: editForm.leaveDays ? Number(editForm.leaveDays) : undefined,
    } as any);
  };

  const filtered = data.filter((a: any) => {
    const q = search.toLowerCase();
    const matchQ = !search || a.title?.toLowerCase().includes(q) || a.employeeName?.toLowerCase().includes(q) || a.location?.toLowerCase().includes(q);
    const matchSev = filterSev === "todos" || a.severity === filterSev;
    const matchSt = filterStatus === "todos" || a.investigationStatus === filterStatus;
    return matchQ && matchSev && matchSt;
  });

  const total = data.length;
  const pendentes = data.filter((a: any) => a.investigationStatus === "pendente").length;
  const emInv = data.filter((a: any) => a.investigationStatus === "em_progresso").length;
  const comCat = data.filter((a: any) => a.catFiled).length;
  const graves = data.filter((a: any) => ["grave", "fatal"].includes(a.severity ?? "")).length;

  return (
    <MainLayout title="Acidentes do Trabalho">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`}</style>
      <div className="p-5 lg:p-7 space-y-5" style={{ fontFamily: FONT }}>

        {/* Header */}
        <div className="flex items-start sm:items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.12)" }}>
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Acidentes do Trabalho</h1>
              <p className="text-xs text-slate-500">Registro, investigação e emissão de CAT</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate("/acidentes/analise")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 text-slate-400 text-xs font-semibold hover:text-white hover:border-white/20 transition-all"
              style={{ background: "rgba(255,255,255,0.03)" }}>
              <BarChart2 className="w-3.5 h-3.5" /> Análise Estratégica
            </button>
            <button onClick={() => { setShowForm(true); setForm(EMPTY); setErrors({}); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#EF4444,#DC2626)" }}>
              <Plus className="w-3.5 h-3.5" /> Registrar Acidente
            </button>
          </div>
        </div>

        {/* KPIs */}
        {!isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Total", value: total, color: "#3B82F6" },
              { label: "Pendentes", value: pendentes, color: "#F59E0B" },
              { label: "Em Investigação", value: emInv, color: "#3B82F6" },
              { label: "Com CAT", value: comCat, color: "#A78BFA" },
              { label: "Graves / Fatais", value: graves, color: "#EF4444" },
            ].map((k, i) => (
              <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-white/5 px-4 py-3 relative overflow-hidden" style={{ background: BG }}>
                <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-xl opacity-10" style={{ background: k.color }} />
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{k.label}</p>
                <p className="text-2xl font-black" style={{ fontFamily: "'JetBrains Mono', monospace", color: k.color }}>{k.value}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar título, colaborador..."
              className="w-full rounded-xl border border-white/10 bg-white/4 text-white text-xs pl-8 pr-4 py-2 outline-none focus:border-blue-500/40 transition-all placeholder:text-slate-600" />
            {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X className="w-3 h-3" /></button>}
          </div>

          {/* Severity pills */}
          <div className="flex items-center gap-1">
            {["todos", "leve", "moderado", "grave", "fatal"].map(s => (
              <button key={s} onClick={() => setFilterSev(s)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all capitalize ${filterSev === s ? "border-red-500/40 text-red-300" : "border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20"}`}
                style={filterSev === s ? { background: "rgba(239,68,68,0.1)" } : {}}>
                {s === "todos" ? "Todos" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="text-[11px] rounded-xl border border-white/10 text-slate-300 px-3 py-1.5 outline-none cursor-pointer"
            style={{ background: "#060B14" }}>
            <option value="todos">Todos os status</option>
            <option value="pendente">Pendente</option>
            <option value="em_progresso">Em Investigação</option>
            <option value="concluida">Concluída</option>
          </select>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : filtered.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-14">
              <AlertTriangle className="w-10 h-10 text-slate-700 mb-3" />
              <p className="text-sm text-slate-500">{search || filterSev !== "todos" || filterStatus !== "todos" ? "Nenhum resultado para os filtros aplicados" : "Nenhum acidente registrado"}</p>
              {!search && filterSev === "todos" && filterStatus === "todos" && (
                <button onClick={() => setShowForm(true)}
                  className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold"
                  style={{ background: "linear-gradient(135deg,#EF4444,#DC2626)" }}>
                  <Plus className="w-3.5 h-3.5" /> Registrar primeiro acidente
                </button>
              )}
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((a: any, i: number) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                onClick={() => { setSelected(a); setEditMode(false); }}
                className="flex items-center gap-4 px-4 py-3.5 rounded-2xl border border-white/5 hover:border-white/10 cursor-pointer transition-all group"
                style={{ background: BG }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(239,68,68,0.1)" }}>
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{a.title}</p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {a.employeeName && <span className="text-[11px] text-slate-500 flex items-center gap-1"><User className="w-3 h-3" />{a.employeeName}</span>}
                    {a.location && <span className="text-[11px] text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{a.location}</span>}
                    {a.date && <span className="text-[11px] text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(a.date).toLocaleDateString("pt-BR")}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <SevBadge severity={a.severity ?? ""} />
                  <StatusBadge status={a.investigationStatus ?? "pendente"} />
                  {a.catFiled ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full text-purple-300" style={{ background: "rgba(167,139,250,0.12)" }}>CAT</span>
                  ) : null}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setSelected(a); setEditMode(false); }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-all">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { if (confirm("Excluir este registro?")) deleteMut.mutate({ id: a.id }); }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ══ CREATE MODAL ══ */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border border-white/8"
              style={{ background: "#0A1020", fontFamily: FONT }}>

              {/* Modal header */}
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/6" style={{ background: "#0A1020" }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.12)" }}>
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Registrar Acidente do Trabalho</p>
                    <p className="text-[11px] text-slate-500">Preencha todos os dados da ocorrência e investigação</p>
                  </div>
                </div>
                <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-white/8 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-8">

                {/* 1. Identificação */}
                <div>
                  <Section title="Identificação do Acidente" icon={AlertTriangle} accent="#EF4444" />
                  <div className="space-y-4">
                    <Field label="Título da Ocorrência" required error={errors.title}>
                      <input value={form.title} onChange={f("title")} placeholder="Ex: Queda em altura — Setor de Manutenção" className={inputCls} />
                    </Field>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <Field label="Data" required error={errors.date}>
                        <input type="date" value={form.date} onChange={f("date")} className={inputCls} />
                      </Field>
                      <Field label="Hora">
                        <input type="time" value={form.time} onChange={f("time")} className={inputCls} />
                      </Field>
                      <Field label="Tipo">
                        <select value={form.type} onChange={f("type")} className={inputCls} style={{ background: "#0A1020" }}>
                          <option value="Típico">Típico</option>
                          <option value="Trajeto">Trajeto</option>
                          <option value="Doença">Doença Ocupacional</option>
                        </select>
                      </Field>
                      <Field label="Gravidade" required error={errors.severity}>
                        <select value={form.severity} onChange={f("severity")} className={inputCls} style={{ background: "#0A1020" }}>
                          <option value="leve">Leve</option>
                          <option value="moderado">Moderado</option>
                          <option value="grave">Grave</option>
                          <option value="fatal">Fatal</option>
                        </select>
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Local / Setor">
                        <input value={form.location} onChange={f("location")} placeholder="Ex: Galpão 3 — Linha de Produção" className={inputCls} />
                      </Field>
                      <Field label="Departamento">
                        <input value={form.sector} onChange={f("sector")} placeholder="Ex: Manutenção Industrial" className={inputCls} />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Colaborador" required error={errors.employeeName}>
                        <input value={form.employeeName} onChange={f("employeeName")} placeholder="Nome completo" className={inputCls} />
                      </Field>
                      <Field label="Matrícula">
                        <input value={form.employeeId} onChange={f("employeeId")} placeholder="000001" className={inputCls} />
                      </Field>
                    </div>
                  </div>
                </div>

                {/* 2. Investigação */}
                <div>
                  <Section title="Investigação" icon={ClipboardList} accent="#3B82F6" />
                  <div className="space-y-4">
                    <Field label="Descrição do Acidente">
                      <textarea value={form.description} onChange={f("description")} rows={3}
                        placeholder="Descreva detalhadamente o que aconteceu, a sequência de eventos e as circunstâncias..."
                        className={textareaCls} />
                    </Field>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Causas Imediatas">
                        <textarea value={form.immediateCauses} onChange={f("immediateCauses")} rows={3}
                          placeholder="Atos ou condições inseguras que diretamente causaram o acidente..."
                          className={textareaCls} />
                      </Field>
                      <Field label="Causas Raiz">
                        <textarea value={form.rootCauses} onChange={f("rootCauses")} rows={3}
                          placeholder="Por que as causas imediatas existiam? Falhas de gestão, treinamento, procedimento..."
                          className={textareaCls} />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Parte do Corpo Atingida">
                        <select value={form.bodyPart} onChange={f("bodyPart")} className={inputCls} style={{ background: "#0A1020" }}>
                          <option value="">Selecione...</option>
                          {BODY_PARTS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </Field>
                      <Field label="Natureza da Lesão">
                        <select value={form.injuryNature} onChange={f("injuryNature")} className={inputCls} style={{ background: "#0A1020" }}>
                          <option value="">Selecione...</option>
                          {INJURY_NATURES.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </Field>
                    </div>
                    <Field label="Testemunhas">
                      <input value={form.witnesses} onChange={f("witnesses")} placeholder="Nomes das testemunhas, separados por vírgula" className={inputCls} />
                    </Field>
                    <Field label="Ações Corretivas Propostas">
                      <textarea value={form.correctives} onChange={f("correctives")} rows={3}
                        placeholder="Medidas a serem tomadas para evitar reincidência..."
                        className={textareaCls} />
                    </Field>
                  </div>
                </div>

                {/* 3. CAT */}
                <div>
                  <Section title="CAT — Comunicação de Acidente do Trabalho" icon={FileWarning} accent="#A78BFA" />
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 p-4 rounded-xl border border-white/6 cursor-pointer hover:border-purple-500/30 transition-all"
                      style={{ background: "rgba(255,255,255,0.02)" }}>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${form.catFiled ? "border-purple-500 bg-purple-500" : "border-white/20"}`}>
                        {form.catFiled && <span className="text-white text-[10px] font-bold">✓</span>}
                      </div>
                      <input type="checkbox" checked={form.catFiled} onChange={f("catFiled")} className="sr-only" />
                      <div>
                        <p className="text-sm font-semibold text-white">Emitir CAT</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Marque se este acidente gera uma Comunicação de Acidente do Trabalho</p>
                      </div>
                    </label>

                    <AnimatePresence>
                      {form.catFiled && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                            <Field label="Número da CAT">
                              <input value={form.catNumber} onChange={f("catNumber")} placeholder="CAT-000000" className={inputCls} />
                            </Field>
                            <Field label="CID-10">
                              <input value={form.cid} onChange={f("cid")} placeholder="Ex: S52.0" className={inputCls} />
                            </Field>
                            <Field label="Dias de Afastamento">
                              <input type="number" min="0" value={form.leaveDays} onChange={f("leaveDays")} placeholder="0" className={inputCls} />
                            </Field>
                            <Field label="Início do Afastamento">
                              <input type="date" value={form.leaveStartDate} onChange={f("leaveStartDate")} className={inputCls} />
                            </Field>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-2 border-t border-white/6">
                  <button onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white border border-white/10 hover:border-white/20 transition-all">
                    Cancelar
                  </button>
                  <button onClick={handleCreate} disabled={createMut.isPending}
                    className="px-5 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#EF4444,#DC2626)" }}>
                    {createMut.isPending ? "Registrando..." : "Registrar Acidente"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ DETAIL / EDIT DRAWER ══ */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black" onClick={() => { setSelected(null); setEditMode(false); }} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full z-50 w-full max-w-lg overflow-y-auto border-l border-white/6"
              style={{ background: "#0A1020", fontFamily: FONT }}>

              {/* Drawer header */}
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-white/6" style={{ background: "#0A1020" }}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(239,68,68,0.12)" }}>
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{selected.title}</p>
                    <p className="text-[11px] text-slate-500">Acidente — {selected.type ?? "Típico"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {!editMode ? (
                    <>
                      <button onClick={() => { setEditMode(true); setEditForm({ ...selected, catFiled: !!selected.catFiled }); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white border border-white/10 hover:border-white/20 transition-all">
                        Editar
                      </button>
                      <button onClick={() => { setSelected(null); setEditMode(false); }}
                        className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-white/8 transition-all">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={handleUpdate} disabled={updateMut.isPending}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50"
                        style={{ background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.3)" }}>
                        {updateMut.isPending ? "Salvando..." : "Salvar"}
                      </button>
                      <button onClick={() => setEditMode(false)}
                        className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-white/8 transition-all">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="p-5 space-y-6">
                {/* Status badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <SevBadge severity={selected.severity ?? ""} />
                  <StatusBadge status={selected.investigationStatus ?? "pendente"} />
                  {selected.catFiled && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full text-purple-300" style={{ background: "rgba(167,139,250,0.12)" }}>
                      CAT {selected.catNumber ? `Nº ${selected.catNumber}` : "emitida"}
                    </span>
                  )}
                  {/* Status changer */}
                  {!editMode && (
                    <select value={selected.investigationStatus ?? "pendente"}
                      onChange={e => updateMut.mutate({ id: selected.id, investigationStatus: e.target.value as any })}
                      className="ml-auto text-[11px] rounded-lg border border-white/10 text-slate-300 px-2 py-1 outline-none cursor-pointer"
                      style={{ background: "#060B14" }}>
                      <option value="pendente">Pendente</option>
                      <option value="em_progresso">Em Investigação</option>
                      <option value="concluida">Concluída</option>
                    </select>
                  )}
                </div>

                {!editMode ? (
                  /* ── VIEW MODE ── */
                  <div className="space-y-5">
                    <div>
                      <Section title="Dados do Acidente" icon={AlertTriangle} accent="#EF4444" />
                      <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                        {[
                          ["Colaborador", selected.employeeName],
                          ["Matrícula", selected.employeeId],
                          ["Data", selected.date ? new Date(selected.date).toLocaleDateString("pt-BR") : null],
                          ["Hora", selected.time],
                          ["Local", selected.location],
                          ["Departamento", selected.sector],
                          ["Tipo", selected.type],
                          ["Gravidade", selected.severity],
                        ].map(([label, val]) => val ? (
                          <div key={label as string}>
                            <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-0.5">{label}</p>
                            <p className="text-slate-200 font-medium">{val}</p>
                          </div>
                        ) : null)}
                      </div>
                    </div>

                    {(selected.description || selected.immediateCauses || selected.rootCauses || selected.witnesses || selected.correctives) && (
                      <div>
                        <Section title="Investigação" icon={ClipboardList} accent="#3B82F6" />
                        <div className="space-y-3 text-xs">
                          {selected.bodyPart && <div><p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Parte do Corpo</p><p className="text-slate-300">{selected.bodyPart}</p></div>}
                          {selected.injuryNature && <div><p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Natureza da Lesão</p><p className="text-slate-300">{selected.injuryNature}</p></div>}
                          {selected.description && <div><p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Descrição</p><p className="text-slate-300 leading-relaxed">{selected.description}</p></div>}
                          {selected.immediateCauses && <div><p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Causas Imediatas</p><p className="text-slate-300 leading-relaxed">{selected.immediateCauses}</p></div>}
                          {selected.rootCauses && <div><p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Causas Raiz</p><p className="text-slate-300 leading-relaxed">{selected.rootCauses}</p></div>}
                          {selected.witnesses && <div><p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Testemunhas</p><p className="text-slate-300">{selected.witnesses}</p></div>}
                          {selected.correctives && <div><p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Ações Corretivas</p><p className="text-slate-300 leading-relaxed">{selected.correctives}</p></div>}
                        </div>
                      </div>
                    )}

                    {selected.catFiled && (
                      <div>
                        <Section title="CAT" icon={FileWarning} accent="#A78BFA" />
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                          {[
                            ["Número da CAT", selected.catNumber],
                            ["CID-10", selected.cid],
                            ["Dias de Afastamento", selected.leaveDays ? `${selected.leaveDays}d` : null],
                            ["Início do Afastamento", selected.leaveStartDate ? new Date(selected.leaveStartDate).toLocaleDateString("pt-BR") : null],
                          ].map(([label, val]) => val ? (
                            <div key={label as string}>
                              <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-0.5">{label}</p>
                              <p className="text-slate-200 font-medium">{val}</p>
                            </div>
                          ) : null)}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-white/5">
                      <button onClick={() => { if (confirm("Excluir este registro?")) deleteMut.mutate({ id: selected.id }); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/5 transition-all">
                        <Trash2 className="w-3.5 h-3.5" /> Excluir registro
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── EDIT MODE ── */
                  <div className="space-y-6">
                    <div>
                      <Section title="Dados do Acidente" icon={AlertTriangle} accent="#EF4444" />
                      <div className="space-y-3">
                        <Field label="Título"><input value={editForm.title ?? ""} onChange={ef("title")} className={inputCls} /></Field>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Data"><input type="date" value={editForm.date ?? ""} onChange={ef("date")} className={inputCls} /></Field>
                          <Field label="Hora"><input type="time" value={editForm.time ?? ""} onChange={ef("time")} className={inputCls} /></Field>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Local"><input value={editForm.location ?? ""} onChange={ef("location")} className={inputCls} /></Field>
                          <Field label="Departamento"><input value={editForm.sector ?? ""} onChange={ef("sector")} className={inputCls} /></Field>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Colaborador"><input value={editForm.employeeName ?? ""} onChange={ef("employeeName")} className={inputCls} /></Field>
                          <Field label="Matrícula"><input value={editForm.employeeId ?? ""} onChange={ef("employeeId")} className={inputCls} /></Field>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Tipo">
                            <select value={editForm.type ?? "Típico"} onChange={ef("type")} className={inputCls} style={{ background: "#0A1020" }}>
                              <option value="Típico">Típico</option><option value="Trajeto">Trajeto</option><option value="Doença">Doença Ocupacional</option>
                            </select>
                          </Field>
                          <Field label="Gravidade">
                            <select value={editForm.severity ?? "leve"} onChange={ef("severity")} className={inputCls} style={{ background: "#0A1020" }}>
                              <option value="leve">Leve</option><option value="moderado">Moderado</option><option value="grave">Grave</option><option value="fatal">Fatal</option>
                            </select>
                          </Field>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Section title="Investigação" icon={ClipboardList} accent="#3B82F6" />
                      <div className="space-y-3">
                        <Field label="Descrição"><textarea value={editForm.description ?? ""} onChange={ef("description")} rows={2} className={textareaCls} /></Field>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Parte do Corpo">
                            <select value={editForm.bodyPart ?? ""} onChange={ef("bodyPart")} className={inputCls} style={{ background: "#0A1020" }}>
                              <option value="">Selecione...</option>
                              {BODY_PARTS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                          </Field>
                          <Field label="Natureza da Lesão">
                            <select value={editForm.injuryNature ?? ""} onChange={ef("injuryNature")} className={inputCls} style={{ background: "#0A1020" }}>
                              <option value="">Selecione...</option>
                              {INJURY_NATURES.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </Field>
                        </div>
                        <Field label="Causas Imediatas"><textarea value={editForm.immediateCauses ?? ""} onChange={ef("immediateCauses")} rows={2} className={textareaCls} /></Field>
                        <Field label="Causas Raiz"><textarea value={editForm.rootCauses ?? ""} onChange={ef("rootCauses")} rows={2} className={textareaCls} /></Field>
                        <Field label="Testemunhas"><input value={editForm.witnesses ?? ""} onChange={ef("witnesses")} className={inputCls} /></Field>
                        <Field label="Ações Corretivas"><textarea value={editForm.correctives ?? ""} onChange={ef("correctives")} rows={2} className={textareaCls} /></Field>
                      </div>
                    </div>
                    <div>
                      <Section title="CAT" icon={FileWarning} accent="#A78BFA" />
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 p-3 rounded-xl border border-white/6 cursor-pointer">
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${editForm.catFiled ? "border-purple-500 bg-purple-500" : "border-white/20"}`}>
                            {editForm.catFiled && <span className="text-white text-[10px] font-bold">✓</span>}
                          </div>
                          <input type="checkbox" checked={!!editForm.catFiled} onChange={ef("catFiled")} className="sr-only" />
                          <span className="text-sm font-medium text-slate-300">CAT emitida</span>
                        </label>
                        {editForm.catFiled && (
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Número da CAT"><input value={editForm.catNumber ?? ""} onChange={ef("catNumber")} className={inputCls} /></Field>
                            <Field label="CID-10"><input value={editForm.cid ?? ""} onChange={ef("cid")} className={inputCls} /></Field>
                            <Field label="Dias Afastamento"><input type="number" value={editForm.leaveDays ?? ""} onChange={ef("leaveDays")} className={inputCls} /></Field>
                            <Field label="Início Afastamento"><input type="date" value={editForm.leaveStartDate ?? ""} onChange={ef("leaveStartDate")} className={inputCls} /></Field>
                          </div>
                        )}
                      </div>
                    </div>
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
