import { useEffect, useState } from "react";
import { PageLayout } from "../../components/PageLayout";
import { Card } from "../../components/Card";
import { ApneaProgressionChart } from "./ApneaProgressionChart";
import { deleteApneaSession, getAllApneaSessions } from "../../db/apneaRepo";
import { formatDuration, groupDailyBest } from "../../domain/apnea";
import { todayISO, addDays, relativeDayLabel } from "../../utils/date";
import type { ApneaSession } from "../../db/schema";
import "./ApneaHistoryPage.css";

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
        <p className="text-muted">Chargement…</p>
      </PageLayout>
    );
  }

  const cutoff = period === "7j" ? addDays(todayISO(), -6) : period === "30j" ? addDays(todayISO(), -29) : null;
  // sessions est déjà trié par date décroissante (getAllApneaSessions) : pratique pour le tableau.
  const filtered = cutoff === null ? sessions : sessions.filter((s) => s.date >= cutoff);
  const chronological = [...filtered].reverse();
  const dailyPoints = groupDailyBest(chronological);

  return (
    <PageLayout title="Historique" accentColor="var(--color-teal)" backTo="/apnee" backLabel="Apnée">
      <div className="apnea-history-period-row">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={`period-button ${period === opt.value ? "period-button--active" : ""}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <ApneaProgressionChart points={dailyPoints} />

      <Card className="apnea-history-table-card">
        {filtered.length === 0 ? (
          <p className="empty-message apnea-history-empty">Aucune mesure sur cette période.</p>
        ) : (
          <div>
            {filtered.map((session, i) => (
              <div key={session.id} className={`apnea-history-row ${i === 0 ? "apnea-history-row--first" : ""}`}>
                <span className="apnea-history-date">{relativeDayLabel(session.date)}</span>
                <span className="apnea-history-time">{session.time ?? "—"}</span>
                <span className="apnea-history-duration">{formatDuration(session.durationSec)}</span>
                <button
                  onClick={() => handleDelete(session)}
                  aria-label="Supprimer cette mesure"
                  className="apnea-history-delete-button"
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