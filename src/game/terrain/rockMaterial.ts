import { Container, Graphics, RenderTexture, TilingSprite, type Renderer } from "pixi.js";
import { createSeededRandom } from "../systems/seededRandom";
import type { Theme } from "../theme";

const TILE_SIZE = 256;

export function createRockMaterial(
  renderer: Renderer,
  heightmap: Float32Array,
  height: number,
  seed: number,
  colors: Theme["terrain"],
): { layer: Container; tile: RenderTexture } {
  const width = heightmap.length;
  const random = createSeededRandom(seed ^ 0x74696c65);
  const tile = RenderTexture.create({ width: TILE_SIZE, height: TILE_SIZE });
  const pattern = new Graphics();

  for (let i = 0; i < 900; i++) {
    const x = random() * TILE_SIZE;
    const y = random() * TILE_SIZE;
    const radius = 0.6 + random() * 2.8;
    const color = random() < 0.48 ? colors.soilLight : colors.soilDeep;
    const alpha = 0.09 + random() * 0.17;
    for (const dx of [-TILE_SIZE, 0, TILE_SIZE]) {
      for (const dy of [-TILE_SIZE, 0, TILE_SIZE]) {
        pattern.ellipse(x + dx, y + dy, radius * 1.7, radius).fill({ color, alpha });
      }
    }
  }
  renderer.render({ container: pattern, target: tile });
  pattern.destroy();

  const texture = new TilingSprite({ texture: tile, width, height });
  const shade = new Graphics();
  const bands = 64;
  for (let i = 0; i < bands; i++) {
    const top = Math.floor((height * i) / bands);
    const bottom = Math.floor((height * (i + 1)) / bands);
    if (bottom > top) {
      shade.rect(0, top, width, bottom - top).fill({ color: 0x050a12, alpha: 0.3 * ((i + 1) / bands) ** 2 });
    }
  }

  const mask = new Graphics().moveTo(0, height);
  heightmap.forEach((y, x) => mask.lineTo(x, y));
  mask.lineTo(width, height).closePath().fill(0xffffff);
  const layer = new Container();
  layer.addChild(texture, shade, mask);
  layer.mask = mask;
  return { layer, tile };
}
