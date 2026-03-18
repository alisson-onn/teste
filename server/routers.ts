import { router } from "./_core/trpc";
import { authRouter } from "./auth.router";
import {
  accidentsRouter, accidentAnalysisRouter, diseasesRouter, trainingsRouter, inspectionsRouter,
  pppsRouter, investigationsRouter, campaignsRouter, auditRouter,
  usersRouter, dashboardRouter, aiRouter,
  employeesRouter, ghesRouter, risksRouter, actionPlansRouter,
  examsRouter, episRouter, epiDeliveriesRouter,
  pgrRouter, ltcatRouter, cipaRouter, esocialRouter, reportsRouter,
  atestadosRouter, absenteismoRouter, eventsRouter,
} from "./modules.router";

export const appRouter = router({
  auth: authRouter,
  dashboard: dashboardRouter,
  ai: aiRouter,
  accidents: accidentsRouter,
  accidentAnalysis: accidentAnalysisRouter,
  diseases: diseasesRouter,
  trainings: trainingsRouter,
  inspections: inspectionsRouter,
  ppps: pppsRouter,
  investigations: investigationsRouter,
  campaigns: campaignsRouter,
  audit: auditRouter,
  users: usersRouter,
  // Sprint modules
  employees: employeesRouter,
  ghes: ghesRouter,
  risks: risksRouter,
  actionPlans: actionPlansRouter,
  exams: examsRouter,
  epis: episRouter,
  epiDeliveries: epiDeliveriesRouter,
  pgr: pgrRouter,
  ltcat: ltcatRouter,
  cipa: cipaRouter,
  esocial: esocialRouter,
  reports: reportsRouter,
  atestados: atestadosRouter,
  absenteismo: absenteismoRouter,
  events: eventsRouter,
});

export type AppRouter = typeof appRouter;
