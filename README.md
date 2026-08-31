# Winter Arc

Application personnelle de suivi quotidien, utilisée comme **PWA installée sur l'écran d'accueil iPhone**.

Deux fonctionnalités :

- **Régime** — pesées, objectif, trajectoire théorique, journal du jour (sport / écart alimentaire / cycle en option).
- **Apnée** — chronomètre d'apnée statique, statistiques et historique.

## Principes

- **Aucun backend.** Toutes les données restent sur l'appareil, dans IndexedDB (via Dexie).
  Elles ne sont ni synchronisées ni envoyées nulle part : la seule sauvegarde est l'export JSON manuel des réglages.
- **Zéro service payant.** Hébergement statique sur GitHub Pages.
- **Hors ligne d'abord.** Le service worker précharge l'application ; la mise à jour n'est jamais
  silencieuse, un bandeau propose de l'appliquer.

## Développement

```bash
npm install
npm run dev      # serveur de développement
npm run build    # vérification des types (tsc -b) + build de production
npm run preview  # sert le build de production en local
```

Le déploiement est automatique sur push vers `main` (voir `.github/workflows/deploy.yml`).

## Organisation du code

```
src/
  components/   Composants transverses (Card, PageLayout, BottomSheet, ErrorBoundary…)
  db/           Schéma Dexie et accès aux données, un fichier par table
  domain/       Règles métier pures, sans React ni accès base (trajectoire, séries, apnée)
  features/     Une fonctionnalité = un dossier (home, weight, apnea, settings)
  utils/        Helpers génériques (dates)
```

Conventions :

- Styles en fichiers `.css` colocalisés (pas de `style={{…}}`, sauf pour passer une valeur
  dynamique via une custom property CSS).
- Les utilitaires CSS partagés par plusieurs features vivent dans `src/index.css`.
- Commentaires en français, et réservés au **pourquoi** — pas à la paraphrase du code.
- Les dates sont des jours civils au format `YYYY-MM-DD`, manipulées via `src/utils/date.ts`
  (jamais `new Date(iso)` directement, qui interpréterait la chaîne en UTC).

## Points d'attention

- **Vite reste en version 6.** `npm create vite@latest` installe Vite 8 + Rolldown, dont le binaire
  natif ne s'installe pas correctement sous Windows.
- **`base`, `start_url` et `scope`** dans `vite.config.ts` doivent correspondre au nom du dépôt
  GitHub (`/Winter-Arc/`), sinon le déploiement GitHub Pages sert des chemins invalides.
- **IndexedDB n'indexe pas les booléens** : le champ `active` des objectifs est filtré côté JS.
- Ajouter un champ optionnel non indexé à une table ne nécessite pas de nouvelle version Dexie ;
  ajouter un **index** ou une table, si.
