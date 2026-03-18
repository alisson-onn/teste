import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardCheck, Plus, Trash2, Eye, MapPin, User, AlertCircle } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { trpc } from "@/lib/trpc";
import {
  DarkPageHeader, DarkTable, DarkTr, DarkTd, DarkBadge,
  DarkSearch, FilterPills, DarkButton, IconBtn, DarkModal,
  DarkField, DarkInput, DarkSelect, DarkTextarea, DarkEmptyState, MiniStats, TableSkeleton,
} from "@/components/shared/DarkUI";
import { DetailDrawer, DrawerSection, DrawerRow } from "@/components/shared/DetailDrawer";
import { ExportButton, generateCSV, downloadCSV } from "@/components/shared/ExportButton";

const FILTERS = [
  { label: "Todas", value: "todos" },
  { label: "Planejada", value: "planejada" },
  { label: "Em Andamento", value: "em_andamento" },
  { label: "Concluída", value: "concluida" },
];
const HEADERS = ["Inspeção", "Tipo", "Data", "Local", "Inspetor", "N/C", "Status", ""];

type Form = { title: string; type: string; date: string; location: string; inspector: string; nonConformities: string; description: string };
const EMPTY: Form = { title: "", type: "Padronizada", date: "", location: "", inspector: "", nonConformities: "0", description: "" };

export function InspectionsList() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todos");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [selected, setSelected] = useState<any>(null);
  const [errors, setErrors] = useState<Partial<Form>>({});

  const { data = [], isLoading, refetch } = trpc.inspections.list.useQuery();
  const createMut = trpc.inspections.create.useMutation({ onSuccess: () => { setShowCreate(false); setForm(EMPTY); refetch(); } });
  const deleteMut = trpc.inspections.delete.useMutation({ onSuccess: () => { setSelected(null); refetch(); } });

  const filtered = data.filter(i => {
    const q = search.toLowerCase();
    return (i.title?.toLowerCase().includes(q) || i.location?.toLowerCase().includes(q) || i.inspector?.toLowerCase().includes(q))
      && (filter === "todos" || i.status === filter);
  });

  const validate = () => {
    const e: Partial<Form> = {};
    if (!form.title.trim()) e.title = "Obrigatório";
    if (!form.date) e.date = "Obrigatório";
    setErrors(e); return !Object.keys(e).length;
  };

  const f = (k: keyof Form) => (e: React.ChangeEvent<any>) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleExport = () => {
    const csv = generateCSV(
      ["ID", "Título", "Tipo", "Data", "Local", "Inspetor", "Não Conformidades", "Status"],
      data.map(i => [i.id, i.title, i.type ?? "", i.date, i.location ?? "", i.inspector ?? "", i.nonConformities ?? 0, i.status ?? ""])
    );
    downloadCSV(csv, `inspecoes_${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.csv`);
  };

  const totalNC = data.reduce((s, i) => s + (i.nonConformities ?? 0), 0);

  return (
    <MainLayout title="Inspeções">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`}</style>
      <div className="p-5 lg:p-7 space-y-5" style={{ fontFamily: "'Sora', sans-serif" }}>
        <DarkPageHeader title="Inspeções de Segurança" description="Registro e acompanhamento de inspeções e não conformidades"
          icon={ClipboardCheck} accent="#F59E0B"
          action={<div className="flex gap-2"><ExportButton onExportCSV={handleExport} /><DarkButton onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" />Nova</DarkButton></div>}
        />
        {!isLoading && (
          <MiniStats items={[
            { label: "Total", value: data.length },
            { label: "Em Andamento", value: data.filter(i => i.status === "em_andamento").length, color: "#60A5FA" },
            { label: "Concluídas", value: data.filter(i => i.status === "concluida").length, color: "#34D399" },
            { label: "Não Conformidades", value: totalNC, color: "#F87171" },
          ]} />
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 max-w-sm"><DarkSearch value={search} onChange={setSearch} placeholder="Buscar inspeção, local, inspetor..." /></div>
          <FilterPills options={FILTERS} value={filter} onChange={setFilter} />
        </div>
        {isLoading ? (
          <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: "#0D1526" }}><TableSkeleton rows={4} cols={8} /></div>
        ) : filtered.length === 0 ? (
          <DarkEmptyState icon={ClipboardCheck} accent="#F59E0B"
            title={search || filter !== "todos" ? "Nenhum resultado" : "Nenhuma inspeção registrada"}
            description="Registre inspeções de segurança para rastreamento."
            action={!search && filter === "todos" && <DarkButton onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" />Nova inspeção</DarkButton>}
          />
        ) : (
          <DarkTable headers={HEADERS}>
            {filtered.map((insp, i) => (
              <DarkTr key={insp.id} onClick={() => setSelected(insp)}>
                <DarkTd>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="font-medium text-white text-sm leading-snug max-w-[180px] truncate">{insp.title}</motion.p>
                </DarkTd>
                <DarkTd><span className="text-xs text-slate-500">{insp.type ?? "—"}</span></DarkTd>
                <DarkTd><span className="font-mono text-xs text-slate-400">{insp.date ? new Date(insp.date).toLocaleDateString("pt-BR") : "—"}</span></DarkTd>
                <DarkTd><span className="text-xs text-slate-400">{insp.location ?? "—"}</span></DarkTd>
                <DarkTd><span className="text-xs text-slate-400">{insp.inspector ?? "—"}</span></DarkTd>
                <DarkTd>
                  <span className={`font-mono text-xs font-bold ${(insp.nonConformities ?? 0) > 0 ? "text-red-400" : "text-emerald-400"}`}>
                    {insp.nonConformities ?? 0}
                  </span>
                </DarkTd>
                <DarkTd><DarkBadge status={insp.status ?? "planejada"} /></DarkTd>
                <DarkTd className="text-right" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <IconBtn icon={Eye} onClick={() => setSelected(insp)} />
                    <IconBtn icon={Trash2} color="text-slate-500 hover:text-red-400" onClick={() => { if (confirm("Excluir?")) deleteMut.mutate({ id: insp.id }); }} />
                  </div>
                </DarkTd>
              </DarkTr>
            ))}
          </DarkTable>
        )}
      </div>

      <DarkModal open={showCreate} onClose={() => setShowCreate(false)} title="Nova Inspeção" width="max-w-2xl">
        <div className="space-y-4">
          <DarkField label="Título" required error={errors.title}>
            <DarkInput value={form.title} onChange={f("title")} placeholder="Ex: Inspeção de EPIs — Produção" />
          </DarkField>
          <div className="grid grid-cols-2 gap-4">
            <DarkField label="Tipo">
              <DarkSelect value={form.type} onChange={f("type")}>
                <option value="Padronizada">Padronizada</option>
                <option value="Personalizada">Personalizada</option>
                <option value="Periódica">Periódica</option>
                <option value="Extraordinária">Extraordinária</option>
              </DarkSelect>
            </DarkField>
            <DarkField label="Data" required error={errors.date}>
              <DarkInput type="date" value={form.date} onChange={f("date")} />
            </DarkField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DarkField label="Local / Setor">
              <DarkInput value={form.location} onChange={f("location")} placeholder="Setor Produção" />
            </DarkField>
            <DarkField label="Inspetor Responsável">
              <DarkInput value={form.inspector} onChange={f("inspector")} placeholder="Nome do inspetor" />
            </DarkField>
          </div>
          <DarkField label="Não Conformidades Encontradas">
            <DarkInput type="number" value={form.nonConformities} onChange={f("nonConformities")} placeholder="0" min="0" />
          </DarkField>
          <DarkField label="Observações">
            <DarkTextarea value={form.description} onChange={f("description")} rows={3} placeholder="Itens inspecionados, achados, recomendações..." />
          </DarkField>
          <div className="flex justify-end gap-3 pt-2 border-t border-white/6">
            <DarkButton variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</DarkButton>
            <DarkButton onClick={() => validate() && createMut.mutate({ ...form, nonConformities: parseInt(form.nonConformities) || 0 } as any)} disabled={createMut.isPending}>
              {createMut.isPending ? "Salvando..." : "Criar Inspeção"}
            </DarkButton>
          </div>
        </div>
      </DarkModal>

      <DetailDrawer open={!!selected} onClose={() => setSelected(null)}
        title={selected?.title ?? ""} subtitle={`Inspeção ${selected?.type ?? ""}`}
        icon={ClipboardCheck} accent="#F59E0B"
        actions={<><DarkButton variant="danger" onClick={() => { if(confirm("Excluir?")) deleteMut.mutate({ id: selected?.id }); }}><Trash2 className="w-3.5 h-3.5" />Excluir</DarkButton><span className="flex-1" /><DarkButton variant="ghost" onClick={() => setSelected(null)}>Fechar</DarkButton></>}
      >
        {selected && (
          <>
            <DrawerSection title="Dados da Inspeção">
              <DrawerRow label="Data" value={selected.date ? new Date(selected.date).toLocaleDateString("pt-BR") : undefined} />
              <DrawerRow label="Local" value={selected.location} />
              <DrawerRow label="Inspetor" value={selected.inspector} />
              <DrawerRow label="Tipo" value={selected.type} />
            </DrawerSection>
            <DrawerSection title="Resultado">
              <div className="flex items-center gap-4 p-4 rounded-xl border border-white/6" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="text-center">
                  <p className="text-3xl font-bold font-mono" style={{ color: (selected.nonConformities ?? 0) > 0 ? "#F87171" : "#34D399" }}>{selected.nonConformities ?? 0}</p>
                  <p className="text-xs text-slate-500 mt-1">Não Conformidades</p>
                </div>
                <div className="flex-1">
                  <DarkBadge status={selected.status ?? "planejada"} />
                </div>
              </div>
            </DrawerSection>
            {selected.description && (
              <DrawerSection title="Observações">
                <p className="text-sm text-slate-300 leading-relaxed">{selected.description}</p>
              </DrawerSection>
            )}
          </>
        )}
      </DetailDrawer>
    </MainLayout>
  );
}

export function InspectionForm() { return <InspectionsList />; }
