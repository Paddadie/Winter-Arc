import { useEffect, useState } from "react";
import { PageLayout } from "../../components/PageLayout";
import { Card } from "../../components/Card";
import { ApneaProgressionChart } from "./ApneaProgressionChart";
import { deleteApneaSession, getAllApneaSessions } from "../../db/apneaRepo";
import { formatDuration, groupDailyAverages } from "../../domain/apnea";
import { todayISO, addDays, relativeDayLabel } from "../../utils/date";
import type { ApneaSession } from "../../db/schema";

type Period = "7j" | "30j" | "tout";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "7j", label: "7 jours" },
  { value: "30j", label: "30 jours" },
  { value: "tout", label: "Tout" },
];

export function ApneaHistoryPage() {
  const [sessions, setSessions] = useState<ApneaSession[]>([]);
  const [period, setPeriod] = useState<Period>("30j");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setSessions(await getAllApneaSessions());
    setLoading(false);
  }

  async function handleDelete(session: ApneaSession) {
    const confirmed = window.confirm(
      `Supprimer la mesure du ${relativeDayLabel(session.date)} (${formatDuration(session.durationSec)}) ?`
    );
    if (!confirmed) return;
    await deleteApneaSession(session.id!);
    await refresh();
  }

  if (loading) {
    return (
      <PageLayout title="Historique" accentColor="var(--color-teal)" backTo="/apnee" backLabel="Apnée">
        <p style={{ color: "var(--color-ink-muted)" }}>Chargement…</p>
      </PageLayout>
    );
  }

  const cutoff = period === "7j" ? addDays(todayISO(), -6) : period === "30j" ? addDays(todayISO(), -29) : null;
  // sessions est déjà trié par date décroissante (getAllApneaSessions) : pratique pour le tableau.
  const filtered = cutoff === null ? sessions : sessions.filter((s) => s.date >= cutoff);
  const chronological = [...filtered].reverse();
  const dailyPoints = groupDailyAverages(chronological);

  return (
    <PageLayout title="Historique" accentColor="var(--color-teal)" backTo="/apnee" backLabel="Apnée">
      <div style={{ display: "flex", gap: "var(--space-s)" }}>
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            style={{
              flex: 1,
              border: `1.5px solid ${period === opt.value ? "var(--color-teal)" : "var(--color-border)"}`,
              borderRadius: "var(--radius-m)",
              padding: "8px",
              background: period === opt.value ? "var(--color-teal)" : "transparent",
              color: period === opt.value ? "white" : "var(--color-ink)",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <ApneaProgressionChart points={dailyPoints} />

      <Card style={{ padding: "var(--space-s) var(--space-m)" }}>
        {filtered.length === 0 ? (
          <p style={{ margin: "var(--space-s) 0", color: "var(--color-ink-muted)", fontSize: "14px" }}>
            Aucune mesure sur cette période.
          </p>
        ) : (
          <div>
            {filtered.map((session, i) => (
              <div
                key={session.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-s)",
                  padding: "10px 0",
                  borderTop: i === 0 ? "none" : "1px solid var(--color-border)",
                }}
              >
                <span style={{ flex: 1, fontSize: "14px" }}>{relativeDayLabel(session.date)}</span>
                <span style={{ width: "48px", fontSize: "14px", color: "var(--color-ink-muted)" }}>
                  {session.time ?? "—"}
                </span>
                <span style={{ width: "56px", fontSize: "14px", fontWeight: 600, textAlign: "right" }}>
                  {formatDuration(session.durationSec)}
                </span>
                <button
                  onClick={() => handleDelete(session)}
                  aria-label="Supprimer cette mesure"
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "var(--color-ink-muted)",
                    fontSize: "16px",
                    padding: "4px 0 4px 8px",
                  }}
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </PageLayout>
  );
}