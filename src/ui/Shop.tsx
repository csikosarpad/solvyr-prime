import { useGameStore, type AiOpponentView } from "@/game/state/gameStore";
import { armorTint, markingColor, usePlayerColors } from "@/game/state/playerColors";
import { usePlayerUnits } from "@/game/state/playerUnits";
import { useMultiplayerStore } from "@/game/state/multiplayerStore";
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
  const colors = usePlayerColors();
  const units = usePlayerUnits((state) => state.units);
  const tanks = useGameStore((state) => state.tanks);
  const online = useMultiplayerStore((state) => state.credentials !== null);

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
              ? getUnitPresentation(id, "ground", markingColor(id, colors), colors.armorColors[id], armorTint(id, colors),
                online ? tanks.find((tank) => tank.id === id)?.unit ?? "tank" : units[id])
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
