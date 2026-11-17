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
