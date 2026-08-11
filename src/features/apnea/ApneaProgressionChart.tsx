import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card } from "../../components/Card";
import { CardLabel } from "../../components/CardLabel";
import { formatDuration } from "../../domain/apnea";
import type { ApneaDailyPoint } from "../../domain/apnea";

interface ApneaProgressionChartProps {
  /** Un point par jour (moyenne des mesures de ce jour), trié par date croissante. */
  points: ApneaDailyPoint[];
}

/**
 * Graphique de l'évolution des durées d'apnée dans le temps. Un jour = un
 * point (moyenne des mesures de ce jour-là), pour rester lisible même les
 * jours à plusieurs mesures — le détail individuel reste dans le tableau.
 */
export function ApneaProgressionChart({ points }: ApneaProgressionChartProps) {
  return (
    <Card style={{ padding: "var(--space-m) var(--space-s)" }}>
      <CardLabel style={{ margin: "0 var(--space-m) var(--space-s) var(--space-m)" }}>Progression</CardLabel>

      {points.length === 0 ? (
        <p style={{ margin: "var(--space-l) var(--space-m)", color: "var(--color-ink-muted)", fontSize: "14px" }}>
          Aucune mesure sur cette période.
        </p>
      ) : (
        <div style={{ width: "100%", height: 200 }}>
          <ResponsiveContainer>
            <ComposedChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatTick}
                interval={Math.max(0, Math.ceil(points.length / 6) - 1)}
                padding={{ left: 12, right: 12 }}
                tick={{ fontSize: 11, fill: "var(--color-ink-muted)" }}
                axisLine={{ stroke: "var(--color-border)" }}
                tickLine={false}
              />
              <YAxis
                dataKey="durationSec"
                tickFormatter={formatDuration}
                domain={["dataMin - 10", "dataMax + 10"]}
                tick={{ fontSize: 11, fill: "var(--color-ink-muted)" }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip content={<ProgressionTooltip />} />
              <Line
                type="monotone"
                dataKey="durationSec"
                stroke="var(--color-teal)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "var(--color-teal)" }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

function ProgressionTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ApneaDailyPoint }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
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
      <div style={{ fontWeight: 700, marginBottom: "2px" }}>{formatTick(point.date)}</div>
      <div>
        {formatDuration(point.durationSec)}
        {point.count > 1 ? ` (moyenne de ${point.count} mesures)` : ""}
      </div>
    </div>
  );
}

function formatTick(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}