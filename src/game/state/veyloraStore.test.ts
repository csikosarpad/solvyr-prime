import { beforeEach, describe, expect, it, vi } from "vitest";
import { IDBFactory, IDBObjectStore } from "fake-indexeddb";
import { VEYLORA } from "../data/campaignContent";
import { applyCampaignUpgrades, parseCampaignSave, rewardKey } from "../systems/campaignEconomy";
import { BASE_STATS } from "../data/upgrades";
import { campaignTransaction, CAMPAIGN_DATABASE } from "./campaignDatabase";
import { useVeyloraStore, VEYLORA_STORAGE_KEY } from "./veyloraStore";

const state = () => useVeyloraStore.getState();
const complete = (id: string) => state().complete(id, state().economy.generation);

describe("transactional campaign economy", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.stubGlobal("indexedDB", new IDBFactory());
    localStorage.clear();
    await state().resetEconomy();
  });

  it("atomically persists progress, 20 ore and one permanent blueprint, never granting repeats", async () => {
    localStorage.setItem("ballistic-front:campaign", "legacy");
    localStorage.setItem("ballistic-front:profiles", "profiles");
    expect(await state().select("secure-lab")).toBe(true);
    expect(await complete("secure-lab")).toBe(true);
    expect(await complete("secure-mine")).toBe(true);
    expect(await complete("secure-mine")).toBe(true);
    expect(await complete("secure-lab")).toBe(true);
    expect(state().economy.resources).toEqual({ "industrial-ore": 20 });
    expect(state().economy.technologies).toEqual(["materials-blueprint"]);
    expect(Object.keys(state().economy.claims)).toHaveLength(2);
    expect((await campaignTransaction()).progress[VEYLORA.sector.id]).toEqual({
      selectedMissionId: "secure-lab",
      completedMissionIds: ["secure-lab", "secure-mine"],
    });
    expect(localStorage.getItem("ballistic-front:campaign")).toBe("legacy");
    expect(localStorage.getItem("ballistic-front:profiles")).toBe("profiles");
  });

  it("serializes simultaneous reward callbacks from separate store instances without duplication or loss", async () => {
    vi.resetModules();
    const other = (await import("./veyloraStore")).useVeyloraStore;
    await other.getState().refresh();
    const generation = state().economy.generation;
    const results = await Promise.all([
      state().complete("secure-mine", generation),
      other.getState().complete("secure-mine", generation),
      other.getState().complete("secure-lab", generation),
    ]);
    expect(results).toEqual([true, true, true]);
    const saved = await campaignTransaction();
    expect(saved.resources["industrial-ore"]).toBe(20);
    expect(saved.technologies).toEqual(["materials-blueprint"]);
    expect(saved.progress[VEYLORA.sector.id]!.completedMissionIds).toHaveLength(2);
  });

  it("enforces both purchase prerequisites and consumes only ore, exactly once under concurrent purchases", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await state().buy("reinforced-shield")).toBe(false);
    expect(state().error).toBe("economy.missingTechnology");
    await complete("secure-lab");
    expect(await state().buy("reinforced-shield")).toBe(false);
    expect(state().error).toBe("economy.missingResources");
    await complete("secure-mine");
    expect(await Promise.all([state().buy("reinforced-shield"), state().buy("reinforced-shield")])).toEqual([
      true,
      false,
    ]);
    const saved = await campaignTransaction();
    expect(saved.resources["industrial-ore"]).toBe(0);
    expect(saved.technologies).toEqual(["materials-blueprint"]);
    expect(saved.purchases["reinforced-shield"]).toEqual({ contentVersion: 1, maxEnergyShieldMultiplier: 1.1 });
    expect(applyCampaignUpgrades(BASE_STATS, saved).maxEnergyShield).toBe(0);
    expect(applyCampaignUpgrades({ ...BASE_STATS, maxEnergyShield: 100 }, saved).maxEnergyShield).toBeCloseTo(110);
    const recipe = VEYLORA.recipes[0]!;
    const mission = VEYLORA.missions[0]!;
    const originalCost = recipe.cost["industrial-ore"]!;
    const originalReward = mission.rewards.resources["industrial-ore"]!;
    try {
      recipe.effect.maxEnergyShieldMultiplier = 1.5;
      recipe.cost["industrial-ore"] = 40;
      mission.rewards.resources["industrial-ore"] = 60;
      await state().refresh();
      await complete("secure-mine");
      expect(state().economy.resources["industrial-ore"]).toBe(0);
      expect(state().economy.claims[rewardKey("secure-mine")]!.rewards.resources["industrial-ore"]).toBe(20);
      expect(
        applyCampaignUpgrades({ ...BASE_STATS, maxEnergyShield: 100 }, state().economy).maxEnergyShield,
      ).toBeCloseTo(110);
    } finally {
      recipe.effect.maxEnergyShieldMultiplier = 1.1;
      recipe.cost["industrial-ore"] = originalCost;
      mission.rewards.resources["industrial-ore"] = originalReward;
    }
  });

  it("preserves wealth, purchases and claims across sector reset; only full economic reset reopens rewards", async () => {
    await complete("secure-mine");
    await complete("secure-lab");
    await state().buy("reinforced-shield");
    const before = structuredClone(state().economy);
    await state().reset();
    expect(state().completedMissionIds).toEqual([]);
    expect(state().economy).toMatchObject({
      resources: before.resources,
      technologies: before.technologies,
      purchases: before.purchases,
      claims: before.claims,
    });
    await complete("secure-mine");
    expect(state().economy.resources["industrial-ore"]).toBe(0);
    await state().resetEconomy();
    expect(state().economy.generation).not.toBe(before.generation);
    expect(state().completedMissionIds).toEqual([]);
    expect(state().economy).toMatchObject({ resources: {}, technologies: [], claims: {}, purchases: {} });
    await complete("secure-mine");
    expect(state().economy.resources["industrial-ore"]).toBe(20);
  });

  it("does not commit any reward, claim or completion on quota failure and allows retry", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const before = structuredClone(state().economy);
    vi.spyOn(IDBObjectStore.prototype, "put").mockImplementationOnce(() => {
      throw new Error("quota");
    });
    expect(await complete("secure-mine")).toBe(false);
    expect(state().economy).toEqual(before);
    expect(state().error).toBe("veylora.saveError");
    expect(await campaignTransaction()).toEqual(before);
    expect(await complete("secure-mine")).toBe(true);
    expect(state().economy.resources["industrial-ore"]).toBe(20);
  });

  it("rolls back failed purchase and failed full reset, including reward eligibility", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await complete("secure-mine");
    await complete("secure-lab");
    const before = structuredClone(state().economy);
    const put = vi.spyOn(IDBObjectStore.prototype, "put");
    put.mockImplementationOnce(() => {
      throw new Error("quota");
    });
    expect(await state().buy("reinforced-shield")).toBe(false);
    expect(await campaignTransaction()).toEqual(before);
    put.mockImplementationOnce(() => {
      throw new Error("quota");
    });
    expect(await state().resetEconomy()).toBe(false);
    expect(await campaignTransaction()).toEqual(before);
    expect(state().economy).toEqual(before);
  });

  it("rejects completion and retry from a battle started before an economic reset in another tab", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const oldGeneration = state().economy.generation;
    await state().resetEconomy();
    expect(await state().complete("secure-mine", oldGeneration)).toBe(false);
    expect(state().error).toBe("economy.resetDuringBattle");
    expect(state().economy.claims).toEqual({});
    expect((await campaignTransaction()).resources).toEqual({});
  });

  it("migrates prototype progress without retroactive rewards; replay can earn the first economic reward", async () => {
    vi.stubGlobal("indexedDB", new IDBFactory());
    const legacy = JSON.stringify({
      version: 1,
      contentVersion: 1,
      sectorId: VEYLORA.sector.id,
      selectedMissionId: "secure-lab",
      completedMissionIds: ["secure-mine", "secure-lab"],
    });
    localStorage.setItem(VEYLORA_STORAGE_KEY, legacy);
    await state().refresh();
    expect(state().completedMissionIds).toEqual(["secure-mine", "secure-lab"]);
    expect(state().economy.claims).toEqual({});
    await complete("secure-mine");
    expect(state().economy.resources["industrial-ore"]).toBe(20);
    expect(localStorage.getItem(VEYLORA_STORAGE_KEY)).toBe(legacy);
  });

  it.each([
    "broken JSON",
    "null",
    '{"version":99}',
    JSON.stringify({
      version: 1,
      contentVersion: 1,
      sectorId: VEYLORA.sector.id,
      selectedMissionId: "missing",
      completedMissionIds: [],
    }),
  ])("blocks invalid prototype data without overwriting it: %s", async (text) => {
    vi.stubGlobal("indexedDB", new IDBFactory());
    localStorage.setItem(VEYLORA_STORAGE_KEY, text);
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await state().refresh()).toBe(false);
    expect(state().error).toBe("veylora.loadError");
    expect(await state().select("secure-mine")).toBe(false);
    expect(await state().reset()).toBe(false);
    expect(localStorage.getItem(VEYLORA_STORAGE_KEY)).toBe(text);
    expect(await state().resetEconomy()).toBe(true);
  });

  it("reports unavailable storage rather than silently falling back to an unsafe wallet", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("indexedDB", undefined);
    expect(await state().select("secure-mine")).toBe(false);
    expect(state().error).toBe("veylora.saveError");
  });

  it("preserves an unsupported economic save and blocks ordinary reset until an explicit full reset", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(CAMPAIGN_DATABASE, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("commander", "readwrite");
        tx.objectStore("commander").put({ version: 99 }, "P1");
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onabort = () => {
          db.close();
          reject(tx.error);
        };
      };
    });
    expect(await state().refresh()).toBe(false);
    expect(state().error).toBe("veylora.loadError");
    expect(await state().reset()).toBe(false);
    expect(await state().select("secure-lab")).toBe(false);
    await expect(campaignTransaction()).rejects.toThrow("decoded");
    expect(await state().resetEconomy()).toBe(true);
    expect(state().economy.claims).toEqual({});
  });

  it("validates saved economy identifiers, balances, versions and frozen effects", () => {
    const save = state().economy;
    for (const invalid of [
      { ...save, version: 99 },
      { ...save, resources: { "industrial-ore": -1 } },
      { ...save, resources: { "industrial-ore": 1.5 } },
      { ...save, resources: { unknown: 20 } },
      { ...save, technologies: ["unknown"] },
      { ...save, purchases: { "reinforced-shield": { contentVersion: 1, maxEnergyShieldMultiplier: NaN } } },
      {
        ...save,
        claims: { [rewardKey("secure-mine")]: { contentVersion: 0, rewards: { resources: {}, technologies: [] } } },
      },
    ])
      expect(() => parseCampaignSave(invalid)).toThrow();
    expect(() => state().select("missing")).toThrow();
    expect(() => state().buy("missing")).toThrow();
  });
});
