import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: number; label: string };
  className?: string;
}

export function KpiCard({ title, value, subtitle, icon: Icon, iconColor = "text-blue-600", iconBg = "bg-blue-100", trend, className }: KpiCardProps) {
  const isPositive = trend && trend.value > 0;
  const isNegative = trend && trend.value < 0;

  return (
    <div className={cn("bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow", className)}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconBg)}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            isPositive ? "text-red-600 bg-red-50" :
            isNegative ? "text-green-600 bg-green-50" :
            "text-slate-500 bg-slate-100"
          )}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> :
             isNegative ? <TrendingDown className="w-3 h-3" /> :
             <Minus className="w-3 h-3" />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm font-medium text-slate-600 mt-0.5">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        {trend && <p className="text-xs text-slate-400 mt-1">{trend.label}</p>}
      </div>
    </div>
  );
}

interface StatusBadgeProps {
  status: string;
  statusMap?: Record<string, { label: string; className: string }>;
}

const defaultStatusMap: Record<string, { label: string; className: string }> = {
  pendente: { label: "Pendente", className: "bg-yellow-100 text-yellow-700" },
  em_progresso: { label: "Em Progresso", className: "bg-blue-100 text-blue-700" },
  em_andamento: { label: "Em Andamento", className: "bg-blue-100 text-blue-700" },
  concluida: { label: "Concluída", className: "bg-green-100 text-green-700" },
  concluido: { label: "Concluído", className: "bg-green-100 text-green-700" },
  planejado: { label: "Planejado", className: "bg-slate-100 text-slate-700" },
  planejada: { label: "Planejada", className: "bg-slate-100 text-slate-700" },
  aberta: { label: "Aberta", className: "bg-orange-100 text-orange-700" },
  fechada: { label: "Fechada", className: "bg-slate-100 text-slate-600" },
  ativo: { label: "Ativo", className: "bg-green-100 text-green-700" },
  finalizado: { label: "Finalizado", className: "bg-slate-100 text-slate-600" },
  revisao: { label: "Em Revisão", className: "bg-purple-100 text-purple-700" },
  diagnosticada: { label: "Diagnosticada", className: "bg-orange-100 text-orange-700" },
  afastada: { label: "Afastada", className: "bg-red-100 text-red-700" },
  recuperada: { label: "Recuperada", className: "bg-green-100 text-green-700" },
  cronica: { label: "Crônica", className: "bg-purple-100 text-purple-700" },
};

export function StatusBadge({ status, statusMap = defaultStatusMap }: StatusBadgeProps) {
  const config = statusMap[status] || { label: status, className: "bg-slate-100 text-slate-600" };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", config.className)}>
      {config.label}
    </span>
  );
}

interface SeverityBadgeProps {
  severity: string;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const map: Record<string, { label: string; className: string }> = {
    leve: { label: "Leve", className: "bg-yellow-100 text-yellow-700" },
    moderado: { label: "Moderado", className: "bg-orange-100 text-orange-700" },
    grave: { label: "Grave", className: "bg-red-100 text-red-700" },
    fatal: { label: "Fatal", className: "bg-red-900 text-red-100" },
  };
  const config = map[severity] || { label: severity, className: "bg-slate-100 text-slate-600" };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold", config.className)}>
      {config.label}
    </span>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        {description && <p className="text-slate-500 mt-1 text-sm">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}
