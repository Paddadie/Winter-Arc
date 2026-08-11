import { featureTiles } from "./features.config";
import { Tile } from "./Tile";
import "./HomePage.css";

export function HomePage() {
  return (
    <div className="home-page">
      <div>
        <p className="home-eyebrow">Winter Arc</p>
        <h1 className="home-title">Tableau de bord</h1>
      </div>

      <div className="home-tiles">
        {featureTiles.map((tile) => (
          <Tile key={tile.id} tile={tile} />
        ))}
      </div>
    </div>
  );
}