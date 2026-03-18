import { useState } from "react";
import { motion } from "framer-motion";
import {
  Megaphone, Plus, Edit, Trash2, Calendar, Users, Target,
  ScrollText, Clock, Shield, Activity, Tag,
  UserCog, ShieldCheck, UserCheck
} from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { trpc } from "@/lib/trpc";
import {
  DarkPageHeader, DarkCard, DarkBadge, DarkSearch, FilterPills,
  DarkButton, IconBtn, DarkModal, DarkField, DarkInput, DarkSelect,
  DarkTextarea, DarkEmptyState, MiniStats, CardSkeleton, Skeleton, DarkTable, DarkTr, DarkTd
} from "@/components/shared/DarkUI";

/* ═══════════════════════════════════════════════════════════════
   CAMPAIGNS
═══════════════════════════════════════════════════════════════ */
const CAMP_FILTERS = [
  { label: "Todas", value: "todos" },
  { label: "Planejada", value: "planejada" },
  { label: "Em Andamento", value: "em_andamento" },
  { label: "Concluída", value: "concluida" },
];

type CampForm = { title: string; theme: string; startDate: string; endDate: string; target: string; description: string };
const CAMP_EMPTY: CampForm = { title: "", theme: "", startDate: "", endDate: "", target: "Todos", description: "" };

const statusColor: Record<string, string> = {
  em_andamento: "#3B82F6", concluida: "#22C55E", planejada: "#94A3B8",
};

export function CampaignsList() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todos");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CampForm>(CAMP_EMPTY);

  const { data = [], isLoading, refetch } = trpc.campaigns.list.useQuery();
  const createMut = trpc.campaigns.create.useMutation({ onSuccess: () => { setShowModal(false); setForm(CAMP_EMPTY); refetch(); } });
  const deleteMut = trpc.campaigns.delete.useMutation({ onSuccess: () => refetch() });

  const filtered = data.filter(c => {
    const match = c.title?.toLowerCase().includes(search.toLowerCase()) || c.theme?.toLowerCase().includes(search.toLowerCase());
    return match && (filter === "todos" || c.status === filter);
  });

  const f = (k: keyof CampForm) => (e: React.ChangeEvent<any>) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <MainLayout title="Campanhas">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`}</style>
      <div className="p-5 lg:p-7 space-y-5" style={{ fontFamily: "'Sora', sans-serif" }}>

        <DarkPageHeader title="Campanhas de Segurança" description="Planejamento e execução de campanhas de prevenção"
          icon={Megaphone} accent="#F472B6"
          action={<DarkButton onClick={() => setShowModal(true)}><Plus className="w-4 h-4" />Nova Campanha</DarkButton>}
        />

        {!isLoading && (
          <MiniStats items={[
            { label: "Total", value: data.length },
            { label: "Ativas", value: data.filter(c => c.status === "em_andamento").length, color: "#60A5FA" },
            { label: "Planejadas", value: data.filter(c => c.status === "planejada").length, color: "#94A3B8" },
            { label: "Concluídas", value: data.filter(c => c.status === "concluida").length, color: "#34D399" },
          ]} />
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 max-w-sm"><DarkSearch value={search} onChange={setSearch} placeholder="Buscar campanhas..." /></div>
          <FilterPills options={CAMP_FILTERS} value={filter} onChange={setFilter} />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <DarkEmptyState icon={Megaphone} accent="#F472B6"
            title="Nenhuma campanha encontrada"
            description="Crie campanhas de segurança e bem-estar."
            action={!search && <DarkButton onClick={() => setShowModal(true)}><Plus className="w-4 h-4" />Criar campanha</DarkButton>}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <DarkCard className="overflow-hidden hover:border-white/10 transition-colors">
                  {/* status bar */}
                  <div className="h-0.5" style={{ background: statusColor[c.status || "planejada"] || "#64748B" }} />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(244,114,182,0.12)" }}>
                        <Megaphone className="w-4 h-4 text-pink-400" />
                      </div>
                      <DarkBadge status={c.status || "planejada"} />
                    </div>
                    <h3 className="font-semibold text-white mb-1 text-sm leading-snug">{c.title}</h3>
                    {c.theme && (
                      <div className="flex items-center gap-1.5 mb-3">
                        <Tag className="w-3 h-3 text-slate-500" />
                        <span className="text-xs text-slate-500">{c.theme}</span>
                      </div>
                    )}
                    <div className="space-y-1.5 mt-3">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{c.startDate ? new Date(c.startDate).toLocaleDateString("pt-BR") : "—"}</span>
                        {c.endDate && <><span>→</span><span>{new Date(c.endDate).toLocaleDateString("pt-BR")}</span></>}
                      </div>
                      {c.target && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Users className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Público: {c.target}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1 px-4 py-2.5 border-t border-white/4">
                    <IconBtn icon={Edit} title="Editar" color="text-slate-500 hover:text-blue-400" />
                    <IconBtn icon={Trash2} title="Excluir" color="text-slate-500 hover:text-red-400"
                      onClick={() => { if (confirm("Excluir esta campanha?")) deleteMut.mutate({ id: c.id }); }} />
                  </div>
                </DarkCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <DarkModal open={showModal} onClose={() => setShowModal(false)} title="Nova Campanha">
        <div className="space-y-4">
          <DarkField label="Título" required>
            <DarkInput value={form.title} onChange={f("title")} placeholder="SIPAT 2025" />
          </DarkField>
          <div className="grid grid-cols-2 gap-4">
            <DarkField label="Tema">
              <DarkInput value={form.theme} onChange={f("theme")} placeholder="Saúde e Bem-estar" />
            </DarkField>
            <DarkField label="Público-alvo">
              <DarkInput value={form.target} onChange={f("target")} placeholder="Todos" />
            </DarkField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DarkField label="Data de Início" required>
              <DarkInput type="date" value={form.startDate} onChange={f("startDate")} />
            </DarkField>
            <DarkField label="Data de Término">
              <DarkInput type="date" value={form.endDate} onChange={f("endDate")} />
            </DarkField>
          </div>
          <DarkField label="Descrição">
            <DarkTextarea value={form.description} onChange={f("description")} rows={3} placeholder="Descreva os objetivos e atividades..." />
          </DarkField>
          <div className="flex justify-end gap-3 pt-2 border-t border-white/6">
            <DarkButton variant="ghost" onClick={() => setShowModal(false)}>Cancelar</DarkButton>
            <DarkButton onClick={() => createMut.mutate({ title: form.title, theme: form.theme, startDate: form.startDate, endDate: form.endDate || undefined, target: form.target, description: form.description })}
              disabled={createMut.isPending || !form.title || !form.startDate}>
              {createMut.isPending ? "Salvando..." : "Criar Campanha"}
            </DarkButton>
          </div>
        </div>
      </DarkModal>
    </MainLayout>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AUDIT LOG
═══════════════════════════════════════════════════════════════ */
const ACTION_ICON: Record<string, { icon: any; color: string }> = {
  CREATE: { icon: Plus, color: "#34D399" },
  UPDATE: { icon: Edit, color: "#60A5FA" },
  DELETE: { icon: Trash2, color: "#F87171" },
  LOGIN:  { icon: UserCheck, color: "#A78BFA" },
  LOGOUT: { icon: Shield, color: "#94A3B8" },
};

export function AuditList() {
  const [search, setSearch] = useState("");
  const { data = [], isLoading } = trpc.audit.list.useQuery();

  const filtered = data.filter(l => {
    const q = search.toLowerCase();
    return (l.action?.toLowerCase().includes(q) || l.entityType?.toLowerCase().includes(q) || l.userId?.toString().includes(q));
  });

  return (
    <MainLayout title="Auditoria">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`}</style>
      <div className="p-5 lg:p-7 space-y-5" style={{ fontFamily: "'Sora', sans-serif" }}>

        <DarkPageHeader title="Log de Auditoria" description="Rastreamento de todas as ações no sistema"
          icon={ScrollText} accent="#64748B" />

        {/* Timeline stats */}
        {!isLoading && (
          <MiniStats items={[
            { label: "Total de registros", value: data.length },
            { label: "Criações", value: data.filter(l => l.action === "CREATE").length, color: "#34D399" },
            { label: "Edições", value: data.filter(l => l.action === "UPDATE").length, color: "#60A5FA" },
            { label: "Exclusões", value: data.filter(l => l.action === "DELETE").length, color: "#F87171" },
          ]} />
        )}

        <div className="max-w-sm">
          <DarkSearch value={search} onChange={setSearch} placeholder="Buscar ação, entidade..." />
        </div>

        {isLoading ? (
          <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <DarkEmptyState icon={ScrollText} accent="#64748B"
            title="Sem registros de auditoria"
            description="Ações do sistema aparecerão aqui automaticamente." />
        ) : (
          <DarkCard>
            <div className="divide-y divide-white/4">
              {filtered.map((log, i) => {
                const cfg = ACTION_ICON[log.action || ""] || { icon: Activity, color: "#94A3B8" };
                const Icon = cfg.icon;
                return (
                  <motion.div key={log.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    className="flex items-start gap-4 px-5 py-4 hover:bg-white/2 transition-colors">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${cfg.color}15` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold font-mono" style={{ color: cfg.color }}>{log.action}</span>
                        {log.entityType && (
                          <span className="text-xs text-slate-400 font-mono bg-white/4 px-2 py-0.5 rounded">{log.entityType}</span>
                        )}
                        {log.entityId && (
                          <span className="text-[10px] text-slate-600 font-mono">#{log.entityId}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {log.userId && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <UserCog className="w-3 h-3" />Usuário #{log.userId}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {log.createdAt ? new Date(log.createdAt).toLocaleString("pt-BR") : "—"}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </DarkCard>
        )}
      </div>
    </MainLayout>
  );
}

/* ═══════════════════════════════════════════════════════════════
   USERS
═══════════════════════════════════════════════════════════════ */
const ROLE_CFG: Record<string, { label: string; color: string; icon: any }> = {
  admin:        { label: "Administrador", color: "#F59E0B", icon: ShieldCheck },
  supervisor:   { label: "Supervisor",    color: "#60A5FA", icon: UserCog },
  operacional:  { label: "Operacional",   color: "#34D399", icon: UserCheck },
};

const USER_HEADERS = ["Usuário", "Cargo / Setor", "Role", "Último acesso", "Status", ""];

type UserForm = { name: string; email: string; password: string; role: string; sector: string };
const USER_EMPTY: UserForm = { name: "", email: "", password: "", role: "operacional", sector: "" };

export function UsersList() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<UserForm>(USER_EMPTY);
  const [search, setSearch] = useState("");

  const { data = [], isLoading, refetch } = trpc.users.list.useQuery();
  const createMut = trpc.users.create.useMutation({ onSuccess: () => { setShowModal(false); setForm(USER_EMPTY); refetch(); } });
  const toggleMut = trpc.users.toggleActive.useMutation({ onSuccess: () => refetch() });

  const filtered = data.filter(u => {
    const q = search.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  const f = (k: keyof UserForm) => (e: React.ChangeEvent<any>) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <MainLayout title="Usuários">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`}</style>
      <div className="p-5 lg:p-7 space-y-5" style={{ fontFamily: "'Sora', sans-serif" }}>

        <DarkPageHeader title="Gerenciamento de Usuários" description="Controle de acesso e permissões"
          icon={Users} accent="#60A5FA"
          action={<DarkButton onClick={() => setShowModal(true)}><Plus className="w-4 h-4" />Novo Usuário</DarkButton>}
        />

        {!isLoading && (
          <MiniStats items={[
            { label: "Total", value: data.length },
            { label: "Ativos", value: data.filter(u => u.active).length, color: "#34D399" },
            { label: "Admins", value: data.filter(u => u.role === "admin").length, color: "#F59E0B" },
            { label: "Supervisores", value: data.filter(u => u.role === "supervisor").length, color: "#60A5FA" },
          ]} />
        )}

        <div className="max-w-sm">
          <DarkSearch value={search} onChange={setSearch} placeholder="Buscar usuários..." />
        </div>

        <DarkTable headers={USER_HEADERS} loading={isLoading}
          empty={!isLoading && filtered.length === 0}>
          {filtered.map((u, i) => {
            const roleCfg = ROLE_CFG[u.role || "operacional"];
            const RoleIcon = roleCfg.icon;
            return (
              <DarkTr key={u.id}>
                <DarkTd>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: `${roleCfg.color}25`, color: roleCfg.color }}>
                      {u.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{u.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{u.email}</p>
                    </div>
                  </motion.div>
                </DarkTd>
                <DarkTd>
                  <span className="text-slate-400 text-xs">{u.sector || "—"}</span>
                </DarkTd>
                <DarkTd>
                  <div className="flex items-center gap-1.5">
                    <RoleIcon className="w-3.5 h-3.5" style={{ color: roleCfg.color }} />
                    <span className="text-xs font-medium" style={{ color: roleCfg.color }}>{roleCfg.label}</span>
                  </div>
                </DarkTd>
                <DarkTd>
                  <span className="text-xs font-mono text-slate-500">
                    {u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleDateString("pt-BR") : "Nunca"}
                  </span>
                </DarkTd>
                <DarkTd>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${u.active ? "text-emerald-400 bg-emerald-400/10" : "text-slate-500 bg-slate-500/10"}`}>
                    {u.active ? "Ativo" : "Inativo"}
                  </span>
                </DarkTd>
                <DarkTd className="text-right">
                  <DarkButton variant="ghost" size="sm"
                    onClick={() => toggleMut.mutate({ id: u.id, active: !u.active })}>
                    {u.active ? "Desativar" : "Ativar"}
                  </DarkButton>
                </DarkTd>
              </DarkTr>
            );
          })}
        </DarkTable>

        {!isLoading && filtered.length === 0 && (
          <DarkEmptyState icon={Users} accent="#60A5FA"
            title="Nenhum usuário encontrado"
            description="Crie usuários para dar acesso ao sistema."
            action={!search && <DarkButton onClick={() => setShowModal(true)}><Plus className="w-4 h-4" />Criar usuário</DarkButton>}
          />
        )}
      </div>

      <DarkModal open={showModal} onClose={() => setShowModal(false)} title="Novo Usuário">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <DarkField label="Nome completo" required>
              <DarkInput value={form.name} onChange={f("name")} placeholder="João da Silva" />
            </DarkField>
            <DarkField label="E-mail" required>
              <DarkInput type="email" value={form.email} onChange={f("email")} placeholder="joao@empresa.com" />
            </DarkField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DarkField label="Senha" required>
              <DarkInput type="password" value={form.password} onChange={f("password")} placeholder="Mínimo 6 caracteres" />
            </DarkField>
            <DarkField label="Setor">
              <DarkInput value={form.sector} onChange={f("sector")} placeholder="Produção" />
            </DarkField>
          </div>
          <DarkField label="Nível de Acesso" required>
            <DarkSelect value={form.role} onChange={f("role")}>
              <option value="operacional">Operacional</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Administrador</option>
            </DarkSelect>
          </DarkField>
          <div className="flex justify-end gap-3 pt-2 border-t border-white/6">
            <DarkButton variant="ghost" onClick={() => setShowModal(false)}>Cancelar</DarkButton>
            <DarkButton onClick={() => createMut.mutate(form as any)} disabled={createMut.isPending || !form.name || !form.email || !form.password}>
              {createMut.isPending ? "Criando..." : "Criar Usuário"}
            </DarkButton>
          </div>
        </div>
      </DarkModal>
    </MainLayout>
  );
}


