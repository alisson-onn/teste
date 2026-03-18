import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { router, protectedProcedure } from "./_core/trpc";
import { db, schema, sqlite } from "./db.sqlite";

// ─── ACCIDENTS ───────────────────────────────────────────────────────────────
export const accidentsRouter = router({
  list: protectedProcedure.query(async () => {
    return db.select().from(schema.accidents).orderBy(desc(schema.accidents.createdAt));
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const result = await db.select().from(schema.accidents).where(eq(schema.accidents.id, input.id)).limit(1);
      return result[0] ?? null;
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      date: z.string(),
      time: z.string().optional(),
      location: z.string().optional(),
      sector: z.string().optional(),
      employeeId: z.string().optional(),
      employeeName: z.string().optional(),
      type: z.string().optional(),
      severity: z.enum(["leve", "moderado", "grave", "fatal"]),
      immediateCauses: z.string().optional(),
      rootCauses: z.string().optional(),
      correctives: z.string().optional(),
      witnesses: z.string().optional(),
      catFiled: z.boolean().optional(),
      catNumber: z.string().optional(),
      cid: z.string().optional(),
      leaveDays: z.number().optional(),
      leaveStartDate: z.string().optional(),
      bodyPart: z.string().optional(),
      injuryNature: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = sqlite.prepare(`
        INSERT INTO accidents (title, description, date, time, location, sector, employeeId, employeeName, type, severity,
          immediateCauses, rootCauses, correctives, witnesses,
          catFiled, catNumber, cid, leaveDays, leaveStartDate, bodyPart, injuryNature,
          investigationStatus, userId, createdAt, updatedAt)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pendente',?,datetime('now'),datetime('now'))
      `).run(
        input.title, input.description ?? null, input.date, input.time ?? null, input.location ?? null, input.sector ?? null,
        input.employeeId ?? null, input.employeeName ?? null, input.type ?? null, input.severity,
        input.immediateCauses ?? null, input.rootCauses ?? null, input.correctives ?? null, input.witnesses ?? null,
        input.catFiled ? 1 : 0, input.catNumber ?? null, input.cid ?? null, input.leaveDays ?? 0, input.leaveStartDate ?? null,
        input.bodyPart ?? null, input.injuryNature ?? null,
        ctx.user.id
      );
      return sqlite.prepare(`SELECT * FROM accidents WHERE id = ?`).get(result.lastInsertRowid);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      date: z.string().optional(),
      time: z.string().optional(),
      location: z.string().optional(),
      sector: z.string().optional(),
      employeeId: z.string().optional(),
      employeeName: z.string().optional(),
      type: z.string().optional(),
      severity: z.enum(["leve", "moderado", "grave", "fatal"]).optional(),
      immediateCauses: z.string().optional(),
      rootCauses: z.string().optional(),
      correctives: z.string().optional(),
      witnesses: z.string().optional(),
      catFiled: z.boolean().optional(),
      catNumber: z.string().optional(),
      cid: z.string().optional(),
      leaveDays: z.number().optional(),
      leaveStartDate: z.string().optional(),
      bodyPart: z.string().optional(),
      injuryNature: z.string().optional(),
      investigationStatus: z.enum(["pendente", "em_progresso", "concluida"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const result = await db.update(schema.accidents).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(schema.accidents.id, id)).returning();
      return result[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(schema.accidents).where(eq(schema.accidents.id, input.id));
      return { success: true };
    }),
});

// ─── ACCIDENT ANALYSIS ───────────────────────────────────────────────────────
export const accidentAnalysisRouter = router({
  sectors: protectedProcedure.query(() => {
    return (sqlite.prepare(
      `SELECT DISTINCT sector FROM accidents WHERE sector IS NOT NULL AND sector != '' ORDER BY sector`
    ).all() as any[]).map((r: any) => r.sector as string);
  }),

  stats: protectedProcedure
    .input(z.object({
      year:          z.number().optional(),
      months:        z.array(z.number().min(1).max(12)).optional(), // [] = todo o ano
      sectors:       z.array(z.string()).optional(),
      types:         z.array(z.string()).optional(),
      injuryNatures: z.array(z.string()).optional(),
      catFilter:     z.enum(["", "Sim", "Nao"]).optional(),
      absenceFilter: z.enum(["", "com", "sem"]).optional(),
    }).optional())
    .query(({ input }) => {
      const now = new Date();
      const selectedYear = input?.year ?? now.getFullYear();

      // Always query full year; apply month/other filters in-memory
      const startStr = `${selectedYear}-01-01`;
      const endStr   = `${selectedYear}-12-31`;
      const monthsInPeriod = input?.months?.length ? input.months.length : 12;

      const raw = sqlite.prepare(`SELECT * FROM accidents WHERE date >= ? AND date <= ? ORDER BY date DESC`).all(startStr, endStr) as any[];

      // ── Apply all filters in-memory ──────────────────────────────────────
      let all = [...raw];
      if (input?.months?.length) {
        const mSet = new Set(input.months.map(m => String(m).padStart(2, "0")));
        all = all.filter(r => r.date && mSet.has((r.date as string).slice(5, 7)));
      }
      if (input?.sectors?.length) {
        const sSet = new Set(input.sectors);
        all = all.filter(r => sSet.has(r.sector));
      }
      if (input?.types?.length) {
        const tSet = new Set(input.types);
        all = all.filter(r => tSet.has(r.type));
      }
      if (input?.injuryNatures?.length) {
        const nSet = new Set(input.injuryNatures);
        all = all.filter(r => nSet.has(r.injuryNature));
      }
      if (input?.catFilter === "Sim") all = all.filter(r => r.catFiled);
      if (input?.catFilter === "Nao") all = all.filter(r => !r.catFiled);
      if (input?.absenceFilter === "com") all = all.filter(r => r.leaveDays && r.leaveDays > 0);
      if (input?.absenceFilter === "sem") all = all.filter(r => !r.leaveDays || r.leaveDays === 0);
      const total = all.length;

      // Previous period for comparison (same period, previous year — apply same non-date filters)
      const prevYear  = selectedYear - 1;
      const prevStart = `${prevYear}-01-01`;
      const prevEnd   = `${prevYear}-12-31`;
      let prev = sqlite.prepare(`SELECT * FROM accidents WHERE date >= ? AND date <= ?`).all(prevStart, prevEnd) as any[];
      if (input?.months?.length) {
        const mSet = new Set(input.months.map(m => String(m).padStart(2, "0")));
        prev = prev.filter(r => r.date && mSet.has((r.date as string).slice(5, 7)));
      }
      if (input?.sectors?.length)       { const s = new Set(input.sectors);        prev = prev.filter(r => s.has(r.sector)); }
      if (input?.types?.length)         { const t = new Set(input.types);          prev = prev.filter(r => t.has(r.type)); }
      if (input?.injuryNatures?.length) { const n = new Set(input.injuryNatures);  prev = prev.filter(r => n.has(r.injuryNature)); }
      if (input?.catFilter === "Sim")   prev = prev.filter(r => r.catFiled);
      if (input?.catFilter === "Nao")   prev = prev.filter(r => !r.catFiled);
      if (input?.absenceFilter === "com") prev = prev.filter(r => r.leaveDays && r.leaveDays > 0);
      if (input?.absenceFilter === "sem") prev = prev.filter(r => !r.leaveDays || r.leaveDays === 0);
      const prevTotal = prev.length;

      // By severity
      const sevMap: Record<string,number> = { leve:0, moderado:0, grave:0, fatal:0 };
      all.forEach((r: any) => { if (sevMap[r.severity] !== undefined) sevMap[r.severity]++; });
      const bySeverity = Object.entries(sevMap).map(([name, value]) => ({ name, value }));

      // By type
      const typeMap: Record<string,number> = {};
      all.forEach((r: any) => {
        const t = r.type || "Não informado";
        typeMap[t] = (typeMap[t] ?? 0) + 1;
      });
      const byType = Object.entries(typeMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0,8);

      // By location
      const locMap: Record<string,number> = {};
      all.forEach((r: any) => {
        const l = r.location || "Não informado";
        locMap[l] = (locMap[l] ?? 0) + 1;
      });
      const byLocation = Object.entries(locMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0,8);

      // By day of week (parse date components to avoid UTC shift)
      const dow = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
      const dowMap: Record<string,number> = { Dom:0,Seg:0,Ter:0,Qua:0,Qui:0,Sex:0,"Sáb":0 };
      all.forEach((r: any) => {
        if (r.date) {
          const [y,mo,da] = r.date.split("-").map(Number);
          const d = new Date(y, mo - 1, da); // local date, no UTC shift
          dowMap[dow[d.getDay()]]++;
        }
      });
      const byDayOfWeek = dow.map(d => ({ day: d, total: dowMap[d] }));

      // By hour
      const hourMap: Record<number,number> = {};
      for (let h = 0; h < 24; h++) hourMap[h] = 0;
      all.forEach((r: any) => {
        if (r.time) {
          const h = parseInt(r.time.split(":")[0], 10);
          if (!isNaN(h)) hourMap[h] = (hourMap[h] ?? 0) + 1;
        }
      });
      const byHour = Object.entries(hourMap).map(([h, n]) => ({ hora: `${h.padStart(2,"0")}h`, total: n }));

      // Monthly evolution — all 12 months, computed from filtered data
      const curMonth = selectedYear === now.getFullYear() ? now.getMonth() : 11;
      const monthlyEvolution = Array.from({ length: 12 }, (_, i) => {
        const mo   = String(i + 1).padStart(2, "0");
        const label = new Date(selectedYear, i, 1).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
        const rows  = all.filter(r => r.date && (r.date as string).startsWith(`${selectedYear}-${mo}`));
        const obj: Record<string, any> = { mes: label, total: 0, leve: 0, moderado: 0, grave: 0, fatal: 0 };
        rows.forEach((r: any) => { if (obj[r.severity] !== undefined) { obj[r.severity]++; obj.total++; } });
        return obj;
      });

      // Year over year: selectedYear vs selectedYear-1 (from filtered data for current year)
      const byMonth12 = Array.from({ length: 12 }, (_, i) => {
        const mo    = String(i + 1).padStart(2, "0");
        const label = new Date(2000, i, 1).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
        const cur   = (selectedYear < now.getFullYear() || i <= curMonth)
          ? all.filter(r => r.date && (r.date as string).startsWith(`${selectedYear}-${mo}`)).length
          : null;
        const pyr   = prev.filter(r => r.date && (r.date as string).startsWith(`${prevYear}-${mo}`)).length;
        return { mes: label, anoAtual: cur, anoAnterior: pyr };
      });

      // Investigation funnel
      const invMap: Record<string,number> = { pendente:0, em_progresso:0, concluida:0 };
      all.forEach((r: any) => { if (r.investigationStatus && invMap[r.investigationStatus] !== undefined) invMap[r.investigationStatus]++; });
      const investigationFunnel = [
        { name: "Pendente", value: invMap.pendente, color: "#EF4444" },
        { name: "Em Progresso", value: invMap.em_progresso, color: "#F59E0B" },
        { name: "Concluída", value: invMap.concluida, color: "#10B981" },
      ];

      // CAT
      const catFiled = all.filter((r: any) => r.catFiled).length;
      const catPending = all.filter((r: any) => !r.catFiled && (r.severity === "grave" || r.severity === "fatal")).length;

      // Accident-free days (days since last accident ever recorded)
      const lastAcc = sqlite.prepare(`SELECT date FROM accidents ORDER BY date DESC LIMIT 1`).get() as any;
      const accidentFreeDays = lastAcc?.date
        ? Math.floor((Date.now() - new Date(lastAcc.date).getTime()) / 86400000)
        : -1; // -1 = no accidents ever registered

      // Top employees with accidents
      const empMap: Record<string,{ name:string; total:number; grave:number }> = {};
      all.forEach((r: any) => {
        const k = r.employeeName || "Não informado";
        if (!empMap[k]) empMap[k] = { name:k, total:0, grave:0 };
        empMap[k].total++;
        if (r.severity === "grave" || r.severity === "fatal") empMap[k].grave++;
      });
      const topEmployees = Object.values(empMap).sort((a,b)=>b.total-a.total).slice(0,8);

      // TF and TG — NR-4 formula: (N / HHT) × 1.000.000
      // HHT = employees × workdays × 8h (22 workdays/month, 8h/day)
      const empCount = (sqlite.prepare(`SELECT COUNT(*) as c FROM employees WHERE status='ativo'`).get() as any)?.c ?? 0;
      const hht = empCount > 0 ? empCount * monthsInPeriod * 22 * 8 : 0;
      const graveOrFatal = all.filter((r: any) => r.severity === "grave" || r.severity === "fatal").length;
      // tf/tg = 0 when no employee data (prevents misleading inflated values)
      const tf = hht > 0 ? parseFloat(((total / hht) * 1_000_000).toFixed(2)) : 0;
      const tg = hht > 0 ? parseFloat(((graveOrFatal / hht) * 1_000_000).toFixed(2)) : 0;

      // Recent 5
      const recent = all.slice(0, 5).map((r: any) => ({
        id: r.id, title: r.title, date: r.date, severity: r.severity,
        location: r.location, employeeName: r.employeeName, investigationStatus: r.investigationStatus,
      }));

      // Heatmap: Dia da semana × Turno
      const HMDAYS = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
      const heatM: Record<string, {manha:number;tarde:number;noite:number}> = {};
      HMDAYS.forEach(d => { heatM[d] = { manha:0, tarde:0, noite:0 }; });
      all.forEach((r: any) => {
        if (r.date) {
          const [y,mo,da] = r.date.split("-").map(Number);
          const dow = (new Date(y, mo-1, da).getDay() + 6) % 7; // Mon=0
          const dayKey = HMDAYS[dow];
          let shift: "manha"|"tarde"|"noite" = "noite";
          if (r.time) {
            const h = parseInt(r.time.split(":")[0], 10);
            if (!isNaN(h)) {
              if (h >= 6 && h < 12) shift = "manha";
              else if (h >= 12 && h < 18) shift = "tarde";
            }
          }
          heatM[dayKey][shift]++;
        }
      });
      const heatmapMatrix = HMDAYS.map(d => ({ day: d, ...heatM[d] }));

      // By body part
      const bodyPartMap: Record<string,number> = {};
      all.forEach((r: any) => { if (r.bodyPart) bodyPartMap[r.bodyPart] = (bodyPartMap[r.bodyPart] ?? 0) + 1; });
      const byBodyPart = Object.entries(bodyPartMap).map(([name,value]) => ({ name, value })).sort((a,b) => b.value-a.value).slice(0,10);

      // By injury nature
      const injuryMap: Record<string,number> = {};
      all.forEach((r: any) => { if (r.injuryNature) injuryMap[r.injuryNature] = (injuryMap[r.injuryNature] ?? 0) + 1; });
      const byInjuryNature = Object.entries(injuryMap).map(([name,value]) => ({ name, value })).sort((a,b) => b.value-a.value);

      // By immediate cause (first line of the field)
      const causeMap: Record<string,number> = {};
      all.forEach((r: any) => {
        if (r.immediateCauses?.trim()) {
          const c = r.immediateCauses.split("\n")[0].trim().slice(0, 55);
          if (c) causeMap[c] = (causeMap[c] ?? 0) + 1;
        }
      });
      const byImmediateCause = Object.entries(causeMap).map(([name,value]) => ({ name, value })).sort((a,b) => b.value-a.value).slice(0,8);

      // Atestados temporal — same year as selected
      const atestadosTemporal = Array.from({ length: 12 }, (_, i) => {
        const mo    = String(i + 1).padStart(2, "0");
        const ym    = `${selectedYear}-${mo}`;
        const label = new Date(selectedYear, i, 1).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
        const row   = sqlite.prepare(`SELECT COUNT(*) as total, COALESCE(SUM(days),0) as dias FROM atestados WHERE strftime('%Y-%m', startDate) = ?`).get(ym) as any;
        return { mes: label, total: row?.total ?? 0, dias: row?.dias ?? 0 };
      });

      return {
        total, prevTotal, tf, tg, accidentFreeDays,
        catFiled, catPending, graveOrFatal,
        bySeverity, byType, byLocation, byDayOfWeek, byHour,
        monthlyEvolution, byMonth12, investigationFunnel, topEmployees, recent,
        empCount, heatmapMatrix, byBodyPart, byInjuryNature, byImmediateCause, atestadosTemporal,
      };
    }),
});

// ─── DISEASES ────────────────────────────────────────────────────────────────
export const diseasesRouter = router({
  list: protectedProcedure.query(async () => {
    return db.select().from(schema.diseases).orderBy(desc(schema.diseases.createdAt));
  }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      cid10: z.string().min(1),
      description: z.string().optional(),
      employeeId: z.string().optional(),
      employeeName: z.string().optional(),
      diagnosisDate: z.string().optional(),
      absenceStartDate: z.string().optional(),
      absenceEndDate: z.string().optional(),
      status: z.enum(["diagnosticada", "afastada", "recuperada", "cronica"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await db.insert(schema.diseases).values({ ...input, userId: ctx.user.id }).returning();
      return result[0];
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      cid10: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["diagnosticada", "afastada", "recuperada", "cronica"]).optional(),
      absenceStartDate: z.string().optional(),
      absenceEndDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const result = await db.update(schema.diseases).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(schema.diseases.id, id)).returning();
      return result[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(schema.diseases).where(eq(schema.diseases.id, input.id));
      return { success: true };
    }),

  analytics: protectedProcedure.query(async () => {
    const now = new Date();
    const last12: { ym: string; label: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      last12.push({ ym, label });
    }

    const monthly = last12.map(m => {
      const row = sqlite.prepare(`
        SELECT COUNT(*) as total,
          SUM(CASE WHEN status='afastada' THEN 1 ELSE 0 END) as afastamentos,
          SUM(CASE WHEN status='cronica' THEN 1 ELSE 0 END) as cronicas,
          SUM(CASE WHEN status='recuperada' THEN 1 ELSE 0 END) as recuperadas
        FROM diseases
        WHERE strftime('%Y-%m', COALESCE(diagnosisDate, createdAt)) = ?
      `).get(m.ym) as any;
      return { ym: m.ym, mes: m.label, total: row?.total ?? 0, afastamentos: row?.afastamentos ?? 0, cronicas: row?.cronicas ?? 0, recuperadas: row?.recuperadas ?? 0 };
    });

    const bySector = sqlite.prepare(`
      SELECT COALESCE(e.department, 'Não informado') as sector,
        COUNT(*) as total,
        SUM(CASE WHEN d.status='afastada' THEN 1 ELSE 0 END) as afastamentos,
        SUM(CASE WHEN d.status='cronica' THEN 1 ELSE 0 END) as cronicas
      FROM diseases d
      LEFT JOIN employees e ON d.employeeId = CAST(e.id AS TEXT)
      GROUP BY sector ORDER BY total DESC LIMIT 8
    `).all() as any[];

    const last6yms = last12.slice(-6).map(m => m.ym);
    const heatmapRaw = sqlite.prepare(`
      SELECT COALESCE(e.department, 'Não informado') as sector,
        strftime('%Y-%m', COALESCE(d.diagnosisDate, d.createdAt)) as ym,
        COUNT(*) as n
      FROM diseases d
      LEFT JOIN employees e ON d.employeeId = CAST(e.id AS TEXT)
      WHERE strftime('%Y-%m', COALESCE(d.diagnosisDate, d.createdAt)) >= ?
      GROUP BY sector, ym
    `).all(last6yms[0]) as any[];

    const topSectorsForHeat = bySector.slice(0, 6).map((r: any) => r.sector as string);
    const heatmap = topSectorsForHeat.map(sector => {
      const row: Record<string, any> = { sector };
      last6yms.forEach(ym => {
        const found = heatmapRaw.find((r: any) => r.sector === sector && r.ym === ym);
        row[ym] = found?.n ?? 0;
      });
      return row;
    });

    const topCids = sqlite.prepare(`
      SELECT cid10, title, COUNT(*) as total,
        SUM(CASE WHEN status='afastada' THEN 1 ELSE 0 END) as afastamentos
      FROM diseases GROUP BY cid10 ORDER BY total DESC LIMIT 10
    `).all() as any[];

    const statusRow = sqlite.prepare(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN status='afastada' THEN 1 ELSE 0 END) as afastados,
        SUM(CASE WHEN status='cronica' THEN 1 ELSE 0 END) as cronicos,
        SUM(CASE WHEN status='recuperada' THEN 1 ELSE 0 END) as recuperados,
        SUM(CASE WHEN status='diagnosticada' THEN 1 ELSE 0 END) as diagnosticados
      FROM diseases
    `).get() as any;

    const absRow = sqlite.prepare(`
      SELECT AVG(CAST(julianday(COALESCE(absenceEndDate, date('now'))) - julianday(absenceStartDate) AS INTEGER)) as avgDays
      FROM diseases WHERE absenceStartDate IS NOT NULL
    `).get() as any;

    return {
      monthly,
      bySector,
      heatmap,
      heatmapMonths: last6yms.map(ym => {
        const m = last12.find(x => x.ym === ym);
        return { ym, label: m?.label ?? ym };
      }),
      topCids,
      statusBreakdown: statusRow ?? {},
      avgAbsenceDays: Math.round(absRow?.avgDays ?? 0),
      topSector: bySector[0] ?? null,
      mainCid: topCids[0] ?? null,
    };
  }),
});

// ─── TRAININGS ───────────────────────────────────────────────────────────────
export const trainingsRouter = router({
  list: protectedProcedure.query(async () => {
    const trainings = await db.select().from(schema.trainings).orderBy(desc(schema.trainings.createdAt));
    const counts = sqlite.prepare(
      "SELECT trainingId, COUNT(*) as n FROM trainingParticipants GROUP BY trainingId"
    ).all() as { trainingId: number; n: number }[];
    const countMap = Object.fromEntries(counts.map(c => [c.trainingId, c.n]));
    return trainings.map(t => ({ ...t, participantCount: countMap[t.id] ?? 0 }));
  }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      type: z.string().optional(),
      startDate: z.string(),
      endDate: z.string().optional(),
      duration: z.number().optional(),
      instructor: z.string().optional(),
      location: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await db.insert(schema.trainings).values({ ...input, userId: ctx.user.id }).returning();
      return result[0];
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      status: z.enum(["planejado", "em_andamento", "concluido"]).optional(),
      endDate: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const result = await db.update(schema.trainings).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(schema.trainings.id, id)).returning();
      return result[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      sqlite.prepare("DELETE FROM trainingParticipants WHERE trainingId = ?").run(input.id);
      await db.delete(schema.trainings).where(eq(schema.trainings.id, input.id));
      return { success: true };
    }),

  listParticipants: protectedProcedure
    .input(z.object({ trainingId: z.number() }))
    .query(({ input }) =>
      sqlite.prepare("SELECT * FROM trainingParticipants WHERE trainingId = ? ORDER BY employeeName").all(input.trainingId) as any[]
    ),

  addParticipant: protectedProcedure
    .input(z.object({
      trainingId: z.number(),
      employeeId: z.number().optional(),
      employeeName: z.string().min(1),
      matricula: z.string().optional(),
      sector: z.string().optional(),
      position: z.string().optional(),
    }))
    .mutation(({ input, ctx }) => {
      sqlite.prepare(
        "INSERT INTO trainingParticipants (trainingId, employeeId, employeeName, matricula, sector, position, userId) VALUES (?,?,?,?,?,?,?)"
      ).run(input.trainingId, input.employeeId ?? null, input.employeeName, input.matricula ?? null, input.sector ?? null, input.position ?? null, ctx.user.id);
      return { success: true };
    }),

  removeParticipant: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => {
      sqlite.prepare("DELETE FROM trainingParticipants WHERE id = ?").run(input.id);
      return { success: true };
    }),

  markAttended: protectedProcedure
    .input(z.object({ id: z.number(), attended: z.boolean() }))
    .mutation(({ input }) => {
      sqlite.prepare("UPDATE trainingParticipants SET attended = ? WHERE id = ?").run(input.attended ? 1 : 0, input.id);
      return { success: true };
    }),
});

// ─── INSPECTIONS ─────────────────────────────────────────────────────────────
export const inspectionsRouter = router({
  list: protectedProcedure.query(async () => {
    return db.select().from(schema.inspections).orderBy(desc(schema.inspections.createdAt));
  }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      type: z.string().optional(),
      date: z.string(),
      location: z.string().optional(),
      inspector: z.string().optional(),
      nonConformities: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await db.insert(schema.inspections).values({ ...input, userId: ctx.user.id }).returning();
      return result[0];
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      status: z.enum(["planejada", "em_andamento", "concluida"]).optional(),
      nonConformities: z.number().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const result = await db.update(schema.inspections).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(schema.inspections.id, id)).returning();
      return result[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(schema.inspections).where(eq(schema.inspections.id, input.id));
      return { success: true };
    }),
});

// ─── PPPs ────────────────────────────────────────────────────────────────────
export const pppsRouter = router({
  list: protectedProcedure.query(async () => {
    return db.select().from(schema.ppps).orderBy(desc(schema.ppps.createdAt));
  }),

  create: protectedProcedure
    .input(z.object({
      employeeId: z.string().min(1),
      employeeName: z.string().min(1),
      position: z.string().optional(),
      department: z.string().optional(),
      startDate: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await db.insert(schema.ppps).values({ ...input, userId: ctx.user.id }).returning();
      return result[0];
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["ativo", "finalizado", "revisao"]).optional(),
      endDate: z.string().optional(),
      position: z.string().optional(),
      department: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const result = await db.update(schema.ppps).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(schema.ppps.id, id)).returning();
      return result[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(schema.ppps).where(eq(schema.ppps.id, input.id));
      return { success: true };
    }),
});

// ─── INVESTIGATIONS ──────────────────────────────────────────────────────────
export const investigationsRouter = router({
  list: protectedProcedure.query(async () => {
    return db.select().from(schema.investigations).orderBy(desc(schema.investigations.createdAt));
  }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      accidentId: z.number().optional(),
      description: z.string().optional(),
      investigationDate: z.string(),
      investigator: z.string().optional(),
      rootCauses: z.string().optional(),
      preventiveMeasures: z.string().optional(),
      correctiveMeasures: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await db.insert(schema.investigations).values({ ...input, userId: ctx.user.id }).returning();
      return result[0];
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["aberta", "em_andamento", "fechada"]).optional(),
      rootCauses: z.string().optional(),
      preventiveMeasures: z.string().optional(),
      correctiveMeasures: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const result = await db.update(schema.investigations).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(schema.investigations.id, id)).returning();
      return result[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(schema.investigations).where(eq(schema.investigations.id, input.id));
      return { success: true };
    }),
});

// ─── CAMPAIGNS ───────────────────────────────────────────────────────────────
export const campaignsRouter = router({
  list: protectedProcedure.query(async () => {
    return db.select().from(schema.campaigns).orderBy(desc(schema.campaigns.createdAt));
  }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      theme: z.string().optional(),
      startDate: z.string(),
      endDate: z.string().optional(),
      target: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await db.insert(schema.campaigns).values({ ...input, userId: ctx.user.id }).returning();
      return result[0];
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["planejada", "em_andamento", "concluida"]).optional(),
      endDate: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const result = await db.update(schema.campaigns).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(schema.campaigns.id, id)).returning();
      return result[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(schema.campaigns).where(eq(schema.campaigns.id, input.id));
      return { success: true };
    }),
});

// ─── AUDIT LOGS ──────────────────────────────────────────────────────────────
export const auditRouter = router({
  list: protectedProcedure.query(async () => {
    return db.select().from(schema.auditLogs).orderBy(desc(schema.auditLogs.createdAt)).limit(200);
  }),
});

// ─── USERS (admin only) ──────────────────────────────────────────────────────
export const usersRouter = router({
  list: protectedProcedure.query(async () => {
    return db.select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.users.role,
      sector: schema.users.sector,
      active: schema.users.active,
      lastSignedIn: schema.users.lastSignedIn,
      createdAt: schema.users.createdAt,
    }).from(schema.users).orderBy(schema.users.name);
  }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(6),
      role: z.enum(["admin", "supervisor", "operacional"]),
      sector: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { createHash } = await import("crypto");
      const passwordHash = createHash("sha256").update(input.password).digest("hex");
      const result = await db.insert(schema.users).values({
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role,
        sector: input.sector,
      }).returning({ id: schema.users.id, name: schema.users.name, email: schema.users.email });
      return result[0];
    }),

  toggleActive: protectedProcedure
    .input(z.object({ id: z.number(), active: z.boolean() }))
    .mutation(async ({ input }) => {
      await db.update(schema.users).set({ active: input.active }).where(eq(schema.users.id, input.id));
      return { success: true };
    }),
});

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
// ─── ATESTADOS ───────────────────────────────────────────────────────────────
export const atestadosRouter = router({
  list: protectedProcedure
    .input(z.object({
      period: z.enum(["mes","trimestre","semestre","ano","tudo"]).default("tudo"),
      sector: z.string().optional(),
      cid: z.string().optional(),
      minDays: z.number().optional(),
      maxDays: z.number().optional(),
    }).optional())
    .query(({ input }) => {
      let where = "WHERE 1=1";
      const params: any[] = [];
      if (input?.period && input.period !== "tudo") {
        const monthsBack = { mes: 0, trimestre: 2, semestre: 5, ano: 11 }[input.period] ?? 0;
        const start = new Date(); start.setMonth(start.getMonth() - monthsBack); start.setDate(1);
        where += " AND startDate >= ?"; params.push(start.toISOString().slice(0, 10));
      }
      if (input?.sector) { where += " AND sector = ?"; params.push(input.sector); }
      if (input?.cid) { where += " AND UPPER(cid) LIKE ?"; params.push(`%${input.cid.toUpperCase()}%`); }
      if (input?.minDays !== undefined) { where += " AND days >= ?"; params.push(input.minDays); }
      if (input?.maxDays !== undefined) { where += " AND days <= ?"; params.push(input.maxDays); }
      return sqlite.prepare(`SELECT * FROM atestados ${where} ORDER BY startDate DESC`).all(...params);
    }),

  create: protectedProcedure
    .input(z.object({
      employeeName: z.string().min(1),
      matricula: z.string().optional(),
      sector: z.string().min(1),
      jobFunction: z.string().optional(),
      cid: z.string().min(1),
      diagnosis: z.string().min(1),
      careLocation: z.string().optional(),
      startDate: z.string(),
      days: z.number().min(1),
      observations: z.string().optional(),
    }))
    .mutation(({ input, ctx }) => {
      const stmt = sqlite.prepare(`
        INSERT INTO atestados (employeeName,matricula,sector,jobFunction,cid,diagnosis,careLocation,startDate,days,observations,userId)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)
      `);
      const r = stmt.run(
        input.employeeName, input.matricula ?? null, input.sector,
        input.jobFunction ?? null, input.cid, input.diagnosis,
        input.careLocation ?? null, input.startDate, input.days,
        input.observations ?? null, ctx.user.id
      );
      return { id: r.lastInsertRowid };
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => {
      sqlite.prepare(`DELETE FROM atestados WHERE id = ?`).run(input.id);
      return { success: true };
    }),

  temporal: protectedProcedure
    .input(z.object({
      startA:       z.string().default(""),
      endA:         z.string().default(""),
      startB:       z.string().optional(),
      endB:         z.string().optional(),
      sectors:      z.array(z.string()).default([]),
      cids:         z.array(z.string()).default([]),
      jobFunctions: z.array(z.string()).default([]),
      minDays:      z.number().optional(),
      maxDays:      z.number().optional(),
    }))
    .query(({ input }) => {
      const now = new Date();
      const toYM = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const curYM = toYM(now);
      const threeAgo = toYM(new Date(now.getFullYear(), now.getMonth() - 2, 1));
      const startA = input.startA || threeAgo;
      const endA   = input.endA   || curYM;

      const ymToLabel = (ym: string) => {
        const [y, m] = ym.split("-");
        const d = new Date(parseInt(y), parseInt(m) - 1, 1);
        return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");
      };

      // Build shared filter conditions
      const extraConds: string[] = [];
      const extraParams: any[] = [];
      if (input.sectors.length > 0) {
        extraConds.push(`sector IN (${input.sectors.map(() => "?").join(",")})`);
        extraParams.push(...input.sectors);
      }
      if (input.cids.length > 0) {
        extraConds.push(`(${input.cids.map(() => "UPPER(cid) LIKE ?").join(" OR ")})`);
        extraParams.push(...input.cids.map(c => `%${c.toUpperCase()}%`));
      }
      if (input.jobFunctions.length > 0) {
        extraConds.push(`(${input.jobFunctions.map(() => "jobFunction LIKE ?").join(" OR ")})`);
        extraParams.push(...input.jobFunctions.map(f => `%${f}%`));
      }
      if (input.minDays !== undefined) {
        extraConds.push(`days >= ?`);
        extraParams.push(input.minDays);
      }
      if (input.maxDays !== undefined) {
        extraConds.push(`days <= ?`);
        extraParams.push(input.maxDays);
      }
      const extraWhere = extraConds.length > 0 ? " AND " + extraConds.join(" AND ") : "";

      const getMonthsInRange = (start: string, end: string): string[] => {
        const months: string[] = [];
        let [y, m] = start.split("-").map(Number);
        const [ey, em] = end.split("-").map(Number);
        while (months.length <= 24 && (y < ey || (y === ey && m <= em))) {
          months.push(`${y}-${String(m).padStart(2, "0")}`);
          m++; if (m > 12) { m = 1; y++; }
        }
        return months;
      };

      const queryByMonth = (months: string[]) =>
        months.map(ym => {
          const row = sqlite.prepare(
            `SELECT COUNT(*) as n, COALESCE(SUM(days),0) as d FROM atestados WHERE strftime('%Y-%m', startDate)=?${extraWhere}`
          ).get(ym, ...extraParams) as { n: number; d: number };
          return { ym, label: ymToLabel(ym), n: row.n, days: row.d };
        });

      const queryBySector = (start: string, end: string) =>
        sqlite.prepare(
          `SELECT sector, COUNT(*) as n FROM atestados WHERE strftime('%Y-%m',startDate)>=? AND strftime('%Y-%m',startDate)<=?${extraWhere} GROUP BY sector ORDER BY n DESC LIMIT 10`
        ).all(start, end, ...extraParams) as Array<{ sector: string; n: number }>;

      const queryByCid = (start: string, end: string) =>
        sqlite.prepare(
          `SELECT cid, COUNT(*) as n FROM atestados WHERE strftime('%Y-%m',startDate)>=? AND strftime('%Y-%m',startDate)<=?${extraWhere} GROUP BY cid ORDER BY n DESC LIMIT 10`
        ).all(start, end, ...extraParams) as Array<{ cid: string; n: number }>;

      const dataA = queryByMonth(getMonthsInRange(startA, endA));
      const kpiA  = { total: dataA.reduce((s, r) => s + r.n, 0), days: dataA.reduce((s, r) => s + r.days, 0) };

      const hasB  = !!(input.startB && input.endB);
      const dataB = hasB ? queryByMonth(getMonthsInRange(input.startB!, input.endB!)) : [];
      const kpiB  = hasB ? { total: dataB.reduce((s, r) => s + r.n, 0), days: dataB.reduce((s, r) => s + r.days, 0) } : null;

      const maxLen   = Math.max(dataA.length, dataB.length);
      const chartData = Array.from({ length: maxLen }, (_, i) => {
        const row: Record<string, any> = { x: dataA[i]?.label ?? dataB[i]?.label ?? `M${i + 1}`, a: dataA[i]?.n ?? 0 };
        if (hasB) row.b = dataB[i]?.n ?? 0;
        return row;
      });

      const sectorA  = queryBySector(startA, endA);
      const sectorB  = hasB ? queryBySector(input.startB!, input.endB!) : [];
      const allSec   = [...new Set([...sectorA.map(r => r.sector), ...sectorB.map(r => r.sector)])];
      const bySector = allSec.slice(0, 10).map(sector => {
        const row: Record<string, any> = { sector, a: sectorA.find(r => r.sector === sector)?.n ?? 0 };
        if (hasB) row.b = sectorB.find(r => r.sector === sector)?.n ?? 0;
        return row;
      });

      const cidA  = queryByCid(startA, endA);
      const cidB  = hasB ? queryByCid(input.startB!, input.endB!) : [];
      const allC  = [...new Set([...cidA.map(r => r.cid), ...cidB.map(r => r.cid)])];
      const byCid = allC.slice(0, 10).map(cid => {
        const row: Record<string, any> = { cid, a: cidA.find(r => r.cid === cid)?.n ?? 0 };
        if (hasB) row.b = cidB.find(r => r.cid === cid)?.n ?? 0;
        return row;
      });

      return { chartData, kpiA, kpiB, bySector, byCid };
    }),

  options: protectedProcedure.query(() => {
    const sectors  = (sqlite.prepare(`SELECT DISTINCT sector FROM atestados WHERE sector IS NOT NULL ORDER BY sector`).all() as any[]).map(r => r.sector as string);
    const cids     = (sqlite.prepare(`SELECT DISTINCT cid FROM atestados WHERE cid IS NOT NULL ORDER BY cid`).all() as any[]).map(r => r.cid as string);
    const functions = (sqlite.prepare(`SELECT DISTINCT jobFunction FROM atestados WHERE jobFunction IS NOT NULL ORDER BY jobFunction`).all() as any[]).filter(r => r.jobFunction).map(r => r.jobFunction as string);
    return { sectors, cids, functions };
  }),

  stats: protectedProcedure
    .input(z.object({
      period:       z.enum(["mes","trimestre","semestre","ano","tudo"]).default("tudo"),
      sectors:      z.array(z.string()).default([]),
      cids:         z.array(z.string()).default([]),
      jobFunctions: z.array(z.string()).default([]),
    }).optional())
    .query(({ input }) => {
      const period       = input?.period       ?? "tudo";
      const fSectors     = input?.sectors      ?? [];
      const fCids        = input?.cids         ?? [];
      const fFunctions   = input?.jobFunctions ?? [];

      let startStr = "2000-01-01";
      if (period !== "tudo") {
        const monthsBack = { mes: 0, trimestre: 2, semestre: 5, ano: 11 }[period] ?? 0;
        const d = new Date(); d.setMonth(d.getMonth() - monthsBack); d.setDate(1);
        startStr = d.toISOString().slice(0, 10);
      }

      // Build shared extra WHERE for sector/cid/jobFunction filters
      const extraConds: string[] = [];
      const extraParams: any[] = [];
      if (fSectors.length > 0) {
        extraConds.push(`sector IN (${fSectors.map(() => "?").join(",")})`);
        extraParams.push(...fSectors);
      }
      if (fCids.length > 0) {
        extraConds.push(`(${fCids.map(() => "UPPER(cid) LIKE ?").join(" OR ")})`);
        extraParams.push(...fCids.map(c => `%${c.toUpperCase()}%`));
      }
      if (fFunctions.length > 0) {
        extraConds.push(`(${fFunctions.map(() => "jobFunction LIKE ?").join(" OR ")})`);
        extraParams.push(...fFunctions.map(f => `%${f}%`));
      }
      const extraWhere = extraConds.length > 0 ? " AND " + extraConds.join(" AND ") : "";

      const all = sqlite.prepare(`SELECT * FROM atestados WHERE startDate >= ?${extraWhere}`).all(startStr, ...extraParams) as any[];

      const total = all.length;
      const totalDays = all.reduce((s: number, r: any) => s + (r.days ?? 0), 0);
      const avgDays = total > 0 ? parseFloat((totalDays / total).toFixed(1)) : 0;
      const sectors = new Set(all.map((r: any) => r.sector)).size;
      const uniqueEmployees = new Set(all.map((r: any) => r.employeeName)).size;

      // Last 7 months trend
      const now = new Date();
      const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (6 - i), 1);
        return { ym: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`, label: d.toLocaleDateString("pt-BR",{month:"short"}).replace(".","") };
      });
      const monthlyEvolution = last7.map(m => {
        const rows = sqlite.prepare(`SELECT COUNT(*) as n, SUM(days) as d FROM atestados WHERE strftime('%Y-%m',startDate)=?${extraWhere}`).get(m.ym, ...extraParams) as any;
        return { mes: m.label, atestados: rows.n ?? 0, dias: rows.d ?? 0 };
      });

      // Top CIDs
      const topCids = sqlite.prepare(`SELECT cid, diagnosis, COUNT(*) as n, SUM(days) as totalDays FROM atestados WHERE startDate >= ?${extraWhere} GROUP BY cid ORDER BY n DESC LIMIT 10`).all(startStr, ...extraParams) as any[];

      // By sector
      const bySector = sqlite.prepare(`SELECT sector, COUNT(*) as n FROM atestados WHERE startDate >= ?${extraWhere} GROUP BY sector ORDER BY n DESC`).all(startStr, ...extraParams) as any[];

      // Duration distribution
      const durDist = [
        { label: "Curto (1-2d)",    min: 1,  max: 2  },
        { label: "Médio (3-5d)",    min: 3,  max: 5  },
        { label: "Longo (6-14d)",   min: 6,  max: 14 },
        { label: "Ext. (15d+)",     min: 15, max: 9999 },
      ].map(({ label, min, max }) => ({
        label, count: all.filter((r: any) => r.days >= min && r.days <= max).length,
      }));

      // Employee ranking
      const empMap: Record<string, { name: string; count: number; days: number }> = {};
      all.forEach((r: any) => {
        if (!empMap[r.employeeName]) empMap[r.employeeName] = { name: r.employeeName, count: 0, days: 0 };
        empMap[r.employeeName].count++;
        empMap[r.employeeName].days += r.days ?? 0;
      });
      const employeeRanking = Object.values(empMap).sort((a, b) => b.count - a.count).slice(0, 8);

      // Heatmap: sector × month (last 6 months)
      // For heatmap cells, sector is filtered exactly; apply only cid/jobFunction extras
      const cellConds: string[] = [];
      const cellParams: any[] = [];
      if (fCids.length > 0) {
        cellConds.push(`(${fCids.map(() => "UPPER(cid) LIKE ?").join(" OR ")})`);
        cellParams.push(...fCids.map(c => `%${c.toUpperCase()}%`));
      }
      if (fFunctions.length > 0) {
        cellConds.push(`(${fFunctions.map(() => "jobFunction LIKE ?").join(" OR ")})`);
        cellParams.push(...fFunctions.map(f => `%${f}%`));
      }
      const cellWhere = cellConds.length > 0 ? " AND " + cellConds.join(" AND ") : "";

      const heatSectors = bySector.slice(0, 6).map((s: any) => s.sector);
      const heatMonths = last7.slice(1); // last 6
      const heatmap = heatSectors.map((sector: string) => {
        const row: Record<string, any> = { sector };
        heatMonths.forEach(m => {
          const r = sqlite.prepare(`SELECT COUNT(*) as n FROM atestados WHERE sector=? AND strftime('%Y-%m',startDate)=?${cellWhere}`).get(sector, m.ym, ...cellParams) as any;
          row[m.label] = r?.n ?? 0;
        });
        return row;
      });
      const heatLabels = heatMonths.map(m => m.label);

      return { total, totalDays, avgDays, sectors, uniqueEmployees, monthlyEvolution, topCids, bySector, durDist, employeeRanking, heatmap, heatLabels };
    }),
});

// ─── ABSENTEÍSMO ─────────────────────────────────────────────────────────────
export const absenteismoRouter = router({
  stats: protectedProcedure
    .input(z.object({ period: z.enum(["mes","trimestre","semestre","ano","tudo"]).default("tudo") }).optional())
    .query(({ input }) => {
      const period = input?.period ?? "tudo";
      let startStr = "2000-01-01";
      let monthsInPeriod = 12;
      if (period !== "tudo") {
        const monthsBack = { mes: 0, trimestre: 2, semestre: 5, ano: 11 }[period] ?? 0;
        monthsInPeriod = monthsBack + 1;
        const d = new Date(); d.setMonth(d.getMonth() - monthsBack); d.setDate(1);
        startStr = d.toISOString().slice(0, 10);
      }

      // Atestados
      const atestados = sqlite.prepare(`SELECT * FROM atestados WHERE startDate >= ?`).all(startStr) as any[];
      const totalAtestados = atestados.length;
      const daysAtestados = atestados.reduce((s: number, r: any) => s + (r.days ?? 0), 0);

      // Afastamentos por doença ocupacional
      const diseases = sqlite.prepare(
        `SELECT * FROM diseases WHERE absenceStartDate IS NOT NULL AND absenceStartDate >= ?`
      ).all(startStr) as any[];
      const totalAfastamentos = diseases.length;
      const daysAfastamentos = diseases.reduce((s: number, r: any) => {
        if (!r.absenceStartDate) return s;
        const start = new Date(r.absenceStartDate);
        const end = r.absenceEndDate ? new Date(r.absenceEndDate) : new Date();
        const diff = Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
        return s + diff;
      }, 0);

      const totalOcorrencias = totalAtestados + totalAfastamentos;
      const totalDias = daysAtestados + daysAfastamentos;

      // Employee count for rate calculation
      const empCount = (sqlite.prepare(`SELECT COUNT(*) as c FROM employees WHERE status='ativo'`).get() as any)?.c ?? 0;
      const workdaysInPeriod = monthsInPeriod * 22;
      const taxa = empCount > 0 && workdaysInPeriod > 0
        ? parseFloat(((totalDias / (empCount * workdaysInPeriod)) * 100).toFixed(2))
        : 0;

      // Affected employees
      const empSetAtestados = new Set(atestados.map((r: any) => r.employeeName));
      const empSetDiseases = new Set(diseases.map((r: any) => r.employeeName ?? "").filter(Boolean));
      const allEmpNames = new Set([...Array.from(empSetAtestados), ...Array.from(empSetDiseases)]);
      const uniqueEmployees = allEmpNames.size;

      // Monthly evolution (last 7 months)
      const now = new Date();
      const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (6 - i), 1);
        return { ym: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`, label: d.toLocaleDateString("pt-BR",{month:"short"}).replace(".","") };
      });
      const monthly = last7.map(m => {
        const a = sqlite.prepare(`SELECT COUNT(*) as n, COALESCE(SUM(days),0) as d FROM atestados WHERE strftime('%Y-%m',startDate)=?`).get(m.ym) as any;
        const ds = (sqlite.prepare(`SELECT * FROM diseases WHERE absenceStartDate IS NOT NULL AND strftime('%Y-%m',absenceStartDate)=?`).all(m.ym) as any[]);
        const dsDays = ds.reduce((s: number, r: any) => {
          const start = new Date(r.absenceStartDate);
          const end = r.absenceEndDate ? new Date(r.absenceEndDate) : new Date();
          return s + Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
        }, 0);
        return { mes: m.label, atestados: a.n ?? 0, afastamentos: ds.length, diasAtestados: a.d ?? 0, diasAfastamentos: dsDays };
      });

      // By sector
      const sectorMap: Record<string, { n: number; dias: number }> = {};
      atestados.forEach((r: any) => {
        if (!r.sector) return;
        if (!sectorMap[r.sector]) sectorMap[r.sector] = { n: 0, dias: 0 };
        sectorMap[r.sector].n++; sectorMap[r.sector].dias += r.days ?? 0;
      });
      const bySector = Object.entries(sectorMap).map(([sector, v]) => ({ sector, ...v })).sort((a, b) => b.dias - a.dias).slice(0, 8);

      // Employee ranking (combined)
      const empMap: Record<string, { name: string; atestados: number; afastamentos: number; dias: number }> = {};
      atestados.forEach((r: any) => {
        const k = r.employeeName;
        if (!empMap[k]) empMap[k] = { name: k, atestados: 0, afastamentos: 0, dias: 0 };
        empMap[k].atestados++; empMap[k].dias += r.days ?? 0;
      });
      diseases.forEach((r: any) => {
        const k = r.employeeName ?? "Desconhecido";
        if (!empMap[k]) empMap[k] = { name: k, atestados: 0, afastamentos: 0, dias: 0 };
        empMap[k].afastamentos++;
        const start = new Date(r.absenceStartDate);
        const end = r.absenceEndDate ? new Date(r.absenceEndDate) : new Date();
        empMap[k].dias += Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
      });
      const ranking = Object.values(empMap).sort((a, b) => b.dias - a.dias).slice(0, 10);

      return {
        totalOcorrencias, totalAtestados, totalAfastamentos,
        totalDias, daysAtestados, daysAfastamentos,
        taxa, empCount, uniqueEmployees,
        avgDias: totalOcorrencias > 0 ? parseFloat((totalDias / totalOcorrencias).toFixed(1)) : 0,
        monthly, bySector, ranking,
      };
    }),
});

// ─── AGENDA / EVENTS ─────────────────────────────────────────────────────────
export const eventsRouter = router({
  list: protectedProcedure
    .input(z.object({
      month: z.number().optional(),
      year:  z.number().optional(),
    }).optional())
    .query(({ input }) => {
      if (input?.month !== undefined && input?.year !== undefined) {
        const ym = `${input.year}-${String(input.month + 1).padStart(2, "0")}`;
        return sqlite.prepare(`SELECT * FROM events WHERE strftime('%Y-%m', date) = ? ORDER BY date, time`).all(ym) as any[];
      }
      return sqlite.prepare(`SELECT * FROM events ORDER BY date, time`).all() as any[];
    }),

  upcoming: protectedProcedure.query(() => {
    const today = new Date().toISOString().slice(0, 10);
    return sqlite.prepare(`SELECT * FROM events WHERE date >= ? AND status != 'cancelado' ORDER BY date, time LIMIT 10`).all(today) as any[];
  }),

  create: protectedProcedure
    .input(z.object({
      title:       z.string().min(1),
      type:        z.string().default("outro"),
      date:        z.string(),
      time:        z.string().optional(),
      endDate:     z.string().optional(),
      endTime:     z.string().optional(),
      location:    z.string().optional(),
      description: z.string().optional(),
      responsible: z.string().optional(),
      status:      z.string().default("agendado"),
      recurrence:  z.string().default("nenhuma"),
    }))
    .mutation(({ input, ctx }) => {
      const r = sqlite.prepare(`
        INSERT INTO events (title, type, date, time, endDate, endTime, location, description, responsible, status, recurrence, userId, createdAt, updatedAt)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))
      `).run(
        input.title, input.type, input.date, input.time ?? null, input.endDate ?? null, input.endTime ?? null,
        input.location ?? null, input.description ?? null, input.responsible ?? null,
        input.status, input.recurrence, ctx.user.id
      );
      return sqlite.prepare(`SELECT * FROM events WHERE id = ?`).get(r.lastInsertRowid);
    }),

  createBatch: protectedProcedure
    .input(z.object({
      dates: z.array(z.string()),
      title:       z.string().min(1),
      type:        z.string().default("integracao"),
      time:        z.string().optional(),
      endTime:     z.string().optional(),
      location:    z.string().optional(),
      description: z.string().optional(),
      responsible: z.string().optional(),
    }))
    .mutation(({ input, ctx }) => {
      const insert = sqlite.prepare(`
        INSERT INTO events (title, type, date, time, endTime, location, description, responsible, status, recurrence, userId, createdAt, updatedAt)
        VALUES (?,?,?,?,?,?,?,?,'agendado','nenhuma',?,datetime('now'),datetime('now'))
      `);
      const insertMany = sqlite.transaction((dates: string[]) => {
        for (const date of dates) {
          insert.run(input.title, input.type, date, input.time ?? null, input.endTime ?? null,
            input.location ?? null, input.description ?? null, input.responsible ?? null, ctx.user.id);
        }
      });
      insertMany(input.dates);
      return { created: input.dates.length };
    }),

  update: protectedProcedure
    .input(z.object({
      id:          z.number(),
      title:       z.string().optional(),
      type:        z.string().optional(),
      date:        z.string().optional(),
      time:        z.string().optional(),
      endDate:     z.string().optional(),
      endTime:     z.string().optional(),
      location:    z.string().optional(),
      description: z.string().optional(),
      responsible: z.string().optional(),
      status:      z.string().optional(),
      recurrence:  z.string().optional(),
    }))
    .mutation(({ input }) => {
      const { id, ...data } = input;
      const fields = Object.entries(data).filter(([, v]) => v !== undefined);
      if (!fields.length) return sqlite.prepare(`SELECT * FROM events WHERE id = ?`).get(id);
      const set = fields.map(([k]) => `${k} = ?`).join(", ");
      const vals = fields.map(([, v]) => v);
      sqlite.prepare(`UPDATE events SET ${set}, updatedAt = datetime('now') WHERE id = ?`).run(...vals, id);
      return sqlite.prepare(`SELECT * FROM events WHERE id = ?`).get(id);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => {
      sqlite.prepare(`DELETE FROM events WHERE id = ?`).run(input.id);
      return { success: true };
    }),
});

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  return `${d}d atrás`;
}

export const dashboardRouter = router({
  stats: protectedProcedure
    .input(z.object({ period: z.enum(["mes", "trimestre", "semestre", "ano"]).default("mes") }).optional())
    .query(({ input }) => {
      const period = input?.period ?? "mes";

      // Date range
      const now = new Date();
      let monthsBack = 0;
      if (period === "trimestre") monthsBack = 2;
      else if (period === "semestre") monthsBack = 5;
      else if (period === "ano") monthsBack = 11;
      const periodStart = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
      const startStr = periodStart.toISOString().slice(0, 10);
      const monthsInPeriod = monthsBack + 1;

      // Last 7 months labels
      const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (6 - i), 1);
        return {
          ym: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
          label: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        };
      });

      // Period-filtered counts
      const pAcc  = (sqlite.prepare(`SELECT COUNT(*) as c FROM accidents WHERE date >= ?`).get(startStr) as any).c as number;
      const pDis  = (sqlite.prepare(`SELECT COUNT(*) as c FROM diseases WHERE COALESCE(diagnosisDate, createdAt) >= ?`).get(startStr) as any).c as number;
      const pTrn  = (sqlite.prepare(`SELECT COUNT(*) as c FROM trainings WHERE startDate >= ?`).get(startStr) as any).c as number;
      const pInsp = (sqlite.prepare(`SELECT COUNT(*) as c FROM inspections WHERE date >= ?`).get(startStr) as any).c as number;
      const tPpps = (sqlite.prepare(`SELECT COUNT(*) as c FROM ppps`).get() as any).c as number;
      const tInv  = (sqlite.prepare(`SELECT COUNT(*) as c FROM investigations`).get() as any).c as number;
      const tCamp = (sqlite.prepare(`SELECT COUNT(*) as c FROM campaigns`).get() as any).c as number;

      // Employee count
      let employees = 0;
      try { employees = (sqlite.prepare(`SELECT COUNT(*) as c FROM employees WHERE status = 'ativo'`).get() as any).c as number; } catch {}

      // Monthly trend (last 7 months)
      const accByM = sqlite.prepare(`SELECT strftime('%Y-%m', date) as ym, COUNT(*) as n FROM accidents WHERE date >= date('now','-6 months') GROUP BY ym`).all() as Array<{ym:string,n:number}>;
      const disByM = sqlite.prepare(`SELECT strftime('%Y-%m', COALESCE(diagnosisDate,createdAt)) as ym, COUNT(*) as n FROM diseases WHERE COALESCE(diagnosisDate,createdAt) >= date('now','-6 months') GROUP BY ym`).all() as Array<{ym:string,n:number}>;
      const monthlyTrend = last7.map(m => ({
        mes: m.label,
        acidentes: accByM.find(r => r.ym === m.ym)?.n ?? 0,
        doencas: disByM.find(r => r.ym === m.ym)?.n ?? 0,
      }));

      // Training hours by month
      const trnByM = sqlite.prepare(`SELECT strftime('%Y-%m', startDate) as ym, SUM(COALESCE(duration,0)) as h FROM trainings WHERE startDate >= date('now','-6 months') GROUP BY ym`).all() as Array<{ym:string,h:number}>;
      const trainingHours = last7.map(m => ({ mes: m.label, horas: trnByM.find(r => r.ym === m.ym)?.h ?? 0 }));

      // Severity breakdown
      const sevRaw = sqlite.prepare(`SELECT LOWER(COALESCE(severity,'leve')) as s, COUNT(*) as n FROM accidents GROUP BY s`).all() as Array<{s:string,n:number}>;
      const sevMap: Record<string, {color:string,label:string}> = {
        leve:     { color: "#22C55E", label: "Leve" },
        moderado: { color: "#F59E0B", label: "Moderado" },
        grave:    { color: "#EF4444", label: "Grave" },
        fatal:    { color: "#7F1D1D", label: "Fatal" },
      };
      const severityBreakdown = Object.entries(sevMap).map(([k, { color, label }]) => ({
        name: label, value: sevRaw.find(r => r.s === k)?.n ?? 0, color,
      }));

      // Sector ranking
      const sectorRanking = sqlite.prepare(`SELECT COALESCE(location,'Não informado') as sector, COUNT(*) as n FROM accidents WHERE location IS NOT NULL AND location != '' GROUP BY location ORDER BY n DESC LIMIT 5`).all() as Array<{sector:string,n:number}>;

      // Sparklines (last 6 months accident count)
      const accidentSparkline = last7.map(m => accByM.find(r => r.ym === m.ym)?.n ?? 0);

      // TF/TG
      const lostDaysRow = sqlite.prepare(`SELECT SUM(CASE WHEN absenceStartDate IS NOT NULL AND absenceEndDate IS NOT NULL THEN CAST((julianday(absenceEndDate)-julianday(absenceStartDate)) AS INTEGER) ELSE 0 END) as d FROM diseases WHERE COALESCE(diagnosisDate,createdAt) >= ?`).get(startStr) as any;
      // NR-4: 22 workdays × 8h/day = 176 h/month
      const horasTrabalhadas = employees > 0 ? employees * 176 * monthsInPeriod : 0;
      const taxaFrequencia = horasTrabalhadas > 0 ? parseFloat(((pAcc * 1_000_000) / horasTrabalhadas).toFixed(2)) : 0;
      const taxaGravidade  = horasTrabalhadas > 0 ? parseFloat((((lostDaysRow?.d ?? 0) * 1_000_000) / horasTrabalhadas).toFixed(2)) : 0;

      // Alerts
      const catPendente       = sqlite.prepare(`SELECT id, title, date FROM accidents WHERE catFiled = 0 ORDER BY date DESC LIMIT 5`).all() as Array<{id:number,title:string,date:string}>;
      const invAbertas        = sqlite.prepare(`SELECT id, title FROM investigations WHERE status = 'aberta' ORDER BY createdAt DESC LIMIT 3`).all() as Array<{id:number,title:string}>;
      let planosAtrasados: Array<{id:number,title:string,deadline:string}> = [];
      try { planosAtrasados = sqlite.prepare(`SELECT id, what as title, deadline FROM actionPlans WHERE status != 'concluida' AND deadline IS NOT NULL AND deadline < date('now') ORDER BY deadline ASC LIMIT 3`).all() as any; } catch {}

      // Recent activities
      const actRaw = sqlite.prepare(`SELECT action, entityType, description, createdAt, userName FROM auditLogs ORDER BY createdAt DESC LIMIT 6`).all() as Array<{action:string,entityType:string,description:string,createdAt:string,userName:string}>;
      const dotMap: Record<string,string> = { accidents:"bg-red-500", diseases:"bg-orange-500", trainings:"bg-emerald-500", inspections:"bg-amber-500", investigations:"bg-cyan-500", campaigns:"bg-pink-500" };
      const recentActivities = actRaw.map(r => ({
        text: r.description || `${r.action} em ${r.entityType}`,
        time: timeAgo(r.createdAt),
        dot: dotMap[r.entityType] ?? "bg-slate-500",
        userName: r.userName,
      }));

      return {
        accidents: pAcc, diseases: pDis, trainings: pTrn, inspections: pInsp,
        ppps: tPpps, investigations: tInv, campaigns: tCamp, employees,
        monthlyTrend, trainingHours, severityBreakdown,
        sectorRanking: sectorRanking.map(r => ({ sector: r.sector, count: r.n })),
        accidentSparkline,
        taxaFrequencia, taxaGravidade,
        lostDays: lostDaysRow?.d ?? 0,
        alerts: { catPendente, invAbertas, planosAtrasados },
        recentActivities,
      };
    }),
});

// ─── AI CHAT ─────────────────────────────────────────────────────────────────
export const aiRouter = router({
  chat: protectedProcedure
    .input(z.object({
      messages: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })),
    }))
    .mutation(async ({ input }) => {
      const Anthropic = await import("@anthropic-ai/sdk");
      const client = new Anthropic.default();
      
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: `Você é o Assistente IA do SID, especialista em Saúde e Segurança do Trabalho (SST) da plataforma SID — Sistema de Inteligência de Dados.
        
Seu papel é ajudar profissionais de SST com:
- Legislação trabalhista e Normas Regulamentadoras (NR-01 a NR-37)
- Investigação e análise de acidentes de trabalho
- Elaboração e gestão de CAT (Comunicação de Acidente de Trabalho)
- EPIs e EPCs adequados para cada atividade
- PCMSO, PGR, LTCAT e outros programas de SST
- Cálculo de taxas de frequência e gravidade de acidentes
- CIPA e SIPAT
- Doenças ocupacionais e afastamentos
- PPP (Perfil Profissiográfico Previdenciário)
- Inspeções de segurança e não conformidades

Responda sempre em português, de forma clara, objetiva e técnica. Cite as NRs relevantes quando aplicável.`,
        messages: input.messages,
      });
      
      const textBlock = response.content.find((b: any) => b.type === "text");
      return { content: textBlock ? (textBlock as any).text : "Sem resposta." };
    }),
});

// ─── EMPLOYEES ────────────────────────────────────────────────────────────────
export const employeesRouter = router({
  list: protectedProcedure.query(async () =>
    db.select().from(schema.employees).orderBy(desc(schema.employees.createdAt))),
  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const r = await db.select().from(schema.employees).where(eq(schema.employees.id, input.id)).limit(1);
    return r[0] ?? null;
  }),
  create: protectedProcedure.input(z.object({
    name: z.string(), cpf: z.string(), rg: z.string().optional(),
    birthDate: z.string().optional(), gender: z.string().optional(),
    phone: z.string().optional(), email: z.string().optional(),
    address: z.string().optional(), city: z.string().optional(), state: z.string().optional(),
    matricula: z.string().optional(), position: z.string().optional(),
    department: z.string().optional(), sector: z.string().optional(),
    workRegime: z.string().optional(), admissionDate: z.string().optional(),
    gheId: z.number().optional(), status: z.string().optional(),
    emergencyContact: z.string().optional(), emergencyPhone: z.string().optional(),
    bloodType: z.string().optional(), allergies: z.string().optional(),
    observations: z.string().optional(),
  })).mutation(async ({ input, ctx }) =>
    (await db.insert(schema.employees).values({ ...input, userId: ctx.user.id } as any).returning())[0]),
  update: protectedProcedure.input(z.object({ id: z.number() }).passthrough()).mutation(async ({ input }) => {
    const { id, ...data } = input;
    return (await db.update(schema.employees).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(schema.employees.id, id)).returning())[0];
  }),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) =>
    db.delete(schema.employees).where(eq(schema.employees.id, input.id))),
});

// ─── GHE + RISKS ─────────────────────────────────────────────────────────────
export const ghesRouter = router({
  list: protectedProcedure.query(async () =>
    db.select().from(schema.ghes).orderBy(desc(schema.ghes.createdAt))),
  create: protectedProcedure.input(z.object({
    name: z.string(), description: z.string().optional(),
    sector: z.string().optional(), department: z.string().optional(),
    activities: z.string().optional(),
  })).mutation(async ({ input, ctx }) =>
    (await db.insert(schema.ghes).values({ ...input, userId: ctx.user.id }).returning())[0]),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) =>
    db.delete(schema.ghes).where(eq(schema.ghes.id, input.id))),
});

export const risksRouter = router({
  list: protectedProcedure.query(async () =>
    db.select().from(schema.risks).orderBy(desc(schema.risks.createdAt))),
  byGhe: protectedProcedure.input(z.object({ gheId: z.number() })).query(async ({ input }) =>
    db.select().from(schema.risks).where(eq(schema.risks.gheId, input.gheId))),
  create: protectedProcedure.input(z.object({
    gheId: z.number(), agentType: z.string(), agent: z.string(),
    source: z.string().optional(), exposure: z.string().optional(),
    probability: z.number().min(1).max(5), severity: z.number().min(1).max(5),
    controlMeasures: z.string().optional(),
    epcRequired: z.string().optional(), epiRequired: z.string().optional(),
    limitValue: z.string().optional(),
    aposentadoriaEspecial: z.boolean().optional(),
  })).mutation(async ({ input, ctx }) => {
    const level = input.probability * input.severity;
    const riskLevel = level <= 4 ? "toleravel" : level <= 9 ? "moderado" : level <= 16 ? "alto" : "critico";
    return (await db.insert(schema.risks).values({ ...input, riskLevel, userId: ctx.user.id } as any).returning())[0];
  }),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) =>
    db.delete(schema.risks).where(eq(schema.risks.id, input.id))),
});

// ─── ACTION PLANS ─────────────────────────────────────────────────────────────
export const actionPlansRouter = router({
  list: protectedProcedure.query(async () =>
    db.select().from(schema.actionPlans).orderBy(desc(schema.actionPlans.createdAt))),
  create: protectedProcedure.input(z.object({
    what: z.string(), why: z.string().optional(), who: z.string().optional(),
    when: z.string().optional(), where: z.string().optional(),
    how: z.string().optional(), howMuch: z.string().optional(),
    originType: z.string().optional(), originId: z.number().optional(),
    deadline: z.string().optional(), responsible: z.string().optional(),
    priority: z.string().optional(), status: z.string().optional(),
  })).mutation(async ({ input, ctx }) =>
    (await db.insert(schema.actionPlans).values({ ...input, userId: ctx.user.id } as any).returning())[0]),
  update: protectedProcedure.input(z.object({ id: z.number() }).passthrough()).mutation(async ({ input }) => {
    const { id, ...data } = input;
    return (await db.update(schema.actionPlans).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(schema.actionPlans.id, id)).returning())[0];
  }),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) =>
    db.delete(schema.actionPlans).where(eq(schema.actionPlans.id, input.id))),
});

// ─── EXAMS / ASO ─────────────────────────────────────────────────────────────
export const examsRouter = router({
  list: protectedProcedure.query(async () =>
    db.select().from(schema.exams).orderBy(desc(schema.exams.examDate))),
  create: protectedProcedure.input(z.object({
    employeeId: z.number(), employeeName: z.string().optional(),
    examType: z.string(), examDate: z.string(),
    nextExamDate: z.string().optional(), doctor: z.string().optional(),
    crm: z.string().optional(), clinic: z.string().optional(),
    result: z.string().optional(), restrictions: z.string().optional(),
    observations: z.string().optional(), asoNumber: z.string().optional(),
  })).mutation(async ({ input, ctx }) =>
    (await db.insert(schema.exams).values({ ...input, userId: ctx.user.id } as any).returning())[0]),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) =>
    db.delete(schema.exams).where(eq(schema.exams.id, input.id))),
  expiring: protectedProcedure.query(async () => {
    const thirtyDays = new Date(); thirtyDays.setDate(thirtyDays.getDate() + 30);
    return db.select().from(schema.exams)
      .where(sql`nextExamDate IS NOT NULL AND nextExamDate <= ${thirtyDays.toISOString().split('T')[0]} AND nextExamDate >= ${new Date().toISOString().split('T')[0]}`)
      .orderBy(schema.exams.nextExamDate);
  }),
});

// ─── EPIs ─────────────────────────────────────────────────────────────────────
export const episRouter = router({
  list: protectedProcedure.query(async () =>
    db.select().from(schema.epis).orderBy(desc(schema.epis.createdAt))),
  create: protectedProcedure.input(z.object({
    name: z.string(), description: z.string().optional(),
    ca: z.string().optional(), manufacturer: z.string().optional(),
    category: z.string().optional(), validityMonths: z.number().optional(),
    stockQuantity: z.number().optional(), minStock: z.number().optional(),
    unitCost: z.number().optional(),
  })).mutation(async ({ input, ctx }) =>
    (await db.insert(schema.epis).values({ ...input, userId: ctx.user.id }).returning())[0]),
  update: protectedProcedure.input(z.object({ id: z.number() }).passthrough()).mutation(async ({ input }) => {
    const { id, ...data } = input;
    return (await db.update(schema.epis).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(schema.epis.id, id)).returning())[0];
  }),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) =>
    db.delete(schema.epis).where(eq(schema.epis.id, input.id))),
});

export const epiDeliveriesRouter = router({
  list: protectedProcedure.query(async () =>
    db.select().from(schema.epiDeliveries).orderBy(desc(schema.epiDeliveries.deliveryDate))),
  byEmployee: protectedProcedure.input(z.object({ employeeId: z.number() })).query(async ({ input }) =>
    db.select().from(schema.epiDeliveries).where(eq(schema.epiDeliveries.employeeId, input.employeeId))),
  create: protectedProcedure.input(z.object({
    epiId: z.number(), epiName: z.string().optional(),
    employeeId: z.number(), employeeName: z.string().optional(),
    quantity: z.number().optional(), deliveryDate: z.string(),
    returnDate: z.string().optional(), expiryDate: z.string().optional(),
    reason: z.string().optional(), condition: z.string().optional(),
  })).mutation(async ({ input, ctx }) =>
    (await db.insert(schema.epiDeliveries).values({ ...input, userId: ctx.user.id } as any).returning())[0]),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) =>
    db.delete(schema.epiDeliveries).where(eq(schema.epiDeliveries.id, input.id))),
});

// ─── PGR + LTCAT ─────────────────────────────────────────────────────────────
export const pgrRouter = router({
  list: protectedProcedure.query(async () =>
    db.select().from(schema.pgr).orderBy(desc(schema.pgr.createdAt))),
  create: protectedProcedure.input(z.object({
    company: z.string(), cnpj: z.string().optional(),
    version: z.string().optional(), elaborationDate: z.string().optional(),
    nextRevisionDate: z.string().optional(),
    responsibleTechnician: z.string().optional(), crea: z.string().optional(),
    scope: z.string().optional(), methodology: z.string().optional(),
  })).mutation(async ({ input, ctx }) =>
    (await db.insert(schema.pgr).values({ ...input, userId: ctx.user.id }).returning())[0]),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) =>
    db.delete(schema.pgr).where(eq(schema.pgr.id, input.id))),
});

export const ltcatRouter = router({
  list: protectedProcedure.query(async () =>
    db.select().from(schema.ltcat).orderBy(desc(schema.ltcat.createdAt))),
  create: protectedProcedure.input(z.object({
    gheId: z.number(), gheName: z.string().optional(),
    agent: z.string(), agentType: z.string().optional(),
    exposureLevel: z.string().optional(), limitValue: z.string().optional(),
    techMethod: z.string().optional(),
    aposentadoriaEspecial: z.boolean().optional(),
    epcEffective: z.boolean().optional(), observations: z.string().optional(),
  })).mutation(async ({ input, ctx }) =>
    (await db.insert(schema.ltcat).values({ ...input, userId: ctx.user.id }).returning())[0]),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) =>
    db.delete(schema.ltcat).where(eq(schema.ltcat.id, input.id))),
});

// ─── CIPA ─────────────────────────────────────────────────────────────────────
export const cipaRouter = router({
  listMandates: protectedProcedure.query(async () =>
    db.select().from(schema.cipaMandate).orderBy(desc(schema.cipaMandate.startDate))),
  createMandate: protectedProcedure.input(z.object({
    startDate: z.string(), endDate: z.string(),
    cnae: z.string().optional(), employeeCount: z.number().optional(),
    grau: z.string().optional(),
    electedEffective: z.number().optional(), electedAlternate: z.number().optional(),
    designatedEffective: z.number().optional(), designatedAlternate: z.number().optional(),
    president: z.string().optional(), secretary: z.string().optional(),
  })).mutation(async ({ input, ctx }) =>
    (await db.insert(schema.cipaMandate).values({ ...input, userId: ctx.user.id }).returning())[0]),
  listMeetings: protectedProcedure.input(z.object({ mandateId: z.number() })).query(async ({ input }) =>
    db.select().from(schema.cipaMeetings).where(eq(schema.cipaMeetings.mandateId, input.mandateId)).orderBy(desc(schema.cipaMeetings.date))),
  allMeetings: protectedProcedure.query(async () =>
    db.select().from(schema.cipaMeetings).orderBy(desc(schema.cipaMeetings.date))),
  createMeeting: protectedProcedure.input(z.object({
    mandateId: z.number(), date: z.string(),
    type: z.string().optional(), pauta: z.string().optional(),
    ata: z.string().optional(), attendees: z.string().optional(),
    status: z.string().optional(),
  })).mutation(async ({ input, ctx }) =>
    (await db.insert(schema.cipaMeetings).values({ ...input, userId: ctx.user.id } as any).returning())[0]),
  deleteMeeting: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) =>
    db.delete(schema.cipaMeetings).where(eq(schema.cipaMeetings.id, input.id))),
});

// ─── ESOCIAL ─────────────────────────────────────────────────────────────────
export const esocialRouter = router({
  list: protectedProcedure.query(async () =>
    db.select().from(schema.esocial).orderBy(desc(schema.esocial.createdAt))),
  create: protectedProcedure.input(z.object({
    eventType: z.enum(["S-2210", "S-2220", "S-2240"]),
    referenceId: z.number().optional(), referenceType: z.string().optional(),
    employeeId: z.number().optional(), employeeName: z.string().optional(),
    period: z.string().optional(),
  })).mutation(async ({ input, ctx }) =>
    (await db.insert(schema.esocial).values({ ...input, status: "pendente", userId: ctx.user.id }).returning())[0]),
  updateStatus: protectedProcedure.input(z.object({
    id: z.number(), status: z.string(),
    receiptNumber: z.string().optional(), errorMessage: z.string().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    return (await db.update(schema.esocial).set({ ...data as any, updatedAt: new Date().toISOString() }).where(eq(schema.esocial.id, id)).returning())[0];
  }),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) =>
    db.delete(schema.esocial).where(eq(schema.esocial.id, input.id))),
  // Stats for dashboard
  stats: protectedProcedure.query(async () => {
    const all = await db.select().from(schema.esocial);
    return {
      total: all.length,
      pendente: all.filter(e => e.status === "pendente").length,
      enviado: all.filter(e => e.status === "enviado").length,
      erro: all.filter(e => e.status === "erro").length,
    };
  }),
});

// ─── REPORTS ─────────────────────────────────────────────────────────────────
export const reportsRouter = router({
  indicators: protectedProcedure.query(async () => {
    const [accidents, diseases, trainings, employees, exams, actions] = await Promise.all([
      db.select().from(schema.accidents),
      db.select().from(schema.diseases),
      db.select().from(schema.trainings),
      db.select().from(schema.employees),
      db.select().from(schema.exams),
      db.select().from(schema.actionPlans),
    ]);
    const activeEmployees = employees.filter(e => e.status === "ativo").length || 1;
    const hoursWorked = activeEmployees * 220; // ~220h/month
    const lostDays = diseases.filter(d => d.status === "afastada").length * 15;
    const tafac = ((accidents.length / hoursWorked) * 1000000).toFixed(2);
    const tgfac = ((lostDays / hoursWorked) * 1000000).toFixed(2);
    return {
      totalEmployees: employees.length, activeEmployees,
      totalAccidents: accidents.length,
      graveAccidents: accidents.filter(a => ["grave","fatal"].includes(a.severity ?? "")).length,
      totalDiseases: diseases.length, afastamentos: diseases.filter(d => d.status === "afastada").length,
      totalTrainings: trainings.length, completedTrainings: trainings.filter(t => t.status === "concluido").length,
      trainingHours: trainings.reduce((s, t) => s + (t.duration ?? 0), 0),
      openActions: actions.filter(a => ["aberta","em_andamento"].includes(a.status ?? "")).length,
      overdueActions: actions.filter(a => a.status === "aberta" && a.deadline && a.deadline < new Date().toISOString().split('T')[0]).length,
      expiringExams: exams.filter(e => {
        if (!e.nextExamDate) return false;
        const d = new Date(e.nextExamDate); const now = new Date();
        const diff = (d.getTime() - now.getTime()) / 86400000;
        return diff >= 0 && diff <= 30;
      }).length,
      tafac: parseFloat(tafac), tgfac: parseFloat(tgfac), lostDays,
      accidentsByMonth: Array.from({ length: 6 }, (_, i) => {
        const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
        const m = d.toISOString().slice(0, 7);
        return { month: d.toLocaleString("pt-BR", { month: "short" }), count: accidents.filter(a => a.date?.startsWith(m)).length };
      }),
    };
  }),
});
