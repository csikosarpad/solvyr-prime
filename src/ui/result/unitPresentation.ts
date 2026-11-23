import type { UnitPresentation } from "./result.types";
import { DEFAULT_THEME } from "@/game/theme";
import { ARMOR_COLORS, type ArmorColor } from "@/game/state/playerColors";
import { tankArmorLayers } from "@/game/assets/tank/tankArmorLayers";
import tankBodyUrl from "@/game/assets/tank/tank-body.svg?url";
import tankBarrelUrl from "@/game/assets/tank/tank-barrel.svg?url";
import tankMarkingsUrl from "@/game/assets/tank/tank-markings.svg?url";
import soldierBodyUrl from "@/game/assets/soldier/soldier-body.svg?url";
import soldierWeaponUrl from "@/game/assets/soldier/soldier-weapon.svg?url";
import soldierMarkingsUrl from "@/game/assets/soldier/soldier-markings.svg?url";
import type { UnitAppearance } from "@/game/state/playerUnits";

const GROUND_PRESENTATION: UnitPresentation = {
  domain: "ground",
  displayName: "Tank",
  silhouetteAsset: tankBodyUrl,
  secondaryAsset: tankBarrelUrl,
  accentAsset: tankMarkingsUrl,
  illustrationLayout: "body-barrel",
  primaryColor: DEFAULT_THEME.players[0]!,
  secondaryColor: 0x087fa7,
  iconSet: "ground-combat",
  accent: "cyan",
};

const SPACE_PRESENTATION: UnitPresentation = {
  domain: "space",
  displayName: "Space fighter",
  primaryColor: DEFAULT_THEME.players[0]!,
  secondaryColor: 0x087fa7,
  iconSet: "space-combat",
  accent: "cyan",
};

const PRESENTATIONS: Record<string, UnitPresentation> = {
  P1: GROUND_PRESENTATION,
  P2: {
    ...GROUND_PRESENTATION,
    primaryColor: DEFAULT_THEME.players[1]!,
    secondaryColor: 0xa5352a,
    accent: "red",
  },
};

const SPACE_PRESENTATIONS: Record<string, UnitPresentation> = {
  P1: SPACE_PRESENTATION,
  P2: {
    ...SPACE_PRESENTATION,
    primaryColor: DEFAULT_THEME.players[1]!,
    secondaryColor: 0xa5352a,
    accent: "red",
  },
};

export function getUnitPresentation(
  id: string, domain: UnitPresentation["domain"] = "ground", color?: number, armorColor: ArmorColor = "steel", tint?: number,
  unit: UnitAppearance = "tank",
): UnitPresentation {
  const presentations = domain === "space" ? SPACE_PRESENTATIONS : PRESENTATIONS;
  const presentation = presentations[id] ?? (domain === "space" ? SPACE_PRESENTATION : GROUND_PRESENTATION);
  if (domain === "ground" && unit === "soldier") {
    return {
      ...presentation,
      displayName: "Soldier",
      silhouetteAsset: soldierBodyUrl,
      secondaryAsset: soldierWeaponUrl,
      accentAsset: soldierMarkingsUrl,
      illustrationLayout: "soldier",
      primaryColor: color ?? presentation.primaryColor,
      paintTint: tint ?? ARMOR_COLORS[armorColor].tint,
    };
  }
  if (presentation.illustrationLayout === "body-barrel" && (armorColor !== "steel" || tint !== undefined)) {
    return {
      ...presentation,
      primaryColor: color ?? presentation.primaryColor,
      paintedBody: { ...tankArmorLayers, tint: tint ?? ARMOR_COLORS[armorColor].tint },
    };
  }
  return color === undefined ? presentation : { ...presentation, primaryColor: color };
}
