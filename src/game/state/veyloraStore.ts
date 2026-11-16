import { create } from "zustand";
import type { MessageKey } from "@/i18n";
import { VEYLORA, missionAvailable, missionById } from "../data/campaignContent";
import { campaignTransaction, CampaignDataError, LEGACY_VEYLORA_KEY } from "./campaignDatabase";
import type { LocalPlayerId } from "./playerId";
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
  playerId: LocalPlayerId;
  switchPlayer: (id: LocalPlayerId) => Promise<boolean>;
  refresh: () => Promise<boolean>;
  select: (id: string) => Promise<boolean>;
  complete: (id: string, generation: string) => Promise<boolean>;
  buy: (id: string) => Promise<boolean>;
  equipShield: (id: string | null) => Promise<boolean>;
  reset: () => Promise<boolean>;
  resetEconomy: () => Promise<boolean>;
  /** Mindkét helyi játékos teljes kampánygazdaságának törlése. */
  resetEconomyAll: () => Promise<boolean>;
}

class EconomyRuleError extends Error {
  constructor(
    readonly key: MessageKey,
    readonly economy: CampaignSave,
  ) {
    super(key);
  }
}

export const useVeyloraStore = create<VeyloraState>((set, get) => {
  let playerRevision = 0;
  const write = async (change?: (save: CampaignSave) => CampaignSave, reset = false): Promise<boolean> => {
    const playerId = get().playerId;
    const revision = playerRevision;
    set((state) => ({ pending: state.pending + 1 }));
    try {
      const economy = await campaignTransaction(change, reset, playerId);
      if (get().playerId === playerId && revision === playerRevision)
        set({ economy, ...economy.progress[VEYLORA.sector.id]!, ready: true, error: null });
      return true;
    } catch (error) {
      console.error("Campaign economy transaction failed", error);
      if (get().playerId !== playerId || revision !== playerRevision) return false;
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
    playerId: "P1",
    switchPlayer: (id) => {
      if (get().playerId !== id) {
        playerRevision++;
        set({ playerId: id, economy: newCampaignSave(), ...initialSectorProgress(), ready: false, error: null });
      }
      return write();
    },
    refresh: () => write(),
    select: (id) => {
      const mission = missionById(id);
      return write((save) => {
        const progress = save.progress[VEYLORA.sector.id]!;
        if (!missionAvailable(mission, progress.completedMissionIds))
          throw new EconomyRuleError("veylora.missionLocked", save);
        progress.selectedMissionId = id;
        return save;
      });
    },
    complete: (id, generation) => {
      const mission = missionById(id);
      return write((save) => {
        if (save.generation !== generation) throw new EconomyRuleError("economy.resetDuringBattle", save);
        const progress = save.progress[VEYLORA.sector.id]!;
        if (!missionAvailable(mission, progress.completedMissionIds))
          throw new EconomyRuleError("veylora.missionLocked", save);
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
        save.equippedShield = id;
        return save;
      });
    },
    equipShield: (id) =>
      write((save) => {
        if (id !== null && !Object.hasOwn(save.purchases, id))
          throw new EconomyRuleError("economy.notOwned", save);
        save.equippedShield = id;
        return save;
      }),
    reset: () =>
      write((save) => {
        save.progress[VEYLORA.sector.id] = initialSectorProgress();
        return save;
      }),
    resetEconomy: () => write(undefined, true),
    resetEconomyAll: async () => {
      const other: LocalPlayerId = get().playerId === "P1" ? "P2" : "P1";
      let otherOk = true;
      try {
        await campaignTransaction(undefined, true, other);
      } catch (error) {
        console.error("Campaign economy transaction failed", error);
        otherOk = false;
      }
      const ok = await write(undefined, true);
      if (!otherOk && get().error === null) set({ error: "veylora.saveError" });
      return ok && otherOk;
    },
  };
});
