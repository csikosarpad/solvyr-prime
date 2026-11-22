import { create } from "zustand";
import { DEFAULT_THEME } from "../theme";
import type { LocalPlayerId } from "./playerId";

export const PLAYER_COLOR_STORAGE_KEY = "ballistic-front:player-colors";
export const PLAYER_COLORS = {
  blue: DEFAULT_THEME.players[0]!,
  red: DEFAULT_THEME.players[1]!,
  green: 0x54d994,
  purple: 0xc98bff,
  gold: 0xffc52e,
  cyan: 0x24d8ff,
  black: 0x000000,
  white: 0xffffff,
} as const;
export type PlayerColor = keyof typeof PLAYER_COLORS;
export const PLAYER_COLOR_OPTIONS: readonly PlayerColor[] = ["blue", "red", "green", "purple", "gold", "cyan", "white"];
export type PlayerColorChoices = Record<LocalPlayerId, PlayerColor>;
export const DEFAULT_PLAYER_COLORS: PlayerColorChoices = { P1: "blue", P2: "red" };
export const ARMOR_COLORS = {
  steel: { tint: 0xffffff, swatch: 0x809296 },
  blue: { tint: 0x88b4ff, swatch: 0x567cb5 },
  red: { tint: 0xff8290, swatch: 0xa84b58 },
  olive: { tint: 0xd6e78b, swatch: 0x7d8955 },
} as const;
export type ArmorColor = keyof typeof ARMOR_COLORS;
export const ARMOR_COLOR_OPTIONS: readonly ArmorColor[] = ["steel", "blue", "red", "olive"];
type ArmorColorChoices = Record<LocalPlayerId, ArmorColor>;
export const DEFAULT_ARMOR_COLORS: ArmorColorChoices = { P1: "steel", P2: "steel" };
type ColorError = "colors.loadError" | "colors.saveError";

function isPlayerColor(value: unknown): value is PlayerColor {
  return typeof value === "string" && Object.hasOwn(PLAYER_COLORS, value);
}

function isArmorColor(value: unknown): value is ArmorColor {
  return typeof value === "string" && Object.hasOwn(ARMOR_COLORS, value);
}

type PlayerValues = Record<LocalPlayerId, number>;
export type ColorPreferences = {
  colors: PlayerColorChoices;
  armorColors: ArmorColorChoices;
  lightness: PlayerValues;
  distances: PlayerValues;
};
export const DEFAULT_LIGHTNESS = 0.5;
export const DEFAULT_DISTANCE = 0.35;
export const MIN_DISTANCE = 0.25;
export const MIN_LIGHTNESS = 0.15;
export const MAX_LIGHTNESS = 0.85;

export function maxColorDistance(lightness: number): number {
  return Math.round(Math.max(lightness - MIN_LIGHTNESS, MAX_LIGHTNESS - lightness) * 100) / 100;
}

function isPlayerValues(value: unknown, min: number, max: number): value is PlayerValues {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  return (["P1", "P2"] as const).every((id) => {
    const n: unknown = Reflect.get(value, id);
    return typeof n === "number" && Number.isFinite(n) && n >= min && n <= max &&
      Math.abs(n * 20 - Math.round(n * 20)) < 1e-8;
  });
}

function defaults(): ColorPreferences {
  return {
    colors: { ...DEFAULT_PLAYER_COLORS },
    armorColors: { ...DEFAULT_ARMOR_COLORS },
    lightness: { P1: DEFAULT_LIGHTNESS, P2: DEFAULT_LIGHTNESS },
    distances: { P1: DEFAULT_DISTANCE, P2: DEFAULT_DISTANCE },
  };
}

export function loadPlayerColors(): ColorPreferences & { error: ColorError | null } {
  const initial = defaults();
  try {
    const raw = localStorage.getItem(PLAYER_COLOR_STORAGE_KEY);
    if (raw === null) return { ...initial, error: null };
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed) ||
      !("P1" in parsed) || !isPlayerColor(parsed.P1) || !("P2" in parsed) || !isPlayerColor(parsed.P2))
      throw new Error("Invalid player colors");
    const colors: PlayerColorChoices = {
      P1: parsed.P1 === "black" ? "white" : parsed.P1,
      P2: parsed.P2 === "black" ? "white" : parsed.P2,
    };
    // Older saves only contain the two accent colors.
    if (!("armorColors" in parsed)) return { ...initial, colors, error: null };
    const armor = parsed.armorColors;
    if (typeof armor !== "object" || armor === null || Array.isArray(armor) ||
      !("P1" in armor) || !isArmorColor(armor.P1) || !("P2" in armor) || !isArmorColor(armor.P2)) {
      console.error("Tank armor colors could not be loaded");
      return { ...initial, colors, error: "colors.loadError" };
    }
    const lightness = "lightness" in parsed ? parsed.lightness : initial.lightness;
    const distances = "distances" in parsed ? parsed.distances : initial.distances;
    if (!isPlayerValues(lightness, MIN_LIGHTNESS, MAX_LIGHTNESS) ||
      !isPlayerValues(distances, MIN_DISTANCE, 0.7) ||
      (["P1", "P2"] as const).some((id) => distances[id] > maxColorDistance(lightness[id]) + 1e-9)) {
      throw new Error("Invalid tank color lightness");
    }
    return { colors, armorColors: { P1: armor.P1, P2: armor.P2 }, lightness, distances, error: null };
  } catch (error) {
    console.error("Player colors could not be loaded", error);
    return { ...initial, error: "colors.loadError" };
  }
}

interface PlayerColorsState extends ColorPreferences {
  error: ColorError | null;
  setColor: (id: LocalPlayerId, color: PlayerColor) => void;
  setArmorColor: (id: LocalPlayerId, color: ArmorColor) => void;
  setLightness: (id: LocalPlayerId, value: number) => void;
  setDistance: (id: LocalPlayerId, value: number) => void;
  resetPlayer: (id: LocalPlayerId) => void;
  resetColors: () => void;
  restoreColors: (preferences: ColorPreferences) => void;
}

function savePlayerColors({ colors, armorColors, lightness, distances }: ColorPreferences): ColorPreferences & { error: ColorError | null } {
  try {
    localStorage.setItem(PLAYER_COLOR_STORAGE_KEY, JSON.stringify({ ...colors, armorColors, lightness, distances }));
    return { colors, armorColors, lightness, distances, error: null };
  } catch (error) {
    console.error("Player colors could not be saved", error);
    return { colors, armorColors, lightness, distances, error: "colors.saveError" };
  }
}

export const usePlayerColors = create<PlayerColorsState>((set) => ({
  ...loadPlayerColors(),
  setColor: (id, color) => {
    if (!isPlayerColor(color)) throw new Error(`Invalid player color: ${color}`);
    set((state) => savePlayerColors({ ...state, colors: { ...state.colors, [id]: color === "black" ? "white" : color } }));
  },
  setArmorColor: (id, color) => {
    if (!isArmorColor(color)) throw new Error(`Invalid armor color: ${color}`);
    set((state) => savePlayerColors({ ...state, armorColors: { ...state.armorColors, [id]: color } }));
  },
  setLightness: (id, value) => {
    if (!Number.isFinite(value) || value < MIN_LIGHTNESS || value > MAX_LIGHTNESS ||
      Math.abs(value * 20 - Math.round(value * 20)) >= 1e-8) throw new RangeError("Invalid armor lightness");
    set((state) => savePlayerColors({
      ...state,
      lightness: { ...state.lightness, [id]: value },
      distances: { ...state.distances, [id]: Math.min(state.distances[id], maxColorDistance(value)) },
    }));
  },
  setDistance: (id, value) => {
    set((state) => {
      if (!Number.isFinite(value) || value < MIN_DISTANCE || value > maxColorDistance(state.lightness[id]) + 1e-9 ||
        Math.abs(value * 20 - Math.round(value * 20)) >= 1e-8)
        throw new RangeError("Invalid marking distance");
      return savePlayerColors({ ...state, distances: { ...state.distances, [id]: value } });
    });
  },
  resetPlayer: (id) => set((state) => {
    const initial = defaults();
    return savePlayerColors({
      colors: { ...state.colors, [id]: initial.colors[id] },
      armorColors: { ...state.armorColors, [id]: initial.armorColors[id] },
      lightness: { ...state.lightness, [id]: initial.lightness[id] },
      distances: { ...state.distances, [id]: initial.distances[id] },
    });
  }),
  resetColors: () => set(() => savePlayerColors(defaults())),
  restoreColors: (preferences) => set(() => savePlayerColors(preferences)),
}));

function withLightness(color: number, lightness: number): number {
  const r = ((color >> 16) & 255) / 255;
  const g = ((color >> 8) & 255) / 255;
  const b = (color & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const originalLightness = (max + min) / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * originalLightness - 1));
  let hue = 0;
  if (delta !== 0) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
  }
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs(((hue + 6) % 2) - 1));
  const m = lightness - chroma / 2;
  const sector = (hue + 6) % 6;
  const rgb = sector < 1 ? [chroma, x, 0] : sector < 2 ? [x, chroma, 0] :
    sector < 3 ? [0, chroma, x] : sector < 4 ? [0, x, chroma] :
      sector < 5 ? [x, 0, chroma] : [chroma, 0, x];
  return rgb.reduce((result, channel) => (result << 8) | Math.round((channel + m) * 255), 0);
}

export function markingColor(id: LocalPlayerId, preferences: ColorPreferences): number {
  const armorLightness = preferences.lightness[id];
  const l = armorLightness < 0.5
    ? armorLightness + preferences.distances[id]
    : armorLightness - preferences.distances[id];
  return withLightness(PLAYER_COLORS[preferences.colors[id]], l);
}

export function armorTint(id: LocalPlayerId, preferences: ColorPreferences): number {
  return withLightness(ARMOR_COLORS[preferences.armorColors[id]].swatch, preferences.lightness[id]);
}

export function armorColorMatrix(color: number): [
  number, number, number, number, number,
  number, number, number, number, number,
  number, number, number, number, number,
  number, number, number, number, number,
] {
  const red = ((color >> 16) & 255) / 255;
  const green = ((color >> 8) & 255) / 255;
  const blue = (color & 255) / 255;
  // Map a mid-tone texture value to the selected color while retaining half the shading contrast.
  return [
    0.1063, 0.3576, 0.0361, 0, red - 0.2,
    0.1063, 0.3576, 0.0361, 0, green - 0.2,
    0.1063, 0.3576, 0.0361, 0, blue - 0.2,
    0, 0, 0, 1, 0,
  ];
}

export function playerColor(id: LocalPlayerId, colors: PlayerColorChoices): number {
  return PLAYER_COLORS[colors[id]];
}

export function cssPlayerColor(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}

// Multiplying a sprite by pure black removes all of its shading.
export function tankTint(color: number): number {
  return color === PLAYER_COLORS.black ? 0x777777 : color;
}

export function playerAccent(color: number): number {
  if (color === PLAYER_COLORS.black) return 0xb9c7d6;
  const channels = [(color >> 16) & 255, (color >> 8) & 255, color & 255];
  const lightness = (Math.max(...channels) + Math.min(...channels)) / 510;
  return lightness < 0.5 ? withLightness(color, 0.5) : color;
}
