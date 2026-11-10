import { missionById, VEYLORA } from "../data/campaignContent";
import { newCampaignSave, parseCampaignSave, type CampaignSave } from "../systems/campaignEconomy";

export const CAMPAIGN_DATABASE = "ballistic-front:campaign-economy";
export const LEGACY_VEYLORA_KEY = "ballistic-front:veylora-progress";
const STORE = "commander";
const KEY = "P1";

export class CampaignDataError extends Error {}

function migratePrototype(): CampaignSave {
  const save = newCampaignSave();
  const text = localStorage.getItem(LEGACY_VEYLORA_KEY);
  if (text === null) return save;
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
    throw new Error("Invalid prototype progression");
  missionById(raw.selectedMissionId);
  raw.completedMissionIds.forEach(missionById);
  save.progress[VEYLORA.sector.id] = {
    selectedMissionId: raw.selectedMissionId,
    completedMissionIds: raw.completedMissionIds,
  };
  return save;
}

// One read/write transaction serializes rewards, purchases and resets across tabs.
export function campaignTransaction(
  change?: (save: CampaignSave) => CampaignSave,
  resetEconomy = false,
): Promise<CampaignSave> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(CAMPAIGN_DATABASE, 1);
    let blocked = false;
    open.onupgradeneeded = () => open.result.createObjectStore(STORE);
    open.onerror = () => reject(open.error);
    open.onblocked = () => {
      blocked = true;
      reject(new Error("Campaign database upgrade is blocked by another tab"));
    };
    open.onsuccess = () => {
      const db = open.result;
      if (blocked) {
        db.close();
        return;
      }
      db.onversionchange = () => db.close();
      let tx: IDBTransaction;
      try {
        tx = db.transaction(STORE, "readwrite");
      } catch (error) {
        db.close();
        reject(error);
        return;
      }
      const store = tx.objectStore(STORE);
      let next: CampaignSave;
      let failure: unknown;
      const request = store.get(KEY);
      request.onsuccess = () => {
        try {
          let current: CampaignSave;
          try {
            current = resetEconomy
              ? newCampaignSave()
              : request.result === undefined
                ? migratePrototype()
                : parseCampaignSave(request.result);
          } catch (error) {
            throw new CampaignDataError("Campaign save could not be decoded", { cause: error });
          }
          next = change ? change(current) : current;
          if (change || resetEconomy || request.result === undefined) store.put(parseCampaignSave(next), KEY);
        } catch (error) {
          failure = error;
          tx.abort();
        }
      };
      tx.oncomplete = () => {
        db.close();
        resolve(next);
      };
      tx.onabort = () => {
        db.close();
        reject(failure ?? tx.error ?? new Error("Campaign transaction aborted"));
      };
    };
  });
}
