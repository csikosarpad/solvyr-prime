import { create } from "zustand";
import { TRAINING_SECTOR, type Sector, type SectorId } from "../data/sectors";
import type { MatchStats } from "../systems/matchStats";
import type { Phase } from "../systems/turnManager";
import type { Profile } from "../systems/upgrades";
import type { PlacedStrategicObjective } from "../systems/strategicObjectives";
import type { CampaignMission } from "../data/campaignContent";
import type { MessageKey } from "@/i18n";
import type { LocalPlayerId } from "./playerId";

export type Screen = "menu" | "playing" | "campaignMap" | "veylora" | "workshop";
export type WorkshopOrigin = Exclude<Screen, "workshop">;
export type MatchMode = "skirmish" | "campaign" | "operation";
export const MIN_POWER = 100;
export const MIN_ANGLE = 0;
export const MAX_ANGLE = 180;
const MUTE_KEY = "ballistic-front:muted";

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export interface TankView {
  id: string;
  hp: number;
  maxHp: number;
  /** Az erőtér pajzs aktuális és maximális értéke; maximum 0 esetén nincs pajzs. */
  shield: number;
  maxShield: number;
  /** Fizikai páncél aktuális és maximális pontjai; maximum 0 esetén nincs páncél. */
  armor: number;
  maxArmor: number;
  moveLeft: number;
  /** A tank színe (0xRRGGBB); a HUD vezérlői ezt követik. */
  color: number;
}

export interface GameState {
  angle: number;
  power: number;
  maxPower: number;
  wind: number;
  phase: Phase;
  currentId: string;
  canControl: boolean;
  /** A lövedék repülése alatt a védekező emberi tank még kitérhet a maradék keretéből. */
  canDodge: boolean;
  winner: string | null;
  tanks: TankView[];
  strategicObjectives: readonly PlacedStrategicObjective[];
  profiles: Record<string, Profile>;
  matchStats: MatchStats;
  /** A soron lévő játékos még kérhet röppálya-előnézetet. */
  previewAvailable: boolean;
  previewRemaining: number;
  previewActive: boolean;
  screen: Screen;
  workshopOrigin: WorkshopOrigin;
  workshopError: MessageKey | null;
  workshopPlayer: LocalPlayerId;
  setWorkshopPlayer: (id: LocalPlayerId) => void;
  campaignPlayer: LocalPlayerId;
  matchMode: MatchMode;
  matchId: string | null;
  sector: Sector;
  campaignNewRoutes: SectorId[];
  campaignMission: CampaignMission | null;
  missionSuccess: boolean | null;
  missionGeneration: string | null;
  opponentSkill: number | null;
  aiActive: boolean;
  /** Helyi prezentációs sorszám; új csatánál változik, nem online protokollmező. */
  matchSequence: number;
  muted: boolean;
  setAim: (angle: number, power: number) => void;
  /** Az erőt a [MIN_POWER, maxPower] tartományban tartva változtatja. */
  nudgePower: (delta: number) => void;
  /** A szöget a [MIN_ANGLE, MAX_ANGLE] tartományban tartva változtatja. */
  nudgeAngle: (delta: number) => void;
  setScreen: (screen: Screen) => void;
  openWorkshop: () => void;
  closeWorkshop: () => void;
  toggleMuted: () => void;
  /** Az engine tölti; a HUD csak olvassa. */
  sync: (
    s: Partial<Omit<GameState, "setAim" | "nudgePower" | "nudgeAngle" | "setScreen" | "openWorkshop" | "closeWorkshop" | "setWorkshopPlayer" | "toggleMuted" | "sync">>,
  ) => void;
}

/** Csak a HUD-hoz szükséges állapot; a nagy gyakoriságú adat (pozíciók) az engine-ben él. */
export const useGameStore = create<GameState>((set) => ({
  angle: 45,
  power: 400,
  maxPower: 600,
  wind: 0,
  phase: "aiming",
  currentId: "P1",
  canControl: true,
  canDodge: false,
  winner: null,
  tanks: [],
  strategicObjectives: [],
  profiles: {},
  matchStats: {},
  previewAvailable: false,
  previewRemaining: 0,
  previewActive: false,
  screen: "menu",
  workshopOrigin: "menu",
  workshopError: null,
  workshopPlayer: "P1",
  campaignPlayer: "P1",
  setWorkshopPlayer: (id) => set({ workshopPlayer: id }),
  matchMode: "skirmish",
  matchId: null,
  sector: TRAINING_SECTOR,
  campaignNewRoutes: [],
  campaignMission: null,
  missionSuccess: null,
  missionGeneration: null,
  opponentSkill: null,
  aiActive: false,
  matchSequence: 0,
  muted: readMuted(),
  setAim: (angle, power) => set({ angle, power }),
  nudgePower: (delta) => set((s) => ({ power: Math.min(s.maxPower, Math.max(MIN_POWER, s.power + delta)) })),
  nudgeAngle: (delta) => set((s) => ({ angle: Math.min(MAX_ANGLE, Math.max(MIN_ANGLE, s.angle + delta)) })),
  setScreen: (screen) => set({ screen }),
  openWorkshop: () => set((state) => state.screen === "workshop" ? {} : {
    workshopOrigin: state.screen,
    workshopError: null,
    screen: "workshop",
  }),
  closeWorkshop: () => set((state) => ({ screen: state.workshopOrigin, workshopError: null })),
  toggleMuted: () =>
    set((s) => {
      try {
        localStorage.setItem(MUTE_KEY, s.muted ? "0" : "1");
      } catch {
        // Mentés nélkül is működik a némítás.
      }
      return { muted: !s.muted };
    }),
  sync: (s) => set(s),
}));
