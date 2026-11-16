/** A beérkező sebzés felosztása a védelmi rétegek között. Tiszta függvények, hogy az online szimuláció determinisztikus maradjon. */

export interface Defense {
  hp: number;
  /** Az erőtér pajzs aktuális értéke; körönként visszatöltődik. */
  shield: number;
  /** A fizikai páncél aktuális pontjai; a pajzs után kopik, nem töltődik vissza. */
  armor: number;
}

/**
 * Sorrend: 1) a nyers sebzést először az erőtér pajzs nyeli el; 2) a maradék `armorPierce`
 * hányada megkerüli a páncélt és közvetlenül a HP-t éri; 3) a többit a páncélpontok nyelik;
 * 4) ami ezeken is átjut, a HP-ból vonódik le. Minden réteg 1:1 arányban nyel el.
 */
export function resolveDamage(defense: Defense, damage: number, armorPierce = 0): Defense {
  let rest = Math.max(0, damage);
  const shieldAbsorbed = Math.min(defense.shield, rest);
  rest -= shieldAbsorbed;
  const pierced = Math.round(rest * Math.min(1, Math.max(0, armorPierce)));
  rest -= pierced;
  const armorAbsorbed = Math.min(defense.armor, rest);
  rest -= armorAbsorbed;
  return {
    shield: defense.shield - shieldAbsorbed,
    armor: defense.armor - armorAbsorbed,
    hp: Math.max(0, defense.hp - rest - pierced),
  };
}

/** Körönkénti pajzsvisszatöltés: a maximum `fraction` része, a maximumig. */
export function regenShield(shield: number, maxShield: number, fraction: number): number {
  if (maxShield <= 0) return 0;
  return Math.min(maxShield, shield + Math.round(maxShield * Math.max(0, fraction)));
}
