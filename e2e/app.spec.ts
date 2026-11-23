import { expect, test, type Page } from "@playwright/test";

async function openMainMenu(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Solvyr Prime: Siege Protocol" })).toBeVisible();
  await page.getByRole("button", { name: "START" }).click();

  const menu = page.getByRole("navigation", { name: "Solvyr Prime: Siege Protocol" });
  await expect(menu).toBeVisible();
  return menu;
}

test("main menu opens Settings and starts a game", async ({ page }) => {
  const menu = await openMainMenu(page);

  await expect(menu.getByRole("button", { name: "Settings" })).toBeVisible();
  await menu.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await page.getByRole("button", { name: "Back" }).click();

  await menu.getByRole("button", { name: "Start game" }).click();
  await expect(page.getByRole("button", { name: "FIRE!" })).toBeVisible();
  await expect(page.getByRole("region", { name: "P1", exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "P2", exact: true })).toBeVisible();
});

test("Settings switches the language between English and Hungarian", async ({ page }) => {
  await (await openMainMenu(page)).getByRole("button", { name: "Settings" }).click();

  await page.locator("summary").filter({ hasText: "Language" }).click();
  await page.getByRole("group", { name: "Language" }).getByRole("button", { name: "Magyar" }).click();
  await expect(page.getByRole("heading", { name: "Beállítások" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "hu");

  await page.getByRole("group", { name: "Nyelv" }).getByRole("button", { name: "English" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("Settings previews and remembers armor and accent colors independently", async ({ page }) => {
  test.setTimeout(120_000);
  async function openTankColors() {
    const menu = await openMainMenu(page);
    await menu.getByRole("button", { name: "Settings" }).click();
    await page.locator("summary").filter({ hasText: "Players" }).click();
  }

  await openTankColors();
  const p1 = page.getByRole("group", { name: "P1 tank color" });
  const p2 = page.getByRole("group", { name: "P2 tank color" });
  const p1Preview = p1.locator(".player-color-preview svg");
  const p2Preview = p2.locator(".player-color-preview svg");
  await expect(p1Preview).toBeVisible();
  await expect(page.locator(".player-color-preview svg")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "P1", exact: true })).toHaveAttribute("aria-pressed", "true");
  const p1Markings = p1Preview.locator("filter").first().locator("feColorMatrix");
  const originalMarkings = await p1Markings.getAttribute("values");
  const olive = page.getByRole("button", { name: "P1 armor color: Olive green" });
  const gold = page.getByRole("button", { name: "P1: Gold", exact: true });
  const barrel = p1Preview.locator("image[transform]");
  await olive.click();
  await expect(p1Preview.locator("image[filter]")).toHaveCount(3);
  const paintFilter = p1Preview.locator("filter").last();
  const armorFilter = paintFilter.locator("feColorMatrix");
  await expect(barrel).toHaveAttribute("filter", `url(#${await paintFilter.getAttribute("id")})`);
  const oliveTint = await armorFilter.getAttribute("values");
  await gold.click();
  await expect(p1Markings).not.toHaveAttribute("values", originalMarkings!);
  await expect(armorFilter).toHaveAttribute("values", oliveTint!);
  await page.getByRole("button", { name: "P2", exact: true }).click();
  await expect(p2Preview).toBeVisible();
  await expect(page.locator(".player-color-preview svg")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "P2", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "P2 armor color: Steel gray" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "P2 armor color: Blue" }).click();
  await page.getByRole("button", { name: "P1", exact: true }).click();
  await expect(olive).toHaveAttribute("aria-pressed", "true");
  await expect(gold).toHaveAttribute("aria-pressed", "true");

  await openTankColors();
  await expect(olive).toHaveAttribute("aria-pressed", "true");
  await expect(gold).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "P2", exact: true }).click();
  await expect(page.getByRole("button", { name: "P2 armor color: Blue" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "P1", exact: true }).click();
  await page.getByRole("button", { name: "P1 armor color: Steel gray" }).click();
  await expect(p1Preview.locator("image[filter]")).toHaveCount(3);
  await expect(gold).toHaveAttribute("aria-pressed", "true");
});

test("Settings constrains, persists and resets tank lightness", async ({ page }) => {
  test.setTimeout(120_000);
  await (await openMainMenu(page)).getByRole("button", { name: "Settings" }).click();
  await page.locator("summary").filter({ hasText: "Players" }).click();
  const p1 = page.getByRole("group", { name: "P1 tank color" });
  const p2 = page.getByRole("group", { name: "P2 tank color" });
  const lightness = p1.getByRole("slider", { name: "Lightness" });
  const distance = p1.getByRole("slider", { name: "Distance from armor" });
  const players = page.locator("details").filter({ has: page.locator("summary").filter({ hasText: "Players" }) });
  const resetColors = players.getByRole("button", { name: "Reset colors", exact: true });
  await expect(resetColors).toBeDisabled();
  await lightness.press("Home");
  await expect(lightness).toHaveValue("15");
  await distance.press("End");
  await expect(distance).toHaveValue("70");
  await lightness.press("End");
  await lightness.press("ArrowLeft");
  await expect(distance).toHaveValue("65");
  await lightness.press("Home");
  await lightness.press("ArrowRight");
  await expect(distance).toHaveValue("65");
  await distance.press("Home");
  await expect(distance).toHaveValue("25");
  await expect(p1.locator(".color-warning")).toContainText("The marking blends into the armor.");
  await page.getByRole("button", { name: "P2", exact: true }).click();
  await expect(p2.getByRole("slider", { name: "Lightness" })).toHaveValue("50");
  await page.getByRole("button", { name: "P1", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "START" }).click();
  await page.getByRole("button", { name: "Settings" }).click();
  await page.locator("summary").filter({ hasText: "Players" }).click();
  await expect(lightness).toHaveValue("20");
  await expect(distance).toHaveValue("25");
  await page.getByRole("button", { name: "Reset P1 colors" }).click();
  await expect(lightness).toHaveValue("50");
  await expect(distance).toHaveValue("35");
  await expect(resetColors).toBeDisabled();
  await page.getByRole("button", { name: "Undo color reset" }).click();
  await expect(lightness).toHaveValue("20");
  await expect(distance).toHaveValue("25");
  await page.getByRole("button", { name: "Reset P1 colors" }).click();
  await page.getByRole("button", { name: "P2", exact: true }).click();
  await p2.getByRole("slider", { name: "Lightness" }).press("End");
  await resetColors.click();
  await expect(p2.getByRole("slider", { name: "Lightness" })).toHaveValue("50");
  await page.getByRole("button", { name: "Undo color reset" }).click();
  await expect(p2.getByRole("slider", { name: "Lightness" })).toHaveValue("85");
});

test("Settings adjusts volume and toggles sound on and off", async ({ page }) => {
  await (await openMainMenu(page)).getByRole("button", { name: "Settings" }).click();
  await page.locator("summary").filter({ hasText: "Sound" }).click();

  const soundSwitch = page.getByRole("switch", { name: "Comms: active (M)" });
  await expect(soundSwitch).toHaveAttribute("aria-checked", "true");
  await soundSwitch.click();
  const mutedSwitch = page.getByRole("switch", { name: "Comms: muted (M)" });
  await expect(mutedSwitch).toHaveAttribute("aria-checked", "false");
  await mutedSwitch.click();
  await expect(page.getByRole("switch", { name: "Comms: active (M)" })).toHaveAttribute("aria-checked", "true");

  const volume = page.getByRole("slider", { name: "Game volume" });
  await volume.press("Home");
  await expect(volume).toHaveValue("0");
  await expect(page.locator('output[for="master-volume"]')).toHaveText("0%");
  await volume.press("ArrowRight");
  await expect(volume).toHaveValue("1");
  await expect(page.locator('output[for="master-volume"]')).toHaveText("1%");
});

test("Settings keeps mobile controls usable and requires a selection before deleting", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await (await openMainMenu(page)).getByRole("button", { name: "Settings" }).click();
  const checkTarget = async (selector: string, minimum: number) => {
    const sizes = await page.locator(selector).evaluateAll((elements) =>
      elements.map((element) => {
        const bounds = element.getBoundingClientRect();
        return { width: bounds.width, height: bounds.height };
      }),
    );
    expect(sizes.length).toBeGreaterThan(0);
    for (const size of sizes) {
      expect(size.width).toBeGreaterThanOrEqual(minimum);
      expect(size.height).toBeGreaterThanOrEqual(minimum);
    }
  };

  await checkTarget(".settings-close, .main-menu-back", 44);
  const sound = page.locator("details").filter({ has: page.locator("summary").filter({ hasText: "Sound" }) });
  const language = page.locator("details").filter({ has: page.locator("summary").filter({ hasText: "Language" }) });
  await language.locator("summary").click();
  await checkTarget(".language-switch button", 44);
  await sound.locator("summary").click();
  await checkTarget(".settings-group summary", 52);
  await checkTarget(".settings-audio-card .audio-switch, .settings-audio-card input[type=range]", 44);
  await sound.getByRole("switch", { name: "Music", exact: true }).click();
  await expect(sound.getByRole("switch", { name: "Music", exact: true })).toHaveAttribute("aria-checked", "false");

  const players = page.locator("details").filter({ has: page.locator("summary").filter({ hasText: "Players" }) });
  await players.locator("summary").click();
  await checkTarget(".player-name-fields input, .player-color-selector button, .player-color-option, .color-reset, .color-slider input", 44);
  const opponent = players.getByRole("group", { name: "Opponent (offline)" });
  await opponent.getByRole("button", { name: "Second player" }).click();
  await expect(opponent.getByRole("button", { name: "Second player" })).toHaveAttribute("aria-pressed", "true");
  await opponent.getByRole("button", { name: "Machine (AI)" }).click();
  await expect(opponent.getByRole("button", { name: "Machine (AI)" })).toHaveAttribute("aria-pressed", "true");

  const gameplay = page.locator("details").filter({ has: page.locator("summary").filter({ hasText: "Gameplay" }) });
  await gameplay.locator("summary").click();
  const reset = gameplay.getByRole("button", { name: "Delete selected" });
  const options = gameplay.getByRole("switch");
  await expect(options).toHaveCount(4);
  for (const option of await options.all()) await expect(option).toHaveAttribute("aria-checked", "false");
  await expect(reset).toBeDisabled();
  await checkTarget(".game-reset-options .audio-switch, .game-reset-button", 44);
  expect((await reset.boundingBox())!.height).toBeGreaterThanOrEqual(48);
  await page.setViewportSize({ width: 320, height: 844 });
  const panel = page.locator(".settings-menu-panel");
  expect(await panel.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await options.first().click();
  await expect(reset).toBeEnabled();
  await reset.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await checkTarget(".confirm-dialog-actions button", 44);
  const bounds = await dialog.boundingBox();
  expect(bounds).not.toBeNull();
  expect(Math.abs(bounds!.y + bounds!.height - 844)).toBeLessThanOrEqual(1);
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).not.toBeVisible();
  await options.first().click();
  await expect(reset).toBeDisabled();
  await page.getByRole("button", { name: "Close settings" }).click();
  await expect(page.getByRole("button", { name: "Settings" })).toBeVisible();
});

test("Campaign Map deploys to SECTOR ALPHA-01", async ({ page }) => {
  await (await openMainMenu(page)).getByRole("button", { name: "Campaign Map" }).click();
  await expect(page.getByRole("heading", { name: "Campaign Map" })).toBeVisible();

  const alphaSector = page.getByRole("button", { name: "SECTOR ALPHA-01, Training Grounds, Available" });
  await expect(alphaSector).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: "Training Grounds" })).toBeVisible();
  await page.getByRole("button", { name: "Deploy to sector" }).click();

  const battlefield = page.getByLabel("Battlefield");
  await expect(battlefield).toContainText("SECTOR ALPHA-01");
  await expect(battlefield).toContainText("Training Grounds");
  await expect(page.getByRole("button", { name: "Return to map" })).toBeVisible();
});
