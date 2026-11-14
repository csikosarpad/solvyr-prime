import { useEffect, useState } from "react";
import { VEYLORA, missionAvailable, missionById, missionBattlefield } from "@/game/data/campaignContent";
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
import { CampaignStarfieldCanvas } from "./CampaignStarfieldCanvas";
import "./CampaignMap.css";
import "./VeyloraOperations.css";

export function VeyloraOperations() {
  const t = useT();
  const {
    completedMissionIds,
    selectedMissionId,
    economy,
    ready,
    pending,
    error,
    reset,
    resetEconomy,
    refresh,
  } = useVeyloraStore();
  const [startError, setStartError] = useState(false);
  const [starting, setStarting] = useState(false);
  const [resetOpen, setResetOpen] = useState<"progress" | "economy" | null>(null);
  const initialLocationId =
    VEYLORA.sector.locations.find((location) => location.missionIds.includes(selectedMissionId ?? ""))?.id ??
    VEYLORA.sector.locations[0]!.id;
  const [selectedLocationId, setSelectedLocationId] = useState(initialLocationId);
  const [warpSequence, setWarpSequence] = useState(1);
  const [departingLocationId, setDepartingLocationId] = useState<string | null>(null);
  useEffect(() => {
    const reload = () => {
      void refresh();
    };
    reload();
    window.addEventListener("focus", reload);
    return () => window.removeEventListener("focus", reload);
  }, [refresh]);
  const secured = VEYLORA.missions.every((mission) => completedMissionIds.includes(mission.id));
  const inspectLocation = (id: string) => {
    setDepartingLocationId(selectedLocationId);
    setSelectedLocationId(id);
    setWarpSequence((sequence) => sequence + 1);
  };
  const locationPanels = VEYLORA.sector.locations.map((location) => ({ location, departing: false }));
  if (departingLocationId !== null) {
    const departingLocation = VEYLORA.sector.locations.find((location) => location.id === departingLocationId);
    if (!departingLocation) throw new Error(`Unknown VEYLORA location: ${departingLocationId}`);
    locationPanels.push({ location: departingLocation, departing: true });
  }
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
    <div className="overlay campaign-overlay veylora-overlay">
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
        <div className="campaign-layout veylora-layout">
          <section className="campaign-star-map veylora-star-map" aria-label={t("veylora.title")}>
            <CampaignStarfieldCanvas warpSequence={warpSequence} />
            {VEYLORA.sector.locations.map((location, index) => {
              const angle = (index / VEYLORA.sector.locations.length) * Math.PI * 2 - Math.PI / 2;
              const missions = location.missionIds.map(missionById);
              const completed =
                missions.length > 0 && missions.every((mission) => completedMissionIds.includes(mission.id));
              const available = missions.every((mission) => missionAvailable(mission, completedMissionIds));
              const status = completed ? "completed" : available ? "available" : "locked";
              return (
                <button
                  key={location.id}
                  className={`campaign-node is-${status}${selectedLocationId === location.id ? " is-selected" : ""}`}
                  style={{ left: `${50 + Math.cos(angle) * 30}%`, top: `${50 + Math.sin(angle) * 30}%` }}
                  aria-pressed={selectedLocationId === location.id}
                  aria-label={`${location.id.toUpperCase()}, ${t(location.name)}, ${t(`campaign.${status}`)}`}
                  onClick={() => inspectLocation(location.id)}
                >
                  <span className="sector-code">{location.id.toUpperCase()}</span>
                </button>
              );
            })}
          </section>
          <section className="campaign-sector-card" aria-labelledby={`veylora-location-name-${selectedLocationId}`}>
            {locationPanels.map(({ location, departing }) => {
              const active = !departing && location.id === selectedLocationId;
              return (
                <div
                  key={`${location.id}-${departing ? "departure" : "content"}-${active || departing ? warpSequence : 0}`}
                  className={`campaign-sector-content${active ? " is-active" : ""}${active && warpSequence > 0 ? " is-arriving" : ""}${departing ? " is-departing" : ""}`}
                  aria-hidden={!active}
                >
                  <div className="sector-code">{location.id.toUpperCase()}</div>
                  <h2 id={active ? `veylora-location-name-${location.id}` : undefined}>{t(location.name)}</h2>
                  {location.kind === "station" && <p>{t("veylora.stationPrototype")}</p>}
                  {location.kind === "station" && <CampaignStation recipeIds={location.recipeIds} />}
                  {location.missionIds.map((id) => {
                    const mission = missionById(id);
                    const field = missionBattlefield(mission);
                    const completed = completedMissionIds.includes(id);
                    const available = missionAvailable(mission, completedMissionIds);
                    return (
                      <div key={id} className={selectedMissionId === id ? "is-selected" : undefined}>
                        <p>{t(field.briefing)}</p>
                        <p>{t(mission.protection ? "veylora.medium" : "veylora.easy")}</p>
                        {mission.protection && <p>{t("veylora.protection")}</p>}
                        {mission.prerequisites.length > 0 && (
                          <p>
                            {t("campaign.requires")}:{" "}
                            {mission.prerequisites
                              .map((requiredId) =>
                                t(
                                  VEYLORA.sector.locations.find((entry) => entry.missionIds.includes(requiredId))!
                                    .name,
                                ),
                              )
                              .join(", ")}
                          </p>
                        )}
                        <p>
                          {t(completed ? "veylora.completed" : available ? "veylora.available" : "campaign.locked")}
                        </p>
                        {Object.keys(mission.rewards.resources).length > 0 || mission.rewards.technologies.length > 0 ? (
                          <CampaignReward
                            rewards={economy.claims[rewardKey(id)]?.rewards ?? mission.rewards}
                            claimed={Object.hasOwn(economy.claims, rewardKey(id))}
                          />
                        ) : (
                          <p>{t("veylora.noEconomicReward")}</p>
                        )}
                        <button
                          className="btn"
                          disabled={
                            !active || !available || starting || !ready || pending > 0 || error === "veylora.loadError"
                          }
                          onClick={() => void start(id)}
                        >
                          {t(completed ? "campaign.replay" : "campaign.deploy")}
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </section>
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
            onClick={() => useGameStore.getState().setScreen("campaignMap")}
          >
            {t("campaign.title")}
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
