import { useState, type CSSProperties } from "react";
import { MAX_NAME_LENGTH, usePlayerNamesStore } from "@/game/state/playerNames";
import { AUDIO_CHANNELS, useAudioSettings } from "@/game/state/audioSettings";
import { useAiSettings } from "@/game/state/aiSettings";
import { useGameStore } from "@/game/state/gameStore";
import { useT, type MessageKey } from "@/i18n";
import { ConfirmDialog } from "../ConfirmDialog";
import { LanguageSwitch } from "./LanguageSwitch";

interface MainMenuSettingsProps {
  onBack: () => void;
}

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
  const [aiResetOpen, setAiResetOpen] = useState(false);

  return (
    <div className="panel main-menu-panel">
      <header className="main-menu-header">
        <h1>{t("menu.settings")}</h1>
      </header>
      <section className="main-menu-settings" aria-label={t("menu.settings")}>
        <div className="main-menu-setting">
          <span>{t("menu.language")}</span>
          <LanguageSwitch />
        </div>
        <div className="main-menu-setting">
          <span>{t("menu.sound")}</span>
          <button className="btn secondary" aria-pressed={!muted} onClick={toggleMuted}>
            {t("hud.sound", { state: muted ? t("hud.soundOff") : t("hud.soundOn") })}
          </button>
        </div>
        <div className="main-menu-setting">
          <label htmlFor="master-volume">{t("audio.volume")}</label>
          <VolumeSlider id="master-volume" value={volume} onChange={setVolume} />
          {audioError && <small role="alert">{t(audioError)}</small>}
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
        <div className="main-menu-setting">
          <span>{t("menu.opponent")}</span>
          <div className="audio-channel-buttons">
            <button className="btn secondary" aria-pressed={aiEnabled} onClick={() => setAiEnabled(!aiEnabled)}>
              {aiEnabled ? t("menu.opponentAi") : t("menu.opponentHuman")}
            </button>
            {aiEnabled && (
              <button className="btn secondary" onClick={() => setAiResetOpen(true)} disabled={aiMatches === 0}>
                {t("menu.aiExperience", { matches: aiMatches })}
              </button>
            )}
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
      </section>
      <button className="btn secondary main-menu-back" onClick={onBack}>
        {t("lobby.back")}
      </button>
      {aiResetOpen && (
        <ConfirmDialog
          destructive
          title={t("menu.aiResetTitle")}
          message={t("menu.aiResetConfirm", { matches: aiMatches })}
          cancelLabel={t("dialog.cancel")}
          confirmLabel={t("dialog.delete")}
          onCancel={() => setAiResetOpen(false)}
          onConfirm={() => {
            setAiResetOpen(false);
            resetAiMemory();
          }}
        />
      )}
    </div>
  );
}
