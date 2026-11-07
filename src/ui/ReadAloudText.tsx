import { useEffect, useRef, useState } from "react";
import { channelVolume, useAudioSettings } from "@/game/state/audioSettings";
import { useGameStore } from "@/game/state/gameStore";
import { cancelSpeech, DEFAULT_VOICE, speak, speechSupported } from "@/game/systems/speech";
import { useLocaleStore } from "@/i18n";

export interface SpeechRange {
  start: number;
  end: number;
}

export interface TimedWord extends SpeechRange {
  /** A szó becsült kezdete ms-ban a felolvasás indulásától. */
  at: number;
}

const WORD_PATTERN = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;
/** Ennyi ideig várunk valódi szóhatár-eseményre, mielőtt becslésre váltunk (pl. online hangoknál). */
export const BOUNDARY_GRACE_MS = 700;
const CHARS_PER_SECOND = 14;
const COMMA_PAUSE_MS = 250;
const SENTENCE_PAUSE_MS = 450;
const ESTIMATE_TICK_MS = 50;

/** Szavankénti becsült idővonal a szöveg hossza, az írásjelek és a beszédtempó alapján. */
export function estimateWordTimeline(text: string, rate: number = DEFAULT_VOICE.rate): TimedWord[] {
  const msPerChar = 1000 / (CHARS_PER_SECOND * Math.max(0.1, rate));
  const words: TimedWord[] = [];
  let at = 0;
  let cursor = 0;
  for (const match of text.matchAll(WORD_PATTERN)) {
    const gap = text.slice(cursor, match.index);
    at += gap.length * msPerChar;
    if (words.length > 0) {
      if (/[.!?;:]/.test(gap)) at += SENTENCE_PAUSE_MS / rate;
      else if (/[,–—]/.test(gap)) at += COMMA_PAUSE_MS / rate;
    }
    words.push({ start: match.index, end: match.index + match[0].length, at });
    at += match[0].length * msPerChar;
    cursor = match.index + match[0].length;
  }
  return words;
}

function wordAt(text: string, charIndex: number): SpeechRange | null {
  const word = [...text.matchAll(WORD_PATTERN)].find(
    (match) => charIndex >= match.index && charIndex < match.index + match[0].length,
  );
  return word ? { start: word.index, end: word.index + word[0].length } : null;
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
  const timers = useRef<{ grace?: ReturnType<typeof setTimeout>; tick?: ReturnType<typeof setInterval> }>({});

  const clearTimers = () => {
    clearTimeout(timers.current.grace);
    clearInterval(timers.current.tick);
    timers.current = {};
  };

  useEffect(() => {
    setRange(null);
    setIsReading(false);
    return () => {
      session.current += 1;
      clearTimers();
      stop.current?.();
      stop.current = undefined;
    };
  }, [text, locale, enabled]);

  const read = () => {
    if (!enabled || !speechSupported() || !text) return;
    cancelSpeech();
    clearTimers();
    setRange(null);
    setIsReading(true);
    const id = ++session.current;
    let boundarySeen = false;
    stop.current = speak(text, locale, undefined, 0, volume, {
      onStart: () => {
        if (id !== session.current) return;
        const startedAt = Date.now();
        timers.current.grace = setTimeout(() => {
          if (id !== session.current || boundarySeen) return;
          const timeline = estimateWordTimeline(text);
          let shown = -1;
          const update = () => {
            const elapsed = Date.now() - startedAt;
            let index = shown;
            while (index + 1 < timeline.length && timeline[index + 1]!.at <= elapsed) index += 1;
            const word = timeline[index];
            if (index !== shown && word) {
              shown = index;
              setRange({ start: word.start, end: word.end });
            }
          };
          update();
          timers.current.tick = setInterval(update, ESTIMATE_TICK_MS);
        }, BOUNDARY_GRACE_MS);
      },
      onBoundary: (charIndex) => {
        if (id !== session.current) return;
        if (!boundarySeen) {
          boundarySeen = true;
          clearTimers();
        }
        setRange(wordAt(text, charIndex));
      },
      onFinish: () => {
        if (id === session.current) {
          clearTimers();
          setRange(null);
          setIsReading(false);
        }
      },
    });
  };

  const stopReading = () => {
    session.current += 1;
    clearTimers();
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
