import { Container, Graphics, Sprite, type Texture } from "pixi.js";
import type { TerrainMask } from "../terrain/mask";
import type { FxTextures } from "./fxTextures";

type BurnVisual = { x: number; radius: number; secondsLeft: number };
type Surface = Pick<TerrainMask, "width" | "height" | "surfaceY">;

const cycle = (time: number, rate: number, phase: number) => (time * rate + phase) % 1;

export class GroundFireRenderer {
  readonly layer = new Container();
  private readonly ground = new Graphics();
  private readonly pool: Sprite[] = [];
  private used = 0;
  private time = 0;

  constructor(private readonly flame: Texture, private readonly fx: Pick<FxTextures, "smoke" | "glow">) {
    this.ground.blendMode = "add";
    this.layer.visible = false;
    this.layer.addChild(this.ground);
  }

  clear(): void {
    this.ground.clear();
    this.layer.visible = false;
    this.time = 0;
    for (let i = 0; i < this.used; i++) this.pool[i]!.visible = false;
    this.used = 0;
  }

  draw(zones: readonly BurnVisual[], surface: Surface, dt: number, motion: boolean): void {
    if (zones.length === 0) {
      if (this.layer.visible) this.clear();
      return;
    }

    this.layer.visible = true;
    this.time += motion ? dt : 0;
    const previous = this.used;
    this.used = 0;
    this.ground.clear();
    for (const zone of zones) {
      const start = Math.max(0, zone.x - zone.radius);
      const end = Math.min(surface.width - 1, zone.x + zone.radius);
      if (start >= end) continue;

      const fade = Math.min(1, zone.secondsLeft / 0.6);
      const points: number[] = [];
      const steps = Math.ceil((end - start) / 3);
      for (let i = 0; i <= steps; i++) {
        const x = start + ((end - start) * i) / steps;
        points.push(x, surface.surfaceY(x));
      }
      this.trace(points, surface.height, 9, 0xee4115, fade * 0.38, 1);
      this.trace(points, surface.height, 2.5, 0xff921e, fade * 0.78, -0.5);

      const phase = zone.x * 0.037;
      const sample = (fraction: number) => Math.round(fraction * steps) * 2;
      if (motion) {
        for (let i = 0; i < 4; i++) {
          const index = sample((i + 0.55) / 4);
          const y = points[index + 1]!;
          if (y >= surface.height) continue;
          const t = cycle(this.time, 0.46 + i * 0.035, phase + i * 0.29);
          const sprite = this.sprite(this.fx.smoke[i % this.fx.smoke.length]!);
          sprite.anchor.set(0.5);
          sprite.position.set(points[index]! + (i % 2 ? 1 : -1) * 12 * t, y - 10 - 43 * t);
          sprite.width = sprite.height = 17 + 27 * t;
          sprite.rotation = (i - 1.5) * 0.25 + t * 0.4;
          sprite.alpha = Math.sin(Math.PI * t) * 0.46 * fade;
          sprite.tint = 0x747782;
          sprite.blendMode = "normal";
        }
      }

      for (let i = 0; i < 9; i++) {
        const index = sample((i + 0.5 + 0.23 * Math.sin(i * 19 + phase)) / 9);
        const y = points[index + 1]!;
        if (y >= surface.height) continue;
        const t = cycle(this.time, 1.45 + (i % 4) * 0.23, phase + i * 0.37);
        const lift = Math.sin(Math.PI * t);
        const sprite = this.sprite(this.flame);
        sprite.anchor.set(0.5, 1);
        sprite.position.set(points[index]!, y + 1);
        sprite.width = 8 + (i % 3) * 2 + lift * 4;
        sprite.height = 8 + ((i * 7) % 9) + lift * 12;
        sprite.scale.x *= i % 2 ? -1 : 1;
        sprite.rotation = Math.sin(this.time * 6 + phase + i * 2.6) * 0.19;
        sprite.alpha = (0.32 + lift * 0.48) * fade;
        sprite.tint = 0xffffff;
        sprite.blendMode = "normal";
      }

      if (!motion) continue;
      for (let i = 0; i < 5; i++) {
        const index = sample((i + 0.7) / 6);
        const y = points[index + 1]!;
        if (y >= surface.height) continue;
        const t = cycle(this.time, 0.95 + i * 0.11, phase + i * 0.47);
        const sprite = this.sprite(this.fx.glow);
        sprite.anchor.set(0.5);
        sprite.position.set(points[index]! + (i - 2) * 8 * t, y - 8 - (22 + i * 3) * t);
        sprite.width = sprite.height = 3 + (i % 2) * 2;
        sprite.rotation = 0;
        sprite.alpha = Math.sin(Math.PI * t) * (1 - t) * fade;
        sprite.tint = 0xffa43d;
        sprite.blendMode = "add";
      }
    }

    for (let i = this.used; i < previous; i++) this.pool[i]!.visible = false;
  }

  private trace(points: readonly number[], height: number, width: number, color: number, alpha: number, offset: number): void {
    let connected = false;
    for (let i = 0; i < points.length; i += 2) {
      const x = points[i]!;
      const y = points[i + 1]!;
      if (y >= height) {
        connected = false;
      } else {
        if (connected) this.ground.lineTo(x, y + offset);
        else this.ground.moveTo(x, y + offset);
        connected = true;
      }
    }
    this.ground.stroke({ width, color, alpha, cap: "round", join: "round" });
  }

  private sprite(texture: Texture): Sprite {
    const index = this.used++;
    let sprite = this.pool[index];
    if (!sprite) {
      sprite = new Sprite(texture);
      this.pool.push(sprite);
      this.layer.addChild(sprite);
    }
    sprite.texture = texture;
    sprite.scale.set(1);
    sprite.visible = true;
    return sprite;
  }
}
