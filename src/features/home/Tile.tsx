import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import type { FeatureTile } from "./features.config";
import "./Tile.css";

export function Tile({ tile }: { tile: FeatureTile }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(tile.route)}
      className="tile"
      style={{ "--tile-color": tile.color, "--tile-color-soft": tile.colorSoft } as CSSProperties}
    >
      <span className="tile-icon">{tile.icon}</span>
      <span className="tile-text">
        <span className="tile-label">{tile.label}</span>
        <span className="tile-description">{tile.description}</span>
      </span>
    </button>
  );
}