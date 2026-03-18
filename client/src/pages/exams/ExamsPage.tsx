import { useState } from "react";
import { motion } from "framer-motion";
import { Stethoscope, Plus, Trash2, Eye, AlertCircle, Clock } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { trpc } from "@/lib/trpc";
import { DarkPageHeader, DarkTable, DarkTr, DarkTd, DarkBadge, DarkSearch, FilterPills, DarkButton, IconBtn, DarkModal, DarkField, DarkInput, DarkSelect, DarkTextarea, DarkEmptyState, MiniStats, TableSkeleton, DarkCard } from "@/components/shared/DarkUI";
import { DetailDrawer, DrawerSection, DrawerRow } from "@/components/shared/DetailDrawer";
import { ExportButton, generateCSV, downloadCSV } from "@/components/shared/ExportButton";

const EXAM_TYPES = [
  { value: "admissional", label: "Admissional" }, { value: "periodico", label: "Periódico" },
  { value: "retorno", label: "Retorno ao Trabalho" }, { value: "mudanca_funcao", label: "Mudança de Função" },
  { value: "demissional", label: "Demissional" },
];
const RESULT_COLOR: Record<string, string> = { apto:"#34D399", inapto:"#EF4444", apto_restricoes:"#F59E0B" };
const RESULT_LABEL: Record<string, string> = { apto:"Apto", inapto:"Inapto", apto_restricoes:"Apto c/ Restrições" };
const FILTERS = [
  { label: "Todos", value: "todos" }, { label: "Admissional", value: "admissional" },
  { label: "Periódico", value: "periodico" }, { label: "Demissional", value: "demissional" },
];
const HEADERS = ["Colaborador", "Tipo", "Data", "Próximo", "Médico/Clínica", "Resultado", ""];

type F = { employeeId:string; employeeName:string; examType:string; examDate:string; nextExamDate:string; doctor:string; crm:string; clinic:string; result:string; restrictions:string; observations:string; asoNumber:string };
const E:F = { employeeId:"", employeeName:"", examType:"admissional", examDate:"", nextExamDate:"", doctor:"", crm:"", clinic:"", result:"apto", restrictions:"", observations:"", asoNumber:"" };

export default function ExamsPage() {
  const [filter, setFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<F>(E);
  const [selected, setSelected] = useState<any>(null);

  const { data = [], isLoading, refetch } = trpc.exams.list.useQuery();
  const { data: expiring = [] } = trpc.exams.expiring.useQuery();
  const { data: employees = [] } = trpc.employees.list.useQuery();
  const createMut = trpc.exams.create.useMutation({ onSuccess: () => { setModal(false); setForm(E); refetch(); } });
  const deleteMut = trpc.exams.delete.useMutation({ onSuccess: () => { setSelected(null); refetch(); } });

  const filtered = data.filter(e => {
    const q = search.toLowerCase();
    return (e.employeeName?.toLowerCase().includes(q) || e.doctor?.toLowerCase().includes(q) || e.asoNumber?.toLowerCase().includes(q))
      && (filter === "todos" || e.examType === filter);
  });

  const f = (k: keyof F) => (e: React.ChangeEvent<any>) => {
    const v = e.target.value;
    const updated: Partial<F> = { [k]: v };
    if (k === "employeeId") {
      const emp = employees.find(emp => emp.id.toString() === v);
      if (emp) updated.employeeName = emp.name;
    }
    setForm(p => ({ ...p, ...updated }));
  };

  const handleExport = () => {
    const csv = generateCSV(["ID","Colaborador","Tipo","Data","Próximo","Médico","CRM","Clínica","Resultado","N° ASO"],
      data.map(e => [e.id,e.employeeName??'',e.examType,e.examDate,e.nextExamDate??'',e.doctor??'',e.crm??'',e.clinic??'',e.result??'',e.asoNumber??'']));
    downloadCSV(csv, `exames_aso_${new Date().toLocaleDateString("pt-BR").replace(/\//g,"-")}.csv`);
  };

  const today = new Date().toISOString().split("T")[0];
  const overdue = data.filter(e => e.nextExamDate && e.nextExamDate < today).length;

  return (
    <MainLayout title="PCMSO / ASO">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`}</style>
      <div className="p-5 lg:p-7 space-y-5" style={{ fontFamily: "'Sora', sans-serif" }}>
        <DarkPageHeader title="PCMSO / Exames Ocupacionais" description="Controle de ASOs, exames e validade por colaborador"
          icon={Stethoscope} accent="#22D3EE"
          action={<div className="flex gap-2"><ExportButton onExportCSV={handleExport}/><DarkButton onClick={()=>setModal(true)}><Plus className="w-4 h-4"/>Registrar ASO</DarkButton></div>}
        />

        {/* Expiring alert */}
        {expiring.length > 0 && (
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}
            className="flex items-center gap-3 p-4 rounded-xl border"
            style={{background:"rgba(245,158,11,0.08)",borderColor:"rgba(245,158,11,0.25)"}}>
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0"/>
            <div>
              <p className="text-sm font-semibold text-amber-300">{expiring.length} ASO(s) vencendo em 30 dias</p>
              <p className="text-xs text-amber-500 mt-0.5">{expiring.map(e=>e.employeeName).join(", ")}</p>
            </div>
          </motion.div>
        )}

        {!isLoading && (
          <MiniStats items={[
            { label: "Total", value: data.length },
            { label: "Aptos", value: data.filter(e=>e.result==="apto").length, color:"#34D399" },
            { label: "Vencendo", value: expiring.length, color:"#F59E0B" },
            { label: "Vencidos", value: overdue, color:"#EF4444" },
          ]}/>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 max-w-sm"><DarkSearch value={search} onChange={setSearch} placeholder="Colaborador, médico, N° ASO..."/></div>
          <FilterPills options={FILTERS} value={filter} onChange={setFilter}/>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-white/5 overflow-hidden" style={{background:"#0D1526"}}><TableSkeleton rows={5} cols={7}/></div>
        ) : filtered.length === 0 ? (
          <DarkEmptyState icon={Stethoscope} accent="#22D3EE" title="Nenhum ASO registrado"
            description="Registre exames admissionais, periódicos e demissionais."
            action={!search&&filter==="todos"&&<DarkButton onClick={()=>setModal(true)}><Plus className="w-4 h-4"/>Registrar ASO</DarkButton>}
          />
        ) : (
          <DarkTable headers={HEADERS}>
            {filtered.map((exam, i) => {
              const isExpiring = expiring.some(e => e.id === exam.id);
              const isOverdue = exam.nextExamDate && exam.nextExamDate < today;
              const resultColor = RESULT_COLOR[exam.result ?? "apto"];
              return (
                <DarkTr key={exam.id} onClick={()=>setSelected(exam)}>
                  <DarkTd>
                    <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.03}}
                      className="font-medium text-white text-sm">{exam.employeeName||"—"}</motion.p>
                  </DarkTd>
                  <DarkTd>
                    <span className="text-xs text-slate-400">{EXAM_TYPES.find(t=>t.value===exam.examType)?.label||exam.examType}</span>
                  </DarkTd>
                  <DarkTd><span className="font-mono text-xs text-slate-400">{new Date(exam.examDate).toLocaleDateString("pt-BR")}</span></DarkTd>
                  <DarkTd>
                    {exam.nextExamDate ? (
                      <span className={`font-mono text-xs ${isOverdue?"text-red-400 font-bold":isExpiring?"text-amber-400":""}`}>
                        {new Date(exam.nextExamDate).toLocaleDateString("pt-BR")}
                        {isOverdue&&" ⚠"}
                      </span>
                    ) : <span className="text-slate-600">—</span>}
                  </DarkTd>
                  <DarkTd>
                    <p className="text-xs text-slate-300">{exam.doctor||"—"}</p>
                    <p className="text-[11px] text-slate-500">{exam.clinic}</p>
                  </DarkTd>
                  <DarkTd>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{color:resultColor,background:`${resultColor}15`}}>
                      {RESULT_LABEL[exam.result??"apto"]}
                    </span>
                  </DarkTd>
                  <DarkTd className="text-right" onClick={e=>e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <IconBtn icon={Eye} onClick={()=>setSelected(exam)}/>
                      <IconBtn icon={Trash2} color="text-slate-500 hover:text-red-400" onClick={()=>{if(confirm("Excluir?"))deleteMut.mutate({id:exam.id});}}/>
                    </div>
                  </DarkTd>
                </DarkTr>
              );
            })}
          </DarkTable>
        )}
      </div>

      <DarkModal open={modal} onClose={()=>setModal(false)} title="Registrar Exame / ASO" width="max-w-2xl">
        <div className="space-y-4">
          <DarkField label="Colaborador" required>
            <DarkSelect value={form.employeeId} onChange={f("employeeId")}>
              <option value="">Selecionar funcionário</option>
              {employees.map(e=><option key={e.id} value={e.id}>{e.name} — {e.position||e.sector}</option>)}
            </DarkSelect>
          </DarkField>
          <div className="grid grid-cols-2 gap-4">
            <DarkField label="Tipo de Exame">
              <DarkSelect value={form.examType} onChange={f("examType")}>
                {EXAM_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
              </DarkSelect>
            </DarkField>
            <DarkField label="N° ASO"><DarkInput value={form.asoNumber} onChange={f("asoNumber")} placeholder="ASO-001"/></DarkField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DarkField label="Data do Exame" required><DarkInput type="date" value={form.examDate} onChange={f("examDate")}/></DarkField>
            <DarkField label="Próximo Exame"><DarkInput type="date" value={form.nextExamDate} onChange={f("nextExamDate")}/></DarkField>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <DarkField label="Médico Responsável"><DarkInput value={form.doctor} onChange={f("doctor")} placeholder="Dr. Nome"/></DarkField>
            <DarkField label="CRM"><DarkInput value={form.crm} onChange={f("crm")} placeholder="CRM/PR 00000"/></DarkField>
            <DarkField label="Clínica"><DarkInput value={form.clinic} onChange={f("clinic")} placeholder="Nome da clínica"/></DarkField>
          </div>
          <DarkField label="Resultado">
            <DarkSelect value={form.result} onChange={f("result")}>
              <option value="apto">Apto</option>
              <option value="apto_restricoes">Apto com Restrições</option>
              <option value="inapto">Inapto</option>
            </DarkSelect>
          </DarkField>
          {form.result !== "apto" && <DarkField label="Restrições / Observações"><DarkTextarea value={form.restrictions} onChange={f("restrictions")} rows={2} placeholder="Descreva as restrições..."/></DarkField>}
          <div className="flex justify-end gap-3 pt-2 border-t border-white/6">
            <DarkButton variant="ghost" onClick={()=>setModal(false)}>Cancelar</DarkButton>
            <DarkButton onClick={()=>form.examDate&&form.examType&&createMut.mutate({...form,employeeId:parseInt(form.employeeId)||0} as any)} disabled={createMut.isPending}>
              {createMut.isPending?"Salvando...":"Registrar Exame"}
            </DarkButton>
          </div>
        </div>
      </DarkModal>

      <DetailDrawer open={!!selected} onClose={()=>setSelected(null)}
        title={selected?.employeeName??""} subtitle={EXAM_TYPES.find(t=>t.value===selected?.examType)?.label||"Exame Ocupacional"}
        icon={Stethoscope} accent="#22D3EE"
        actions={<><DarkButton variant="danger" onClick={()=>{if(confirm("Excluir?"))deleteMut.mutate({id:selected?.id});}}><Trash2 className="w-3.5 h-3.5"/>Excluir</DarkButton><span className="flex-1"/><DarkButton variant="ghost" onClick={()=>setSelected(null)}>Fechar</DarkButton></>}
      >
        {selected&&(
          <>
            <DrawerSection title="Dados do Exame">
              <DrawerRow label="N° ASO" value={selected.asoNumber} mono/>
              <DrawerRow label="Tipo" value={EXAM_TYPES.find(t=>t.value===selected.examType)?.label}/>
              <DrawerRow label="Data" value={new Date(selected.examDate).toLocaleDateString("pt-BR")}/>
              <DrawerRow label="Próximo" value={selected.nextExamDate?new Date(selected.nextExamDate).toLocaleDateString("pt-BR"):undefined}/>
            </DrawerSection>
            <DrawerSection title="Equipe Médica">
              <DrawerRow label="Médico" value={selected.doctor}/>
              <DrawerRow label="CRM" value={selected.crm} mono/>
              <DrawerRow label="Clínica" value={selected.clinic}/>
            </DrawerSection>
            <DrawerSection title="Resultado">
              <span className="text-sm font-bold px-3 py-1 rounded-full" style={{color:RESULT_COLOR[selected.result??"apto"],background:`${RESULT_COLOR[selected.result??"apto"]}15`}}>
                {RESULT_LABEL[selected.result??"apto"]}
              </span>
              {selected.restrictions&&<p className="text-sm text-slate-300 mt-3">{selected.restrictions}</p>}
            </DrawerSection>
          </>
        )}
      </DetailDrawer>
    </MainLayout>
  );
}
