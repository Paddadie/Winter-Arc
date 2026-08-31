import { Bar, Cell, Line, YAxis } from "recharts";
import { formatDayMonth, isWeekend } from "../../utils/date";
import { formatKg } from "./weightFormat";
import type { WeightSeriesPoint } from "../../domain/weightSeries";
import "../../components/chartTooltip.css";
import "./weightChartCommon.css";

/**
 * Éléments de graphique partagés entre le graphique récent (WeightChart)
 * et la vue historique complète (WeightHistoryChart), pour éviter deux
 * implémentations divergentes du même rendu.
 */

/**
 * Droite de tendance : trait PLEIN, fin et translucide, jamais en pointillés.
 * Des tirets courts se lisent comme un semis de points sur une fenêtre de
 * trois semaines, et deux lignes en tirets (avec l'objectif) deviennent
 * difficiles à distinguer l'une de l'autre. La transparence la fait passer
 * derrière la courbe de poids sans la faire disparaître.
 */
export function TrendLine() {
  return (
    <Line
      type="linear"
      dataKey="trendWeightKg"
      stroke="var(--color-ink-muted)"
      strokeWidth={1}
      strokeOpacity={0.45}
      dot={false}
      activeDot={false}
      isAnimationActive={false}
      connectNulls
    />
  );
}

/** Rayon de la zone tactile invisible autour d'un point, pour viser au doigt. */
const DOT_TOUCH_RADIUS = 14;

/**
 * Le point de mesure, accompagné de deux petites pastilles (sport / écart)
 * juste en dessous, au même cx/cy que Recharts calcule déjà pour ce jour.
 * En les rattachant au même point plutôt qu'à un graphique séparé, elles
 * restent alignées par construction — aucun risque de décalage d'échelle
 * entre deux graphiques distincts.
 *
 * C'est aussi LE point d'ouverture de la fiche du jour. Le graphique entier
 * était cliquable auparavant : au doigt, le moindre effleurement ou un début
 * de défilement ouvrait la fiche par accident. Ne réagir qu'au point du jour
 * rend l'ouverture volontaire.
 */
export function WeightDot(props: {
  cx?: number;
  cy?: number;
  payload?: WeightSeriesPoint;
  index?: number;
  onSelect?: (date: string) => void;
}) {
  const { cx, cy, payload, index, onSelect } = props;
  if (cx == null || cy == null || !payload || payload.weightKg == null) return null;

  return (
    <g key={index}>
      {payload.isReal ? (
        <circle cx={cx} cy={cy} r={4} fill="var(--color-coral)" stroke="var(--color-surface-raised)" strokeWidth={1.5} />
      ) : (
        <circle cx={cx} cy={cy} r={3} fill="var(--color-surface-raised)" stroke="var(--color-coral)" strokeWidth={1.5} />
      )}
      <DayMarker cx={cx} cy={cy - MARKER_OFFSET} shown={payload.foodDeviation === true} color="var(--color-alert)" />
      <DayMarker cx={cx} cy={cy + MARKER_OFFSET} shown={payload.sport === true} color="var(--color-success)" />
      {onSelect && (
        <circle
          cx={cx}
          cy={cy}
          r={DOT_TOUCH_RADIUS}
          fill="transparent"
          role="button"
          aria-label={`Détail du ${payload.date}`}
          className="weight-dot-hit-area"
          onClick={() => onSelect(payload.date)}
        />
      )}
    </g>
  );
}

/** Écart vertical entre le point de mesure et ses pastilles sport/écart. */
const MARKER_OFFSET = 13;

/**
 * Une pastille sport/écart, positionnée verticalement par rapport au point
 * (écart au-dessus de la courbe, sport en dessous) pour rester lisible sur
 * un écran étroit. Rien n'est dessiné si la valeur n'est pas "oui" — ni
 * pour "non", ni pour "non renseigné" — afin de garder le graphique épuré :
 * seul un jour marquant (sport fait / écart constaté) laisse une trace
 * visuelle. Le détail complet des trois états reste disponible dans la
 * fiche du jour.
 *
 * Le cerne couleur fond détache la pastille de la courbe : sur une forte
 * variation de poids d'un jour à l'autre, le trait passe juste à côté et
 * sans ce cerne les deux se confondent.
 */
function DayMarker({ cx, cy, shown, color }: { cx: number; cy: number; shown: boolean; color: string }) {
  if (!shown) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={3}
      fill={color}
      stroke="var(--color-surface-raised)"
      strokeWidth={1.5}
    />
  );
}

/**
 * Fond coloré derrière certains jours (week-ends en bleu clair, jours de
 * cycle en rose si activé) pour les repérer d'un coup d'œil sur le
 * graphique. Techniquement une barre pleine hauteur par jour (sur un axe Y
 * caché dédié, indépendant de l'échelle des poids), rendue transparente les
 * jours sans marquage — un <Bar> Recharts est, contrairement à
 * <ReferenceArea>, automatiquement centré et dimensionné sur son propre
 * jour, même isolé (une seule <ReferenceArea> entre deux dates identiques
 * a une largeur nulle et ne s'affichait pas ; une plage de plusieurs jours
 * plaçait aussi les points sur le bord de la zone plutôt qu'au centre).
 * Recharts dessine toujours CartesianGrid en arrière-plan et les <Bar> par
 * dessus, quel que soit leur ordre dans le JSX : `fillOpacity` laisse donc
 * volontairement transparaître les lignes de la grille (poids entiers,
 * ex: 83, 85 kg) à travers la couleur plutôt que de les recouvrir.
 */
export function DayHighlights({ series, showPeriod }: { series: WeightSeriesPoint[]; showPeriod: boolean }) {
  return (
    <>
      <YAxis yAxisId="highlight" domain={[0, 1]} hide />
      <Bar yAxisId="highlight" dataKey={() => 1} stroke="none" fillOpacity={0.6} isAnimationActive={false}>
        {series.map((point) => (
          <Cell key={point.date} fill={dayHighlightColor(point, showPeriod)} />
        ))}
      </Bar>
    </>
  );
}

function dayHighlightColor(point: WeightSeriesPoint, showPeriod: boolean): string {
  const isPeriodDay = showPeriod && point.period === true;
  const isWeekendDay = isWeekend(point.date);
  if (isPeriodDay && isWeekendDay) return "var(--color-period-weekend)";
  if (isPeriodDay) return "var(--color-period-soft)";
  if (isWeekendDay) return "var(--color-teal-soft)";
  return "transparent";
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
      <div className="chart-tooltip-title">{formatDayMonth(label)}</div>
      {point.weightKg !== null && (
        <div>
          {point.isReal ? "Mesuré : " : "Estimé : "}
          {formatKg(point.weightKg)}
        </div>
      )}
      {point.goalWeightKg !== null && (
        <div className="chart-tooltip-goal">Objectif : {formatKg(point.goalWeightKg)}</div>
      )}
      {point.trendWeightKg !== null && (
        <div className="chart-tooltip-trend">Tendance : {formatKg(point.trendWeightKg)}</div>
      )}
    </div>
  );
}

export function Legend({
  hasGoal,
  hasTrend,
  showPeriod,
}: {
  hasGoal: boolean;
  hasTrend?: boolean;
  showPeriod?: boolean;
}) {
  return (
    <div className="chart-legend">
      <LegendItem color="var(--color-coral)" label="Mesuré" filled />
      <LegendItem color="var(--color-coral)" label="Estimé" filled={false} />
      {hasGoal && <LegendItem color="var(--color-depth)" label="Objectif" dashed />}
      {hasTrend && <LegendItem color="var(--color-ink-muted)" label="Tendance" solidLine />}
      <LegendItem color="var(--color-success)" label="Sport" filled />
      <LegendItem color="var(--color-alert)" label="Écart" filled />
      {showPeriod && <LegendItem color="var(--color-period)" label="Cycle" area />}
    </div>
  );
}

function LegendItem({
  color,
  label,
  filled,
  dashed,
  solidLine,
  area,
}: {
  color: string;
  label: string;
  filled?: boolean;
  dashed?: boolean;
  solidLine?: boolean;
  area?: boolean;
}) {
  return (
    <span className="chart-legend-item">
      {dashed ? (
        <svg width="14" height="8">
          <line x1="0" y1="4" x2="14" y2="4" stroke={color} strokeWidth="2" strokeDasharray="4 3" />
        </svg>
      ) : solidLine ? (
        <svg width="14" height="8">
          <line x1="0" y1="4" x2="14" y2="4" stroke={color} strokeWidth="1.5" />
        </svg>
      ) : area ? (
        <svg width="10" height="10">
          <rect x="0" y="0" width="10" height="10" rx="2" fill={color} fillOpacity="0.7" />
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
