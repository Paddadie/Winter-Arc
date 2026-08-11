import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "../../components/PageLayout";
import { Card } from "../../components/Card";
import { CardLabel } from "../../components/CardLabel";
import { BottomSheet } from "../../components/BottomSheet";
import { addApneaSession, getRecentApneaSessions } from "../../db/apneaRepo";
import { formatDuration, formatDurationWithMs, averageDuration, computeWindowStats } from "../../domain/apnea";
import type { ApneaWindowStats } from "../../domain/apnea";
import { todayISO, addDays, nowTimeHHMM, relativeDayLabel } from "../../utils/date";
import type { ApneaSession } from "../../db/schema";
import "./ApneaPage.css";

const STATS_WINDOW_DAYS = 10;
const RECENT_LOOKBACK_DAYS = 8;
const RECENT_DAYS_SHOWN = 3;

/**
 * Chronomètre d'apnée statique. Un seul bouton bascule Start/Stop (pause et
 * reprise possibles avant d'enregistrer) ; Reset efface tout à tout moment ;
 * Enregistrer est désactivé tant que le chrono tourne (il faut d'abord
 * l'arrêter), pour éviter d'enregistrer une mesure encore en cours.
 */
export function ApneaPage() {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null);
  const [, forceTick] = useState(0);

  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [recentSessions, setRecentSessions] = useState<ApneaSession[]>([]);

  useEffect(() => {
    if (runStartedAt === null) return;
    const id = setInterval(() => forceTick((t) => t + 1), 30);
    return () => clearInterval(id);
  }, [runStartedAt]);

  useEffect(() => {
    refreshSessions();
  }, []);

  // Charge les sessions des STATS_WINDOW_DAYS derniers jours en une fois :
  // ça couvre aussi bien la liste du jour que les stats sur 10 jours et les
  // 3 derniers jours, sans requêtes séparées.
  async function refreshSessions() {
    setRecentSessions(await getRecentApneaSessions(addDays(todayISO(), -(STATS_WINDOW_DAYS - 1))));
  }

  const todaySessions = recentSessions.filter((s) => s.date === todayISO());
  const windowStats = computeWindowStats(recentSessions);

  const currentElapsedMs = elapsedMs + (runStartedAt !== null ? Date.now() - runStartedAt : 0);
  const isRunning = runStartedAt !== null;

  function handleToggleRun() {
    if (isRunning) {
      setElapsedMs((prev) => prev + (Date.now() - runStartedAt!));
      setRunStartedAt(null);
    } else {
      setSaveError(null);
      setRunStartedAt(Date.now());
    }
  }

  function handleReset() {
    setElapsedMs(0);
    setRunStartedAt(null);
    setSaveError(null);
  }

  async function handleSave() {
    const totalSec = Math.floor(elapsedMs / 1000);
    if (totalSec <= 0) {
      setSaveError("Rien à enregistrer — lance le chronomètre d'abord.");
      return;
    }
    setSaveError(null);
    await addApneaSession(todayISO(), totalSec, nowTimeHHMM());
    setElapsedMs(0);
    setRunStartedAt(null);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
    await refreshSessions();
  }

  const todayAverage = averageDuration(todaySessions.map((s) => s.durationSec));

  return (
    <PageLayout title="Apnée" accentColor="var(--color-teal)">
      <WindowStatsCard stats={windowStats} />

      <Card className="card--center">
        <p className={`apnea-timer-display ${isRunning ? "apnea-timer-display--running" : ""}`}>
          {formatDurationWithMs(currentElapsedMs)}
        </p>

        <div className="apnea-timer-buttons">
          <TimerButton
            label={isRunning ? "Stop" : "Start"}
            onClick={handleToggleRun}
            variant="filled"
            tone={isRunning ? "alert" : "teal"}
            fullWidth
          />
          <TimerButton label="Reset" onClick={handleReset} variant="outline" tone="muted" />
          <TimerButton label="Enregistrer" onClick={handleSave} variant="filled" tone="depth" disabled={isRunning} />
        </div>

        {savedFeedback && <p className="form-feedback">✓ Enregistré</p>}
        {saveError && <p className="form-error">{saveError}</p>}
      </Card>

      <Card>
        <CardLabel>Aujourd'hui</CardLabel>

        {todaySessions.length === 0 ? (
          <p className="empty-message">Aucune mesure enregistrée aujourd'hui.</p>
        ) : (
          <>
            {todayAverage !== null && todaySessions.length > 1 && (
              <p className="apnea-today-average">
                Moyenne du jour : <strong>{formatDuration(todayAverage)}</strong>
              </p>
            )}
            <div className="apnea-today-list">
              {todaySessions.map((session) => (
                <div key={session.id} className="apnea-today-row">
                  <span className="apnea-today-time">{session.time ?? "—"}</span>
                  <span className="apnea-today-duration">{formatDuration(session.durationSec)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <RecentPerformancesCard sessions={recentSessions} />
    </PageLayout>
  );
}

/** Stats sur STATS_WINDOW_DAYS jours : temps moyen en grand, pire/meilleure perf en secondaire. */
function WindowStatsCard({ stats }: { stats: ApneaWindowStats | null }) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <Card className="card--center">
      <div className="apnea-stats-header">
        <CardLabel className="card-label--left">{STATS_WINDOW_DAYS} derniers jours</CardLabel>
        <button onClick={() => setShowInfo(true)} aria-label="En savoir plus sur ces statistiques" className="apnea-info-button">
          i
        </button>
      </div>

      {showInfo && <WindowStatsInfoSheet stats={stats} onClose={() => setShowInfo(false)} />}

      {stats === null ? (
        <p className="empty-message apnea-stats-empty">Pas assez de données sur les {STATS_WINDOW_DAYS} derniers jours.</p>
      ) : (
        <>
          <p className="apnea-stats-average">{formatDuration(stats.averageSec)}</p>
          <p className="apnea-stats-average-label">temps moyen</p>

          <div className="apnea-stats-row">
            <div>
              <p className="apnea-stats-value text-alert">
                +{formatDuration(stats.averageSec - stats.worst.durationSec)}
              </p>
              <p className="apnea-stats-sublabel">pire perf.</p>
            </div>
            <div>
              <p className="apnea-stats-value text-success">
                -{formatDuration(stats.best.durationSec - stats.averageSec)}
              </p>
              <p className="apnea-stats-sublabel">meilleure perf.</p>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

function WindowStatsInfoSheet({ stats, onClose }: { stats: ApneaWindowStats | null; onClose: () => void }) {
  return (
    <BottomSheet onClose={onClose}>
      {(close) => (
        <Card className="card--sheet">
          <div className="sheet-header">
            <p className="apnea-info-title">Pire / meilleure performance</p>
            <button onClick={close} aria-label="Fermer" className="close-button">
              ✕
            </button>
          </div>

          <p className="apnea-info-text">
            <strong className="text-alert">Pire perf.</strong> : l'écart entre ta mesure la plus
            courte et ta moyenne sur les {STATS_WINDOW_DAYS} derniers jours. Plus ce nombre est petit, plus tes
            performances sont régulières.
          </p>
          {stats && (
            <p className="apnea-info-detail">
              Ta pire perf. sur la période :{" "}
              <strong className="apnea-info-detail-value">{formatDuration(stats.worst.durationSec)}</strong>,{" "}
              {whenLabel(stats.worst.date)}.
            </p>
          )}

          <p className="apnea-info-text">
            <strong className="text-success">Meilleure perf.</strong> : l'écart entre ta mesure la
            plus longue et cette même moyenne. Plus ce nombre est grand, plus tu as dépassé ta moyenne.
          </p>
          {stats && (
            <p className="apnea-info-detail">
              Ta meilleure perf. sur la période :{" "}
              <strong className="apnea-info-detail-value">{formatDuration(stats.best.durationSec)}</strong>,{" "}
              {whenLabel(stats.best.date)}.
            </p>
          )}
        </Card>
      )}
    </BottomSheet>
  );
}

function whenLabel(iso: string): string {
  if (iso === todayISO()) return "aujourd'hui";
  if (iso === addDays(todayISO(), -1)) return "hier";
  return `le ${new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`;
}

/**
 * Les RECENT_DAYS_SHOWN jours les plus récents (parmi les RECENT_LOOKBACK_DAYS
 * derniers jours, hors aujourd'hui qui a déjà sa propre carte) ayant au moins
 * une mesure. Les jours sans donnée ne sont pas affichés du tout ; si aucun
 * des jours de la fenêtre n'a de mesure, un message l'indique clairement.
 */
function RecentPerformancesCard({ sessions }: { sessions: ApneaSession[] }) {
  const navigate = useNavigate();
  const lookbackDates = Array.from({ length: RECENT_LOOKBACK_DAYS - 1 }, (_, i) => addDays(todayISO(), -(i + 1)));
  const datesWithData = lookbackDates.filter((date) => sessions.some((s) => s.date === date));
  const shownDates = datesWithData.slice(0, RECENT_DAYS_SHOWN);

  return (
    <Card>
      <CardLabel>Performances récentes</CardLabel>

      {shownDates.length === 0 ? (
        <p className="empty-message">
          Pas encore de mesure sur les {RECENT_LOOKBACK_DAYS} derniers jours (hors aujourd'hui).
        </p>
      ) : (
        <div className="apnea-recent-list">
          {shownDates.map((date, i) => {
            const avg = averageDuration(sessions.filter((s) => s.date === date).map((s) => s.durationSec))!;
            return (
              <div key={date} className={`apnea-recent-row ${i === 0 ? "apnea-recent-row--first" : ""}`}>
                <span>{relativeDayLabel(date)}</span>
                <span className="apnea-recent-duration">{formatDuration(avg)}</span>
              </div>
            );
          })}
        </div>
      )}

      <button onClick={() => navigate("/apnee/historique")} className="apnea-history-link">
        Historique complet →
      </button>
    </Card>
  );
}

function TimerButton({
  label,
  onClick,
  variant,
  tone,
  fullWidth,
  disabled,
}: {
  label: string;
  onClick: () => void;
  variant: "filled" | "outline";
  tone: "teal" | "alert" | "muted" | "depth";
  fullWidth?: boolean;
  disabled?: boolean;
}) {
  const classes = [
    "timer-button",
    `timer-button--${variant}`,
    `timer-button--${tone}`,
    fullWidth ? "timer-button--full-width" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button onClick={onClick} disabled={disabled} className={classes}>
      {label}
    </button>
  );
}