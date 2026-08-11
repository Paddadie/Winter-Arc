import "./StatBlock.css";

interface StatBlockProps {
  label: string;
  value: string;
  variant?: "success" | "alert";
}

/** Petit libellé au-dessus d'une valeur en gras, utilisé dans les cartes de stats poids. */
export function StatBlock({ label, value, variant }: StatBlockProps) {
  return (
    <div>
      <p className="stat-block-label">{label}</p>
      <p className={`stat-block-value ${variant ? `stat-block-value--${variant}` : ""}`}>{value}</p>
    </div>
  );
}