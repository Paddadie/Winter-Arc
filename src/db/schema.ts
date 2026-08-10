import Dexie, { type EntityTable } from "dexie";

/**
 * Un poids enregistré à une date donnée.
 * `date` au format ISO "YYYY-MM-DD" (pas d'heure : un seul poids/jour a du sens ici).
 */
export interface WeightEntry {
  id?: number;
  date: string;
  weightKg: number;
}

/**
 * Informations quotidiennes simples : sport fait ou non, écart alimentaire ou non.
 * Une seule entrée par jour (upsert sur `date`).
 */
export interface DailyLog {
  id?: number;
  date: string;
  sport: boolean;
  foodDeviation: boolean;
}

/**
 * Une performance d'apnée. Plusieurs sessions possibles le même jour,
 * donc pas de contrainte d'unicité sur `date` ici (contrairement à DailyLog).
 * `time` est l'heure de la mesure (ISO "HH:MM"), optionnelle si jamais on
 * importe des données sans heure précise.
 */
export interface ApneaSession {
  id?: number;
  date: string;
  time?: string;
  durationSec: number;
}

/**
 * Objectif de poids. On ne garde qu'un seul objectif "actif" à la fois :
 * modifier l'objectif désactive l'ancien plutôt que de le supprimer,
 * pour ne jamais perdre d'historique si besoin de revenir en arrière.
 */
export interface WeightGoal {
  id?: number;
  startWeightKg: number;
  startDate: string;
  targetWeightKg: number;
  targetDate: string;
  active: boolean;
  createdAt: string;
}

class AppDatabase extends Dexie {
  weightEntries!: EntityTable<WeightEntry, "id">;
  dailyLogs!: EntityTable<DailyLog, "id">;
  apneaSessions!: EntityTable<ApneaSession, "id">;
  weightGoals!: EntityTable<WeightGoal, "id">;

  constructor() {
    super("suivi-app-db");

    // v1 : schéma initial. Toute évolution future (nouvelle tuile, nouveau champ)
    // doit passer par un nouveau .version(n) avec un .upgrade() si nécessaire,
    // jamais en modifiant cette version 1 directement.
    this.version(1).stores({
      // Index Dexie : "date" pour permettre des requêtes triées/filtrées par date.
      weightEntries: "++id, date",
      dailyLogs: "++id, &date", // &date = unique, une seule entrée par jour
      apneaSessions: "++id, date",
      weightGoals: "++id",
    });
  }
}

export const db = new AppDatabase();
