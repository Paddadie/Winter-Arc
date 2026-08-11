import { useRef, useState } from "react";
import { PageLayout } from "../../components/PageLayout";
import { Card } from "../../components/Card";
import { CardLabel } from "../../components/CardLabel";
import { exportAllData, importAllData, isValidBackupData, type BackupData } from "../../db/backupRepo";
import { todayISO } from "../../utils/date";

export function SettingsPage() {
  const [exportFeedback, setExportFeedback] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  async function handleExport() {
    const data = await exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = downloadLinkRef.current;
    if (link) {
      link.href = url;
      link.download = `winter-arc-export-${todayISO()}.json`;
      link.click();
    }
    URL.revokeObjectURL(url);
    setExportFeedback(true);
    setTimeout(() => setExportFeedback(false), 2000);
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
      setImportError("L'import a échoué, aucune donnée n'a été modifiée.");
      setImporting(false);
    }
  }

  return (
    <PageLayout title="Réglages" accentColor="var(--color-ink)">
      <Card>
        <CardLabel>Sauvegarde</CardLabel>
        <p style={{ margin: "0 0 var(--space-m) 0", fontSize: "14px", color: "var(--color-ink-muted)" }}>
          Aucune synchronisation automatique — exporte régulièrement tes données dans un fichier, à conserver où tu
          veux (mail, cloud personnel...).
        </p>

        <button
          onClick={handleExport}
          style={{
            width: "100%",
            border: "none",
            borderRadius: "var(--radius-m)",
            padding: "14px",
            background: "var(--color-ink)",
            color: "white",
            fontSize: "16px",
            fontWeight: 700,
          }}
        >
          Exporter mes données (JSON)
        </button>
        {exportFeedback && (
          <p style={{ margin: "8px 0 0 0", fontSize: "13px", color: "var(--color-success)", fontWeight: 600 }}>
            ✓ Fichier téléchargé
          </p>
        )}
        <a ref={downloadLinkRef} style={{ display: "none" }} />
      </Card>

      <Card>
        <CardLabel>Restauration</CardLabel>
        <p style={{ margin: "0 0 var(--space-m) 0", fontSize: "14px", color: "var(--color-ink-muted)" }}>
          Importer un fichier remplace entièrement les données actuelles de l'appareil par celles du fichier.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleFileSelected}
          style={{ display: "none" }}
        />
        <button
          onClick={handleImportClick}
          disabled={importing}
          style={{
            width: "100%",
            border: "1.5px solid var(--color-ink)",
            borderRadius: "var(--radius-m)",
            padding: "14px",
            background: "transparent",
            color: "var(--color-ink)",
            fontSize: "16px",
            fontWeight: 700,
            opacity: importing ? 0.5 : 1,
          }}
        >
          {importing ? "Import en cours…" : "Importer un fichier JSON"}
        </button>
        {importError && (
          <p style={{ margin: "8px 0 0 0", fontSize: "13px", color: "var(--color-alert)" }}>{importError}</p>
        )}
      </Card>
    </PageLayout>
  );
}