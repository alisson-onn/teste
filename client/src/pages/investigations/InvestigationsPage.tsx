import { useState } from "react";
import { motion } from "framer-motion";
import { Search as SearchIcon, Plus, Trash2, Eye, Target, Shield, ChevronRight } from "lucide-react";
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
  { label: "Todas", value: "todos" },
  { label: "Aberta", value: "aberta" },
  { label: "Em Andamento", value: "em_andamento" },
  { label: "Fechada", value: "fechada" },
];

type Form = { title: string; investigationDate: string; investigator: string; rootCauses: string; preventiveMeasures: string; correctiveMeasures: string; description: string; accidentId: string };
const EMPTY: Form = { title: "", investigationDate: "", investigator: "", rootCauses: "", preventiveMeasures: "", correctiveMeasures: "", description: "", accidentId: "" };

const statusColor: Record<string, string> = { aberta: "#F87171", em_andamento: "#F59E0B", fechada: "#34D399" };

export function InvestigationsList() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todos");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [selected, setSelected] = useState<any>(null);
  const [errors, setErrors] = useState<Partial<Form>>({});

  const { data = [], isLoading, refetch } = trpc.investigations.list.useQuery();
  const createMut = trpc.investigations.create.useMutation({ onSuccess: () => { setShowCreate(false); setForm(EMPTY); refetch(); } });
  const deleteMut = trpc.investigations.delete.useMutation({ onSuccess: () => { setSelected(null); refetch(); } });

  const filtered = data.filter(inv => {
    const q = search.toLowerCase();
    return (inv.title?.toLowerCase().includes(q) || inv.investigator?.toLowerCase().includes(q))
      && (filter === "todos" || inv.status === filter);
  });

  const validate = () => {
    const e: Partial<Form> = {};
    if (!form.title.trim()) e.title = "Obrigatório";
    if (!form.investigationDate) e.investigationDate = "Obrigatório";
    setErrors(e); return !Object.keys(e).length;
  };

  const f = (k: keyof Form) => (e: React.ChangeEvent<any>) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleExport = () => {
    const csv = generateCSV(
      ["ID", "Título", "Data", "Investigador", "Status", "Causas Raiz", "Medidas Preventivas", "Medidas Corretivas"],
      data.map(i => [i.id, i.title, i.investigationDate, i.investigator ?? "", i.status ?? "", i.rootCauses ?? "", i.preventiveMeasures ?? "", i.correctiveMeasures ?? ""])
    );
    downloadCSV(csv, `investigacoes_${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.csv`);
  };

  return (
    <MainLayout title="Investigações">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`}</style>
      <div className="p-5 lg:p-7 space-y-5" style={{ fontFamily: "'Sora', sans-serif" }}>
        <DarkPageHeader title="Investigações de Acidentes" description="Análise de causas raiz e medidas de controle"
          icon={SearchIcon} accent="#22D3EE"
          action={<div className="flex gap-2"><ExportButton onExportCSV={handleExport} /><DarkButton onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" />Nova</DarkButton></div>}
        />
        {!isLoading && (
          <MiniStats items={[
            { label: "Total", value: data.length },
            { label: "Abertas", value: data.filter(i => i.status === "aberta").length, color: "#F87171" },
            { label: "Em Andamento", value: data.filter(i => i.status === "em_andamento").length, color: "#F59E0B" },
            { label: "Fechadas", value: data.filter(i => i.status === "fechada").length, color: "#34D399" },
          ]} />
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 max-w-sm"><DarkSearch value={search} onChange={setSearch} placeholder="Buscar investigação, responsável..." /></div>
          <FilterPills options={FILTERS} value={filter} onChange={setFilter} />
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}</div>
        ) : filtered.length === 0 ? (
          <DarkEmptyState icon={SearchIcon} accent="#22D3EE"
            title={search || filter !== "todos" ? "Nenhum resultado" : "Nenhuma investigação registrada"}
            description="Inicie a análise de acidentes e causas raiz."
            action={!search && filter === "todos" && <DarkButton onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" />Nova investigação</DarkButton>}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((inv, i) => (
              <motion.div key={inv.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <DarkCard className="hover:border-white/10 transition-colors cursor-pointer overflow-hidden" >
                  <div className="h-0.5" style={{ background: statusColor[inv.status ?? "aberta"] }} />
                  <div className="p-5" onClick={() => setSelected(inv)}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-white text-sm leading-snug">{inv.title}</h3>
                          <DarkBadge status={inv.status ?? "aberta"} />
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                          {inv.investigator && (
                            <span className="text-xs text-slate-500 flex items-center gap-1.5">
                              <Shield className="w-3 h-3" />{inv.investigator}
                            </span>
                          )}
                          {inv.investigationDate && (
                            <span className="text-xs text-slate-500 font-mono">
                              {new Date(inv.investigationDate).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                          {inv.accidentId && (
                            <span className="text-xs text-cyan-500 font-mono">Acidente #{inv.accidentId}</span>
                          )}
                        </div>
                        {inv.rootCauses && (
                          <p className="text-xs text-slate-500 mt-2 flex items-start gap-1.5">
                            <Target className="w-3 h-3 flex-shrink-0 mt-0.5 text-cyan-500" />
                            <span className="line-clamp-2">{inv.rootCauses}</span>
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-1 px-4 py-2.5 border-t border-white/4" onClick={e => e.stopPropagation()}>
                    <IconBtn icon={Eye} onClick={() => setSelected(inv)} />
                    <IconBtn icon={Trash2} color="text-slate-500 hover:text-red-400" onClick={() => { if (confirm("Excluir?")) deleteMut.mutate({ id: inv.id }); }} />
                  </div>
                </DarkCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <DarkModal open={showCreate} onClose={() => setShowCreate(false)} title="Nova Investigação" width="max-w-2xl">
        <div className="space-y-4">
          <DarkField label="Título" required error={errors.title}>
            <DarkInput value={form.title} onChange={f("title")} placeholder="Ex: Investigação — Queda em Altura" />
          </DarkField>
          <div className="grid grid-cols-2 gap-4">
            <DarkField label="Data" required error={errors.investigationDate}>
              <DarkInput type="date" value={form.investigationDate} onChange={f("investigationDate")} />
            </DarkField>
            <DarkField label="Investigador Responsável">
              <DarkInput value={form.investigator} onChange={f("investigator")} placeholder="Nome" />
            </DarkField>
          </div>
          <DarkField label="Causas Raiz Identificadas">
            <DarkTextarea value={form.rootCauses} onChange={f("rootCauses")} rows={2} placeholder="Falta de EPI, falha de processo, condição insegura..." />
          </DarkField>
          <div className="grid grid-cols-2 gap-4">
            <DarkField label="Medidas Preventivas">
              <DarkTextarea value={form.preventiveMeasures} onChange={f("preventiveMeasures")} rows={2} placeholder="Ações para evitar recorrência..." />
            </DarkField>
            <DarkField label="Medidas Corretivas">
              <DarkTextarea value={form.correctiveMeasures} onChange={f("correctiveMeasures")} rows={2} placeholder="Correções imediatas aplicadas..." />
            </DarkField>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-white/6">
            <DarkButton variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</DarkButton>
            <DarkButton onClick={() => validate() && createMut.mutate({ ...form, accidentId: form.accidentId ? parseInt(form.accidentId) : undefined } as any)} disabled={createMut.isPending}>
              {createMut.isPending ? "Salvando..." : "Criar Investigação"}
            </DarkButton>
          </div>
        </div>
      </DarkModal>

      <DetailDrawer open={!!selected} onClose={() => setSelected(null)}
        title={selected?.title ?? ""} subtitle="Investigação de Acidente"
        icon={SearchIcon} accent="#22D3EE"
        actions={<><DarkButton variant="danger" onClick={() => { if(confirm("Excluir?")) deleteMut.mutate({ id: selected?.id }); }}><Trash2 className="w-3.5 h-3.5" />Excluir</DarkButton><span className="flex-1" /><DarkButton variant="ghost" onClick={() => setSelected(null)}>Fechar</DarkButton></>}
      >
        {selected && (
          <>
            <DrawerSection title="Dados">
              <DrawerRow label="Investigador" value={selected.investigator} />
              <DrawerRow label="Data" value={selected.investigationDate ? new Date(selected.investigationDate).toLocaleDateString("pt-BR") : undefined} />
              {selected.accidentId && <DrawerRow label="Acidente Ref." value={`#${selected.accidentId}`} mono />}
            </DrawerSection>
            <DrawerSection title="Status">
              <DarkBadge status={selected.status ?? "aberta"} />
            </DrawerSection>
            {selected.rootCauses && (
              <DrawerSection title="Causas Raiz">
                <p className="text-sm text-slate-300 leading-relaxed">{selected.rootCauses}</p>
              </DrawerSection>
            )}
            {selected.preventiveMeasures && (
              <DrawerSection title="Medidas Preventivas">
                <p className="text-sm text-slate-300 leading-relaxed">{selected.preventiveMeasures}</p>
              </DrawerSection>
            )}
            {selected.correctiveMeasures && (
              <DrawerSection title="Medidas Corretivas">
                <p className="text-sm text-slate-300 leading-relaxed">{selected.correctiveMeasures}</p>
              </DrawerSection>
            )}
          </>
        )}
      </DetailDrawer>
    </MainLayout>
  );
}

export function InvestigationForm() { return <InvestigationsList />; }
