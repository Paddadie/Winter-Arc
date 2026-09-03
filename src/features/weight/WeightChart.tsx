import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/Card";
import { CardLabel } from "../../components/CardLabel";
import { todayISO, formatDayMonth } from "../../utils/date";
import { WeightDot, Legend, DayHighlights, TrendLine } from "./weightChartCommon";
import { isPeriodTrackingEnabled } from "./periodTrackingPref";
import type { WeightSeriesPoint } from "../../domain/weightSeries";
import "./WeightChart.css";

interface WeightChartProps {
  series: WeightSeriesPoint[];
  hasGoal: boolean;
  onSelectDate: (date: string) => void;
}

export function WeightChart({ series, hasGoal, onSelectDate }: WeightChartProps) {
  const navigate = useNavigate();
  const hasAnyWeight = series.some((p) => p.weightKg !== null);
  const hasTrend = series.some((p) => p.trendWeightKg !== null);
  // Échelle Y cadrée sur les poids RÉELLEMENT tracés dans la fenêtre (pesées
  // et jours interpolés), à bornes entières pour garder des graduations
  // lisibles sur un axe étroit — un dataMin/dataMax auto produit des
  // graduations à virgule. Ni l'objectif ni la tendance n'entrent dans le
  // calcul : tous deux peuvent s'éloigner beaucoup des pesées et écraseraient
  // la courbe de poids, qui est le sujet du graphique.
  //
  // Un kilo entier sous la pesée la plus basse. En haut, 0,5 kg de marge AVANT
  // l'arrondi : la pastille « écart » est dessinée 13 px au-dessus du point et
  // le rognage la couperait si le point le plus lourd frôlait le bord.
  const shownWeights = series.map((p) => p.weightKg).filter((weight): weight is number => weight !== null);
  const yDomain: [number | string, number | string] =
    shownWeights.length > 0
      ? [Math.floor(Math.min(...shownWeights)) - 1, Math.ceil(Math.max(...shownWeights) + 0.5)]
      : ["dataMin - 1", "dataMax + 1"];
  // `allowDataOverflow` : sans lui, Recharts ne pose aucun clip-path et une
  // valeur hors domaine — la tendance prolongée jusqu'au bord gauche,
  // notamment — se dessine PAR-DESSUS le titre et l'axe.

  return (
    <Card className="card--flat">
      <CardLabel className="card-label--chart">Évolution récente</CardLabel>

      {!hasAnyWeight ? (
        <p className="empty-message empty-message--spacious">Enregistre quelques pesées pour voir le graphique apparaître.</p>
      ) : (
        <div className="weight-chart-canvas">
          <ResponsiveContainer>
            <ComposedChart
              data={series}
              margin={{ top: 20, right: 16, bottom: 14, left: 0 }}
              barCategoryGap={0}
            >
              <DayHighlights series={series} showPeriod={isPeriodTrackingEnabled()} />
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDayMonth}
                interval={4}
                padding={{ left: 12, right: 12 }}
                tick={{ fontSize: 11, fill: "var(--color-ink-muted)" }}
                axisLine={{ stroke: "var(--color-border)" }}
                tickLine={false}
              />
              <YAxis
                domain={yDomain}
                allowDataOverflow
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--color-ink-muted)" }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
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

              {hasTrend && <TrendLine />}

              <Line
                type="monotone"
                dataKey="weightKg"
                stroke="var(--color-coral)"
                strokeWidth={2.5}
                dot={<WeightDot onSelect={onSelectDate} />}
                activeDot={false}
                isAnimationActive={false}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      <Legend hasGoal={hasGoal} hasTrend={hasTrend} showPeriod={isPeriodTrackingEnabled()} />

      <button onClick={() => navigate("/regime/historique")} className="weight-chart-history-link">
        Historique →
      </button>
    </Card>
  );
}