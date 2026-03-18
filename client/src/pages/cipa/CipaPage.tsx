import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Plus, Trash2, Calendar, Users, ScrollText, CheckCircle } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { trpc } from "@/lib/trpc";
import { DarkPageHeader, DarkCard, DarkBadge, DarkButton, IconBtn, DarkModal, DarkField, DarkInput, DarkSelect, DarkTextarea, DarkEmptyState, MiniStats, CardSkeleton } from "@/components/shared/DarkUI";

export default function CipaPage() {
  const [mandateModal, setMandateModal] = useState(false);
  const [meetingModal, setMeetingModal] = useState(false);
  const [selectedMandate, setSelectedMandate] = useState<any>(null);
  const [mForm, setMForm] = useState({ startDate:"",endDate:"",cnae:"",employeeCount:"",grau:"",president:"",secretary:"",electedEffective:"0",electedAlternate:"0",designatedEffective:"0",designatedAlternate:"0" });
  const [mtForm, setMtForm] = useState({ mandateId:"",date:"",type:"ordinaria",pauta:"",ata:"",attendees:"",status:"agendada" });

  const { data: mandates = [], isLoading, refetch: refM } = trpc.cipa.listMandates.useQuery();
  const { data: meetings = [], refetch: refMt } = trpc.cipa.allMeetings.useQuery();
  const createMandate = trpc.cipa.createMandate.useMutation({ onSuccess: () => { setMandateModal(false); refM(); } });
  const createMeeting = trpc.cipa.createMeeting.useMutation({ onSuccess: () => { setMeetingModal(false); refMt(); } });
  const deleteMeeting = trpc.cipa.deleteMeeting.useMutation({ onSuccess: () => refMt() });

  const mf = (k: string) => (e: React.ChangeEvent<any>) => setMForm(p => ({ ...p, [k]: e.target.value }));
  const mtf = (k: string) => (e: React.ChangeEvent<any>) => setMtForm(p => ({ ...p, [k]: e.target.value }));

  const activeMandate = mandates.find(m => m.status === "ativa");
  const nextMeeting = meetings.filter(m => m.status === "agendada").sort((a,b) => a.date.localeCompare(b.date))[0];

  return (
    <MainLayout title="CIPA">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`}</style>
      <div className="p-5 lg:p-7 space-y-5" style={{ fontFamily: "'Sora', sans-serif" }}>
        <DarkPageHeader title="CIPA — Gestão Completa" description="Comissão Interna de Prevenção de Acidentes (NR-05)"
          icon={Shield} accent="#EC4899"
          action={<div className="flex gap-2">
            <DarkButton variant="ghost" onClick={()=>{if(activeMandate){setMtForm(p=>({...p,mandateId:String(activeMandate.id)}));setMeetingModal(true);}else alert("Crie um mandato ativo primeiro.")}}>
              <Calendar className="w-4 h-4"/>Nova Reunião
            </DarkButton>
            <DarkButton onClick={()=>setMandateModal(true)}><Plus className="w-4 h-4"/>Novo Mandato</DarkButton>
          </div>}
        />
        <MiniStats items={[
          { label: "Mandatos", value: mandates.length },
          { label: "Reuniões", value: meetings.length, color:"#60A5FA" },
          { label: "Agendadas", value: meetings.filter(m=>m.status==="agendada").length, color:"#F59E0B" },
          { label: "Realizadas", value: meetings.filter(m=>m.status==="realizada").length, color:"#34D399" },
        ]}/>

        {nextMeeting && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}}
            className="flex items-center gap-3 p-4 rounded-xl border"
            style={{background:"rgba(96,165,250,0.08)",borderColor:"rgba(96,165,250,0.2)"}}>
            <Calendar className="w-5 h-5 text-blue-400 flex-shrink-0"/>
            <div>
              <p className="text-sm font-semibold text-blue-300">Próxima reunião: {new Date(nextMeeting.date).toLocaleDateString("pt-BR")}</p>
              <p className="text-xs text-blue-500">{nextMeeting.type === "ordinaria" ? "Reunião Ordinária" : "Reunião Extraordinária"}</p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mandates */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Mandatos</p>
            {isLoading ? [...Array(2)].map((_,i)=><CardSkeleton key={i}/>) :
             mandates.length === 0 ? (
              <DarkEmptyState icon={Shield} accent="#EC4899" title="Nenhum mandato" description="Registre o mandato atual da CIPA."
                action={<DarkButton onClick={()=>setMandateModal(true)}><Plus className="w-4 h-4"/>Novo Mandato</DarkButton>}/>
            ) : mandates.map((m, i) => (
              <motion.div key={m.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}>
                <DarkCard className={`p-4 ${m.status==="ativa"?"border-pink-500/30":""}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-pink-400"/>
                      <p className="font-semibold text-white text-sm">Mandato {new Date(m.startDate).getFullYear()}/{new Date(m.endDate).getFullYear()}</p>
                    </div>
                    <DarkBadge status={m.status||"ativa"}/>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                    {m.president && <div><p className="text-[10px] text-slate-600">Presidente</p><p className="text-slate-300">{m.president}</p></div>}
                    {m.secretary && <div><p className="text-[10px] text-slate-600">Secretário</p><p className="text-slate-300">{m.secretary}</p></div>}
                    {m.grau && <div><p className="text-[10px] text-slate-600">Grau</p><p className="font-mono text-slate-300">{m.grau}</p></div>}
                    {m.cnae && <div><p className="text-[10px] text-slate-600">CNAE</p><p className="font-mono text-slate-300">{m.cnae}</p></div>}
                  </div>
                  <div className="flex gap-3 mt-3 pt-2 border-t border-white/4 text-xs text-slate-500">
                    <span>Titulares: {(m.electedEffective||0)+(m.designatedEffective||0)}</span>
                    <span>Suplentes: {(m.electedAlternate||0)+(m.designatedAlternate||0)}</span>
                  </div>
                </DarkCard>
              </motion.div>
            ))}
          </div>

          {/* Meetings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Reuniões</p>
            </div>
            {meetings.length === 0 ? (
              <DarkEmptyState icon={ScrollText} accent="#EC4899" title="Nenhuma reunião registrada" description="Crie o calendário de reuniões da CIPA."/>
            ) : meetings.map((mt, i) => (
              <motion.div key={mt.id} initial={{opacity:0,x:8}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}}>
                <DarkCard className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-pink-400">{new Date(mt.date).toLocaleDateString("pt-BR")}</span>
                        <DarkBadge status={mt.status||"agendada"}/>
                        <span className="text-[10px] text-slate-500">{mt.type==="ordinaria"?"Ordinária":"Extraordinária"}</span>
                      </div>
                      {mt.pauta && <p className="text-xs text-slate-400 line-clamp-2">Pauta: {mt.pauta}</p>}
                      {mt.attendees && <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1"><Users className="w-3 h-3"/>{mt.attendees}</p>}
                    </div>
                    <div className="flex gap-1 items-center flex-shrink-0">
                      {mt.status === "agendada" && (
                        <DarkButton size="sm" variant="ghost" onClick={()=>{}}>
                          <CheckCircle className="w-3 h-3"/>Realizada
                        </DarkButton>
                      )}
                      <IconBtn icon={Trash2} color="text-slate-500 hover:text-red-400" onClick={()=>{if(confirm("Excluir?"))deleteMeeting.mutate({id:mt.id});}}/>
                    </div>
                  </div>
                </DarkCard>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <DarkModal open={mandateModal} onClose={()=>setMandateModal(false)} title="Novo Mandato CIPA" width="max-w-xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <DarkField label="Início do Mandato" required><DarkInput type="date" value={mForm.startDate} onChange={mf("startDate")}/></DarkField>
            <DarkField label="Fim do Mandato" required><DarkInput type="date" value={mForm.endDate} onChange={mf("endDate")}/></DarkField>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <DarkField label="CNAE"><DarkInput value={mForm.cnae} onChange={mf("cnae")} placeholder="6201-5"/></DarkField>
            <DarkField label="Nº Funcionários"><DarkInput type="number" value={mForm.employeeCount} onChange={mf("employeeCount")} placeholder="50"/></DarkField>
            <DarkField label="Grau"><DarkInput value={mForm.grau} onChange={mf("grau")} placeholder="C-3"/></DarkField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DarkField label="Presidente"><DarkInput value={mForm.president} onChange={mf("president")} placeholder="Nome"/></DarkField>
            <DarkField label="Secretário"><DarkInput value={mForm.secretary} onChange={mf("secretary")} placeholder="Nome"/></DarkField>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <DarkField label="Titulares Eleitos"><DarkInput type="number" value={mForm.electedEffective} onChange={mf("electedEffective")} placeholder="0"/></DarkField>
            <DarkField label="Suplentes Eleitos"><DarkInput type="number" value={mForm.electedAlternate} onChange={mf("electedAlternate")} placeholder="0"/></DarkField>
            <DarkField label="Titulares Desig."><DarkInput type="number" value={mForm.designatedEffective} onChange={mf("designatedEffective")} placeholder="0"/></DarkField>
            <DarkField label="Suplentes Desig."><DarkInput type="number" value={mForm.designatedAlternate} onChange={mf("designatedAlternate")} placeholder="0"/></DarkField>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-white/6">
            <DarkButton variant="ghost" onClick={()=>setMandateModal(false)}>Cancelar</DarkButton>
            <DarkButton onClick={()=>mForm.startDate&&mForm.endDate&&createMandate.mutate({...mForm,employeeCount:parseInt(mForm.employeeCount)||undefined,electedEffective:parseInt(mForm.electedEffective)||0,electedAlternate:parseInt(mForm.electedAlternate)||0,designatedEffective:parseInt(mForm.designatedEffective)||0,designatedAlternate:parseInt(mForm.designatedAlternate)||0} as any)} disabled={createMandate.isPending}>
              {createMandate.isPending?"Salvando...":"Criar Mandato"}
            </DarkButton>
          </div>
        </div>
      </DarkModal>

      <DarkModal open={meetingModal} onClose={()=>setMeetingModal(false)} title="Nova Reunião CIPA" width="max-w-xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <DarkField label="Data" required><DarkInput type="date" value={mtForm.date} onChange={mtf("date")}/></DarkField>
            <DarkField label="Tipo">
              <DarkSelect value={mtForm.type} onChange={mtf("type")}>
                <option value="ordinaria">Ordinária</option>
                <option value="extraordinaria">Extraordinária</option>
              </DarkSelect>
            </DarkField>
          </div>
          <DarkField label="Pauta"><DarkTextarea value={mtForm.pauta} onChange={mtf("pauta")} rows={3} placeholder="Pontos de pauta da reunião..."/></DarkField>
          <DarkField label="Participantes"><DarkInput value={mtForm.attendees} onChange={mtf("attendees")} placeholder="Nome1, Nome2, Nome3..."/></DarkField>
          <DarkField label="Ata"><DarkTextarea value={mtForm.ata} onChange={mtf("ata")} rows={4} placeholder="Texto da ata (pode preencher após a reunião)..."/></DarkField>
          <div className="flex justify-end gap-3 pt-2 border-t border-white/6">
            <DarkButton variant="ghost" onClick={()=>setMeetingModal(false)}>Cancelar</DarkButton>
            <DarkButton onClick={()=>mtForm.date&&createMeeting.mutate({...mtForm,mandateId:parseInt(mtForm.mandateId)||activeMandate?.id||0} as any)} disabled={createMeeting.isPending}>
              {createMeeting.isPending?"Salvando...":"Agendar Reunião"}
            </DarkButton>
          </div>
        </div>
      </DarkModal>
    </MainLayout>
  );
}
