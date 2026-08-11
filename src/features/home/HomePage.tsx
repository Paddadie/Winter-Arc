import { useNavigate } from "react-router-dom";
import { featureTiles } from "./features.config";
import { Tile } from "./Tile";
import { TodayChecklist } from "./TodayChecklist";
import "./HomePage.css";

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <div className="home-header">
        <div>
          <p className="home-eyebrow">Winter Arc</p>
          <h1 className="home-title">Tableau de bord</h1>
        </div>
        <button onClick={() => navigate("/reglages")} aria-label="Réglages" className="home-settings-button">
          ⚙️
        </button>
      </div>

      <TodayChecklist />

      <div className="home-tiles">
        {featureTiles.map((tile) => (
          <Tile key={tile.id} tile={tile} />
        ))}
      </div>
    </div>
  );
}