import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Plus, Trash2, Package, ClipboardList, AlertTriangle, User } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { trpc } from "@/lib/trpc";
import { DarkPageHeader, DarkCard, DarkSearch, DarkButton, IconBtn, DarkModal, DarkField, DarkInput, DarkSelect, DarkTextarea, DarkEmptyState, MiniStats, CardSkeleton, DarkTable, DarkTr, DarkTd, DarkBadge } from "@/components/shared/DarkUI";
import { ExportButton, generateCSV, downloadCSV } from "@/components/shared/ExportButton";

type EpiForm = { name:string; description:string; ca:string; manufacturer:string; category:string; validityMonths:string; stockQuantity:string; minStock:string; unitCost:string };
const EPI_E: EpiForm = { name:"",description:"",ca:"",manufacturer:"",category:"",validityMonths:"",stockQuantity:"0",minStock:"5",unitCost:"" };

type DelForm = { epiId:string; employeeId:string; quantity:string; deliveryDate:string; expiryDate:string; reason:string; condition:string };
const DEL_E: DelForm = { epiId:"",employeeId:"",quantity:"1",deliveryDate:new Date().toISOString().split("T")[0],expiryDate:"",reason:"",condition:"novo" };

export default function EpisPage() {
  const [tabMain, setTabMain] = useState(0);
  const [epiModal, setEpiModal] = useState(false);
  const [delModal, setDelModal] = useState(false);
  const [epiForm, setEpiForm] = useState<EpiForm>(EPI_E);
  const [delForm, setDelForm] = useState<DelForm>(DEL_E);
  const [search, setSearch] = useState("");

  const { data: epis = [], isLoading, refetch: refetchEpis } = trpc.epis.list.useQuery();
  const { data: deliveries = [], refetch: refetchDel } = trpc.epiDeliveries.list.useQuery();
  const { data: employees = [] } = trpc.employees.list.useQuery();
  const createEpi = trpc.epis.create.useMutation({ onSuccess: () => { setEpiModal(false); setEpiForm(EPI_E); refetchEpis(); } });
  const deleteEpi = trpc.epis.delete.useMutation({ onSuccess: () => refetchEpis() });
  const createDel = trpc.epiDeliveries.create.useMutation({ onSuccess: () => { setDelModal(false); setDelForm(DEL_E); refetchDel(); } });
  const deleteDel = trpc.epiDeliveries.delete.useMutation({ onSuccess: () => refetchDel() });

  const ef = (k: keyof EpiForm) => (e: React.ChangeEvent<any>) => setEpiForm(p => ({ ...p, [k]: e.target.value }));
  const df = (k: keyof DelForm) => (e: React.ChangeEvent<any>) => setDelForm(p => ({ ...p, [k]: e.target.value }));

  const filteredEpis = epis.filter(e => e.name?.toLowerCase().includes(search.toLowerCase()) || e.ca?.toLowerCase().includes(search.toLowerCase()));
  const lowStock = epis.filter(e => (e.stockQuantity ?? 0) <= (e.minStock ?? 5));

  const handleExport = () => {
    const csv = generateCSV(["Nome","CA","Fabricante","Categoria","Validade (meses)","Estoque","Estoque Mínimo","Custo Unitário"],
      epis.map(e => [e.name,e.ca??'',e.manufacturer??'',e.category??'',e.validityMonths??'',e.stockQuantity??0,e.minStock??5,e.unitCost??'']));
    downloadCSV(csv, `epis_${new Date().toLocaleDateString("pt-BR").replace(/\//g,"-")}.csv`);
  };

  return (
    <MainLayout title="Controle de EPIs">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`}</style>
      <div className="p-5 lg:p-7 space-y-5" style={{ fontFamily: "'Sora', sans-serif" }}>
        <DarkPageHeader title="Controle de EPIs" description="Cadastro, estoque e ficha de entrega de Equipamentos de Proteção"
          icon={ShieldCheck} accent="#34D399"
          action={<div className="flex gap-2">
            <ExportButton onExportCSV={handleExport}/>
            <DarkButton variant="ghost" onClick={()=>setDelModal(true)}><ClipboardList className="w-4 h-4"/>Registrar Entrega</DarkButton>
            <DarkButton onClick={()=>setEpiModal(true)}><Plus className="w-4 h-4"/>Novo EPI</DarkButton>
          </div>}
        />

        {!isLoading && (
          <MiniStats items={[
            { label: "Tipos de EPI", value: epis.length },
            { label: "Estoque Baixo", value: lowStock.length, color: lowStock.length > 0 ? "#F87171" : "#34D399" },
            { label: "Entregas", value: deliveries.length, color: "#60A5FA" },
            { label: "Custo Total", value: `R$ ${epis.reduce((s,e) => s + ((e.stockQuantity??0)*(e.unitCost??0)), 0).toFixed(0)}`, color: "#A78BFA" },
          ]}/>
        )}

        {/* Low stock alert */}
        {lowStock.length > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-xl border" style={{background:"rgba(239,68,68,0.08)",borderColor:"rgba(239,68,68,0.25)"}}>
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0"/>
            <p className="text-sm text-red-300">Estoque crítico: {lowStock.map(e=>e.name).join(", ")}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{background:"rgba(255,255,255,0.04)"}}>
          {["Catálogo de EPIs","Fichas de Entrega"].map((t,i)=>(
            <button key={i} onClick={()=>setTabMain(i)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${tabMain===i?"bg-blue-600 text-white":"text-slate-400 hover:text-white"}`}>{t}</button>
          ))}
        </div>

        {tabMain === 0 && (
          <>
            <DarkSearch value={search} onChange={setSearch} placeholder="Nome do EPI, número CA..."/>
            {isLoading ? <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">{[...Array(4)].map((_,i)=><CardSkeleton key={i}/>)}</div>
            : filteredEpis.length === 0 ? (
              <DarkEmptyState icon={ShieldCheck} accent="#34D399" title="Nenhum EPI cadastrado"
                description="Cadastre os EPIs da empresa para controle de estoque."
                action={!search&&<DarkButton onClick={()=>setEpiModal(true)}><Plus className="w-4 h-4"/>Cadastrar EPI</DarkButton>}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredEpis.map((epi, i) => {
                  const lowS = (epi.stockQuantity??0) <= (epi.minStock??5);
                  return (
                    <motion.div key={epi.id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}>
                      <DarkCard className={`p-5 hover:border-white/10 transition-all ${lowS?"border-red-500/30":""}`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:"rgba(52,211,153,0.1)"}}>
                            <ShieldCheck className="w-4 h-4 text-emerald-400"/>
                          </div>
                          {epi.ca && <span className="text-[10px] font-mono text-slate-500 bg-white/5 px-2 py-0.5 rounded">CA {epi.ca}</span>}
                        </div>
                        <h3 className="font-semibold text-white text-sm mb-1">{epi.name}</h3>
                        {epi.manufacturer && <p className="text-xs text-slate-500 mb-3">{epi.manufacturer}</p>}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-lg font-bold font-mono ${lowS?"text-red-400":"text-white"}`}>{epi.stockQuantity ?? 0}</p>
                            <p className="text-[10px] text-slate-500">em estoque (mín: {epi.minStock})</p>
                          </div>
                          {epi.unitCost && <div className="text-right">
                            <p className="text-sm font-bold text-slate-300">R$ {epi.unitCost.toFixed(2)}</p>
                            <p className="text-[10px] text-slate-500">por unidade</p>
                          </div>}
                        </div>
                        <div className="flex justify-end gap-1 mt-3 pt-3 border-t border-white/4">
                          <IconBtn icon={Trash2} color="text-slate-500 hover:text-red-400" onClick={()=>{if(confirm("Excluir?"))deleteEpi.mutate({id:epi.id});}}/>
                        </div>
                      </DarkCard>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tabMain === 1 && (
          <DarkTable headers={["Colaborador","EPI","Data","Validade","Qtd","Condição",""]}>
            {deliveries.map((d, i) => (
              <DarkTr key={d.id}>
                <DarkTd><span className="text-white text-sm">{d.employeeName||"—"}</span></DarkTd>
                <DarkTd><span className="text-slate-300 text-sm">{d.epiName||"—"}</span></DarkTd>
                <DarkTd><span className="font-mono text-xs text-slate-400">{new Date(d.deliveryDate).toLocaleDateString("pt-BR")}</span></DarkTd>
                <DarkTd><span className="font-mono text-xs text-slate-400">{d.expiryDate?new Date(d.expiryDate).toLocaleDateString("pt-BR"):"—"}</span></DarkTd>
                <DarkTd><span className="font-mono text-xs text-slate-300">{d.quantity}</span></DarkTd>
                <DarkTd><DarkBadge status={d.condition||"novo"}/></DarkTd>
                <DarkTd className="text-right">
                  <IconBtn icon={Trash2} color="text-slate-500 hover:text-red-400" onClick={()=>{if(confirm("Excluir?"))deleteDel.mutate({id:d.id});}}/>
                </DarkTd>
              </DarkTr>
            ))}
          </DarkTable>
        )}
      </div>

      <DarkModal open={epiModal} onClose={()=>setEpiModal(false)} title="Cadastrar EPI">
        <div className="space-y-4">
          <DarkField label="Nome do EPI" required><DarkInput value={epiForm.name} onChange={ef("name")} placeholder="Protetor Auricular Tipo Concha"/></DarkField>
          <div className="grid grid-cols-2 gap-4">
            <DarkField label="Número CA"><DarkInput value={epiForm.ca} onChange={ef("ca")} placeholder="12345"/></DarkField>
            <DarkField label="Fabricante"><DarkInput value={epiForm.manufacturer} onChange={ef("manufacturer")} placeholder="3M, Honeywell..."/></DarkField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DarkField label="Categoria"><DarkInput value={epiForm.category} onChange={ef("category")} placeholder="Auditivo, Visual, Respiratório..."/></DarkField>
            <DarkField label="Validade (meses)"><DarkInput type="number" value={epiForm.validityMonths} onChange={ef("validityMonths")} placeholder="12"/></DarkField>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <DarkField label="Estoque Atual"><DarkInput type="number" value={epiForm.stockQuantity} onChange={ef("stockQuantity")} placeholder="0"/></DarkField>
            <DarkField label="Estoque Mínimo"><DarkInput type="number" value={epiForm.minStock} onChange={ef("minStock")} placeholder="5"/></DarkField>
            <DarkField label="Custo Unitário (R$)"><DarkInput type="number" step="0.01" value={epiForm.unitCost} onChange={ef("unitCost")} placeholder="29.90"/></DarkField>
          </div>
          <DarkField label="Descrição"><DarkTextarea value={epiForm.description} onChange={ef("description")} rows={2} placeholder="Indicações de uso, NR aplicável..."/></DarkField>
          <div className="flex justify-end gap-3 pt-2 border-t border-white/6">
            <DarkButton variant="ghost" onClick={()=>setEpiModal(false)}>Cancelar</DarkButton>
            <DarkButton onClick={()=>epiForm.name&&createEpi.mutate({...epiForm,stockQuantity:parseInt(epiForm.stockQuantity)||0,minStock:parseInt(epiForm.minStock)||5,validityMonths:epiForm.validityMonths?parseInt(epiForm.validityMonths):undefined,unitCost:epiForm.unitCost?parseFloat(epiForm.unitCost):undefined} as any)} disabled={createEpi.isPending}>
              {createEpi.isPending?"Salvando...":"Cadastrar EPI"}
            </DarkButton>
          </div>
        </div>
      </DarkModal>

      <DarkModal open={delModal} onClose={()=>setDelModal(false)} title="Registrar Entrega de EPI">
        <div className="space-y-4">
          <DarkField label="EPI" required>
            <DarkSelect value={delForm.epiId} onChange={df("epiId")}>
              <option value="">Selecionar EPI</option>
              {epis.map(e=><option key={e.id} value={e.id}>{e.name} (CA {e.ca})</option>)}
            </DarkSelect>
          </DarkField>
          <DarkField label="Colaborador" required>
            <DarkSelect value={delForm.employeeId} onChange={df("employeeId")}>
              <option value="">Selecionar funcionário</option>
              {employees.map(e=><option key={e.id} value={e.id}>{e.name} — {e.sector||e.position}</option>)}
            </DarkSelect>
          </DarkField>
          <div className="grid grid-cols-3 gap-4">
            <DarkField label="Quantidade"><DarkInput type="number" value={delForm.quantity} onChange={df("quantity")} min="1"/></DarkField>
            <DarkField label="Data de Entrega"><DarkInput type="date" value={delForm.deliveryDate} onChange={df("deliveryDate")}/></DarkField>
            <DarkField label="Validade"><DarkInput type="date" value={delForm.expiryDate} onChange={df("expiryDate")}/></DarkField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DarkField label="Motivo"><DarkInput value={delForm.reason} onChange={df("reason")} placeholder="Admissão, reposição, dano..."/></DarkField>
            <DarkField label="Condição">
              <DarkSelect value={delForm.condition} onChange={df("condition")}>
                <option value="novo">Novo</option><option value="bom">Bom</option>
                <option value="regular">Regular</option><option value="danificado">Danificado</option>
              </DarkSelect>
            </DarkField>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-white/6">
            <DarkButton variant="ghost" onClick={()=>setDelModal(false)}>Cancelar</DarkButton>
            <DarkButton onClick={()=>{
              const epi = epis.find(e=>e.id.toString()===delForm.epiId);
              const emp = employees.find(e=>e.id.toString()===delForm.employeeId);
              createDel.mutate({...delForm,epiId:parseInt(delForm.epiId),employeeId:parseInt(delForm.employeeId),quantity:parseInt(delForm.quantity)||1,epiName:epi?.name,employeeName:emp?.name} as any);
            }} disabled={createDel.isPending||!delForm.epiId||!delForm.employeeId}>
              {createDel.isPending?"Salvando...":"Registrar Entrega"}
            </DarkButton>
          </div>
        </div>
      </DarkModal>
    </MainLayout>
  );
}
