import { useEffect, useState } from "react";
import { PageLayout } from "../../components/PageLayout";
import { Card } from "../../components/Card";
import { addApneaSession, getApneaSessionsBetween } from "../../db/apneaRepo";
import { formatDuration, formatDurationWithMs, averageDuration } from "../../domain/apnea";
import { todayISO, nowTimeHHMM } from "../../utils/date";
import type { ApneaSession } from "../../db/schema";

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
  const [todaySessions, setTodaySessions] = useState<ApneaSession[]>([]);

  useEffect(() => {
    if (runStartedAt === null) return;
    const id = setInterval(() => forceTick((t) => t + 1), 30);
    return () => clearInterval(id);
  }, [runStartedAt]);

  useEffect(() => {
    refreshToday();
  }, []);

  async function refreshToday() {
    setTodaySessions(await getApneaSessionsBetween(todayISO(), todayISO()));
  }

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
    await refreshToday();
  }

  const todayAverage = averageDuration(todaySessions.map((s) => s.durationSec));

  return (
    <PageLayout title="Apnée" accentColor="var(--color-teal)">
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
        <p
          style={{
            margin: "0 0 var(--space-s) 0",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--color-ink-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.03em",
          }}
        >
          Aujourd'hui
        </p>

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
    </PageLayout>
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