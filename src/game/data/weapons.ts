/**
 * Cserélhető fegyvertár: stabil ID-jű, adatvezérelt katalógus.
 * A megjelenített szövegek kulcsai: `weapon.<id>.name` és `weapon.<id>.desc` (lásd src/i18n).
 * A fegyvereket egységtípusonként különíti el; a lövés feloldása a közös
 * `systems/weapons.ts` szabályokból származik.
 */

import type { UnitAppearance } from "../state/playerUnits";

export type WeaponId = "standard" | "ap" | "incendiary" | "laser" | "homing" | "plasma" | "pulse";
export type SpecialWeaponId = Exclude<WeaponId, "standard" | "plasma" | "pulse">;

export interface BurnEffect {
  /** Az égő zóna sugara a becsapódás körül (px). */
  radius: number;
  /** Másodpercenkénti sebzés a zónában álló egységnek. */
  damagePerSecond: number;
  /** Az égés időtartama másodpercben. */
  durationSeconds: number;
}

export interface HomingGuidance {
  /** Célfelvételi sugár (px); ezen kívül a lövedék ballisztikusan repül. */
  acquireRadius: number;
  /** Fordulási korlát fix lépésenként (radián); nincs automatikus erőnövelés. */
  maxTurnRad: number;
}

export interface WeaponDefinition {
  id: WeaponId;
  unit: UnitAppearance;
  /** Ballisztikus lövedék vagy azonnali, egyenes vonalú (hitscan) találat. */
  kind: "ballistic" | "hitscan";
  /** XP-feloldás ára; 0 = kezdőfegyver, mindig elérhető. */
  cost: number;
  /** Alapsebzés a középpontban (a standardnál 60, erre hat a Robbanófej). */
  baseDamage: number;
  /** Robbanási sugár az egységsebzéshez; 0 = csak közvetlen találat sebez. */
  blastRadius: number;
  /** Tereprombolási sugár. */
  carveRadius: number;
  /** A Robbanófej (warhead) és Robbanóerő (blast) fejlesztés csak a standardra hat. */
  usesTankStats: boolean;
  /** A pajzs utáni sebzés ekkora hányada megkerüli a páncélt. */
  armorPierce: number;
  burn?: BurnEffect;
  homing?: HomingGuidance;
}

/** Az első csomag számértékei balanszdöntésig próbaértékek. */
export const WEAPONS: readonly WeaponDefinition[] = [
  {
    id: "standard",
    unit: "tank",
    kind: "ballistic",
    cost: 0,
    baseDamage: 60,
    blastRadius: 30,
    carveRadius: 30,
    usesTankStats: true,
    armorPierce: 0,
  },
  {
    id: "ap",
    unit: "tank",
    kind: "ballistic",
    cost: 150,
    baseDamage: 70,
    blastRadius: 0,
    carveRadius: 10,
    usesTankStats: false,
    armorPierce: 0.5,
  },
  {
    id: "incendiary",
    unit: "tank",
    kind: "ballistic",
    cost: 180,
    baseDamage: 40,
    blastRadius: 24,
    carveRadius: 20,
    usesTankStats: false,
    armorPierce: 0,
    burn: { radius: 42, damagePerSecond: 8, durationSeconds: 5 },
  },
  {
    id: "laser",
    unit: "tank",
    kind: "hitscan",
    cost: 250,
    baseDamage: 34,
    blastRadius: 0,
    carveRadius: 6,
    usesTankStats: false,
    armorPierce: 0,
  },
  {
    id: "homing",
    unit: "tank",
    kind: "ballistic",
    cost: 300,
    baseDamage: 48,
    blastRadius: 22,
    carveRadius: 20,
    usesTankStats: false,
    armorPierce: 0,
    homing: { acquireRadius: 220, maxTurnRad: 0.03 },
  },
  {
    id: "plasma",
    unit: "soldier",
    kind: "ballistic",
    cost: 0,
    baseDamage: 50,
    blastRadius: 20,
    carveRadius: 12,
    usesTankStats: false,
    armorPierce: 0,
  },
  {
    id: "pulse",
    unit: "soldier",
    kind: "hitscan",
    cost: 200,
    baseDamage: 40,
    blastRadius: 0,
    carveRadius: 4,
    usesTankStats: false,
    armorPierce: 0.25,
  },
];

export const isWeaponId = (value: unknown): value is WeaponId => WEAPONS.some((weapon) => weapon.id === value);

export function weaponById(id: WeaponId): WeaponDefinition {
  return WEAPONS.find((weapon) => weapon.id === id)!;
}
