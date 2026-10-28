# CONTEXT.md — Winter Arc

> Document de reprise de contexte. Remplace intégralement la version précédente.
> ARCHIVE depuis le 15/10/2026 : l'essentiel vit dans `CLAUDE.md` et `.claude/rules/` ; ce fichier ne se lit que si la tâche touche le sujet. Généré le 2026-09-03, état du dépôt : commit `2a297c5`, aligné avec `origin/main`.
> Mis à jour le 2026-09-03 en fin de session : la tendance 14 jours et la suppression du tooltip (§7.2) sont faites,
> pas encore commitées.

---

## 1. L'application

Application **personnelle** de suivi quotidien, utilisée comme **PWA installée sur l'écran d'accueil iPhone**. Deux fonctionnalités :

- **Régime** — pesées, objectif, trajectoire théorique, journal du jour (sport / écart alimentaire / cycle en option).
- **Apnée** — chronomètre d'apnée statique, statistiques, historique.

Contraintes fondatrices :

- **Aucun backend.** Tout est en local (IndexedDB via Dexie). Seule sauvegarde : l'export JSON manuel des réglages.
- **100 % gratuit**, hébergement statique GitHub Pages (dépôt public `https://github.com/Paddadie/Winter-Arc`).
- Usage familial élargi : l'utilisateur + sa sœur (Régime + cycle), potentiellement d'autres membres. D'où le masquage de tuiles et le suivi de cycle opt-in.

Environnement : Windows 11, VS Code, Node v22, terminal Git Bash **et** PowerShell disponibles.

---

## 2. Stack

```json
"dependencies": { "dexie": "^4.4.4", "react": "^19.2.8", "react-dom": "^19.2.8",
                  "react-router-dom": "^7.18.2", "recharts": "^3.10.1" }
"devDependencies": { "@types/node": "^24.13.3", "@types/react": "^19.2.17",
                     "@types/react-dom": "^19.2.3", "@vitejs/plugin-react": "^4.3.4",
                     "typescript": "~5.7.2", "vite": "^6.0.7",
                     "vite-plugin-pwa": "^0.21.1", "vitest": "^3.2.7" }
```

**⚠️ Rester sur Vite 6.** `npm create vite@latest` installe Vite 8 + Rolldown, dont le binaire natif casse sous Windows.

Scripts : `dev`, `build` (= `tsc -b && vite build`), `preview`, `test` (= `vitest run`), `test:watch`.

**Pas d'ESLint dans ce projet.** Les seuls garde-fous automatiques sont `tsc -b` (avec `noUnusedLocals` / `noUnusedParameters` actifs) et Vitest.

---

## 3. Architecture

```
src/
  components/   Transverses : Card, CardLabel, PageLayout, BottomSheet,
                UpdatePrompt, ErrorBoundary, LoadStatusMessage, chartTooltip.css
  db/           Dexie + accès données, un fichier par table (+ backupRepo)
  domain/       Règles métier PURES : ni React, ni accès base, ni horloge système
                (weightTrajectory, weightSeries, weightTrend, apnea)
  features/     Une fonctionnalité = un dossier (home, weight, apnea, settings)
  utils/        date.ts, useRefreshOnForeground.ts
```

Dépendances : `features → domain → db → utils`. Jamais l'inverse.

Conventions :

- Styles en fichiers `.css` colocalisés. **Pas de `style={{}}`**, sauf pour passer une valeur dynamique via custom property CSS (exceptions assumées : `PageLayout.tsx`, `Tile.tsx`).
- Utilitaires CSS partagés par plusieurs features → `src/index.css`.
- **Commentaires en français, et réservés au POURQUOI.** Ne jamais paraphraser le code.
- Les dates sont des jours civils `YYYY-MM-DD`, manipulées via `src/utils/date.ts`. **Jamais `new Date(iso)`** (parsing UTC → décalage d'un jour) : utiliser `parseISODate`.

### Routage / PWA

- `HashRouter` obligatoire (PWA statique, pas de rewrite serveur sur GitHub Pages). Route `*` → redirection accueil.
- `vite.config.ts` : `base`, `start_url`, `scope` = `/Winter-Arc/`, à garder synchronisés avec le nom du dépôt.
- `registerType: 'prompt'` + `injectRegister: false` : bandeau custom `UpdatePrompt.tsx` via `useRegisterSW`. Types déclarés à la main dans `src/vite-env.d.ts`.

**Déplacé le 15/10/2026 dans `.claude/rules/donnees-dexie.md`** : Modèle de données Dexie, pattern tri-état et remplissage des jours passés (chargé quand on touche `src/db/`, `src/domain/`, `src/features/weight/`, `src/features/home/`).

---

## 4. État actuel

```
5f7c3be  Modification pastille du jour pesée                                  ← HEAD
815ff79  Ajustement échelle graphique
7524668  Modification courbe de tendance et suppression tooltip graphique de poids
2a297c5  CI : actions GitHub sur Node 24 et exécution des tests avant build
ab8650b  Audit complet : corrections, tests unitaires, mode sombre et accessibilité
```

Les trois commits du haut portent tout le travail décrit en §7.2. **Non poussés au moment de la rédaction** — vérifier `git status -sb` avant d'agir.

Seul fichier non suivi : ce `CONTEXT.md`.

`npm run build` ✅ · `npm test` ✅ **104 tests** (9 fichiers).

### Couverture de tests

`utils/date` (28) · `domain/weightSeries` (16) · `domain/apnea` (14) · `domain/weightTrend` (11) · `domain/weightTrajectory` (10) · `db/backupRepo` (10) · `features/weight/weightFormat` (6) · `features/home/featureReminder` (5) · `utils/useHorizontalSwipe` (4).

Tout est **pur** : `environment: 'node'`, pas de DOM, pas d'IndexedDB. Dexie s'importe sans problème en Node tant qu'on n'ouvre pas la base.

---

## 5. Ce qui a été fait dans la session précédente

### Bugs corrigés (commit `ab8650b`)

1. `computeWindowStats` : `averageDuration` était déclarée **à l'intérieur** de la fonction, après son `return` (accolade mal placée). Ne marchait que par hoisting.
2. `WeightPage` : la fenêtre du graphique était une **constante de module**, figée au chargement du JS. Sur une PWA qui reste des jours en mémoire, le graphique restait bloqué sur le jour d'ouverture.
3. Export JSON : `URL.revokeObjectURL()` appelé immédiatement après `link.click()` → **Safari iOS annulait le téléchargement**. Révocation différée.
4. `new Date("YYYY-MM-DD")` parsait en UTC à 4 endroits → `parseISODate`.
5. `GoalForm` : le sélecteur proposait une date que la validation refusait.
6. `isValidBackupData` ne vérifiait que « 4 tableaux » alors que l'import **efface définitivement** les données. Validation descendue au niveau des champs + refus d'un export de version supérieure.
7. `formatDurationLabel` : le reliquat de jours pouvait rester négatif (un seul emprunt ne suffit pas du 31/01 au 01/03). Borné à 0 — sortie affichée inchangée.

### Ajouts

- **Vitest** + 89 tests.
- **Courbe de tendance** (`domain/weightTrend.ts`) : régression linéaire par moindres carrés sur les pesées **réelles**. Trait plein fin (1 px, opacité 0,45) — surtout pas des pointillés serrés, qui se lisent comme un semis de points.
- **Mode sombre** avec réglage dédié (voir §6).
- **Rappels d'inactivité** sur les tuiles d'accueil (voir §6), en remplacement de la carte « Aujourd'hui » supprimée.
- `useRefreshOnForeground` : rafraîchissement au retour au premier plan sur les 5 écrans, + recalage de la date de saisie après minuit.
- Édition / suppression d'une pesée depuis la fiche du jour.
- `ErrorBoundary` + gestion des échecs de lecture IndexedDB (`LoadStatusMessage`).

### Interface

- La fiche du jour ne s'ouvre plus qu'au **tap sur le point de la journée** (zone tactile invisible de 14 px). Avant, tout le graphique était cliquable et s'ouvrait au moindre effleurement.
- Pastilles sport/écart : écart 9 → 13 px **et cerne couleur fond**, pour qu'elles ne se confondent plus avec la courbe sur forte variation.
- Bouton « Fermer » en bas de la fiche (la croix est en haut, hors de portée du pouce).
- Structure sémantique : `CardLabel` → `<h2>`, `Card` → `<section>`, landmarks, `aria-pressed`, `role="dialog"`, zones tactiles élargies.
- `maximum-scale=1.0, user-scalable=no` retiré de `index.html` (WCAG 1.4.4) ; le zoom auto d'iOS est évité en gardant **tous les champs de saisie ≥ 16 px**.

### Factorisation

- `weightFormat.ts` : `.toFixed(1).replace(".", ",")` apparaissait 7 fois dans 5 fichiers.
- `formatDayMonth`, `parseISODate` remontés dans `utils/date.ts`.
- `buildWeightSeries` : O(jours × pesées) → O(jours), par curseur unique. **Vérifié par test différentiel sur 3000 scénarios aléatoires, 0 divergence.**
- Chrono d'apnée isolé dans `TimerDisplay` : la page entière se redessinait 33 fois par seconde pendant l'apnée.

### CI (commit `2a297c5`)

Actions montées en Node 24 : `checkout@v5`, `setup-node@v5`, `upload-pages-artifact@v5`, `deploy-pages@v5`. **`upload-artifact@v4` apparaissait dans l'avertissement sans être référencé** : c'est une dépendance interne de `upload-pages-artifact@v3`. Ajout de `npm test` avant le build.

---

## 6. Décisions techniques à ne pas re-découvrir

**Déplacé le 15/10/2026 dans `.claude/rules/recharts.md`** : les 9 décisions Recharts.

**Déplacé le 15/10/2026 dans `.claude/rules/theme-et-accueil.md`** : Mode sombre, Rappels des tuiles d'accueil.

**Déplacé le 15/10/2026 dans `.claude/rules/apnee-signes.md`** : Signes des stats d'apnée.

**Autres décisions** (lignes 208-212 d'origine) : recopiées dans `CLAUDE.md`, section « Décisions confirmées par Paul ».

---

## 7. Travaux annulés — 7.1 reste à refaire, 7.2 est repris

### 7.1 Suivi du cycle (SUPPRIMÉ, à refaire)

Une fonctionnalité complète de statistiques de cycle avait été développée puis **entièrement supprimée à la demande de l'utilisateur** pour repartir d'une base saine. Elle n'existe dans aucun commit. Ce qui avait été validé et reste à refaire :

- `domain/cycle.ts` : `groupPeriodEpisodes(logs)` avec **tolérance d'un jour** (un écart de 2 jours entre deux dates cochées = un seul jour oublié → même épisode ; l'utilisateur peut remplir le passé après coup). `computeCycleStats(episodes, todayIso)` → durée moyenne des règles, longueur moyenne du cycle, nombre de cycles complets, prévision.
- **Minimum 3 cycles complets** avant d'afficher une prévision : sur ce sujet, une prévision fausse est plus gênante qu'une absence de prévision.
- Un épisode **encore en cours** est exclu de la moyenne de durée (tronqué, il la tirerait vers le bas).
- **Prévision (début + durée) dans la carte de résumé en haut de la page Régime** — demande explicite de l'utilisateur.
- Carte « Cycle » séparée pour les moyennes, avec affichage progressif : durée dès le 1er épisode terminé, longueur dès le 2e.
- Bande **plus pâle** sur le graphique pour le cycle prévu, qui ne recouvre jamais un jour réellement saisi.
- Nécessite `getAllDailyLogs()` dans `dailyLogRepo` : les stats ont besoin de plusieurs mois, pas de la fenêtre de 21 jours.

13 tests avaient été écrits et passaient.

### 7.2 Tendance 14 jours + suppression du tooltip (FAIT)

**Déplacé le 15/10/2026 dans `.claude/rules/tendance-poids.md`** (version vivante : la règle).

---

## 8. Règles de travail de l'utilisateur (STRICTES)

**Déplacé le 15/10/2026 dans `CLAUDE.md`** (règles 1 à 7, version vivante : CLAUDE.md). Piège d'outillage (heredocs Bash) : aussi dans CLAUDE.md, section Stack.

---

## 9. Commandes

```bash
npm run build      # tsc -b + vite build
npm test           # vitest run
git status -sb
git --no-pager log --oneline -10
```

---

## 10. Points ouverts

1. **Reprendre le suivi du cycle** (§7.1) — entièrement à réécrire, spécification validée disponible ci-dessus.
2. **Tendance 14 jours + suppression du tooltip** (§7.2) — **codée, testée, non commitée**. En attente de validation visuelle sur iPhone : allure de la droite sur « Évolution récente » et sur l'historique, et absence de tout pop-up au toucher du graphique.
3. **Vérifier le run CI** du commit `2a297c5` : premier passage de `upload-pages-artifact@v5` / `deploy-pages@v5` et premier `npm test` en intégration. Non confirmé au moment de la rédaction.
4. **Tests visuels en attente** côté utilisateur sur le commit `ab8650b` : mode sombre sur iPhone, ouverture de la fiche du jour au tap, lisibilité des pastilles, badges des tuiles, zoom pincé.
5. Ce `CONTEXT.md` est non suivi par git ; l'utilisateur le supprimera lui-même quand le sujet sera clos.
