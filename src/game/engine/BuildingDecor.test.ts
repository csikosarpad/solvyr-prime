import { describe, expect, it, vi } from "vitest";
import { Sprite, Texture } from "pixi.js";
import { TerrainMask } from "../terrain/mask";
import { BuildingDecor } from "./BuildingDecor";

vi.hoisted(() => {
  HTMLCanvasElement.prototype.getContext = () => null;
});

describe("building decoration", () => {
  it("only places the selected sector's decorative sprites and releases them on restart", () => {
    const decor = new BuildingDecor();
    decor.setTextures({ radar: Texture.WHITE, defense: Texture.WHITE, foundry: Texture.WHITE });
    const terrain = TerrainMask.fromHeightmap(new Array(1280).fill(550), 720);
    decor.draw("forge-17", terrain);
    expect(decor.children).toHaveLength(1);
    const old = decor.children[0] as Sprite;
    expect(old.y).toBe(560);
    decor.draw("forge-17", terrain, [{ id: "test", type: "ENERGY_NODE", worldX: 345.6, width: 48, height: 44 }]);
    expect((decor.children[0] as Sprite).x).not.toBeCloseTo(345.6);
    decor.draw("vanguard-12", terrain);
    expect(old.destroyed).toBe(true);
    expect(decor.children).toHaveLength(2);
    decor.draw("alpha-01", terrain);
    expect(decor.children).toHaveLength(0);
    expect(Texture.WHITE.destroyed).toBe(false);
    decor.healthBars.destroy();
    decor.destroy({ children: true });
  });

  it("shows actual HP, applies nearby explosion damage and resets for the next battle", () => {
    const decor = new BuildingDecor();
    decor.setTextures({ radar: Texture.WHITE, defense: Texture.WHITE, foundry: Texture.WHITE });
    const terrain = TerrainMask.fromHeightmap(new Array(1280).fill(550), 720);
    const rect = vi.spyOn(decor.healthBars, "rect");
    decor.draw("forge-17", terrain);
    const sprite = decor.children[0] as Sprite;
    const width = Math.min(64, sprite.width);
    const left = sprite.x - width / 2;
    const top = sprite.y - sprite.height - 9;
    expect(rect).toHaveBeenLastCalledWith(left, top, width, 4);
    decor.applyExplosion(0, 0, 60, 60);
    expect(sprite.tint).toBe(0xffffff);
    expect(rect).toHaveBeenLastCalledWith(left, top, width, 4);
    decor.applyExplosion(sprite.x, sprite.y, 60, 60);
    expect(sprite.tint).toBe(0x999999);
    expect(rect).toHaveBeenLastCalledWith(left, top, width * 0.4, 4);
    decor.applyExplosion(sprite.x, sprite.y, 60, 60);
    expect(sprite.tint).toBe(0x555555);
    expect(rect).toHaveBeenLastCalledWith(left, top, 0, 4);
    decor.draw("forge-17", terrain);
    expect((decor.children[0] as Sprite).tint).toBe(0xffffff);
    expect(rect).toHaveBeenLastCalledWith(left, top, width, 4);
    decor.healthBars.destroy();
    decor.destroy({ children: true });
  });
});
