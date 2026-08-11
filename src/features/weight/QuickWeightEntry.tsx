import { useState } from "react";
import { Card } from "../../components/Card";
import { addWeightEntry } from "../../db/weightRepo";
import { todayISO } from "../../utils/date";

interface QuickWeightEntryProps {
  onSaved: () => void;
}

export function QuickWeightEntry({ onSaved }: QuickWeightEntryProps) {
  const [value, setValue] = useState("");
  const [date, setDate] = useState(todayISO());
  const [showDateEdit, setShowDateEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFeedback, setSavedFeedback] = useState(false);

  async function handleSave() {
    const parsedWeight = parseFloat(value.replace(",", "."));
    if (value.trim() === "" || isNaN(parsedWeight) || parsedWeight <= 0 || parsedWeight >= 400) {
      setError("Poids invalide");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await addWeightEntry(date, Math.round(parsedWeight * 10) / 10);
      setValue("");
      setDate(todayISO());
      setShowDateEdit(false);
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
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
        Nouvelle pesée
      </p>
      <div style={{ display: "flex", gap: "var(--space-s)" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <input
            type="text"
            inputMode="decimal"
            placeholder="82,4"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            style={{
              width: "100%",
              fontFamily: "var(--font-display)",
              fontSize: "28px",
              fontWeight: 700,
              padding: "12px 44px 12px 16px",
              borderRadius: "var(--radius-m)",
              border: `1.5px solid ${error ? "var(--color-alert)" : "var(--color-border)"}`,
              color: "var(--color-ink)",
              background: "var(--color-surface)",
            }}
          />
          <span
            style={{
              position: "absolute",
              right: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-ink-muted)",
              fontSize: "16px",
              fontWeight: 600,
              pointerEvents: "none",
            }}
          >
            kg
          </span>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            border: "none",
            borderRadius: "var(--radius-m)",
            padding: "0 var(--space-l)",
            background: "var(--color-coral)",
            color: "white",
            fontSize: "16px",
            fontWeight: 700,
            opacity: saving ? 0.6 : 1,
          }}
        >
          Enregistrer
        </button>
      </div>

      {savedFeedback && (
        <p style={{ margin: "8px 0 0 0", fontSize: "13px", color: "var(--color-success)", fontWeight: 600 }}>
          ✓ Enregistré
        </p>
      )}

      {error && (
        <p style={{ margin: "8px 0 0 0", fontSize: "13px", color: "var(--color-alert)" }}>
          {error}
        </p>
      )}

      <div style={{ marginTop: "var(--space-s)" }}>
        {showDateEdit ? (
          <input
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            style={{
              fontSize: "14px",
              padding: "6px 8px",
              borderRadius: "8px",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
            }}
          />
        ) : (
          <button
            onClick={() => setShowDateEdit(true)}
            style={{
              border: "none",
              background: "transparent",
              color: "var(--color-ink-muted)",
              fontSize: "13px",
              padding: 0,
              textDecoration: "underline",
            }}
          >
            {date === todayISO() ? "Aujourd'hui" : date} · modifier la date
          </button>
        )}
      </div>
    </Card>
  );
}
