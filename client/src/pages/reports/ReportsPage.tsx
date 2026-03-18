import { motion } from "framer-motion";
import { BarChart2, TrendingDown, TrendingUp, AlertTriangle, Users, GraduationCap, Target, Clock, FileBarChart, Activity } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, PieChart, Pie, Cell } from "recharts";
import MainLayout from "@/components/MainLayout";
import { trpc } from "@/lib/trpc";
import { DarkCard, Skeleton, MiniStats } from "@/components/shared/DarkUI";
import { ExportButton, generateCSV, downloadCSV } from "@/components/shared/ExportButton";

const DARK_TOOLTIP = { contentStyle: { background:"#0D1526", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, fontFamily:"'Sora', sans-serif", fontSize:12 }, labelStyle:{color:"#94A3B8"}, itemStyle:{color:"#E2E8F0"} };

function KPICard({ title, value, sub, color, icon: Icon, trend }: any) {
  return (
    <DarkCard className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }}/>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${trend > 0 ? "text-red-400 bg-red-400/10" : "text-emerald-400 bg-emerald-400/10"}`}>
            {trend > 0 ? <TrendingUp className="w-3 h-3"/> : <TrendingDown className="w-3 h-3"/>}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white font-mono">{value}</p>
      <p className="text-sm text-slate-400 mt-1">{title}</p>
      {sub && <p className="text-xs text-slate-600 mt-1">{sub}</p>}
    </DarkCard>
  );
}

export default function ReportsPage() {
  const { data: ind, isLoading } = trpc.reports.indicators.useQuery();

  const handleExport = () => {
    if (!ind) return;
    const csv = generateCSV(
      ["Indicador","Valor"],
      [
        ["Total de Funcionários", ind.totalEmployees],
        ["Funcionários Ativos", ind.activeEmployees],
        ["Total de Acidentes", ind.totalAccidents],
        ["Acidentes Graves/Fatais", ind.graveAccidents],
        ["Taxa de Frequência (TAFAC)", ind.tafac],
        ["Taxa de Gravidade (TGFAC)", ind.tgfac],
        ["Dias Perdidos", ind.lostDays],
        ["Total de Treinamentos", ind.totalTrainings],
        ["Horas de Treinamento", ind.trainingHours],
        ["Ações Abertas", ind.openActions],
        ["Ações Atrasadas", ind.overdueActions],
        ["Exames Vencendo", ind.expiringExams],
      ]
    );
    downloadCSV(csv, `relatorio_indicadores_${new Date().toLocaleDateString("pt-BR").replace(/\//g,"-")}.csv`);
  };

  const ACCENT = "#3B82F6";
  const PIE_DATA = ind ? [
    { name: "Concluídos", value: ind.completedTrainings, color: "#34D399" },
    { name: "Outros", value: ind.totalTrainings - ind.completedTrainings, color: "#1E293B" },
  ] : [];

  return (
    <MainLayout title="Relatórios / Indicadores">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`}</style>
      <div className="p-5 lg:p-7 space-y-6" style={{ fontFamily: "'Sora', sans-serif" }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileBarChart className="w-5 h-5 text-blue-400"/>
              Relatórios Gerenciais & Indicadores SST
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">Indicadores calculados em tempo real — TAFAC, TGFAC, dias perdidos e mais</p>
          </div>
          <ExportButton onExportCSV={handleExport} label="Exportar Relatório"/>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(8)].map((_,i)=><Skeleton key={i} className="h-32"/>)}</div>
        ) : !ind ? null : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0}}>
                <KPICard title="Funcionários Ativos" value={ind.activeEmployees} sub={`${ind.totalEmployees} total`} color="#60A5FA" icon={Users}/>
              </motion.div>
              <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.05}}>
                <KPICard title="Acidentes no Período" value={ind.totalAccidents} sub={`${ind.graveAccidents} graves/fatais`} color="#EF4444" icon={AlertTriangle} trend={ind.totalAccidents>0?12:0}/>
              </motion.div>
              <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.1}}>
                <KPICard title="TAFAC" value={ind.tafac} sub="Taxa de Frequência ×10⁶" color="#F59E0B" icon={Activity}/>
              </motion.div>
              <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.15}}>
                <KPICard title="TGFAC" value={ind.tgfac} sub="Taxa de Gravidade ×10⁶" color="#F97316" icon={TrendingDown}/>
              </motion.div>
              <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.2}}>
                <KPICard title="Dias Perdidos" value={ind.lostDays} sub="Por afastamentos" color="#A78BFA" icon={Clock}/>
              </motion.div>
              <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.25}}>
                <KPICard title="Horas de Treinamento" value={`${ind.trainingHours}h`} sub={`${ind.completedTrainings} concluídos`} color="#34D399" icon={GraduationCap}/>
              </motion.div>
              <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.3}}>
                <KPICard title="Ações Abertas" value={ind.openActions} sub={`${ind.overdueActions} atrasadas`} color="#22D3EE" icon={Target}/>
              </motion.div>
              <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.35}}>
                <KPICard title="Exames Vencendo" value={ind.expiringExams} sub="Próximos 30 dias" color={ind.expiringExams>0?"#F87171":"#34D399"} icon={BarChart2}/>
              </motion.div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Accidents trend */}
              <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.4}} className="lg:col-span-2">
                <DarkCard className="p-5">
                  <p className="text-sm font-semibold text-slate-300 mb-4">Acidentes por Mês (últimos 6 meses)</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={ind.accidentsByMonth}>
                      <defs>
                        <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                      <XAxis dataKey="month" tick={{fill:"#64748B",fontSize:11}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fill:"#64748B",fontSize:11}} axisLine={false} tickLine={false} allowDecimals={false}/>
                      <Tooltip {...DARK_TOOLTIP}/>
                      <Area type="monotone" dataKey="count" stroke="#EF4444" strokeWidth={2} fill="url(#aGrad)" name="Acidentes"/>
                    </AreaChart>
                  </ResponsiveContainer>
                </DarkCard>
              </motion.div>

              {/* Training donut */}
              <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.5}}>
                <DarkCard className="p-5 flex flex-col items-center justify-center">
                  <p className="text-sm font-semibold text-slate-300 mb-4 self-start">Treinamentos</p>
                  <div className="relative">
                    <ResponsiveContainer width={160} height={160}>
                      <PieChart>
                        <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                          {PIE_DATA.map((entry, index) => <Cell key={index} fill={entry.color}/>)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-2xl font-bold text-white font-mono">{ind.totalTrainings > 0 ? Math.round((ind.completedTrainings/ind.totalTrainings)*100) : 0}%</p>
                      <p className="text-[10px] text-slate-500">concluídos</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 self-start w-full">
                    <div className="flex justify-between text-xs"><span className="text-slate-500">Concluídos</span><span className="text-emerald-400 font-mono">{ind.completedTrainings}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-slate-500">Total</span><span className="text-slate-300 font-mono">{ind.totalTrainings}</span></div>
                  </div>
                </DarkCard>
              </motion.div>
            </div>

            {/* Meta comparison table */}
            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.6}}>
              <DarkCard className="p-5">
                <p className="text-sm font-semibold text-slate-300 mb-4">Painel de Metas SST</p>
                <div className="space-y-3">
                  {[
                    { label: "Acidentes de Trabalho", value: ind.totalAccidents, meta: 0, unit: "ocorrências", inverse: true },
                    { label: "Taxa de Frequência (TAFAC)", value: ind.tafac, meta: 5.0, unit: "×10⁶ HH", inverse: true },
                    { label: "Horas de Treinamento/Funcionário", value: ind.activeEmployees > 0 ? (ind.trainingHours/ind.activeEmployees).toFixed(1) : 0, meta: 20, unit: "horas/ano", inverse: false },
                    { label: "Ações do Plano no Prazo", value: ind.openActions === 0 ? 100 : Math.max(0, 100 - Math.round((ind.overdueActions/ind.openActions)*100)), meta: 90, unit: "%", inverse: false },
                  ].map(item => {
                    const pct = item.meta === 0 ? (item.value === 0 ? 100 : 0) : Math.min(100, Math.round((Number(item.value) / item.meta) * 100));
                    const ok = item.inverse ? Number(item.value) <= item.meta : Number(item.value) >= item.meta;
                    return (
                      <div key={item.label} className="flex items-center gap-4">
                        <div className="w-48 flex-shrink-0">
                          <p className="text-xs text-slate-300">{item.label}</p>
                        </div>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, pct)}%` }}
                            transition={{ duration: 1, delay: 0.7 }}
                            className="h-full rounded-full" style={{ background: ok ? "#34D399" : "#EF4444" }}/>
                        </div>
                        <div className="w-24 text-right flex-shrink-0">
                          <span className={`text-xs font-mono font-bold ${ok ? "text-emerald-400" : "text-red-400"}`}>{item.value} {item.unit}</span>
                        </div>
                        <div className="w-16 text-right flex-shrink-0">
                          <span className="text-[10px] text-slate-600">meta: {item.meta} {item.unit}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </DarkCard>
            </motion.div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
