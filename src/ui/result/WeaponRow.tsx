import type { WeaponDefinition } from "@/game/data/weapons";
import { unlockedWeapons } from "@/game/systems/weapons";
import type { Profile } from "@/game/systems/upgrades";
import { useT, type MessageKey } from "@/i18n";
import { gameRef } from "../gameRef";
import { UpgradeIcon } from "./UpgradeIcon";

interface WeaponRowProps {
  playerId: string;
  profile: Profile;
  definition: WeaponDefinition;
  editable: boolean;
  disabled: boolean;
  iconSet: string;
}

/** Egy fegyver sora a fegyvertárban: tartós XP-feloldás, a kezdőfegyver mindig elérhető. */
export function WeaponRow({ playerId, profile, definition, editable, disabled, iconSet }: WeaponRowProps) {
  const t = useT();
  const owned = unlockedWeapons(profile, definition.unit).includes(definition.id);
  const unaffordable = !owned && profile.xp < definition.cost;
  const purchasable = !disabled && editable && !owned && !unaffordable;
  const name = t(`weapon.${definition.id}.name` as MessageKey);

  return (
    <div className={`upgrade-row top-row gap-2 weapon-upgrade-row${unaffordable ? " is-unaffordable" : ""}`}>
      <UpgradeIcon upgradeId={definition.id} iconSet={iconSet} />
      <div className="upgrade-label">
        <strong>{name}</strong>
        <small>{t(`weapon.${definition.id}.desc` as MessageKey)}</small>
      </div>
      <div className="upgrade-cell">
        <span className="upgrade-levels"></span>
        <span className="upgrade-level-label"></span>
        <button
          aria-label={`${playerId}: ${name}`}
          className={`upgrade-buy${owned ? " maxed" : ""}${purchasable ? " is-purchasable" : ""}`}
          disabled={disabled || !editable || owned || unaffordable}
          onClick={() => gameRef.current?.buyWeapon(playerId, definition.id)}
        >
          {owned ? t("shop.weaponOwned") : t("shop.costShort", { cost: definition.cost })}
        </button>
      </div>
    </div>
  );
}
