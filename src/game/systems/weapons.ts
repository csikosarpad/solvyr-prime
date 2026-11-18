/**
 * Közös, tiszta lövés-/becsapódás-szabályok: a Game, a röppálya-előnézet és az AI
 * ugyanebből a feloldóból dolgozik, így nincs eltérő fizika.
 */
import { isWeaponId, weaponById, WEAPONS, type WeaponDefinition, type WeaponId } from "../data/weapons";
import type { TankStats } from "../data/upgrades";
import type { Profile } from "./upgrades";
import { explosionDamage, tankContains, type Tank } from "../entities/tank";
import type { Vec2 } from "../physics/ballistics";
import type { TerrainMask } from "../terrain/mask";

export interface ShotEffect {
  /** Egységsebzés a középpontban. */
  damage: number;
  /** Egységsebzés hatósugara; 0 = csak a közvetlenül eltalált egység sebződik. */
  blastRadius: number;
  /** Tereprombolási sugár. */
  carveRadius: number;
  /** Csak közvetlen találat sebez egységet. */
  directOnly: boolean;
  /** A pajzs utáni sebzés ekkora hányada megkerüli a páncélt. */
  armorPierce: number;
  burn?: WeaponDefinition["burn"];
}

/** A fegyver és a lövő értékeiből számolt hatás; a standard a tankfejlesztéseket követi. */
export function resolveShotEffect(weapon: WeaponDefinition, stats: TankStats): ShotEffect {
  return {
    damage: weapon.baseDamage * (weapon.usesTankStats ? stats.damage : 1),
    blastRadius: weapon.usesTankStats ? stats.blastRadius : weapon.blastRadius,
    carveRadius: weapon.usesTankStats ? stats.blastRadius : weapon.carveRadius,
    directOnly: weapon.blastRadius === 0 && !weapon.usesTankStats,
    armorPierce: weapon.armorPierce,
    burn: weapon.burn,
  };
}

export function shotDamageAt(tank: Tank, pos: Vec2, effect: ShotEffect, direct: boolean): number {
  if (effect.directOnly) return direct ? Math.round(effect.damage) : 0;
  return explosionDamage(tank, pos.x, pos.y, effect.blastRadius, 1, effect.damage);
}

export interface HitscanResult {
  pos: Vec2;
  /** A sugár által elsőként eltalált egység, ha van. */
  hit: Tank | null;
}

const HITSCAN_STEP = 2;

/** Egyenes vonalú (lézer) találat: az első egység vagy terep a sugár mentén; szél és gravitáció nélkül. */
export function traceHitscan(
  start: Vec2,
  angleDeg: number,
  mask: TerrainMask,
  targets: readonly Tank[],
  height: number,
): HitscanResult {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(rad) * HITSCAN_STEP;
  const dy = -Math.sin(rad) * HITSCAN_STEP;
  let x = start.x;
  let y = start.y;
  const maxSteps = Math.ceil(Math.hypot(mask.width, height) / HITSCAN_STEP) + 1;
  for (let i = 0; i < maxSteps; i++) {
    x += dx;
    y += dy;
    const hit = targets.find((t) => tankContains(t, x, y));
    if (hit) return { pos: { x, y }, hit };
    if (mask.isSolid(x, y)) return { pos: { x, y }, hit: null };
    if (x < 0 || x > mask.width || y > height || y < -height) break;
  }
  return { pos: { x, y }, hit: null };
}

/**
 * Végfázisú célkövetés: a célfelvételi sugáron belül a sebességvektor korlátozott
 * mértékben a cél felé fordul; a sebesség nagysága nem nő (nincs találatgarancia).
 */
export function steerHoming(
  pos: Vec2,
  vel: Vec2,
  target: Vec2,
  guidance: NonNullable<WeaponDefinition["homing"]>,
): Vec2 {
  if (Math.hypot(target.x - pos.x, target.y - pos.y) > guidance.acquireRadius) return vel;
  const speed = Math.hypot(vel.x, vel.y);
  if (speed === 0) return vel;
  const current = Math.atan2(vel.y, vel.x);
  const desired = Math.atan2(target.y - pos.y, target.x - pos.x);
  let delta = desired - current;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;
  const turn = Math.max(-guidance.maxTurnRad, Math.min(guidance.maxTurnRad, delta));
  const next = current + turn;
  return { x: Math.cos(next) * speed, y: Math.sin(next) * speed };
}

/** A játékos használható fegyverei: a kezdő standard és az érvényes feloldások, katalógus-sorrendben. */
export function unlockedWeapons(profile: Pick<Profile, "weapons"> | undefined): WeaponId[] {
  const owned = new Set(profile?.weapons?.filter(isWeaponId) ?? []);
  return WEAPONS.filter((weapon) => weapon.cost === 0 || owned.has(weapon.id)).map((weapon) => weapon.id);
}

/** Új profilt ad vissza, vagy null-t, ha ismeretlen/már feloldott fegyver vagy kevés az XP. */
export function buyWeapon(profile: Profile, id: string): Profile | null {
  if (!isWeaponId(id)) return null;
  const weapon = weaponById(id);
  if (weapon.cost === 0 || unlockedWeapons(profile).includes(id)) return null;
  if (profile.xp < weapon.cost) return null;
  return { ...profile, xp: profile.xp - weapon.cost, weapons: [...(profile.weapons ?? []), id] };
}
