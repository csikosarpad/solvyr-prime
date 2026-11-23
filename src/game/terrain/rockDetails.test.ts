import { describe, expect, it } from "vitest";
import { rockDetails } from "./rockDetails";
import { generateSectorHeightmap } from "./heightmap";

describe("rockDetails", () => {
  it("generates seed-stable details entirely inside the undamaged ground", () => {
    const heightmap = generateSectorHeightmap(1280, 720, 42, null);
    const details = rockDetails(heightmap, 720, 42);
    expect(details.length).toBeGreaterThan(50);
    expect(details).toEqual(rockDetails(heightmap, 720, 42));
    expect(details).not.toEqual(rockDetails(heightmap, 720, 43));
    for (const detail of details) {
      const xs = detail.points.filter((_, index) => index % 2 === 0);
      const ys = detail.points.filter((_, index) => index % 2 === 1);
      const maxSurface = Math.max(...heightmap.slice(Math.floor(Math.min(...xs)), Math.ceil(Math.max(...xs)) + 1));
      expect(Math.min(...ys)).toBeGreaterThan(maxSurface);
      expect(Math.max(...ys)).toBeLessThan(720);
    }
  });

  it("handles terrain too small for details", () => {
    expect(rockDetails(new Float32Array(10).fill(8), 10, 1)).toEqual([]);
  });
});
