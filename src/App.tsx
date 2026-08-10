import { HashRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "./features/home/HomePage";
import { WeightPage } from "./features/weight/WeightPage";
import { ApneaPage } from "./features/apnea/ApneaPage";

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
        <Route path="/apnee" element={<ApneaPage />} />
      </Routes>
    </HashRouter>
  );
}
