import { Graphics } from "pixi.js";
import { structureState, type PlacedStrategicObjective } from "../systems/strategicObjectives";
import type { TerrainMask } from "../terrain/mask";

export class StrategicObjectiveGraphics extends Graphics {
  private elapsed = 0;

  draw(
    objectives: readonly PlacedStrategicObjective[],
    terrain: TerrainMask,
    dt: number,
    motionEnabled: boolean,
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

      if (destroyed) {
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
}
