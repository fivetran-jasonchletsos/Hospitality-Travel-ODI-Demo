import { HashRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ArchitecturePage from './pages/ArchitecturePage';
import PipelinePage from './pages/PipelinePage';
import RevenuePage from './pages/RevenuePage';
import GuestPage from './pages/GuestPage';
import PolicyPage from './pages/PolicyPage';
import PortfolioPage from './pages/PortfolioPage';
import RelatedPage from './pages/RelatedPage';
import NotFoundPage from './pages/NotFoundPage';
import DbtWizardScenarioPage from './pages/DbtWizardScenarioPage';
import WizardLivePage from './pages/WizardLivePage';
import DbtWizardOutcomePage from './pages/DbtWizardOutcomePage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/related" element={<RelatedPage />} />
          <Route path="/revenue" element={<RevenuePage />} />
          <Route path="/guest" element={<GuestPage />} />
          <Route path="/architecture" element={<ArchitecturePage />} />
          <Route path="/pipeline" element={<PipelinePage />} />
          <Route path="/policy" element={<PolicyPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/dbt-wizard" element={<DbtWizardScenarioPage />} />
          <Route path="/wizard-live" element={<WizardLivePage />} />
          <Route path="/outcome" element={<DbtWizardOutcomePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
