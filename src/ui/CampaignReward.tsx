import { VEYLORA, type CampaignRewards } from "@/game/data/campaignContent";
import { useT } from "@/i18n";

export function CampaignReward({ rewards, claimed }: { rewards: CampaignRewards; claimed: boolean }) {
  const t = useT();
  return (
    <div className="campaign-reward">
      <p>{t(claimed ? "economy.rewardClaimed" : "economy.firstReward")}</p>
      <ul>
        {Object.entries(rewards.resources).map(([id, amount]) => (
          <li key={id}>
            {t(VEYLORA.resources.find((entry) => entry.id === id)!.name)}: {amount}
          </li>
        ))}
        {rewards.technologies.map((id) => (
          <li key={id}>{t(VEYLORA.technologies.find((entry) => entry.id === id)!.name)}</li>
        ))}
      </ul>
    </div>
  );
}
