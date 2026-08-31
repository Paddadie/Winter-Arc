import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "./features/home/HomePage";
import { WeightPage } from "./features/weight/WeightPage";
import { WeightHistoryPage } from "./features/weight/WeightHistoryPage";
import { ApneaPage } from "./features/apnea/ApneaPage";
import { ApneaHistoryPage } from "./features/apnea/ApneaHistoryPage";
import { SettingsPage } from "./features/settings/SettingsPage";
import { UpdatePrompt } from "./components/UpdatePrompt";
import { ErrorBoundary } from "./components/ErrorBoundary";

/**
 * HashRouter (plutôt que BrowserRouter) : indispensable en PWA installée
 * sur iPhone, car il n'y a pas de serveur pour gérer les routes profondes
 * (pas de rewrite possible sur GitHub Pages sans configuration supplémentaire).
 */
export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/regime" element={<WeightPage />} />
          <Route path="/regime/historique" element={<WeightHistoryPage />} />
          <Route path="/apnee" element={<ApneaPage />} />
          <Route path="/apnee/historique" element={<ApneaHistoryPage />} />
          <Route path="/reglages" element={<SettingsPage />} />
          {/* Une URL obsolète (raccourci enregistré, ancienne version de l'app)
              renvoie à l'accueil plutôt que sur un écran vide. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <UpdatePrompt />
      </HashRouter>
    </ErrorBoundary>
  );
}
