/**
 * Cserélhető fegyvertár: stabil ID-jű, adatvezérelt katalógus.
 * A megjelenített szövegek kulcsai: `weapon.<id>.name` és `weapon.<id>.desc` (lásd src/i18n).
 * A harci eszköztől (tank, később űrhajó vagy gyalogos) független; a lövés feloldása
 * a közös `systems/weapons.ts` szabályokból származik (Game, előnézet és AI ugyanazt használja).
 */

export type WeaponId = "standard" | "ap" | "incendiary" | "laser" | "homing";

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
    kind: "ballistic",
    cost: 180,
    baseDamage: 40,
    blastRadius: 24,
    carveRadius: 20,
    usesTankStats: false,
    armorPierce: 0,
    burn: { radius: 42, damagePerSecond: 8, durationSeconds: 4 },
  },
  {
    id: "laser",
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
    kind: "ballistic",
    cost: 300,
    baseDamage: 48,
    blastRadius: 22,
    carveRadius: 20,
    usesTankStats: false,
    armorPierce: 0,
    homing: { acquireRadius: 220, maxTurnRad: 0.03 },
  },
];

export const isWeaponId = (value: unknown): value is WeaponId => WEAPONS.some((weapon) => weapon.id === value);

export function weaponById(id: WeaponId): WeaponDefinition {
  return WEAPONS.find((weapon) => weapon.id === id)!;
}
