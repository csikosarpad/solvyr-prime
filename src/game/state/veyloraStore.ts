import { create } from "zustand";
import type { MessageKey } from "@/i18n";
import { VEYLORA, missionById } from "../data/campaignContent";

export const VEYLORA_STORAGE_KEY = "ballistic-front:veylora-progress";

interface Progress {
  selectedMissionId: string;
  completedMissionIds: string[];
}

interface VeyloraState extends Progress {
  error: MessageKey | null;
  select: (id: string) => boolean;
  complete: (id: string) => boolean;
  reset: () => boolean;
}

const initial = (): Progress => ({ selectedMissionId: VEYLORA.missions[0]!.id, completedMissionIds: [] });

export function readVeyloraProgress(storage: Pick<Storage, "getItem"> = localStorage): Progress {
  const text = storage.getItem(VEYLORA_STORAGE_KEY);
  if (text === null) return initial();
  const raw: unknown = JSON.parse(text);
  if (
    !raw ||
    typeof raw !== "object" ||
    !("version" in raw) ||
    raw.version !== 1 ||
    !("contentVersion" in raw) ||
    raw.contentVersion !== VEYLORA.contentVersion ||
    !("sectorId" in raw) ||
    raw.sectorId !== VEYLORA.sector.id ||
    !("selectedMissionId" in raw) ||
    typeof raw.selectedMissionId !== "string" ||
    !("completedMissionIds" in raw) ||
    !Array.isArray(raw.completedMissionIds) ||
    !raw.completedMissionIds.every((id): id is string => typeof id === "string") ||
    new Set(raw.completedMissionIds).size !== raw.completedMissionIds.length
  )
    throw new Error("Invalid VEYLORA progression");
  missionById(raw.selectedMissionId);
  raw.completedMissionIds.forEach(missionById);
  return { selectedMissionId: raw.selectedMissionId, completedMissionIds: raw.completedMissionIds };
}

function load(): Progress & { error: MessageKey | null } {
  try {
    return { ...readVeyloraProgress(), error: null };
  } catch (error) {
    console.error("VEYLORA progress could not be loaded", error);
    return { ...initial(), error: "veylora.loadError" };
  }
}

export const useVeyloraStore = create<VeyloraState>((set, get) => {
  const write = (change: (progress: Progress) => Progress, reset = false): boolean => {
    if (!reset && get().error === "veylora.loadError") return false;
    let progress: Progress;
    try {
      progress = reset ? initial() : readVeyloraProgress();
    } catch (error) {
      console.error("VEYLORA progress could not be loaded before saving", error);
      set({ error: "veylora.loadError" });
      return false;
    }
    try {
      const next = change(progress);
      localStorage.setItem(
        VEYLORA_STORAGE_KEY,
        JSON.stringify({
          version: 1,
          contentVersion: VEYLORA.contentVersion,
          sectorId: VEYLORA.sector.id,
          ...next,
        }),
      );
      set({ ...next, error: null });
      return true;
    } catch (error) {
      console.error("VEYLORA progress could not be saved", error);
      set({ error: "veylora.saveError" });
      return false;
    }
  };
  return {
    ...load(),
    select: (id) => {
      missionById(id);
      return write((progress) => ({ ...progress, selectedMissionId: id }));
    },
    complete: (id) => {
      missionById(id);
      return write((progress) => ({
        ...progress,
        completedMissionIds: progress.completedMissionIds.includes(id)
          ? progress.completedMissionIds
          : [...progress.completedMissionIds, id],
      }));
    },
    reset: () => write(initial, true),
  };
});
