import { db, type WeightGoal } from "../db/schema";

/** L'objectif actif, ou null si aucun n'a été défini. */
export async function getActiveGoal(): Promise<WeightGoal | null> {
  const goals = await db.weightGoals.toArray();
  return goals.find((g) => g.active) ?? null;
}

/**
 * Définit un nouvel objectif actif. L'ancien (s'il existe) est désactivé
 * mais conservé en base, pour ne jamais perdre d'historique.
 */
export async function setGoal(goal: {
  startWeightKg: number;
  startDate: string;
  targetWeightKg: number;
  targetDate: string;
}): Promise<void> {
  await db.transaction("rw", db.weightGoals, async () => {
    const current = await getActiveGoal();
    if (current) {
      await db.weightGoals.update(current.id!, { active: false });
    }
    await db.weightGoals.add({
      ...goal,
      active: true,
      createdAt: new Date().toISOString(),
    });
  });
}
