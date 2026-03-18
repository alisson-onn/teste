import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, User, Sparkles, AlertTriangle, BookOpen, Shield, RotateCcw, Copy, Check } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { trpc } from "@/lib/trpc";

interface Message { id: string; role: "user" | "assistant"; content: string; time: Date; }

const SUGGESTIONS = [
  "Quais NRs regulamentam trabalho em altura?",
  "Como calcular taxa de frequência de acidentes?",
  "O que é CAT e quando devo emitir?",
  "Quais EPIs são obrigatórios para soldagem?",
  "Como elaborar uma investigação de acidente?",
  "Diferença entre PCMSO e PGR",
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-slate-600 hover:text-slate-300">
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${isUser ? "bg-blue-600" : "bg-gradient-to-br from-cyan-500 to-blue-600"}`}>
        {isUser ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-white" />}
      </div>
      <div className={`group max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div className={`relative px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-blue-600 text-white rounded-tr-sm"
            : "text-slate-200 rounded-tl-sm border border-white/6"
          }`}
          style={!isUser ? { background: "#131E35" } : {}}>
          {!isUser && (
            <div className="absolute top-2 right-2">
              <CopyButton text={msg.content} />
            </div>
          )}
          <p className="whitespace-pre-wrap pr-4">{msg.content}</p>
        </div>
        <span className="text-[10px] text-slate-600 mt-1 px-1 font-mono">
          {msg.time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-tl-sm border border-white/6 flex items-center gap-1.5" style={{ background: "#131E35" }}>
        {[0, 1, 2].map(i => (
          <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400"
            animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
        ))}
      </div>
    </motion.div>
  );
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([{
    id: "1", role: "assistant", time: new Date(),
    content: "Olá! Sou o Assistente IA do SID-SST 👋\n\nPosso ajudá-lo com legislação (NRs), CAT, EPIs, investigação de acidentes, CIPA, PCMSO, PGR, doenças ocupacionais e muito mais.\n\nComo posso ajudá-lo?",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chatMut = trpc.ai.chat.useMutation();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async (text?: string) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: userText, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const history = [...messages, userMsg]
      .filter(m => m.id !== "1")
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await chatMut.mutateAsync({ messages: history.length ? history : [{ role: "user", content: userText }] });
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: res.content, time: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: "Desculpe, ocorreu um erro. Tente novamente.", time: new Date() }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const reset = () => {
    setMessages([{ id: "1", role: "assistant", time: new Date(), content: "Conversa reiniciada. Como posso ajudá-lo?" }]);
    setInput("");
  };

  return (
    <MainLayout title="Assistente IA">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`}</style>
      <div className="flex flex-col h-[calc(100vh-56px)]" style={{ fontFamily: "'Sora', sans-serif" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Assistente IA — SST</h2>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-slate-500">Claude claude-sonnet-4-20250514 · Especialista SST</span>
              </div>
            </div>
          </div>
          <button onClick={reset} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
            <RotateCcw className="w-3.5 h-3.5" />Nova conversa
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {messages.length === 1 && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Sugestões</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    onClick={() => send(s)}
                    className="text-left text-xs px-3 py-2.5 rounded-xl border border-white/8 text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/4 transition-all">
                    {s}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
            {loading && <TypingIndicator />}
          </AnimatePresence>
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Pergunte sobre NRs, CAT, EPIs, investigações..."
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-slate-600 outline-none border border-white/10 focus:border-blue-500/50 transition-colors disabled:opacity-50"
                style={{ background: "rgba(255,255,255,0.04)", fontFamily: "'Sora', sans-serif" }}
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="p-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
          <p className="text-[10px] text-slate-600 mt-2 text-center">
            Powered by Claude — Anthropic · Especializado em SST Brasileiro
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
