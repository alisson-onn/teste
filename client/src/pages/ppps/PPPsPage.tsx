import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Plus, Download, Edit, Trash2, User } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { trpc } from "@/lib/trpc";
import {
  DarkPageHeader, DarkTable, DarkTr, DarkTd, DarkBadge,
  DarkSearch, FilterPills, DarkButton, IconBtn, DarkModal,
  DarkField, DarkInput, DarkSelect, DarkEmptyState, MiniStats, CardSkeleton
} from "@/components/shared/DarkUI";

const FILTERS = [
  { label: "Todos", value: "todos" },
  { label: "Ativo", value: "ativo" },
  { label: "Em Revisão", value: "revisao" },
  { label: "Finalizado", value: "finalizado" },
];

const HEADERS = ["Colaborador", "Cargo", "Setor", "Admissão", "Status", "Ações"];

type FormState = {
  employeeName: string; employeeId: string; position: string;
  department: string; startDate: string;
};

const EMPTY: FormState = { employeeName: "", employeeId: "", position: "", department: "", startDate: "" };

export function PPPsList() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todos");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<FormState>>({});

  const { data = [], isLoading, refetch } = trpc.ppps.list.useQuery();
  const createMutation = trpc.ppps.create.useMutation({ onSuccess: () => { setShowModal(false); setForm(EMPTY); refetch(); } });
  const deleteMutation = trpc.ppps.delete.useMutation({ onSuccess: () => refetch() });

  const filtered = data.filter(p => {
    const q = search.toLowerCase();
    const match = p.employeeName?.toLowerCase().includes(q) || p.position?.toLowerCase().includes(q) || p.department?.toLowerCase().includes(q);
    const matchFilter = filter === "todos" || p.status === filter;
    return match && matchFilter;
  });

  const validate = () => {
    const e: Partial<FormState> = {};
    if (!form.employeeName.trim()) e.employeeName = "Obrigatório";
    if (!form.employeeId.trim()) e.employeeId = "Obrigatório";
    if (!form.startDate) e.startDate = "Obrigatório";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    createMutation.mutate(form);
  };

  const f = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [k]: e.target.value }));
    setErrors(prev => ({ ...prev, [k]: undefined }));
  };

  return (
    <MainLayout title="PPPs">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`}</style>
      <div className="p-5 lg:p-7 space-y-5" style={{ fontFamily: "'Sora', sans-serif" }}>

        <DarkPageHeader
          title="Perfil Profissiográfico Previdenciário"
          description="Gestão dos PPPs dos colaboradores"
          icon={FileText} accent="#A78BFA"
          action={
            <DarkButton onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4" /> Novo PPP
            </DarkButton>
          }
        />

        {/* Stats */}
        {!isLoading && (
          <MiniStats items={[
            { label: "Total", value: data.length },
            { label: "Ativos", value: data.filter(p => p.status === "ativo").length, color: "#34D399" },
            { label: "Em Revisão", value: data.filter(p => p.status === "revisao").length, color: "#A78BFA" },
            { label: "Finalizados", value: data.filter(p => p.status === "finalizado").length, color: "#64748B" },
          ]} />
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 max-w-sm"><DarkSearch value={search} onChange={setSearch} placeholder="Buscar colaborador, cargo..." /></div>
          <FilterPills options={FILTERS} value={filter} onChange={setFilter} />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="grid gap-3">{[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}</div>
        ) : filtered.length === 0 ? (
          <DarkEmptyState icon={FileText} accent="#A78BFA"
            title={search || filter !== "todos" ? "Nenhum resultado" : "Nenhum PPP cadastrado"}
            description={search ? "Tente outros termos de busca." : "Cadastre os PPPs dos colaboradores."}
            action={!search && filter === "todos" && (
              <DarkButton onClick={() => setShowModal(true)}><Plus className="w-4 h-4" />Criar primeiro PPP</DarkButton>
            )} />
        ) : (
          <DarkTable headers={HEADERS}>
            {filtered.map((ppp, i) => (
              <DarkTr key={ppp.id}>
                <DarkTd>
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-purple-400 flex-shrink-0"
                      style={{ background: "rgba(167,139,250,0.12)" }}>
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{ppp.employeeName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">Mat. {ppp.employeeId}</p>
                    </div>
                  </motion.div>
                </DarkTd>
                <DarkTd><span className="text-slate-300">{ppp.position || "—"}</span></DarkTd>
                <DarkTd><span className="text-slate-400 text-xs">{ppp.department || "—"}</span></DarkTd>
                <DarkTd>
                  <span className="font-mono text-xs text-slate-400">
                    {ppp.startDate ? new Date(ppp.startDate).toLocaleDateString("pt-BR") : "—"}
                  </span>
                </DarkTd>
                <DarkTd><DarkBadge status={ppp.status || "ativo"} /></DarkTd>
                <DarkTd className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <IconBtn icon={Edit} title="Editar" color="text-slate-500 hover:text-blue-400" />
                    <IconBtn icon={Download} title="Gerar PDF" color="text-slate-500 hover:text-purple-400" />
                    <IconBtn icon={Trash2} title="Excluir" color="text-slate-500 hover:text-red-400"
                      onClick={() => { if (confirm("Excluir este PPP?")) deleteMutation.mutate({ id: ppp.id }); }} />
                  </div>
                </DarkTd>
              </DarkTr>
            ))}
          </DarkTable>
        )}
      </div>

      {/* Create modal */}
      <DarkModal open={showModal} onClose={() => setShowModal(false)} title="Novo PPP">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <DarkField label="Nome do Colaborador" required error={errors.employeeName}>
              <DarkInput value={form.employeeName} onChange={f("employeeName")} placeholder="João da Silva" />
            </DarkField>
            <DarkField label="Matrícula" required error={errors.employeeId}>
              <DarkInput value={form.employeeId} onChange={f("employeeId")} placeholder="001" />
            </DarkField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DarkField label="Cargo">
              <DarkInput value={form.position} onChange={f("position")} placeholder="Operador de Produção" />
            </DarkField>
            <DarkField label="Setor / Departamento">
              <DarkInput value={form.department} onChange={f("department")} placeholder="Produção" />
            </DarkField>
          </div>
          <DarkField label="Data de Admissão" required error={errors.startDate}>
            <DarkInput type="date" value={form.startDate} onChange={f("startDate")} />
          </DarkField>

          <div className="flex justify-end gap-3 pt-2 border-t border-white/6 mt-2">
            <DarkButton variant="ghost" onClick={() => setShowModal(false)}>Cancelar</DarkButton>
            <DarkButton onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Salvando..." : "Criar PPP"}
            </DarkButton>
          </div>
        </div>
      </DarkModal>
    </MainLayout>
  );
}
