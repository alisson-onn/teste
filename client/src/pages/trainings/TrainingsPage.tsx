import { useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Plus, Trash2, Eye, Clock, Users, Award, UserPlus, CheckCircle2, Circle, Search } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { trpc } from "@/lib/trpc";
import {
  DarkPageHeader, DarkCard, DarkBadge, DarkSearch, FilterPills,
  DarkButton, IconBtn, DarkModal, DarkField, DarkInput, DarkSelect,
  DarkTextarea, DarkEmptyState, MiniStats, CardSkeleton,
} from "@/components/shared/DarkUI";
import { DetailDrawer, DrawerSection, DrawerRow, TimelineItem } from "@/components/shared/DetailDrawer";
import { ExportButton, generateCSV, downloadCSV } from "@/components/shared/ExportButton";

const FILTERS = [
  { label: "Todos", value: "todos" },
  { label: "Planejado", value: "planejado" },
  { label: "Em Andamento", value: "em_andamento" },
  { label: "Concluído", value: "concluido" },
];

type Form = { title: string; type: string; instructor: string; location: string; startDate: string; endDate: string; duration: string; description: string };
const EMPTY: Form = { title: "", type: "", instructor: "", location: "", startDate: "", endDate: "", duration: "", description: "" };

const statusBar: Record<string, string> = { concluido: "#22C55E", em_andamento: "#3B82F6", planejado: "#64748B" };

export function TrainingsList() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todos");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [selected, setSelected] = useState<any>(null);
  const [errors, setErrors] = useState<Partial<Form>>({});

  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");

  const { data = [], isLoading, refetch } = trpc.trainings.list.useQuery();
  const { data: participants = [], refetch: refetchParticipants } = trpc.trainings.listParticipants.useQuery(
    { trainingId: selected?.id ?? 0 }, { enabled: !!selected }
  );
  const { data: employees = [] } = trpc.employees.list.useQuery();
  const createMut = trpc.trainings.create.useMutation({ onSuccess: () => { setShowCreate(false); setForm(EMPTY); refetch(); } });
  const deleteMut = trpc.trainings.delete.useMutation({ onSuccess: () => { setSelected(null); refetch(); } });
  const addParticipantMut = trpc.trainings.addParticipant.useMutation({ onSuccess: () => { refetchParticipants(); setShowAddParticipant(false); setEmployeeSearch(""); } });
  const removeParticipantMut = trpc.trainings.removeParticipant.useMutation({ onSuccess: () => refetchParticipants() });
  const markAttendedMut = trpc.trainings.markAttended.useMutation({ onSuccess: () => refetchParticipants() });

  const filtered = data.filter(t => {
    const q = search.toLowerCase();
    return (t.title?.toLowerCase().includes(q) || t.instructor?.toLowerCase().includes(q) || t.type?.toLowerCase().includes(q))
      && (filter === "todos" || t.status === filter);
  });

  const validate = () => {
    const e: Partial<Form> = {};
    if (!form.title.trim()) e.title = "Obrigatório";
    if (!form.startDate) e.startDate = "Obrigatório";
    setErrors(e); return !Object.keys(e).length;
  };

  const f = (k: keyof Form) => (e: React.ChangeEvent<any>) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleExport = () => {
    const csv = generateCSV(
      ["ID", "Título", "Tipo", "Instrutor", "Local", "Data Início", "Status", "Duração (h)"],
      data.map(t => [t.id, t.title, t.type ?? "", t.instructor ?? "", t.location ?? "", t.startDate, t.status ?? "", t.duration ?? ""])
    );
    downloadCSV(csv, `treinamentos_${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.csv`);
  };

  return (
    <MainLayout title="Treinamentos">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`}</style>
      <div className="p-5 lg:p-7 space-y-5" style={{ fontFamily: "'Sora', sans-serif" }}>
        <DarkPageHeader title="Treinamentos de SST" description="Gerenciamento de treinamentos e certificações"
          icon={GraduationCap} accent="#22C55E"
          action={<div className="flex gap-2"><ExportButton onExportCSV={handleExport} /><DarkButton onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" />Novo</DarkButton></div>}
        />
        {!isLoading && (
          <MiniStats items={[
            { label: "Total", value: data.length },
            { label: "Em Andamento", value: data.filter(t => t.status === "em_andamento").length, color: "#60A5FA" },
            { label: "Concluídos", value: data.filter(t => t.status === "concluido").length, color: "#34D399" },
            { label: "Horas Total", value: data.reduce((s, t) => s + (t.duration ?? 0), 0) + "h", color: "#A78BFA" },
            { label: "Participantes", value: data.reduce((s, t) => s + (t.participantCount ?? 0), 0), color: "#F59E0B" },
          ]} />
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 max-w-sm"><DarkSearch value={search} onChange={setSearch} placeholder="Buscar treinamento, instrutor..." /></div>
          <FilterPills options={FILTERS} value={filter} onChange={setFilter} />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}</div>
        ) : filtered.length === 0 ? (
          <DarkEmptyState icon={GraduationCap} accent="#22C55E"
            title={search || filter !== "todos" ? "Nenhum resultado" : "Nenhum treinamento registrado"}
            description="Registre treinamentos de segurança do trabalho."
            action={!search && filter === "todos" && <DarkButton onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" />Criar treinamento</DarkButton>}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <DarkCard className="overflow-hidden hover:border-white/10 transition-colors cursor-pointer" >
                  <div className="h-0.5" style={{ background: statusBar[t.status ?? "planejado"] }} />
                  <div className="p-5" onClick={() => setSelected(t)}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(34,197,94,0.1)" }}>
                        <GraduationCap className="w-4 h-4 text-emerald-400" />
                      </div>
                      <DarkBadge status={t.status ?? "planejado"} />
                    </div>
                    <h3 className="font-semibold text-white text-sm leading-snug mb-2">{t.title}</h3>
                    {t.type && <span className="text-[10px] font-mono px-2 py-0.5 rounded-md text-emerald-400 mr-2" style={{ background: "rgba(34,197,94,0.1)" }}>{t.type}</span>}
                    <div className="mt-3 space-y-1.5">
                      {t.instructor && <div className="flex items-center gap-2 text-xs text-slate-500"><Users className="w-3.5 h-3.5" />{t.instructor}</div>}
                      {t.startDate && <div className="flex items-center gap-2 text-xs text-slate-500"><Award className="w-3.5 h-3.5" />{new Date(t.startDate).toLocaleDateString("pt-BR")}{t.endDate ? ` → ${new Date(t.endDate).toLocaleDateString("pt-BR")}` : ""}</div>}
                      {t.duration && <div className="flex items-center gap-2 text-xs text-slate-500"><Clock className="w-3.5 h-3.5" />{t.duration}h de duração</div>}
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <UserPlus className="w-3.5 h-3.5" />
                        {(t as any).participantCount ?? 0} participante(s)
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-1 px-4 py-2.5 border-t border-white/4" onClick={e => e.stopPropagation()}>
                    <IconBtn icon={Eye} onClick={() => setSelected(t)} />
                    <IconBtn icon={Trash2} color="text-slate-500 hover:text-red-400" onClick={() => { if (confirm("Excluir?")) deleteMut.mutate({ id: t.id }); }} />
                  </div>
                </DarkCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <DarkModal open={showCreate} onClose={() => setShowCreate(false)} title="Novo Treinamento" width="max-w-2xl">
        <div className="space-y-4">
          <DarkField label="Título" required error={errors.title}>
            <DarkInput value={form.title} onChange={f("title")} placeholder="NR-35 — Trabalho em Altura" />
          </DarkField>
          <div className="grid grid-cols-2 gap-4">
            <DarkField label="Tipo / NR">
              <DarkInput value={form.type} onChange={f("type")} placeholder="NR-35, CIPA, Primeiros Socorros..." />
            </DarkField>
            <DarkField label="Instrutor">
              <DarkInput value={form.instructor} onChange={f("instructor")} placeholder="Nome do instrutor" />
            </DarkField>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <DarkField label="Data Início" required error={errors.startDate}>
              <DarkInput type="date" value={form.startDate} onChange={f("startDate")} />
            </DarkField>
            <DarkField label="Data Término">
              <DarkInput type="date" value={form.endDate} onChange={f("endDate")} />
            </DarkField>
            <DarkField label="Duração (h)">
              <DarkInput type="number" value={form.duration} onChange={f("duration")} placeholder="8" min="1" />
            </DarkField>
          </div>
          <DarkField label="Local">
            <DarkInput value={form.location} onChange={f("location")} placeholder="Sala de treinamento / Planta" />
          </DarkField>
          <DarkField label="Descrição">
            <DarkTextarea value={form.description} onChange={f("description")} rows={3} placeholder="Conteúdo programático, objetivos..." />
          </DarkField>
          <div className="flex justify-end gap-3 pt-2 border-t border-white/6">
            <DarkButton variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</DarkButton>
            <DarkButton onClick={() => validate() && createMut.mutate({ ...form, duration: form.duration ? parseInt(form.duration) : undefined } as any)} disabled={createMut.isPending}>
              {createMut.isPending ? "Salvando..." : "Criar Treinamento"}
            </DarkButton>
          </div>
        </div>
      </DarkModal>

      <DetailDrawer open={!!selected} onClose={() => setSelected(null)}
        title={selected?.title ?? ""} subtitle={selected?.type ? `Tipo: ${selected.type}` : "Treinamento SST"}
        icon={GraduationCap} accent="#22C55E"
        actions={<><DarkButton variant="danger" onClick={() => { if(confirm("Excluir?")) deleteMut.mutate({ id: selected?.id }); }}><Trash2 className="w-3.5 h-3.5" />Excluir</DarkButton><span className="flex-1" /><DarkButton variant="ghost" onClick={() => setSelected(null)}>Fechar</DarkButton></>}
      >
        {selected && (
          <>
            <DrawerSection title="Informações">
              <DrawerRow label="Instrutor" value={selected.instructor} />
              <DrawerRow label="Local" value={selected.location} />
              <DrawerRow label="Duração" value={selected.duration ? `${selected.duration} horas` : undefined} />
              <DrawerRow label="Data Início" value={selected.startDate ? new Date(selected.startDate).toLocaleDateString("pt-BR") : undefined} />
              <DrawerRow label="Data Término" value={selected.endDate ? new Date(selected.endDate).toLocaleDateString("pt-BR") : "—"} />
            </DrawerSection>
            <DrawerSection title="Status">
              <DarkBadge status={selected.status ?? "planejado"} />
            </DrawerSection>
            {selected.description && (
              <DrawerSection title="Descrição">
                <p className="text-sm text-slate-300 leading-relaxed">{selected.description}</p>
              </DrawerSection>
            )}

            {/* Participantes */}
            <DrawerSection title={`Participantes (${participants.length})`}>
              <div className="space-y-2">
                {participants.length === 0 ? (
                  <p className="text-xs text-slate-600 py-2">Nenhum participante adicionado.</p>
                ) : (
                  participants.map((p: any) => (
                    <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-white/5" style={{ background: "#0A1020" }}>
                      <button onClick={() => markAttendedMut.mutate({ id: p.id, attended: !p.attended })}
                        className="flex-shrink-0 transition-colors">
                        {p.attended
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          : <Circle className="w-4 h-4 text-slate-600" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{p.employeeName}</p>
                        <p className="text-[10px] text-slate-500 truncate">{[p.position, p.sector].filter(Boolean).join(" · ")}</p>
                      </div>
                      {p.matricula && <span className="text-[10px] font-mono text-slate-600">{p.matricula}</span>}
                      <IconBtn icon={Trash2} color="text-slate-600 hover:text-red-400"
                        onClick={() => removeParticipantMut.mutate({ id: p.id })} />
                    </div>
                  ))
                )}
                <DarkButton variant="ghost" onClick={() => setShowAddParticipant(true)}>
                  <UserPlus className="w-3.5 h-3.5" />Adicionar participante
                </DarkButton>
              </div>
            </DrawerSection>
          </>
        )}
      </DetailDrawer>

      {/* Modal adicionar participante */}
      <DarkModal open={showAddParticipant} onClose={() => { setShowAddParticipant(false); setEmployeeSearch(""); }} title="Adicionar Participante" width="max-w-md">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              value={employeeSearch}
              onChange={e => setEmployeeSearch(e.target.value)}
              placeholder="Buscar funcionário por nome ou matrícula..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs text-white border border-white/8 outline-none focus:border-blue-500/50 transition-colors"
              style={{ background: "#0D1526" }}
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {employees
              .filter(e => {
                const q = employeeSearch.toLowerCase();
                return e.name.toLowerCase().includes(q) || (e.matricula ?? "").toLowerCase().includes(q);
              })
              .filter(e => !participants.some((p: any) => p.employeeId === e.id))
              .map(e => (
                <button key={e.id} onClick={() => addParticipantMut.mutate({
                  trainingId: selected?.id,
                  employeeId: e.id,
                  employeeName: e.name,
                  matricula: e.matricula ?? undefined,
                  sector: e.sector ?? undefined,
                  position: e.position ?? undefined,
                })}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all text-left">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-emerald-400">{e.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{e.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{[e.position, e.sector].filter(Boolean).join(" · ")}</p>
                  </div>
                  {e.matricula && <span className="text-[10px] font-mono text-slate-600">{e.matricula}</span>}
                </button>
              ))}
            {employees.filter(e => {
              const q = employeeSearch.toLowerCase();
              return e.name.toLowerCase().includes(q) || (e.matricula ?? "").toLowerCase().includes(q);
            }).filter(e => !participants.some((p: any) => p.employeeId === e.id)).length === 0 && (
              <p className="text-xs text-slate-600 text-center py-4">Nenhum funcionário encontrado.</p>
            )}
          </div>
          <div className="pt-2 border-t border-white/6">
            <DarkButton variant="ghost" onClick={() => { setShowAddParticipant(false); setEmployeeSearch(""); }}>Cancelar</DarkButton>
          </div>
        </div>
      </DarkModal>
    </MainLayout>
  );
}

export function TrainingForm() { return <TrainingsList />; }
