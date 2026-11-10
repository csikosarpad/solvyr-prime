import { useEffect, useState } from "react";
import { VEYLORA, missionById, missionBattlefield } from "@/game/data/campaignContent";
import { useVeyloraStore } from "@/game/state/veyloraStore";
import { useGameStore } from "@/game/state/gameStore";
import { useMultiplayerStore } from "@/game/state/multiplayerStore";
import { useT } from "@/i18n";
import { ConfirmDialog } from "./ConfirmDialog";
import { gameRef } from "./gameRef";
import { requestLandscape } from "./orientation";
import { CampaignStation } from "./CampaignStation";
import { CampaignReward } from "./CampaignReward";
import { rewardKey } from "@/game/systems/campaignEconomy";
import "./VeyloraOperations.css";

export function VeyloraOperations() {
  const t = useT();
  const { completedMissionIds, selectedMissionId, economy, ready, pending, error, reset, resetEconomy, refresh } =
    useVeyloraStore();
  const [startError, setStartError] = useState(false);
  const [starting, setStarting] = useState(false);
  const [resetOpen, setResetOpen] = useState<"progress" | "economy" | null>(null);
  useEffect(() => {
    const reload = () => {
      void refresh();
    };
    reload();
    window.addEventListener("focus", reload);
    return () => window.removeEventListener("focus", reload);
  }, [refresh]);
  const secured = VEYLORA.missions.every((mission) => completedMissionIds.includes(mission.id));
  const start = async (id: string) => {
    setStartError(false);
    setStarting(true);
    useMultiplayerStore.getState().leave();
    if (!(await gameRef.current?.startOperation(id))) {
      setStartError(true);
      setStarting(false);
      return;
    }
    void requestLandscape();
    useGameStore.getState().setScreen("playing");
  };
  return (
    <div className="overlay veylora-overlay">
      <main className="panel veylora-panel">
        <header>
          <div className="sector-code">SECTOR VEYLORA-03 · v{VEYLORA.contentVersion}</div>
          <h1>{t(VEYLORA.sector.name)}</h1>
          <p>{t("veylora.description")}</p>
          <p role="status">
            {secured
              ? t("veylora.secured")
              : t("campaign.progress", { value: completedMissionIds.length, total: VEYLORA.missions.length })}
          </p>
        </header>
        <p className="veylora-prototype">{t("veylora.prototype")}</p>
        <div className="veylora-locations">
          {VEYLORA.sector.locations.map((location) => (
            <section key={location.id} className={`veylora-location is-${location.kind}`}>
              <div className="sector-code">{location.id.toUpperCase()}</div>
              <h2>{t(location.name)}</h2>
              {location.missionIds.length === 0 && <p>{t("veylora.stationPrototype")}</p>}
              {location.kind === "station" && <CampaignStation recipeIds={location.recipeIds} />}
              {location.missionIds.map((id) => {
                const mission = missionById(id);
                const field = missionBattlefield(mission);
                const completed = completedMissionIds.includes(id);
                return (
                  <div key={id} className={selectedMissionId === id ? "is-selected" : undefined}>
                    <p>{t(field.briefing)}</p>
                    <p>{t(mission.protection ? "veylora.medium" : "veylora.easy")}</p>
                    {mission.protection && <p>{t("veylora.protection")}</p>}
                    <p>{t(completed ? "veylora.completed" : "veylora.available")}</p>
                    <CampaignReward
                      rewards={economy.claims[rewardKey(id)]?.rewards ?? mission.rewards}
                      claimed={Object.hasOwn(economy.claims, rewardKey(id))}
                    />
                    <button
                      className="btn"
                      disabled={starting || !ready || pending > 0 || error === "veylora.loadError"}
                      onClick={() => void start(id)}
                    >
                      {t(completed ? "campaign.replay" : "campaign.deploy")}
                    </button>
                  </div>
                );
              })}
            </section>
          ))}
        </div>
        {pending > 0 && <p role="status">{t("economy.saving")}</p>}
        {error && (
          <p className="lobby-error" role="alert">
            {t(error)}
          </p>
        )}
        {startError && (
          <p className="lobby-error" role="alert">
            {t("campaign.startError")}
          </p>
        )}
        <footer className="veylora-actions">
          <button
            className="btn secondary"
            disabled={starting || pending > 0}
            onClick={() => useGameStore.getState().setScreen("menu")}
          >
            {t("result.mainMenu")}
          </button>
          <button
            className="btn secondary"
            disabled={starting || pending > 0 || error === "veylora.loadError"}
            onClick={() => setResetOpen("progress")}
          >
            {t("veylora.reset")}
          </button>
          <button className="btn secondary" disabled={starting || pending > 0} onClick={() => setResetOpen("economy")}>
            {t("economy.reset")}
          </button>
        </footer>
        {resetOpen && (
          <ConfirmDialog
            destructive
            title={t(resetOpen === "economy" ? "economy.reset" : "veylora.reset")}
            message={t(resetOpen === "economy" ? "economy.resetConfirm" : "veylora.resetConfirm")}
            cancelLabel={t("dialog.cancel")}
            confirmLabel={t("dialog.delete")}
            onCancel={() => setResetOpen(null)}
            onConfirm={async () => {
              if (
                useVeyloraStore.getState().pending === 0 &&
                (await (resetOpen === "economy" ? resetEconomy() : reset()))
              )
                setResetOpen(null);
            }}
          />
        )}
      </main>
    </div>
  );
}
