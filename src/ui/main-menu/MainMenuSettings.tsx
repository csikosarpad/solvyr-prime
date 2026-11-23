import { useEffect, useRef, useState, type CSSProperties } from "react";
import { MAX_NAME_LENGTH, usePlayerNamesStore } from "@/game/state/playerNames";
import { AUDIO_CHANNELS, useAudioSettings } from "@/game/state/audioSettings";
import { useAiSettings } from "@/game/state/aiSettings";
import { useCampaignStore } from "@/game/state/campaignStore";
import { useGameStore } from "@/game/state/gameStore";
import { useVeyloraStore } from "@/game/state/veyloraStore";
import {
  ARMOR_COLORS, ARMOR_COLOR_OPTIONS, armorTint, cssPlayerColor, DEFAULT_ARMOR_COLORS, DEFAULT_DISTANCE,
  DEFAULT_LIGHTNESS, DEFAULT_PLAYER_COLORS, markingColor, maxColorDistance, MIN_DISTANCE,
  PLAYER_COLORS, PLAYER_COLOR_OPTIONS, usePlayerColors, type ColorPreferences,
} from "@/game/state/playerColors";
import type { LocalPlayerId } from "@/game/state/playerId";
import { usePlayerUnits } from "@/game/state/playerUnits";
import { useT, type MessageKey } from "@/i18n";
import { ConfirmDialog } from "../ConfirmDialog";
import { gameRef } from "../gameRef";
import { UnitIllustration } from "../result/UnitIllustration";
import { getUnitPresentation } from "../result/unitPresentation";
import { LanguageSwitch } from "./LanguageSwitch";

interface MainMenuSettingsProps {
  onBack: () => void;
}

/** A játékmenet külön-külön törölhető komponenságai. */
const RESET_COMPONENTS = ["profiles", "campaign", "veylora", "ai"] as const;
type ResetComponent = (typeof RESET_COMPONENTS)[number];
const RESET_COMPONENT_LABELS: Record<ResetComponent, MessageKey> = {
  profiles: "menu.resetProfiles",
  campaign: "menu.resetCampaign",
  veylora: "menu.resetVeylora",
  ai: "menu.resetAi",
};

function VolumeSlider({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label?: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const percent = Math.round(value * 100);
  const style: CSSProperties & { "--volume-whiteness": string } = {
    "--volume-whiteness": `${Math.min(100, (percent / 80) * 100)}%`,
  };
  return (
    <div className="audio-volume-control">
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={1}
        value={percent}
        aria-label={label}
        aria-valuetext={`${percent}%`}
        style={style}
        data-volume-high={percent >= 80}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
      />
      <output htmlFor={id}>{percent}%</output>
    </div>
  );
}

function ColorSliders({ id, onEdit, onReset }: {
  id: LocalPlayerId;
  onEdit: () => void;
  onReset: (reset: () => void) => void;
}) {
  const t = useT();
  const { lightness, distances, setLightness, setDistance } = usePlayerColors();
  const [warning, setWarning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  const max = maxColorDistance(lightness[id]);
  const showWarning = () => {
    setWarning(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setWarning(false), 2000);
  };

  return (
    <div className="color-sliders">
      <div className="color-slider">
        <label htmlFor={`${id}-lightness`}>{t("colors.lightness")}</label>
        <output htmlFor={`${id}-lightness`}>{Math.round(lightness[id] * 100)}%</output>
        <button type="button" className="color-reset" aria-label={t("colors.resetLightness", { id })}
          disabled={lightness[id] === DEFAULT_LIGHTNESS} onClick={() => onReset(() => setLightness(id, DEFAULT_LIGHTNESS))}>↺</button>
        <input id={`${id}-lightness`} type="range" min="15" max="85" step="5"
          value={Math.round(lightness[id] * 100)} onChange={(e) => {
            onEdit();
            setLightness(id, Number(e.target.value) / 100);
          }} />
      </div>
      <div className="color-slider">
        <label htmlFor={`${id}-distance`}>{t("colors.distance")}</label>
        <output htmlFor={`${id}-distance`}>{distances[id].toFixed(2)}</output>
        <button type="button" className="color-reset" aria-label={t("colors.resetDistance", { id })}
          disabled={distances[id] === DEFAULT_DISTANCE} onClick={() => onReset(() => setDistance(id, DEFAULT_DISTANCE))}>↺</button>
        <div className="color-distance-track" style={{ "--distance-max": `${max / 0.7 * 100}%` } as CSSProperties}>
          <input id={`${id}-distance`} type="range" min="0" max="70" step="5"
            aria-valuemin={25} aria-valuemax={Math.round(max * 100)}
            aria-valuetext={distances[id].toFixed(2)}
            value={Math.round(distances[id] * 100)}
            onChange={(e) => {
              const value = Number(e.target.value) / 100;
              if (value < MIN_DISTANCE) showWarning();
              const next = Math.min(max, Math.max(MIN_DISTANCE, value));
              if (next !== distances[id]) {
                onEdit();
                setDistance(id, next);
              }
            }} />
        </div>
      </div>
      <small className="color-warning" role="status">{warning ? t("colors.distanceWarning") : ""}</small>
    </div>
  );
}

export function MainMenuSettings({ onBack }: MainMenuSettingsProps) {
  const t = useT();
  const muted = useGameStore((s) => s.muted);
  const toggleMuted = useGameStore((s) => s.toggleMuted);
  const names = usePlayerNamesStore((s) => s.names);
  const setName = usePlayerNamesStore((s) => s.setName);
  const colorSettings = usePlayerColors();
  const { units, setUnit, error: unitError } = usePlayerUnits();
  const [colorPlayer, setColorPlayer] = useState<LocalPlayerId>("P1");
  const { colors, armorColors, lightness, distances, setColor, setArmorColor, resetPlayer, resetColors, restoreColors, error: colorError } = colorSettings;
  const [colorUndo, setColorUndo] = useState<ColorPreferences | null>(null);
  const playerDefault = (id: LocalPlayerId) =>
    colors[id] === DEFAULT_PLAYER_COLORS[id] && armorColors[id] === DEFAULT_ARMOR_COLORS[id] &&
    lightness[id] === DEFAULT_LIGHTNESS && distances[id] === DEFAULT_DISTANCE;
  const colorsDefault = (["P1", "P2"] as const).every(playerDefault);
  const resetWithUndo = (reset: () => void) => {
    setColorUndo({ colors, armorColors, lightness, distances });
    reset();
  };
  const channels = useAudioSettings((s) => s.channels);
  const setChannel = useAudioSettings((s) => s.setChannel);
  const volume = useAudioSettings((s) => s.volume);
  const setVolume = useAudioSettings((s) => s.setVolume);
  const channelVolumes = useAudioSettings((s) => s.channelVolumes);
  const setChannelVolume = useAudioSettings((s) => s.setChannelVolume);
  const audioError = useAudioSettings((s) => s.error);
  const aiEnabled = useAiSettings((s) => s.enabled);
  const setAiEnabled = useAiSettings((s) => s.setEnabled);
  const aiMatches = useAiSettings((s) => s.memory.matches);
  const resetAiMemory = useAiSettings((s) => s.resetMemory);
  const veyloraPending = useVeyloraStore((s) => s.pending);
  const veyloraError = useVeyloraStore((s) => s.error);
  const [gameResetOpen, setGameResetOpen] = useState(false);
  const [resetSelection, setResetSelection] = useState<Record<ResetComponent, boolean>>({
    profiles: false,
    campaign: false,
    veylora: false,
    ai: false,
  });
  const nothingSelected = RESET_COMPONENTS.every((component) => !resetSelection[component]);

  const confirmGameReset = async () => {
    if (resetSelection.profiles) gameRef.current?.resetProgress();
    if (resetSelection.campaign) useCampaignStore.getState().resetAll();
    if (resetSelection.ai) resetAiMemory();
    if (resetSelection.veylora) await useVeyloraStore.getState().resetEconomyAll();
    setGameResetOpen(false);
  };

  return (
    <div className="panel main-menu-panel settings-menu-panel">
      <header className="main-menu-header">
        <h1>{t("menu.settings")}</h1>
        <button type="button" className="settings-close" aria-label={t("menu.closeSettings")} onClick={onBack}>×</button>
      </header>
      <section className="main-menu-settings" aria-label={t("menu.settings")}>
        <details className="settings-group">
          <summary>{t("menu.language")}<span className="settings-group-indicator" aria-hidden="true" /></summary>
          <div className="settings-group-content">
            <div className="main-menu-setting">
              <LanguageSwitch />
            </div>
          </div>
        </details>
        <details className="settings-group">
          <summary>{t("menu.sound")}<span className="settings-group-indicator" aria-hidden="true" /></summary>
          <div className="settings-group-content">
            <div className="settings-audio-card">
              <div className="main-menu-setting settings-audio-row">
                <button
                  type="button"
                  role="switch"
                  className="audio-switch"
                  aria-checked={!muted}
                  onClick={toggleMuted}
                >
                  <span className="audio-switch-track" aria-hidden="true">
                    <span className="audio-switch-thumb" />
                  </span>
                  <span className="audio-switch-label">
                    {t("hud.sound", { state: muted ? t("hud.soundOff") : t("hud.soundOn") })}
                  </span>
                </button>
              </div>
              <div className="main-menu-setting settings-audio-row">
                <label htmlFor="master-volume">{t("audio.volume")}</label>
                <VolumeSlider id="master-volume" value={volume} onChange={setVolume} />
              </div>
              <div className="main-menu-setting settings-audio-row">
                <span>{t("menu.audioChannels")}</span>
                <div className="audio-channel-list">
                  {AUDIO_CHANNELS.map((channel) => (
                    <div key={channel} className="audio-channel">
                      <button
                        type="button"
                        role="switch"
                        className="audio-switch"
                        aria-checked={channels[channel]}
                        onClick={() => setChannel(channel, !channels[channel])}
                      >
                        <span className="audio-switch-track" aria-hidden="true">
                          <span className="audio-switch-thumb" />
                        </span>
                        <span className="audio-switch-label">{t(`audio.${channel}` as MessageKey)}</span>
                      </button>
                      <VolumeSlider
                        id={`${channel}-volume`}
                        label={t(`audio.${channel}Volume` as MessageKey)}
                        value={channelVolumes[channel]}
                        onChange={(value) => setChannelVolume(channel, value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </details>
        {audioError && <small className="settings-error" role="alert">{t(audioError)}</small>}
        <details className="settings-group">
          <summary>{t("menu.players")}<span className="settings-group-indicator" aria-hidden="true" /></summary>
          <div className="settings-group-content">
            <div className="main-menu-setting">
              <span>{t("menu.opponent")}</span>
              <div className="audio-channel-buttons" role="group" aria-label={t("menu.opponent")}>
                <button type="button" className="btn secondary" aria-pressed={aiEnabled} onClick={() => setAiEnabled(true)}>
                  {t("menu.opponentAi")}
                </button>
                <button type="button" className="btn secondary" aria-pressed={!aiEnabled} onClick={() => setAiEnabled(false)}>
                  {t("menu.opponentHuman")}
                </button>
              </div>
              <small>{t("menu.opponentHint")}</small>
            </div>
            <div className="main-menu-setting">
              <span>{t("menu.playerNames")}</span>
              <div className="player-name-fields">
                {["P1", "P2"].map((id) => (
                  <input
                    key={id}
                    maxLength={MAX_NAME_LENGTH}
                    placeholder={id}
                    aria-label={t("menu.playerName", { id })}
                    value={names[id] ?? ""}
                    onChange={(event) => setName(id, event.target.value)}
                  />
                ))}
              </div>
            </div>
            <div className="main-menu-setting">
              <span>{t("colors.title")}</span>
              <small>{t("colors.hint")}</small>
              <div className="player-color-selector" role="group" aria-label={t("menu.players")}>
                {(["P1", "P2"] as const).map((id) => (
                  <button key={id} type="button" className="btn secondary" aria-pressed={colorPlayer === id}
                    onClick={() => setColorPlayer(id)}>{id}</button>
                ))}
              </div>
              <fieldset className="player-color-palette" key={colorPlayer}>
                <legend>{t("colors.player", { id: colorPlayer })}</legend>
                <span>{t("units.title")}</span>
                <div className="audio-channel-buttons" role="group" aria-label={t("units.player", { id: colorPlayer })}>
                  {(["tank", "soldier"] as const).map((unit) => (
                    <button key={unit} type="button" className="btn secondary" aria-pressed={units[colorPlayer] === unit}
                      onClick={() => setUnit(colorPlayer, unit)}>{t(`units.${unit}`)}</button>
                  ))}
                </div>
                <small>{t("units.hint")}</small>
                <button type="button" className="color-reset" aria-label={t("colors.resetPlayer", { id: colorPlayer })}
                  disabled={playerDefault(colorPlayer)} onClick={() => resetWithUndo(() => resetPlayer(colorPlayer))}>↺</button>
                <div className="player-color-preview">
                  <UnitIllustration
                    presentation={getUnitPresentation(colorPlayer, "ground", markingColor(colorPlayer, colorSettings), armorColors[colorPlayer], armorTint(colorPlayer, colorSettings), units[colorPlayer])}
                  />
                </div>
                <span>{t("colors.armor")}</span>
                <div className="player-color-options">
                  {ARMOR_COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="player-color-option armor-option"
                      style={{ "--swatch-color": cssPlayerColor(ARMOR_COLORS[color].swatch) } as CSSProperties}
                      title={t(`colors.${color}`)}
                      aria-label={t("colors.armorOption", { id: colorPlayer, color: t(`colors.${color}`) })}
                      aria-pressed={armorColors[colorPlayer] === color}
                      onClick={() => { setColorUndo(null); setArmorColor(colorPlayer, color); }}
                    >
                      {armorColors[colorPlayer] === color && <span aria-hidden="true">✓</span>}
                    </button>
                  ))}
                </div>
                <span>{t("colors.accent")}</span>
                <div className="player-color-options">
                  {PLAYER_COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="player-color-option marking-option"
                      data-color={color}
                      style={{ "--swatch-color": cssPlayerColor(PLAYER_COLORS[color]) } as CSSProperties}
                      title={t(color === "white" ? "colors.neutral" : `colors.${color}`)}
                      aria-label={t("colors.option", { id: colorPlayer, color: t(color === "white" ? "colors.neutral" : `colors.${color}`) })}
                      aria-pressed={colors[colorPlayer] === color}
                      onClick={() => { setColorUndo(null); setColor(colorPlayer, color); }}
                    >
                      {colors[colorPlayer] === color && <span aria-hidden="true">✓</span>}
                    </button>
                  ))}
                </div>
                <ColorSliders id={colorPlayer} onEdit={() => setColorUndo(null)} onReset={resetWithUndo} />
              </fieldset>
              <div className="color-global-actions">
                <button type="button" className="btn secondary" disabled={colorsDefault} onClick={() => resetWithUndo(resetColors)}>
                  {t("colors.resetAll")}
                </button>
                {colorUndo && (
                  <button type="button" className="btn secondary" onClick={() => { restoreColors(colorUndo); setColorUndo(null); }}>
                    {t("colors.undoReset")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </details>
        {colorError && <small className="settings-error" role="alert">{t(colorError)}</small>}
        {unitError && <small className="settings-error" role="alert">{t(unitError)}</small>}
        <details className="settings-group">
          <summary>{t("menu.gameplay")}<span className="settings-group-indicator" aria-hidden="true" /></summary>
          <div className="settings-group-content">
            <div className="game-reset-panel">
              <p className="game-reset-info"><span aria-hidden="true">ⓘ</span>{t("menu.resetHint")}</p>
              <div className="game-reset-options">
                {RESET_COMPONENTS.map((component) => (
                  <button
                    key={component}
                    type="button"
                    role="switch"
                    className="audio-switch"
                    aria-checked={resetSelection[component]}
                    onClick={() =>
                      setResetSelection((selection) => ({ ...selection, [component]: !selection[component] }))
                    }
                  >
                    <span className="audio-switch-track" aria-hidden="true">
                      <span className="audio-switch-thumb" />
                    </span>
                    <span className="audio-switch-label">
                      {t(RESET_COMPONENT_LABELS[component], component === "ai" ? { matches: aiMatches } : undefined)}
                    </span>
                  </button>
                ))}
              </div>
              <div className="game-reset-danger">
                <strong><span aria-hidden="true">⚠</span> {t("menu.resetWarningTitle")}</strong>
                <p>{t("menu.resetConfirm")}</p>
                <button type="button" className="btn game-reset-button"
                  disabled={veyloraPending > 0 || nothingSelected}
                  onClick={() => setGameResetOpen(true)}>
                  {t("menu.reset")}
                </button>
              </div>
            </div>
          </div>
        </details>
        {veyloraError && <small className="settings-error" role="alert">{t(veyloraError)}</small>}
      </section>
      <button className="btn secondary main-menu-back" onClick={onBack}>
        {t("lobby.back")}
      </button>
      {gameResetOpen && (
        <ConfirmDialog
          destructive
          mobileSheet
          title={t("menu.resetTitle")}
          message={t("menu.resetConfirm")}
          cancelLabel={t("dialog.cancel")}
          confirmLabel={t("dialog.delete")}
          onCancel={() => setGameResetOpen(false)}
          onConfirm={() => void confirmGameReset()}
        />
      )}
    </div>
  );
}
