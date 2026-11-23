import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_UNITS, loadPlayerUnits, UNIT_STORAGE_KEY, usePlayerUnits } from "./playerUnits";

describe("player unit appearances", () => {
  beforeEach(() => {
    localStorage.removeItem(UNIT_STORAGE_KEY);
    usePlayerUnits.setState({ units: { ...DEFAULT_UNITS }, error: null });
  });

  it("persists independent player choices", () => {
    usePlayerUnits.getState().setUnit("P1", "soldier");
    expect(loadPlayerUnits()).toEqual({ units: { P1: "soldier", P2: "tank" }, error: null });
  });

  it("reports invalid stored choices", () => {
    localStorage.setItem(UNIT_STORAGE_KEY, JSON.stringify({ P1: "soldier", P2: "invalid" }));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(loadPlayerUnits()).toEqual({ units: DEFAULT_UNITS, error: "units.loadError" });
    log.mockRestore();
  });

  it("keeps the session choice and reports failed persistence", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const save = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("storage"); });
    usePlayerUnits.getState().setUnit("P2", "soldier");
    expect(usePlayerUnits.getState()).toMatchObject({ units: { P1: "tank", P2: "soldier" }, error: "units.saveError" });
    save.mockRestore();
    log.mockRestore();
  });
});
