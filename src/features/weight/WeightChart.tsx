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
}

export function WeightChart({ series, hasGoal }: WeightChartProps) {
  const hasAnyWeight = series.some((p) => p.weightKg !== null);

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
        Évolution — 1 mois
      </p>

      {!hasAnyWeight ? (
        <p style={{ margin: "var(--space-l) var(--space-m)", color: "var(--color-ink-muted)", fontSize: "14px" }}>
          Enregistre quelques pesées pour voir le graphique apparaître.
        </p>
      ) : (
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <ComposedChart data={series} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
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

function WeightDot(props: { cx?: number; cy?: number; payload?: WeightSeriesPoint; index?: number }) {
  const { cx, cy, payload, index } = props;
  if (cx == null || cy == null || !payload || payload.weightKg == null) return null;
  return payload.isReal ? (
    <circle key={index} cx={cx} cy={cy} r={4} fill="var(--color-coral)" stroke="white" strokeWidth={1.5} />
  ) : (
    <circle key={index} cx={cx} cy={cy} r={3} fill="var(--color-surface-raised)" stroke="var(--color-coral)" strokeWidth={1.5} />
  );
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
