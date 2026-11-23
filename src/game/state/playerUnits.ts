import { create } from "zustand";
import type { LocalPlayerId } from "./playerId";

export type UnitAppearance = "tank" | "soldier";
export type UnitChoices = Record<LocalPlayerId, UnitAppearance>;
export const UNIT_STORAGE_KEY = "ballistic-front:player-units";
export const DEFAULT_UNITS: UnitChoices = { P1: "tank", P2: "tank" };
type UnitError = "units.loadError" | "units.saveError";

function isUnit(value: unknown): value is UnitAppearance {
  return value === "tank" || value === "soldier";
}

export function loadPlayerUnits(): { units: UnitChoices; error: UnitError | null } {
  try {
    const raw = localStorage.getItem(UNIT_STORAGE_KEY);
    if (raw === null) return { units: { ...DEFAULT_UNITS }, error: null };
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null ||
      !("P1" in value) || !isUnit(value.P1) || !("P2" in value) || !isUnit(value.P2)) {
      throw new Error("Invalid unit appearances");
    }
    return { units: { P1: value.P1, P2: value.P2 }, error: null };
  } catch (error) {
    console.error("Unit appearances could not be loaded", error);
    return { units: { ...DEFAULT_UNITS }, error: "units.loadError" };
  }
}

interface PlayerUnitsState {
  units: UnitChoices;
  error: UnitError | null;
  setUnit: (id: LocalPlayerId, unit: UnitAppearance) => void;
}

export const usePlayerUnits = create<PlayerUnitsState>((set) => ({
  ...loadPlayerUnits(),
  setUnit: (id, unit) => {
    if (!isUnit(unit)) throw new Error(`Invalid unit appearance: ${unit}`);
    set((state) => {
      const units = { ...state.units, [id]: unit };
      try {
        localStorage.setItem(UNIT_STORAGE_KEY, JSON.stringify(units));
        return { units, error: null };
      } catch (error) {
        console.error("Unit appearances could not be saved", error);
        return { units, error: "units.saveError" };
      }
    });
  },
}));
