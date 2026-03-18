import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { AlertTriangle, Plus, Edit, Trash2, Eye, FileWarning, User, MapPin, Clock, Calendar, CheckSquare, BarChart2 } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { trpc } from "@/lib/trpc";
import {
  DarkPageHeader, DarkTable, DarkTr, DarkTd, DarkBadge, DarkSeverityBadge,
  DarkSearch, FilterPills, DarkButton, IconBtn, DarkModal,
  DarkField, DarkInput, DarkSelect, DarkTextarea, DarkEmptyState, MiniStats, TableSkeleton,
} from "@/components/shared/DarkUI";
import { DetailDrawer, DrawerSection, DrawerRow, TimelineItem } from "@/components/shared/DetailDrawer";
import { ExportButton, generateCSV, downloadCSV } from "@/components/shared/ExportButton";

const SEV_FILTERS = [
  { label: "Todas", value: "todos" },
  { label: "Leve", value: "leve" },
  { label: "Moderado", value: "moderado" },
  { label: "Grave", value: "grave" },
  { label: "Fatal", value: "fatal" },
];

const HEADERS = ["Ocorrência", "Colaborador", "Data", "Gravidade", "Investigação", "CAT", ""];

type Form = {
  title: string; description: string; date: string; time: string;
  location: string; employeeName: string; employeeId: string;
  type: string; severity: string; catFiled: boolean; catNumber: string;
};
const EMPTY: Form = {
  title: "", description: "", date: "", time: "", location: "",
  employeeName: "", employeeId: "", type: "Típico", severity: "leve",
  catFiled: false, catNumber: "",
};

export function AccidentsList() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todos");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Form>>({});
  const [selected, setSelected] = useState<any>(null);
  const [, navigate] = useLocation();

  const { data = [], isLoading, refetch } = trpc.accidents.list.useQuery();
  const createMut = trpc.accidents.create.useMutation({ onSuccess: () => { setShowCreate(false); setForm(EMPTY); refetch(); } });
  const deleteMut = trpc.accidents.delete.useMutation({ onSuccess: () => { if (selected) setSelected(null); refetch(); } });

  const filtered = data.filter(a => {
    const q = search.toLowerCase();
    const match = a.title?.toLowerCase().includes(q) || a.employeeName?.toLowerCase().includes(q) || a.location?.toLowerCase().includes(q);
    return match && (filter === "todos" || a.severity === filter);
  });

  const validate = () => {
    const e: Partial<Form> = {};
    if (!form.title.trim()) e.title = "Obrigatório";
    if (!form.date) e.date = "Obrigatório";
    if (!form.severity) e.severity = "Obrigatório";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const f = (k: keyof Form) => (e: React.ChangeEvent<any>) =>
    setForm(p => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const handleExport = () => {
    const csv = generateCSV(
      ["ID", "Título", "Colaborador", "Data", "Gravidade", "Investigação", "CAT"],
      data.map(a => [a.id, a.title, a.employeeName ?? "", a.date, a.severity, a.investigationStatus ?? "", a.catFiled ? "Sim" : "Não"])
    );
    downloadCSV(csv, `acidentes_${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.csv`);
  };

  return (
    <MainLayout title="Acidentes de Trabalho">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`}</style>
      <div className="p-5 lg:p-7 space-y-5" style={{ fontFamily: "'Sora', sans-serif" }}>

        <DarkPageHeader title="Acidentes de Trabalho" description="Registro e acompanhamento de ocorrências"
          icon={AlertTriangle} accent="#EF4444"
          action={
            <div className="flex gap-2">
              <ExportButton onExportCSV={handleExport} />
              <DarkButton onClick={() => navigate("/acidentes/analise")} variant="danger">
                <BarChart2 className="w-4 h-4" />Análise
              </DarkButton>
              <DarkButton onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" />Registrar</DarkButton>
            </div>
          }
        />

        {!isLoading && (
          <MiniStats items={[
            { label: "Total", value: data.length },
            { label: "Graves/Fatais", value: data.filter(a => ["grave","fatal"].includes(a.severity ?? "")).length, color: "#EF4444" },
            { label: "Com CAT", value: data.filter(a => a.catFiled).length, color: "#60A5FA" },
            { label: "Pendentes", value: data.filter(a => a.investigationStatus === "pendente").length, color: "#F59E0B" },
          ]} />
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 max-w-sm"><DarkSearch value={search} onChange={setSearch} placeholder="Buscar título, colaborador..." /></div>
          <FilterPills options={SEV_FILTERS} value={filter} onChange={setFilter} />
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: "#0D1526" }}>
            <TableSkeleton rows={5} cols={7} />
          </div>
        ) : filtered.length === 0 ? (
          <DarkEmptyState icon={AlertTriangle} accent="#EF4444"
            title={search || filter !== "todos" ? "Nenhum resultado" : "Nenhum acidente registrado"}
            description="Registre ocorrências de acidentes de trabalho."
            action={!search && filter === "todos" && <DarkButton onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" />Registrar acidente</DarkButton>}
          />
        ) : (
          <DarkTable headers={HEADERS}>
            {filtered.map((a, i) => (
              <DarkTr key={a.id} onClick={() => setSelected(a)}>
                <DarkTd>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(239,68,68,0.1)" }}>
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <span className="font-medium text-white text-sm leading-snug max-w-[200px] truncate">{a.title}</span>
                  </motion.div>
                </DarkTd>
                <DarkTd><span className="text-slate-400 text-xs">{a.employeeName ?? "—"}</span></DarkTd>
                <DarkTd><span className="font-mono text-xs text-slate-400">{a.date ? new Date(a.date).toLocaleDateString("pt-BR") : "—"}</span></DarkTd>
                <DarkTd><DarkSeverityBadge severity={a.severity ?? ""} /></DarkTd>
                <DarkTd><DarkBadge status={a.investigationStatus ?? "pendente"} /></DarkTd>
                <DarkTd>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${a.catFiled ? "text-emerald-400 bg-emerald-400/10" : "text-slate-600 bg-white/4"}`}>
                    {a.catFiled ? "Sim" : "Não"}
                  </span>
                </DarkTd>
                <DarkTd className="text-right">
                  <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                    <IconBtn icon={Eye} title="Detalhes" onClick={() => setSelected(a)} />
                    <IconBtn icon={Trash2} title="Excluir" color="text-slate-500 hover:text-red-400"
                      onClick={() => { if (confirm("Excluir este acidente?")) deleteMut.mutate({ id: a.id }); }} />
                  </div>
                </DarkTd>
              </DarkTr>
            ))}
          </DarkTable>
        )}
      </div>

      {/* CREATE MODAL */}
      <DarkModal open={showCreate} onClose={() => setShowCreate(false)} title="Registrar Acidente" width="max-w-2xl">
        <div className="space-y-4">
          <DarkField label="Título / Descrição" required error={errors.title}>
            <DarkInput value={form.title} onChange={f("title")} placeholder="Ex: Queda em altura — Setor Industrial" />
          </DarkField>
          <div className="grid grid-cols-2 gap-4">
            <DarkField label="Colaborador">
              <DarkInput value={form.employeeName} onChange={f("employeeName")} placeholder="Nome completo" />
            </DarkField>
            <DarkField label="Matrícula">
              <DarkInput value={form.employeeId} onChange={f("employeeId")} placeholder="001" />
            </DarkField>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <DarkField label="Data" required error={errors.date}>
              <DarkInput type="date" value={form.date} onChange={f("date")} />
            </DarkField>
            <DarkField label="Hora">
              <DarkInput type="time" value={form.time} onChange={f("time")} />
            </DarkField>
            <DarkField label="Local">
              <DarkInput value={form.location} onChange={f("location")} placeholder="Setor / Área" />
            </DarkField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DarkField label="Tipo">
              <DarkSelect value={form.type} onChange={f("type")}>
                <option value="Típico">Típico</option>
                <option value="Trajeto">Trajeto</option>
                <option value="Doença">Doença Ocupacional</option>
              </DarkSelect>
            </DarkField>
            <DarkField label="Gravidade" required error={errors.severity}>
              <DarkSelect value={form.severity} onChange={f("severity")}>
                <option value="leve">Leve</option>
                <option value="moderado">Moderado</option>
                <option value="grave">Grave</option>
                <option value="fatal">Fatal</option>
              </DarkSelect>
            </DarkField>
          </div>
          <DarkField label="Descrição detalhada">
            <DarkTextarea value={form.description} onChange={f("description")} rows={3} placeholder="Circunstâncias, testemunhas, sequência de eventos..." />
          </DarkField>
          <div className="flex items-center gap-3 p-4 rounded-xl border border-white/6" style={{ background: "rgba(255,255,255,0.02)" }}>
            <input type="checkbox" id="cat" checked={form.catFiled} onChange={f("catFiled")} className="w-4 h-4 rounded accent-blue-500" />
            <label htmlFor="cat" className="text-sm text-slate-300 cursor-pointer">CAT emitida</label>
            {form.catFiled && <DarkInput className="flex-1 ml-2" value={form.catNumber} onChange={f("catNumber")} placeholder="Número da CAT" />}
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-white/6">
            <DarkButton variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</DarkButton>
            <DarkButton onClick={() => validate() && createMut.mutate(form as any)} disabled={createMut.isPending}>
              {createMut.isPending ? "Salvando..." : "Registrar Acidente"}
            </DarkButton>
          </div>
        </div>
      </DarkModal>

      {/* DETAIL DRAWER */}
      <DetailDrawer
        open={!!selected} onClose={() => setSelected(null)}
        title={selected?.title ?? ""} subtitle={`Acidente de Trabalho — ${selected?.type ?? ""}`}
        icon={AlertTriangle} accent="#EF4444"
        actions={
          <>
            <DarkButton variant="danger" onClick={() => { if (confirm("Excluir?")) deleteMut.mutate({ id: selected?.id }); }}>
              <Trash2 className="w-3.5 h-3.5" />Excluir
            </DarkButton>
            <span className="flex-1" />
            <DarkButton variant="ghost" onClick={() => setSelected(null)}>Fechar</DarkButton>
          </>
        }
      >
        {selected && (
          <>
            <DrawerSection title="Dados do Acidente">
              <DrawerRow label="Colaborador" value={selected.employeeName} />
              <DrawerRow label="Matrícula" value={selected.employeeId} mono />
              <DrawerRow label="Data" value={selected.date ? new Date(selected.date).toLocaleDateString("pt-BR") : undefined} />
              <DrawerRow label="Hora" value={selected.time} />
              <DrawerRow label="Local" value={selected.location} />
              <DrawerRow label="Tipo" value={selected.type} />
              <DrawerRow label="CAT" value={selected.catFiled ? `Sim — Nº ${selected.catNumber || "não informado"}` : "Não emitida"} />
            </DrawerSection>

            <DrawerSection title="Status">
              <div className="flex gap-2 flex-wrap mt-1">
                <DarkSeverityBadge severity={selected.severity ?? ""} />
                <DarkBadge status={selected.investigationStatus ?? "pendente"} />
              </div>
            </DrawerSection>

            {selected.description && (
              <DrawerSection title="Descrição">
                <p className="text-sm text-slate-300 leading-relaxed">{selected.description}</p>
              </DrawerSection>
            )}

            <DrawerSection title="Linha do Tempo">
              <TimelineItem label="Ocorrência registrada" date={selected.createdAt ? new Date(selected.createdAt).toLocaleString("pt-BR") : undefined} color="#EF4444" />
              {selected.investigationStatus === "em_progresso" && <TimelineItem label="Investigação iniciada" color="#F59E0B" />}
              {selected.investigationStatus === "concluida" && <TimelineItem label="Investigação concluída" color="#34D399" last />}
              {selected.investigationStatus === "pendente" && <TimelineItem label="Investigação pendente" color="#64748B" last />}
            </DrawerSection>
          </>
        )}
      </DetailDrawer>
    </MainLayout>
  );
}

// Keep old AccidentForm as redirect
export function AccidentForm() {
  return <AccidentsList />;
}
