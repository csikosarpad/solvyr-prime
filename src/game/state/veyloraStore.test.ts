import { beforeEach, describe, expect, it, vi } from "vitest";

const key = "ballistic-front:veylora-progress";

describe("VEYLORA progress", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("persists selection and idempotent completion without touching legacy saves", async () => {
    localStorage.setItem("ballistic-front:campaign", "legacy");
    localStorage.setItem("ballistic-front:profiles", "profiles");
    const { useVeyloraStore, readVeyloraProgress } = await import("./veyloraStore");
    expect(useVeyloraStore.getState().select("secure-lab")).toBe(true);
    expect(useVeyloraStore.getState().complete("secure-lab")).toBe(true);
    expect(useVeyloraStore.getState().complete("secure-lab")).toBe(true);
    expect(readVeyloraProgress()).toEqual({ selectedMissionId: "secure-lab", completedMissionIds: ["secure-lab"] });
    vi.resetModules();
    const reloaded = await import("./veyloraStore");
    expect(reloaded.useVeyloraStore.getState().completedMissionIds).toEqual(["secure-lab"]);
    expect(reloaded.useVeyloraStore.getState().reset()).toBe(true);
    expect(reloaded.readVeyloraProgress().completedMissionIds).toEqual([]);
    expect(localStorage.getItem("ballistic-front:campaign")).toBe("legacy");
    expect(localStorage.getItem("ballistic-front:profiles")).toBe("profiles");
  });

  it.each([
    "broken JSON",
    "null",
    '{"version":99}',
    JSON.stringify({
      version: 1,
      contentVersion: 1,
      sectorId: "veylora-03",
      selectedMissionId: "missing",
      completedMissionIds: [],
    }),
  ])("blocks invalid saves without overwriting them: %s", async (text) => {
    localStorage.setItem(key, text);
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { useVeyloraStore } = await import("./veyloraStore");
    expect(useVeyloraStore.getState().error).toBe("veylora.loadError");
    expect(useVeyloraStore.getState().select("secure-mine")).toBe(false);
    expect(useVeyloraStore.getState().complete("secure-mine")).toBe(false);
    expect(localStorage.getItem(key)).toBe(text);
    expect(useVeyloraStore.getState().reset()).toBe(true);
    expect(useVeyloraStore.getState().error).toBeNull();
  });

  it("does not commit state on a storage failure, and allows retry", async () => {
    const { useVeyloraStore } = await import("./veyloraStore");
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("quota");
    });
    expect(useVeyloraStore.getState().complete("secure-mine")).toBe(false);
    expect(useVeyloraStore.getState().completedMissionIds).toEqual([]);
    expect(useVeyloraStore.getState().error).toBe("veylora.saveError");
    expect(useVeyloraStore.getState().complete("secure-mine")).toBe(true);
    expect(useVeyloraStore.getState().completedMissionIds).toEqual(["secure-mine"]);
  });

  it("merges previously persisted completion and rejects unknown missions", async () => {
    const { useVeyloraStore } = await import("./veyloraStore");
    localStorage.setItem(
      key,
      JSON.stringify({
        version: 1,
        contentVersion: 1,
        sectorId: "veylora-03",
        selectedMissionId: "secure-lab",
        completedMissionIds: ["secure-lab"],
      }),
    );
    useVeyloraStore.getState().complete("secure-mine");
    expect(useVeyloraStore.getState().completedMissionIds).toEqual(["secure-lab", "secure-mine"]);
    expect(() => useVeyloraStore.getState().select("missing")).toThrow();
  });
});
