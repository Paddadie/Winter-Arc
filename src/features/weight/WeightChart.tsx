import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Card } from "../../components/Card";
import { todayISO } from "../../utils/date";
import type { WeightSeriesPoint } from "../../domain/weightSeries";

interface WeightChartProps {
  series: WeightSeriesPoint[];
  hasGoal: boolean;
  onSelectDate: (date: string) => void;
}

export function WeightChart({ series, hasGoal, onSelectDate }: WeightChartProps) {
  const hasAnyWeight = series.some((p) => p.weightKg !== null);

  function handleChartClick(state: { activeLabel?: string | number } | null) {
    if (state?.activeLabel != null) onSelectDate(String(state.activeLabel));
  }

  return (
    <Card style={{ padding: "var(--space-m) var(--space-s) var(--space-m) var(--space-xs)" }}>
      <p
        style={{
          margin: "0 var(--space-m) var(--space-s) var(--space-m)",
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--color-ink-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.03em",
        }}
      >
        Évolution récente
      </p>

      {!hasAnyWeight ? (
        <p style={{ margin: "var(--space-l) var(--space-m)", color: "var(--color-ink-muted)", fontSize: "14px" }}>
          Enregistre quelques pesées pour voir le graphique apparaître.
        </p>
      ) : (
        <div style={{ width: "100%", height: 238 }}>
          <ResponsiveContainer>
            <ComposedChart
              data={series}
              margin={{ top: 8, right: 12, bottom: 22, left: -12 }}
              onClick={handleChartClick}
            >
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatTick}
                interval={4}
                tick={{ fontSize: 11, fill: "var(--color-ink-muted)" }}
                axisLine={{ stroke: "var(--color-border)" }}
                tickLine={false}
              />
              <YAxis
                domain={["dataMin - 1", "dataMax + 1"]}
                tick={{ fontSize: 11, fill: "var(--color-ink-muted)" }}
                axisLine={false}
                tickLine={false}
                width={34}
              />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine x={todayISO()} stroke="var(--color-ink-muted)" strokeDasharray="3 3" />

              {hasGoal && (
                <Line
                  type="monotone"
                  dataKey="goalWeightKg"
                  stroke="var(--color-depth)"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                  connectNulls
                />
              )}

              <Line
                type="monotone"
                dataKey="weightKg"
                stroke="var(--color-coral)"
                strokeWidth={2.5}
                dot={<WeightDot />}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      <Legend hasGoal={hasGoal} />
    </Card>
  );
}

/**
 * Le point de mesure, accompagné de deux petites pastilles (sport / écart)
 * juste en dessous, au même cx/cy que Recharts calcule déjà pour ce jour.
 * En les rattachant au même point plutôt qu'à un graphique séparé, elles
 * restent alignées par construction — aucun risque de décalage d'échelle
 * entre deux graphiques distincts.
 */
function WeightDot(props: { cx?: number; cy?: number; payload?: WeightSeriesPoint; index?: number }) {
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

function ChartTooltip({
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
    <div
      style={{
        background: "var(--color-depth)",
        color: "white",
        borderRadius: "10px",
        padding: "8px 12px",
        fontSize: "12px",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: "2px" }}>{formatTick(label)}</div>
      {point.weightKg !== null && (
        <div>
          {point.isReal ? "Mesuré : " : "Estimé : "}
          {point.weightKg.toFixed(1).replace(".", ",")} kg
        </div>
      )}
      {point.goalWeightKg !== null && (
        <div style={{ opacity: 0.8 }}>Objectif : {point.goalWeightKg.toFixed(1).replace(".", ",")} kg</div>
      )}
    </div>
  );
}

function Legend({ hasGoal }: { hasGoal: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "var(--space-m)",
        flexWrap: "wrap",
        marginTop: "var(--space-s)",
        marginLeft: "var(--space-m)",
        fontSize: "12px",
        color: "var(--color-ink-muted)",
      }}
    >
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
    <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
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

function formatTick(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}
