import { useEffect, useRef, useState } from "react";
import { channelVolume, useAudioSettings } from "@/game/state/audioSettings";
import { useGameStore } from "@/game/state/gameStore";
import { cancelSpeech, speak, speechSupported } from "@/game/systems/speech";
import { useLocaleStore } from "@/i18n";

export interface SpeechRange {
  start: number;
  end: number;
}

export function useReadAloud(text: string) {
  const locale = useLocaleStore((state) => state.locale);
  const muted = useGameStore((state) => state.muted);
  const volume = useAudioSettings((state) => channelVolume(state, "voice"));
  const enabled = !muted && volume > 0;
  const [range, setRange] = useState<SpeechRange | null>(null);
  const [isReading, setIsReading] = useState(false);
  const stop = useRef<(() => void) | undefined>(undefined);
  const session = useRef(0);

  useEffect(() => {
    setRange(null);
    setIsReading(false);
    return () => {
      session.current += 1;
      stop.current?.();
      stop.current = undefined;
    };
  }, [text, locale, enabled]);

  const read = () => {
    if (!enabled || !speechSupported() || !text) return;
    cancelSpeech();
    setRange(null);
    setIsReading(true);
    const id = ++session.current;
    stop.current = speak(text, locale, undefined, 0, volume, {
      onBoundary: (charIndex) => {
        if (id !== session.current) return;
        const word = [...text.matchAll(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)].find(
          (match) => charIndex >= match.index && charIndex < match.index + match[0].length,
        );
        setRange(word ? { start: word.index, end: word.index + word[0].length } : null);
      },
      onFinish: () => {
        if (id === session.current) {
          setRange(null);
          setIsReading(false);
        }
      },
    });
  };

  const stopReading = () => {
    session.current += 1;
    stop.current?.();
    stop.current = undefined;
    setRange(null);
    setIsReading(false);
  };

  return { read, range, isReading, stop: stopReading };
}

export function ReadAloudText({
  text,
  offset = 0,
  range,
}: {
  text: string;
  offset?: number;
  range: SpeechRange | null;
}) {
  if (!range || range.start < offset || range.end > offset + text.length) return <>{text}</>;
  const start = range.start - offset;
  const end = range.end - offset;
  return (
    <>
      {text.slice(0, start)}
      <span className="read-aloud-word">{text.slice(start, end)}</span>
      {text.slice(end)}
    </>
  );
}
