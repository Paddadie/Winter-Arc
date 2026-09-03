import { useState } from "react";
import { Card } from "../../components/Card";
import { BottomSheet } from "../../components/BottomSheet";
import { addWeightEntry, deleteWeightEntry } from "../../db/weightRepo";
import { setDailyLog } from "../../db/dailyLogRepo";
import { isPeriodTrackingEnabled } from "./periodTrackingPref";
import { formatKg, formatKgValue, formatSignedKg } from "./weightFormat";
import { parseISODate, todayISO } from "../../utils/date";
import type { DailyLog } from "../../db/schema";
import { useHorizontalSwipe } from "../../utils/useHorizontalSwipe";
import type { WeightSeriesPoint } from "../../domain/weightSeries";
import "./DayDetailCard.css";

interface DayDetailCardProps {
  point: WeightSeriesPoint;
  onClose: () => void;
  /** Appelé après correction ou suppression de la pesée, pour recharger la page. */
  onChanged: () => Promise<unknown> | void;
  /** Jours voisins DANS LA FENÊTRE AFFICHÉE, null au bord : bornes du balayage. */
  previousDate: string | null;
  nextDate: string | null;
  /** Change le jour affiché sans refermer la fiche. */
  onNavigate: (date: string) => void;
}

/** Fiche détail d'un jour, affichée en fiche du bas au tap sur le graphique. */
export function DayDetailCard({
  point,
  onClose,
  onChanged,
  previousDate,
  nextDate,
  onNavigate,
}: DayDetailCardProps) {
  const diff =
    point.weightKg !== null && point.goalWeightKg !== null ? Math.round((point.weightKg - point.goalWeightKg) * 10) / 10 : null;

  // Côté d'où arrive le nouveau jour, pour l'animation de glissement. Null au
  // premier rendu : la fiche monte déjà depuis le bas, inutile d'en rajouter.
  const [slideFrom, setSlideFrom] = useState<"left" | "right" | null>(null);

  // Balayage vers la gauche = jour suivant, vers la droite = jour précédent :
  // le sens des applications photo et calendrier, où le doigt pousse le
  // contenu actuel hors de l'écran pour tirer le suivant.
  function goTo(date: string, from: "left" | "right") {
    setSlideFrom(from);
    onNavigate(date);
  }

  const swipeHandlers = useHorizontalSwipe({
    left: nextDate ? () => goTo(nextDate, "right") : undefined,
    right: previousDate ? () => goTo(previousDate, "left") : undefined,
  });

  /** Bascule une puce du journal, en créant le journal du jour s'il n'existe pas encore. */
  async function toggleLog(patch: Partial<Pick<DailyLog, "sport" | "foodDeviation" | "period">>) {
    await setDailyLog(point.date, patch);
    await onChanged();
  }

  return (
    <BottomSheet onClose={onClose} label={`Détail du ${formatFullDate(point.date)}`}>
      {(close) => (
        <div {...swipeHandlers} className="day-detail-swipe-area">
          {/* `key` sur la date : changer de jour remonte le contenu, ce qui
              relance l'animation d'entrée du nouveau jour. */}
          <div key={point.date} className={slideFrom ? `day-detail-slide--from-${slideFrom}` : undefined}>
            <Card className="card--sheet">
              <div className="sheet-header">
                <h2 className="day-detail-title">{formatFullDate(point.date)}</h2>
                <button onClick={close} aria-label="Fermer" className="close-button">
                  ✕
                </button>
              </div>

              <DetailRow
                label="Poids"
                value={
                  point.weightKg !== null
                    ? `${formatKg(point.weightKg)}${point.isReal ? "" : " (estimé)"}`
                    : "Aucune pesée"
                }
              />
              {diff !== null && (
                <DetailRow
                  label="Écart vs objectif"
                  value={formatSignedKg(diff)}
                  variant={diff > 0 ? "alert" : "success"}
                />
              )}
              <DetailRow
                label="Sport"
                value={logLabel(point.sport, point.date)}
                variant={point.sport ? "success" : undefined}
                pressed={point.sport === true}
                onToggle={() => toggleLog({ sport: point.sport !== true })}
              />
              <DetailRow
                label="Écart alimentaire"
                value={logLabel(point.foodDeviation, point.date)}
                variant={point.foodDeviation ? "alert" : undefined}
                pressed={point.foodDeviation === true}
                onToggle={() => toggleLog({ foodDeviation: point.foodDeviation !== true })}
              />
              {isPeriodTrackingEnabled() && (
                <DetailRow
                  label="Cycle"
                  // Pas de repli sur "Non" ici, contrairement à sport et écart :
                  // l'absence de saisie de cycle n'a pas été déclarée équivalente
                  // à un "non" par l'utilisatrice.
                  value={point.period === null ? "Non renseigné" : point.period ? "Oui" : "Non"}
                  variant={point.period ? "period" : undefined}
                  pressed={point.period === true}
                  onToggle={() => toggleLog({ period: point.period !== true })}
                />
              )}

              <WeightEditor key={point.date} point={point} onChanged={onChanged} onDeleted={close} />

              {/* La croix est en haut de la fiche, hors de portée du pouce sur un
                  grand iPhone : ce second bouton ferme depuis la zone basse. */}
              <button onClick={close} className="day-detail-close-button">
                Fermer
              </button>
            </Card>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}

/**
 * Correction et suppression de la pesée du jour affiché.
 *
 * Placé ici plutôt que dans une page dédiée : la fiche s'ouvre déjà d'un
 * tap sur le point du graphique, c'est-à-dire exactement au moment où on
 * repère une valeur aberrante à corriger. La suppression ferme la fiche,
 * puisque le jour qu'elle décrivait n'a plus de pesée.
 */
function WeightEditor({
  point,
  onChanged,
  onDeleted,
}: {
  point: WeightSeriesPoint;
  onChanged: () => Promise<unknown> | void;
  onDeleted: () => void;
}) {
  const [value, setValue] = useState(point.isReal && point.weightKg !== null ? formatKgValue(point.weightKg) : "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    const parsed = parseFloat(value.replace(",", "."));
    if (value.trim() === "" || isNaN(parsed) || parsed <= 0 || parsed >= 400) {
      setError("Poids invalide");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await addWeightEntry(point.date, Math.round(parsed * 10) / 10);
      setSaved(true);
      await onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (point.weightKg === null) return;

    const confirmed = window.confirm(
      `Supprimer la pesée du ${formatFullDate(point.date)} (${formatKg(point.weightKg)}) ?`
    );
    if (!confirmed) return;

    setBusy(true);
    try {
      await deleteWeightEntry(point.date);
      await onChanged();
      onDeleted();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="day-detail-editor">
      <div className="day-detail-editor-row">
        <div className="day-detail-editor-input-wrap">
          <input
            type="text"
            inputMode="decimal"
            aria-label={`Poids du ${formatFullDate(point.date)}`}
            placeholder="Poids"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
              setSaved(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className={`day-detail-editor-input ${error ? "day-detail-editor-input--error" : ""}`}
          />
          <span className="day-detail-editor-suffix">kg</span>
        </div>
        <button onClick={handleSave} disabled={busy} className="day-detail-editor-save">
          Enregistrer
        </button>
      </div>

      {saved && <p className="form-feedback">✓ Enregistré</p>}
      {error && <p className="form-error">{error}</p>}

      {point.isReal && (
        <button onClick={handleDelete} disabled={busy} className="day-detail-editor-delete">
          Supprimer la pesée
        </button>
      )}
    </div>
  );
}

/**
 * Une ligne « libellé — valeur » de la fiche. Quand `onToggle` est fourni, la
 * valeur devient un bouton : on bascule la puce du journal en tapant dessus,
 * là où on la lit, plutôt que d'ajouter une seconde rangée de contrôles qui
 * répéterait la même information.
 */
function DetailRow({
  label,
  value,
  variant,
  pressed,
  onToggle,
}: {
  label: string;
  value: string;
  variant?: "success" | "alert" | "period";
  pressed?: boolean;
  onToggle?: () => void;
}) {
  const valueClasses = `detail-row-value ${variant ? `text-${variant}` : ""}`;
  return (
    <div className="detail-row">
      <span className="detail-row-label">{label}</span>
      {onToggle ? (
        <button
          onClick={onToggle}
          aria-pressed={pressed}
          aria-label={`${label} : ${value}, appuyer pour changer`}
          className={`${valueClasses} detail-row-toggle`}
        >
          {value}
        </button>
      ) : (
        <span className={valueClasses}>{value}</span>
      )}
    </div>
  );
}

/**
 * Libellé d'une puce du journal. Un jour PASSÉ sans journal est lu comme un
 * « non » : ne pas avoir coché sport ni écart un jour révolu signifie qu'il
 * n'y en a pas eu, pas qu'on l'ignore. Aujourd'hui et les jours à venir
 * gardent « Non renseigné » : la journée n'est pas finie, rien n'est encore
 * décidé.
 *
 * `backfillPastDailyLogs` matérialise désormais ces `false` en base, donc ce
 * repli ne sert plus qu'aux jours qu'il ne couvre pas : ceux antérieurs au
 * début du suivi, et l'instant entre l'ouverture de l'écran et la fin du
 * remplissage. Il reste le garde-fou de la règle côté affichage.
 */
function logLabel(value: boolean | null, date: string): string {
  if (value !== null) return value ? "Oui" : "Non";
  return date < todayISO() ? "Non" : "Non renseigné";
}

function formatFullDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}
