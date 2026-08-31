export type LoadStatus = "loading" | "ready" | "error";

/**
 * État de chargement des pages qui lisent la base locale.
 *
 * L'état d'erreur existe parce qu'une lecture IndexedDB peut échouer sur
 * iOS (stockage refusé en navigation privée, données purgées par le système
 * faute de place) : sans lui, la page resterait indéfiniment sur
 * "Chargement…" sans que l'utilisateur comprenne ce qui se passe.
 */
export function LoadStatusMessage({ status }: { status: Exclude<LoadStatus, "ready"> }) {
  if (status === "loading") {
    return <p className="text-muted">Chargement…</p>;
  }

  return (
    <p className="form-error">
      Impossible de lire les données de l'appareil. Ferme puis rouvre l'application ; si le problème persiste,
      vérifie que le stockage du navigateur est autorisé.
    </p>
  );
}
