import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, AlertCircle, ArrowRight, Lock, Mail } from "lucide-react";
import { trpc } from "@/lib/trpc";

function useTypewriter(words: string[], speed = 80, pause = 2000) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const word = words[index % words.length];
    const timeout = setTimeout(() => {
      if (!deleting) {
        setText(word.slice(0, text.length + 1));
        if (text.length + 1 === word.length) setTimeout(() => setDeleting(true), pause);
      } else {
        setText(word.slice(0, text.length - 1));
        if (text.length - 1 === 0) { setDeleting(false); setIndex(i => i + 1); }
      }
    }, deleting ? speed / 2 : speed);
    return () => clearTimeout(timeout);
  }, [text, deleting, index, words, speed, pause]);
  return text;
}

function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#060B14]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-blue-900/10 blur-[120px]" />
      <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-cyan-900/8 blur-[100px]" />
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#38BDF8" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-blue-400/40"
          style={{ left: `${15 + i * 14}%`, top: `${20 + (i % 3) * 25}%` }}
          animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.5, 1] }}
          transition={{ duration: 3 + i * 0.7, repeat: Infinity, delay: i * 0.5 }}
        />
      ))}
    </div>
  );
}

function StatBadge({ value, label, delay }: { value: string; label: string; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }} className="flex flex-col items-center gap-1">
      <span className="text-lg font-bold text-white font-mono tracking-tight">{value}</span>
      <span className="text-[10px] text-slate-500 uppercase tracking-widest">{label}</span>
    </motion.div>
  );
}

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState<string | null>(null);
  const typed = useTypewriter(["Segurança do Trabalho", "Saúde Ocupacional", "Gestão de Pessoas"]);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => navigate("/dashboard"),
    onError: (err) => setError(err.message),
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-y-auto" style={{ fontFamily: "'Sora', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`}</style>
      <GridBackground />

      {/* brand panel — visível apenas em desktop (lg+) */}
      <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}
        className="hidden lg:flex flex-col justify-between w-[360px] xl:w-[400px] mr-16 xl:mr-24 relative z-10 min-h-[460px]">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-4 mb-10">
            <div className="relative w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(8,18,38,0.9)", border: "1px solid rgba(56,189,248,0.18)", boxShadow: "0 0 24px rgba(56,189,248,0.08)" }}>
              <svg width="28" height="22" viewBox="0 0 28 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="sid-bar" x1="0" y1="0" x2="28" y2="0" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#38BDF8"/>
                    <stop offset="1" stopColor="#818CF8"/>
                  </linearGradient>
                </defs>
                <rect x="0" y="0"    width="28" height="3.2" rx="1.6" fill="url(#sid-bar)" opacity="1"/>
                <rect x="0" y="9.4"  width="20" height="3.2" rx="1.6" fill="url(#sid-bar)" opacity="0.65"/>
                <rect x="0" y="18.8" width="12" height="3.2" rx="1.6" fill="url(#sid-bar)" opacity="0.35"/>
              </svg>
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-cyan-400/15 blur-md pointer-events-none" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white tracking-tight leading-none">SID</span>
                <div className="w-px h-4 bg-white/10" />
                <span className="text-[9px] font-mono tracking-[0.28em] text-cyan-400/50 uppercase">SST</span>
              </div>
              <p className="text-[10px] mt-1.5 tracking-[0.12em] text-slate-500 font-light">
                Sistema de Inteligência de Dados
              </p>
            </div>
          </div>

          {/* Tagline */}
          <h1 className="text-[22px] xl:text-2xl font-light text-white leading-snug mb-3">
            Inteligência para<br />
            <span className="font-semibold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              {typed}<motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>|</motion.span>
            </span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mt-4">
            Plataforma integrada para gestão de riscos ocupacionais, treinamentos e conformidade com as Normas Regulamentadoras.
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-8 pt-6 border-t border-white/5 mt-8">
          <StatBadge value="11" label="Módulos" delay={0.8} />
          <StatBadge value="NR-01 a 37" label="Cobertura" delay={1.0} />
          <StatBadge value="100%" label="Auditável" delay={1.2} />
        </div>
      </motion.div>

      {/* card de login */}
      <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }}
        className="relative z-10 w-full max-w-[400px] sm:max-w-[420px]">
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-blue-500/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -inset-px rounded-2xl border border-white/8 pointer-events-none" />
        <div className="relative rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60" style={{ background: "rgba(13,21,38,0.92)", backdropFilter: "blur(24px)" }}>

          {/* Logo mobile/tablet (oculta em lg+) */}
          <div className="flex items-center gap-3 mb-6 lg:hidden">
            <div className="relative w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(8,18,38,0.9)", border: "1px solid rgba(56,189,248,0.18)" }}>
              <svg width="20" height="16" viewBox="0 0 28 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="sid-bar-sm" x1="0" y1="0" x2="28" y2="0" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#38BDF8"/>
                    <stop offset="1" stopColor="#818CF8"/>
                  </linearGradient>
                </defs>
                <rect x="0" y="0"    width="28" height="3.2" rx="1.6" fill="url(#sid-bar-sm)" opacity="1"/>
                <rect x="0" y="9.4"  width="20" height="3.2" rx="1.6" fill="url(#sid-bar-sm)" opacity="0.65"/>
                <rect x="0" y="18.8" width="12" height="3.2" rx="1.6" fill="url(#sid-bar-sm)" opacity="0.35"/>
              </svg>
            </div>
            <div>
              <span className="text-white font-bold text-base tracking-tight leading-none block">SID</span>
              <span className="text-[9px] tracking-[0.12em] text-slate-500 font-light">
                Sistema de Inteligência de Dados
              </span>
            </div>
          </div>

          {/* Título do formulário */}
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">Bem-vindo</h2>
            <p className="text-slate-400 text-sm mt-1">Faça login para acessar o sistema</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">E-mail</label>
              <div className={`relative rounded-xl border transition-all duration-200 ${focused === "email" ? "border-blue-500/60 shadow-[0_0_0_3px_rgba(59,130,246,0.1)]" : "border-white/10"}`} style={{ background: "rgba(255,255,255,0.04)" }}>
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                  placeholder="seu@email.com" autoComplete="email" required
                  className="w-full bg-transparent text-white placeholder:text-slate-600 text-sm pl-10 pr-4 py-3 outline-none"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Senha</label>
              <div className={`relative rounded-xl border transition-all duration-200 ${focused === "password" ? "border-blue-500/60 shadow-[0_0_0_3px_rgba(59,130,246,0.1)]" : "border-white/10"}`} style={{ background: "rgba(255,255,255,0.04)" }}>
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
                  placeholder="••••••••" autoComplete="current-password" required
                  className="w-full bg-transparent text-white placeholder:text-slate-600 text-sm pl-10 pr-12 py-3 outline-none"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 p-3 rounded-xl text-red-400 text-sm border border-red-500/20" style={{ background: "rgba(239,68,68,0.08)" }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button type="submit" disabled={loginMutation.isPending} whileTap={{ scale: 0.98 }}
              className="w-full mt-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 group text-sm sm:text-base">
              {loginMutation.isPending ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Autenticando...</>
              ) : (
                <>Entrar no Sistema<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
              )}
            </motion.button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-end">
            <span className="text-slate-700 text-xs">© 2025 SID</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
