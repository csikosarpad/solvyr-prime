import { createSeededRandom } from "../systems/seededRandom";

export interface RockDetail {
  points: number[];
  light: boolean;
}

export function rockDetails(heightmap: Float32Array, height: number, seed: number): RockDetail[] {
  const random = createSeededRandom(seed ^ 0x726f636b);
  const details: RockDetail[] = [];
  const count = Math.floor(heightmap.length * height / 5500);
  for (let index = 0; index < count; index++) {
    const x = Math.floor(random() * heightmap.length);
    const right = Math.min(x + 24 + Math.floor(random() * 50), heightmap.length - 1);
    if (right <= x) continue;
    let surface = 0;
    for (let column = x; column <= right; column++) {
      surface = Math.max(surface, heightmap[column]!);
    }
    const available = height - surface - 36;
    if (available <= 0) continue;
    const top = surface + 8 + random() * available;
    const bottom = Math.min(height - 1, top + 8 + random() * 20);
    const width = right - x;
    details.push({
      points: [
        x, top + 4, x + width * (0.35 + random() * 0.2), top,
        right, top + 3 + random() * 8, x + width * (0.65 + random() * 0.2), bottom,
        x + width * 0.2, bottom - random() * 5,
      ],
      light: random() > 0.55,
    });
  }
  return details;
}
