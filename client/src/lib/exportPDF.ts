import { jsPDF } from "jspdf";

// ── Dimensões A4 portrait ─────────────────────────────────────────────────────
const PW = 210;       // page width mm
const ML = 14;        // margin left/right
const UW = PW - ML * 2; // usable width = 182mm

// ── Paleta ───────────────────────────────────────────────────────────────────
type C3 = [number, number, number];
const NAVY:    C3 = [17,  24,  55];
const BLUE:    C3 = [59, 130, 246];
const CONF:    C3 = [37,  99, 235];
const WHITE:   C3 = [255, 255, 255];
const G50:     C3 = [249, 250, 251];
const G100:    C3 = [243, 244, 246];
const G200:    C3 = [229, 231, 235];
const G400:    C3 = [156, 163, 175];
const G600:    C3 = [75,  85,  99];
const G900:    C3 = [17,  24,  39];
const BORDER_L: C3 = [30,  64, 175];

const KPI_ACCENT: C3[] = [
  [59,  130, 246],
  [239,  68,  68],
  [245, 158,  11],
  [139,  92, 246],
  [34,  197,  94],
];

const BAR_PALETTE: C3[] = [
  [59,  130, 246],
  [34,  197,  94],
  [245, 158,  11],
  [139,  92, 246],
  [239,  68,  68],
  [6,   182, 212],
  [244, 114, 182],
  [52,  211, 153],
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function setFill(doc: jsPDF, c: C3)  { doc.setFillColor(c[0], c[1], c[2]); }
function setTxt(doc: jsPDF, c: C3)   { doc.setTextColor(c[0], c[1], c[2]); }
function setDraw(doc: jsPDF, c: C3)  { doc.setDrawColor(c[0], c[1], c[2]); }

function fmtDate(v?: string | null) {
  if (!v) return "—";
  const p = v.split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : `${p[1]}/${p[0]}`;
}

function fmtNow() {
  return new Date().toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function trunc(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

// ── Agregações client-side ────────────────────────────────────────────────────
function computeAggs(list: any[]) {
  const count = (key: (r: any) => string) => {
    const m: Record<string, number> = {};
    list.forEach(r => { const k = key(r) || "—"; m[k] = (m[k] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  };

  const bySector   = count(r => r.sector);
  const byFunc     = count(r => r.jobFunction);
  const byLoc      = count(r => r.careLocation);
  const byCidRaw   = count(r => r.diagnosis ? `${r.cid} - ${r.diagnosis}` : r.cid);

  // Duration distribution
  const dur = [
    { label: "1 dia",     n: list.filter(r => r.days === 1).length },
    { label: "2-3 dias",  n: list.filter(r => r.days >= 2  && r.days <= 3).length  },
    { label: "4-7 dias",  n: list.filter(r => r.days >= 4  && r.days <= 7).length  },
    { label: "8-15 dias", n: list.filter(r => r.days >= 8  && r.days <= 15).length },
    { label: "16+ dias",  n: list.filter(r => r.days >= 16).length },
  ].filter(d => d.n > 0).sort((a, b) => b.n - a.n);

  // Temporal (by date, sorted)
  const byDate: Record<string, number> = {};
  list.forEach(r => { if (r.startDate) byDate[r.startDate] = (byDate[r.startDate] || 0) + 1; });
  const temporal = Object.entries(byDate)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, n]) => ({ date: fmtDate(date).slice(0, 5), n })); // "DD/MM"

  return { bySector, byFunc, byLoc, byCidRaw, dur, temporal };
}

// ── Header page 1 ────────────────────────────────────────────────────────────
function drawHeader(doc: jsPDF, periodLabel: string, count: number): number {
  // "DOCUMENTO CONFIDENCIAL" — topo centralizado
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setTxt(doc, CONF);
  doc.text("DOCUMENTO CONFIDENCIAL", PW / 2, 7, { align: "center" });

  // Dark navy block
  setFill(doc, NAVY);
  doc.rect(0, 10, PW, 36, "F");

  // Título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  setTxt(doc, WHITE);
  doc.text("Relatório de Atestados Médicos", ML, 24);

  // Data de geração (direita)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setTxt(doc, G400);
  doc.text(`Gerado em: ${fmtNow()}`, PW - ML, 24, { align: "right" });

  // Subtítulo organização
  doc.setFontSize(7.5);
  setTxt(doc, [147, 183, 230] as C3);
  doc.text(
    "SID · Sistema de Inteligência de Dados, Segurança e Medicina do Trabalho do ITAMED · Fundação de Saúde Itaiguapy",
    ML, 32,
  );

  // Linha azul abaixo do header
  setDraw(doc, BLUE);
  doc.setLineWidth(0.8);
  doc.line(0, 46, PW, 46);

  return 50;
}

// ── Filtros card ─────────────────────────────────────────────────────────────
function drawFilters(
  doc: jsPDF, y: number,
  opts: { period: string; sectors?: string[]; cids?: string[]; functions?: string[] },
): number {
  const H = 22;
  const periodLabels: Record<string, string> = {
    mes: "Último mês", trimestre: "Último trimestre",
    semestre: "Último semestre", ano: "Este ano", tudo: "— até —",
  };

  // Card border
  setFill(doc, G50);
  setDraw(doc, G200);
  doc.setLineWidth(0.3);
  doc.roundedRect(ML, y, UW, H, 2, 2, "FD");

  // Label topo
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  setTxt(doc, BLUE);
  doc.text("FILTROS APLICADOS", ML + 4, y + 5.5);

  // 5 colunas
  const cols = [
    { label: "PERÍODO",  value: periodLabels[opts.period] ?? opts.period },
    { label: "SETOR",    value: opts.sectors?.join(", ")   || "Todos" },
    { label: "FUNÇÃO",   value: opts.functions?.join(", ") || "Todas" },
    { label: "CID",      value: opts.cids?.join(", ")      || "Todos" },
    { label: "DIAS",     value: "Todos" },
  ];
  const colW = UW / cols.length;

  cols.forEach((col, i) => {
    const x = ML + i * colW + 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    setTxt(doc, G400);
    doc.text(col.label, x, y + 11.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setTxt(doc, G900);
    doc.text(trunc(col.value, 22), x, y + 18);
  });

  return y + H + 6;
}

// ── KPI Cards ─────────────────────────────────────────────────────────────────
function drawKpis(doc: jsPDF, y: number, stats: any, total: number): number {
  const items = [
    { label: "TOTAL DE ATESTADOS",  value: stats?.total           ?? total,  sub: "registros"           },
    { label: "DIAS AFASTAMENTO",    value: stats?.totalDays       ?? "—",    sub: "total acumulado"     },
    { label: "MÉDIA DE DIAS",       value: stats?.avgDays         ?? "—",    sub: "por atestado"        },
    { label: "SETORES AFETADOS",    value: stats?.sectors         ?? "—",    sub: "diferentes setores"  },
    { label: "FUNCIONÁRIOS",        value: stats?.uniqueEmployees ?? "—",    sub: "com atestado"        },
  ];

  const GAP = 4;
  const cardW = (UW - GAP * (items.length - 1)) / items.length;
  const cardH = 32;

  items.forEach((item, i) => {
    const x = ML + i * (cardW + GAP);
    const ac = KPI_ACCENT[i];

    // Card shadow
    doc.setFillColor(220, 225, 235);
    doc.roundedRect(x + 0.6, y + 0.6, cardW, cardH, 2, 2, "F");

    // Card bg
    setFill(doc, WHITE);
    doc.roundedRect(x, y, cardW, cardH, 2, 2, "F");

    // Colored top border
    setFill(doc, ac);
    doc.rect(x, y, cardW, 2.5, "F");
    doc.roundedRect(x, y, cardW, 2.5, 1, 1, "F");

    // Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    setTxt(doc, G400);
    doc.text(item.label, x + cardW / 2, y + 9, { align: "center" });

    // Value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    setTxt(doc, ac);
    doc.text(String(item.value), x + cardW / 2, y + 22, { align: "center" });

    // Sub label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    setTxt(doc, G400);
    doc.text(item.sub, x + cardW / 2, y + 28, { align: "center" });
  });

  return y + cardH + 8;
}

// ── Section card wrapper ──────────────────────────────────────────────────────
function openSection(
  doc: jsPDF, y: number, title: string, subtitle: string, estimatedH: number,
  pageH: number,
): number {
  // Nova página se não cabe
  if (y + estimatedH > pageH - 20) {
    doc.addPage();
    y = 16;
  }

  // Card bg + border
  setFill(doc, WHITE);
  setDraw(doc, G200);
  doc.setLineWidth(0.2);
  doc.roundedRect(ML, y, UW, estimatedH, 2, 2, "FD");

  // Left accent bar
  setFill(doc, BORDER_L);
  doc.rect(ML, y, 3.5, estimatedH, "F");
  doc.setFillColor(BORDER_L[0], BORDER_L[1], BORDER_L[2]);
  doc.roundedRect(ML, y, 3.5, estimatedH, 1, 1, "F");

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setTxt(doc, G900);
  doc.text(title, ML + 8, y + 9);

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setTxt(doc, BLUE);
  doc.text(subtitle, ML + 8, y + 15);

  return y + 19; // return Y where content starts
}

// ── Horizontal bar rows ───────────────────────────────────────────────────────
function drawHBars(
  doc: jsPDF, y: number, items: [string, number][],
  maxPerPage = 12,
): number {
  const ROW_H = 9;
  const LABEL_W = 65;
  const BAR_X = ML + 8 + LABEL_W;
  const BAR_MAX_W = UW - LABEL_W - 20;
  const maxVal = Math.max(...items.map(i => i[1]), 1);
  const shown  = items.slice(0, maxPerPage);

  shown.forEach(([label, val], i) => {
    const ry  = y + i * ROW_H;
    const col = BAR_PALETTE[i % BAR_PALETTE.length];

    // Row background (alternating)
    if (i % 2 === 0) {
      setFill(doc, G100);
      doc.rect(ML + 8, ry, UW - 8, ROW_H - 1, "F");
    }

    // Label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setTxt(doc, G600);
    doc.text(trunc(label, 30), ML + 9, ry + ROW_H - 3);

    // Bar
    const bw = (val / maxVal) * BAR_MAX_W;
    setFill(doc, col);
    doc.rect(BAR_X, ry + 1.5, bw, ROW_H - 4, "F");

    // Count badge
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    setTxt(doc, col);
    doc.text(String(val), BAR_X + bw + 3, ry + ROW_H - 3);
  });

  return y + shown.length * ROW_H + 4;
}

// ── Temporal line chart ────────────────────────────────────────────────────────
function drawTemporalChart(doc: jsPDF, y: number, temporal: { date: string; n: number }[]): number {
  if (temporal.length === 0) return y + 4;

  const CH   = 50;   // chart height
  const CX   = ML + 8;
  const CW   = UW - 8;
  const maxN = Math.max(...temporal.map(t => t.n), 1);
  const step = CW / Math.max(temporal.length - 1, 1);

  // Y gridlines (light)
  setDraw(doc, G200);
  doc.setLineWidth(0.2);
  for (let g = 0; g <= maxN; g++) {
    const gy = y + CH - (g / maxN) * CH;
    doc.line(CX, gy, CX + CW, gy);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    setTxt(doc, G400);
    doc.text(String(g), CX - 3, gy + 1, { align: "right" });
  }

  // Points & line
  const pts = temporal.map((t, i) => ({
    x: CX + i * step,
    y: y + CH - (t.n / maxN) * CH,
    n: t.n,
    date: t.date,
  }));

  // Fill area under line
  setFill(doc, [219, 234, 254] as C3);
  const areaPath: [number, number][] = [
    [pts[0].x, y + CH],
    ...pts.map(p => [p.x, p.y] as [number, number]),
    [pts[pts.length - 1].x, y + CH],
  ];
  doc.setFillColor(219, 234, 254);
  // Draw as polygon approximation
  if (areaPath.length >= 3) {
    doc.lines(
      areaPath.slice(1).map((p, i) => [p[0] - areaPath[i][0], p[1] - areaPath[i][1]] as [number,number]),
      areaPath[0][0], areaPath[0][1], [1, 1], "F",
    );
  }

  // Line
  setDraw(doc, BLUE);
  doc.setLineWidth(0.8);
  for (let i = 1; i < pts.length; i++) {
    doc.line(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
  }

  // Points (filled circles) + labels above high points
  pts.forEach(p => {
    setFill(doc, BLUE);
    doc.circle(p.x, p.y, 1.2, "F");
    setFill(doc, WHITE);
    doc.circle(p.x, p.y, 0.6, "F");
  });

  // Data labels above points
  pts.forEach(p => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    setTxt(doc, G900);
    doc.text(String(p.n), p.x, p.y - 2.5, { align: "center" });
  });

  // X axis date labels (show every Nth to avoid overlap)
  const every = Math.max(1, Math.ceil(temporal.length / 20));
  pts.forEach((p, i) => {
    if (i % every !== 0) return;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    setTxt(doc, G400);
    doc.text(p.date, p.x, y + CH + 5, { align: "center" });
  });

  return y + CH + 9;
}

// ── Rodapé em todas as páginas ────────────────────────────────────────────────
function addFooters(doc: jsPDF) {
  const total = (doc as any).internal.getNumberOfPages();
  const PH    = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    // Linha separadora
    setDraw(doc, G200);
    doc.setLineWidth(0.3);
    doc.line(ML, PH - 10, PW - ML, PH - 10);
    // Texto central
    doc.setFont("helvetica", "italic");
    doc.setFontSize(6.5);
    setTxt(doc, G400);
    doc.text("Documento Confidencial — uso restrito ao destinatário autorizado.", PW / 2, PH - 6, { align: "center" });
    // Esquerda
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setTxt(doc, G600);
    doc.text("Fundação de Saúde Itaiguapy · SID · ITAMED", ML, PH - 6);
    // Direita
    doc.setFont("helvetica", "bold");
    setTxt(doc, G600);
    doc.text(`Página ${i} / ${total}`, PW - ML, PH - 6, { align: "right" });
  }
}

// ── Export principal ──────────────────────────────────────────────────────────
export function exportAtestadosPDF(opts: {
  list:     any[];
  stats:    any;
  period:   string;
  filters?: { sectors?: string[]; cids?: string[]; functions?: string[] };
}) {
  const { list, stats, period, filters } = opts;
  const doc  = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PH   = doc.internal.pageSize.getHeight();
  const aggs = computeAggs(list);

  const periodLabel: Record<string, string> = {
    mes: "Último mês", trimestre: "Último trimestre",
    semestre: "Último semestre", ano: "Este ano", tudo: "Todos os registros",
  };

  // ─── Página 1 ────────────────────────────────────────────────────────────
  let y = drawHeader(doc, periodLabel[period] ?? period, list.length);

  y = drawFilters(doc, y, {
    period,
    sectors:   filters?.sectors,
    cids:      filters?.cids,
    functions: filters?.functions,
  });

  y = drawKpis(doc, y, stats, list.length);

  // ─── Evolução Temporal ────────────────────────────────────────────────────
  if (aggs.temporal.length > 0) {
    const estimatedH = 74;
    y = openSection(doc, y, "Evolução Temporal de Atestados", "Quantidade por data de início", estimatedH, PH);
    y = drawTemporalChart(doc, y, aggs.temporal);
    y += 4;
  }

  // ─── Atestados por Setor ──────────────────────────────────────────────────
  if (aggs.bySector.length > 0) {
    const rows = aggs.bySector.slice(0, 10);
    const est  = 22 + rows.length * 9 + 4;
    y = openSection(doc, y, "Atestados por Setor", "Top setores com mais ocorrências", est, PH);
    y = drawHBars(doc, y, rows, 10);
    y += 4;
  }

  // ─── Atestados por Função ─────────────────────────────────────────────────
  if (aggs.byFunc.length > 0) {
    const rows = aggs.byFunc.slice(0, 10);
    const est  = 22 + rows.length * 9 + 4;
    y = openSection(doc, y, "Atestados por Função", "Funções com maior incidência", est, PH);
    y = drawHBars(doc, y, rows, 10);
    y += 4;
  }

  // ─── Diagnósticos Mais Comuns ─────────────────────────────────────────────
  if (aggs.byCidRaw.length > 0) {
    const rows = aggs.byCidRaw.slice(0, 12);
    const est  = 22 + rows.length * 9 + 4;
    y = openSection(doc, y, "Diagnósticos Mais Comuns", "CIDs com maior frequência", est, PH);
    y = drawHBars(doc, y, rows, 12);
    y += 4;
  }

  // ─── Distribuição de Duração ──────────────────────────────────────────────
  if (aggs.dur.length > 0) {
    const total_list = list.length;
    const rows: [string, number][] = aggs.dur.map(d => [
      `${d.label}  (${((d.n / total_list) * 100).toFixed(1)}%)`,
      d.n,
    ]);
    const est = 22 + rows.length * 9 + 4;
    y = openSection(doc, y, "Distribuição de Duração", "Faixas de dias de afastamento", est, PH);
    y = drawHBars(doc, y, rows, 8);
    y += 4;
  }

  // ─── Locais de Atendimento ────────────────────────────────────────────────
  if (aggs.byLoc.filter(([k]) => k !== "—").length > 0) {
    const rows = aggs.byLoc.filter(([k]) => k !== "—").slice(0, 12);
    const est  = 22 + rows.length * 9 + 4;
    y = openSection(doc, y, "Locais de Atendimento", "Distribuição por unidade/hospital", est, PH);
    y = drawHBars(doc, y, rows, 12);
    y += 4;
  }

  addFooters(doc);

  const filename = `Relatorio_Atestados_${period}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
