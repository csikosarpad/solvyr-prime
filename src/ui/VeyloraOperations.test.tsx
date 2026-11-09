import { fireEvent, render, screen, within, waitFor, act } from "@testing-library/react";
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
import { IDBFactory, IDBObjectStore } from "fake-indexeddb";
import { VEYLORA_STORAGE_KEY } from "@/game/state/veyloraStore";

vi.mock("./gameRef", () => ({
  gameRef: { current: { startOperation: vi.fn(async () => true), leaveBattle: vi.fn(), restart: vi.fn() } },
}));
vi.mock("./result/ResultDecorCanvas", () => ({ ResultDecorCanvas: () => null }));

describe("VEYLORA UI", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.stubGlobal("indexedDB", new IDBFactory());
    localStorage.removeItem(VEYLORA_STORAGE_KEY);
    useMultiplayerStore.getState().leave();
    useCampaignStore.getState().reset();
    await useVeyloraStore.getState().resetEconomy();
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
      missionGeneration: null,
      opponentSkill: null,
    });
  });

  const renderOperations = async () => {
    render(<VeyloraOperations />);
    await waitFor(() => expect(useVeyloraStore.getState().pending).toBe(0));
  };
  const complete = (id: string) =>
    useVeyloraStore.getState().complete(id, useVeyloraStore.getState().economy.generation);

  it("opens separately from the legacy campaign and offers both missions immediately", async () => {
    const menu = render(<MainMenu />);
    fireEvent.click(screen.getByRole("button", { name: /VEYLORA-03/ }));
    expect(useGameStore.getState().screen).toBe("veylora");
    menu.unmount();
    await renderOperations();
    expect(screen.getAllByRole("button", { name: "Művelet indítása" })).toHaveLength(2);
    expect(screen.getByText(/Build nélküli tartalomfrissítés még nincs/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Művelet indítása" })[1]!);
    expect(gameRef.current?.startOperation).toHaveBeenCalledWith("secure-lab");
    await waitFor(() => expect(useGameStore.getState().screen).toBe("playing"));
    expect(useCampaignStore.getState().completedIds).toEqual([]);
  });

  it("shows a secured but replayable sector, with a confirmed separate progress reset", async () => {
    await complete("secure-mine");
    await complete("secure-lab");
    await renderOperations();
    expect(screen.getByRole("status")).toHaveTextContent("biztosítva");
    expect(screen.getAllByRole("button", { name: "Művelet újrajátszása" })).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "VEYLORA-haladás törlése" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Mégse" }));
    expect(useVeyloraStore.getState().completedMissionIds).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "VEYLORA-haladás törlése" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Törlés" }));
    await waitFor(() => expect(useVeyloraStore.getState().completedMissionIds).toEqual([]));
    expect(useVeyloraStore.getState().economy.resources["industrial-ore"]).toBe(20);
    expect(Object.keys(useVeyloraStore.getState().economy.claims)).toHaveLength(2);
  });

  it("blocks start on a load error and requires full economic reset rather than deleting wealth implicitly", async () => {
    vi.stubGlobal("indexedDB", new IDBFactory());
    localStorage.setItem(VEYLORA_STORAGE_KEY, "broken");
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<VeyloraOperations />);
    expect(await screen.findByRole("alert")).toHaveTextContent("eredeti mentést");
    expect(
      screen.getAllByRole("button", { name: "Művelet indítása" }).every((button) => button.hasAttribute("disabled")),
    ).toBe(true);
    expect(screen.getByRole("button", { name: "VEYLORA-haladás törlése" })).toBeDisabled();
  });

  it("reports failed start and stays on the operations screen", async () => {
    vi.mocked(gameRef.current!.startOperation).mockResolvedValueOnce(false);
    useGameStore.setState({ screen: "veylora" });
    await renderOperations();
    fireEvent.click(screen.getAllByRole("button", { name: "Művelet indítása" })[0]!);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(useGameStore.getState().screen).toBe("veylora");
  });

  it("offers a real station purchase with zero-shield warning, permanent blueprint and owned status after reload", async () => {
    await complete("secure-mine");
    await complete("secure-lab");
    await renderOperations();
    const recipe = screen.getByRole("region", { name: "Megerősített pajzs" });
    expect(within(recipe).getByText(/vásárlásnak most nincs hatása/)).toBeInTheDocument();
    expect(within(recipe).getByText(/nem fogy el/)).toBeInTheDocument();
    fireEvent.click(within(recipe).getByRole("button", { name: "Fejlesztés megvásárlása" }));
    expect(await within(recipe).findByText("Már megvásárolva.")).toBeInTheDocument();
    expect(within(recipe).getByRole("button", { name: "Fejlesztés megvásárlása" })).toBeDisabled();
    expect(useVeyloraStore.getState().economy.resources["industrial-ore"]).toBe(0);
    expect(useVeyloraStore.getState().economy.technologies).toEqual(["materials-blueprint"]);
    await act(async () => {
      await useVeyloraStore.getState().refresh();
    });
    expect(within(recipe).getByText("Már megvásárolva.")).toBeInTheDocument();
  });

  it("confirms full economic reset separately and preserves XP and legacy progress", async () => {
    await complete("secure-mine");
    await complete("secure-lab");
    await useVeyloraStore.getState().buy("reinforced-shield");
    useCampaignStore.getState().complete("alpha-01");
    const profiles = { P1: { xp: 123, levels: { shield: 2 } } };
    useGameStore.setState({ profiles });
    await renderOperations();
    fireEvent.click(screen.getByRole("button", { name: "Teljes kampánygazdaság törlése" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("XP-fejlesztések");
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Mégse" }));
    expect(useVeyloraStore.getState().economy.purchases["reinforced-shield"]).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Teljes kampánygazdaság törlése" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Törlés" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(useVeyloraStore.getState().economy).toMatchObject({
      resources: {},
      technologies: [],
      purchases: {},
      claims: {},
    });
    expect(useVeyloraStore.getState().completedMissionIds).toEqual([]);
    expect(useGameStore.getState().profiles).toEqual(profiles);
    expect(useCampaignStore.getState().completedIds).toEqual(["alpha-01"]);
  });

  it("shows a failed reward transaction on results and retries the original battle generation", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const mission = missionById("secure-mine");
    const generation = useVeyloraStore.getState().economy.generation;
    vi.spyOn(IDBObjectStore.prototype, "put").mockImplementationOnce(() => {
      throw new Error("quota");
    });
    expect(await complete("secure-mine")).toBe(false);
    useGameStore.setState({
      matchMode: "operation",
      winner: "P1",
      missionSuccess: true,
      campaignMission: mission,
      missionGeneration: generation,
    });
    render(<ResultScreen />);
    expect(screen.getByRole("alert")).toHaveTextContent("nincs elmentve");
    fireEvent.click(screen.getByRole("button", { name: "Teljesítés mentésének újrapróbálása" }));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(useVeyloraStore.getState().economy.resources["industrial-ore"]).toBe(20);
    expect(screen.getByText(/Gazdasági jutalom már elszámolva/)).toBeInTheDocument();
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
