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
type ColorError = "colors.loadError" | "colors.saveError";

function isPlayerColor(value: unknown): value is PlayerColor {
  return typeof value === "string" && Object.hasOwn(PLAYER_COLORS, value);
}

export function loadPlayerColors(): { colors: PlayerColorChoices; error: ColorError | null } {
  try {
    const raw = localStorage.getItem(PLAYER_COLOR_STORAGE_KEY);
    if (raw === null) return { colors: { ...DEFAULT_PLAYER_COLORS }, error: null };
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed) ||
      !("P1" in parsed) || !isPlayerColor(parsed.P1) || !("P2" in parsed) || !isPlayerColor(parsed.P2))
      throw new Error("Invalid player colors");
    return { colors: { P1: parsed.P1, P2: parsed.P2 }, error: null };
  } catch (error) {
    console.error("Player colors could not be loaded", error);
    return { colors: { ...DEFAULT_PLAYER_COLORS }, error: "colors.loadError" };
  }
}

interface PlayerColorsState {
  colors: PlayerColorChoices;
  error: ColorError | null;
  setColor: (id: LocalPlayerId, color: PlayerColor) => void;
}

export const usePlayerColors = create<PlayerColorsState>((set) => ({
  ...loadPlayerColors(),
  setColor: (id, color) => {
    if (!isPlayerColor(color)) throw new Error(`Invalid player color: ${color}`);
    set((state) => {
      const colors = { ...state.colors, [id]: color };
      try {
        localStorage.setItem(PLAYER_COLOR_STORAGE_KEY, JSON.stringify(colors));
        return { colors, error: null };
      } catch (error) {
        console.error("Player colors could not be saved", error);
        return { colors, error: "colors.saveError" };
      }
    });
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
