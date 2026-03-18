/**
 * seed-demo.ts — Dados fictícios para demonstração
 * Rodar: pnpm tsx server/seed-demo.ts
 */
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH   = path.join(__dirname, "..", "sid-sst.db");
const db        = new Database(DB_PATH);
db.pragma("foreign_keys = OFF");
db.pragma("journal_mode = WAL");

const UID = 1;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const pick = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const rnd  = (mn: number, mx: number) => Math.floor(Math.random() * (mx - mn + 1)) + mn;

// 5 meses: Out/2025 → Fev/2026
const BASE_MS = new Date("2025-10-01").getTime();
const END_MS  = new Date("2026-02-28").getTime();

// "Hot windows": semanas com mais ocorrências (offset em dias, duração)
const HOT: [number, number][] = [
  [13, 10], [34, 8], [55, 12], [77, 7],
  [98, 9],  [119, 11], [140, 8],
];

function nonLinearDate(): string {
  const totalDays = Math.floor((END_MS - BASE_MS) / 86400000);
  let offset: number;
  if (Math.random() < 0.65) {
    const [wStart, wLen] = pick(HOT);
    offset = Math.min(wStart + rnd(0, wLen), totalDays);
  } else {
    offset = rnd(0, totalDays);
  }
  return new Date(BASE_MS + offset * 86400000).toISOString().split("T")[0];
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

// ─── Dados base ───────────────────────────────────────────────────────────────
const FIRST = [
  "João","Maria","José","Ana","Pedro","Luiz","Carlos","Fernanda","Antonio","Juliana",
  "Rafael","Mariana","Ricardo","Camila","Bruno","Priscila","Daniel","Tatiana","Eduardo",
  "Patrícia","Felipe","Aline","Gustavo","Gabriela","Rodrigo","Amanda","Marcos","Vanessa",
  "Diego","Larissa","Thiago","Beatriz","Anderson","Letícia","Leonardo","Natália",
  "Alexandre","Renata","Vinícius","Sabrina","Marcelo","Cristiane","Fábio","Adriana",
  "Paulo","Cláudia","Roberto","Sandra","Sérgio","Débora","Heitor","Úrsula","Caio",
  "Ingrid","Gilberto","Otávio","Fabricio","Helena","Evandro","Zenaide",
];
const LAST = [
  "Silva","Santos","Oliveira","Souza","Costa","Lima","Ferreira","Carvalho","Alves","Pereira",
  "Rodrigues","Nascimento","Martins","Araújo","Melo","Barbosa","Ribeiro","Castro","Gomes",
  "Moura","Correia","Dias","Freitas","Nunes","Cardoso","Pinto","Moreira","Lopes","Rocha",
  "Monteiro","Mendes","Vieira","Teixeira","Cavalcante","Machado","Fernandes","Coelho",
  "Miranda","Batista","Ramos","Azevedo","Duarte","Cunha","Queiroz","Brito","Justo",
  "Fonseca","Guimarães","Teixeira","Araujo",
];

const DEPTS = [
  { dept:"Produção",            sector:"Produção",    count:110,
    pos:["Operador de Máquina","Auxiliar de Produção","Técnico de Produção","Supervisor de Produção","Líder de Linha"] },
  { dept:"Manutenção",          sector:"Manutenção",  count:60,
    pos:["Mecânico Industrial","Eletricista","Técnico de Manutenção","Lubrificador","Soldador"] },
  { dept:"Almoxarifado",        sector:"Almoxarifado",count:40,
    pos:["Almoxarife","Auxiliar de Almoxarifado","Operador de Empilhadeira","Conferente"] },
  { dept:"Logística",           sector:"Logística",   count:55,
    pos:["Motorista","Auxiliar de Logística","Operador de Empilhadeira","Separador","Expedidor"] },
  { dept:"Administrativo",      sector:"Administrativo",count:40,
    pos:["Assistente Administrativo","Analista Administrativo","Coordenador","Recepcionista"] },
  { dept:"RH",                  sector:"RH",          count:20,
    pos:["Analista de RH","Assistente de RH","Coordenador de RH","Aprendiz"] },
  { dept:"Qualidade",           sector:"Qualidade",   count:30,
    pos:["Inspetor de Qualidade","Analista de Qualidade","Técnico de Qualidade","Auditor"] },
  { dept:"Financeiro",          sector:"Financeiro",  count:20,
    pos:["Analista Financeiro","Assistente Financeiro","Contador","Auxiliar Financeiro"] },
  { dept:"TI",                  sector:"TI",          count:15,
    pos:["Analista de TI","Técnico de TI","Desenvolvedor","Suporte TI"] },
  { dept:"Segurança do Trabalho",sector:"SST",        count:10,
    pos:["Técnico de Segurança","Auxiliar de Segurança","Engenheiro de Segurança"] },
];

const CITIES   = ["São Paulo","Campinas","Santos","Sorocaba","Guarulhos","Osasco","Ribeirão Preto","São Bernardo do Campo"];
const BLOOD    = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];
const REGIMES  = ["CLT","CLT","CLT","CLT","Temporário","Estágio","Aprendiz","PJ"];
const STATES   = ["SP","SP","SP","SP","RJ","MG"];

// ═══ FUNCIONÁRIOS ═══════════════════════════════════════════════════════════
console.log("\n▶ Funcionários...");
const existEmp = (db.prepare("SELECT COUNT(*) as n FROM employees").get() as any).n;

let empIds: { id: number; name: string; sector: string; dept: string; pos: string; matricula: string }[] = [];

if (existEmp < 100) {
  // Pool de nomes únicos
  const namePool: string[] = [];
  for (const f of FIRST) for (const l of LAST) {
    namePool.push(`${f} ${l}`);
    if (namePool.length >= 600) break;
    if (namePool.length >= 600) break;
  }
  namePool.sort(() => Math.random() - 0.5);

  const ins = db.prepare(`
    INSERT OR IGNORE INTO employees
    (name,cpf,matricula,position,department,sector,workRegime,admissionDate,city,state,status,bloodType,userId,createdAt,updatedAt)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))
  `);

  db.transaction(() => {
    let seq = 0;
    for (const d of DEPTS) {
      for (let i = 0; i < d.count; i++) {
        seq++;
        const name = namePool[seq % namePool.length];
        const n9   = String(100000 + seq).padStart(9,"0");
        const cpf  = `${n9.slice(0,3)}.${n9.slice(3,6)}.${n9.slice(6,9)}-${String(seq % 99).padStart(2,"0")}`;
        const mat  = `FUN${String(1000 + seq).padStart(4,"0")}`;
        const pos  = pick(d.pos);
        const daysAgo = rnd(90, 1825);
        const admDate = new Date(Date.now() - daysAgo * 86400000).toISOString().split("T")[0];
        ins.run(name, cpf, mat, pos, d.dept, d.sector, pick(REGIMES), admDate,
                pick(CITIES), pick(STATES), rnd(1,20) > 1 ? "ativo" : "inativo", pick(BLOOD), UID);
      }
    }
  })();
  console.log("  ✓ 400 funcionários inseridos");
} else {
  console.log(`  → ${existEmp} funcionários já existentes`);
}

// Carrega todos os funcionários para referência
const allEmp = db.prepare("SELECT id,name,sector,department,position,matricula FROM employees LIMIT 400").all() as any[];
empIds = allEmp.map(e => ({ id: e.id, name: e.name, sector: e.sector, dept: e.department, pos: e.position, matricula: e.matricula }));
console.log(`  Carregados: ${empIds.length}`);

// ═══ ACIDENTES ══════════════════════════════════════════════════════════════
console.log("\n▶ Acidentes...");

const ACC_TYPES = [
  "Queda de mesmo nível","Queda de altura","Corte/Laceração","Contusão",
  "Esforço excessivo / LER","Choque elétrico","Queimadura","Aprisionamento",
  "Exposição química","Acidente de trânsito","Impacto com objeto projetado",
];
const SEV_W   = ["leve","leve","leve","leve","moderado","moderado","grave","grave","fatal"];
const BODY    = ["Mão/Dedos","Pé/Tornozelo","Cabeça","Coluna/Costas","Olho","Braço","Perna","Tronco","Ombro","Joelho"];
const INJ     = ["Corte","Contusão","Fratura","Entorse","Queimadura","Amputação","Luxação","Lesão por esforço","Intoxicação"];
const LOCS_ACC= ["Linha de Produção A","Linha de Produção B","Almoxarifado","Pátio Externo","Área de Manutenção","Estacionamento","Corredor Principal","Área de Carga/Descarga","Refeitório","Escritório"];
const INV_ST  = ["pendente","em_progresso","concluida"];

const insAcc = db.prepare(`
  INSERT INTO accidents (title,description,date,time,location,employeeId,employeeName,
    type,severity,catFiled,catNumber,investigationStatus,sector,bodyPart,injuryNature,
    leaveDays,leaveStartDate,userId,createdAt,updatedAt)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))
`);

db.transaction(() => {
  for (let i = 0; i < 85; i++) {
    const emp  = pick(empIds);
    const type = pick(ACC_TYPES);
    const sev  = pick(SEV_W);
    const date = nonLinearDate();
    const h    = `${String(rnd(5,21)).padStart(2,"0")}:${pick(["00","15","30","45"])}`;
    const leave = sev === "leve" ? rnd(0,3) : sev === "moderado" ? rnd(1,15) : rnd(15,60);
    const cat  = sev !== "leve" || Math.random() < 0.15 ? 1 : 0;
    const catN = cat ? `CAT-${rnd(10000,99999)}` : null;
    const inv  = date < "2025-12-15"
      ? pick(["concluida","concluida","em_progresso"])
      : date < "2026-01-20"
      ? pick(["em_progresso","pendente"])
      : "pendente";

    insAcc.run(
      `Acidente — ${type}`,
      `${emp.name} sofreu ${type.toLowerCase()} no(a) ${pick(LOCS_ACC).toLowerCase()} durante atividade de ${emp.pos?.toLowerCase()}.`,
      date, h, pick(LOCS_ACC),
      String(emp.id), emp.name,
      type, sev,
      cat, catN, inv,
      emp.sector,
      pick(BODY), pick(INJ),
      leave,
      leave > 0 ? addDays(date, 1) : null,
      UID,
    );
  }
})();
console.log("  ✓ 85 acidentes inseridos");

// ═══ ATESTADOS ══════════════════════════════════════════════════════════════
console.log("\n▶ Atestados...");

const CIDS = [
  ["M54.5","Lombalgias"],["K29.7","Gastrite não especificada"],
  ["J06.9","Infecção aguda das vias aéreas superiores"],
  ["F41.1","Transtorno de ansiedade generalizada"],
  ["M47.8","Outras espondiloses"],["J18.9","Pneumonia não especificada"],
  ["L30.9","Dermatite não especificada"],["E11.9","Diabetes mellitus tipo 2"],
  ["G43.0","Enxaqueca sem aura"],["A09.0","Gastroenterite infecciosa"],
  ["M51.1","Degeneração de disco intervertebral"],["J30.1","Rinite alérgica"],
  ["F33.0","Transtorno depressivo recorrente leve"],
  ["K57.3","Doença diverticular do intestino"],["B34.9","Infecção viral não especificada"],
  ["M79.3","Paniculite"],["I10.0","Hipertensão essencial"],
  ["N39.0","Infecção do trato urinário"],["J02.9","Faringoamigdalite aguda"],
  ["F32.0","Episódio depressivo leve"],["M65.3","Dedo em gatilho"],
  ["G47.0","Insônia orgânica"],["F43.1","Transtorno de estresse pós-traumático"],
  ["M54.4","Ciatalgia"],["J45.0","Asma predominantemente alérgica"],
  ["K21.0","Doença do refluxo gastroesofágico"],["M75.1","Síndrome do manguito rotador"],
];

const CARE = [
  "UPA Sul","UPA Central","UPA Norte","Hospital Municipal","Hospital Regional Sul",
  "Clínica Particular","Consultório Médico","Telemedicina","Pronto Socorro Norte",
  "Hospital Privado","Centro Médico Especializado","UBS Vila Nova","Ambulatório Municipal",
];

const DAYS_DIST = [1,1,1,2,2,2,3,3,4,5,5,7,7,7,10,14,14,21,30,30];

const insAtest = db.prepare(`
  INSERT INTO atestados (employeeName,matricula,sector,jobFunction,cid,diagnosis,
    careLocation,startDate,days,userId,createdAt,updatedAt)
  VALUES (?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))
`);

db.transaction(() => {
  for (let i = 0; i < 220; i++) {
    const emp = pick(empIds);
    const [cid, diag] = pick(CIDS);
    insAtest.run(
      emp.name, emp.matricula, emp.sector, emp.pos,
      cid, diag,
      pick(CARE),
      nonLinearDate(),
      pick(DAYS_DIST),
      UID,
    );
  }
})();
console.log("  ✓ 220 atestados inseridos");

// ═══ DOENÇAS OCUPACIONAIS ════════════════════════════════════════════════════
console.log("\n▶ Doenças ocupacionais...");

const DISEASE_LIST = [
  ["Perda Auditiva Induzida por Ruído","H83.3","Exposição crônica a ruído ocupacional acima de 85 dB"],
  ["LER/DORT — Tendinite","M75.2","Lesão por esforço repetitivo em atividade de produção"],
  ["Dermatose Ocupacional","L25.9","Dermatite de contato por substância química"],
  ["Asma Ocupacional","J45.0","Exposição a agentes sensibilizantes no ambiente de trabalho"],
  ["Lombalgias Ocupacional","M54.5","Esforço físico repetitivo em atividade de movimentação de cargas"],
  ["Síndrome do Túnel do Carpo","G56.0","Compressão do nervo mediano por movimentos repetitivos"],
  ["Bronquite Ocupacional","J41.0","Exposição a poeiras e fumos no ambiente de trabalho"],
  ["Stress Ocupacional","F43.0","Sobrecarga laboral e condições inadequadas de trabalho"],
];
const DISEASE_STATUS = ["diagnosticada","diagnosticada","em_tratamento","em_tratamento","controlada","curada"];

const insDis = db.prepare(`
  INSERT INTO diseases (title,cid10,description,employeeId,employeeName,diagnosisDate,
    absenceStartDate,absenceEndDate,status,userId,createdAt,updatedAt)
  VALUES (?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))
`);

db.transaction(() => {
  for (let i = 0; i < 42; i++) {
    const emp = pick(empIds);
    const [title, cid, desc] = pick(DISEASE_LIST);
    const diagDate  = nonLinearDate();
    const absStart  = Math.random() < 0.6 ? addDays(diagDate, rnd(0, 7)) : null;
    const absEnd    = absStart && Math.random() < 0.5 ? addDays(absStart, rnd(7, 60)) : null;
    insDis.run(
      title, cid, desc,
      String(emp.id), emp.name,
      diagDate, absStart, absEnd,
      pick(DISEASE_STATUS),
      UID,
    );
  }
})();
console.log("  ✓ 42 doenças ocupacionais inseridas");

// ═══ TREINAMENTOS ═══════════════════════════════════════════════════════════
console.log("\n▶ Treinamentos...");

const TRAININGS_LIST = [
  ["NR-35 — Trabalho em Altura", "nr35", "Capacitação para trabalho em altura acima de 2 metros"],
  ["NR-10 — Segurança em Instalações Elétricas", "nr10", "Treinamento de segurança para eletricistas e pessoal autorizado"],
  ["NR-12 — Segurança em Máquinas e Equipamentos", "nr12", "Operação segura de máquinas industriais"],
  ["NR-6 — Equipamento de Proteção Individual", "nr6", "Uso correto, guarda e conservação de EPIs"],
  ["Integração SST — Novos Colaboradores", "integracao", "Treinamento de integração em segurança do trabalho"],
  ["CIPA — Formação e Reciclagem", "cipa", "Capacitação de membros da CIPA conforme NR-5"],
  ["Primeiros Socorros", "primeiros_socorros", "Técnicas básicas de primeiros socorros e suporte à vida"],
  ["NR-20 — Inflamáveis e Combustíveis", "nr20", "Segurança no manuseio de materiais inflamáveis"],
  ["Combate a Incêndio", "incendio", "Uso de extintores e procedimentos de evacuação"],
  ["NR-17 — Ergonomia", "ergonomia", "Prevenção de LER/DORT e adequação ergonômica dos postos de trabalho"],
  ["PPRA — Apresentação e Sensibilização", "ppra", "Apresentação do Programa de Prevenção de Riscos Ambientais"],
  ["Direção Defensiva", "direcao", "Condução segura de veículos e prevenção de acidentes de trânsito"],
  ["Comunicação de Acidentes e Incidentes", "acidente", "Procedimento de registro e comunicação de ocorrências"],
  ["DDS — Diálogo Diário de Segurança (líderes)", "dds", "Capacitação de líderes para condução do DDS"],
  ["NR-33 — Espaços Confinados", "nr33", "Entrada e trabalho em espaços confinados"],
  ["Análise de Risco — APR e PT", "apr", "Elaboração de Análise Preliminar de Riscos e Permissão de Trabalho"],
  ["NR-11 — Empilhadeiras e Equipamentos de Carga", "nr11", "Operação segura de empilhadeiras"],
  ["Saúde Mental no Trabalho", "saude_mental", "Gestão do estresse e saúde emocional no ambiente laboral"],
  ["Prevenção de Quedas", "quedas", "Identificação e prevenção de quedas em áreas de risco"],
  ["NR-23 — Proteção Contra Incêndios", "nr23", "Sistemas de prevenção e combate a incêndios"],
];

const INSTRUCTORS = ["Alisson Fernandes","Gleydson Carvalho","Juliane Rocha","Gabriela Mendes",
  "Dr. Carlos Andrade","Eng. Roberto Lima","Sra. Patrícia Souza","Técnico Felipe Costa"];
const TRAIN_LOCATIONS = ["Sala de Treinamento A","Sala de Treinamento B","Auditório","Área Externa — Simulado","Online — Teams","SENAI","SESI","Área de Produção"];
const TRAIN_STATUS = ["concluido","concluido","concluido","em_andamento","planejado"];

const insTrain = db.prepare(`
  INSERT INTO trainings (title,description,type,startDate,endDate,duration,instructor,
    location,status,userId,createdAt,updatedAt)
  VALUES (?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))
`);
const insTrainPart = db.prepare(`
  INSERT INTO trainingParticipants (trainingId,employeeId,employeeName,matricula,sector,position,attended,userId,createdAt)
  VALUES (?,?,?,?,?,?,?,?,datetime('now'))
`);

let trainCount = 0;
db.transaction(() => {
  for (const [title, type, desc] of TRAININGS_LIST) {
    const startDate = nonLinearDate();
    const dur = rnd(2, 16);
    const endDate = Math.random() < 0.7 ? addDays(startDate, rnd(0, 1)) : startDate;
    const status = startDate > "2026-02-01" ? "planejado" : startDate > "2026-01-01" ? pick(["em_andamento","concluido"]) : "concluido";

    const res = insTrain.run(
      title, desc, type, startDate, endDate, dur,
      pick(INSTRUCTORS), pick(TRAIN_LOCATIONS), status, UID,
    ) as any;
    const tid = res.lastInsertRowid;
    trainCount++;

    // Participantes: 12-35 por treinamento
    const numPart = rnd(12, 35);
    const partEmp = [...empIds].sort(() => Math.random() - 0.5).slice(0, numPart);
    for (const emp of partEmp) {
      insTrainPart.run(
        tid, emp.id, emp.name, emp.matricula, emp.sector, emp.pos,
        status === "concluido" ? (Math.random() < 0.9 ? 1 : 0) : 0,
        UID,
      );
    }
  }
})();
console.log(`  ✓ ${trainCount} treinamentos inseridos`);

// ═══ INSPEÇÕES ═══════════════════════════════════════════════════════════════
console.log("\n▶ Inspeções...");

const INSP_TYPES = ["segurança","higiene","equipamento","emergencia","ambiental","ergonomia","eletrica"];
const INSP_TITLES = [
  "Inspeção de Segurança — Linha de Produção",
  "Vistoria de Equipamentos de Proteção Individual",
  "Inspeção de Instalações Elétricas",
  "Auditoria de Ordem e Limpeza (5S)",
  "Inspeção de Andaimes e Trabalho em Altura",
  "Verificação de Extintores e Saídas de Emergência",
  "Inspeção Ergonômica dos Postos de Trabalho",
  "Vistoria do Almoxarifado de Produtos Químicos",
  "Inspeção de Máquinas e Guarda de Segurança",
  "Auditoria NR-12 — Proteção de Máquinas",
  "Inspeção de EPIs — Setor Manutenção",
  "Vistoria do PPCI — Plano de Prevenção a Incêndios",
  "Inspeção de Veículos e Empilhadeiras",
  "Auditoria de Espaços Confinados",
  "Inspeção de Iluminação e Sinalização",
  "Verificação de Primeiros Socorros e AED",
  "Inspeção de PCMSO — Registros de Saúde",
  "Auditoria Ambiental — Descarte de Resíduos",
  "Inspeção Periódica — Caldeira e Vasos de Pressão",
  "Vistoria Geral Pré-Auditoria",
];
const INSP_STATUS = ["concluida","concluida","concluida","em_andamento","planejada"];
const INSPECTORS  = ["Alisson Fernandes","Gleydson Carvalho","Juliane Rocha","Gabriela Mendes","Equipe SST"];

const insInsp = db.prepare(`
  INSERT INTO inspections (title,description,type,date,location,inspector,findings,
    nonConformities,status,userId,createdAt,updatedAt)
  VALUES (?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))
`);

db.transaction(() => {
  for (let i = 0; i < INSP_TITLES.length; i++) {
    const date = nonLinearDate();
    const nc = rnd(0, 8);
    const status = date > "2026-02-01" ? "planejada" : date > "2026-01-10" ? pick(INSP_STATUS) : "concluida";
    insInsp.run(
      INSP_TITLES[i],
      `Verificação sistemática das condições de ${INSP_TYPES[i % INSP_TYPES.length]} na unidade.`,
      INSP_TYPES[i % INSP_TYPES.length],
      date,
      pick(LOCS_ACC),
      pick(INSPECTORS),
      nc > 0 ? `Encontradas ${nc} não conformidade(s) durante a inspeção. Ações corretivas em andamento.` : "Nenhuma não conformidade identificada.",
      nc, status, UID,
    );
  }
})();
console.log(`  ✓ ${INSP_TITLES.length} inspeções inseridas`);

// ═══ EPIs ════════════════════════════════════════════════════════════════════
console.log("\n▶ EPIs...");

const EPI_LIST = [
  ["Capacete de Segurança Classe B","capacete","Capacete","MSA Safety","12 meses", 8, 15.90, "CA-12345"],
  ["Óculos de Proteção Ampla Visão","oculos","Proteção Visual","3M","6 meses", 5, 22.50, "CA-23456"],
  ["Luva de Raspa de Couro","luva_raspa","Luva","Volk","3 meses", 8, 18.00, "CA-34567"],
  ["Luva de Látex Descartável (caixa 100un)","luva_latex","Luva","Supermax","1 mês", 20, 35.00, "CA-45678"],
  ["Bota de Segurança com Biqueira de Aço","bota","Calçado","Bracol","12 meses", 3, 189.00, "CA-56789"],
  ["Protetor Auricular Tipo Concha","protetor_concha","Proteção Auditiva","3M Peltor","24 meses", 5, 95.00, "CA-67890"],
  ["Protetor Auricular Tipo Plug (par)","protetor_plug","Proteção Auditiva","Bilsom","1 mês", 50, 2.50, "CA-78901"],
  ["Máscara Semifacial PFF2","mascara_pff2","Respiratório","3M","1 mês", 10, 12.00, "CA-89012"],
  ["Respirador de Fuga","respirador","Respiratório","Honeywell","36 meses", 2, 320.00, "CA-90123"],
  ["Avental de Raspa de Couro","avental","Proteção do Corpo","Kapriol","6 meses", 5, 55.00, "CA-01234"],
  ["Cinto de Segurança Tipo Paraquedista","cinto","Proteção Contra Queda","DeltaPlus","12 meses", 2, 420.00, "CA-11234"],
  ["Colete Refletivo","colete","Sinalização","Brascamp","12 meses", 5, 28.00, "CA-22345"],
  ["Óculos de Solda EPI","oculos_solda","Proteção Visual","Carbografite","12 meses", 3, 45.00, "CA-33456"],
  ["Luva Isolante Elétrica 1000V","luva_eletrica","Luva","Regeltex","6 meses", 3, 280.00, "CA-44567"],
  ["Protetor Facial de Acrílico","protetor_facial","Proteção Visual","MSA","12 meses", 3, 65.00, "CA-55678"],
];

const insEpi = db.prepare(`
  INSERT INTO epis (name,description,ca,manufacturer,category,validityMonths,stockQuantity,minStock,unitCost,userId,createdAt,updatedAt)
  VALUES (?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))
`);
const insEpiDel = db.prepare(`
  INSERT INTO epiDeliveries (epiId,epiName,employeeId,employeeName,quantity,deliveryDate,
    expiryDate,reason,condition,accepted,acceptedAt,userId,createdAt,updatedAt)
  VALUES (?,?,?,?,?,?,?,?,?,1,?,?,datetime('now'),datetime('now'))
`);

const epiIds: { id: number; name: string; validity: number }[] = [];

db.transaction(() => {
  for (const [name, , cat, mfr, validity, minStk, cost, ca] of EPI_LIST) {
    const validMonths = parseInt(String(validity).split(" ")[0]);
    const res = insEpi.run(
      name, `EPI de ${cat.toLowerCase()} — ${mfr}`, ca, mfr, cat,
      validMonths, rnd(minStk * 3, minStk * 8), minStk, cost, UID,
    ) as any;
    epiIds.push({ id: Number(res.lastInsertRowid), name, validity: validMonths });
  }
})();

// Entregas: ~2 EPIs por funcionário
db.transaction(() => {
  for (const emp of empIds) {
    const numEpis = rnd(1, 4);
    const selectedEpis = [...epiIds].sort(() => Math.random() - 0.5).slice(0, numEpis);
    for (const epi of selectedEpis) {
      const delDate   = nonLinearDate();
      const expiryD   = addDays(delDate, epi.validity * 30);
      const acceptedAt = addDays(delDate, rnd(0, 2));
      insEpiDel.run(
        epi.id, epi.name,
        emp.id, emp.name,
        1, delDate, expiryD,
        "Entrega conforme Programa de EPI",
        pick(["novo","novo","novo","bom","usado"]),
        acceptedAt, UID,
      );
    }
  }
})();
console.log(`  ✓ ${EPI_LIST.length} EPIs + entregas para ${empIds.length} funcionários`);

// ═══ EXAMES MÉDICOS ══════════════════════════════════════════════════════════
console.log("\n▶ Exames médicos...");

const EXAM_TYPES  = ["admissional","periodico","periodico","periodico","demissional","retorno","mudanca_funcao"];
const EXAM_RES    = ["apto","apto","apto","apto","apto","apto_restricao","inapto_temporario"];
const DOCTORS     = ["Dr. Carlos Andrade","Dra. Patrícia Lima","Dr. Fernando Souza","Dra. Ana Paula Ramos","Dr. Sérgio Monteiro"];
const CLINICS     = ["Clínica Saúde Ocupacional Central","SESI — Medicina do Trabalho","Clínica Medicina do Trabalho Ltda","Centro Médico Industrial","CliniWork"];

const insExam = db.prepare(`
  INSERT INTO exams (employeeId,employeeName,examType,examDate,nextExamDate,doctor,crm,
    clinic,result,restrictions,asoNumber,userId,createdAt,updatedAt)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))
`);

db.transaction(() => {
  for (let i = 0; i < 130; i++) {
    const emp = pick(empIds);
    const type = pick(EXAM_TYPES);
    const date = nonLinearDate();
    const nextDate = type === "periodico" ? addDays(date, 365) : type === "admissional" ? addDays(date, 365) : null;
    const result = pick(EXAM_RES);
    const rest = result === "apto_restricao" ? "Restrição para levantamento de peso acima de 10kg" : null;
    insExam.run(
      emp.id, emp.name, type, date, nextDate,
      pick(DOCTORS), `CRM-SP ${rnd(100000,200000)}`,
      pick(CLINICS), result, rest,
      `ASO-${rnd(10000,99999)}`,
      UID,
    );
  }
})();
console.log("  ✓ 130 exames médicos inseridos");

// ═══ PLANOS DE AÇÃO ══════════════════════════════════════════════════════════
console.log("\n▶ Planos de ação...");

const ACTION_WHATS = [
  "Instalar proteção nas serras-fita da Linha 2",
  "Implantar sinalização de piso nas áreas de trânsito de empilhadeiras",
  "Adquirir extintores para o setor de Manutenção",
  "Revisar e atualizar o Mapa de Riscos da Produção",
  "Realizar treinamento de NR-35 para equipe de manutenção",
  "Instalar barra de apoio nos banheiros do setor administrativo",
  "Substituir EPIs vencidos do almoxarifado",
  "Corrigir fiação elétrica exposta na área de solda",
  "Instalar exaustores no setor de pintura",
  "Demarcar corredores e vias de circulação no pátio",
  "Elaborar ART para caldeira do setor industrial",
  "Implementar rodízio de funções para prevenção de DORT",
  "Revisar procedimentos de bloqueio e etiquetagem (LOTO)",
  "Instalar câmeras de monitoramento nas áreas de risco",
  "Realizar auditoria interna do PCMSO",
  "Providenciar AED (desfibrilador) para o refeitório",
  "Corrigir iluminação insuficiente no corredor B",
  "Implantar programa de ginástica laboral",
  "Revisar PPRA e incluir novos agentes identificados",
  "Treinar brigada de incêndio — atualização anual",
];
const PRIORITIES  = ["alta","alta","media","media","media","baixa"];
const PLAN_STATUS = ["aberta","aberta","em_andamento","em_andamento","concluida"];
const RESPONSIBLES = ["Alisson Fernandes","Gleydson Carvalho","Juliane Rocha","Gabriela Mendes","Supervisor de Produção","Gerente de Manutenção"];

const insPlan = db.prepare(`
  INSERT INTO actionPlans (what,why,who,\`when\`,\`where\`,how,originType,deadline,
    responsible,status,priority,userId,createdAt,updatedAt)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))
`);

db.transaction(() => {
  for (const what of ACTION_WHATS) {
    const date     = nonLinearDate();
    const deadline = addDays(date, rnd(15, 90));
    const status   = deadline < "2026-01-01"
      ? pick(["concluida","concluida","em_andamento"])
      : deadline < "2026-02-15"
      ? pick(["em_andamento","aberta"])
      : "aberta";
    insPlan.run(
      what,
      "Eliminação/controle de risco identificado em inspeção ou investigação de acidente.",
      pick(RESPONSIBLES),
      deadline,
      pick(["Produção","Manutenção","Almoxarifado","Toda a unidade","Logística"]),
      "Execução conforme procedimento interno e cronograma definido.",
      "manual",
      deadline,
      pick(RESPONSIBLES),
      status,
      pick(PRIORITIES),
      UID,
    );
  }
})();
console.log(`  ✓ ${ACTION_WHATS.length} planos de ação inseridos`);

// ═══ CAMPANHAS ═══════════════════════════════════════════════════════════════
console.log("\n▶ Campanhas...");

const CAMPAIGNS = [
  ["SIPAT 2025 — Semana Interna de Prevenção de Acidentes do Trabalho","sipat",
   "Semana completa de atividades de prevenção: palestras, treinamentos, gincanas de segurança e premiações."],
  ["Outubro Rosa — Saúde da Mulher","saude",
   "Conscientização sobre saúde da mulher, prevenção do câncer de mama e check-ups periódicos."],
  ["Novembro Azul — Saúde do Homem","saude",
   "Prevenção do câncer de próstata e incentivo à realização de exames preventivos masculinos."],
  ["Janeiro Branco — Saúde Mental","saude_mental",
   "Conscientização sobre saúde mental, prevenção do estresse ocupacional e bem-estar no trabalho."],
  ["Campanha de Vacinação Contra Gripe","saude",
   "Imunização coletiva contra influenza para todos os colaboradores e dependentes."],
  ["Semana do Meio Ambiente — Descarte Consciente","ambiental",
   "Educação ambiental: separação de resíduos, coleta seletiva e descarte responsável de EPI."],
];

const insCamp = db.prepare(`
  INSERT INTO campaigns (title,description,theme,startDate,endDate,target,status,userId,createdAt,updatedAt)
  VALUES (?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))
`);

db.transaction(() => {
  for (const [title, theme, desc] of CAMPAIGNS) {
    const start  = nonLinearDate();
    const end    = addDays(start, rnd(5, 14));
    const status = end < "2026-01-01" ? "concluida" : end < "2026-02-01" ? pick(["em_andamento","concluida"]) : "planejada";
    insCamp.run(
      title, desc, theme, start, end,
      "Todos os colaboradores da unidade",
      status, UID,
    );
  }
})();
console.log(`  ✓ ${CAMPAIGNS.length} campanhas inseridas`);

// ═══ CIPA ════════════════════════════════════════════════════════════════════
console.log("\n▶ CIPA...");

const cipaMandateExists = (db.prepare("SELECT COUNT(*) as n FROM cipaMandate").get() as any).n;
if (cipaMandateExists === 0) {
  const mandateRes = db.prepare(`
    INSERT INTO cipaMandate (startDate,endDate,cnae,employeeCount,grau,
      electedEffective,electedAlternate,designatedEffective,designatedAlternate,
      president,secretary,status,userId,createdAt,updatedAt)
    VALUES ('2025-01-01','2025-12-31','28.21-6',400,3, 4,4,2,2,
      'Alisson Fernandes','Gleydson Carvalho','ativa',1,datetime('now'),datetime('now'))
  `).run() as any;

  const mid = mandateRes.lastInsertRowid;

  const meetingDates = [
    "2025-10-08","2025-10-29","2025-11-12","2025-11-26",
    "2025-12-10","2025-12-17","2026-01-14","2026-01-28",
    "2026-02-11","2026-02-25",
  ];

  const insMeet = db.prepare(`
    INSERT INTO cipaMeetings (mandateId,date,type,pauta,ata,status,userId,createdAt,updatedAt)
    VALUES (?,?,?,?,?,?,?,datetime('now'),datetime('now'))
  `);

  db.transaction(() => {
    for (const [i, d] of meetingDates.entries()) {
      const isPast  = d < "2026-02-20";
      const isExtra = i % 4 === 3;
      insMeet.run(
        mid, d,
        isExtra ? "extraordinaria" : "ordinaria",
        "1. Análise de acidentes do período\n2. Acompanhamento de ações corretivas\n3. Análise de condições de risco\n4. Comunicados e informes gerais",
        isPast ? "Reunião realizada conforme pauta. Ata aprovada pelos presentes." : null,
        isPast ? "realizada" : "agendada",
        UID,
      );
    }
  })();
  console.log(`  ✓ Mandato CIPA + ${meetingDates.length} reuniões inseridas`);
} else {
  console.log("  → CIPA já existe");
}

// ═══ RELATÓRIO FINAL ═════════════════════════════════════════════════════════
console.log("\n═══════════════════════════════════════════");
console.log("✅  Seed concluído com sucesso!");
const summary = {
  funcionários: (db.prepare("SELECT COUNT(*) as n FROM employees").get() as any).n,
  acidentes:    (db.prepare("SELECT COUNT(*) as n FROM accidents").get() as any).n,
  atestados:    (db.prepare("SELECT COUNT(*) as n FROM atestados").get() as any).n,
  doenças:      (db.prepare("SELECT COUNT(*) as n FROM diseases").get() as any).n,
  treinamentos: (db.prepare("SELECT COUNT(*) as n FROM trainings").get() as any).n,
  inspeções:    (db.prepare("SELECT COUNT(*) as n FROM inspections").get() as any).n,
  epis:         (db.prepare("SELECT COUNT(*) as n FROM epis").get() as any).n,
  entregas_epi: (db.prepare("SELECT COUNT(*) as n FROM epiDeliveries").get() as any).n,
  exames:       (db.prepare("SELECT COUNT(*) as n FROM exams").get() as any).n,
  planos_acao:  (db.prepare("SELECT COUNT(*) as n FROM actionPlans").get() as any).n,
  campanhas:    (db.prepare("SELECT COUNT(*) as n FROM campaigns").get() as any).n,
};
console.table(summary);
db.close();
