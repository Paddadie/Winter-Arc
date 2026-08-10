import { useNavigate } from "react-router-dom";
import type { FeatureTile } from "./features.config";

export function Tile({ tile }: { tile: FeatureTile }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(tile.route)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-m)",
        width: "100%",
        textAlign: "left",
        border: "none",
        borderRadius: "var(--radius-l)",
        padding: "var(--space-l)",
        background: tile.colorSoft,
        minHeight: "88px",
        transition: "transform 0.15s ease",
      }}
      onTouchStart={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
      onTouchEnd={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <span
        style={{
          fontSize: "32px",
          width: "56px",
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "var(--radius-m)",
          background: tile.color,
          flexShrink: 0,
        }}
      >
        {tile.icon}
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--color-ink)",
          }}
        >
          {tile.label}
        </span>
        <span style={{ fontSize: "14px", color: "var(--color-ink-muted)" }}>
          {tile.description}
        </span>
      </span>
    </button>
  );
}
