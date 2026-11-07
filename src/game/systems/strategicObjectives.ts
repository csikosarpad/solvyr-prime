import { createSeededRandom } from "./seededRandom";

export type StrategicObjectiveType = "ENERGY_NODE" | "CIVIL_HABITAT";
export type StructureState = "INTACT" | "DAMAGED" | "DESTROYED";
export type StrategicDamageSource = "PLAYER" | "AI";

export interface StrategicObjective {
  readonly id: string;
  readonly type: StrategicObjectiveType;
  readonly maxHp: number;
  readonly hp: number;
  readonly playerCausedDamage: number;
}

export interface StrategicObjectivePlacement {
  readonly id: string;
  readonly type: StrategicObjectiveType;
  readonly worldX: number;
  readonly width: number;
  readonly height: number;
}

export interface PlacedStrategicObjective extends StrategicObjective, StrategicObjectivePlacement {
  readonly worldY: number;
}

export function randomizeObjectivePlacements(
  placements: readonly StrategicObjectivePlacement[],
  slots: readonly number[],
  seed: number,
): StrategicObjectivePlacement[] {
  if (
    slots.length < placements.length ||
    new Set(slots).size !== slots.length ||
    slots.some((x) => !Number.isFinite(x))
  ) {
    throw new Error("Invalid strategic objective placement slots");
  }
  const sorted = [...slots].sort((a, b) => a - b);
  const maxWidth = Math.max(0, ...placements.map((placement) => placement.width));
  if (
    placements.some((placement) => !Number.isFinite(placement.width) || placement.width <= 0) ||
    sorted.some((x, index) => index > 0 && x - sorted[index - 1]! <= maxWidth)
  ) {
    throw new Error("Overlapping strategic objective placement slots");
  }
  const random = createSeededRandom(seed ^ 0x51e6e);
  const available = [...slots];
  return placements.map((placement) => {
    const index = Math.floor(random() * available.length);
    const worldX = available.splice(index, 1)[0]!;
    return { ...placement, worldX };
  });
}

function requireNonNegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid strategic objective ${name}`);
}

function validateHp(hp: number, maxHp: number): void {
  requireNonNegative(hp, "HP");
  if (!Number.isFinite(maxHp) || maxHp <= 0 || hp > maxHp) throw new Error("Invalid strategic objective max HP");
}

export function createStrategicObjective(id: string, type: StrategicObjectiveType): StrategicObjective {
  if (!id.trim()) throw new Error("Missing strategic objective ID");
  if (type !== "ENERGY_NODE" && type !== "CIVIL_HABITAT") throw new Error("Unknown strategic objective type");
  return { id, type, maxHp: 100, hp: 100, playerCausedDamage: 0 };
}

export function structureState(hp: number, maxHp: number): StructureState {
  validateHp(hp, maxHp);
  const ratio = hp / maxHp;
  return ratio >= 0.7 ? "INTACT" : ratio >= 0.2 ? "DAMAGED" : "DESTROYED";
}

export function strategicExplosionDamage(distance: number, radius: number, baseDamage: number): number {
  requireNonNegative(distance, "explosion distance");
  requireNonNegative(baseDamage, "explosion damage");
  if (!Number.isFinite(radius) || radius <= 0) throw new Error("Invalid strategic objective explosion radius");
  if (distance > radius) return 0;
  return baseDamage * (distance < radius / 3 ? 1 : distance < (2 * radius) / 3 ? 0.5 : 0.25);
}

export function applyStrategicDamage(
  objective: StrategicObjective,
  damage: number,
  source: StrategicDamageSource,
): StrategicObjective {
  validateHp(objective.hp, objective.maxHp);
  requireNonNegative(objective.playerCausedDamage, "player-caused damage");
  if (objective.playerCausedDamage > objective.maxHp)
    throw new Error("Invalid strategic objective player-caused damage");
  requireNonNegative(damage, "damage");
  if (source !== "PLAYER" && source !== "AI") throw new Error("Unknown strategic damage source");
  if (structureState(objective.hp, objective.maxHp) === "DESTROYED") return objective;
  const hp = Math.max(0, objective.hp - damage);
  const hpLost = objective.hp - hp;
  return {
    ...objective,
    hp,
    playerCausedDamage: objective.playerCausedDamage + (source === "PLAYER" ? hpLost : 0),
  };
}

export function strategicMaxEnergyShield(baseMaxEnergyShield: number, state: StructureState): number {
  requireNonNegative(baseMaxEnergyShield, "base max energy shield");
  switch (state) {
    case "INTACT":
      return baseMaxEnergyShield * 1.1;
    case "DAMAGED":
      return baseMaxEnergyShield;
    case "DESTROYED":
      return baseMaxEnergyShield * 0.9;
    default:
      throw new Error("Unknown strategic structure state");
  }
}
