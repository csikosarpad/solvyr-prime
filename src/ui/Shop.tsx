import { useGameStore, type AiOpponentView } from "@/game/state/gameStore";
import { playerColor, usePlayerColors } from "@/game/state/playerColors";
import type { WorkshopFilter } from "./result/result.types";
import { getUnitPresentation } from "./result/unitPresentation";
import { UnitPanel } from "./result/UnitPanel";

interface ShopProps {
  filter?: WorkshopFilter;
  editablePlayerId?: string;
  disabled?: boolean;
  dimInactive?: boolean;
  opponent?: AiOpponentView | null;
}

/** Meccs utáni bolt: minden játékos a saját XP-jét költi. */
export function Shop({ filter = "all", editablePlayerId, disabled = false, dimInactive = false, opponent = null }: ShopProps) {
  const profiles = useGameStore((s) => s.profiles);
  const colors = usePlayerColors((s) => s.colors);
  const armorColors = usePlayerColors((s) => s.armorColors);

  return (
    <div className="shop-players">
      {Object.entries(profiles).map(([id, profile]) => {
        const ai = opponent?.slot === id ? opponent : null;
        return (
          <UnitPanel
            key={ai ? "AI" : id}
            id={ai ? "AI" : id}
            profile={ai?.profile ?? profile}
            presentation={id === "P1" || id === "P2"
              ? getUnitPresentation(id, "ground", playerColor(id, colors), armorColors[id])
              : getUnitPresentation(id)}
            filter={filter}
            editable={!ai && (editablePlayerId === undefined || editablePlayerId === id)}
            disabled={disabled}
            inactive={!ai && dimInactive && editablePlayerId !== undefined && editablePlayerId !== id}
            opponent={ai}
          />
        );
      })}
    </div>
  );
}
