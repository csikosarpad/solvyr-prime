import { Graphics, Sprite, Texture } from "pixi.js";
import { describe, expect, it } from "vitest";
import { GroundFireRenderer } from "./GroundFireRenderer";

const surface = { width: 120, height: 100, surfaceY: (x: number) => 20 + x * 0.5 };
const zone = { x: 60, radius: 42, secondsLeft: 3 };
const makeRenderer = () => new GroundFireRenderer(Texture.WHITE, { smoke: [Texture.WHITE], glow: Texture.WHITE });
const sprites = (fire: GroundFireRenderer) =>
  fire.layer.children.filter((child): child is Sprite => child instanceof Sprite && child.visible);

describe("GroundFireRenderer", () => {
  it("traces the sloped surface, anchors the flames, and reuses sprites as smoke rises", () => {
    const fire = makeRenderer();
    fire.draw([zone], surface, 0, true);
    const glow = fire.layer.children[0];
    expect(glow).toBeInstanceOf(Graphics);
    expect(glow?.getLocalBounds().width).toBeGreaterThan(zone.radius * 2);
    expect(glow?.getLocalBounds().height).toBeGreaterThan(zone.radius);
    const first = sprites(fire);
    const flame = first.find((sprite) => sprite.anchor.y === 1)!;
    expect(flame.y).toBe(surface.surfaceY(flame.x) + 1);
    const smoke = first[0]!;
    const smokeY = smoke.y;

    fire.draw([zone], surface, 0.1, true);
    expect(sprites(fire)).toEqual(first);
    expect(smoke.y).toBeLessThan(smokeY);
    expect(flame.y).toBe(surface.surfaceY(flame.x) + 1);

    fire.draw([], surface, 0.1, true);
    expect(sprites(fire)).toHaveLength(0);
    expect(glow?.getLocalBounds().width).toBe(0);
    fire.layer.destroy({ children: true });
  });

  it("keeps the flames still on reduced motion and skips columns without ground", () => {
    const fire = makeRenderer();
    const gap = { ...surface, surfaceY: (x: number) => x > 45 && x < 75 ? surface.height : surface.surfaceY(x) };
    fire.draw([zone], gap, 0, false);
    const flames = sprites(fire);
    expect(flames.length).toBeGreaterThan(0);
    expect(flames.every((sprite) => sprite.anchor.y === 1 && gap.surfaceY(sprite.x) < gap.height)).toBe(true);
    const heights = flames.map((sprite) => sprite.height);

    fire.draw([zone], gap, 1, false);
    expect(sprites(fire).map((sprite) => sprite.height)).toEqual(heights);
    fire.layer.destroy({ children: true });
  });
});
