import type { UnitAccent } from "./result.types";
import type { WeaponId } from "@/game/data/weapons";
import standardWeaponIcon from "@/game/assets/weapons/standard.webp?url";
import apWeaponIcon from "@/game/assets/weapons/ap.webp?url";
import incendiaryWeaponIcon from "@/game/assets/weapons/incendiary.webp?url";
import laserWeaponIcon from "@/game/assets/weapons/laser.webp?url";
import homingWeaponIcon from "@/game/assets/weapons/homing.webp?url";

export interface UpgradePresentation {
  glyph: string;
  accent: UnitAccent;
  iconSet: string;
  asset?: string;
}

const DEFAULT_UPGRADE_PRESENTATION: UpgradePresentation = {
  glyph: "◆",
  accent: "cyan",
  iconSet: "ground-combat",
};

export const ICON_PRESENTATIONS: Record<string, UpgradePresentation> = {
  armor: DEFAULT_UPGRADE_PRESENTATION,
  shield: { glyph: "ϟ", accent: "cyan", iconSet: "ground-combat" },
  warhead: { glyph: "✦", accent: "orange", iconSet: "ground-combat" },
  blast: { glyph: "✹", accent: "gold", iconSet: "ground-combat" },
  barrel: { glyph: "◎", accent: "gold", iconSet: "ground-combat" },
  engine: { glyph: "▣", accent: "cyan", iconSet: "ground-combat" },
  smartAim: { glyph: "⌖", accent: "gold", iconSet: "ground-combat" },
  standard: { ...DEFAULT_UPGRADE_PRESENTATION, asset: standardWeaponIcon },
  ap: { ...DEFAULT_UPGRADE_PRESENTATION, asset: apWeaponIcon },
  incendiary: { ...DEFAULT_UPGRADE_PRESENTATION, asset: incendiaryWeaponIcon },
  laser: { ...DEFAULT_UPGRADE_PRESENTATION, asset: laserWeaponIcon },
  homing: { ...DEFAULT_UPGRADE_PRESENTATION, asset: homingWeaponIcon },
};

export const UPGRADE_PRESENTATIONS = ICON_PRESENTATIONS;

export function getUpgradePresentation(id: string, iconSet = "ground-combat"): UpgradePresentation {
  const presentation = ICON_PRESENTATIONS[id] || DEFAULT_UPGRADE_PRESENTATION;
  return { ...presentation, iconSet };
}

export function getWeaponIcon(id: WeaponId): string {
  const asset = ICON_PRESENTATIONS[id]?.asset;
  if (!asset) {
    throw new Error(`Missing icon asset for weapon "${id}"`);
  }
  return asset;
}
