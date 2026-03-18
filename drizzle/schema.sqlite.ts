import { int, sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

// ─── USERS ───────────────────────────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  role: text("role", { enum: ["admin", "supervisor", "operacional"] }).default("operacional").notNull(),
  sector: text("sector"),
  active: integer("active", { mode: "boolean" }).default(true).notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
  lastSignedIn: text("lastSignedIn").default(sql`(datetime('now'))`).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── ACCIDENTS ───────────────────────────────────────────────────────────────
export const accidents = sqliteTable("accidents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  date: text("date").notNull(),
  time: text("time"),
  location: text("location"),
  employeeId: text("employeeId"),
  employeeName: text("employeeName"),
  type: text("type"),
  severity: text("severity", { enum: ["leve", "moderado", "grave", "fatal"] }).notNull(),
  catFiled: integer("catFiled", { mode: "boolean" }).default(false),
  catNumber: text("catNumber"),
  investigationStatus: text("investigationStatus", { enum: ["pendente", "em_progresso", "concluida"] }).default("pendente"),
  userId: integer("userId").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});

export type Accident = typeof accidents.$inferSelect;
export type InsertAccident = typeof accidents.$inferInsert;

// ─── DISEASES ────────────────────────────────────────────────────────────────
export const diseases = sqliteTable("diseases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  cid10: text("cid10").notNull(),
  description: text("description"),
  employeeId: text("employeeId"),
  employeeName: text("employeeName"),
  diagnosisDate: text("diagnosisDate"),
  absenceStartDate: text("absenceStartDate"),
  absenceEndDate: text("absenceEndDate"),
  medicalCertificateNumber: text("medicalCertificateNumber"),
  status: text("status", { enum: ["diagnosticada", "afastada", "recuperada", "cronica"] }).default("diagnosticada"),
  userId: integer("userId").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});

export type Disease = typeof diseases.$inferSelect;
export type InsertDisease = typeof diseases.$inferInsert;

// ─── TRAININGS ───────────────────────────────────────────────────────────────
export const trainings = sqliteTable("trainings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type"),
  startDate: text("startDate").notNull(),
  endDate: text("endDate"),
  duration: integer("duration"),
  instructor: text("instructor"),
  location: text("location"),
  participants: text("participants", { mode: "json" }),
  status: text("status", { enum: ["planejado", "em_andamento", "concluido"] }).default("planejado"),
  userId: integer("userId").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});

export type Training = typeof trainings.$inferSelect;
export type InsertTraining = typeof trainings.$inferInsert;

// ─── INSPECTIONS ─────────────────────────────────────────────────────────────
export const inspections = sqliteTable("inspections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type"),
  date: text("date").notNull(),
  location: text("location"),
  inspector: text("inspector"),
  findings: text("findings", { mode: "json" }),
  nonConformities: integer("nonConformities").default(0),
  status: text("status", { enum: ["planejada", "em_andamento", "concluida"] }).default("planejada"),
  userId: integer("userId").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});

export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = typeof inspections.$inferInsert;

// ─── PPPs ────────────────────────────────────────────────────────────────────
export const ppps = sqliteTable("ppps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: text("employeeId").notNull(),
  employeeName: text("employeeName").notNull(),
  position: text("position"),
  department: text("department"),
  startDate: text("startDate"),
  endDate: text("endDate"),
  hazards: text("hazards", { mode: "json" }),
  protectiveEquipment: text("protectiveEquipment", { mode: "json" }),
  medicalExaminations: text("medicalExaminations", { mode: "json" }),
  status: text("status", { enum: ["ativo", "finalizado", "revisao"] }).default("ativo"),
  userId: integer("userId").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});

export type PPP = typeof ppps.$inferSelect;
export type InsertPPP = typeof ppps.$inferInsert;

// ─── INVESTIGATIONS ──────────────────────────────────────────────────────────
export const investigations = sqliteTable("investigations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accidentId: integer("accidentId"),
  title: text("title").notNull(),
  description: text("description"),
  investigationDate: text("investigationDate").notNull(),
  investigator: text("investigator"),
  rootCauses: text("rootCauses"),
  preventiveMeasures: text("preventiveMeasures"),
  correctiveMeasures: text("correctiveMeasures"),
  status: text("status", { enum: ["aberta", "em_andamento", "fechada"] }).default("aberta"),
  userId: integer("userId").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});

export type Investigation = typeof investigations.$inferSelect;
export type InsertInvestigation = typeof investigations.$inferInsert;

// ─── CAMPAIGNS ───────────────────────────────────────────────────────────────
export const campaigns = sqliteTable("campaigns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  theme: text("theme"),
  startDate: text("startDate").notNull(),
  endDate: text("endDate"),
  target: text("target"),
  status: text("status", { enum: ["planejada", "em_andamento", "concluida"] }).default("planejada"),
  userId: integer("userId").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

// ─── AUDIT LOGS ──────────────────────────────────────────────────────────────
export const auditLogs = sqliteTable("auditLogs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  action: text("action").notNull(),
  entityType: text("entityType").notNull(),
  entityId: text("entityId"),
  userId: integer("userId").notNull(),
  userName: text("userName"),
  description: text("description"),
  changes: text("changes", { mode: "json" }),
  ipAddress: text("ipAddress"),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ─── EMPLOYEES ───────────────────────────────────────────────────────────────
export const employees = sqliteTable("employees", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // Dados pessoais
  name: text("name").notNull(),
  cpf: text("cpf").notNull().unique(),
  rg: text("rg"),
  birthDate: text("birthDate"),
  gender: text("gender", { enum: ["M", "F", "outro"] }),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  // Dados profissionais
  matricula: text("matricula"),
  position: text("position"),
  department: text("department"),
  sector: text("sector"),
  workRegime: text("workRegime"),
  admissionDate: text("admissionDate"),
  dismissalDate: text("dismissalDate"),
  gheId: integer("gheId"),
  // Status
  status: text("status", { enum: ["ativo", "afastado", "ferias", "desligado"] }).default("ativo"),
  // Emergência
  emergencyContact: text("emergencyContact"),
  emergencyPhone: text("emergencyPhone"),
  // Saúde
  bloodType: text("bloodType"),
  allergies: text("allergies"),
  observations: text("observations"),
  userId: integer("userId").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

// ─── GHE ─────────────────────────────────────────────────────────────────────
export const ghes = sqliteTable("ghes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  sector: text("sector"),
  department: text("department"),
  activities: text("activities"),
  employeeCount: integer("employeeCount").default(0),
  userId: integer("userId").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});
export type Ghe = typeof ghes.$inferSelect;

// ─── RISKS ───────────────────────────────────────────────────────────────────
export const risks = sqliteTable("risks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gheId: integer("gheId").notNull(),
  agentType: text("agentType", { enum: ["fisico", "quimico", "biologico", "ergonomico", "acidente"] }).notNull(),
  agent: text("agent").notNull(),
  source: text("source"),
  exposure: text("exposure"),
  probability: integer("probability").notNull(), // 1-5
  severity: integer("severity").notNull(),       // 1-5
  riskLevel: text("riskLevel", { enum: ["toleravel", "moderado", "alto", "critico"] }),
  controlMeasures: text("controlMeasures"),
  epcRequired: text("epcRequired"),
  epiRequired: text("epiRequired"),
  limitValue: text("limitValue"),
  aposentadoriaEspecial: integer("aposentadoriaEspecial", { mode: "boolean" }).default(false),
  userId: integer("userId").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});
export type Risk = typeof risks.$inferSelect;

// ─── ACTION PLANS (5W2H) ─────────────────────────────────────────────────────
export const actionPlans = sqliteTable("actionPlans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // 5W2H
  what: text("what").notNull(),
  why: text("why"),
  who: text("who"),
  when: text("when"),
  where: text("where"),
  how: text("how"),
  howMuch: text("howMuch"),
  // Origem
  originType: text("originType", { enum: ["inspecao", "acidente", "risco", "auditoria", "manual"] }).default("manual"),
  originId: integer("originId"),
  // Controle
  deadline: text("deadline"),
  responsible: text("responsible"),
  status: text("status", { enum: ["aberta", "em_andamento", "concluida", "cancelada", "atrasada"] }).default("aberta"),
  priority: text("priority", { enum: ["baixa", "media", "alta", "critica"] }).default("media"),
  evidence: text("evidence"),
  completedAt: text("completedAt"),
  userId: integer("userId").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});
export type ActionPlan = typeof actionPlans.$inferSelect;

// ─── EXAMS / ASO ─────────────────────────────────────────────────────────────
export const exams = sqliteTable("exams", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: integer("employeeId").notNull(),
  employeeName: text("employeeName"),
  examType: text("examType", { enum: ["admissional", "periodico", "retorno", "mudanca_funcao", "demissional"] }).notNull(),
  examDate: text("examDate").notNull(),
  nextExamDate: text("nextExamDate"),
  doctor: text("doctor"),
  crm: text("crm"),
  clinic: text("clinic"),
  result: text("result", { enum: ["apto", "inapto", "apto_restricoes"] }).default("apto"),
  restrictions: text("restrictions"),
  observations: text("observations"),
  asoNumber: text("asoNumber"),
  userId: integer("userId").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});
export type Exam = typeof exams.$inferSelect;

// ─── EPIs ─────────────────────────────────────────────────────────────────────
export const epis = sqliteTable("epis", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  ca: text("ca"),
  manufacturer: text("manufacturer"),
  category: text("category"),
  validityMonths: integer("validityMonths"),
  stockQuantity: integer("stockQuantity").default(0),
  minStock: integer("minStock").default(5),
  unitCost: real("unitCost"),
  userId: integer("userId").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});
export type Epi = typeof epis.$inferSelect;

// ─── EPI DELIVERIES ───────────────────────────────────────────────────────────
export const epiDeliveries = sqliteTable("epiDeliveries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  epiId: integer("epiId").notNull(),
  epiName: text("epiName"),
  employeeId: integer("employeeId").notNull(),
  employeeName: text("employeeName"),
  quantity: integer("quantity").default(1),
  deliveryDate: text("deliveryDate").notNull(),
  returnDate: text("returnDate"),
  expiryDate: text("expiryDate"),
  reason: text("reason"),
  condition: text("condition", { enum: ["novo", "bom", "regular", "danificado"] }).default("novo"),
  accepted: integer("accepted", { mode: "boolean" }).default(false),
  acceptedAt: text("acceptedAt"),
  userId: integer("userId").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});
export type EpiDelivery = typeof epiDeliveries.$inferSelect;

// ─── PGR ─────────────────────────────────────────────────────────────────────
export const pgr = sqliteTable("pgr", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  company: text("company").notNull(),
  cnpj: text("cnpj"),
  version: text("version").default("1.0"),
  elaborationDate: text("elaborationDate"),
  nextRevisionDate: text("nextRevisionDate"),
  responsibleTechnician: text("responsibleTechnician"),
  crea: text("crea"),
  scope: text("scope"),
  methodology: text("methodology"),
  status: text("status", { enum: ["vigente", "revisao", "expirado"] }).default("vigente"),
  userId: integer("userId").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});
export type Pgr = typeof pgr.$inferSelect;

// ─── LTCAT ───────────────────────────────────────────────────────────────────
export const ltcat = sqliteTable("ltcat", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gheId: integer("gheId").notNull(),
  gheName: text("gheName"),
  agent: text("agent").notNull(),
  agentType: text("agentType"),
  exposureLevel: text("exposureLevel"),
  limitValue: text("limitValue"),
  techMethod: text("techMethod"),
  aposentadoriaEspecial: integer("aposentadoriaEspecial", { mode: "boolean" }).default(false),
  epcEffective: integer("epcEffective", { mode: "boolean" }).default(false),
  observations: text("observations"),
  userId: integer("userId").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});
export type Ltcat = typeof ltcat.$inferSelect;

// ─── CIPA ─────────────────────────────────────────────────────────────────────
export const cipaMandate = sqliteTable("cipaMandate", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  startDate: text("startDate").notNull(),
  endDate: text("endDate").notNull(),
  cnae: text("cnae"),
  employeeCount: integer("employeeCount"),
  grau: text("grau"),
  electedEffective: integer("electedEffective").default(0),
  electedAlternate: integer("electedAlternate").default(0),
  designatedEffective: integer("designatedEffective").default(0),
  designatedAlternate: integer("designatedAlternate").default(0),
  president: text("president"),
  secretary: text("secretary"),
  status: text("status", { enum: ["ativa", "encerrada"] }).default("ativa"),
  userId: integer("userId").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});
export type CipaMandate = typeof cipaMandate.$inferSelect;

export const cipaMeetings = sqliteTable("cipaMeetings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mandateId: integer("mandateId").notNull(),
  date: text("date").notNull(),
  type: text("type", { enum: ["ordinaria", "extraordinaria"] }).default("ordinaria"),
  pauta: text("pauta"),
  ata: text("ata"),
  attendees: text("attendees"),
  status: text("status", { enum: ["agendada", "realizada", "cancelada"] }).default("agendada"),
  userId: integer("userId").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});
export type CipaMeeting = typeof cipaMeetings.$inferSelect;

// ─── ESOCIAL ─────────────────────────────────────────────────────────────────
export const esocial = sqliteTable("esocial", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventType: text("eventType", { enum: ["S-2210", "S-2220", "S-2240"] }).notNull(),
  referenceId: integer("referenceId"),
  referenceType: text("referenceType"),
  employeeId: integer("employeeId"),
  employeeName: text("employeeName"),
  period: text("period"),
  status: text("status", { enum: ["pendente", "enviado", "processado", "erro", "cancelado"] }).default("pendente"),
  receiptNumber: text("receiptNumber"),
  xmlContent: text("xmlContent"),
  errorMessage: text("errorMessage"),
  sentAt: text("sentAt"),
  processedAt: text("processedAt"),
  userId: integer("userId").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});
export type Esocial = typeof esocial.$inferSelect;
