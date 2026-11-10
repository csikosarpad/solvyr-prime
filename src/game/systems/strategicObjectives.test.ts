import { describe, expect, it } from "vitest";
import { computeStats } from "./upgrades";
import {
  applyStrategicDamage,
  createStrategicObjective,
  randomizeObjectivePlacements,
  strategicExplosionDamage,
  strategicMaxEnergyShield,
  structureState,
  type StrategicObjectiveType,
} from "./strategicObjectives";

describe("strategic objectives", () => {
  it("uses repeatable independent placement randomness with distinct slots and varying seeds", () => {
    const placements = [
      { id: "energy", type: "ENERGY_NODE" as const, worldX: 1040, width: 48, height: 44 },
      { id: "civil", type: "CIVIL_HABITAT" as const, worldX: 900, width: 64, height: 32 },
    ];
    const slots = [380, 540, 720, 900, 1020];
    const layouts = new Set<string>();
    for (let seed = 0; seed < 1000; seed++) {
      const layout = randomizeObjectivePlacements(placements, slots, seed);
      expect(layout).toEqual(randomizeObjectivePlacements(placements, slots, seed));
      expect(new Set(layout.map((objective) => objective.worldX)).size).toBe(2);
      layout.forEach((objective) => expect(slots).toContain(objective.worldX));
      layouts.add(JSON.stringify(layout));
    }
    expect(layouts.size).toBe(20);
    expect(placements[0]?.worldX).toBe(1040);
    expect(() => randomizeObjectivePlacements(placements, [380], 1)).toThrow();
    expect(() => randomizeObjectivePlacements(placements, [380, 380], 1)).toThrow();
    expect(() => randomizeObjectivePlacements(placements, [NaN, 380], 1)).toThrow();
  });
  it.each<StrategicObjectiveType>(["ENERGY_NODE", "CIVIL_HABITAT"])("creates an intact %s with 100 HP", (type) => {
    const objective = createStrategicObjective("objective-01", type);
    expect(objective).toEqual({ id: "objective-01", type, maxHp: 100, hp: 100, playerCausedDamage: 0 });
    expect(structureState(objective.hp, objective.maxHp)).toBe("INTACT");
  });

  it.each([
    [100, "INTACT"],
    [70, "INTACT"],
    [69.99, "DAMAGED"],
    [69, "DAMAGED"],
    [20, "DAMAGED"],
    [19.99, "DESTROYED"],
    [19, "DESTROYED"],
    [0, "DESTROYED"],
  ] as const)("classifies %s HP as %s without rounding", (hp, state) => {
    expect(structureState(hp, 100)).toBe(state);
    expect(structureState(hp * 2, 200)).toBe(state);
  });

  it.each([
    [0, 40],
    [29.99, 40],
    [30, 20],
    [59.99, 20],
    [60, 10],
    [90, 10],
    [90.01, 0],
  ] as const)("uses the correct explosion band at distance %s", (distance, damage) => {
    expect(strategicExplosionDamage(distance, 90, 40)).toBe(damage);
    expect(strategicExplosionDamage(distance * 2, 180, 40)).toBe(damage);
  });

  it("accumulates actual player HP loss, not overkill or AI damage", () => {
    const initial = createStrategicObjective("energy-node-01", "ENERGY_NODE");
    const playerHit = applyStrategicDamage(initial, 25, "PLAYER");
    const aiHit = applyStrategicDamage(playerHit, 50, "AI");
    const overkill = applyStrategicDamage(aiHit, 200, "PLAYER");
    expect(initial).toMatchObject({ hp: 100, playerCausedDamage: 0 });
    expect(playerHit).toMatchObject({ hp: 75, playerCausedDamage: 25 });
    expect(aiHit).toMatchObject({ hp: 25, playerCausedDamage: 25 });
    expect(overkill).toMatchObject({ hp: 0, playerCausedDamage: 50 });
    expect(applyStrategicDamage(overkill, 200, "PLAYER")).toEqual(overkill);
  });

  it("records AI destruction physically without attributing it to the player", () => {
    const objective = applyStrategicDamage(createStrategicObjective("civil-01", "CIVIL_HABITAT"), 100, "AI");
    expect(structureState(objective.hp, objective.maxHp)).toBe("DESTROYED");
    expect(objective.playerCausedDamage).toBe(0);
  });

  it.each(["PLAYER", "AI"] as const)("does not damage a ruin with remaining HP: %s", (source) => {
    const ruined = applyStrategicDamage(createStrategicObjective("energy-01", "ENERGY_NODE"), 85, "PLAYER");
    expect(ruined).toMatchObject({ hp: 15, playerCausedDamage: 85 });
    expect(applyStrategicDamage(ruined, 100, source)).toBe(ruined);
  });

  it("still damages a structure at exactly 20% HP", () => {
    const damaged = applyStrategicDamage(createStrategicObjective("energy-01", "ENERGY_NODE"), 80, "PLAYER");
    expect(applyStrategicDamage(damaged, 1, "PLAYER")).toMatchObject({ hp: 19, playerCausedDamage: 81 });
  });
  it("preserves fractional HP losses and zero-damage state", () => {
    const initial = createStrategicObjective("energy-01", "ENERGY_NODE");
    const hit = applyStrategicDamage(initial, strategicExplosionDamage(90, 90, 1), "PLAYER");
    expect(hit).toMatchObject({ hp: 99.75, playerCausedDamage: 0.25 });
    expect(applyStrategicDamage(hit, 0, "AI")).toEqual(hit);
  });

  it("produces the same result for the same sequence without mutating the starting state", () => {
    const initial = createStrategicObjective("energy-01", "ENERGY_NODE");
    const run = () =>
      [0, 30, 60].reduce(
        (objective, distance) => applyStrategicDamage(objective, strategicExplosionDamage(distance, 90, 40), "PLAYER"),
        initial,
      );
    expect(run()).toEqual(run());
    expect(run()).toMatchObject({ hp: 30, playerCausedDamage: 70 });
    expect(initial.hp).toBe(100);
  });

  it.each([
    ["INTACT", 1.1],
    ["DAMAGED", 1],
    ["DESTROYED", 0.9],
  ] as const)("calculates %s shield effect from the upgraded maximum", (state, multiplier) => {
    const stats = computeStats({ shield: 3 });
    expect(strategicMaxEnergyShield(stats.maxEnergyShield, state)).toBeCloseTo(stats.maxEnergyShield * multiplier);
    expect(strategicMaxEnergyShield(0, state)).toBe(0);
    expect(stats.maxEnergyShield).toBe(computeStats({ shield: 3 }).maxEnergyShield);
  });

  it.each([NaN, Infinity, -1])("rejects invalid numeric input: %s", (value) => {
    expect(() => structureState(value, 100)).toThrow();
    expect(() => structureState(0, value)).toThrow();
    expect(() => strategicExplosionDamage(value, 90, 40)).toThrow();
    expect(() => strategicExplosionDamage(0, value, 40)).toThrow();
    expect(() => strategicExplosionDamage(0, 90, value)).toThrow();
    expect(() => applyStrategicDamage(createStrategicObjective("energy-01", "ENERGY_NODE"), value, "PLAYER")).toThrow();
    expect(() => strategicMaxEnergyShield(value, "INTACT")).toThrow();
  });

  it("rejects missing IDs and impossible HP or damage counters", () => {
    const objective = createStrategicObjective("energy-01", "ENERGY_NODE");
    expect(() => createStrategicObjective(" ", "ENERGY_NODE")).toThrow("Missing");
    expect(() => structureState(101, 100)).toThrow();
    expect(() => structureState(0, 0)).toThrow();
    expect(() => strategicExplosionDamage(0, 0, 40)).toThrow();
    expect(() => applyStrategicDamage({ ...objective, playerCausedDamage: 101 }, 0, "PLAYER")).toThrow();
    expect(() => applyStrategicDamage({ ...objective, playerCausedDamage: -1 }, 0, "PLAYER")).toThrow();
  });
});
