import { useEffect, useState } from "react";
import { SECTORS, sectorById, sectorStatus, TRAINING_SECTOR, type SectorId } from "@/game/data/sectors";
import { VEYLORA } from "@/game/data/campaignContent";
import { useCampaignStore } from "@/game/state/campaignStore";
import { useGameStore } from "@/game/state/gameStore";
import { useMultiplayerStore } from "@/game/state/multiplayerStore";
import { useVeyloraStore } from "@/game/state/veyloraStore";
import { useT } from "@/i18n";
import { ConfirmDialog } from "./ConfirmDialog";
import { gameRef } from "./gameRef";
import { requestLandscape } from "./orientation";
import { CampaignStarfieldCanvas } from "./CampaignStarfieldCanvas";
import { CampaignSectorCard } from "./CampaignSectorCard";
import "./CampaignMap.css";
import { ReadAloudButton } from "./ReadAloudButton";
import { ReadAloudText, useReadAloud } from "./ReadAloudText";
import { PlayerSelectorButton } from "./PlayerSelectorButton";

const VEYLORA_MAP_POSITION = { x: 84, y: 85 };
type MapNodeId = SectorId | "veylora-03";

export function CampaignMap() {
  const t = useT();
  const { completedIds, selectedId, select, error, reset, playerId, switchPlayer } = useCampaignStore();
  const { completedMissionIds, refresh: refreshVeylora, switchPlayer: switchVeylora, pending } = useVeyloraStore();
  const [inspectedId, setInspectedId] = useState<MapNodeId>(selectedId);
  const setScreen = useGameStore((s) => s.setScreen);
  const [starting, setStarting] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [startError, setStartError] = useState(false);
  const [warpSequence, setWarpSequence] = useState(0);
  const [resetOpen, setResetOpen] = useState(false);
  const [departingId, setDepartingId] = useState<SectorId | null>(null);
  useEffect(() => {
    void refreshVeylora();
  }, [refreshVeylora]);
  const goalTitle = t("campaign.goalTitle");
  const goalDescription = t("campaign.goalDescription");
  const goalText = `${goalTitle}. ${goalDescription}`;
  const goalSpeech = useReadAloud(goalText);
  const start = (id: SectorId) => {
    if (!gameRef.current) {
      setStartError(true);
      return;
    }
    setStarting(true);
    useMultiplayerStore.getState().leave();
    void requestLandscape();
    if (!gameRef.current.startCampaign(id)) {
      setStarting(false);
      setStartError(true);
      return;
    }
    setScreen("playing");
  };
  const veyloraState = VEYLORA.missions.every((mission) => completedMissionIds.includes(mission.id))
    ? "completed"
    : completedIds.includes("alpha-01")
      ? "available"
      : "locked";
  const veyloraProgress = completedMissionIds.filter((id) =>
    VEYLORA.missions.some((mission) => mission.id === id),
  ).length;
  const inspectNode = (id: MapNodeId, state: "completed" | "available" | "locked") => {
    setDepartingId(inspectedId === "veylora-03" ? null : inspectedId);
    setWarpSequence((sequence) => sequence + 1);
    setInspectedId(id);
    setStartError(false);
    if (id !== "veylora-03" && state !== "locked") select(id);
  };

  return (
    <div className="overlay campaign-overlay">
      <main className="panel campaign-panel">
        <header className="campaign-header">
          <div>
            <div className="sector-code">{t("campaign.operation")}</div>
            <h1>{t("campaign.title")}</h1>
          </div>
          <span className="campaign-progress">
            {t("campaign.progress", {
              value: completedIds.length + (veyloraState === "completed" ? 1 : 0),
              total: SECTORS.length + 1,
            })}
          </span>
        </header>
        <section className="campaign-goal" aria-label={t("campaign.goalTitle")}>
          <h2>
            <ReadAloudText text={goalTitle} range={goalSpeech.range} />
          </h2>
          <p>
            <ReadAloudText text={goalDescription} offset={goalTitle.length + 2} range={goalSpeech.range} />
          </p>
          <ReadAloudButton text={goalText} playback={goalSpeech} />
        </section>
        <div className="workshop-players" aria-label={t("workshop.player")}>
          {(["P1", "P2"] as const).map((id) => (
            <PlayerSelectorButton key={id} playerId={id} aria-pressed={id === playerId}
              disabled={pending > 0 || starting || switching || error === "campaign.saveError"}
              onClick={async () => {
                if (id === playerId) return;
                setSwitching(true);
                switchPlayer(id);
                setInspectedId(useCampaignStore.getState().selectedId);
                await switchVeylora(id);
                setSwitching(false);
              }} />
          ))}
        </div>
        <div className="campaign-layout">
          <section className="campaign-star-map" aria-label={t("campaign.title")}>
            <CampaignStarfieldCanvas warpSequence={warpSequence} />
            <svg className="campaign-orbits" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {SECTORS.flatMap((target) =>
                target.prerequisites.map((id) => {
                  const source = sectorById(id);
                  return (
                    <line
                      key={`${id}-${target.id}`}
                      x1={source.position.x}
                      y1={source.position.y}
                      x2={target.position.x}
                      y2={target.position.y}
                      className={completedIds.includes(id) ? "is-open" : ""}
                    />
                  );
                }),
              )}
              <line
                x1={TRAINING_SECTOR.position.x}
                y1={TRAINING_SECTOR.position.y}
                x2={VEYLORA_MAP_POSITION.x}
                y2={VEYLORA_MAP_POSITION.y}
                className={completedIds.includes("alpha-01") ? "is-open" : ""}
              />
            </svg>
            {SECTORS.map((entry) => {
              const state = sectorStatus(entry.id, completedIds);
              return (
                <button
                  key={entry.id}
                  className={`campaign-node is-${state}${inspectedId === entry.id ? " is-selected" : ""}`}
                  style={{ left: `${entry.position.x}%`, top: `${entry.position.y}%` }}
                  aria-pressed={inspectedId === entry.id}
                  aria-label={`${entry.code}, ${entry.name}, ${t(`campaign.${state}`)}`}
                  onClick={() => inspectNode(entry.id, state)}
                >
                  <span className="sector-code">{entry.code.replace("SECTOR ", "")}</span>
                </button>
              );
            })}
            <button
              className={`campaign-node campaign-node-is-campaign is-${veyloraState}${inspectedId === "veylora-03" ? " is-selected" : ""}`}
              style={{ left: `${VEYLORA_MAP_POSITION.x}%`, top: `${VEYLORA_MAP_POSITION.y}%` }}
              aria-pressed={inspectedId === "veylora-03"}
              aria-label={`${t(VEYLORA.sector.name)}, ${t(`campaign.${veyloraState}`)}`}
              onClick={() => inspectNode("veylora-03", veyloraState)}
            >
              <span className="sector-code">{VEYLORA.sector.id.toUpperCase()}</span>
            </button>
          </section>
          {inspectedId === "veylora-03" ? (
            <section className="campaign-sector-card" aria-labelledby="campaign-veylora-name">
              <div className="campaign-sector-content is-active">
                <div className="sector-code">{VEYLORA.sector.id.toUpperCase()}</div>
                <h2 id="campaign-veylora-name">{t(VEYLORA.sector.name)}</h2>
                <p>{t("veylora.description")}</p>
                <dl>
                  <div>
                    <dt>{t("campaign.status")}</dt>
                    <dd>{t(`campaign.${veyloraState}`)}</dd>
                  </div>
                  <div>
                    <dt>{t("campaign.requires")}</dt>
                    <dd>{TRAINING_SECTOR.name}</dd>
                  </div>
                </dl>
                <p>{t("campaign.progress", { value: veyloraProgress, total: VEYLORA.missions.length })}</p>
                <button
                  className="btn"
                  disabled={veyloraState === "locked" || starting || switching}
                  onClick={() => setScreen("veylora")}
                >
                  {t("campaign.enterSector")}
                </button>
              </div>
            </section>
          ) : (
            <CampaignSectorCard
              inspectedId={inspectedId}
              completedIds={completedIds}
              starting={starting || switching}
              loadError={error === "campaign.loadError"}
              warpSequence={warpSequence}
              departingId={departingId}
              onStart={() => start(inspectedId)}
            />
          )}
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
        <footer className="campaign-actions">
          <button className="btn secondary" onClick={() => useGameStore.getState().openWorkshop()}>
            {t("workshop.title")}
          </button>
          <button className="btn secondary" onClick={() => setScreen("menu")}>
            {t("result.mainMenu")}
          </button>
          <button className="btn secondary" onClick={() => setResetOpen(true)}>
            {t("campaign.reset")}
          </button>
        </footer>
        {resetOpen && (
          <ConfirmDialog
            destructive
            title={t("campaign.resetTitle")}
            message={t("campaign.resetConfirm")}
            cancelLabel={t("dialog.cancel")}
            confirmLabel={t("dialog.delete")}
            onCancel={() => setResetOpen(false)}
            onConfirm={() => {
              setResetOpen(false);
              reset();
              setInspectedId("alpha-01");
              setStartError(false);
            }}
          />
        )}
      </main>
    </div>
  );
}
