import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VeyloraOperations } from "./VeyloraOperations";
import { ResultScreen } from "./ResultScreen";
import { Hud } from "./Hud";
import { MainMenu } from "./main-menu/MainMenu";
import { gameRef } from "./gameRef";
import { useGameStore } from "@/game/state/gameStore";
import { useVeyloraStore } from "@/game/state/veyloraStore";
import { useMultiplayerStore } from "@/game/state/multiplayerStore";
import { useCampaignStore } from "@/game/state/campaignStore";
import { missionById, missionBattlefield } from "@/game/data/campaignContent";

vi.mock("./gameRef", () => ({
  gameRef: { current: { startOperation: vi.fn(() => true), leaveBattle: vi.fn(), restart: vi.fn() } },
}));
vi.mock("./result/ResultDecorCanvas", () => ({ ResultDecorCanvas: () => null }));

describe("VEYLORA UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMultiplayerStore.getState().leave();
    useCampaignStore.getState().reset();
    useVeyloraStore.getState().reset();
    useGameStore.setState({
      screen: "menu",
      matchMode: "skirmish",
      phase: "aiming",
      aiActive: false,
      matchSequence: 0,
      tanks: [],
      strategicObjectives: [],
      profiles: {},
      matchStats: {},
      winner: null,
      campaignMission: null,
      missionSuccess: null,
      opponentSkill: null,
    });
  });

  it("opens separately from the legacy campaign and offers both missions immediately", () => {
    const menu = render(<MainMenu />);
    fireEvent.click(screen.getByRole("button", { name: /VEYLORA-03/ }));
    expect(useGameStore.getState().screen).toBe("veylora");
    menu.unmount();
    render(<VeyloraOperations />);
    expect(screen.getAllByRole("button", { name: "Művelet indítása" })).toHaveLength(2);
    expect(screen.getByText(/Érc, tervrajz, kampányfejlesztés/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Művelet indítása" })[1]!);
    expect(gameRef.current?.startOperation).toHaveBeenCalledWith("secure-lab");
    expect(useGameStore.getState().screen).toBe("playing");
    expect(useCampaignStore.getState().completedIds).toEqual([]);
  });

  it("shows a secured but replayable sector, with a confirmed separate progress reset", () => {
    useVeyloraStore.getState().complete("secure-mine");
    useVeyloraStore.getState().complete("secure-lab");
    render(<VeyloraOperations />);
    expect(screen.getByRole("status")).toHaveTextContent("biztosítva");
    expect(screen.getAllByRole("button", { name: "Művelet újrajátszása" })).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "VEYLORA-haladás törlése" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Mégse" }));
    expect(useVeyloraStore.getState().completedMissionIds).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "VEYLORA-haladás törlése" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Törlés" }));
    expect(useVeyloraStore.getState().completedMissionIds).toEqual([]);
  });

  it("blocks start on a load error", () => {
    useVeyloraStore.setState({ error: "veylora.loadError" });
    render(<VeyloraOperations />);
    expect(screen.getByRole("alert")).toHaveTextContent("eredeti mentést");
    expect(
      screen.getAllByRole("button", { name: "Művelet indítása" }).every((button) => button.hasAttribute("disabled")),
    ).toBe(true);
  });

  it("reports failed start and stays on the operations screen", () => {
    vi.mocked(gameRef.current!.startOperation).mockReturnValueOnce(false);
    useGameStore.setState({ screen: "veylora" });
    render(<VeyloraOperations />);
    fireEvent.click(screen.getAllByRole("button", { name: "Művelet indítása" })[0]!);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(useGameStore.getState().screen).toBe("veylora");
  });

  it("does not present a tank victory as mission success when the building was lost", () => {
    const mission = missionById("secure-lab");
    useGameStore.setState({
      screen: "playing",
      matchMode: "operation",
      aiActive: true,
      phase: "gameOver",
      winner: "P1",
      missionSuccess: false,
      campaignMission: mission,
      sector: missionBattlefield(mission),
    });
    render(<ResultScreen />);
    expect(screen.getByText(/Küldetés sikertelen/)).toBeInTheDocument();
    expect(screen.queryByText(/PROTOCOL COMPLETE/)).toBeNull();
    expect(useVeyloraStore.getState().completedMissionIds).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: /VEYLORA-03/ }));
    expect(useGameStore.getState().screen).toBe("veylora");
  });

  it("returns from the operation HUD only after confirming abandonment", () => {
    useGameStore.setState({ screen: "playing", matchMode: "operation" });
    render(<Hud />);
    fireEvent.click(screen.getByRole("button", { name: /VEYLORA-03/ }));
    fireEvent.click(screen.getByRole("button", { name: "Harc folytatása" }));
    expect(useGameStore.getState().screen).toBe("playing");
    fireEvent.click(screen.getByRole("button", { name: /VEYLORA-03/ }));
    fireEvent.click(screen.getByRole("button", { name: "Bevetés megszakítása" }));
    expect(gameRef.current?.leaveBattle).toHaveBeenCalled();
    expect(useGameStore.getState().screen).toBe("veylora");
  });
});
