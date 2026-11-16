import { useState, type CSSProperties } from "react";
import { MAX_NAME_LENGTH, usePlayerNamesStore } from "@/game/state/playerNames";
import { AUDIO_CHANNELS, useAudioSettings } from "@/game/state/audioSettings";
import { useAiSettings } from "@/game/state/aiSettings";
import { useCampaignStore } from "@/game/state/campaignStore";
import { useGameStore } from "@/game/state/gameStore";
import { useVeyloraStore } from "@/game/state/veyloraStore";
import { cssPlayerColor, PLAYER_COLORS, PLAYER_COLOR_OPTIONS, usePlayerColors } from "@/game/state/playerColors";
import { useT, type MessageKey } from "@/i18n";
import { ConfirmDialog } from "../ConfirmDialog";
import { gameRef } from "../gameRef";
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

export function MainMenuSettings({ onBack }: MainMenuSettingsProps) {
  const t = useT();
  const muted = useGameStore((s) => s.muted);
  const toggleMuted = useGameStore((s) => s.toggleMuted);
  const names = usePlayerNamesStore((s) => s.names);
  const setName = usePlayerNamesStore((s) => s.setName);
  const { colors, setColor, error: colorError } = usePlayerColors();
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
    profiles: true,
    campaign: true,
    veylora: true,
    ai: true,
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
    <div className="panel main-menu-panel">
      <header className="main-menu-header">
        <h1>{t("menu.settings")}</h1>
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
            <div className="main-menu-setting">
              <span>{t("menu.sound")}</span>
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
            <div className="main-menu-setting">
              <label htmlFor="master-volume">{t("audio.volume")}</label>
              <VolumeSlider id="master-volume" value={volume} onChange={setVolume} />
            </div>
            <div className="main-menu-setting">
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
        </details>
        {audioError && <small className="settings-error" role="alert">{t(audioError)}</small>}
        <details className="settings-group">
          <summary>{t("menu.players")}<span className="settings-group-indicator" aria-hidden="true" /></summary>
          <div className="settings-group-content">
            <div className="main-menu-setting">
              <span>{t("menu.opponent")}</span>
              <div className="audio-channel-buttons">
                <button className="btn secondary" aria-pressed={aiEnabled} onClick={() => setAiEnabled(!aiEnabled)}>
                  {aiEnabled ? t("menu.opponentAi") : t("menu.opponentHuman")}
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
              {(["P1", "P2"] as const).map((id) => (
                <fieldset className="player-color-palette" key={id}>
                  <legend>{t("colors.player", { id })}</legend>
                  <div className="player-color-options">
                    {PLAYER_COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className="player-color-option"
                        data-color={color}
                        style={{ "--swatch-color": cssPlayerColor(PLAYER_COLORS[color]) } as CSSProperties}
                        aria-label={t("colors.option", { id, color: t(`colors.${color}`) })}
                        aria-pressed={colors[id] === color}
                        onClick={() => setColor(id, color)}
                      >
                        {colors[id] === color && <span aria-hidden="true">✓</span>}
                      </button>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </div>
        </details>
        {colorError && <small className="settings-error" role="alert">{t(colorError)}</small>}
        <details className="settings-group">
          <summary>{t("menu.gameplay")}<span className="settings-group-indicator" aria-hidden="true" /></summary>
          <div className="settings-group-content">
            <div className="main-menu-setting">
              <small>{t("menu.resetHint")}</small>
              <div className="audio-channel-list">
                {RESET_COMPONENTS.map((component) => (
                  <div key={component} className="audio-channel">
                    <button
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
                  </div>
                ))}
              </div>
              <button
                className="btn secondary"
                disabled={veyloraPending > 0 || nothingSelected}
                onClick={() => setGameResetOpen(true)}
              >
                {t("menu.reset")}
              </button>
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
