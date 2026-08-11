import { useState } from "react";
import { Card } from "../../components/Card";
import { setGoal } from "../../db/goalRepo";
import { todayISO } from "../../utils/date";
import type { WeightGoal } from "../../db/schema";
import "./GoalForm.css";

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
    <Card className="goal-form-card">
      <p className="goal-form-title">{currentGoal ? "Modifier l'objectif" : "Définir un objectif"}</p>

      <div className="goal-form-fields">
        <label className="goal-form-field">
          Poids de départ (kg)
          <input
            type="text"
            inputMode="decimal"
            value={startWeight}
            onChange={(e) => setStartWeight(e.target.value)}
            className="goal-form-input"
          />
        </label>

        <label className="goal-form-field">
          Poids objectif (kg)
          <input
            type="text"
            inputMode="decimal"
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
            className="goal-form-input"
          />
        </label>

        <label className="goal-form-field">
          Date cible
          <input
            type="date"
            value={targetDate}
            min={minDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="goal-form-input"
          />
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="goal-form-actions">
        {onCancel && (
          <button onClick={onCancel} className="goal-form-cancel">
            Annuler
          </button>
        )}
        <button onClick={handleSave} disabled={saving} className="goal-form-submit">
          Valider l'objectif
        </button>
      </div>
    </Card>
  );
}