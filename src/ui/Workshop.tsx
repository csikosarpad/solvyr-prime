import { useEffect, useState } from "react";
import { useGameStore } from "@/game/state/gameStore";
import { useMultiplayerStore } from "@/game/state/multiplayerStore";
import { useVeyloraStore } from "@/game/state/veyloraStore";
import { useCampaignStore } from "@/game/state/campaignStore";
import { VEYLORA } from "@/game/data/campaignContent";
import { useT } from "@/i18n";
import type { WorkshopFilter } from "./result/result.types";
import { Shop } from "./Shop";
import { ResultDecorCanvas } from "./result/ResultDecorCanvas";
import { PlayerSelectorButton } from "./PlayerSelectorButton";

export function Workshop() {
  const t = useT();
  const { workshopOrigin, workshopError, closeWorkshop, aiActive, aiOpponent: battleOpponent, profiles, workshopPlayer, setWorkshopPlayer, campaignPlayer, matchMode } = useGameStore();
  const { credentials, session, error: multiplayerError } = useMultiplayerStore();
  const { economy, ready, pending, error, playerId, switchPlayer, equipShield } = useVeyloraStore();
  const campaignOwner = useCampaignStore((state) => state.playerId);
  const online = workshopOrigin === "playing" && credentials !== null;
  const aiOpponent = workshopOrigin === "playing" ? aiActive : workshopOrigin !== "menu";
  const selected = online
    ? credentials.playerId
    : workshopOrigin !== "menu" && workshopOrigin !== "playing"
      ? campaignOwner
      : aiOpponent
        ? matchMode === "skirmish" ? "P1" : campaignPlayer
        : workshopPlayer;
  const recipe = VEYLORA.recipes.find((entry) => entry.id === "reinforced-shield")!;
  const owned = Object.hasOwn(economy.purchases, recipe.id);
  const equipped = economy.equippedShield === recipe.id;
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<WorkshopFilter>("all");
  const filters = [
    ["all", "workshop.filterAll"],
    ["stats", "workshop.filterStats"],
    ["armory", "workshop.filterArmory"],
    ["special", "workshop.filterSpecial"],
  ] as const;

  useEffect(() => {
    let active = true;
    setLoaded(false);
    if (online) return;
    void switchPlayer(selected).then((success) => {
      if (active) setLoaded(success);
    });
    return () => { active = false; };
  }, [online, selected, switchPlayer]);

  useEffect(() => () => {
    if (useVeyloraStore.getState().playerId !== campaignOwner)
      void useVeyloraStore.getState().switchPlayer(campaignOwner);
  }, [campaignOwner]);

  return (
    <div className="overlay workshop-overlay">
      <main className="panel result-panel workshop-panel" aria-labelledby="workshop-title">
        <ResultDecorCanvas accent="cyan" />
        <h1 id="workshop-title">{t("workshop.title")}</h1>
        <p>{t("workshop.description")}</p>
        <div className="workshop-filter" role="group" aria-label={t("workshop.filterLabel")}>
          {filters.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {t(label)}
            </button>
          ))}
        </div>
        {!online && !aiOpponent && (
          <div className="workshop-players" aria-label={t("workshop.player")}>
            {(["P1", "P2"] as const).map((id) => (
              <PlayerSelectorButton key={id} playerId={id} aria-pressed={selected === id} disabled={pending > 0}
                onClick={() => setWorkshopPlayer(id)} />
            ))}
          </div>
        )}
        {Object.keys(profiles).length > 0 ? (
          <Shop
            filter={filter}
            editablePlayerId={selected}
            opponent={workshopOrigin === "playing" && aiActive && !online ? battleOpponent : null}
            dimInactive
            disabled={online && session?.status !== "finished"}
          />
        ) : (
          <p role="status">{t("workshop.loadingProfiles")}</p>
        )}
        {workshopError && <p className="lobby-error" role="alert">{t(workshopError)}</p>}
        {online && multiplayerError && <p className="lobby-error" role="alert">{multiplayerError}</p>}
        {(filter === "all" || filter === "special") &&
          (online ? (
            <p>{t("workshop.onlineShield")}</p>
          ) : (
            <section className="workshop-equipment" aria-labelledby="workshop-shield">
              <h2 id="workshop-shield">{t(recipe.name)}</h2>
              <p>{t("workshop.shieldScope", { player: selected })}</p>
              {pending > 0 && <p role="status">{t("economy.saving")}</p>}
              {error && <p className="lobby-error" role="alert">{t(error)}</p>}
              {!loaded && pending === 0 && error && (
                <button className="btn secondary" onClick={() => void switchPlayer(selected).then(setLoaded)}>
                  {t("workshop.retry")}
                </button>
              )}
              {loaded && playerId === selected && ready && error !== "veylora.loadError" &&
                (owned ? (
                  <>
                    <p>{t(equipped ? "economy.equipped" : "economy.unequipped")}</p>
                    <button
                      className="btn"
                      disabled={pending > 0}
                      onClick={() => void equipShield(equipped ? null : recipe.id)}
                    >
                      {t(equipped ? "economy.unequip" : "economy.equip")}
                    </button>
                  </>
                ) : (
                  <p>{t("workshop.shieldUnlock")}</p>
                ))}
            </section>
          ))}
        <button className="btn secondary" disabled={pending > 0 && !online && playerId !== campaignOwner} onClick={async () => {
          if (!online && playerId !== campaignOwner && !(await switchPlayer(campaignOwner))) return;
          closeWorkshop();
        }}>
          {t("lobby.back")}
        </button>
      </main>
    </div>
  );
}
