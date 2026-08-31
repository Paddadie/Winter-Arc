import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import type { FeatureTile } from "./features.config";
import "./Tile.css";

interface TileProps {
  tile: FeatureTile;
  /**
   * Deux signaux volontairement distincts, qui ne répondent pas à la même
   * question :
   * - `pendingToday` (pastille) = "reste-t-il quelque chose à saisir today ?",
   *   c'est le rappel du quotidien ;
   * - `reminder` (texte) = "ça fait longtemps", c'est le décrochage durable.
   * Une journée simplement pas encore remplie allume la pastille sans
   * remplacer la description : la tuile ne dramatise pas un oubli d'une heure.
   */
  pendingToday?: boolean;
  reminder?: string | null;
}

export function Tile({ tile, pendingToday, reminder }: TileProps) {
  const navigate = useNavigate();
  const status = [reminder, pendingToday ? "rien enregistré aujourd'hui" : null].filter(Boolean).join(", ");

  return (
    <button
      onClick={() => navigate(tile.route)}
      aria-label={status ? `${tile.label} — ${status}` : tile.label}
      className="tile"
      style={{ "--tile-color": tile.color, "--tile-color-soft": tile.colorSoft } as CSSProperties}
    >
      <span className="tile-icon" aria-hidden="true">
        {tile.icon}
      </span>
      <span className="tile-text">
        <span className="tile-label">{tile.label}</span>
        <span className="tile-description">{reminder ?? tile.description}</span>
      </span>
      {pendingToday && <span className="tile-pending-dot" aria-hidden="true" />}
    </button>
  );
}