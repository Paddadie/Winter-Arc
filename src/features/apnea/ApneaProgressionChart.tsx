import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card } from "../../components/Card";
import { CardLabel } from "../../components/CardLabel";
import { formatDuration } from "../../domain/apnea";
import type { ApneaDailyPoint } from "../../domain/apnea";
import "../../components/chartTooltip.css";
import "./ApneaProgressionChart.css";

interface ApneaProgressionChartProps {
  /** Un point par jour (meilleure mesure de ce jour), trié par date croissante. */
  points: ApneaDailyPoint[];
}

/**
 * Graphique de l'évolution des durées d'apnée dans le temps. Un jour = un
 * point (meilleure mesure de ce jour-là), pour rester lisible même les
 * jours à plusieurs mesures — le détail individuel reste dans le tableau.
 */
export function ApneaProgressionChart({ points }: ApneaProgressionChartProps) {
  return (
    <Card className="card--flat">
      <CardLabel className="card-label--chart">Progression</CardLabel>

      {points.length === 0 ? (
        <p className="empty-message empty-message--spacious">Aucune mesure sur cette période.</p>
      ) : (
        <div className="apnea-progression-canvas">
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
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{formatTick(point.date)}</div>
      <div>
        {formatDuration(point.durationSec)}
        {point.count > 1 ? ` (meilleure sur ${point.count} mesures)` : ""}
      </div>
    </div>
  );
}

function formatTick(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}