import { beforeEach, describe, expect, it, vi } from "vitest";

const key = "ballistic-front:briefing-preferences";

describe("briefing preferences persistence", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("loads the saved per-sector choice after reload, preserving other storage", async () => {
    localStorage.setItem("ballistic-front:campaign", "untouched");
    const { useBriefingPreferences } = await import("./briefingPreferences");
    expect(useBriefingPreferences.getState().hide("alpha-01")).toBe(true);
    expect(useBriefingPreferences.getState().hide("forge-17")).toBe(true);
    expect(useBriefingPreferences.getState().hide("alpha-01")).toBe(true);
    vi.resetModules();
    const reloaded = await import("./briefingPreferences");
    expect(reloaded.useBriefingPreferences.getState().hiddenSectorIds).toEqual(["alpha-01", "forge-17"]);
    expect(localStorage.getItem("ballistic-front:campaign")).toBe("untouched");
  });

  it.each([
    "invalid JSON",
    '{"version":2,"hiddenSectorIds":[]}',
    '{"version":1,"hiddenSectorIds":["unknown"]}',
    '{"version":1,"hiddenSectorIds":["alpha-01","alpha-01"]}',
    '{"version":1,"hiddenSectorIds":true}',
    "null",
  ])("reports invalid preferences without overwriting them: %s", async (text) => {
    localStorage.setItem(key, text);
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { useBriefingPreferences } = await import("./briefingPreferences");
    expect(useBriefingPreferences.getState()).toMatchObject({ hiddenSectorIds: [], error: "sector.briefingLoadError" });
    expect(localStorage.getItem(key)).toBe(text);
  });

  it("reports storage access failure", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(Storage.prototype, "getItem").mockImplementationOnce(() => {
      throw new Error("blocked");
    });
    const { useBriefingPreferences } = await import("./briefingPreferences");
    expect(useBriefingPreferences.getState().error).toBe("sector.briefingLoadError");
  });

  it("does not hide a briefing on save failure and retries successfully", async () => {
    const { useBriefingPreferences } = await import("./briefingPreferences");
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("quota");
    });
    expect(useBriefingPreferences.getState().hide("alpha-01")).toBe(false);
    expect(useBriefingPreferences.getState()).toMatchObject({ hiddenSectorIds: [], error: "sector.briefingSaveError" });
    expect(useBriefingPreferences.getState().hide("alpha-01")).toBe(true);
    expect(useBriefingPreferences.getState()).toMatchObject({ hiddenSectorIds: ["alpha-01"], error: null });
  });
});
