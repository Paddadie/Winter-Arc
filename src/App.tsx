import { HashRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "./features/home/HomePage";
import { WeightPage } from "./features/weight/WeightPage";
import { WeightHistoryPage } from "./features/weight/WeightHistoryPage";
import { ApneaPage } from "./features/apnea/ApneaPage";
import { ApneaHistoryPage } from "./features/apnea/ApneaHistoryPage";
import { SettingsPage } from "./features/settings/SettingsPage";
import { DebugPage } from "./features/debug/DebugPage";
import { UpdatePrompt } from "./components/UpdatePrompt";

/**
 * HashRouter (plutôt que BrowserRouter) : indispensable en PWA installée
 * sur iPhone, car il n'y a pas de serveur pour gérer les routes profondes
 * (pas de rewrite possible sur GitHub Pages sans configuration supplémentaire).
 */
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/regime" element={<WeightPage />} />
        <Route path="/regime/historique" element={<WeightHistoryPage />} />
        <Route path="/apnee" element={<ApneaPage />} />
        <Route path="/apnee/historique" element={<ApneaHistoryPage />} />
        <Route path="/reglages" element={<SettingsPage />} />
        <Route path="/debug" element={<DebugPage />} />
      </Routes>
      <UpdatePrompt />
    </HashRouter>
  );
}
