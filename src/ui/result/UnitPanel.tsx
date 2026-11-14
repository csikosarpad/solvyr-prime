import { UPGRADES } from "@/game/data/upgrades";
import { useT } from "@/i18n";
import { usePlayerName } from "@/game/state/playerNames";
import { UpgradeRow } from "./UpgradeRow";
import { UnitIllustration } from "./UnitIllustration";
import type { UnitPanelProps } from "./result.types";

export function UnitPanel({ id, profile, presentation, editable, disabled, inactive = false }: UnitPanelProps) {
  const t = useT();
  const name = usePlayerName();

  return (
    <section
      className={`player-upgrades-panel unit-panel accent-${presentation.accent}${inactive ? " is-inactive" : ""}`}
      aria-labelledby={`unit-${id}`}
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
  );
}
