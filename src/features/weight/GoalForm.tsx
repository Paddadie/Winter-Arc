import { useState } from "react";
import { Card } from "../../components/Card";
import { setGoal } from "../../db/goalRepo";
import { todayISO } from "../../utils/date";
import type { WeightGoal } from "../../db/schema";

interface GoalFormProps {
  currentGoal: WeightGoal | null;
  latestWeightKg: number | null;
  onSaved: () => void;
  onCancel?: () => void;
}

export function GoalForm({ currentGoal, latestWeightKg, onSaved, onCancel }: GoalFormProps) {
  const [startWeight, setStartWeight] = useState(
    String(latestWeightKg ?? currentGoal?.startWeightKg ?? "").replace(".", ",")
  );
  const [targetWeight, setTargetWeight] = useState(
    currentGoal ? String(currentGoal.targetWeightKg).replace(".", ",") : ""
  );
  const [targetDate, setTargetDate] = useState(currentGoal?.targetDate ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedStart = parseFloat(startWeight.replace(",", "."));
  const parsedTarget = parseFloat(targetWeight.replace(",", "."));
  const minDate = todayISO();

  async function handleSave() {
    if (isNaN(parsedStart) || parsedStart <= 0) {
      setError("Indique un poids de départ valide.");
      return;
    }
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      setError("Indique un poids objectif valide.");
      return;
    }
    if (targetDate === "") {
      setError("Choisis une date cible.");
      return;
    }
    if (targetDate <= minDate) {
      setError("La date cible doit être postérieure à aujourd'hui.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await setGoal({
        startWeightKg: Math.round(parsedStart * 10) / 10,
        startDate: todayISO(),
        targetWeightKg: Math.round(parsedTarget * 10) / 10,
        targetDate,
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card style={{ background: "var(--color-coral-soft)", border: "none" }}>
      <p
        style={{
          margin: "0 0 var(--space-m) 0",
          fontFamily: "var(--font-display)",
          fontSize: "18px",
          fontWeight: 700,
        }}
      >
        {currentGoal ? "Modifier l'objectif" : "Définir un objectif"}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-m)" }}>
        <label style={labelStyle}>
          Poids de départ (kg)
          <input
            type="text"
            inputMode="decimal"
            value={startWeight}
            onChange={(e) => setStartWeight(e.target.value)}
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Poids objectif (kg)
          <input
            type="text"
            inputMode="decimal"
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Date cible
          <input
            type="date"
            value={targetDate}
            min={minDate}
            onChange={(e) => setTargetDate(e.target.value)}
            style={inputStyle}
          />
        </label>
      </div>

      {error && (
        <p style={{ margin: "var(--space-s) 0 0 0", fontSize: "13px", color: "var(--color-alert)" }}>
          {error}
        </p>
      )}

      <div style={{ display: "flex", gap: "var(--space-s)", marginTop: "var(--space-l)" }}>
        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              border: "none",
              borderRadius: "var(--radius-m)",
              padding: "12px",
              background: "transparent",
              color: "var(--color-ink-muted)",
              fontWeight: 600,
              fontSize: "15px",
            }}
          >
            Annuler
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            flex: 2,
            border: "none",
            borderRadius: "var(--radius-m)",
            padding: "12px",
            background: "var(--color-coral)",
            color: "white",
            fontWeight: 700,
            fontSize: "15px",
            opacity: saving ? 0.6 : 1,
          }}
        >
          Valider l'objectif
        </button>
      </div>
    </Card>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--color-ink-muted)",
};

const inputStyle: React.CSSProperties = {
  fontSize: "16px",
  padding: "10px 12px",
  borderRadius: "var(--radius-s)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-raised)",
  color: "var(--color-ink)",
  fontWeight: 600,
};
