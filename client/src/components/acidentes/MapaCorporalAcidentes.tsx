import React, { useState } from "react";
import { createPortal } from "react-dom";

const FONT   = "'Sora', sans-serif";
const BORDER = "rgba(255,255,255,0.06)";

const MAPEAMENTO: Record<string, string> = {
  "Mão/Dedos":     "Mão",
  "Mão":           "Mão",
  "Ombro":         "Ombro",
  "Perna":         "Coxa",
  "Coxa":          "Coxa",
  "Joelho":        "Joelho",
  "Tronco":        "Tronco",
  "Coluna/Costas": "Tronco",
  "Cabeça":        "Cabeça",
  "Braço":         "Braço",
  "Pé/Tornozelo":  "Pé",
  "Pé":            "Pé",
  "Tornozelo":     "Tornozelo",
  "Olho":          "Cabeça",
  "Olhos/Face":    "Cabeça",
  "Pescoço":       "Pescoço",
};

interface RegiaoCorpo { regiao: string; total: number; percentual: number }
export interface MapaCorporalProps {
  rawBodyParts: { name: string; value: number }[];
  isLoading?: boolean;
}

function getCor(pct: number)      { return pct > 15 ? "#E24B4A" : pct >= 6 ? "#EF9F27" : "#1D9E75"; }
function getCorFundo(pct: number) { return pct > 15 ? "rgba(226,75,74,0.38)" : pct >= 6 ? "rgba(239,159,39,0.34)" : "rgba(29,158,117,0.32)"; }

const C_TEAL   = "#2aaa8a";
const C_ORANGE = "#d4841a";
const C_RED_F  = "#882222";
const C_RED_S  = "#e05555";

export default function MapaCorporalAcidentes({ rawBodyParts, isLoading }: MapaCorporalProps) {
  const [regiaoAtiva, setRegiaoAtiva] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; regiao: string; total: number; percentual: number;
  } | null>(null);

  const agrupado: Record<string, number> = {};
  for (const r of rawBodyParts) {
    const regiao = MAPEAMENTO[r.name] ?? r.name;
    agrupado[regiao] = (agrupado[regiao] ?? 0) + r.value;
  }
  const totalGeral = Object.values(agrupado).reduce((s, v) => s + v, 0);
  const dados: RegiaoCorpo[] = Object.entries(agrupado)
    .map(([regiao, total]) => ({ regiao, total, percentual: totalGeral > 0 ? Math.round((total / totalGeral) * 100) : 0 }))
    .sort((a, b) => b.total - a.total);

  const regiaoMaisAfetada     = dados[0]?.regiao ?? "—";
  const percentualMaisAfetada = dados[0]?.percentual ?? 0;

  function handleHighlight(r: string) { setRegiaoAtiva(p => p === r ? null : r); }
  function handleMouseEnter(e: React.MouseEvent, r: string) {
    const d = dados.find(x => x.regiao === r);
    if (d) setTooltip({ x: e.clientX, y: e.clientY, regiao: r, total: d.total, percentual: d.percentual });
  }
  function handleMouseMove(e: React.MouseEvent) {
    setTooltip(p => p ? { ...p, x: e.clientX, y: e.clientY } : null);
  }

  function zp(name: string, defStroke: string, defFill: string) {
    const d        = dados.find(x => x.regiao === name);
    const isActive = regiaoAtiva === name;
    const opacity  = regiaoAtiva && !isActive ? 0.22 : 1;

    let stroke      = defStroke;
    let fill        = defFill;
    let strokeWidth = 1.5;
    let filterStr   = "";

    if (d) {
      fill = getCorFundo(d.percentual);
      if (isActive) {
        stroke      = getCor(d.percentual);
        fill        = getCor(d.percentual);
        strokeWidth = 2.5;
        filterStr   = `drop-shadow(0 0 6px ${getCor(d.percentual)})`;
      }
    }

    return {
      stroke,
      fill,
      strokeWidth: strokeWidth as number,
      style: {
        cursor: "pointer" as const,
        transition: "all 0.2s",
        opacity,
        ...(filterStr ? { filter: filterStr } : {}),
      },
      onClick:      ()  => handleHighlight(name),
      onMouseEnter: (e: React.MouseEvent<SVGElement>) => handleMouseEnter(e, name),
      onMouseMove:  (e: React.MouseEvent<SVGElement>) => handleMouseMove(e),
      onMouseLeave: ()  => setTooltip(null),
    };
  }

  if (isLoading) {
    return (
      <div style={{ display: "flex", gap: 16, minHeight: 300 }}>
        <div style={{ width: 190, background: "rgba(255,255,255,0.04)", borderRadius: 12 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, paddingTop: 16 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {[1,2,3].map(i => <div key={i} style={{ flex: 1, height: 52, background: "rgba(255,255,255,0.04)", borderRadius: 10 }} />)}
          </div>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} style={{ height: 30, background: "rgba(255,255,255,0.04)", borderRadius: 8 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", fontFamily: FONT, minHeight: 420 }}>

        {/* ── LEFT: body SVG ── */}
        <div style={{
          width: 190, flexShrink: 0,
          background: "transparent", borderRight: `1px solid ${BORDER}`,
          padding: "14px 10px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <svg viewBox="0 0 120 280" width="150" style={{ display: "block", overflow: "visible" }}>
            <ellipse id="fig-cabeca"    cx="60"  cy="22"  rx="17" ry="20" {...zp("Cabeça",    C_TEAL,   "none"  )} />
            <rect    id="fig-pescoco"   x="54"   y="41"   width="12"  height="13" rx="3"      {...zp("Pescoço",  C_TEAL,   "none"  )} />
            <ellipse id="fig-ombro-l"   cx="34"  cy="58"  rx="16" ry="8"  {...zp("Ombro",     C_TEAL,   "none"  )} />
            <ellipse id="fig-ombro-r"   cx="86"  cy="58"  rx="16" ry="8"  {...zp("Ombro",     C_TEAL,   "none"  )} />
            <rect    id="fig-tronco"    x="38"   y="50"   width="44"  height="66" rx="4"      {...zp("Tronco",   C_ORANGE, "none"  )} />
            <rect    id="fig-braco-l"   x="19"   y="54"   width="13"  height="66" rx="5"      {...zp("Braço",    C_ORANGE, "none"  )} />
            <rect    id="fig-braco-r"   x="88"   y="54"   width="13"  height="66" rx="5"      {...zp("Braço",    C_ORANGE, "none"  )} />
            <ellipse id="fig-mao-l"     cx="26"  cy="128" rx="9"  ry="11" {...zp("Mão",       C_RED_S,  C_RED_F )} />
            <ellipse id="fig-mao-r"     cx="94"  cy="128" rx="9"  ry="11" {...zp("Mão",       C_RED_S,  C_RED_F )} />
            <rect    id="fig-coxa-l"    x="38"   y="118"  width="20"  height="52" rx="4"      {...zp("Coxa",     C_ORANGE, "none"  )} />
            <rect    id="fig-coxa-r"    x="62"   y="118"  width="20"  height="52" rx="4"      {...zp("Coxa",     C_ORANGE, "none"  )} />
            <ellipse id="fig-joelho-l"  cx="48"  cy="172" rx="10" ry="7"  {...zp("Joelho",    C_ORANGE, "none"  )} />
            <ellipse id="fig-joelho-r"  cx="72"  cy="172" rx="10" ry="7"  {...zp("Joelho",    C_ORANGE, "none"  )} />
            <rect    id="fig-tornozelo-l" x="40" y="178"  width="14"  height="58" rx="4"      {...zp("Tornozelo",C_ORANGE, "none"  )} />
            <rect    id="fig-tornozelo-r" x="66" y="178"  width="14"  height="58" rx="4"      {...zp("Tornozelo",C_ORANGE, "none"  )} />
            <ellipse id="fig-pe-l"      cx="44"  cy="241" rx="15" ry="9"  {...zp("Pé",        C_RED_S,  C_RED_F )} />
            <ellipse id="fig-pe-r"      cx="76"  cy="241" rx="15" ry="9"  {...zp("Pé",        C_RED_S,  C_RED_F )} />
          </svg>
        </div>

        {/* ── RIGHT: Data panel ── */}
        <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 0 }}>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 }}>
            {[
              { label: "Total de casos",      value: totalGeral },
              { label: "Região mais afetada", value: regiaoMaisAfetada },
              { label: "Participação",         value: `${percentualMaisAfetada}%` },
            ].map((m, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`,
                borderRadius: 10, padding: "10px 14px",
              }}>
                <div style={{ color: "#475569", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{m.label}</div>
                <div style={{ color: "#E2E8F0", fontSize: 16, fontWeight: 700 }}>{String(m.value)}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, overflowY: "auto" }}>
            {dados.length === 0 && (
              <p style={{ color: "#475569", fontSize: 12, textAlign: "center", padding: "32px 0" }}>
                Preencha "Parte do Corpo" nos registros para visualizar os dados
              </p>
            )}
            {dados.map(d => {
              const cor     = getCor(d.percentual);
              const isAtiva = regiaoAtiva === d.regiao;
              return (
                <div key={d.regiao}
                  onClick={() => handleHighlight(d.regiao)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "7px 10px", borderRadius: 8, cursor: "pointer",
                    background: isAtiva ? "rgba(255,255,255,0.05)" : "transparent",
                    opacity: regiaoAtiva && !isAtiva ? 0.38 : 1,
                    transition: "all 0.18s",
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: cor, flexShrink: 0 }} />
                  <span style={{ color: "#CBD5E1", fontSize: 12, width: 108, flexShrink: 0 }}>{d.regiao}</span>
                  <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
                    <div style={{ width: `${d.percentual}%`, height: "100%", background: cor, borderRadius: 3, transition: "width 0.5s" }} />
                  </div>
                  <span style={{ color: "#64748B", fontSize: 11, width: 24, textAlign: "right", flexShrink: 0 }}>{d.total}</span>
                  <span style={{ color: cor, fontSize: 11, width: 34, textAlign: "right", flexShrink: 0, fontWeight: 700 }}>{d.percentual}%</span>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 14, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${BORDER}`, flexWrap: "wrap" }}>
            {[
              { cor: "#E24B4A", label: "Alta >15%"  },
              { cor: "#EF9F27", label: "Média 6–15%" },
              { cor: "#1D9E75", label: "Baixa <6%"  },
            ].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: l.cor }} />
                <span style={{ color: "#475569", fontSize: 10, fontFamily: FONT }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {tooltip && createPortal(
        <div style={{
          position: "fixed", left: tooltip.x + 14, top: tooltip.y - 48,
          zIndex: 9999, pointerEvents: "none",
          background: "#0F1929", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 10, padding: "8px 12px", fontFamily: FONT,
          boxShadow: "0 8px 24px rgba(0,0,0,0.55)",
        }}>
          <p style={{ color: "#E2E8F0", fontSize: 12, fontWeight: 700, margin: "0 0 2px" }}>{tooltip.regiao}</p>
          <p style={{ color: "#64748B", fontSize: 11, margin: 0 }}>{tooltip.total} casos — {tooltip.percentual}%</p>
        </div>,
        document.body
      )}
    </>
  );
}
