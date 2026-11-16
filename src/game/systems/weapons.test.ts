import { describe, expect, it } from "vitest";
import { BASE_STATS } from "../data/upgrades";
import { weaponById, WEAPONS } from "../data/weapons";
import { createTank } from "../entities/tank";
import { TerrainMask } from "../terrain/mask";
import { resolveDamage } from "./damage";
import { buyWeapon, resolveShotEffect, steerHoming, traceHitscan, unlockedWeapons } from "./weapons";

const flatMask = () => TerrainMask.fromHeightmap(new Array(1280).fill(550), 720);

describe("weapon catalog and shot effects", () => {
  it("the standard shell follows tank stats so existing upgrades keep working", () => {
    const stats = { ...BASE_STATS, damage: 1.3, blastRadius: 42 };
    const effect = resolveShotEffect(weaponById("standard"), stats);
    expect(effect).toMatchObject({ damage: 78, blastRadius: 42, carveRadius: 42, directOnly: false, armorPierce: 0 });
  });

  it("non-standard weapons use their own values and ignore the warhead multiplier", () => {
    const stats = { ...BASE_STATS, damage: 2, blastRadius: 99 };
    const ap = resolveShotEffect(weaponById("ap"), stats);
    expect(ap).toMatchObject({ damage: 70, blastRadius: 0, directOnly: true, armorPierce: 0.5 });
    const incendiary = resolveShotEffect(weaponById("incendiary"), stats);
    expect(incendiary.burn).toMatchObject({ radius: 42, damagePerTurn: 8, turns: 4 });
    expect(incendiary.directOnly).toBe(false);
  });

  it("armor pierce sends part of the post-shield damage straight to HP", () => {
    const result = resolveDamage({ hp: 100, shield: 10, armor: 100 }, 50, 0.5);
    // 10 pajzs után 40 marad: 20 átüt a HP-ra, 20 a páncélra.
    expect(result).toEqual({ hp: 80, shield: 0, armor: 80 });
    // Átütés nélkül a páncél mindent elnyel.
    expect(resolveDamage({ hp: 100, shield: 10, armor: 100 }, 50)).toEqual({ hp: 100, shield: 0, armor: 60 });
  });
});

describe("hitscan (laser)", () => {
  it("hits the first tank on the straight ray regardless of distance", () => {
    const mask = flatMask();
    const target = createTank("P2", 900, 0xffffff, 135);
    target.y = mask.surfaceY(target.x);
    const result = traceHitscan({ x: 100, y: 545 }, 0, mask, [target], 720);
    expect(result.hit).toBe(target);
    expect(Math.abs(result.pos.x - target.x)).toBeLessThanOrEqual(12 + 2);
  });

  it("stops at terrain when aimed into the ground and at nothing when leaving the map", () => {
    const mask = flatMask();
    const down = traceHitscan({ x: 100, y: 500 }, -45, mask, [], 720);
    expect(down.hit).toBeNull();
    expect(mask.isSolid(down.pos.x, down.pos.y)).toBe(true);
    const up = traceHitscan({ x: 100, y: 500 }, 90, mask, [], 720);
    expect(up.hit).toBeNull();
  });
});

describe("homing guidance", () => {
  const guidance = { acquireRadius: 220, maxTurnRad: 0.03 };

  it("turns the velocity toward the target but only by the limited rate", () => {
    const vel = steerHoming({ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, guidance);
    const angle = Math.atan2(vel.y, vel.x);
    expect(angle).toBeCloseTo(guidance.maxTurnRad, 5);
    expect(Math.hypot(vel.x, vel.y)).toBeCloseTo(100, 5);
  });

  it("does not steer outside the acquire radius", () => {
    const vel = steerHoming({ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 500, y: 500 }, guidance);
    expect(vel).toEqual({ x: 100, y: 0 });
  });
});

describe("weapon unlocks", () => {
  it("starts with the free standard and keeps only valid saved unlocks", () => {
    expect(unlockedWeapons(undefined)).toEqual(["standard"]);
    expect(unlockedWeapons({ weapons: ["laser", "bogus", "ap"] })).toEqual(["standard", "ap", "laser"]);
  });

  it("buyWeapon spends XP once per weapon and rejects unknown or free weapons", () => {
    const profile = { xp: 500, levels: {} };
    const withAp = buyWeapon(profile, "ap")!;
    expect(withAp).toMatchObject({ xp: 500 - weaponById("ap").cost, weapons: ["ap"] });
    expect(buyWeapon(withAp, "ap")).toBeNull();
    expect(buyWeapon(profile, "standard")).toBeNull();
    expect(buyWeapon(profile, "nope")).toBeNull();
    expect(buyWeapon({ xp: 10, levels: {} }, "laser")).toBeNull();
  });

  it("every catalog weapon has a stable id and the starter pack is exactly one free weapon", () => {
    expect(WEAPONS.filter((weapon) => weapon.cost === 0).map((weapon) => weapon.id)).toEqual(["standard"]);
    expect(new Set(WEAPONS.map((weapon) => weapon.id)).size).toBe(WEAPONS.length);
  });
});
