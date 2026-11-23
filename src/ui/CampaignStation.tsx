import { VEYLORA } from "@/game/data/campaignContent";
import { useVeyloraStore } from "@/game/state/veyloraStore";
import { useGameStore } from "@/game/state/gameStore";
import { applyCampaignUpgrades, purchaseBlock } from "@/game/systems/campaignEconomy";
import { computeStats } from "@/game/systems/upgrades";
import { useT } from "@/i18n";

export function CampaignStation({ recipeIds }: { recipeIds: readonly string[] }) {
  const t = useT();
  const { economy, ready, pending, error, buy, equipShield, playerId } = useVeyloraStore();
  const levels = useGameStore((state) => state.profiles[playerId]?.levels);
  const base = computeStats(levels ?? {});
  return (
    <div className="campaign-station">
      <h3>{t("economy.inventory", { player: playerId })}</h3>
      <ul>
        {VEYLORA.resources.map((resource) => (
          <li key={resource.id}>
            {t(resource.name)}: {economy.resources[resource.id] ?? 0}
          </li>
        ))}
        {VEYLORA.technologies.map((technology) => (
          <li key={technology.id}>
            {t(technology.name)}:{" "}
            {t(economy.technologies.includes(technology.id) ? "economy.acquired" : "economy.notAcquired")}
          </li>
        ))}
      </ul>
      {recipeIds.map((id) => {
        const recipe = VEYLORA.recipes.find((recipe) => recipe.id === id);
        if (!recipe) throw new Error(`Unknown station recipe: ${id}`);
        const block = purchaseBlock(economy, recipe);
        const purchase = economy.purchases[id];
        const multiplier = purchase?.maxEnergyShieldMultiplier ?? recipe.effect.maxEnergyShieldMultiplier;
        const bonus = purchase?.maxEnergyShieldBonus ?? recipe.effect.maxEnergyShieldBonus;
        const equipped = economy.equippedShield === id;
        const preview = applyCampaignUpgrades(base, {
          ...economy,
          equippedShield: id,
          purchases: {
            ...economy.purchases,
            [id]: purchase ?? { contentVersion: VEYLORA.contentVersion, ...recipe.effect },
          },
        });
        return (
          <section key={id} className="campaign-recipe" aria-label={t(recipe.name)}>
            <h3>{t(recipe.name)}</h3>
            <p>{t("economy.shieldEffect", { bonus, value: Math.round((multiplier - 1) * 100) })}</p>
            <p>{t("economy.cost")}</p>
            <ul>
              {Object.entries(recipe.cost).map(([resource, amount]) => (
                <li key={resource}>
                  {t(VEYLORA.resources.find((entry) => entry.id === resource)!.name)}: {amount}
                </li>
              ))}
              {recipe.technologies.map((technology) => (
                <li key={technology}>
                  {t(VEYLORA.technologies.find((entry) => entry.id === technology)!.name)} ({t("economy.notConsumed")})
                </li>
              ))}
            </ul>
            <p>
              {t("economy.shieldPreview", {
                base: base.maxEnergyShield,
                value: Number(preview.maxEnergyShield.toFixed(2)),
              })}
            </p>
            {block && (
              <p>
                {t(
                  block === "owned"
                    ? "economy.owned"
                    : block === "technology"
                      ? "economy.missingTechnology"
                      : "economy.missingResources",
                )}
              </p>
            )}
            {purchase ? (
              <>
                <p>{t(equipped ? "economy.equipped" : "economy.unequipped")}</p>
                <button
                  className="btn"
                  disabled={!ready || pending > 0 || error === "veylora.loadError"}
                  onClick={() => void equipShield(equipped ? null : id)}
                >
                  {t(equipped ? "economy.unequip" : "economy.equip")}
                </button>
              </>
            ) : (
              <button
                className="btn"
                disabled={!ready || pending > 0 || error === "veylora.loadError" || block !== null}
                onClick={() => void buy(id)}
              >
                {t("economy.buy")}
              </button>
            )}
          </section>
        );
      })}
    </div>
  );
}
