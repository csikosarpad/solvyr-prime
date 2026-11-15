import { describe, expect, it, vi } from "vitest";
import { StrategicObjectiveGraphics } from "./StrategicObjectiveGraphics";
import { createStrategicObjective, type PlacedStrategicObjective } from "../systems/strategicObjectives";
import { TerrainMask } from "../terrain/mask";
import { Sprite, Texture } from "pixi.js";

vi.hoisted(() => {
  HTMLCanvasElement.prototype.getContext = () => null;
});

describe("strategic objective graphics", () => {
  it("uses the biodome image for habitats in any sector, with damage and ruin states", () => {
    const graphics = new StrategicObjectiveGraphics();
    graphics.setHabitatTexture(Texture.WHITE);
    const terrain = TerrainMask.fromHeightmap(new Array(1280).fill(550), 720);
    const objective = {
      ...createStrategicObjective("habitat", "CIVIL_HABITAT"),
      worldX: 700, worldY: 550, width: 64, height: 32,
    };
    const sprites = Reflect.get(graphics, "reactorSprites") as Map<string, Sprite>;
    graphics.draw([objective], terrain, 0, false);
    expect(sprites.get("habitat")?.tint).toBe(0xffffff);
    graphics.draw([{ ...objective, hp: 40 }], terrain, 0, false);
    expect(sprites.get("habitat")?.tint).toBe(0x999999);
    graphics.draw([{ ...objective, hp: 15 }], terrain, 0, false);
    expect(sprites.size).toBe(0);
    expect(graphics.drawing.context.instructions.length).toBeGreaterThan(0);
    graphics.destroy({ children: true });
  });

  it("uses the image only for a living FORGE reactor and preserves the destroyed state", () => {
    const graphics = new StrategicObjectiveGraphics();
    graphics.setReactorTexture(Texture.WHITE);
    const terrain = TerrainMask.fromHeightmap(new Array(1280).fill(550), 720);
    const objective = {
      ...createStrategicObjective("energy-node-01", "ENERGY_NODE"),
      worldX: 1040,
      worldY: 550,
      width: 48,
      height: 44,
    };
    graphics.draw([objective], terrain, 0, false, true);
    const sprites = Reflect.get(graphics, "reactorSprites") as Map<string, Sprite>;
    const sprite = sprites.get(objective.id)!;
    expect(sprite).toMatchObject({ tint: 0xffffff, x: 1040, y: 546 });
    expect(sprite.width).toBeLessThanOrEqual(objective.width);
    expect(sprite.height).toBeLessThanOrEqual(objective.height - 4);
    graphics.draw([{ ...objective, hp: 40 }], terrain, 1, false, true);
    expect(sprites.get(objective.id)).toBe(sprite);
    expect(sprite.tint).toBe(0x999999);
    graphics.draw([{ ...objective, hp: 15 }], terrain, 0, false, true);
    expect(sprites.size).toBe(0);
    expect(graphics.drawing.context.instructions.length).toBeGreaterThan(0);
    graphics.draw([objective], terrain, 0, false);
    expect(sprites.size).toBe(0);
    graphics.draw([objective], terrain, 0, false, true);
    graphics.draw([], terrain, 0, false, true);
    expect(sprites.size).toBe(0);
    expect(Texture.WHITE.destroyed).toBe(false);
    graphics.destroy({ children: true });
  });

  it("uses the FORGE reactor prototype in all three states only when enabled", () => {
    const graphics = new StrategicObjectiveGraphics();
    const reactor = vi.spyOn(graphics.drawing, "circle");
    const terrain = TerrainMask.fromHeightmap(new Array(1280).fill(550), 720);
    const objective = {
      ...createStrategicObjective("energy-node-01", "ENERGY_NODE"),
      worldX: 1040,
      worldY: 550,
      width: 48,
      height: 44,
    };
    graphics.draw([objective], terrain, 0, false);
    expect(reactor).not.toHaveBeenCalled();
    graphics.draw([objective], terrain, 0, false, true);
    expect(reactor).toHaveBeenCalledTimes(1);
    graphics.draw([{ ...objective, hp: 40 }], terrain, 0, false, true);
    expect(reactor).toHaveBeenCalledTimes(4);
    graphics.draw([{ ...objective, hp: 15 }], terrain, 0, false, true);
    expect(reactor).toHaveBeenCalledTimes(4);
    graphics.destroy({ children: true });
  });

  it.each(["ENERGY_NODE", "CIVIL_HABITAT", "RESEARCH_LAB"] as const)(
    "draws distinct %s states without changing logic",
    (type) => {
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
        expect(graphics.drawing.context.instructions.length).toBeGreaterThan(0);
        expect(state).toEqual(before);
        const bounds = graphics.getLocalBounds();
        expect(bounds.minY).toBeLessThan(550);
        expect(bounds.maxY).toBeGreaterThanOrEqual(550);
      }
      graphics.draw([], terrain, 0, false);
      expect(graphics.drawing.context.instructions).toHaveLength(0);
      graphics.destroy({ children: true });
    },
  );

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
    graphics.destroy({ children: true });
  });
});
