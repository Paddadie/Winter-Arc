import type { WeightSeriesPoint } from "../../domain/weightSeries";
import "../../components/chartTooltip.css";
import "./weightChartCommon.css";

/**
 * Éléments de graphique partagés entre le graphique récent (WeightChart)
 * et la vue historique complète (WeightHistoryChart), pour éviter deux
 * implémentations divergentes du même rendu.
 */

/**
 * Le point de mesure, accompagné de deux petites pastilles (sport / écart)
 * juste en dessous, au même cx/cy que Recharts calcule déjà pour ce jour.
 * En les rattachant au même point plutôt qu'à un graphique séparé, elles
 * restent alignées par construction — aucun risque de décalage d'échelle
 * entre deux graphiques distincts.
 */
export function WeightDot(props: { cx?: number; cy?: number; payload?: WeightSeriesPoint; index?: number }) {
  const { cx, cy, payload, index } = props;
  if (cx == null || cy == null || !payload || payload.weightKg == null) return null;
  return (
    <g key={index}>
      {payload.isReal ? (
        <circle cx={cx} cy={cy} r={4} fill="var(--color-coral)" stroke="white" strokeWidth={1.5} />
      ) : (
        <circle cx={cx} cy={cy} r={3} fill="var(--color-surface-raised)" stroke="var(--color-coral)" strokeWidth={1.5} />
      )}
      <DayMarker cx={cx} cy={cy + 9} shown={payload.foodDeviation === true} color="var(--color-alert)" />
      <DayMarker cx={cx} cy={cy + 19} shown={payload.sport === true} color="var(--color-success)" />
    </g>
  );
}

/**
 * Une pastille sport/écart, empilée verticalement sous le point (écart en
 * haut, sport en bas) pour rester lisible sur un écran étroit. Rien n'est
 * dessiné si la valeur n'est pas "oui" — ni pour "non", ni pour "non
 * renseigné" — afin de garder le graphique épuré : seul un jour marquant
 * (sport fait / écart constaté) laisse une trace visuelle. Le détail
 * complet des trois états reste disponible dans la fiche du jour.
 */
function DayMarker({ cx, cy, shown, color }: { cx: number; cy: number; shown: boolean; color: string }) {
  if (!shown) return null;
  return <circle cx={cx} cy={cy} r={2.5} fill={color} />;
}

export function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: WeightSeriesPoint }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0 || !label) return null;
  const point: WeightSeriesPoint = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{formatTick(label)}</div>
      {point.weightKg !== null && (
        <div>
          {point.isReal ? "Mesuré : " : "Estimé : "}
          {point.weightKg.toFixed(1).replace(".", ",")} kg
        </div>
      )}
      {point.goalWeightKg !== null && (
        <div className="chart-tooltip-goal">Objectif : {point.goalWeightKg.toFixed(1).replace(".", ",")} kg</div>
      )}
    </div>
  );
}

export function Legend({ hasGoal }: { hasGoal: boolean }) {
  return (
    <div className="chart-legend">
      <LegendItem color="var(--color-coral)" label="Mesuré" filled />
      <LegendItem color="var(--color-coral)" label="Estimé" filled={false} />
      {hasGoal && <LegendItem color="var(--color-depth)" label="Objectif" dashed />}
      <LegendItem color="var(--color-success)" label="Sport" filled />
      <LegendItem color="var(--color-alert)" label="Écart" filled />
    </div>
  );
}

function LegendItem({
  color,
  label,
  filled,
  dashed,
}: {
  color: string;
  label: string;
  filled?: boolean;
  dashed?: boolean;
}) {
  return (
    <span className="chart-legend-item">
      {dashed ? (
        <svg width="14" height="8">
          <line x1="0" y1="4" x2="14" y2="4" stroke={color} strokeWidth="2" strokeDasharray="4 3" />
        </svg>
      ) : (
        <svg width="10" height="10">
          <circle
            cx="5"
            cy="5"
            r="4"
            fill={filled ? color : "var(--color-surface-raised)"}
            stroke={color}
            strokeWidth="1.5"
          />
        </svg>
      )}
      {label}
    </span>
  );
}

export function formatTick(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}