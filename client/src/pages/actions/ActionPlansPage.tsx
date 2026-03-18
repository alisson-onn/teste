import { useState } from "react";
import { motion } from "framer-motion";
import { Target, Plus, Trash2, CheckCircle, Clock, AlertCircle, Edit } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { trpc } from "@/lib/trpc";
import { DarkPageHeader, DarkCard, DarkBadge, DarkSearch, FilterPills, DarkButton, IconBtn, DarkModal, DarkField, DarkInput, DarkSelect, DarkTextarea, DarkEmptyState, MiniStats, CardSkeleton } from "@/components/shared/DarkUI";
import { ExportButton, generateCSV, downloadCSV } from "@/components/shared/ExportButton";

const PRIO_COLOR: Record<string, string> = { baixa:"#64748B", media:"#60A5FA", alta:"#F59E0B", critica:"#EF4444" };
const STATUS_ICON: Record<string, any> = { aberta: Clock, em_andamento: Clock, concluida: CheckCircle, cancelada: AlertCircle, atrasada: AlertCircle };
const FILTERS = [
  { label: "Todas", value: "todos" }, { label: "Abertas", value: "aberta" },
  { label: "Em Andamento", value: "em_andamento" }, { label: "Concluídas", value: "concluida" },
  { label: "Atrasadas", value: "atrasada" },
];

type F = { what:string; why:string; who:string; when:string; where:string; how:string; howMuch:string; deadline:string; responsible:string; priority:string; originType:string };
const E:F = { what:"",why:"",who:"",when:"",where:"",how:"",howMuch:"",deadline:"",responsible:"",priority:"media",originType:"manual" };

export default function ActionPlansPage() {
  const [filter, setFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<F>(E);

  const { data = [], isLoading, refetch } = trpc.actionPlans.list.useQuery();
  const createMut = trpc.actionPlans.create.useMutation({ onSuccess: () => { setModal(false); setForm(E); refetch(); } });
  const updateMut = trpc.actionPlans.update.useMutation({ onSuccess: () => refetch() });
  const deleteMut = trpc.actionPlans.delete.useMutation({ onSuccess: () => refetch() });

  const today = new Date().toISOString().split("T")[0];
  const enriched = data.map(a => ({
    ...a,
    effectiveStatus: a.status === "aberta" && a.deadline && a.deadline < today ? "atrasada" : a.status,
  }));

  const filtered = enriched.filter(a => {
    const q = search.toLowerCase();
    return (a.what?.toLowerCase().includes(q) || a.responsible?.toLowerCase().includes(q))
      && (filter === "todos" || a.effectiveStatus === filter);
  });

  const f = (k: keyof F) => (e: React.ChangeEvent<any>) => setForm(p => ({ ...p, [k]: e.target.value }));
  const handleExport = () => {
    const csv = generateCSV(["O QUÊ","POR QUÊ","QUEM","QUANDO","ONDE","COMO","QUANTO","Prazo","Status","Prioridade"],
      data.map(a => [a.what,a.why??'',a.who??'',a.when??'',a.where??'',a.how??'',a.howMuch??'',a.deadline??'',a.status??'',a.priority??'']));
    downloadCSV(csv, `plano_acao_${new Date().toLocaleDateString("pt-BR").replace(/\//g,"-")}.csv`);
  };

  const atrasadas = enriched.filter(a => a.effectiveStatus === "atrasada").length;

  return (
    <MainLayout title="Plano de Ação">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`}</style>
      <div className="p-5 lg:p-7 space-y-5" style={{ fontFamily: "'Sora', sans-serif" }}>
        <DarkPageHeader title="Plano de Ação 5W2H" description="Controle de ações corretivas e preventivas"
          icon={Target} accent="#22D3EE"
          action={<div className="flex gap-2"><ExportButton onExportCSV={handleExport}/><DarkButton onClick={()=>setModal(true)}><Plus className="w-4 h-4"/>Nova Ação</DarkButton></div>}
        />
        {!isLoading && (
          <MiniStats items={[
            { label: "Total", value: data.length },
            { label: "Abertas", value: data.filter(a=>a.status==="aberta").length, color:"#60A5FA" },
            { label: "Atrasadas", value: atrasadas, color:"#EF4444" },
            { label: "Concluídas", value: data.filter(a=>a.status==="concluida").length, color:"#34D399" },
          ]}/>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 max-w-sm"><DarkSearch value={search} onChange={setSearch} placeholder="O quê, responsável..."/></div>
          <FilterPills options={FILTERS} value={filter} onChange={setFilter}/>
        </div>

        {isLoading ? <div className="space-y-3">{[...Array(3)].map((_,i)=><CardSkeleton key={i}/>)}</div>
        : filtered.length === 0 ? (
          <DarkEmptyState icon={Target} accent="#22D3EE" title="Nenhuma ação encontrada"
            description="Crie ações do plano 5W2H vinculadas a inspeções e acidentes."
            action={!search&&filter==="todos"&&<DarkButton onClick={()=>setModal(true)}><Plus className="w-4 h-4"/>Criar ação</DarkButton>}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((a, i) => {
              const StatusIcon = STATUS_ICON[a.effectiveStatus ?? "aberta"];
              const prioColor = PRIO_COLOR[a.priority ?? "media"];
              const isOverdue = a.effectiveStatus === "atrasada";
              return (
                <motion.div key={a.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}>
                  <DarkCard className={`p-5 hover:border-white/10 transition-all ${isOverdue?"border-red-500/30":""}`}>
                    <div className="flex items-start gap-4">
                      <div className="w-2 h-full flex-shrink-0 rounded-full" style={{background:prioColor,minHeight:"40px"}}/>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <p className="font-semibold text-white text-sm leading-snug flex-1">{a.what}</p>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{color:prioColor,background:`${prioColor}15`}}>
                              {a.priority?.toUpperCase()}
                            </span>
                            <DarkBadge status={a.effectiveStatus ?? "aberta"}/>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                          {[
                            { label:"Responsável", value:a.responsible },
                            { label:"Prazo", value:a.deadline?new Date(a.deadline).toLocaleDateString("pt-BR"):undefined },
                            { label:"Origem", value:a.originType },
                            { label:"Onde", value:a.where },
                          ].filter(i=>i.value).map(item=>(
                            <div key={item.label}>
                              <p className="text-[10px] text-slate-600 uppercase tracking-wide">{item.label}</p>
                              <p className={`text-xs mt-0.5 ${item.label==="Prazo"&&isOverdue?"text-red-400 font-bold":"text-slate-300"}`}>{item.value}</p>
                            </div>
                          ))}
                        </div>
                        {a.why && <p className="text-xs text-slate-500 mb-3">Por quê: {a.why}</p>}
                        <div className="flex items-center gap-2">
                          {a.status !== "concluida" && (
                            <DarkButton size="sm" onClick={() => updateMut.mutate({ id: a.id, status: "concluida", completedAt: new Date().toISOString() })}>
                              <CheckCircle className="w-3 h-3"/>Concluir
                            </DarkButton>
                          )}
                          {a.status === "aberta" && (
                            <DarkButton size="sm" variant="ghost" onClick={() => updateMut.mutate({ id: a.id, status: "em_andamento" })}>
                              Iniciar
                            </DarkButton>
                          )}
                          <IconBtn icon={Trash2} color="text-slate-500 hover:text-red-400" onClick={()=>{if(confirm("Excluir?"))deleteMut.mutate({id:a.id});}}/>
                        </div>
                      </div>
                    </div>
                  </DarkCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <DarkModal open={modal} onClose={()=>setModal(false)} title="Nova Ação 5W2H" width="max-w-2xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 p-4 rounded-xl border border-white/6" style={{background:"rgba(255,255,255,0.02)"}}>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">5W — O Plano</p>
            <DarkField label="O QUÊ? (What)" required><DarkInput value={form.what} onChange={f("what")} placeholder="Qual ação deve ser executada?"/></DarkField>
            <DarkField label="POR QUÊ? (Why)"><DarkInput value={form.why} onChange={f("why")} placeholder="Qual o motivo/objetivo?"/></DarkField>
            <div className="grid grid-cols-2 gap-3">
              <DarkField label="QUEM? (Who)"><DarkInput value={form.who} onChange={f("who")} placeholder="Responsável"/></DarkField>
              <DarkField label="QUANDO? (When)"><DarkInput value={form.when} onChange={f("when")} placeholder="Período/data"/></DarkField>
            </div>
            <DarkField label="ONDE? (Where)"><DarkInput value={form.where} onChange={f("where")} placeholder="Local de execução"/></DarkField>
          </div>
          <div className="grid grid-cols-1 gap-3 p-4 rounded-xl border border-white/6" style={{background:"rgba(255,255,255,0.02)"}}>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">2H — A Execução</p>
            <DarkField label="COMO? (How)"><DarkTextarea value={form.how} onChange={f("how")} rows={2} placeholder="Método de execução..."/></DarkField>
            <DarkField label="QUANTO? (How Much)"><DarkInput value={form.howMuch} onChange={f("howMuch")} placeholder="Custo estimado"/></DarkField>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <DarkField label="Prazo"><DarkInput type="date" value={form.deadline} onChange={f("deadline")}/></DarkField>
            <DarkField label="Responsável"><DarkInput value={form.responsible} onChange={f("responsible")} placeholder="Nome"/></DarkField>
            <DarkField label="Prioridade">
              <DarkSelect value={form.priority} onChange={f("priority")}>
                <option value="baixa">Baixa</option><option value="media">Média</option>
                <option value="alta">Alta</option><option value="critica">Crítica</option>
              </DarkSelect>
            </DarkField>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-white/6">
            <DarkButton variant="ghost" onClick={()=>setModal(false)}>Cancelar</DarkButton>
            <DarkButton onClick={()=>form.what&&createMut.mutate(form as any)} disabled={createMut.isPending}>
              {createMut.isPending?"Salvando...":"Criar Ação"}
            </DarkButton>
          </div>
        </div>
      </DarkModal>
    </MainLayout>
  );
}
