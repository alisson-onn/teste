import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Plus, Trash2, FileText, Layers, Calendar, User, Award } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { trpc } from "@/lib/trpc";
import { DarkPageHeader, DarkCard, DarkBadge, DarkButton, IconBtn, DarkModal, DarkField, DarkInput, DarkSelect, DarkTextarea, DarkEmptyState, MiniStats, CardSkeleton, DarkTable, DarkTr, DarkTd } from "@/components/shared/DarkUI";

export default function PgrPage() {
  const [tab, setTab] = useState(0);
  const [pgrModal, setPgrModal] = useState(false);
  const [ltcatModal, setLtcatModal] = useState(false);
  const [pgrForm, setPgrForm] = useState({ company:"",cnpj:"",version:"1.0",elaborationDate:"",nextRevisionDate:"",responsibleTechnician:"",crea:"",scope:"",methodology:"" });
  const [ltcatForm, setLtcatForm] = useState({ gheId:"",gheName:"",agent:"",agentType:"fisico",exposureLevel:"",limitValue:"",techMethod:"",aposentadoriaEspecial:false,epcEffective:false,observations:"" });

  const { data: pgrs = [], isLoading: pgrLoad, refetch: refetchPgr } = trpc.pgr.list.useQuery();
  const { data: ltcats = [], isLoading: ltcLoad, refetch: refetchLtcat } = trpc.ltcat.list.useQuery();
  const { data: ghes = [] } = trpc.ghes.list.useQuery();
  const createPgr = trpc.pgr.create.useMutation({ onSuccess: () => { setPgrModal(false); refetchPgr(); } });
  const deletePgr = trpc.pgr.delete.useMutation({ onSuccess: () => refetchPgr() });
  const createLtcat = trpc.ltcat.create.useMutation({ onSuccess: () => { setLtcatModal(false); refetchLtcat(); } });
  const deleteLtcat = trpc.ltcat.delete.useMutation({ onSuccess: () => refetchLtcat() });

  const pf = (k: string) => (e: React.ChangeEvent<any>) => setPgrForm(p => ({ ...p, [k]: e.target.value }));
  const lf = (k: string) => (e: React.ChangeEvent<any>) => setLtcatForm(p => ({ ...p, [k]: e.target.type==="checkbox"?e.target.checked:e.target.value }));

  const apoCount = ltcats.filter(l => l.aposentadoriaEspecial).length;

  return (
    <MainLayout title="PGR / LTCAT">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`}</style>
      <div className="p-5 lg:p-7 space-y-5" style={{ fontFamily: "'Sora', sans-serif" }}>
        <DarkPageHeader title="PGR / LTCAT" description="Programa de Gerenciamento de Riscos e Laudo de Condições Especiais (NR-01 / IN 128)"
          icon={BookOpen} accent="#8B5CF6"
          action={<DarkButton onClick={() => tab===0?setPgrModal(true):setLtcatModal(true)}><Plus className="w-4 h-4"/>{tab===0?"Novo PGR":"Novo Agente LTCAT"}</DarkButton>}
        />
        <MiniStats items={[
          { label: "PGRs", value: pgrs.length },
          { label: "Vigentes", value: pgrs.filter(p=>p.status==="vigente").length, color:"#34D399" },
          { label: "Agentes LTCAT", value: ltcats.length, color:"#A78BFA" },
          { label: "Apos. Especial", value: apoCount, color:"#F59E0B" },
        ]}/>

        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{background:"rgba(255,255,255,0.04)"}}>
          {["PGR","LTCAT"].map((t,i)=>(
            <button key={i} onClick={()=>setTab(i)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${tab===i?"bg-purple-600 text-white":"text-slate-400 hover:text-white"}`}>{t}</button>
          ))}
        </div>

        {tab === 0 && (
          pgrLoad ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[...Array(2)].map((_,i)=><CardSkeleton key={i}/>)}</div>
          : pgrs.length === 0 ? (
            <DarkEmptyState icon={BookOpen} accent="#8B5CF6" title="Nenhum PGR cadastrado"
              description="Cadastre o Programa de Gerenciamento de Riscos da empresa."
              action={<DarkButton onClick={()=>setPgrModal(true)}><Plus className="w-4 h-4"/>Criar PGR</DarkButton>}/>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pgrs.map((pgr, i) => (
                <motion.div key={pgr.id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}>
                  <DarkCard className="overflow-hidden hover:border-white/10">
                    <div className="h-0.5" style={{background:pgr.status==="vigente"?"#8B5CF6":pgr.status==="expirado"?"#EF4444":"#F59E0B"}}/>
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:"rgba(139,92,246,0.12)"}}>
                          <BookOpen className="w-4 h-4 text-purple-400"/>
                        </div>
                        <DarkBadge status={pgr.status||"vigente"}/>
                      </div>
                      <h3 className="font-semibold text-white text-sm mb-1">{pgr.company}</h3>
                      {pgr.cnpj && <p className="text-xs text-slate-500 font-mono mb-3">CNPJ: {pgr.cnpj}</p>}
                      <div className="space-y-1.5">
                        {pgr.version && <div className="flex items-center gap-2 text-xs text-slate-500"><Layers className="w-3.5 h-3.5"/>Versão {pgr.version}</div>}
                        {pgr.elaborationDate && <div className="flex items-center gap-2 text-xs text-slate-500"><Calendar className="w-3.5 h-3.5"/>Elaboração: {new Date(pgr.elaborationDate).toLocaleDateString("pt-BR")}</div>}
                        {pgr.nextRevisionDate && <div className="flex items-center gap-2 text-xs text-slate-500"><Calendar className="w-3.5 h-3.5"/>Revisão: {new Date(pgr.nextRevisionDate).toLocaleDateString("pt-BR")}</div>}
                        {pgr.responsibleTechnician && <div className="flex items-center gap-2 text-xs text-slate-500"><User className="w-3.5 h-3.5"/>{pgr.responsibleTechnician}</div>}
                      </div>
                    </div>
                    <div className="flex justify-end gap-1 px-4 py-2.5 border-t border-white/4">
                      <IconBtn icon={Trash2} color="text-slate-500 hover:text-red-400" onClick={()=>{if(confirm("Excluir?"))deletePgr.mutate({id:pgr.id});}}/>
                    </div>
                  </DarkCard>
                </motion.div>
              ))}
            </div>
          )
        )}

        {tab === 1 && (
          ltcats.length === 0 ? (
            <DarkEmptyState icon={FileText} accent="#8B5CF6" title="Nenhum agente LTCAT"
              description="Cadastre agentes geradores de aposentadoria especial."
              action={<DarkButton onClick={()=>setLtcatModal(true)}><Plus className="w-4 h-4"/>Adicionar Agente</DarkButton>}/>
          ) : (
            <DarkTable headers={["GHE","Agente","Tipo","Nível","Limite","Apos. Especial",""]}>
              {ltcats.map((l, i) => (
                <DarkTr key={l.id}>
                  <DarkTd><span className="text-slate-300 text-sm">{l.gheName||`GHE #${l.gheId}`}</span></DarkTd>
                  <DarkTd><span className="font-medium text-white text-sm">{l.agent}</span></DarkTd>
                  <DarkTd><span className="text-xs text-slate-400">{l.agentType}</span></DarkTd>
                  <DarkTd><span className="font-mono text-xs text-slate-400">{l.exposureLevel||"—"}</span></DarkTd>
                  <DarkTd><span className="font-mono text-xs text-slate-400">{l.limitValue||"—"}</span></DarkTd>
                  <DarkTd>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${l.aposentadoriaEspecial?"text-amber-400 bg-amber-400/10":"text-slate-600 bg-white/4"}`}>
                      {l.aposentadoriaEspecial?"Sim":"Não"}
                    </span>
                  </DarkTd>
                  <DarkTd className="text-right">
                    <IconBtn icon={Trash2} color="text-slate-500 hover:text-red-400" onClick={()=>{if(confirm("Excluir?"))deleteLtcat.mutate({id:l.id});}}/>
                  </DarkTd>
                </DarkTr>
              ))}
            </DarkTable>
          )
        )}
      </div>

      <DarkModal open={pgrModal} onClose={()=>setPgrModal(false)} title="Novo PGR" width="max-w-xl">
        <div className="space-y-4">
          <DarkField label="Empresa" required><DarkInput value={pgrForm.company} onChange={pf("company")} placeholder="Razão social"/></DarkField>
          <div className="grid grid-cols-2 gap-4">
            <DarkField label="CNPJ"><DarkInput value={pgrForm.cnpj} onChange={pf("cnpj")} placeholder="00.000.000/0001-00"/></DarkField>
            <DarkField label="Versão"><DarkInput value={pgrForm.version} onChange={pf("version")} placeholder="1.0"/></DarkField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DarkField label="Elaboração"><DarkInput type="date" value={pgrForm.elaborationDate} onChange={pf("elaborationDate")}/></DarkField>
            <DarkField label="Próxima Revisão"><DarkInput type="date" value={pgrForm.nextRevisionDate} onChange={pf("nextRevisionDate")}/></DarkField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DarkField label="Responsável Técnico"><DarkInput value={pgrForm.responsibleTechnician} onChange={pf("responsibleTechnician")} placeholder="Nome"/></DarkField>
            <DarkField label="CREA/CFT"><DarkInput value={pgrForm.crea} onChange={pf("crea")} placeholder="CREA/PR 000000"/></DarkField>
          </div>
          <DarkField label="Escopo"><DarkTextarea value={pgrForm.scope} onChange={pf("scope")} rows={2} placeholder="Descrição do escopo de aplicação..."/></DarkField>
          <div className="flex justify-end gap-3 pt-2 border-t border-white/6">
            <DarkButton variant="ghost" onClick={()=>setPgrModal(false)}>Cancelar</DarkButton>
            <DarkButton onClick={()=>pgrForm.company&&createPgr.mutate(pgrForm as any)} disabled={createPgr.isPending}>
              {createPgr.isPending?"Salvando...":"Criar PGR"}
            </DarkButton>
          </div>
        </div>
      </DarkModal>

      <DarkModal open={ltcatModal} onClose={()=>setLtcatModal(false)} title="Novo Agente LTCAT" width="max-w-xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <DarkField label="GHE" required>
              <DarkSelect value={ltcatForm.gheId} onChange={lf("gheId")}>
                <option value="">Selecionar GHE</option>
                {ghes.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
              </DarkSelect>
            </DarkField>
            <DarkField label="Tipo de Agente">
              <DarkSelect value={ltcatForm.agentType} onChange={lf("agentType")}>
                <option value="fisico">Físico</option><option value="quimico">Químico</option>
                <option value="biologico">Biológico</option>
              </DarkSelect>
            </DarkField>
          </div>
          <DarkField label="Agente Nocivo" required><DarkInput value={ltcatForm.agent} onChange={lf("agent")} placeholder="Ruído, Silício, Arsênio..."/></DarkField>
          <div className="grid grid-cols-2 gap-4">
            <DarkField label="Nível de Exposição"><DarkInput value={ltcatForm.exposureLevel} onChange={lf("exposureLevel")} placeholder="Ex: 89 dB(A)"/></DarkField>
            <DarkField label="Limite de Tolerância"><DarkInput value={ltcatForm.limitValue} onChange={lf("limitValue")} placeholder="Ex: 85 dB(A)"/></DarkField>
          </div>
          <DarkField label="Metodologia Técnica"><DarkInput value={ltcatForm.techMethod} onChange={lf("techMethod")} placeholder="NHO 01, NR-15, ACGIH..."/></DarkField>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
              <input type="checkbox" checked={ltcatForm.aposentadoriaEspecial} onChange={lf("aposentadoriaEspecial")} className="accent-purple-500"/>
              Gera Aposentadoria Especial
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
              <input type="checkbox" checked={ltcatForm.epcEffective} onChange={lf("epcEffective")} className="accent-blue-500"/>
              EPC Eficaz (neutraliza)
            </label>
          </div>
          <DarkField label="Observações"><DarkTextarea value={ltcatForm.observations} onChange={lf("observations")} rows={2} placeholder="Notas técnicas..."/></DarkField>
          <div className="flex justify-end gap-3 pt-2 border-t border-white/6">
            <DarkButton variant="ghost" onClick={()=>setLtcatModal(false)}>Cancelar</DarkButton>
            <DarkButton onClick={()=>ltcatForm.agent&&createLtcat.mutate({...ltcatForm,gheId:parseInt(ltcatForm.gheId)||0,gheName:ghes.find(g=>g.id.toString()===ltcatForm.gheId)?.name} as any)} disabled={createLtcat.isPending}>
              {createLtcat.isPending?"Salvando...":"Salvar"}
            </DarkButton>
          </div>
        </div>
      </DarkModal>
    </MainLayout>
  );
}
