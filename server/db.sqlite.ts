import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "../drizzle/schema.sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "sid-sst.db");

// Create SQLite connection (creates file if not exists)
export const sqlite = new Database(DB_PATH);

// Enable WAL mode for better performance
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

// Initialize all tables
export function initializeDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'operacional',
      sector TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      lastSignedIn TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS accidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      time TEXT,
      location TEXT,
      employeeId TEXT,
      employeeName TEXT,
      type TEXT,
      severity TEXT NOT NULL,
      catFiled INTEGER DEFAULT 0,
      catNumber TEXT,
      investigationStatus TEXT DEFAULT 'pendente',
      userId INTEGER NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS diseases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      cid10 TEXT NOT NULL,
      description TEXT,
      employeeId TEXT,
      employeeName TEXT,
      diagnosisDate TEXT,
      absenceStartDate TEXT,
      absenceEndDate TEXT,
      medicalCertificateNumber TEXT,
      status TEXT DEFAULT 'diagnosticada',
      userId INTEGER NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS trainings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT,
      startDate TEXT NOT NULL,
      endDate TEXT,
      duration INTEGER,
      instructor TEXT,
      location TEXT,
      participants TEXT,
      status TEXT DEFAULT 'planejado',
      userId INTEGER NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS inspections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT,
      date TEXT NOT NULL,
      location TEXT,
      inspector TEXT,
      findings TEXT,
      nonConformities INTEGER DEFAULT 0,
      status TEXT DEFAULT 'planejada',
      userId INTEGER NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ppps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employeeId TEXT NOT NULL,
      employeeName TEXT NOT NULL,
      position TEXT,
      department TEXT,
      startDate TEXT,
      endDate TEXT,
      hazards TEXT,
      protectiveEquipment TEXT,
      medicalExaminations TEXT,
      status TEXT DEFAULT 'ativo',
      userId INTEGER NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS investigations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      accidentId INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      investigationDate TEXT NOT NULL,
      investigator TEXT,
      rootCauses TEXT,
      preventiveMeasures TEXT,
      correctiveMeasures TEXT,
      status TEXT DEFAULT 'aberta',
      userId INTEGER NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      theme TEXT,
      startDate TEXT NOT NULL,
      endDate TEXT,
      target TEXT,
      status TEXT DEFAULT 'planejada',
      userId INTEGER NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS auditLogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entityType TEXT NOT NULL,
      entityId TEXT,
      userId INTEGER NOT NULL,
      userName TEXT,
      description TEXT,
      changes TEXT,
      ipAddress TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  console.log("[Database] SQLite initialized at:", DB_PATH);
}

// Seed admin user if no users exist
export async function seedAdminUser() {
  const { createHash } = await import("crypto");
  
  const existingUsers = sqlite.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  
  if (existingUsers.count === 0) {
    const passwordHash = createHash("sha256").update("admin123").digest("hex");
    sqlite.prepare(`
      INSERT INTO users (name, email, passwordHash, role, sector)
      VALUES (?, ?, ?, ?, ?)
    `).run("Administrador SST", "admin@sid.com", passwordHash, "admin", "SST");

    console.log("[Database] Admin user created: admin@sid.com / admin123");
  }
}

export { schema };

// Initialize new sprint tables
export function initializeSprintTables() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cpf TEXT NOT NULL UNIQUE,
      rg TEXT, birthDate TEXT, gender TEXT, phone TEXT, email TEXT,
      address TEXT, city TEXT, state TEXT,
      matricula TEXT, position TEXT, department TEXT, sector TEXT,
      workRegime TEXT, admissionDate TEXT, dismissalDate TEXT, gheId INTEGER,
      status TEXT NOT NULL DEFAULT 'ativo',
      emergencyContact TEXT, emergencyPhone TEXT,
      bloodType TEXT, allergies TEXT, observations TEXT,
      userId INTEGER NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS ghes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL, description TEXT, sector TEXT, department TEXT,
      activities TEXT, employeeCount INTEGER DEFAULT 0,
      userId INTEGER NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS risks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gheId INTEGER NOT NULL, agentType TEXT NOT NULL, agent TEXT NOT NULL,
      source TEXT, exposure TEXT,
      probability INTEGER NOT NULL, severity INTEGER NOT NULL,
      riskLevel TEXT, controlMeasures TEXT,
      epcRequired TEXT, epiRequired TEXT, limitValue TEXT,
      aposentadoriaEspecial INTEGER DEFAULT 0,
      userId INTEGER NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS actionPlans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      what TEXT NOT NULL, why TEXT, who TEXT,
      "when" TEXT, "where" TEXT, how TEXT, howMuch TEXT,
      originType TEXT DEFAULT 'manual', originId INTEGER,
      deadline TEXT, responsible TEXT,
      status TEXT DEFAULT 'aberta', priority TEXT DEFAULT 'media',
      evidence TEXT, completedAt TEXT,
      userId INTEGER NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employeeId INTEGER NOT NULL, employeeName TEXT,
      examType TEXT NOT NULL, examDate TEXT NOT NULL,
      nextExamDate TEXT, doctor TEXT, crm TEXT, clinic TEXT,
      result TEXT DEFAULT 'apto', restrictions TEXT, observations TEXT, asoNumber TEXT,
      userId INTEGER NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS epis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL, description TEXT, ca TEXT,
      manufacturer TEXT, category TEXT, validityMonths INTEGER,
      stockQuantity INTEGER DEFAULT 0, minStock INTEGER DEFAULT 5,
      unitCost REAL,
      userId INTEGER NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS epiDeliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      epiId INTEGER NOT NULL, epiName TEXT,
      employeeId INTEGER NOT NULL, employeeName TEXT,
      quantity INTEGER DEFAULT 1,
      deliveryDate TEXT NOT NULL, returnDate TEXT, expiryDate TEXT,
      reason TEXT, condition TEXT DEFAULT 'novo',
      accepted INTEGER DEFAULT 0, acceptedAt TEXT,
      userId INTEGER NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS pgr (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company TEXT NOT NULL, cnpj TEXT, version TEXT DEFAULT '1.0',
      elaborationDate TEXT, nextRevisionDate TEXT,
      responsibleTechnician TEXT, crea TEXT,
      scope TEXT, methodology TEXT,
      status TEXT DEFAULT 'vigente',
      userId INTEGER NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS ltcat (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gheId INTEGER NOT NULL, gheName TEXT,
      agent TEXT NOT NULL, agentType TEXT,
      exposureLevel TEXT, limitValue TEXT, techMethod TEXT,
      aposentadoriaEspecial INTEGER DEFAULT 0,
      epcEffective INTEGER DEFAULT 0,
      observations TEXT,
      userId INTEGER NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS cipaMandate (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      startDate TEXT NOT NULL, endDate TEXT NOT NULL,
      cnae TEXT, employeeCount INTEGER, grau TEXT,
      electedEffective INTEGER DEFAULT 0, electedAlternate INTEGER DEFAULT 0,
      designatedEffective INTEGER DEFAULT 0, designatedAlternate INTEGER DEFAULT 0,
      president TEXT, secretary TEXT,
      status TEXT DEFAULT 'ativa',
      userId INTEGER NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS cipaMeetings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mandateId INTEGER NOT NULL, date TEXT NOT NULL,
      type TEXT DEFAULT 'ordinaria',
      pauta TEXT, ata TEXT, attendees TEXT,
      status TEXT DEFAULT 'agendada',
      userId INTEGER NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS esocial (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      eventType TEXT NOT NULL, referenceId INTEGER, referenceType TEXT,
      employeeId INTEGER, employeeName TEXT, period TEXT,
      status TEXT DEFAULT 'pendente',
      receiptNumber TEXT, xmlContent TEXT, errorMessage TEXT,
      sentAt TEXT, processedAt TEXT,
      userId INTEGER NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS trainingParticipants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trainingId INTEGER NOT NULL,
      employeeId INTEGER,
      employeeName TEXT NOT NULL,
      matricula TEXT,
      sector TEXT,
      position TEXT,
      attended INTEGER DEFAULT 0,
      certificateNumber TEXT,
      userId INTEGER NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  console.log("[Database] Sprint tables initialized ✓");
}

export function initializeEventsTable() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'outro',
      date TEXT NOT NULL,
      time TEXT,
      endDate TEXT,
      endTime TEXT,
      location TEXT,
      description TEXT,
      responsible TEXT,
      status TEXT DEFAULT 'agendado',
      recurrence TEXT DEFAULT 'nenhuma',
      userId INTEGER NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  console.log("[Database] Events table initialized ✓");
}

export function initializeAccidentInvestigationColumns() {
  const cols = [
    "ALTER TABLE accidents ADD COLUMN sector TEXT",
    "ALTER TABLE accidents ADD COLUMN immediateCauses TEXT",
    "ALTER TABLE accidents ADD COLUMN rootCauses TEXT",
    "ALTER TABLE accidents ADD COLUMN correctives TEXT",
    "ALTER TABLE accidents ADD COLUMN witnesses TEXT",
    "ALTER TABLE accidents ADD COLUMN cid TEXT",
    "ALTER TABLE accidents ADD COLUMN leaveDays INTEGER DEFAULT 0",
    "ALTER TABLE accidents ADD COLUMN leaveStartDate TEXT",
    "ALTER TABLE accidents ADD COLUMN bodyPart TEXT",
    "ALTER TABLE accidents ADD COLUMN injuryNature TEXT",
  ];
  for (const sql of cols) {
    try { sqlite.exec(sql); } catch {}
  }
  console.log("[Database] Accident investigation columns initialized ✓");
}

export function initializeAtestadosTable() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS atestados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employeeName TEXT NOT NULL,
      matricula TEXT,
      sector TEXT NOT NULL,
      jobFunction TEXT,
      cid TEXT NOT NULL,
      diagnosis TEXT NOT NULL,
      careLocation TEXT,
      startDate TEXT NOT NULL,
      days INTEGER NOT NULL DEFAULT 1,
      observations TEXT,
      userId INTEGER NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  console.log("[Database] Atestados table initialized ✓");
}
