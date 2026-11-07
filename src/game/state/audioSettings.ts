import { create } from "zustand";

const STORAGE_KEY = "ballistic-front:audio-settings";

/** Külön kapcsolható hangcsoportok; a globális némítás (`muted`) mindegyiket felülírja. */
export interface AudioChannels {
  music: boolean;
  /** Parancsnoki felolvasás. */
  voice: boolean;
  /** Lövés, robbanás és tankmozgás hangja. */
  effects: boolean;
}

export type AudioChannel = keyof AudioChannels;
export const AUDIO_CHANNELS: readonly AudioChannel[] = ["music", "voice", "effects"];

const DEFAULTS: AudioChannels = { music: true, voice: true, effects: true };

export type AudioChannelVolumes = Record<AudioChannel, number>;
const DEFAULT_CHANNEL_VOLUMES: AudioChannelVolumes = { music: 1, voice: 1, effects: 1 };

type AudioSettingsError = "audio.loadError" | "audio.saveError";
interface SavedAudioSettings {
  channels: AudioChannels;
  volume: number;
  /** A központi hangerőn belüli csatornánkénti arány; a tényleges hangerő a kettő szorzata. */
  channelVolumes: AudioChannelVolumes;
  error: AudioSettingsError | null;
}

const isVolume = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;

function load(): SavedAudioSettings {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("Invalid audio settings");
    }
    const channels = { ...DEFAULTS };
    for (const channel of AUDIO_CHANNELS) {
      if (channel in parsed) {
        const enabled: unknown = Reflect.get(parsed, channel);
        if (typeof enabled !== "boolean") throw new Error(`Invalid audio channel: ${channel}`);
        channels[channel] = enabled;
      }
    }
    const volume: unknown = "volume" in parsed ? parsed.volume : 1;
    if (!isVolume(volume)) throw new Error("Invalid audio volume");
    const channelVolumes = { ...DEFAULT_CHANNEL_VOLUMES };
    if ("channelVolumes" in parsed) {
      const saved: unknown = parsed.channelVolumes;
      if (typeof saved !== "object" || saved === null || Array.isArray(saved)) {
        throw new Error("Invalid audio channel volumes");
      }
      for (const channel of AUDIO_CHANNELS) {
        if (!(channel in saved)) continue;
        const value: unknown = Reflect.get(saved, channel);
        if (!isVolume(value)) throw new Error(`Invalid audio channel volume: ${channel}`);
        channelVolumes[channel] = value;
      }
    }
    return { channels, volume, channelVolumes, error: null };
  } catch (error) {
    console.error("Audio settings could not be loaded", error);
    return {
      channels: { ...DEFAULTS },
      volume: 1,
      channelVolumes: { ...DEFAULT_CHANNEL_VOLUMES },
      error: "audio.loadError",
    };
  }
}

function save(channels: AudioChannels, volume: number, channelVolumes: AudioChannelVolumes): AudioSettingsError | null {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...channels, volume, channelVolumes }));
    return null;
  } catch (error) {
    console.error("Audio settings could not be saved", error);
    return "audio.saveError";
  }
}

function clampVolume(value: number): number {
  if (!Number.isFinite(value)) throw new RangeError("Audio volume must be finite");
  return Math.max(0, Math.min(1, value));
}

interface AudioSettingsState extends SavedAudioSettings {
  setChannel: (channel: AudioChannel, enabled: boolean) => void;
  setVolume: (volume: number) => void;
  setChannelVolume: (channel: AudioChannel, volume: number) => void;
}

/** Kikapcsolt csatornánál 0; egyébként központi × csatorna hangerő. A globális némítást nem veszi figyelembe. */
export function channelVolume(
  state: Pick<SavedAudioSettings, "channels" | "volume" | "channelVolumes">,
  channel: AudioChannel,
): number {
  return state.channels[channel] ? state.volume * state.channelVolumes[channel] : 0;
}

export const useAudioSettings = create<AudioSettingsState>((set) => ({
  ...load(),
  setChannel: (channel, enabled) =>
    set((state) => {
      const channels = { ...state.channels, [channel]: enabled };
      return { channels, error: save(channels, state.volume, state.channelVolumes) };
    }),
  setVolume: (value) => {
    const volume = clampVolume(value);
    set((state) => ({ volume, error: save(state.channels, volume, state.channelVolumes) }));
  },
  setChannelVolume: (channel, value) => {
    const volume = clampVolume(value);
    set((state) => {
      const channelVolumes = { ...state.channelVolumes, [channel]: volume };
      return { channelVolumes, error: save(state.channels, state.volume, channelVolumes) };
    });
  },
}));
