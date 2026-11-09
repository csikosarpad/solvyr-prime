import { create } from "zustand";
import type { MessageKey } from "@/i18n";
import { isSectorId } from "../data/sectors";
import { VEYLORA } from "../data/campaignContent";

const isBriefingId = (id: unknown): id is string =>
  isSectorId(id) || (typeof id === "string" && VEYLORA.battlefields.some((field) => field.id === id));

export const BRIEFING_STORAGE_KEY = "ballistic-front:briefing-preferences";

interface BriefingPreferences {
  hiddenSectorIds: string[];
  error: MessageKey | null;
  hide: (id: string) => boolean;
}

function load(): Pick<BriefingPreferences, "hiddenSectorIds" | "error"> {
  try {
    const text = localStorage.getItem(BRIEFING_STORAGE_KEY);
    if (text === null) return { hiddenSectorIds: [], error: null };
    const raw: unknown = JSON.parse(text);
    if (
      typeof raw !== "object" ||
      raw === null ||
      !("version" in raw) ||
      raw.version !== 1 ||
      !("hiddenSectorIds" in raw) ||
      !Array.isArray(raw.hiddenSectorIds) ||
      !raw.hiddenSectorIds.every(isBriefingId) ||
      new Set(raw.hiddenSectorIds).size !== raw.hiddenSectorIds.length
    ) {
      throw new Error("Invalid briefing preferences");
    }
    return { hiddenSectorIds: raw.hiddenSectorIds, error: null };
  } catch (error) {
    console.error("Briefing preferences could not be loaded", error);
    return { hiddenSectorIds: [], error: "sector.briefingLoadError" };
  }
}

export const useBriefingPreferences = create<BriefingPreferences>((set, get) => ({
  ...load(),
  hide: (id) => {
    if (!isBriefingId(id)) throw new Error(`Unknown briefing sector: ${id}`);
    const { hiddenSectorIds } = get();
    const next = hiddenSectorIds.includes(id) ? hiddenSectorIds : [...hiddenSectorIds, id];
    try {
      localStorage.setItem(BRIEFING_STORAGE_KEY, JSON.stringify({ version: 1, hiddenSectorIds: next }));
      set({ hiddenSectorIds: next, error: null });
      return true;
    } catch (error) {
      console.error("Briefing preferences could not be saved", error);
      set({ error: "sector.briefingSaveError" });
      return false;
    }
  },
}));
