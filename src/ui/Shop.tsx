import { useGameStore } from "@/game/state/gameStore";
import { playerColor, usePlayerColors } from "@/game/state/playerColors";
import { getUnitPresentation } from "./result/unitPresentation";
import { UnitPanel } from "./result/UnitPanel";

interface ShopProps {
  editablePlayerId?: string;
  disabled?: boolean;
  dimInactive?: boolean;
}

/** Meccs utáni bolt: minden játékos a saját XP-jét költi. */
export function Shop({ editablePlayerId, disabled = false, dimInactive = false }: ShopProps) {
  const profiles = useGameStore((s) => s.profiles);
  const colors = usePlayerColors((s) => s.colors);

  return (
    <div className="shop-players">
      {Object.entries(profiles).map(([id, profile]) => (
        <UnitPanel
          key={id}
          id={id}
          profile={profile}
          presentation={getUnitPresentation(id, "ground", id === "P1" || id === "P2" ? playerColor(id, colors) : undefined)}
          editable={editablePlayerId === undefined || editablePlayerId === id}
          disabled={disabled}
          inactive={dimInactive && editablePlayerId !== undefined && editablePlayerId !== id}
        />
      ))}
    </div>
  );
}
