import { create } from "zustand";
import type { MessageKey } from "@/i18n";
import { VEYLORA, missionById } from "../data/campaignContent";
import { campaignTransaction, CampaignDataError, LEGACY_VEYLORA_KEY } from "./campaignDatabase";
import {
  initialSectorProgress,
  newCampaignSave,
  purchaseBlock,
  rewardKey,
  type CampaignSave,
  type SectorProgress,
} from "../systems/campaignEconomy";

export const VEYLORA_STORAGE_KEY = LEGACY_VEYLORA_KEY;

interface VeyloraState extends SectorProgress {
  economy: CampaignSave;
  ready: boolean;
  pending: number;
  error: MessageKey | null;
  refresh: () => Promise<boolean>;
  select: (id: string) => Promise<boolean>;
  complete: (id: string, generation: string) => Promise<boolean>;
  buy: (id: string) => Promise<boolean>;
  reset: () => Promise<boolean>;
  resetEconomy: () => Promise<boolean>;
}

class EconomyRuleError extends Error {
  constructor(
    readonly key: MessageKey,
    readonly economy: CampaignSave,
  ) {
    super(key);
  }
}

export const useVeyloraStore = create<VeyloraState>((set) => {
  const write = async (change?: (save: CampaignSave) => CampaignSave, reset = false): Promise<boolean> => {
    set((state) => ({ pending: state.pending + 1 }));
    try {
      const economy = await campaignTransaction(change, reset);
      set({ economy, ...economy.progress[VEYLORA.sector.id]!, ready: true, error: null });
      return true;
    } catch (error) {
      console.error("Campaign economy transaction failed", error);
      if (error instanceof EconomyRuleError)
        set({ economy: error.economy, ...error.economy.progress[VEYLORA.sector.id]!, ready: true });
      set({
        error:
          error instanceof EconomyRuleError
            ? error.key
            : error instanceof CampaignDataError
              ? "veylora.loadError"
              : "veylora.saveError",
      });
      return false;
    } finally {
      set((state) => ({ pending: state.pending - 1 }));
    }
  };
  return {
    ...initialSectorProgress(),
    economy: newCampaignSave(),
    ready: false,
    pending: 0,
    error: null,
    refresh: () => write(),
    select: (id) => {
      missionById(id);
      return write((save) => {
        save.progress[VEYLORA.sector.id]!.selectedMissionId = id;
        return save;
      });
    },
    complete: (id, generation) => {
      const mission = missionById(id);
      return write((save) => {
        if (save.generation !== generation) throw new EconomyRuleError("economy.resetDuringBattle", save);
        const progress = save.progress[VEYLORA.sector.id]!;
        if (!progress.completedMissionIds.includes(id)) progress.completedMissionIds.push(id);
        const key = rewardKey(id);
        if (!Object.hasOwn(save.claims, key)) {
          for (const [resource, amount] of Object.entries(mission.rewards.resources)) {
            const total = (save.resources[resource] ?? 0) + amount;
            if (!Number.isSafeInteger(total)) throw new Error("Campaign resource overflow");
            save.resources[resource] = total;
          }
          save.technologies = [...new Set([...save.technologies, ...mission.rewards.technologies])];
          save.claims[key] = { contentVersion: VEYLORA.contentVersion, rewards: structuredClone(mission.rewards) };
        }
        return save;
      });
    },
    buy: (id) => {
      const recipe = VEYLORA.recipes.find((recipe) => recipe.id === id);
      if (!recipe) throw new Error(`Unknown campaign recipe: ${id}`);
      return write((save) => {
        const block = purchaseBlock(save, recipe);
        if (block)
          throw new EconomyRuleError(
            block === "owned"
              ? "economy.owned"
              : block === "technology"
                ? "economy.missingTechnology"
                : "economy.missingResources",
            save,
          );
        for (const [resource, amount] of Object.entries(recipe.cost))
          save.resources[resource] = save.resources[resource]! - amount;
        save.purchases[id] = { contentVersion: VEYLORA.contentVersion, ...recipe.effect };
        return save;
      });
    },
    reset: () =>
      write((save) => {
        save.progress[VEYLORA.sector.id] = initialSectorProgress();
        return save;
      }),
    resetEconomy: () => write(undefined, true),
  };
});
