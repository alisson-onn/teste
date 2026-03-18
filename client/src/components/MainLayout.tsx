import { useState, useEffect, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, AlertTriangle, Stethoscope, GraduationCap,
  ClipboardCheck, FileText, Megaphone, ScrollText, Users, Bot,
  ChevronLeft, Menu, LogOut, ChevronRight, FlaskConical, CalendarOff, CalendarDays,
  UserCheck, Network, Target, Syringe, ShieldCheck,
  BookOpen, Shield, Send, TrendingUp,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { NotificationsPanel } from "@/components/Notifications";
import { GlobalSearchTrigger } from "@/components/GlobalSearch";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const FONT      = "'Sora', sans-serif";
const BG_MAIN   = "#060B14";
const BG_SIDE   = "#0A1020";
const BORDER    = "rgba(255,255,255,0.06)";
const EASE      = "cubic-bezier(0.4, 0, 0.2, 1)";
const DUR       = "0.26s";

// ─── Layout constants ──────────────────────────────────────────────────────────
const W_OPEN  = 240;   // expanded sidebar width px
const W_CLOSE = 60;    // collapsed sidebar width px
const ITEM_H  = 36;    // ← single source of truth for ALL nav item heights
const ICON_SZ = 15;    // icon size px — uniform everywhere
const FONT_SZ = "12.5px"; // label font size — uniform everywhere

// ─── Nav data ─────────────────────────────────────────────────────────────────
interface NavItem  { href: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; label: string }
interface NavGroup { label: string; items: NavItem[] }

const NAV_TOP: NavItem = { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" };

const NAV: NavGroup[] = [
  { label: "Ocorrências", items: [
    { href: "/acidentes",         icon: AlertTriangle, label: "Acidentes do Trabalho" },
    { href: "/acidentes/analise", icon: TrendingUp,    label: "Análise de Acidentes"  },
  ]},
  { label: "Saúde Ocupacional", items: [
    { href: "/doencas",    icon: Stethoscope, label: "Doenças Ocup." },
    { href: "/atestados",  icon: FileText,    label: "Atestados"     },
    { href: "/absenteismo",icon: CalendarOff, label: "Absenteísmo"   },
  ]},
  { label: "Prevenção & Gestão", items: [
    { href: "/agenda",       icon: CalendarDays,   label: "Agenda Inteligente" },
    { href: "/treinamentos", icon: GraduationCap,  label: "Treinamentos"       },
    { href: "/inspecoes",    icon: ClipboardCheck, label: "Inspeções"          },
    { href: "/campanhas",    icon: Megaphone,      label: "Campanhas"          },
    { href: "/cipa",         icon: Shield,         label: "CIPA"               },
  ]},
  { label: "Sistema", items: [
    { href: "/usuarios",  icon: Users,      label: "Usuários"  },
    { href: "/auditoria", icon: ScrollText, label: "Auditoria" },
  ]},
];

const NAV_DEV: NavItem[] = [
  { href: "/funcionarios", icon: UserCheck,   label: "Funcionários"       },
  { href: "/plano-acao",   icon: Target,      label: "Plano de Ação 5W2H" },
  { href: "/exames",       icon: Syringe,     label: "PCMSO / ASO"        },
  { href: "/epis",         icon: ShieldCheck, label: "Controle de EPIs"   },
  { href: "/ghe",          icon: Network,     label: "GHE + Riscos"       },
  { href: "/pgr",          icon: BookOpen,    label: "PGR / LTCAT"        },
  { href: "/esocial",      icon: Send,        label: "eSocial"            },
];

// ─── Label collapse animation ──────────────────────────────────────────────────
// Animates opacity + max-width when sidebar expands/collapses.
// "show" timings are slightly slower to feel smoother on expansion.
function labelStyle(show: boolean): React.CSSProperties {
  return {
    opacity:       show ? 1 : 0,
    maxWidth:      show ? 180 : 0,
    overflow:      "hidden",
    whiteSpace:    "nowrap",
    flexShrink:    1,
    pointerEvents: show ? "auto" : "none",
    transition: [
      `opacity   ${show ? "0.18s" : "0.07s"} ease`,
      `max-width ${show ? "0.24s" : "0.08s"} ${EASE}`,
    ].join(", "),
  };
}

// ─── Separator ─────────────────────────────────────────────────────────────────
// Visible only when collapsed; fades + shrinks margin when expanding.
function Separator({ visible }: { visible: boolean }) {
  return (
    <div style={{
      height:     1,
      margin:     visible ? "5px 12px" : "0 12px",
      background: BORDER,
      opacity:    visible ? 1 : 0,
      transition: `opacity ${DUR} ease, margin ${DUR} ease`,
      pointerEvents: "none",
    }} />
  );
}

// ─── Tooltip portal ────────────────────────────────────────────────────────────
interface TipState { label: string; y: number }

const PortalTip = memo(function PortalTip({ tip }: { tip: TipState | null }) {
  return createPortal(
    <AnimatePresence>
      {tip && (
        <motion.div
          key={tip.label}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -4 }}
          transition={{ duration: 0.12, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position:      "fixed",
            left:          W_CLOSE + 8,
            top:           tip.y,
            transform:     "translateY(-50%)",
            zIndex:        9999,
            pointerEvents: "none",
            fontFamily:    FONT,
          }}
        >
          {/* Arrow */}
          <div style={{
            position: "absolute", right: "100%", top: "50%",
            transform: "translateY(-50%)",
            width: 0, height: 0,
            borderTop: "4px solid transparent",
            borderBottom: "4px solid transparent",
            borderRight: "4px solid #1e293b",
          }} />
          <div style={{
            background:     "#1e293b",
            border:         "1px solid rgba(255,255,255,0.10)",
            backdropFilter: "blur(16px)",
            borderRadius:   7,
            padding:        "5px 11px",
            fontSize:       12,
            fontWeight:     500,
            color:          "#e2e8f0",
            boxShadow:      "0 4px 20px rgba(0,0,0,0.5)",
            whiteSpace:     "nowrap",
            letterSpacing:  "0.01em",
          }}>
            {tip.label}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
});

// ─── Nav item row ──────────────────────────────────────────────────────────────
// Single component used for ALL rows (main nav, AI, dev items).
// accent: "blue" | "amber" | "purple"
// layoutId: framer-motion shared layout id for the active pill
interface NavRowProps {
  href:      string;
  icon:      React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label:     string;
  isActive:  boolean;
  collapsed: boolean;
  accent?:   "blue" | "amber" | "purple";
  layoutId?: string;
  itemH?:    number;
  tip$:      (label: string) => object;
}

const ACCENT_CONFIG = {
  blue:   { bg: "rgba(59,130,246,0.12)",  bar: "#3b82f6", icon: "text-blue-400",   text: "text-blue-300"   },
  amber:  { bg: "rgba(245,158,11,0.10)",  bar: "#f59e0b", icon: "text-amber-400",  text: "text-amber-300"  },
  purple: { bg: "rgba(139,92,246,0.14)",  bar: "#a78bfa", icon: "text-purple-400", text: "text-purple-300" },
};

const NavRow = memo(function NavRow({
  href, icon: Icon, label, isActive, collapsed,
  accent = "blue", layoutId = "sidebarActive",
  itemH = ITEM_H, tip$,
}: NavRowProps) {
  const cfg = ACCENT_CONFIG[accent];
  return (
    <div className="relative" {...tip$(label)}>
      {/* Active background pill */}
      {isActive && (
        <motion.div
          layoutId={layoutId}
          className="absolute inset-0 rounded-lg"
          style={{ background: cfg.bg }}
          transition={{ type: "spring", bounce: 0, duration: 0.28 }}
        />
      )}
      {/* Active left indicator bar */}
      {isActive && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-r-full"
          style={{ height: 14, background: cfg.bar }}
        />
      )}
      <a
        href={href}
        style={{ height: itemH }}
        className={[
          "relative flex items-center rounded-lg transition-colors",
          collapsed ? "justify-center px-0" : "gap-2.5 px-3",
          isActive ? "" : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]",
        ].join(" ")}
      >
        <Icon
          className={[
            `flex-shrink-0 transition-colors`,
            isActive ? cfg.icon : "",
          ].join(" ")}
          style={{ width: ICON_SZ, height: ICON_SZ }}
        />
        <span
          style={{ ...labelStyle(!collapsed), fontSize: FONT_SZ }}
          className={`font-medium leading-none ${isActive ? cfg.text : ""}`}
        >
          {label}
        </span>
      </a>
    </div>
  );
});

// ─── Group label ───────────────────────────────────────────────────────────────
function GroupLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  return (
    <div style={{
      height:      collapsed ? 0 : 22,
      opacity:     collapsed ? 0 : 1,
      overflow:    "hidden",
      paddingLeft: 12,
      display:     "flex",
      alignItems:  "flex-end",
      paddingBottom: 3,
      transition:  `height ${DUR} ${EASE}, opacity 0.14s ease`,
    }}>
      <span className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.08em]">
        {label}
      </span>
    </div>
  );
}

// ─── Group spacer ──────────────────────────────────────────────────────────────
// 8px when expanded, 2px when collapsed (groups visually compress)
function GroupSpacer({ collapsed }: { collapsed: boolean }) {
  return (
    <div style={{
      height:     collapsed ? 2 : 8,
      transition: `height ${DUR} ease`,
      flexShrink: 0,
    }} />
  );
}

// ─── Sidebar content ───────────────────────────────────────────────────────────
// Defined OUTSIDE MainLayout so React never unmounts/remounts on parent re-renders.
interface SidebarProps {
  collapsed:    boolean;
  setCollapsed: (fn: (c: boolean) => boolean) => void;
  devOpen:      boolean;
  setDevOpen:   (fn: (o: boolean) => boolean) => void;
  location:     string;
  onLogout:     () => void;
}

function SidebarContent({
  collapsed, setCollapsed, devOpen, setDevOpen, location, onLogout,
}: SidebarProps) {
  const [tip, setTip] = useState<TipState | null>(null);

  useEffect(() => { if (!collapsed) setTip(null); }, [collapsed]);

  const showTip = useCallback((e: React.MouseEvent, label: string) => {
    if (!collapsed) return;
    setTip({ label, y: e.clientY });
  }, [collapsed]);

  const moveTip = useCallback((e: React.MouseEvent) => {
    if (!collapsed) return;
    setTip(t => t ? { ...t, y: e.clientY } : null);
  }, [collapsed]);

  const hideTip = useCallback(() => setTip(null), []);

  // Returns spread-able mouse event handlers for tooltip
  const tip$ = useCallback((label: string) => ({
    onMouseEnter: (e: React.MouseEvent) => showTip(e, label),
    onMouseMove:  (e: React.MouseEvent) => moveTip(e),
    onMouseLeave: hideTip,
  }), [showTip, moveTip, hideTip]);

  const active = useCallback((href: string) => {
    if (href === "/dashboard")        return location === "/dashboard";
    if (href === "/acidentes")        return location === "/acidentes";
    if (href === "/acidentes/analise") return location.startsWith("/acidentes/analise");
    return location.startsWith(href);
  }, [location]);

  // Shared props for NavRow
  const row = (item: NavItem, opts?: Partial<NavRowProps>) => ({
    ...item,
    isActive:  active(item.href),
    collapsed,
    tip$,
    ...opts,
  });

  return (
    <div className="flex flex-col h-full select-none" style={{ fontFamily: FONT }}>
      <PortalTip tip={tip} />

      {/* ── Header / logo ────────────────────────────────────── */}
      <div
        className="relative flex items-center flex-shrink-0"
        style={{ height: 56, borderBottom: `1px solid ${BORDER}`, padding: "0 10px" }}
      >
        {/* Brand icon */}
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background:  "linear-gradient(135deg,#3B82F6,#06B6D4)",
            marginLeft:  collapsed ? "auto" : 2,
            marginRight: collapsed ? "auto" : 0,
            transition:  `margin ${DUR} ${EASE}`,
          }}
        >
          <Shield className="text-white" style={{ width: 14, height: 14 }} />
        </div>

        {/* Brand text */}
        <div style={{ ...labelStyle(!collapsed), paddingLeft: collapsed ? 0 : 10 }}>
          <p className="text-[13px] font-bold text-white leading-none tracking-tight">SID</p>
          <p className="text-[9px] text-slate-500 mt-[3px] tracking-wide">Sistema de Inteligência</p>
        </div>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
          className="hidden lg:flex absolute right-2 top-1/2 -translate-y-1/2
            w-6 h-6 rounded-md items-center justify-center
            text-slate-600 hover:text-slate-300 hover:bg-white/[0.06]
            transition-colors duration-150 z-10 focus:outline-none"
        >
          <span style={{
            display: "inline-block",
            transition: `transform ${DUR} ${EASE}`,
            transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
          }}>
            <ChevronLeft style={{ width: 12, height: 12 }} />
          </span>
        </button>
      </div>

      {/* ── Main navigation ──────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2">

        {/* Dashboard — standalone top item */}
        <NavRow {...row(NAV_TOP)} />

        <Separator visible={collapsed} />

        {/* Section groups */}
        {NAV.map((group, gi) => (
          <div key={group.label}>
            {gi > 0 && <GroupSpacer collapsed={collapsed} />}
            {collapsed && gi > 0 && <Separator visible={collapsed} />}

            <GroupLabel label={group.label} collapsed={collapsed} />

            <div className="space-y-px">
              {group.items.map(item => (
                <NavRow key={item.href} {...row(item)} />
              ))}
            </div>
          </div>
        ))}

        {/* ── Em Desenvolvimento (beta) ─────────────────────── */}
        {/* OCULTO TEMPORARIAMENTE — para reexibir, remova este comentário e o do final do bloco
        <GroupSpacer collapsed={collapsed} />
        <Separator visible={collapsed} />

        <div className="relative" {...tip$("Em desenvolvimento")}>
          <button
            onClick={() => !collapsed && setDevOpen(o => !o)}
            style={{ height: ITEM_H }}
            className={[
              "w-full flex items-center rounded-lg transition-colors",
              "text-slate-500 hover:text-amber-400/80 hover:bg-amber-400/[0.05]",
              collapsed ? "justify-center px-0" : "gap-2.5 px-3",
            ].join(" ")}
          >
            <FlaskConical
              className="flex-shrink-0 text-amber-500/60"
              style={{ width: ICON_SZ, height: ICON_SZ }}
            />
            <span
              style={{ ...labelStyle(!collapsed), fontSize: "11px" }}
              className="font-semibold text-amber-600/70 uppercase tracking-[0.07em] flex-1 text-left"
            >
              Em desenvolvimento
            </span>
            <span style={{
              ...labelStyle(!collapsed),
              transition: [
                `opacity   ${!collapsed ? "0.18s" : "0.07s"} ease`,
                `max-width ${!collapsed ? "0.24s" : "0.08s"} ${EASE}`,
                `transform 0.22s ${EASE}`,
              ].join(", "),
              display:   "inline-flex",
              transform: devOpen ? "rotate(90deg)" : "rotate(0deg)",
            }}>
              <ChevronRight style={{ width: 12, height: 12 }} className="text-amber-600/50" />
            </span>
          </button>

          <AnimatePresence>
            {devOpen && !collapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div
                  className="mt-1 mx-1 rounded-xl border border-amber-500/[0.08] overflow-hidden"
                  style={{ background: "rgba(245,158,11,0.025)" }}
                >
                  <p className="text-[9px] text-amber-600/50 px-3 pt-2.5 pb-1.5 font-medium tracking-wide uppercase">
                    Disponíveis em breve
                  </p>
                  <div className="pb-1.5 px-1 space-y-px">
                    {NAV_DEV.map(item => (
                      <NavRow
                        key={item.href}
                        {...row(item, {
                          accent:   "amber",
                          layoutId: "sidebarActiveDev",
                        })}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        */}
      </nav>

      {/* ── Assistente IA ────────────────────────────────────── */}
      <div
        className="px-2 flex-shrink-0"
        style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 6, paddingBottom: 6 }}
      >
        <NavRow
          {...row(
            { href: "/ia-chat", icon: Bot, label: "Assistente IA" },
            { accent: "purple", layoutId: "sidebarActiveAI" }
          )}
        />
      </div>

      {/* ── User footer ──────────────────────────────────────── */}
      <div
        className="flex-shrink-0 px-2"
        style={{
          borderTop:     `1px solid ${BORDER}`,
          paddingTop:    8,
          paddingBottom: 10,
        }}
      >
        <div
          className="relative"
          {...(collapsed ? tip$("Administrador · Sair") : {})}
        >
          <div
            style={{ height: ITEM_H + 4 }}
            className={[
              "flex items-center gap-2.5 px-2 rounded-lg",
              collapsed ? "justify-center" : "",
            ].join(" ")}
          >
            {/* Avatar */}
            <div
              className="rounded-full flex-shrink-0 flex items-center justify-center"
              style={{
                width:      26,
                height:     26,
                background: "linear-gradient(135deg, #3B82F6, #06B6D4)",
              }}
            >
              <span className="text-white text-[10px] font-bold leading-none">A</span>
            </div>

            {/* Name + email */}
            <div style={labelStyle(!collapsed)} className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-slate-200 whitespace-nowrap leading-none">
                Administrador
              </p>
              <p className="text-[10px] text-slate-500 whitespace-nowrap mt-[5px]">
                admin@sid.com
              </p>
            </div>

            {/* Logout button */}
            <span style={labelStyle(!collapsed)}>
              <button
                onClick={onLogout}
                title="Sair"
                className="w-6 h-6 flex items-center justify-center rounded-md
                  text-slate-600 hover:text-red-400 hover:bg-red-400/[0.08]
                  transition-colors duration-150 flex-shrink-0 focus:outline-none"
              >
                <LogOut style={{ width: 14, height: 14 }} />
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MainLayout ────────────────────────────────────────────────────────────────
interface MainLayoutProps { children: React.ReactNode; title?: string }

export default function MainLayout({ children, title }: MainLayoutProps) {
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [devOpen, setDevOpen]       = useState(false);
  const [location, navigate]        = useLocation();
  const logoutMut = trpc.auth.logout.useMutation({ onSuccess: () => navigate("/login") });

  useEffect(() => { setMobileOpen(false); }, [location]);

  const sidebarProps: SidebarProps = {
    collapsed, setCollapsed,
    devOpen, setDevOpen,
    location,
    onLogout: () => logoutMut.mutate(),
  };

  const sidebarStyle: React.CSSProperties = {
    width:       collapsed ? W_CLOSE : W_OPEN,
    minWidth:    collapsed ? W_CLOSE : W_OPEN,
    transition:  `width ${DUR} ${EASE}, min-width ${DUR} ${EASE}`,
    willChange:  "width",
    background:  BG_SIDE,
    borderRight: `1px solid ${BORDER}`,
    overflow:    "visible",   // labels use max-width collapse; tooltips must escape
    position:    "relative",
    zIndex:      20,
  };

  return (
    <div className="min-h-screen flex" style={{ background: BG_MAIN, fontFamily: FONT }}>

      {/* ── Desktop sidebar ─────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col flex-shrink-0 h-screen sticky top-0"
        style={sidebarStyle}
      >
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* ── Mobile overlay + drawer ─────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -W_OPEN }} animate={{ x: 0 }} exit={{ x: -W_OPEN }}
              transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
              className="fixed left-0 top-0 h-full z-50 lg:hidden flex flex-col overflow-hidden"
              style={{ width: W_OPEN, background: BG_SIDE, borderRight: `1px solid ${BORDER}` }}
            >
              <SidebarContent {...sidebarProps} collapsed={false} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header
          className="h-14 flex items-center gap-3 px-5 flex-shrink-0 sticky top-0 z-30"
          style={{ background: BG_MAIN, borderBottom: `1px solid ${BORDER}` }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-slate-500 hover:text-white p-1.5 rounded-lg
              hover:bg-white/5 transition-colors focus:outline-none"
          >
            <Menu style={{ width: 16, height: 16 }} />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[12px] text-slate-500 flex-1 min-w-0">
            <span className="font-medium">SID</span>
            <span className="text-slate-700">/</span>
            <span className="text-slate-300 font-medium truncate">{title || "Dashboard"}</span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <GlobalSearchTrigger />
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg mr-1"
              style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}` }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-slate-500">Online</span>
            </div>
            <NotificationsPanel />
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
