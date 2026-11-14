import type { ButtonHTMLAttributes, CSSProperties } from "react";
import type { LocalPlayerId } from "@/game/state/playerId";
import { cssPlayerColor, playerAccent, playerColor, usePlayerColors } from "@/game/state/playerColors";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  playerId: LocalPlayerId;
}

export function PlayerSelectorButton({ playerId, ...props }: Props) {
  const color = usePlayerColors((state) => playerColor(playerId, state.colors));
  return (
    <button
      {...props}
      className={`btn secondary player-selector-${playerId}`}
      style={{ "--player-color": cssPlayerColor(color), "--player-accent": cssPlayerColor(playerAccent(color)) } as CSSProperties}
    >
      {playerId}
    </button>
  );
}
