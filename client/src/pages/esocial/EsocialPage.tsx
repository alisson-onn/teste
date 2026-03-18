import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Plus, RefreshCw, CheckCircle, XCircle, Clock, AlertCircle, FileCode, User } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { trpc } from "@/lib/trpc";
import { DarkPageHeader, DarkCard, DarkSearch, FilterPills, DarkButton, IconBtn, DarkModal, DarkField, DarkInput, DarkSelect, DarkEmptyState, MiniStats, Skeleton } from "@/components/shared/DarkUI";

const EVENT_CFG: Record<string, { label: string; color: string; desc: string }> = {
  "S-2210": { label: "S-2210", color: "#EF4444", desc: "Comunicação de Acidente de Trabalho (CAT)" },
  "S-2220": { label: "S-2220", color: "#3B82F6", desc: "Monitoramento de Saúde do Trabalhador" },
  "S-2240": { label: "S-2240", color: "#8B5CF6", desc: "Condições Ambientais do Trabalho — Agentes Nocivos" },
};
const STATUS_CFG: Record<string, { color: string; icon: any; label: string }> = {
  pendente:   { color: "#F59E0B", icon: Clock, label: "Pendente" },
  enviado:    { color: "#60A5FA", icon: Send, label: "Enviado" },
  processado: { color: "#34D399", icon: CheckCircle, label: "Processado" },
  erro:       { color: "#EF4444", icon: XCircle, label: "Erro" },
  cancelado:  { color: "#64748B", icon: AlertCircle, label: "Cancelado" },
};
const FILTERS = [
  { label: "Todos", value: "todos" }, { label: "S-2210", value: "S-2210" },
  { label: "S-2220", value: "S-2220" }, { label: "S-2240", value: "S-2240" },
];

type F = { eventType: "S-2210"|"S-2220"|"S-2240"; employeeId: string; employeeName: string; period: string; referenceType: string; referenceId: string };
const E: F = { eventType: "S-2210", employeeId: "", employeeName: "", period: new Date().toISOString().slice(0,7), referenceType: "", referenceId: "" };

export default function EsocialPage() {
  const [filter, setFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<F>(E);

  const { data = [], isLoading, refetch } = trpc.esocial.list.useQuery();
  const { data: stats } = trpc.esocial.stats.useQuery();
  const { data: employees = [] } = trpc.employees.list.useQuery();
  const createMut = trpc.esocial.create.useMutation({ onSuccess: () => { setModal(false); setForm(E); refetch(); } });
  const updateMut = trpc.esocial.updateStatus.useMutation({ onSuccess: () => refetch() });
  const deleteMut = trpc.esocial.delete.useMutation({ onSuccess: () => refetch() });

  const filtered = data.filter(e => {
    const q = search.toLowerCase();
    return (e.employeeName?.toLowerCase().includes(q) || e.eventType?.includes(q) || e.receiptNumber?.includes(q))
      && (filter === "todos" || e.eventType === filter);
  });

  const f = (k: keyof F) => (e: React.ChangeEvent<any>) => {
    const v = e.target.value;
    const upd: Partial<F> = { [k]: v };
    if (k === "employeeId") { const emp = employees.find(emp => emp.id.toString() === v); if (emp) upd.employeeName = emp.name; }
    setForm(p => ({ ...p, ...upd }));
  };

  return (
    <MainLayout title="eSocial">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`}</style>
      <div className="p-5 lg:p-7 space-y-5" style={{ fontFamily: "'Sora', sans-serif" }}>
        <DarkPageHeader title="eSocial — SST" description="Eventos S-2210, S-2220 e S-2240 para transmissão ao governo"
          icon={Send} accent="#8B5CF6"
          action={<DarkButton onClick={()=>setModal(true)}><Plus className="w-4 h-4"/>Gerar Evento</DarkButton>}
        />

        {/* Info bar */}
        <div className="flex items-center gap-3 p-4 rounded-xl border border-white/6" style={{background:"rgba(139,92,246,0.06)"}}>
          <FileCode className="w-5 h-5 text-purple-400 flex-shrink-0"/>
          <div>
            <p className="text-sm font-medium text-slate-300">Eventos eSocial — Módulo em preparação</p>
            <p className="text-xs text-slate-500 mt-0.5">Geração do XML e transmissão para o eSocial serão habilitados com integração completa. Aqui você gerencia e rastreia todos os eventos SST.</p>
          </div>
        </div>

        <MiniStats items={[
          { label: "Total", value: stats?.total ?? 0 },
          { label: "Pendentes", value: stats?.pendente ?? 0, color: "#F59E0B" },
          { label: "Enviados", value: stats?.enviado ?? 0, color: "#60A5FA" },
          { label: "Com Erro", value: stats?.erro ?? 0, color: "#EF4444" },
        ]}/>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 max-w-sm"><DarkSearch value={search} onChange={setSearch} placeholder="Colaborador, recibo..."/></div>
          <FilterPills options={FILTERS} value={filter} onChange={setFilter}/>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(3)].map((_,i)=><Skeleton key={i} className="h-24"/>)}</div>
        ) : filtered.length === 0 ? (
          <DarkEmptyState icon={Send} accent="#8B5CF6" title="Nenhum evento eSocial" description="Gere eventos SST para controle e transmissão."
            action={!search&&filter==="todos"&&<DarkButton onClick={()=>setModal(true)}><Plus className="w-4 h-4"/>Gerar Evento</DarkButton>}/>
        ) : (
          <div className="space-y-3">
            {filtered.map((ev, i) => {
              const evCfg = EVENT_CFG[ev.eventType ?? "S-2210"];
              const stCfg = STATUS_CFG[ev.status ?? "pendente"];
              const StIcon = stCfg.icon;
              return (
                <motion.div key={ev.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}>
                  <DarkCard className="p-4 hover:border-white/10">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-center"
                        style={{background:`${evCfg.color}15`,border:`1px solid ${evCfg.color}30`}}>
                        <p className="text-[10px] font-bold leading-tight" style={{color:evCfg.color}}>{evCfg.label}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-medium text-white">{evCfg.desc}</p>
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                            style={{color:stCfg.color,background:`${stCfg.color}15`}}>
                            <StIcon className="w-3 h-3"/>{stCfg.label}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500">
                          {ev.employeeName && <span className="flex items-center gap-1"><User className="w-3 h-3"/>{ev.employeeName}</span>}
                          {ev.period && <span className="font-mono">Competência: {ev.period}</span>}
                          {ev.receiptNumber && <span className="font-mono text-emerald-400">Recibo: {ev.receiptNumber}</span>}
                          <span className="font-mono">{new Date(ev.createdAt).toLocaleDateString("pt-BR")}</span>
                        </div>
                        {ev.errorMessage && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><XCircle className="w-3 h-3"/>{ev.errorMessage}</p>}
                      </div>
                      <div className="flex gap-2 flex-shrink-0 flex-col sm:flex-row">
                        {ev.status === "pendente" && (
                          <DarkButton size="sm" onClick={() => updateMut.mutate({ id: ev.id, status: "enviado", receiptNumber: `REC-${Date.now()}` })}>
                            <Send className="w-3 h-3"/>Marcar Enviado
                          </DarkButton>
                        )}
                        {ev.status === "enviado" && (
                          <DarkButton size="sm" variant="ghost" onClick={() => updateMut.mutate({ id: ev.id, status: "processado" })}>
                            <CheckCircle className="w-3 h-3"/>Processado
                          </DarkButton>
                        )}
                        <IconBtn icon={XCircle} color="text-slate-500 hover:text-red-400" onClick={()=>{if(confirm("Cancelar/Excluir evento?"))deleteMut.mutate({id:ev.id});}}/>
                      </div>
                    </div>
                  </DarkCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <DarkModal open={modal} onClose={()=>setModal(false)} title="Gerar Evento eSocial">
        <div className="space-y-4">
          <DarkField label="Tipo de Evento" required>
            <div className="grid grid-cols-3 gap-2">
              {(["S-2210","S-2220","S-2240"] as const).map(ev => {
                const cfg = EVENT_CFG[ev];
                return (
                  <button key={ev} onClick={() => setForm(p => ({ ...p, eventType: ev }))}
                    className={`p-3 rounded-xl border text-left transition-all ${form.eventType===ev?"text-white":"border-white/10 text-slate-500 hover:border-white/20"}`}
                    style={form.eventType===ev?{background:`${cfg.color}15`,borderColor:cfg.color}:{}}>
                    <p className="font-bold text-sm font-mono" style={{color:cfg.color}}>{ev}</p>
                    <p className="text-[10px] mt-0.5 text-slate-500 leading-tight">{cfg.desc}</p>
                  </button>
                );
              })}
            </div>
          </DarkField>
          <DarkField label="Colaborador">
            <DarkSelect value={form.employeeId} onChange={f("employeeId")}>
              <option value="">Selecionar funcionário</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </DarkSelect>
          </DarkField>
          <DarkField label="Competência (Ano-Mês)">
            <DarkInput type="month" value={form.period} onChange={f("period")}/>
          </DarkField>
          <div className="grid grid-cols-2 gap-4">
            <DarkField label="Tipo de Referência">
              <DarkSelect value={form.referenceType} onChange={f("referenceType")}>
                <option value="">Selecionar</option>
                <option value="acidente">Acidente</option>
                <option value="exame">Exame/ASO</option>
                <option value="risco">Agente de Risco</option>
              </DarkSelect>
            </DarkField>
            <DarkField label="ID Referência">
              <DarkInput value={form.referenceId} onChange={f("referenceId")} placeholder="Ex: 42" type="number"/>
            </DarkField>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-white/6">
            <DarkButton variant="ghost" onClick={()=>setModal(false)}>Cancelar</DarkButton>
            <DarkButton onClick={()=>createMut.mutate({eventType:form.eventType,employeeId:form.employeeId?parseInt(form.employeeId):undefined,employeeName:form.employeeName||undefined,period:form.period||undefined,referenceType:form.referenceType||undefined,referenceId:form.referenceId?parseInt(form.referenceId):undefined})} disabled={createMut.isPending}>
              {createMut.isPending?"Gerando...":"Gerar Evento"}
            </DarkButton>
          </div>
        </div>
      </DarkModal>
    </MainLayout>
  );
}
