import { UPGRADES } from "@/game/data/upgrades";
import { WEAPONS } from "@/game/data/weapons";
import type { CSSProperties } from "react";
import { cssPlayerColor, playerAccent } from "@/game/state/playerColors";
import { useT } from "@/i18n";
import { usePlayerName } from "@/game/state/playerNames";
import { UpgradeRow } from "./UpgradeRow";
import { WeaponRow } from "./WeaponRow";
import { UnitIllustration } from "./UnitIllustration";
import type { UnitPanelProps } from "./result.types";

export function UnitPanel({ id, profile, presentation, filter = "all", editable, disabled, inactive = false }: UnitPanelProps) {
  const t = useT();
  const name = usePlayerName();

  return (
    <section
      className={`player-upgrades-panel unit-panel accent-${presentation.accent}${inactive ? " is-inactive" : ""}`}
      aria-labelledby={`unit-${id}`}
      style={{ "--player-color": cssPlayerColor(presentation.primaryColor),
        "--player-accent": cssPlayerColor(playerAccent(presentation.primaryColor)) } as CSSProperties}
    >
      {inactive && <p className="unit-inactive-label">{t("workshop.inactivePlayer")}</p>}
      <div className="player-upgrades-header">
        <div>
          <span className="unit-domain">{presentation.displayName}</span>
          <h3 id={`unit-${id}`}>{name(id)}</h3>
        </div>
        <div className="player-earned-xp">
          <span>{t("workshop.availableXp")}</span>
          <strong>{profile.xp} XP</strong>
        </div>
      </div>
      <UnitIllustration presentation={presentation} facing={id === "P2" ? "left" : "right"} />
      <div
        className="unit-inventory"
        role="region"
        aria-label={`${name(id)} · ${t("workshop.inventoryLabel")}`}
        tabIndex={0}
      >
        {filter === "special" ? (
          <p className="workshop-special-filter-note">{t("workshop.specialFilterNote")}</p>
        ) : (
          <>
            {filter !== "armory" && (
              <section className="unit-inventory-section">
                <h4 className="weapon-list-title">{t("workshop.statsTitle")}</h4>
                <div className="upgrade-list">
                  {UPGRADES.map((definition) => (
                    <UpgradeRow
                      key={definition.id}
                      playerId={id}
                      profile={profile}
                      definition={definition}
                      editable={editable}
                      disabled={disabled}
                      iconSet={presentation.iconSet}
                    />
                  ))}
                </div>
              </section>
            )}
            {filter !== "stats" && (
              <section className="unit-inventory-section">
                <h4 className="weapon-list-title">{t("shop.weapons")}</h4>
                <div className="upgrade-list weapon-upgrade-list">
                  {WEAPONS.filter((definition) => definition.cost > 0).map((definition) => (
                    <WeaponRow
                      key={definition.id}
                      playerId={id}
                      profile={profile}
                      definition={definition}
                      editable={editable}
                      disabled={disabled}
                      iconSet={presentation.iconSet}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </section>
  );
}
