import type { Profile } from "@/game/systems/upgrades";
import type { AiOpponentView } from "@/game/state/gameStore";

export type UnitDomain = "ground" | "space" | "air" | "mech";
export type UnitAccent = "cyan" | "gold" | "orange" | "red";
export type WorkshopFilter = "all" | "stats" | "armory" | "special";

export interface UnitPresentation {
  domain: UnitDomain;
  displayName: string;
  silhouetteAsset?: string;
  secondaryAsset?: string;
  detailAsset?: string;
  accentAsset?: string;
  illustrationLayout?: "body-barrel";
  paintedBody?: { chassis: string; armor: string; details: string; tint: number };
  primaryColor: number;
  secondaryColor: number;
  iconSet: string;
  accent: UnitAccent;
}

export interface UnitPanelProps {
  id: string;
  profile: Profile;
  presentation: UnitPresentation;
  filter?: WorkshopFilter;
  editable: boolean;
  disabled: boolean;
  inactive?: boolean;
  opponent?: Pick<AiOpponentView, "slot" | "fixedArmor"> | null;
}
