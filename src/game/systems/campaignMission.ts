import type { CampaignMission } from "../data/campaignContent";
import type { PlacedStrategicObjective } from "./strategicObjectives";

export function missionSucceeded(
  mission: CampaignMission,
  winner: string | null,
  objectives: readonly PlacedStrategicObjective[],
): boolean {
  if (winner !== "P1") return false;
  if (!mission.protection) return true;
  const protection = mission.protection;
  const objective = objectives.find((entry) => entry.id === protection.objectiveId);
  if (!objective) throw new Error(`Missing mission objective: ${protection.objectiveId}`);
  return objective.hp >= objective.maxHp * protection.minimumHpRatio;
}
