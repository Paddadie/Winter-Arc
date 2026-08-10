import { useEffect, useState } from "react";
import { PageLayout } from "../../components/PageLayout";
import { todayISO } from "../../utils/date";
import { addWeightEntry, getAllWeightEntries } from "../../db/weightRepo";
import { setGoal, getActiveGoal } from "../../db/goalRepo";
import { setDailyLog, getDailyLog } from "../../db/dailyLogRepo";
import { addApneaSession, getAllApneaSessions } from "../../db/apneaRepo";
import type { WeightEntry, WeightGoal, DailyLog, ApneaSession } from "../../db/schema";

/**
 * Page de test manuel de la couche de stockage (étape 2).
 * Pas destinée à l'usage final — sert uniquement à vérifier que
 * Dexie/IndexedDB fonctionne correctement avant de construire les vraies UI.
 */
export function DebugPage() {
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [goal, setGoalState] = useState<WeightGoal | null>(null);
  const [dailyLog, setDailyLogState] = useState<DailyLog | null>(null);
  const [apneaSessions, setApneaSessions] = useState<ApneaSession[]>([]);
  const [status, setStatus] = useState("");

  async function refresh() {
    setWeightEntries(await getAllWeightEntries());
    setGoalState(await getActiveGoal());
    setDailyLogState(await getDailyLog(todayISO()));
    setApneaSessions(await getAllApneaSessions());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleAddWeight() {
    const val = 70 + Math.random() * 20;
    await addWeightEntry(todayISO(), Math.round(val * 10) / 10);
    setStatus(`Poids ajouté pour ${todayISO()}`);
    await refresh();
  }

  async function handleSetGoal() {
    await setGoal({
      startWeightKg: 85,
      startDate: todayISO(),
      targetWeightKg: 75,
      targetDate: "2026-12-31",
    });
    setStatus("Objectif défini");
    await refresh();
  }

  async function handleToggleSport() {
    await setDailyLog(todayISO(), { sport: !(dailyLog?.sport ?? false) });
    setStatus("Log du jour mis à jour");
    await refresh();
  }

  async function handleAddApnea() {
    const durationSec = 90 + Math.floor(Math.random() * 90);
    await addApneaSession(todayISO(), durationSec);
    setStatus(`Session apnée ajoutée (${durationSec}s)`);
    await refresh();
  }

  return (
    <PageLayout title="Debug stockage" accentColor="var(--color-depth)">
      <p style={{ color: "var(--color-ink-muted)", fontSize: "14px" }}>
        Page temporaire pour vérifier IndexedDB. À retirer avant mise en production.
      </p>

      {status && (
        <p style={{ fontSize: "13px", color: "var(--color-teal)", fontWeight: 600 }}>{status}</p>
      )}

      <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <button onClick={handleAddWeight} style={debugButtonStyle}>
          Ajouter un poids aléatoire aujourd'hui
        </button>
        <pre style={preStyle}>{JSON.stringify(weightEntries, null, 2)}</pre>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <button onClick={handleSetGoal} style={debugButtonStyle}>
          Définir objectif test (85kg → 75kg, 31/12/2026)
        </button>
        <pre style={preStyle}>{JSON.stringify(goal, null, 2)}</pre>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <button onClick={handleToggleSport} style={debugButtonStyle}>
          Basculer "sport" aujourd'hui
        </button>
        <pre style={preStyle}>{JSON.stringify(dailyLog, null, 2)}</pre>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <button onClick={handleAddApnea} style={debugButtonStyle}>
          Ajouter une session d'apnée aléatoire
        </button>
        <pre style={preStyle}>{JSON.stringify(apneaSessions, null, 2)}</pre>
      </section>
    </PageLayout>
  );
}

const debugButtonStyle: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: "var(--radius-s)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-raised)",
  fontSize: "15px",
  fontWeight: 600,
  textAlign: "left",
};

const preStyle: React.CSSProperties = {
  background: "var(--color-surface-raised)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-s)",
  padding: "12px",
  fontSize: "12px",
  overflowX: "auto",
  margin: 0,
};
