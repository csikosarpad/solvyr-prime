import { VEYLORA, type CampaignRewards, type CampaignRecipe } from "../data/campaignContent";
import type { TankStats } from "../data/upgrades";

export interface SectorProgress {
  selectedMissionId: string;
  completedMissionIds: string[];
}

export interface CampaignSave {
  version: 1;
  generation: string;
  progress: Record<string, SectorProgress>;
  resources: Record<string, number>;
  technologies: string[];
  claims: Record<string, { contentVersion: number; rewards: CampaignRewards }>;
  purchases: Record<string, { contentVersion: number; maxEnergyShieldMultiplier: number }>;
}

export const initialSectorProgress = (): SectorProgress => ({
  selectedMissionId: VEYLORA.missions[0]!.id,
  completedMissionIds: [],
});

export function newCampaignSave(): CampaignSave {
  return {
    version: 1,
    generation: crypto.randomUUID(),
    progress: { [VEYLORA.sector.id]: initialSectorProgress() },
    resources: {},
    technologies: [],
    claims: {},
    purchases: {},
  };
}

export function rewardKey(missionId: string): string {
  return JSON.stringify([VEYLORA.sector.id, missionId]);
}

export function purchaseBlock(save: CampaignSave, recipe: CampaignRecipe): "owned" | "technology" | "resources" | null {
  if (Object.hasOwn(save.purchases, recipe.id)) return "owned";
  if (recipe.technologies.some((id) => !save.technologies.includes(id))) return "technology";
  if (Object.entries(recipe.cost).some(([id, amount]) => (save.resources[id] ?? 0) < amount)) return "resources";
  return null;
}

export function applyCampaignUpgrades(stats: TankStats, save: CampaignSave): TankStats {
  const multiplier = Object.values(save.purchases).reduce(
    (value, purchase) => value * purchase.maxEnergyShieldMultiplier,
    1,
  );
  return { ...stats, maxEnergyShield: stats.maxEnergyShield * multiplier };
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid campaign save object");
  return value as Record<string, unknown>;
}

function strings(value: unknown): string[] {
  if (
    !Array.isArray(value) ||
    !value.every((id): id is string => typeof id === "string" && id.length > 0) ||
    new Set(value).size !== value.length
  )
    throw new Error("Invalid campaign save IDs");
  return value;
}

function version(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1)
    throw new Error("Invalid saved content version");
  return value;
}

function amounts(value: unknown): Record<string, number> {
  return Object.fromEntries(
    Object.entries(object(value)).map(([id, amount]) => {
      if (
        !VEYLORA.resources.some((entry) => entry.id === id) ||
        typeof amount !== "number" ||
        !Number.isSafeInteger(amount) ||
        amount < 0
      )
        throw new Error("Invalid saved resource");
      return [id, amount];
    }),
  );
}

function techs(value: unknown): string[] {
  const ids = strings(value);
  if (ids.some((id) => !VEYLORA.technologies.some((entry) => entry.id === id)))
    throw new Error("Unknown saved technology");
  return ids;
}

export function parseCampaignSave(value: unknown): CampaignSave {
  const raw = object(value);
  if (raw.version !== 1 || typeof raw.generation !== "string" || !raw.generation)
    throw new Error("Unsupported campaign save");
  const progress = Object.fromEntries(
    Object.entries(object(raw.progress)).map(([sectorId, value]) => {
      const entry = object(value);
      const completedMissionIds = strings(entry.completedMissionIds);
      if (
        sectorId !== VEYLORA.sector.id ||
        typeof entry.selectedMissionId !== "string" ||
        !VEYLORA.missions.some((mission) => mission.id === entry.selectedMissionId) ||
        completedMissionIds.some((id) => !VEYLORA.missions.some((mission) => mission.id === id))
      )
        throw new Error("Unknown saved mission");
      return [sectorId, { selectedMissionId: entry.selectedMissionId, completedMissionIds }];
    }),
  );
  if (!Object.hasOwn(progress, VEYLORA.sector.id)) throw new Error("Missing campaign progress");
  const claims = Object.fromEntries(
    Object.entries(object(raw.claims)).map(([key, value]) => {
      const entry = object(value);
      const rewards = object(entry.rewards);
      if (!VEYLORA.missions.some((mission) => rewardKey(mission.id) === key)) throw new Error("Unknown saved claim");
      return [
        key,
        {
          contentVersion: version(entry.contentVersion),
          rewards: { resources: amounts(rewards.resources), technologies: techs(rewards.technologies) },
        },
      ];
    }),
  );
  const purchases = Object.fromEntries(
    Object.entries(object(raw.purchases)).map(([id, value]) => {
      const entry = object(value);
      if (
        !VEYLORA.recipes.some((recipe) => recipe.id === id) ||
        typeof entry.maxEnergyShieldMultiplier !== "number" ||
        !Number.isFinite(entry.maxEnergyShieldMultiplier) ||
        entry.maxEnergyShieldMultiplier < 1.01 ||
        entry.maxEnergyShieldMultiplier > 2
      )
        throw new Error("Invalid saved upgrade");
      return [
        id,
        { contentVersion: version(entry.contentVersion), maxEnergyShieldMultiplier: entry.maxEnergyShieldMultiplier },
      ];
    }),
  );
  return {
    version: 1,
    generation: raw.generation,
    progress,
    resources: amounts(raw.resources),
    technologies: techs(raw.technologies),
    claims,
    purchases,
  };
}
