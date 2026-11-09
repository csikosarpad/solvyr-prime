import { useState } from "react";
import { VEYLORA, missionById, missionBattlefield } from "@/game/data/campaignContent";
import { useVeyloraStore } from "@/game/state/veyloraStore";
import { useGameStore } from "@/game/state/gameStore";
import { useMultiplayerStore } from "@/game/state/multiplayerStore";
import { useT } from "@/i18n";
import { ConfirmDialog } from "./ConfirmDialog";
import { gameRef } from "./gameRef";
import { requestLandscape } from "./orientation";
import "./VeyloraOperations.css";

export function VeyloraOperations() {
  const t = useT();
  const { completedMissionIds, selectedMissionId, error, reset } = useVeyloraStore();
  const [startError, setStartError] = useState(false);
  const [starting, setStarting] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const secured = VEYLORA.missions.every((mission) => completedMissionIds.includes(mission.id));
  const start = (id: string) => {
    setStartError(false);
    setStarting(true);
    useMultiplayerStore.getState().leave();
    if (!gameRef.current?.startOperation(id)) {
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
                    <button
                      className="btn"
                      disabled={starting || error === "veylora.loadError"}
                      onClick={() => start(id)}
                    >
                      {t(completed ? "campaign.replay" : "campaign.deploy")}
                    </button>
                  </div>
                );
              })}
            </section>
          ))}
        </div>
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
          <button className="btn secondary" onClick={() => useGameStore.getState().setScreen("menu")}>
            {t("result.mainMenu")}
          </button>
          <button className="btn secondary" onClick={() => setResetOpen(true)}>
            {t("veylora.reset")}
          </button>
        </footer>
        {resetOpen && (
          <ConfirmDialog
            destructive
            title={t("veylora.reset")}
            message={t("veylora.resetConfirm")}
            cancelLabel={t("dialog.cancel")}
            confirmLabel={t("dialog.delete")}
            onCancel={() => setResetOpen(false)}
            onConfirm={() => {
              if (reset()) setResetOpen(false);
            }}
          />
        )}
      </main>
    </div>
  );
}
