/** Petit libellé au-dessus d'une valeur en gras, utilisé dans les cartes de stats poids. */
export function StatBlock({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: "12px", color: "var(--color-ink-muted)", fontWeight: 600 }}>{label}</p>
      <p style={{ margin: "2px 0 0 0", fontSize: "16px", fontWeight: 700, color: color ?? "var(--color-ink)" }}>
        {value}
      </p>
    </div>
  );
}