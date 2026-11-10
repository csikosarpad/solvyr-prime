import { create } from "zustand";
import { t, useLocaleStore, type MessageKey, type Params } from "@/i18n";
import { cancelSpeech, speak } from "../systems/speech";
import { useGameStore } from "./gameStore";
import { channelVolume, useAudioSettings } from "./audioSettings";

export type CommandTone = "info" | "warning" | "critical";

export interface CommandMessage {
  id: number;
  key: MessageKey;
  params?: Params;
  tone: CommandTone;
  time: string;
}

export const MAX_COMMAND_MESSAGES = 6;

const clock = () => new Date().toLocaleTimeString("hu-HU", { hour12: false });

interface CommandState {
  messages: CommandMessage[];
  log: (key: MessageKey, params?: Params, tone?: CommandTone) => void;
  /**
   * Megjeleníti a parancsot a konzolon, és az aktuális nyelven fel is mondja (némítva csak kiírja).
   * A `speaker` (játékos azonosító) határozza meg, melyik parancsnok hangján szól.
   */
  announce: (key: MessageKey, params?: Params, tone?: CommandTone, speaker?: string) => void;
  clear: () => void;
}

let nextId = 1;

export const useCommandStore = create<CommandState>((set, get) => ({
  messages: [],
  log: (key, params, tone = "info") => {
    set((s) => ({
      messages: [...s.messages, { id: nextId++, key, params, tone, time: clock() }].slice(-MAX_COMMAND_MESSAGES),
    }));
  },
  announce: (key, params, tone = "info", speaker) => {
    get().log(key, params, tone);
    const { muted } = useGameStore.getState();
    const volume = channelVolume(useAudioSettings.getState(), "voice");
    if (!muted && volume > 0) {
      speak(t(key, params), useLocaleStore.getState().locale, undefined, speaker === "P2" ? 1 : 0, volume);
    }
  },
  clear: () => {
    cancelSpeech();
    set({ messages: [] });
  },
}));
