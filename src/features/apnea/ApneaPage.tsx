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

      <Card style={{ textAlign: "center" }}>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "48px",
            fontWeight: 800,
            margin: 0,
            lineHeight: 1,
            color: isRunning ? "var(--color-teal)" : "var(--color-depth)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatDurationWithMs(currentElapsedMs)}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-s)", marginTop: "var(--space-l)" }}>
          <TimerButton
            label={isRunning ? "Stop" : "Start"}
            onClick={handleToggleRun}
            variant="filled"
            color={isRunning ? "var(--color-alert)" : "var(--color-teal)"}
            fullWidth
          />
          <TimerButton label="Reset" onClick={handleReset} variant="outline" color="var(--color-ink-muted)" />
          <TimerButton label="Enregistrer" onClick={handleSave} variant="filled" color="var(--color-depth)" disabled={isRunning} />
        </div>

        {savedFeedback && (
          <p style={{ margin: "var(--space-s) 0 0 0", fontSize: "13px", color: "var(--color-success)", fontWeight: 600 }}>
            ✓ Enregistré
          </p>
        )}
        {saveError && (
          <p style={{ margin: "var(--space-s) 0 0 0", fontSize: "13px", color: "var(--color-alert)" }}>{saveError}</p>
        )}
      </Card>

      <Card>
        <CardLabel>Aujourd'hui</CardLabel>

        {todaySessions.length === 0 ? (
          <p style={{ margin: 0, fontSize: "14px", color: "var(--color-ink-muted)" }}>
            Aucune mesure enregistrée aujourd'hui.
          </p>
        ) : (
          <>
            {todayAverage !== null && todaySessions.length > 1 && (
              <p style={{ margin: "0 0 var(--space-s) 0", fontSize: "14px" }}>
                Moyenne du jour : <strong>{formatDuration(todayAverage)}</strong>
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {todaySessions.map((session) => (
                <div
                  key={session.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px",
                    padding: "4px 0",
                    borderTop: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ color: "var(--color-ink-muted)" }}>{session.time ?? "—"}</span>
                  <span style={{ fontWeight: 600 }}>{formatDuration(session.durationSec)}</span>
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
    <Card style={{ textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <CardLabel style={{ textAlign: "left" }}>{STATS_WINDOW_DAYS} derniers jours</CardLabel>
        <button
          onClick={() => setShowInfo(true)}
          aria-label="En savoir plus sur ces statistiques"
          style={{
            border: "1.5px solid var(--color-ink-muted)",
            background: "transparent",
            color: "var(--color-ink-muted)",
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            fontSize: "12px",
            fontWeight: 700,
            lineHeight: 1,
            padding: 0,
            marginBottom: "var(--space-s)",
          }}
        >
          i
        </button>
      </div>

      {showInfo && <WindowStatsInfoSheet stats={stats} onClose={() => setShowInfo(false)} />}

      {stats === null ? (
        <p style={{ margin: 0, fontSize: "14px", color: "var(--color-ink-muted)", textAlign: "left" }}>
          Pas assez de données sur les {STATS_WINDOW_DAYS} derniers jours.
        </p>
      ) : (
        <>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "40px",
              fontWeight: 800,
              margin: 0,
              lineHeight: 1,
              color: "var(--color-depth)",
            }}
          >
            {formatDuration(stats.averageSec)}
          </p>
          <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "var(--color-ink-muted)" }}>temps moyen</p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "var(--space-xl)",
              marginTop: "var(--space-m)",
              paddingTop: "var(--space-m)",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--color-alert)" }}>
                +{formatDuration(stats.averageSec - stats.worst.durationSec)}
              </p>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--color-ink-muted)" }}>pire perf.</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--color-success)" }}>
                -{formatDuration(stats.best.durationSec - stats.averageSec)}
              </p>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--color-ink-muted)" }}>meilleure perf.</p>
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
        <Card
          style={{
            borderRadius: "var(--radius-l) var(--radius-l) 0 0",
            textAlign: "left",
            paddingBottom: "calc(var(--space-l) + env(safe-area-inset-bottom))",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-s)" }}>
            <p style={{ margin: 0, fontSize: "17px", fontWeight: 700 }}>Pire / meilleure performance</p>
            <button
              onClick={close}
              aria-label="Fermer"
              style={{
                border: "none",
                background: "var(--color-surface)",
                color: "var(--color-ink-muted)",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                fontSize: "15px",
              }}
            >
              ✕
            </button>
          </div>

          <p style={{ margin: "0 0 4px 0", fontSize: "14px", lineHeight: 1.5 }}>
            <strong style={{ color: "var(--color-alert)" }}>Pire perf.</strong> : l'écart entre ta mesure la plus
            courte et ta moyenne sur les {STATS_WINDOW_DAYS} derniers jours. Plus ce nombre est petit, plus tes
            performances sont régulières.
          </p>
          {stats && (
            <p style={{ margin: "0 0 var(--space-m) 0", fontSize: "13px", color: "var(--color-ink-muted)" }}>
              Ta pire perf. sur la période :{" "}
              <strong style={{ color: "var(--color-ink)" }}>{formatDuration(stats.worst.durationSec)}</strong>,{" "}
              {whenLabel(stats.worst.date)}.
            </p>
          )}

          <p style={{ margin: "0 0 4px 0", fontSize: "14px", lineHeight: 1.5 }}>
            <strong style={{ color: "var(--color-success)" }}>Meilleure perf.</strong> : l'écart entre ta mesure la
            plus longue et cette même moyenne. Plus ce nombre est grand, plus tu as dépassé ta moyenne.
          </p>
          {stats && (
            <p style={{ margin: 0, fontSize: "13px", color: "var(--color-ink-muted)" }}>
              Ta meilleure perf. sur la période :{" "}
              <strong style={{ color: "var(--color-ink)" }}>{formatDuration(stats.best.durationSec)}</strong>,{" "}
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
        <p style={{ margin: 0, fontSize: "14px", color: "var(--color-ink-muted)" }}>
          Pas encore de mesure sur les {RECENT_LOOKBACK_DAYS} derniers jours (hors aujourd'hui).
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {shownDates.map((date, i) => {
            const avg = averageDuration(sessions.filter((s) => s.date === date).map((s) => s.durationSec))!;
            return (
              <div
                key={date}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "14px",
                  padding: "6px 0",
                  borderTop: i === 0 ? "none" : "1px solid var(--color-border)",
                }}
              >
                <span>{relativeDayLabel(date)}</span>
                <span style={{ fontWeight: 600 }}>{formatDuration(avg)}</span>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={() => navigate("/apnee/historique")}
        style={{
          border: "none",
          background: "transparent",
          color: "var(--color-teal)",
          fontSize: "13px",
          fontWeight: 600,
          padding: 0,
          marginTop: "var(--space-s)",
        }}
      >
        Historique complet →
      </button>
    </Card>
  );
}

function TimerButton({
  label,
  onClick,
  variant,
  color,
  fullWidth,
  disabled,
}: {
  label: string;
  onClick: () => void;
  variant: "filled" | "outline";
  color: string;
  fullWidth?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        gridColumn: fullWidth ? "1 / -1" : undefined,
        border: variant === "outline" ? `1.5px solid ${color}` : "none",
        borderRadius: "var(--radius-m)",
        padding: "14px",
        background: variant === "filled" ? color : "transparent",
        color: variant === "filled" ? "white" : color,
        fontSize: "16px",
        fontWeight: 700,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {label}
    </button>
  );
}