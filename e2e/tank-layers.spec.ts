import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

test("tank layers reconstruct the original body", async ({ page }) => {
  const names = ["tank-body.svg", "tank-chassis.svg", "tank-armor.svg", "tank-details.svg"];
  const svgs = names.map((name) => readFileSync(join(process.cwd(), "src", "game", "assets", "tank", name), "utf8"));

  for (const width of [24, 72, 240]) {
    const sources = svgs.map((svg) =>
      `data:image/svg+xml;base64,${Buffer.from(svg.replace(
        'width="24" height="12"',
        `width="${width}" height="${width / 2}"`,
      )).toString("base64")}`,
    );
    const maxDifference = await page.evaluate(async ({ sources, width }) => {
      const images = await Promise.all(sources.map((src) => new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Failed to load tank SVG"));
        image.src = src;
      })));

      function render(layers: HTMLImageElement[]): Uint8ClampedArray {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = width / 2;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas 2D context unavailable");
        layers.forEach((image) => context.drawImage(image, 0, 0));
        return context.getImageData(0, 0, canvas.width, canvas.height).data;
      }

      const original = render([images[0]!]);
      const composite = render(images.slice(1));
      let max = 0;
      for (let i = 0; i < original.length; i++) {
        max = Math.max(max, Math.abs(original[i]! - composite[i]!));
      }
      return max;
    }, { sources, width });

    expect(maxDifference, `Raster width ${width}`).toBeLessThanOrEqual(1);
  }
});
