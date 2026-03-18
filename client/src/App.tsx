import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Existing pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { AccidentsList, AccidentForm } from "./pages/accidents/AccidentsPage";
import AcidentesTrabalhoPage from "./pages/accidents/AcidentesTrabalhoPage";
import AccidentAnalysisPage from "./pages/accidents/AccidentAnalysisPage";
import { DiseasesList, DiseaseForm } from "./pages/diseases/DiseasesPage";
import { TrainingsList, TrainingForm } from "./pages/trainings/TrainingsPage";
import { InspectionsList, InspectionForm } from "./pages/inspections/InspectionsPage";
import { PPPsList } from "./pages/ppps/PPPsPage";
import { InvestigationsList, InvestigationForm } from "./pages/investigations/InvestigationsPage";
import { CampaignsList, AuditList, UsersList } from "./pages/others/OtherPages";
import AIChat from "./pages/ai/AIChat";

// Sprint modules
import EmployeesPage from "./pages/employees/EmployeesPage";
import GhePage from "./pages/ghe/GhePage";
import ActionPlansPage from "./pages/actions/ActionPlansPage";
import ExamsPage from "./pages/exams/ExamsPage";
import EpisPage from "./pages/epis/EpisPage";
import PgrPage from "./pages/pgr/PgrPage";
import CipaPage from "./pages/cipa/CipaPage";
import EsocialPage from "./pages/esocial/EsocialPage";
import AtestadosPage from "./pages/atestados/AtestadosPage";
import AbsenteismoPage from "./pages/absenteismo/AbsenteismoPage";
import AgendaPage from "./pages/agenda/AgendaPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      {/* Core modules */}
      <Route path="/acidentes" component={AcidentesTrabalhoPage} />
      <Route path="/acidentes/analise" component={AccidentAnalysisPage} />
      <Route path="/doencas" component={DiseasesList} />
      <Route path="/doencas/novo" component={DiseaseForm} />
      <Route path="/treinamentos" component={TrainingsList} />
      <Route path="/treinamentos/novo" component={TrainingForm} />
      <Route path="/inspecoes" component={InspectionsList} />
      <Route path="/inspecoes/novo" component={InspectionForm} />
      <Route path="/ppps" component={PPPsList} />
      <Route path="/investigacoes" component={InvestigationsList} />
      <Route path="/investigacoes/novo" component={InvestigationForm} />
      <Route path="/campanhas" component={CampaignsList} />
      <Route path="/auditoria" component={AuditList} />
      <Route path="/usuarios" component={UsersList} />
      <Route path="/ia-chat" component={AIChat} />
      {/* Sprint modules */}
      <Route path="/funcionarios" component={EmployeesPage} />
      <Route path="/ghe" component={GhePage} />
      <Route path="/plano-acao" component={ActionPlansPage} />
      <Route path="/exames" component={ExamsPage} />
      <Route path="/epis" component={EpisPage} />
      <Route path="/pgr" component={PgrPage} />
      <Route path="/cipa" component={CipaPage} />
      <Route path="/esocial" component={EsocialPage} />
      <Route path="/atestados" component={AtestadosPage} />
      <Route path="/absenteismo" component={AbsenteismoPage} />
      <Route path="/agenda" component={AgendaPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
