import { useState } from "react";
import { motion } from "framer-motion";
import { Network, Plus, Trash2, Eye, AlertTriangle, Shield, Zap, Wind, Bug, BarChart2 } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { trpc } from "@/lib/trpc";
import { DarkPageHeader, DarkCard, DarkBadge, DarkSearch, DarkButton, IconBtn, DarkModal, DarkField, DarkInput, DarkSelect, DarkTextarea, DarkEmptyState, MiniStats, CardSkeleton } from "@/components/shared/DarkUI";
import { DetailDrawer, DrawerSection, DrawerRow } from "@/components/shared/DetailDrawer";

const AGENT_TYPES = [
  { value: "fisico", label: "Físico", icon: Zap, color: "#F59E0B" },
  { value: "quimico", label: "Químico", icon: Wind, color: "#F97316" },
  { value: "biologico", label: "Biológico", icon: Bug, color: "#22C55E" },
  { value: "ergonomico", label: "Ergonômico", icon: BarChart2, color: "#A78BFA" },
  { value: "acidente", label: "Acidente", icon: AlertTriangle, color: "#EF4444" },
];

const RISK_COLOR: Record<string, string> = { toleravel: "#34D399", moderado: "#F59E0B", alto: "#F97316", critico: "#EF4444" };

type GheForm = { name: string; description: string; sector: string; department: string; activities: string };
const GHE_EMPTY: GheForm = { name: "", description: "", sector: "", department: "", activities: "" };

type RiskForm = { gheId: number; agentType: string; agent: string; source: string; probability: string; severity: string; controlMeasures: string; epiRequired: string; aposentadoriaEspecial: boolean };
const RISK_EMPTY: RiskForm = { gheId: 0, agentType: "fisico", agent: "", source: "", probability: "3", severity: "3", controlMeasures: "", epiRequired: "", aposentadoriaEspecial: false };

export default function GhePage() {
  const [selectedGhe, setSelectedGhe] = useState<any>(null);
  const [gheModal, setGheModal] = useState(false);
  const [riskModal, setRiskModal] = useState(false);
  const [gheForm, setGheForm] = useState<GheForm>(GHE_EMPTY);
  const [riskForm, setRiskForm] = useState<RiskForm>(RISK_EMPTY);
  const [search, setSearch] = useState("");

  const { data: ghes = [], isLoading, refetch: refetchGhes } = trpc.ghes.list.useQuery();
  const { data: risks = [], refetch: refetchRisks } = trpc.risks.list.useQuery();
  const createGhe = trpc.ghes.create.useMutation({ onSuccess: () => { setGheModal(false); setGheForm(GHE_EMPTY); refetchGhes(); } });
  const deleteGhe = trpc.ghes.delete.useMutation({ onSuccess: () => { setSelectedGhe(null); refetchGhes(); } });
  const createRisk = trpc.risks.create.useMutation({ onSuccess: () => { setRiskModal(false); setRiskForm(RISK_EMPTY); refetchRisks(); } });
  const deleteRisk = trpc.risks.delete.useMutation({ onSuccess: () => refetchRisks() });

  const gheRisks = risks.filter(r => r.gheId === selectedGhe?.id);
  const totalCriticos = risks.filter(r => r.riskLevel === "critico").length;
  const totalAlto = risks.filter(r => r.riskLevel === "alto").length;
  const aposentadorias = risks.filter(r => r.aposentadoriaEspecial).length;

  const gf = (k: keyof GheForm) => (e: React.ChangeEvent<any>) => setGheForm(p => ({ ...p, [k]: e.target.value }));
  const rf = (k: keyof RiskForm) => (e: React.ChangeEvent<any>) =>
    setRiskForm(p => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const RISK_LEVEL_LABEL: Record<string, string> = { toleravel: "Tolerável", moderado: "Moderado", alto: "Alto", critico: "Crítico" };

  return (
    <MainLayout title="GHE / Matriz de Risco">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`}</style>
      <div className="p-5 lg:p-7 space-y-5" style={{ fontFamily: "'Sora', sans-serif" }}>
        <DarkPageHeader title="GHE + Matriz de Risco" description="Grupos Homogêneos de Exposição e inventário de riscos (NR-01/PGR)"
          icon={Network} accent="#F59E0B"
          action={<DarkButton onClick={() => setGheModal(true)}><Plus className="w-4 h-4"/>Novo GHE</DarkButton>}
        />
        {!isLoading && (
          <MiniStats items={[
            { label: "GHEs", value: ghes.length },
            { label: "Riscos Críticos", value: totalCriticos, color: "#EF4444" },
            { label: "Riscos Altos", value: totalAlto, color: "#F97316" },
            { label: "Apos. Especial", value: aposentadorias, color: "#A78BFA" },
          ]}/>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* GHE list */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Grupos de Exposição</p>
            {isLoading ? [...Array(3)].map((_,i)=><CardSkeleton key={i}/>) :
             ghes.length === 0 ? (
              <DarkEmptyState icon={Network} accent="#F59E0B" title="Nenhum GHE cadastrado"
                description="Crie grupos para mapear riscos por atividade."
                action={<DarkButton onClick={() => setGheModal(true)}><Plus className="w-4 h-4"/>Criar GHE</DarkButton>}
              />
            ) : ghes.map((ghe, i) => {
              const gRisks = risks.filter(r => r.gheId === ghe.id);
              const maxLevel = gRisks.reduce((max, r) => {
                const order = ["toleravel","moderado","alto","critico"];
                return order.indexOf(r.riskLevel??'') > order.indexOf(max) ? (r.riskLevel ?? max) : max;
              }, "toleravel");
              return (
                <motion.div key={ghe.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <DarkCard className={`p-4 cursor-pointer hover:border-white/10 transition-all ${selectedGhe?.id === ghe.id ? "border-amber-500/40" : ""}`}
                    onClick={() => setSelectedGhe(ghe)}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Network className="w-4 h-4 text-amber-400"/>
                          <p className="font-semibold text-white text-sm">{ghe.name}</p>
                        </div>
                        {ghe.sector && <p className="text-xs text-slate-500 mb-2">{ghe.sector}</p>}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] text-slate-500">{gRisks.length} risco(s)</span>
                          {gRisks.length > 0 && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                              style={{ color: RISK_COLOR[maxLevel], background: `${RISK_COLOR[maxLevel]}15` }}>
                              {RISK_LEVEL_LABEL[maxLevel]}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 ml-3">
                        <IconBtn icon={Trash2} color="text-slate-500 hover:text-red-400"
                          onClick={e => { e.stopPropagation(); if(confirm("Excluir GHE?")) deleteGhe.mutate({ id: ghe.id }); }}/>
                      </div>
                    </div>
                  </DarkCard>
                </motion.div>
              );
            })}
          </div>

          {/* Risk matrix */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                {selectedGhe ? `Riscos — ${selectedGhe.name}` : "Selecione um GHE"}
              </p>
              {selectedGhe && (
                <DarkButton size="sm" onClick={() => { setRiskForm({...RISK_EMPTY, gheId: selectedGhe.id}); setRiskModal(true); }}>
                  <Plus className="w-3 h-3"/>Adicionar Risco
                </DarkButton>
              )}
            </div>
            {!selectedGhe ? (
              <DarkCard className="flex items-center justify-center py-16 text-center">
                <div>
                  <Network className="w-8 h-8 text-slate-600 mx-auto mb-2"/>
                  <p className="text-sm text-slate-500">Selecione um GHE para ver sua matriz de riscos</p>
                </div>
              </DarkCard>
            ) : gheRisks.length === 0 ? (
              <DarkEmptyState icon={Shield} accent="#22C55E" title="Sem riscos mapeados"
                description="Adicione agentes de risco para este GHE."
                action={<DarkButton size="sm" onClick={() => { setRiskForm({...RISK_EMPTY, gheId: selectedGhe.id}); setRiskModal(true); }}><Plus className="w-3 h-3"/>Adicionar</DarkButton>}
              />
            ) : gheRisks.map((risk, i) => {
              const at = AGENT_TYPES.find(a => a.value === risk.agentType);
              const Icon = at?.icon ?? Shield;
              const rLevel = risk.riskLevel ?? "toleravel";
              return (
                <motion.div key={risk.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <DarkCard className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${at?.color ?? "#94A3B8"}15` }}>
                        <Icon className="w-4 h-4" style={{ color: at?.color ?? "#94A3B8" }}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-medium text-white text-sm">{risk.agent}</p>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                            style={{ color: at?.color, background: `${at?.color}15` }}>{at?.label}</span>
                        </div>
                        {risk.source && <p className="text-xs text-slate-500 mb-2">Fonte: {risk.source}</p>}
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-[11px] text-slate-500 font-mono">P:{risk.probability} × G:{risk.severity} = {(risk.probability??1)*(risk.severity??1)}</span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                            style={{ color: RISK_COLOR[rLevel], background: `${RISK_COLOR[rLevel]}15` }}>
                            {RISK_LEVEL_LABEL[rLevel]}
                          </span>
                          {risk.aposentadoriaEspecial && (
                            <span className="text-[10px] text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full">Apos. Especial</span>
                          )}
                        </div>
                        {risk.controlMeasures && <p className="text-xs text-slate-500 mt-1.5">Controle: {risk.controlMeasures}</p>}
                        {risk.epiRequired && <p className="text-xs text-slate-500">EPI: {risk.epiRequired}</p>}
                      </div>
                      <IconBtn icon={Trash2} color="text-slate-500 hover:text-red-400"
                        onClick={() => { if(confirm("Excluir risco?")) deleteRisk.mutate({ id: risk.id }); }}/>
                    </div>
                  </DarkCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* GHE Modal */}
      <DarkModal open={gheModal} onClose={() => setGheModal(false)} title="Novo GHE">
        <div className="space-y-4">
          <DarkField label="Nome do GHE" required><DarkInput value={gheForm.name} onChange={gf("name")} placeholder="GHE-01 Operação"/></DarkField>
          <div className="grid grid-cols-2 gap-4">
            <DarkField label="Setor"><DarkInput value={gheForm.sector} onChange={gf("sector")} placeholder="Produção"/></DarkField>
            <DarkField label="Departamento"><DarkInput value={gheForm.department} onChange={gf("department")} placeholder="Operações"/></DarkField>
          </div>
          <DarkField label="Atividades Desenvolvidas"><DarkTextarea value={gheForm.activities} onChange={gf("activities")} rows={2} placeholder="Descreva as atividades deste grupo..."/></DarkField>
          <DarkField label="Descrição"><DarkTextarea value={gheForm.description} onChange={gf("description")} rows={2} placeholder="Contexto do GHE..."/></DarkField>
          <div className="flex justify-end gap-3 pt-2 border-t border-white/6">
            <DarkButton variant="ghost" onClick={() => setGheModal(false)}>Cancelar</DarkButton>
            <DarkButton onClick={() => gheForm.name && createGhe.mutate(gheForm)} disabled={createGhe.isPending}>
              {createGhe.isPending ? "Salvando..." : "Criar GHE"}
            </DarkButton>
          </div>
        </div>
      </DarkModal>

      {/* Risk Modal */}
      <DarkModal open={riskModal} onClose={() => setRiskModal(false)} title="Adicionar Risco">
        <div className="space-y-4">
          <DarkField label="Tipo de Agente" required>
            <div className="grid grid-cols-5 gap-1.5">
              {AGENT_TYPES.map(at => {
                const Icon = at.icon;
                return (
                  <button key={at.value} onClick={() => setRiskForm(p=>({...p, agentType: at.value}))}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition-all ${riskForm.agentType === at.value ? "border-opacity-100 text-white" : "border-white/10 text-slate-500 hover:border-white/20"}`}
                    style={riskForm.agentType === at.value ? { background: `${at.color}20`, borderColor: at.color } : {}}>
                    <Icon className="w-4 h-4" style={{ color: riskForm.agentType === at.value ? at.color : undefined }}/>
                    <span>{at.label}</span>
                  </button>
                );
              })}
            </div>
          </DarkField>
          <DarkField label="Agente / Fator de Risco" required>
            <DarkInput value={riskForm.agent} onChange={rf("agent")} placeholder="Ex: Ruído, Poeira, Levantamento de peso..."/>
          </DarkField>
          <DarkField label="Fonte Geradora">
            <DarkInput value={riskForm.source} onChange={rf("source")} placeholder="Máquina, processo, atividade..."/>
          </DarkField>
          <div className="grid grid-cols-2 gap-4">
            <DarkField label="Probabilidade (1-5)">
              <DarkSelect value={riskForm.probability} onChange={rf("probability")}>
                <option value="1">1 — Improvável</option><option value="2">2 — Remota</option>
                <option value="3">3 — Ocasional</option><option value="4">4 — Provável</option>
                <option value="5">5 — Frequente</option>
              </DarkSelect>
            </DarkField>
            <DarkField label="Gravidade (1-5)">
              <DarkSelect value={riskForm.severity} onChange={rf("severity")}>
                <option value="1">1 — Insignificante</option><option value="2">2 — Menor</option>
                <option value="3">3 — Moderada</option><option value="4">4 — Crítica</option>
                <option value="5">5 — Catastrófica</option>
              </DarkSelect>
            </DarkField>
          </div>
          <div className="p-3 rounded-xl border border-white/6 text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
            {(() => {
              const score = parseInt(riskForm.probability) * parseInt(riskForm.severity);
              const level = score <= 4 ? "toleravel" : score <= 9 ? "moderado" : score <= 16 ? "alto" : "critico";
              return <>
                <p className="text-xs text-slate-500 mb-1">Nível calculado: P × G = {score}</p>
                <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ color: RISK_COLOR[level], background: `${RISK_COLOR[level]}15` }}>
                  {RISK_LEVEL_LABEL[level]}
                </span>
              </>;
            })()}
          </div>
          <DarkField label="Medidas de Controle">
            <DarkTextarea value={riskForm.controlMeasures} onChange={rf("controlMeasures")} rows={2} placeholder="EPC, EPIs, procedimentos..."/>
          </DarkField>
          <DarkField label="EPI Requerido">
            <DarkInput value={riskForm.epiRequired} onChange={rf("epiRequired")} placeholder="Protetor auricular, luvas..."/>
          </DarkField>
          <div className="flex items-center gap-3 p-3 rounded-xl border border-white/6" style={{ background: "rgba(255,255,255,0.02)" }}>
            <input type="checkbox" id="apo" checked={riskForm.aposentadoriaEspecial}
              onChange={rf("aposentadoriaEspecial")} className="w-4 h-4 rounded accent-purple-500"/>
            <label htmlFor="apo" className="text-sm text-slate-300 cursor-pointer">Gerador de Aposentadoria Especial</label>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-white/6">
            <DarkButton variant="ghost" onClick={() => setRiskModal(false)}>Cancelar</DarkButton>
            <DarkButton onClick={() => riskForm.agent && createRisk.mutate({
              ...riskForm, gheId: riskForm.gheId || selectedGhe?.id || 0,
              probability: parseInt(riskForm.probability), severity: parseInt(riskForm.severity)
            })} disabled={createRisk.isPending}>
              {createRisk.isPending ? "Salvando..." : "Adicionar Risco"}
            </DarkButton>
          </div>
        </div>
      </DarkModal>
    </MainLayout>
  );
}
