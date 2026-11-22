import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_PLAYER_COLORS,
  DEFAULT_ARMOR_COLORS,
  DEFAULT_LIGHTNESS,
  DEFAULT_DISTANCE,
  loadPlayerColors,
  PLAYER_COLOR_STORAGE_KEY,
  PLAYER_COLORS,
  playerColor,
  playerAccent,
  maxColorDistance,
  markingColor,
  tankTint,
  usePlayerColors,
} from "./playerColors";

describe("player colors", () => {
  beforeEach(() => {
    localStorage.removeItem(PLAYER_COLOR_STORAGE_KEY);
    usePlayerColors.setState({
      colors: { ...DEFAULT_PLAYER_COLORS }, armorColors: { ...DEFAULT_ARMOR_COLORS },
      lightness: { P1: DEFAULT_LIGHTNESS, P2: DEFAULT_LIGHTNESS },
      distances: { P1: DEFAULT_DISTANCE, P2: DEFAULT_DISTANCE }, error: null,
    });
  });

  it("saves independent selections and reloads them", () => {
    usePlayerColors.getState().setColor("P1", "green");
    usePlayerColors.getState().setArmorColor("P1", "blue");
    usePlayerColors.getState().setColor("P2", "purple");
    const saved = loadPlayerColors();
    expect(saved).toMatchObject({ colors: { P1: "green", P2: "purple" }, armorColors: { P1: "blue", P2: "steel" }, error: null });
    expect(playerColor("P1", saved.colors)).toBe(PLAYER_COLORS.green);
    expect(playerColor("P2", saved.colors)).toBe(PLAYER_COLORS.purple);
  });

  it("keeps accent colors from older saves and defaults both armor colors to steel", () => {
    localStorage.setItem(PLAYER_COLOR_STORAGE_KEY, JSON.stringify({ P1: "gold", P2: "cyan" }));
    expect(loadPlayerColors()).toMatchObject({
      colors: { P1: "gold", P2: "cyan" },
      armorColors: { P1: "steel", P2: "steel" },
      error: null,
    });
  });

  it("allows identical colors and rejects unknown palette values", () => {
    usePlayerColors.getState().setColor("P1", "red");
    expect(loadPlayerColors().colors).toEqual({ P1: "red", P2: "red" });
    localStorage.setItem(PLAYER_COLOR_STORAGE_KEY, JSON.stringify({ P1: "unknown", P2: "red" }));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(loadPlayerColors()).toMatchObject({ colors: DEFAULT_PLAYER_COLORS, armorColors: DEFAULT_ARMOR_COLORS, error: "colors.loadError" });
    log.mockRestore();
  });

  it("migrates black and white choices to a single neutral palette", () => {
    localStorage.setItem(PLAYER_COLOR_STORAGE_KEY, JSON.stringify({ P1: "black", P2: "white" }));
    expect(loadPlayerColors().colors).toEqual({ P1: "white", P2: "white" });
    expect(tankTint(PLAYER_COLORS.black)).toBe(0x777777);
    expect(playerAccent(PLAYER_COLORS.black)).toBe(0xb9c7d6);
    expect(tankTint(PLAYER_COLORS.white)).toBe(PLAYER_COLORS.white);
    expect(playerAccent(PLAYER_COLORS.red)).toBe(PLAYER_COLORS.red);
  });

  it("constrains and persists the actual marking distance as armor changes", () => {
    const state = usePlayerColors.getState();
    expect(maxColorDistance(0.5)).toBe(0.35);
    state.setLightness("P1", 0.15);
    state.setDistance("P1", 0.7);
    expect(loadPlayerColors().distances.P1).toBe(0.7);
    state.setLightness("P1", 0.5);
    expect(loadPlayerColors().distances.P1).toBe(0.35);
    expect(() => state.setDistance("P1", 0.4)).toThrow(RangeError);
    expect(() => state.setDistance("P1", 0.2)).toThrow(RangeError);
    expect(usePlayerColors.getState().distances.P2).toBe(0.35);
  });

  it("uses the light side below the midpoint and the dark side at and above it", () => {
    const state = usePlayerColors.getState();
    state.setColor("P1", "white");
    state.setLightness("P1", 0.45);
    expect(markingColor("P1", usePlayerColors.getState())).toBe(0xcccccc);
    state.setLightness("P1", 0.5);
    expect(markingColor("P1", usePlayerColors.getState())).toBe(0x262626);
  });

  it("resets one player independently and then resets both", () => {
    const state = usePlayerColors.getState();
    state.setColor("P1", "green");
    state.setLightness("P2", 0.65);
    state.resetPlayer("P1");
    expect(loadPlayerColors().colors.P1).toBe(DEFAULT_PLAYER_COLORS.P1);
    expect(loadPlayerColors().lightness.P2).toBe(0.65);
    state.resetColors();
    expect(loadPlayerColors().lightness).toEqual({ P1: 0.5, P2: 0.5 });
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
