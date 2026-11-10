import { hu, type MessageKey } from "@/i18n/messages.hu";
import { DEFAULT_THEME } from "../theme";
import { validateTerrainProfile } from "../terrain/heightmap";
import type { Sector, TerrainProfile } from "./sectors";
import type { StrategicObjectivePlacement } from "../systems/strategicObjectives";
import veyloraJson from "./veylora.json?raw";

export interface CampaignMission {
  id: string;
  battlefieldId: string;
  opponent: { armor: number; skill: number };
  protection?: { objectiveId: string; minimumHpRatio: number };
  rewards: CampaignRewards;
}

export interface CampaignRewards {
  resources: Record<string, number>;
  technologies: string[];
}

export interface CampaignRecipe {
  id: string;
  name: MessageKey;
  cost: Record<string, number>;
  technologies: string[];
  effect: { maxEnergyShieldMultiplier: number };
}

export interface CampaignLocation {
  id: string;
  kind: "planet" | "station";
  name: MessageKey;
  missionIds: string[];
  recipeIds: string[];
}

export interface CampaignContent {
  schemaVersion: 1;
  contentVersion: number;
  sector: { id: string; name: MessageKey; locations: CampaignLocation[] };
  missions: CampaignMission[];
  battlefields: Sector[];
  resources: { id: string; name: MessageKey }[];
  technologies: { id: string; name: MessageKey }[];
  recipes: CampaignRecipe[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function record(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new Error("Expected content object");
  return value;
}

function list(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error("Expected content list");
  return value;
}

function text(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) throw new Error("Missing content text or ID");
  return value;
}

function identifier(value: unknown): string {
  const id = text(value);
  if (!/^[a-z][a-z0-9-]*$/.test(id) || id === "constructor" || id === "prototype")
    throw new Error("Invalid content ID");
  return id;
}

function number(value: unknown, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max)
    throw new Error("Invalid content number");
  return value;
}

function message(value: unknown): MessageKey {
  if (typeof value !== "string" || !Object.hasOwn(hu, value)) throw new Error("Unknown content translation key");
  return value as MessageKey;
}

function unique(ids: readonly string[]): void {
  if (new Set(ids).size !== ids.length) throw new Error("Duplicate content ID");
}

function quantities(value: unknown): Record<string, number> {
  return Object.fromEntries(
    Object.entries(record(value)).map(([id, value]) => {
      text(id);
      const amount = number(value, 1, Number.MAX_SAFE_INTEGER);
      if (!Number.isSafeInteger(amount)) throw new Error("Invalid resource quantity");
      return [id, amount];
    }),
  );
}

function color(value: unknown): number {
  const result = number(value, 0, 0xffffff);
  if (!Number.isInteger(result)) throw new Error("Invalid content color");
  return result;
}

function terrain(value: unknown): TerrainProfile {
  const raw = record(value);
  if (raw.layout !== "full" && raw.layout !== "mirrored") throw new Error("Unknown terrain layout");
  const points = list(raw.points).map((value): readonly [number, number] => {
    const point = list(value);
    if (point.length !== 2) throw new Error("Invalid terrain point");
    return [number(point[0], 0, 1), number(point[1], 0.46, 0.8)];
  });
  const profile: TerrainProfile = { layout: raw.layout, points, amplitude: number(raw.amplitude, 0, 0.05) };
  validateTerrainProfile(profile);
  return profile;
}

function battlefield(value: unknown): Sector {
  const raw = record(value);
  const colors = record(raw.colors);
  const atmosphere = record(raw.atmosphere);
  const objectives = list(raw.strategicObjectives).map((value): StrategicObjectivePlacement => {
    const entry = record(value);
    if (entry.type !== "RESEARCH_LAB") throw new Error("Unsupported campaign objective type");
    return {
      id: text(entry.id),
      type: entry.type,
      worldX: number(entry.worldX, 300, 980),
      width: number(entry.width, 16, 96),
      height: number(entry.height, 16, 80),
    };
  });
  const slots = list(raw.strategicObjectiveSlots).map((value) => number(value, 300, 980));
  unique(objectives.map((entry) => entry.id));
  if (new Set(slots).size !== slots.length || slots.length < objectives.length)
    throw new Error("Invalid campaign objective slots");
  const sorted = [...slots].sort((a, b) => a - b);
  const maxWidth = Math.max(0, ...objectives.map((entry) => entry.width));
  if (sorted.some((x, index) => index > 0 && x - sorted[index - 1]! <= maxWidth))
    throw new Error("Overlapping campaign objective slots");
  return {
    id: text(raw.id),
    code: text(raw.code),
    name: text(raw.name),
    briefing: message(raw.briefing),
    terrain: terrain(raw.terrain),
    colors: {
      ...DEFAULT_THEME.terrain,
      fill: color(colors.fill),
      grass: color(colors.grass),
      surfaceHighlight: color(colors.surfaceHighlight),
    },
    atmosphere: {
      tint: color(atmosphere.tint),
      mountain: color(atmosphere.mountain),
      fog: color(atmosphere.fog),
      cityIntensity: number(atmosphere.cityIntensity, 0, 1),
    },
    prerequisites: [],
    position: { x: 50, y: 50 },
    strategicObjectives: objectives,
    strategicObjectiveSlots: slots,
  };
}

export function parseCampaignContent(value: unknown): CampaignContent {
  const raw = record(value);
  if (raw.schemaVersion !== 1) throw new Error("Unsupported campaign schema");
  const contentVersion = number(raw.contentVersion, 1, Number.MAX_SAFE_INTEGER);
  if (!Number.isInteger(contentVersion)) throw new Error("Invalid campaign content version");
  const sector = record(raw.sector);
  const catalog = (value: unknown) =>
    list(value).map((value) => {
      const entry = record(value);
      return { id: identifier(entry.id), name: message(entry.name) };
    });
  const resources = catalog(raw.resources);
  const technologies = catalog(raw.technologies);
  const recipes = list(raw.recipes).map((value): CampaignRecipe => {
    const entry = record(value);
    const effect = record(entry.effect);
    if (Object.keys(effect).length !== 1) throw new Error("Unsupported campaign upgrade effect");
    return {
      id: identifier(entry.id),
      name: message(entry.name),
      cost: quantities(entry.cost),
      technologies: list(entry.technologies).map(text),
      effect: { maxEnergyShieldMultiplier: number(effect.maxEnergyShieldMultiplier, 1.01, 2) },
    };
  });
  const checkReferences = (amounts: Record<string, number>, techIds: string[]) => {
    unique(techIds);
    if (
      Object.keys(amounts).some((id) => !resources.some((entry) => entry.id === id)) ||
      techIds.some((id) => !technologies.some((entry) => entry.id === id))
    )
      throw new Error("Unknown economic reference");
  };
  unique(resources.map((entry) => entry.id));
  unique(technologies.map((entry) => entry.id));
  unique(recipes.map((entry) => entry.id));
  recipes.forEach((entry) => checkReferences(entry.cost, entry.technologies));
  const locations = list(sector.locations).map((value): CampaignLocation => {
    const entry = record(value);
    if (entry.kind !== "planet" && entry.kind !== "station") throw new Error("Unknown campaign location kind");
    const missionIds = list(entry.missionIds).map(text);
    const recipeIds = list(entry.recipeIds).map(text);
    unique(missionIds);
    unique(recipeIds);
    if (
      (entry.kind !== "station" && recipeIds.length) ||
      recipeIds.some((id) => !recipes.some((recipe) => recipe.id === id))
    )
      throw new Error("Invalid station recipe reference");
    return { id: text(entry.id), kind: entry.kind, name: message(entry.name), missionIds, recipeIds };
  });
  const missions = list(raw.missions).map((value): CampaignMission => {
    const entry = record(value);
    const opponent = record(entry.opponent);
    const armor = number(opponent.armor, 0, 100);
    const reward = record(entry.rewards);
    const rewards = { resources: quantities(reward.resources), technologies: list(reward.technologies).map(text) };
    checkReferences(rewards.resources, rewards.technologies);
    const mission: CampaignMission = {
      id: text(entry.id),
      battlefieldId: text(entry.battlefieldId),
      opponent: { armor, skill: number(opponent.skill, 0, 0.9) },
      rewards,
    };
    if (entry.protection !== undefined) {
      const protection = record(entry.protection);
      mission.protection = {
        objectiveId: text(protection.objectiveId),
        minimumHpRatio: number(protection.minimumHpRatio, 0.2, 1),
      };
    }
    return mission;
  });
  const battlefields = list(raw.battlefields).map(battlefield);
  unique(locations.map((entry) => entry.id));
  unique(missions.map((entry) => entry.id));
  unique(battlefields.map((entry) => entry.id));
  const assigned = locations.flatMap((entry) => entry.missionIds);
  unique(assigned);
  if (
    !locations.length ||
    !missions.length ||
    assigned.length !== missions.length ||
    assigned.some((id) => !missions.some((mission) => mission.id === id))
  )
    throw new Error("Missing campaign mission reference");
  for (const mission of missions) {
    const field = battlefields.find((entry) => entry.id === mission.battlefieldId);
    if (!field) throw new Error("Missing campaign battlefield reference");
    if (mission.protection && !field.strategicObjectives?.some((entry) => entry.id === mission.protection?.objectiveId))
      throw new Error("Missing campaign protection objective");
  }
  return {
    schemaVersion: 1,
    contentVersion,
    sector: { id: identifier(sector.id), name: message(sector.name), locations },
    missions,
    battlefields,
    resources,
    technologies,
    recipes,
  };
}

export const VEYLORA = parseCampaignContent(JSON.parse(veyloraJson));

export function missionById(id: string): CampaignMission {
  const mission = VEYLORA.missions.find((entry) => entry.id === id);
  if (!mission) throw new Error(`Unknown VEYLORA mission: ${id}`);
  return mission;
}

export function missionBattlefield(mission: CampaignMission): Sector {
  const field = VEYLORA.battlefields.find((entry) => entry.id === mission.battlefieldId);
  if (!field) throw new Error(`Unknown VEYLORA battlefield: ${mission.battlefieldId}`);
  return field;
}
