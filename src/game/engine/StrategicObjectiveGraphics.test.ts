import { describe, expect, it, vi } from "vitest";
import { StrategicObjectiveGraphics } from "./StrategicObjectiveGraphics";
import { createStrategicObjective, type PlacedStrategicObjective } from "../systems/strategicObjectives";
import { TerrainMask } from "../terrain/mask";

vi.hoisted(() => {
  HTMLCanvasElement.prototype.getContext = () => null;
});

describe("strategic objective graphics", () => {
  it.each(["ENERGY_NODE", "CIVIL_HABITAT", "RESEARCH_LAB"] as const)("draws distinct %s states without changing logic", (type) => {
    const graphics = new StrategicObjectiveGraphics();
    const terrain = TerrainMask.fromHeightmap(new Array(1280).fill(550), 720);
    const objective: PlacedStrategicObjective = {
      ...createStrategicObjective("test-01", type),
      worldX: 1040,
      worldY: 550,
      width: 48,
      height: 44,
    };
    for (const hp of [100, 40, 15]) {
      const state = { ...objective, hp };
      const before = structuredClone(state);
      graphics.draw([state], terrain, 1 / 60, true);
      expect(graphics.context.instructions.length).toBeGreaterThan(0);
      expect(state).toEqual(before);
      const bounds = graphics.getLocalBounds();
      expect(bounds.minY).toBeLessThan(550);
      expect(bounds.maxY).toBeGreaterThanOrEqual(550);
    }
    graphics.draw([], terrain, 0, false);
    expect(graphics.context.instructions).toHaveLength(0);
    graphics.destroy();
  });

  it("does not advance damage animation with reduced motion", () => {
    const graphics = new StrategicObjectiveGraphics();
    const terrain = TerrainMask.fromHeightmap(new Array(1280).fill(550), 720);
    const objective = {
      ...createStrategicObjective("test-01", "ENERGY_NODE"),
      worldX: 1040,
      worldY: 550,
      width: 48,
      height: 44,
      hp: 40,
    };
    graphics.draw([objective], terrain, 0, false);
    const bounds = graphics.getLocalBounds();
    graphics.draw([objective], terrain, 100, false);
    expect(graphics.getLocalBounds()).toEqual(bounds);
    graphics.destroy();
  });
});
