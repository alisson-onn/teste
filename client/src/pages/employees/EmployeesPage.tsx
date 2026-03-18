import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Plus, Trash2, Eye } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { trpc } from "@/lib/trpc";
import {
  DarkPageHeader, DarkTable, DarkTr, DarkTd, DarkBadge, DarkSearch,
  FilterPills, DarkButton, IconBtn, DarkModal, DarkField, DarkInput,
  DarkSelect, DarkTextarea, DarkEmptyState, MiniStats, TableSkeleton,
} from "@/components/shared/DarkUI";
import { DetailDrawer, DrawerSection, DrawerRow } from "@/components/shared/DetailDrawer";
import { ExportButton, generateCSV, downloadCSV } from "@/components/shared/ExportButton";

const STATUS_F = [
  { label: "Todos", value: "todos" }, { label: "Ativo", value: "ativo" },
  { label: "Afastado", value: "afastado" }, { label: "Férias", value: "ferias" },
  { label: "Desligado", value: "desligado" },
];
const HEADERS = ["Colaborador", "Cargo / Setor", "Matrícula", "Admissão", "Status", ""];

type F = {
  name: string; cpf: string; rg: string; birthDate: string; gender: string;
  phone: string; email: string; address: string; city: string; state: string;
  matricula: string; position: string; department: string; sector: string;
  workRegime: string; admissionDate: string;
  emergencyContact: string; emergencyPhone: string;
  bloodType: string; allergies: string; observations: string;
};
const EMPTY: F = {
  name:"",cpf:"",rg:"",birthDate:"",gender:"",phone:"",email:"",
  address:"",city:"",state:"",matricula:"",position:"",department:"",
  sector:"",workRegime:"",admissionDate:"",
  emergencyContact:"",emergencyPhone:"",bloodType:"",allergies:"",observations:""
};

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todos");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<F>(EMPTY);
  const [tab, setTab] = useState(0);
  const [selected, setSelected] = useState<any>(null);
  const [errors, setErrors] = useState<Partial<F>>({});

  const { data = [], isLoading, refetch } = trpc.employees.list.useQuery();
  const { data: ghes = [] } = trpc.ghes.list.useQuery();
  const createMut = trpc.employees.create.useMutation({
    onSuccess: () => { setModal(false); setForm(EMPTY); setTab(0); refetch(); }
  });
  const deleteMut = trpc.employees.delete.useMutation({ onSuccess: () => { setSelected(null); refetch(); } });

  const filtered = data.filter(e => {
    const q = search.toLowerCase();
    return (e.name?.toLowerCase().includes(q) || e.cpf?.includes(q) ||
      e.position?.toLowerCase().includes(q) || e.sector?.toLowerCase().includes(q))
      && (filter === "todos" || e.status === filter);
  });

  const validate = () => {
    const err: Partial<F> = {};
    if (!form.name.trim()) err.name = "Obrigatório";
    if (!form.cpf.trim()) err.cpf = "Obrigatório";
    setErrors(err); return !Object.keys(err).length;
  };
  const f = (k: keyof F) => (e: React.ChangeEvent<any>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleExport = () => {
    const csv = generateCSV(
      ["ID","Nome","CPF","Matrícula","Cargo","Setor","Admissão","Status","Telefone","E-mail"],
      data.map(e => [e.id,e.name,e.cpf,e.matricula??'',e.position??'',e.sector??'',e.admissionDate??'',e.status??'',e.phone??'',e.email??''])
    );
    downloadCSV(csv, `funcionarios_${new Date().toLocaleDateString("pt-BR").replace(/\//g,"-")}.csv`);
  };

  const gheMap = Object.fromEntries(ghes.map(g => [g.id, g.name]));
  const TABS = ["Dados Pessoais", "Dados Profissionais", "Emergência / Saúde"];

  return (
    <MainLayout title="Funcionários">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`}</style>
      <div className="p-5 lg:p-7 space-y-5" style={{ fontFamily: "'Sora', sans-serif" }}>

        <DarkPageHeader title="Cadastro de Funcionários" description="Gestão centralizada de colaboradores"
          icon={Users} accent="#60A5FA"
          action={<div className="flex gap-2">
            <ExportButton onExportCSV={handleExport}/>
            <DarkButton onClick={() => setModal(true)}><Plus className="w-4 h-4"/>Novo Funcionário</DarkButton>
          </div>}
        />

        {!isLoading && (
          <MiniStats items={[
            { label: "Total", value: data.length },
            { label: "Ativos", value: data.filter(e => e.status === "ativo").length, color: "#34D399" },
            { label: "Afastados", value: data.filter(e => e.status === "afastado").length, color: "#F87171" },
            { label: "Desligados", value: data.filter(e => e.status === "desligado").length, color: "#64748B" },
          ]}/>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 max-w-sm">
            <DarkSearch value={search} onChange={setSearch} placeholder="Nome, CPF, cargo, setor..."/>
          </div>
          <FilterPills options={STATUS_F} value={filter} onChange={setFilter}/>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-white/5 overflow-hidden" style={{background:"#0D1526"}}>
            <TableSkeleton rows={5} cols={6}/>
          </div>
        ) : filtered.length === 0 ? (
          <DarkEmptyState icon={Users} accent="#60A5FA"
            title={search || filter !== "todos" ? "Nenhum resultado" : "Nenhum funcionário cadastrado"}
            description="Cadastre os colaboradores para vincular nos módulos SST."
            action={!search && filter === "todos" &&
              <DarkButton onClick={() => setModal(true)}><Plus className="w-4 h-4"/>Cadastrar funcionário</DarkButton>
            }
          />
        ) : (
          <DarkTable headers={HEADERS}>
            {filtered.map((emp, i) => (
              <DarkTr key={emp.id} onClick={() => setSelected(emp)}>
                <DarkTd>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: "rgba(96,165,250,0.15)", color: "#60A5FA" }}>
                      {emp.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{emp.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{emp.cpf}</p>
                    </div>
                  </motion.div>
                </DarkTd>
                <DarkTd>
                  <p className="text-slate-300 text-sm">{emp.position || "—"}</p>
                  <p className="text-xs text-slate-500">{emp.sector || emp.department || "—"}</p>
                </DarkTd>
                <DarkTd><span className="font-mono text-xs text-slate-400">{emp.matricula || "—"}</span></DarkTd>
                <DarkTd>
                  <span className="font-mono text-xs text-slate-400">
                    {emp.admissionDate ? new Date(emp.admissionDate).toLocaleDateString("pt-BR") : "—"}
                  </span>
                </DarkTd>
                <DarkTd><DarkBadge status={emp.status || "ativo"}/></DarkTd>
                <DarkTd className="text-right" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-end gap-1">
                    <IconBtn icon={Eye} onClick={() => setSelected(emp)}/>
                    <IconBtn icon={Trash2} color="text-slate-500 hover:text-red-400"
                      onClick={() => { if (confirm("Excluir?")) deleteMut.mutate({ id: emp.id }); }}/>
                  </div>
                </DarkTd>
              </DarkTr>
            ))}
          </DarkTable>
        )}
      </div>

      {/* CREATE MODAL - tabbed */}
      <DarkModal open={modal} onClose={() => { setModal(false); setTab(0); }} title="Novo Funcionário" width="max-w-2xl">
        <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === i ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 0 && (
          <div className="space-y-4">
            <DarkField label="Nome Completo" required error={errors.name}>
              <DarkInput value={form.name} onChange={f("name")} placeholder="João da Silva"/>
            </DarkField>
            <div className="grid grid-cols-2 gap-4">
              <DarkField label="CPF" required error={errors.cpf}>
                <DarkInput value={form.cpf} onChange={f("cpf")} placeholder="000.000.000-00"/>
              </DarkField>
              <DarkField label="RG"><DarkInput value={form.rg} onChange={f("rg")} placeholder="0.000.000"/></DarkField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DarkField label="Nascimento"><DarkInput type="date" value={form.birthDate} onChange={f("birthDate")}/></DarkField>
              <DarkField label="Gênero">
                <DarkSelect value={form.gender} onChange={f("gender")}>
                  <option value="">Selecionar</option>
                  <option value="M">Masculino</option><option value="F">Feminino</option><option value="outro">Outro</option>
                </DarkSelect>
              </DarkField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DarkField label="Telefone"><DarkInput value={form.phone} onChange={f("phone")} placeholder="(45) 99999-9999"/></DarkField>
              <DarkField label="E-mail"><DarkInput type="email" value={form.email} onChange={f("email")} placeholder="joao@empresa.com"/></DarkField>
            </div>
            <DarkField label="Endereço"><DarkInput value={form.address} onChange={f("address")} placeholder="Rua, número, bairro"/></DarkField>
            <div className="grid grid-cols-2 gap-4">
              <DarkField label="Cidade"><DarkInput value={form.city} onChange={f("city")} placeholder="Foz do Iguaçu"/></DarkField>
              <DarkField label="Estado"><DarkInput value={form.state} onChange={f("state")} placeholder="PR"/></DarkField>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <DarkField label="Matrícula"><DarkInput value={form.matricula} onChange={f("matricula")} placeholder="001"/></DarkField>
              <DarkField label="Regime">
                <DarkSelect value={form.workRegime} onChange={f("workRegime")}>
                  <option value="">Selecionar</option>
                  <option value="CLT">CLT</option><option value="PJ">PJ</option>
                  <option value="Temporário">Temporário</option><option value="Estagiário">Estagiário</option>
                </DarkSelect>
              </DarkField>
            </div>
            <DarkField label="Cargo / Função">
              <DarkInput value={form.position} onChange={f("position")} placeholder="Técnico de Segurança"/>
            </DarkField>
            <div className="grid grid-cols-2 gap-4">
              <DarkField label="Departamento"><DarkInput value={form.department} onChange={f("department")} placeholder="SST"/></DarkField>
              <DarkField label="Setor"><DarkInput value={form.sector} onChange={f("sector")} placeholder="Administrativo"/></DarkField>
            </div>
            <DarkField label="Admissão"><DarkInput type="date" value={form.admissionDate} onChange={f("admissionDate")}/></DarkField>
            <DarkField label="GHE Vinculado">
              <DarkSelect value="" onChange={() => {}}>
                <option value="">Selecionar GHE</option>
                {ghes.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </DarkSelect>
            </DarkField>
          </div>
        )}

        {tab === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <DarkField label="Contato de Emergência">
                <DarkInput value={form.emergencyContact} onChange={f("emergencyContact")} placeholder="Nome"/>
              </DarkField>
              <DarkField label="Tel. Emergência">
                <DarkInput value={form.emergencyPhone} onChange={f("emergencyPhone")} placeholder="(45) 99999-9999"/>
              </DarkField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DarkField label="Tipo Sanguíneo">
                <DarkSelect value={form.bloodType} onChange={f("bloodType")}>
                  <option value="">Selecionar</option>
                  {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(t => <option key={t} value={t}>{t}</option>)}
                </DarkSelect>
              </DarkField>
              <DarkField label="Alergias">
                <DarkInput value={form.allergies} onChange={f("allergies")} placeholder="Nenhuma"/>
              </DarkField>
            </div>
            <DarkField label="Observações">
              <DarkTextarea value={form.observations} onChange={f("observations")} rows={3} placeholder="Condições médicas relevantes..."/>
            </DarkField>
          </div>
        )}

        <div className="flex justify-between gap-3 pt-4 mt-2 border-t border-white/6">
          <div>{tab > 0 && <DarkButton variant="ghost" onClick={() => setTab(t => t-1)}>← Anterior</DarkButton>}</div>
          <div className="flex gap-2">
            <DarkButton variant="ghost" onClick={() => setModal(false)}>Cancelar</DarkButton>
            {tab < 2
              ? <DarkButton onClick={() => setTab(t => t+1)}>Próximo →</DarkButton>
              : <DarkButton onClick={() => validate() && createMut.mutate(form as any)} disabled={createMut.isPending}>
                  {createMut.isPending ? "Salvando..." : "Cadastrar"}
                </DarkButton>
            }
          </div>
        </div>
      </DarkModal>

      <DetailDrawer open={!!selected} onClose={() => setSelected(null)}
        title={selected?.name ?? ""} subtitle={`${selected?.position ?? ""} — ${selected?.sector ?? ""}`}
        icon={Users} accent="#60A5FA"
        actions={<><DarkButton variant="danger" onClick={() => { if(confirm("Excluir?")) deleteMut.mutate({ id: selected?.id }); }}><Trash2 className="w-3.5 h-3.5"/>Excluir</DarkButton><span className="flex-1"/><DarkButton variant="ghost" onClick={() => setSelected(null)}>Fechar</DarkButton></>}
      >
        {selected && (
          <>
            <DrawerSection title="Dados Pessoais">
              <DrawerRow label="CPF" value={selected.cpf} mono/>
              <DrawerRow label="Nascimento" value={selected.birthDate ? new Date(selected.birthDate).toLocaleDateString("pt-BR") : undefined}/>
              <DrawerRow label="Telefone" value={selected.phone}/>
              <DrawerRow label="E-mail" value={selected.email}/>
              <DrawerRow label="Cidade" value={[selected.city, selected.state].filter(Boolean).join(" — ") || undefined}/>
            </DrawerSection>
            <DrawerSection title="Dados Profissionais">
              <DrawerRow label="Matrícula" value={selected.matricula} mono/>
              <DrawerRow label="Cargo" value={selected.position}/>
              <DrawerRow label="Setor" value={selected.sector}/>
              <DrawerRow label="Regime" value={selected.workRegime}/>
              <DrawerRow label="Admissão" value={selected.admissionDate ? new Date(selected.admissionDate).toLocaleDateString("pt-BR") : undefined}/>
              <DrawerRow label="GHE" value={selected.gheId ? gheMap[selected.gheId] : undefined}/>
            </DrawerSection>
            <DrawerSection title="Saúde e Emergência">
              <DrawerRow label="Contato" value={selected.emergencyContact}/>
              <DrawerRow label="Tel. Emergência" value={selected.emergencyPhone}/>
              <DrawerRow label="Tipo Sanguíneo" value={selected.bloodType}/>
              <DrawerRow label="Alergias" value={selected.allergies}/>
            </DrawerSection>
          </>
        )}
      </DetailDrawer>
    </MainLayout>
  );
}
