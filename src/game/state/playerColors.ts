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
export const PLAYER_COLOR_OPTIONS: readonly PlayerColor[] = ["blue", "red", "green", "purple", "gold", "cyan", "black", "white"];
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

type ColorPreferences = { colors: PlayerColorChoices; armorColors: ArmorColorChoices };

export function loadPlayerColors(): ColorPreferences & { error: ColorError | null } {
  const defaults = { colors: { ...DEFAULT_PLAYER_COLORS }, armorColors: { ...DEFAULT_ARMOR_COLORS } };
  try {
    const raw = localStorage.getItem(PLAYER_COLOR_STORAGE_KEY);
    if (raw === null) return { ...defaults, error: null };
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed) ||
      !("P1" in parsed) || !isPlayerColor(parsed.P1) || !("P2" in parsed) || !isPlayerColor(parsed.P2))
      throw new Error("Invalid player colors");
    const colors = { P1: parsed.P1, P2: parsed.P2 };
    // Older saves only contain the two accent colors.
    if (!("armorColors" in parsed)) return { ...defaults, colors, error: null };
    const armor = parsed.armorColors;
    if (typeof armor !== "object" || armor === null || Array.isArray(armor) ||
      !("P1" in armor) || !isArmorColor(armor.P1) || !("P2" in armor) || !isArmorColor(armor.P2)) {
      console.error("Tank armor colors could not be loaded");
      return { ...defaults, colors, error: "colors.loadError" };
    }
    return { colors, armorColors: { P1: armor.P1, P2: armor.P2 }, error: null };
  } catch (error) {
    console.error("Player colors could not be loaded", error);
    return { ...defaults, error: "colors.loadError" };
  }
}

interface PlayerColorsState extends ColorPreferences {
  error: ColorError | null;
  setColor: (id: LocalPlayerId, color: PlayerColor) => void;
  setArmorColor: (id: LocalPlayerId, color: ArmorColor) => void;
}

function savePlayerColors({ colors, armorColors }: ColorPreferences): ColorPreferences & { error: ColorError | null } {
  try {
    localStorage.setItem(PLAYER_COLOR_STORAGE_KEY, JSON.stringify({ ...colors, armorColors }));
    return { colors, armorColors, error: null };
  } catch (error) {
    console.error("Player colors could not be saved", error);
    return { colors, armorColors, error: "colors.saveError" };
  }
}

export const usePlayerColors = create<PlayerColorsState>((set) => ({
  ...loadPlayerColors(),
  setColor: (id, color) => {
    if (!isPlayerColor(color)) throw new Error(`Invalid player color: ${color}`);
    set(({ colors, armorColors }) => savePlayerColors({ colors: { ...colors, [id]: color }, armorColors }));
  },
  setArmorColor: (id, color) => {
    if (!isArmorColor(color)) throw new Error(`Invalid armor color: ${color}`);
    set(({ colors, armorColors }) => savePlayerColors({ colors, armorColors: { ...armorColors, [id]: color } }));
  },
}));

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
  return color === PLAYER_COLORS.black ? 0xb9c7d6 : color;
}
