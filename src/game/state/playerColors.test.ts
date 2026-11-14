import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_PLAYER_COLORS,
  loadPlayerColors,
  PLAYER_COLOR_STORAGE_KEY,
  PLAYER_COLORS,
  playerColor,
  playerAccent,
  tankTint,
  usePlayerColors,
} from "./playerColors";

describe("player colors", () => {
  beforeEach(() => {
    localStorage.removeItem(PLAYER_COLOR_STORAGE_KEY);
    usePlayerColors.setState({ colors: { ...DEFAULT_PLAYER_COLORS }, error: null });
  });

  it("saves independent selections and reloads them", () => {
    usePlayerColors.getState().setColor("P1", "green");
    usePlayerColors.getState().setColor("P2", "purple");
    const saved = loadPlayerColors();
    expect(saved).toEqual({ colors: { P1: "green", P2: "purple" }, error: null });
    expect(playerColor("P1", saved.colors)).toBe(PLAYER_COLORS.green);
    expect(playerColor("P2", saved.colors)).toBe(PLAYER_COLORS.purple);
  });

  it("allows identical colors and rejects unknown palette values", () => {
    usePlayerColors.getState().setColor("P1", "red");
    expect(loadPlayerColors().colors).toEqual({ P1: "red", P2: "red" });
    localStorage.setItem(PLAYER_COLOR_STORAGE_KEY, JSON.stringify({ P1: "unknown", P2: "red" }));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(loadPlayerColors()).toEqual({ colors: DEFAULT_PLAYER_COLORS, error: "colors.loadError" });
    log.mockRestore();
  });

  it("preserves black and white choices while making black shading and accents visible", () => {
    usePlayerColors.getState().setColor("P1", "black");
    usePlayerColors.getState().setColor("P2", "white");
    const saved = loadPlayerColors().colors;
    expect(saved).toEqual({ P1: "black", P2: "white" });
    expect(playerColor("P1", saved)).toBe(0);
    expect(tankTint(playerColor("P1", saved))).toBe(0x777777);
    expect(playerAccent(playerColor("P1", saved))).toBe(0xb9c7d6);
    expect(tankTint(PLAYER_COLORS.white)).toBe(PLAYER_COLORS.white);
    expect(playerAccent(PLAYER_COLORS.red)).toBe(PLAYER_COLORS.red);
  });

  it("reports storage failures while keeping the session choice", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const save = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("storage"); });
    usePlayerColors.getState().setColor("P1", "green");
    expect(usePlayerColors.getState()).toMatchObject({ colors: { P1: "green", P2: "red" }, error: "colors.saveError" });
    save.mockRestore();
    log.mockRestore();
  });
});
