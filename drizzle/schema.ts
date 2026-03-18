import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json, date } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extended with role field for SST system (admin, supervisor, operacional).
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "supervisor", "operacional", "user"]).default("operacional").notNull(),
  sector: varchar("sector", { length: 255 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Acidentes de Trabalho
 */
export const accidents = mysqlTable("accidents", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  date: date("date").notNull(),
  time: varchar("time", { length: 5 }),
  location: varchar("location", { length: 255 }),
  employeeId: varchar("employeeId", { length: 255 }),
  employeeName: varchar("employeeName", { length: 255 }),
  type: varchar("type", { length: 50 }), // Típico, Trajeto, Doença
  severity: mysqlEnum("severity", ["leve", "moderado", "grave", "fatal"]).notNull(),
  catFiled: boolean("catFiled").default(false),
  catNumber: varchar("catNumber", { length: 50 }),
  investigationStatus: mysqlEnum("investigationStatus", ["pendente", "em_progresso", "concluida"]).default("pendente"),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Accident = typeof accidents.$inferSelect;
export type InsertAccident = typeof accidents.$inferInsert;

/**
 * Doenças Ocupacionais
 */
export const diseases = mysqlTable("diseases", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  cid10: varchar("cid10", { length: 10 }).notNull(),
  description: text("description"),
  employeeId: varchar("employeeId", { length: 255 }),
  employeeName: varchar("employeeName", { length: 255 }),
  diagnosisDate: date("diagnosisDate"),
  absenceStartDate: date("absenceStartDate"),
  absenceEndDate: date("absenceEndDate"),
  medicalCertificateNumber: varchar("medicalCertificateNumber", { length: 50 }),
  status: mysqlEnum("status", ["diagnosticada", "afastada", "recuperada", "cronica"]).default("diagnosticada"),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Disease = typeof diseases.$inferSelect;
export type InsertDisease = typeof diseases.$inferInsert;

/**
 * Treinamentos de SST
 */
export const trainings = mysqlTable("trainings", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 100 }), // NR-6, NR-10, etc
  startDate: date("startDate").notNull(),
  endDate: date("endDate"),
  duration: int("duration"), // em horas
  instructor: varchar("instructor", { length: 255 }),
  location: varchar("location", { length: 255 }),
  participants: json("participants"), // Array de IDs de participantes
  certificateTemplate: varchar("certificateTemplate", { length: 255 }),
  status: mysqlEnum("status", ["planejado", "em_andamento", "concluido"]).default("planejado"),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Training = typeof trainings.$inferSelect;
export type InsertTraining = typeof trainings.$inferInsert;

/**
 * Inspeções de Segurança
 */
export const inspections = mysqlTable("inspections", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 100 }), // Padronizada, Personalizada
  date: date("date").notNull(),
  location: varchar("location", { length: 255 }),
  inspector: varchar("inspector", { length: 255 }),
  findings: json("findings"), // Array de achados
  nonConformities: int("nonConformities"),
  status: mysqlEnum("status", ["planejada", "em_andamento", "concluida"]).default("planejada"),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = typeof inspections.$inferInsert;

/**
 * PPP - Perfil Profissiográfico Previdenciário
 */
export const ppps = mysqlTable("ppps", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: varchar("employeeId", { length: 255 }).notNull(),
  employeeName: varchar("employeeName", { length: 255 }).notNull(),
  position: varchar("position", { length: 255 }),
  department: varchar("department", { length: 255 }),
  startDate: date("startDate"),
  endDate: date("endDate"),
  hazards: json("hazards"), // Array de riscos
  protectiveEquipment: json("protectiveEquipment"), // Array de EPIs
  medicalExaminations: json("medicalExaminations"), // Array de exames
  status: mysqlEnum("status", ["ativo", "finalizado", "revisao"]).default("ativo"),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PPP = typeof ppps.$inferSelect;
export type InsertPPP = typeof ppps.$inferInsert;

/**
 * Investigações de Acidentes
 */
export const investigations = mysqlTable("investigations", {
  id: int("id").autoincrement().primaryKey(),
  accidentId: int("accidentId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  investigationDate: date("investigationDate").notNull(),
  investigator: varchar("investigator", { length: 255 }),
  rootCauses: text("rootCauses"),
  preventiveMeasures: text("preventiveMeasures"),
  correctiveMeasures: text("correctiveMeasures"),
  status: mysqlEnum("status", ["aberta", "em_andamento", "fechada"]).default("aberta"),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Investigation = typeof investigations.$inferSelect;
export type InsertInvestigation = typeof investigations.$inferInsert;

/**
 * Campanhas de Segurança
 */
export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  theme: varchar("theme", { length: 255 }),
  startDate: date("startDate").notNull(),
  endDate: date("endDate"),
  target: varchar("target", { length: 255 }), // Todos, Setor específico
  materials: json("materials"), // Array de URLs de materiais
  status: mysqlEnum("status", ["planejada", "em_andamento", "concluida"]).default("planejada"),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

/**
 * Logs de Auditoria
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  action: varchar("action", { length: 100 }).notNull(), // CREATE, UPDATE, DELETE, LOGIN, etc
  entityType: varchar("entityType", { length: 100 }).notNull(), // accident, disease, training, etc
  entityId: varchar("entityId", { length: 255 }),
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 255 }),
  description: text("description"),
  changes: json("changes"), // Antes e depois
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Documentos Gerados
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(), // PPP, Relatório, Atestado, etc
  entityType: varchar("entityType", { length: 100 }),
  entityId: varchar("entityId", { length: 255 }),
  fileUrl: text("fileUrl"),
  fileSize: int("fileSize"),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;