import { describe, expect, it } from "vitest";
import { VEYLORA } from "../data/campaignContent";
import { generateSectorHeightmap } from "./heightmap";
import { TerrainMask } from "./mask";
import { barrelTip, createTank, moveTank, settleTank } from "../entities/tank";
import { BASE_STATS, UPGRADES } from "../data/upgrades";
import { computeStats } from "../systems/upgrades";
import { planPreciseShot, simulateImpact } from "../systems/ai";
import { DEFAULT_WORLD } from "../physics/ballistics";

const maxStats = computeStats(Object.fromEntries(UPGRADES.map((entry) => [entry.id, entry.maxLevel])));

describe("VEYLORA asymmetric terrain", () => {
  it.each(VEYLORA.battlefields)("$id is deterministic, asymmetric and traversable on 100 seeds", (field) => {
    for (let seed = 0; seed < 100; seed++) {
      const map = generateSectorHeightmap(1280, 720, seed, field.terrain);
      expect(map).toEqual(generateSectorHeightmap(1280, 720, seed, field.terrain));
      expect(map[154]).not.toBe(map[1125]);
      let maxStep = 0;
      for (let x = 2; x < 1280; x++)
        maxStep = Math.max(maxStep, Math.abs(Math.floor(map[x]!) - Math.floor(map[x - 2]!)));
      expect(maxStep).toBeLessThanOrEqual(4);
      for (const x of field.strategicObjectiveSlots ?? []) {
        expect(Math.abs(map[x - 32]! - map[x + 32]!)).toBeLessThan(4);
      }
    }
  });

  it.each(VEYLORA.battlefields)("$id supports base/max tanks and reachable shots from both sides", (field) => {
    for (const seed of [0, 7, 42]) {
      const mask = TerrainMask.fromHeightmap(generateSectorHeightmap(1280, 720, seed, field.terrain), 720);
      expect(mask.removeDetachedGround()).toEqual([]);
      for (const stats of [BASE_STATS, maxStats]) {
        for (const [x, angle] of [
          [1280 * 0.12, 45],
          [1280 * 0.88, 135],
        ]) {
          const tank = createTank("test", x!, 0, angle!, stats);
          settleTank(tank, mask);
          const tip = barrelTip(tank);
          expect(mask.isSolid(tip.x, tip.y)).toBe(false);
          for (const direction of [-1, 1] as const) {
            const mover = { ...tank };
            for (let step = 0; step < stats.moveBudget / 2; step++) expect(moveTank(mover, direction, mask)).toBe(true);
          }
        }
      }
      const left = createTank("P1", 1280 * 0.12, 0, 45);
      const right = createTank("P2", 1280 * 0.88, 0, 135);
      settleTank(left, mask);
      settleTank(right, mask);
      for (let step = 0; step < 150; step++) {
        left.moveLeft = right.moveLeft = 60;
        expect(moveTank(left, 1, mask)).toBe(true);
        expect(moveTank(right, -1, mask)).toBe(true);
      }
      for (const [shooter, target] of [
        [left, right],
        [right, left],
      ]) {
        const plan = planPreciseShot(shooter!, target!, mask, 0, DEFAULT_WORLD.gravity);
        expect(plan?.hit).toBe(true);
        const impact = simulateImpact(
          barrelTip({ ...shooter!, angle: plan!.angle }),
          plan!.angle,
          plan!.power,
          DEFAULT_WORLD,
          mask,
          target,
        );
        expect(impact?.hitTarget).toBe(true);
        for (const slot of field.strategicObjectiveSlots ?? []) {
          const centerY = mask.surfaceY(slot) - field.strategicObjectives![0]!.height / 2;
          expect(Math.hypot(impact!.pos.x - slot, impact!.pos.y - centerY)).toBeGreaterThan(BASE_STATS.blastRadius);
        }
      }
    }
  });
});
