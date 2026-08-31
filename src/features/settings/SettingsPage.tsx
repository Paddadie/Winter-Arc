import { useRef, useState } from "react";
import { PageLayout } from "../../components/PageLayout";
import { Card } from "../../components/Card";
import { CardLabel } from "../../components/CardLabel";
import { exportAllData, importAllData, isValidBackupData, type BackupData } from "../../db/backupRepo";
import { todayISO } from "../../utils/date";
import { featureTiles, type FeatureId } from "../home/features.config";
import { getHiddenTileIds, setTileHidden } from "../home/tileVisibility";
import { isPeriodTrackingEnabled, setPeriodTrackingEnabled } from "../weight/periodTrackingPref";
import { isDarkModeEnabled, setDarkModeEnabled } from "./themePref";
import "./SettingsPage.css";

/** Durée d'affichage des messages "✓ ..." après une action réussie. */
const FEEDBACK_MS = 2000;
/** Délai avant libération de l'URL de blob d'export (voir handleExport). */
const REVOKE_DELAY_MS = 60_000;

export function SettingsPage() {
  const [exportFeedback, setExportFeedback] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [hiddenTileIds, setHiddenTileIds] = useState(() => getHiddenTileIds());
  const [periodTrackingEnabled, setPeriodTrackingEnabledState] = useState(() => isPeriodTrackingEnabled());
  const [darkMode, setDarkMode] = useState(() => isDarkModeEnabled());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  function handleToggleTile(id: FeatureId) {
    setTileHidden(id, !hiddenTileIds.has(id));
    setHiddenTileIds(getHiddenTileIds());
  }

  function handleTogglePeriodTracking() {
    const next = !periodTrackingEnabled;
    setPeriodTrackingEnabled(next);
    setPeriodTrackingEnabledState(next);
  }

  function handleToggleDarkMode() {
    const next = !darkMode;
    setDarkModeEnabled(next);
    setDarkMode(next);
  }

  async function handleExport() {
    const link = downloadLinkRef.current;
    if (!link) return;

    const data = await exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `winter-arc-export-${todayISO()}.json`;
    link.click();

    // Révoquer l'URL immédiatement après le clic annule le téléchargement sur
    // Safari iOS, qui ne lit le blob qu'au tick suivant. On libère la mémoire
    // un peu plus tard, une fois le téléchargement effectivement démarré.
    setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);

    setExportFeedback(true);
    setTimeout(() => setExportFeedback(false), FEEDBACK_MS);
  }

  function handleImportClick() {
    setImportError(null);
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permet de réimporter le même fichier deux fois de suite si besoin
    if (!file) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      setImportError("Ce fichier n'est pas un JSON valide.");
      return;
    }

    if (!isValidBackupData(parsed)) {
      setImportError("Ce fichier ne correspond pas à un export de l'application.");
      return;
    }

    const data: BackupData = parsed;
    const confirmed = window.confirm(
      `Ce fichier contient ${data.weightEntries.length} pesée(s), ${data.weightGoals.length} objectif(s), ` +
        `${data.dailyLogs.length} entrée(s) de journal et ${data.apneaSessions.length} mesure(s) d'apnée.\n\n` +
        `Toutes les données actuelles de l'appareil seront remplacées et définitivement perdues. Continuer ?`
    );
    if (!confirmed) return;

    setImportError(null);
    setImporting(true);
    try {
      await importAllData(data);
      window.location.reload();
    } catch {
      setImportError("L'import a échoué. Les données de l'appareil n'ont pas été modifiées.");
      setImporting(false);
    }
  }

  return (
    <PageLayout title="Réglages" accentColor="var(--color-ink)">
      <Card>
        <CardLabel>Tuiles de l'accueil</CardLabel>
        <p className="settings-description">
          Activer/Désactiver les tuiles à utiliser depuis l'écran d'accueil
        </p>
        <div className="settings-tile-list">
          {featureTiles.map((tile) => (
            <label key={tile.id} className="settings-tile-row">
              <input
                type="checkbox"
                checked={!hiddenTileIds.has(tile.id)}
                onChange={() => handleToggleTile(tile.id)}
                className="settings-tile-checkbox"
              />
              <span className="settings-tile-icon">{tile.icon}</span>
              <span>{tile.label}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <CardLabel>Apparence</CardLabel>
        <p className="settings-description">
          Par défaut, l'application suit l'apparence de l'appareil. Ce réglage la force dans un sens ou dans l'autre.
        </p>
        <label className="settings-tile-row">
          <input
            type="checkbox"
            checked={darkMode}
            onChange={handleToggleDarkMode}
            className="settings-tile-checkbox"
          />
          <span className="settings-tile-icon" aria-hidden="true">
            🌙
          </span>
          <span>Mode sombre</span>
        </label>
      </Card>

      <Card>
        <CardLabel>Suivi du cycle</CardLabel>
        <p className="settings-description">
          Ajoute un bouton "🌸 Cycle" dans le suivi du jour de Régime, et repère ces jours sur le graphique de poids.
        </p>
        <label className="settings-tile-row">
          <input
            type="checkbox"
            checked={periodTrackingEnabled}
            onChange={handleTogglePeriodTracking}
            className="settings-tile-checkbox"
          />
          <span className="settings-tile-icon">🌸</span>
          <span>Activer le suivi du cycle</span>
        </label>
      </Card>

      <Card>
        <CardLabel>Sauvegarde</CardLabel>
        <p className="settings-description">
          Aucune synchronisation automatique — exporte régulièrement tes données dans un fichier, à conserver où tu
          veux (mail, cloud personnel...).
        </p>

        <button onClick={handleExport} className="settings-button settings-button--filled">
          Exporter mes données (JSON)
        </button>
        {exportFeedback && <p className="form-feedback">✓ Fichier téléchargé</p>}
        <a ref={downloadLinkRef} aria-hidden="true" tabIndex={-1} className="settings-hidden" />
      </Card>

      <Card>
        <CardLabel>Restauration</CardLabel>
        <p className="settings-description">
          Importer un fichier remplace entièrement les données actuelles de l'appareil par celles du fichier.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleFileSelected}
          aria-hidden="true"
          tabIndex={-1}
          className="settings-hidden"
        />
        <button
          onClick={handleImportClick}
          disabled={importing}
          className="settings-button settings-button--outline"
        >
          {importing ? "Import en cours…" : "Importer un fichier JSON"}
        </button>
        {importError && <p className="form-error">{importError}</p>}
      </Card>
    </PageLayout>
  );
}