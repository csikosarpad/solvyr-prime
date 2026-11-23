import { afterEach, describe, expect, it, vi } from "vitest";
import { Container, Graphics, TilingSprite, type Renderer, type Texture } from "pixi.js";
import { Terrain } from "./Terrain";
import { TerrainMask } from "./mask";
import { DEFAULT_THEME } from "../theme";
import { SECTORS, sectorById } from "../data/sectors";
import { VEYLORA } from "../data/campaignContent";
import { generateSectorHeightmap } from "./heightmap";

vi.hoisted(() => {
  HTMLCanvasElement.prototype.getContext = () => null;
});

afterEach(() => vi.restoreAllMocks());

describe("Terrain collapse", () => {
  it("bakes the masked material into ALPHA-01 terrain and releases its temporary tile", () => {
    let tile: Texture | undefined;
    let masked = false;
    const render = vi.fn(({ container }: { container: Container }) => {
      for (const child of container.children) {
        if (!(child instanceof Container)) continue;
        const sprite = child.children.find((item) => item instanceof TilingSprite);
        if (sprite instanceof TilingSprite) {
          tile = sprite.texture;
          masked = child.mask !== null;
        }
      }
    });
    const terrain = new Terrain({ render } as unknown as Renderer);
    terrain.build(1280, 720, 42, sectorById("alpha-01"));
    expect(tile).toBeDefined();
    expect(masked).toBe(true);
    expect(tile!.destroyed).toBe(true);
    expect(render).toHaveBeenCalledTimes(2);
    render.mockClear();
    terrain.carve(640, terrain.mask.surfaceY(640), 20);
    expect(render).toHaveBeenCalledTimes(2);
    terrain.destroy();
  });

  it.each([...SECTORS, ...VEYLORA.battlefields])("adds rocky details to $id without changing its collision mask", (sector) => {
    const terrain = new Terrain({ render: vi.fn() } as unknown as Renderer);
    const poly = vi.spyOn(Graphics.prototype, "poly");
    terrain.build(1280, 720, 42, sector);
    expect(poly).toHaveBeenCalled();
    const expected = TerrainMask.fromHeightmap(generateSectorHeightmap(1280, 720, 42, sector.terrain), 720);
    expect(Array.from({ length: 1280 }, (_, x) => terrain.mask.surfaceY(x)))
      .toEqual(Array.from({ length: 1280 }, (_, x) => expected.surfaceY(x)));
    terrain.destroy();
  });

  it("also adds rocky details when no sector is supplied", () => {
    const terrain = new Terrain({ render: vi.fn() } as unknown as Renderer);
    const poly = vi.spyOn(Graphics.prototype, "poly");
    terrain.build(1280, 720, 42);
    expect(poly).toHaveBeenCalled();
    terrain.destroy();
  });

  it("uses sector colors only for explicit sector builds and otherwise preserves constructor colors", () => {
    const colors = { ...DEFAULT_THEME.terrain, fill: 0xabcdef };
    const terrain = new Terrain({ render: vi.fn() } as unknown as Renderer, colors);
    const fill = vi.spyOn(Graphics.prototype, "fill");
    terrain.build(40, 40);
    expect(fill).toHaveBeenCalledWith(colors.fill);
    fill.mockClear();
    terrain.build(40, 40, 1, sectorById("delta-08"));
    expect(fill).toHaveBeenCalledWith(sectorById("delta-08").colors.fill);
    fill.mockClear();
    terrain.build(40, 40);
    expect(fill).toHaveBeenCalledWith(colors.fill);
    terrain.destroy();
  });

  it("clears collision and the visual island including its outline before returning from carve", () => {
    const render = vi.fn();
    const terrain = new Terrain({ render } as unknown as Renderer);
    terrain.build(10, 10);
    terrain.mask = TerrainMask.fromHeightmap(new Float32Array(10).fill(2), 10);
    for (let x = 1; x < 10; x++) terrain.mask.carveCircle(x, 5, 0);
    const rect = vi.spyOn(Graphics.prototype, "rect");
    render.mockClear();
    terrain.carve(0, 5, 0);
    expect(terrain.mask.surfaceY(5)).toBe(6);
    expect(rect).toHaveBeenCalled();
    const erased = (x: number, y: number) =>
      rect.mock.calls.some(([rx, ry, width, height]) => x >= rx && x < rx + width && y >= ry && y < ry + height);
    expect(erased(5, 3)).toBe(true);
    expect(erased(5, 0)).toBe(true);
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        if (terrain.mask.isSolid(x, y)) expect(erased(x, y)).toBe(false);
      }
    }
    expect(render).toHaveBeenCalledTimes(2);
    terrain.destroy();
  });

  it("does not add visual clearing rectangles for a supported crater", () => {
    const terrain = new Terrain({ render: vi.fn() } as unknown as Renderer);
    terrain.build(40, 40);
    terrain.mask = TerrainMask.fromHeightmap(new Float32Array(40).fill(10), 40);
    const rect = vi.spyOn(Graphics.prototype, "rect");
    terrain.carve(20, 10, 4);
    expect(rect).not.toHaveBeenCalled();
    expect(terrain.mask.isSolid(20, 10)).toBe(false);
    expect(terrain.mask.isSolid(20, 30)).toBe(true);
    terrain.destroy();
  });
});
