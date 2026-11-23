import { Container, Graphics, Sprite, type Texture } from "pixi.js";
import type { TerrainMask } from "../terrain/mask";
import { strategicExplosionDamage, structureState, type StrategicObjectivePlacement } from "../systems/strategicObjectives";

export interface BuildingDecorTextures {
  radar: Texture;
  defense: Texture;
  foundry: Texture;
}

const placements: Record<string, readonly { kind: keyof BuildingDecorTextures; x: number; width: number; height: number }[]> = {
  "forge-17": [{ kind: "foundry", x: 0.5, width: 185, height: 110 }],
  "vanguard-12": [
    { kind: "radar", x: 0.32, width: 85, height: 145 },
    { kind: "defense", x: 0.7, width: 130, height: 115 },
  ],
};

export class BuildingDecor extends Container {
  readonly healthBars = new Graphics();
  private textures: BuildingDecorTextures | null = null;
  private buildings: { sprite: Sprite; hp: number }[] = [];

  setTextures(textures: BuildingDecorTextures): void {
    this.textures = textures;
  }

  draw(sectorId: string, terrain: TerrainMask, objectives: readonly StrategicObjectivePlacement[] = []): void {
    for (const child of this.removeChildren()) child.destroy();
    this.buildings = [];
    this.healthBars.clear();
    if (!this.textures) return;
    for (const placement of placements[sectorId] ?? []) {
      const texture = this.textures[placement.kind];
      const sprite = new Sprite(texture);
      const candidates = placement.kind === "foundry" ? [0.27, 0.5, 0.73] : [placement.x];
      const clearance = (fraction: number) => Math.min(
        ...objectives.map((objective) =>
          Math.abs(terrain.width * fraction - objective.worldX) - (placement.width + objective.width) / 2),
        terrain.width,
      );
      const best = candidates.reduce((a, b) => clearance(b) > clearance(a) ? b : a);
      const x = terrain.width * best;
      sprite.anchor.set(0.5, 1);
      sprite.position.set(x, terrain.surfaceY(x) + 10);
      sprite.scale.set(Math.min(placement.width / texture.width, placement.height / texture.height));
      sprite.alpha = 0.65;
      this.addChild(sprite);
      this.buildings.push({ sprite, hp: 100 });
    }
    this.drawHealthBars();
  }

  applyExplosion(x: number, y: number, radius: number, damage: number): void {
    for (const building of this.buildings) {
      if (structureState(building.hp, 100) === "DESTROYED") continue;
      const { sprite } = building;
      const left = sprite.x - sprite.width / 2;
      const top = sprite.y - sprite.height;
      const dx = Math.max(left - x, 0, x - (left + sprite.width));
      const dy = Math.max(top - y, 0, y - sprite.y);
      building.hp = Math.max(0, building.hp - strategicExplosionDamage(Math.hypot(dx, dy), radius, damage));
      const state = structureState(building.hp, 100);
      sprite.tint = state === "DESTROYED" ? 0x555555 : state === "DAMAGED" ? 0x999999 : 0xffffff;
    }
    this.drawHealthBars();
  }

  private drawHealthBars(): void {
    this.healthBars.clear();
    for (const { sprite, hp } of this.buildings) {
      const width = Math.min(64, sprite.width);
      const x = sprite.x - width / 2;
      const y = sprite.y - sprite.height - 9;
      const state = structureState(hp, 100);
      this.healthBars.rect(x, y, width, 4).fill(0x101724);
      this.healthBars.rect(x, y, width * hp / 100, 4).fill(
        state === "DESTROYED" ? 0xff6464 : state === "DAMAGED" ? 0xffb454 : 0x4abaff,
      );
    }
  }
}
