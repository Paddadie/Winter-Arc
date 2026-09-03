import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { featureTiles, type FeatureId } from "./features.config";
import { Tile } from "./Tile";
import { StreakGrid } from "./StreakGrid";
import { getHiddenTileIds } from "./tileVisibility";
import { getLastActivityDates } from "./lastActivity";
import { getDoneTodayFlags } from "./todayCompletion";
import { buildReminderLabel } from "./featureReminder";
import { useRefreshOnForeground } from "../../utils/useRefreshOnForeground";
import { todayISO } from "../../utils/date";
import "./HomePage.css";

export function HomePage() {
  const navigate = useNavigate();
  const [lastActivity, setLastActivity] = useState<Record<FeatureId, string | null> | null>(null);
  const [doneToday, setDoneToday] = useState<Record<FeatureId, boolean> | null>(null);

  function refresh() {
    Promise.all([getLastActivityDates(), getDoneTodayFlags(todayISO())])
      .then(([activity, done]) => {
        setLastActivity(activity);
        setDoneToday(done);
      })
      .catch(() => {
        setLastActivity(null);
        setDoneToday(null);
      });
  }

  useEffect(refresh, []);
  useRefreshOnForeground(refresh);

  const hiddenTileIds = getHiddenTileIds();
  const visibleTiles = featureTiles.filter((tile) => !hiddenTileIds.has(tile.id));
  const today = todayISO();

  return (
    <div className="home-page">
      <header className="home-header">
        <div>
          <p className="home-eyebrow">Winter Arc</p>
          <h1 className="home-title">Tableau de bord</h1>
        </div>
        <button onClick={() => navigate("/reglages")} aria-label="Réglages" className="home-settings-button">
          ⚙️
        </button>
      </header>

      <main className="home-main">
        <StreakGrid />

        <nav className="home-tiles" aria-label="Fonctionnalités">
          {visibleTiles.map((tile) => (
            <Tile
              key={tile.id}
              tile={tile}
              pendingToday={doneToday !== null && !doneToday[tile.id]}
              reminder={lastActivity ? buildReminderLabel(tile.reminder, lastActivity[tile.id], today) : null}
            />
          ))}
        </nav>
      </main>
    </div>
  );
}
