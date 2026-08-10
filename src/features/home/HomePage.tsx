import { featureTiles } from "./features.config";
import { Tile } from "./Tile";

export function HomePage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        padding: "var(--space-l)",
        paddingTop: "calc(var(--space-xl) + env(safe-area-inset-top))",
        gap: "var(--space-xl)",
      }}
    >
      <div>
        <p
          style={{
            margin: 0,
            fontSize: "15px",
            color: "var(--color-ink-muted)",
            fontWeight: 500,
          }}
        >
          Suivi personnel
        </p>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "34px",
            fontWeight: 800,
            margin: "4px 0 0 0",
          }}
        >
          Tableau de bord
        </h1>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-m)" }}>
        {featureTiles.map((tile) => (
          <Tile key={tile.id} tile={tile} />
        ))}
      </div>
    </div>
  );
}
