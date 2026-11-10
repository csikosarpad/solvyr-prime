import { channelVolume, useAudioSettings } from "@/game/state/audioSettings";
import { useGameStore } from "@/game/state/gameStore";
import { speechSupported } from "@/game/systems/speech";
import { useT } from "@/i18n";
import { useReadAloud } from "./ReadAloudText";

export function ReadAloudButton({
  text,
  playback,
}: {
  text: string;
  playback?: Pick<ReturnType<typeof useReadAloud>, "read" | "stop" | "isReading">;
}) {
  const t = useT();
  const ownPlayback = useReadAloud(playback ? "" : text);
  const { read, stop, isReading } = playback ?? ownPlayback;
  const muted = useGameStore((state) => state.muted);
  const volume = useAudioSettings((state) => channelVolume(state, "voice"));
  const supported = speechSupported();
  const enabled = supported && !muted && volume > 0;

  return (
    <button
      type="button"
      className="btn secondary"
      disabled={!isReading && !enabled}
      title={
        isReading
          ? t("speech.stop")
          : !supported
            ? t("speech.unavailable")
            : !enabled
              ? t("speech.disabled")
              : t("speech.readAloud")
      }
      onClick={isReading ? stop : read}
    >
      {isReading ? t("speech.stop") : t("speech.readAloud")}
    </button>
  );
}
