import { Graphics } from "pixi.js";
import { structureState, type PlacedStrategicObjective, type StructureState } from "../systems/strategicObjectives";
import type { TerrainMask } from "../terrain/mask";

export class StrategicObjectiveGraphics extends Graphics {
  private elapsed = 0;

  draw(
    objectives: readonly PlacedStrategicObjective[],
    terrain: TerrainMask,
    dt: number,
    motionEnabled: boolean,
    forgeReactor = false,
  ): void {
    this.clear();
    if (motionEnabled) this.elapsed += dt;
    for (const objective of objectives) {
      const { worldX: x, worldY: y, width, height } = objective;
      const left = x - width / 2;
      const top = y - height;
      const state = structureState(objective.hp, objective.maxHp);
      const destroyed = state === "DESTROYED";
      const damaged = state === "DAMAGED";
      const color = destroyed ? 0x606773 : objective.type === "ENERGY_NODE" ? 0x4abaff : 0xf1f4fa;
      const alpha = damaged && motionEnabled ? 0.65 + Math.sin(this.elapsed * 8) * 0.15 : 0.9;

      for (let offset = 0; offset < width; offset += 4) {
        const ground = terrain.surfaceY(left + offset);
        const foundationTop = Math.min(y - 4, ground);
        this.rect(left + offset, foundationTop, Math.min(4, width - offset), Math.max(4, ground - foundationTop)).fill(
          0x434d60,
        );
      }

      if (forgeReactor && objective.type === "ENERGY_NODE") {
        this.drawReactor(left, top, width, height, state, alpha);
      } else if (destroyed) {
        this.poly([left, y - 4, left + 8, y - 12, x - 3, y - 7, x + 8, y - 16, left + width, y - 4])
          .fill(0x262c36)
          .stroke({ color, width: 2 });
        this.moveTo(left + 9, y - 4)
          .lineTo(x - 6, y - 11)
          .stroke({ color: 0x111722, width: 3 });
      } else if (objective.type === "ENERGY_NODE") {
        this.roundRect(left, top + 7, width, height - 11, 4)
          .fill({ color: 0x143953, alpha })
          .stroke({ color, width: 2 });
        this.rect(x - 12, top, 24, 8).fill(color);
        this.poly([
          x + 3,
          top + 12,
          x - 9,
          top + 26,
          x - 1,
          top + 26,
          x - 4,
          y - 9,
          x + 10,
          top + 21,
          x + 2,
          top + 21,
        ]).fill({ color, alpha });
      } else if (objective.type === "RESEARCH_LAB") {
        this.roundRect(left, top + 8, width, height - 12, 3)
          .fill({ color: 0xc3d3de, alpha })
          .stroke({ color: 0x62efff, width: 2 });
        this.rect(left + 8, top, width - 16, 8).fill(0xf1f4fa);
        for (let offset = 10; offset < width - 8; offset += 14)
          this.rect(left + offset, top + 16, 8, 10).fill({ color: 0x62efff, alpha });
        this.rect(x - 6, y - 16, 12, 12).fill(0x24465c);
      } else {
        this.moveTo(left + 2, y - 4)
          .bezierCurveTo(left + 2, top + 7, x - width / 4, top, x, top)
          .bezierCurveTo(x + width / 4, top, left + width - 2, top + 7, left + width - 2, y - 4)
          .closePath()
          .fill({ color: 0x465366, alpha })
          .stroke({ color, width: 2 });
        this.rect(left - 2, y - 7, width + 4, 7).fill(0x434d60);
        this.poly([x - 10, y - 14, x, y - 24, x + 10, y - 14]).stroke({ color, width: 2 });
        this.rect(x - 6, y - 14, 12, 10).stroke({ color, width: 2 });
      }

      if (damaged) {
        this.moveTo(x - 7, top + 7)
          .lineTo(x + 3, top + 18)
          .lineTo(x - 3, top + 27)
          .stroke({ color: 0xffb454, width: 2 });
        const drift = motionEnabled ? Math.sin(this.elapsed * 2) * 3 : 0;
        this.circle(x + 10 + drift, top - 6, 5).fill({ color: 0x8993a4, alpha: 0.55 });
        this.circle(x + 13 + drift, top - 14, 7).fill({ color: 0x8993a4, alpha: 0.3 });
      }

      this.rect(left, top - 9, width, 4).fill(0x101724);
      this.rect(left, top - 9, width * (objective.hp / objective.maxHp), 4).fill(
        destroyed ? 0xff6464 : damaged ? 0xffb454 : color,
      );
    }
  }

  private drawReactor(
    left: number,
    top: number,
    width: number,
    height: number,
    state: StructureState,
    alpha: number,
  ): void {
    const x = (fraction: number) => left + width * fraction;
    const y = (fraction: number) => top + height * fraction;
    if (state === "DESTROYED") {
      this.poly([
        x(0),
        y(0.9),
        x(0.13),
        y(0.6),
        x(0.32),
        y(0.7),
        x(0.46),
        y(0.48),
        x(0.64),
        y(0.75),
        x(0.82),
        y(0.58),
        x(1),
        y(0.9),
      ])
        .fill(0x29303b)
        .stroke({ color: 0x66707b, width: 1 });
      this.moveTo(x(0.17), y(0.84))
        .lineTo(x(0.38), y(0.67))
        .lineTo(x(0.53), y(0.79))
        .stroke({ color: 0x101923, width: 2 });
      this.rect(x(0.7), y(0.72), width * 0.12, height * 0.12).fill({ color: 0x8b542f, alpha: 0.6 });
      return;
    }

    this.poly([x(0.04), y(0.84), x(0.1), y(0.3), x(0.25), y(0.2), x(0.75), y(0.2), x(0.9), y(0.3), x(0.96), y(0.84)])
      .fill(0x263e50)
      .stroke({ color: 0x7293a3, width: 1 });
    this.poly([x(0.1), y(0.34), x(0.26), y(0.26), x(0.26), y(0.77), x(0.1), y(0.84)]).fill(0x192c3c);
    this.poly([x(0.74), y(0.26), x(0.9), y(0.34), x(0.9), y(0.84), x(0.74), y(0.77)]).fill(0x122432);
    this.roundRect(x(0.3), y(0.31), width * 0.4, height * 0.42, 3)
      .fill(0x071c2a)
      .stroke({ color: 0x4abaff, width: 1 });
    this.circle(x(0.5), y(0.52), width * 0.11)
      .fill({ color: state === "DAMAGED" ? 0xffaa55 : 0x5bdcff, alpha })
      .stroke({ color: 0xd5f8ff, alpha: 0.8, width: 1 });
    this.rect(x(0.27), y(0.08), width * 0.46, height * 0.14).fill(0x455b69);
    this.rect(x(0.36), y(0.02), width * 0.28, height * 0.08).fill(0x8aafbd);
    this.rect(x(0.02), y(0.82), width * 0.96, height * 0.12).fill(0x172b39);
    this.moveTo(x(0.15), y(0.42))
      .lineTo(x(0.15), y(0.7))
      .moveTo(x(0.85), y(0.42))
      .lineTo(x(0.85), y(0.7))
      .stroke({ color: 0x75b9ca, alpha: 0.65, width: 1 });
  }
}
