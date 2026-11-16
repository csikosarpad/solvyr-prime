import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { Workshop } from "./Workshop";
import { MainMenu } from "./main-menu/MainMenu";
import { CampaignMap } from "./CampaignMap";
import { ResultScreen } from "./ResultScreen";
import { useGameStore } from "@/game/state/gameStore";
import { useVeyloraStore } from "@/game/state/veyloraStore";
import { useMultiplayerStore } from "@/game/state/multiplayerStore";
import { useAiSettings } from "@/game/state/aiSettings";
import { useCampaignStore } from "@/game/state/campaignStore";
import { DEFAULT_PLAYER_COLORS, PLAYER_COLORS, usePlayerColors } from "@/game/state/playerColors";

vi.mock("./result/ResultDecorCanvas", () => ({ ResultDecorCanvas: () => null }));
vi.mock("./CampaignStarfieldCanvas", () => ({ CampaignStarfieldCanvas: () => null }));
vi.mock("./gameRef", () => ({ gameRef: { current: { buy: vi.fn(), leaveBattle: vi.fn() } } }));

describe("workshop", () => {
  beforeEach(async () => {
    await waitFor(() => expect(useVeyloraStore.getState().pending).toBe(0));
    vi.stubGlobal("indexedDB", new IDBFactory());
    useMultiplayerStore.getState().leave();
    useAiSettings.setState({ enabled: false });
    usePlayerColors.setState({ colors: { ...DEFAULT_PLAYER_COLORS }, error: null });
    useCampaignStore.getState().switchPlayer("P1");
    await useVeyloraStore.getState().switchPlayer("P1");
    await useVeyloraStore.getState().resetEconomy();
    useGameStore.setState({
      screen: "menu",
      workshopOrigin: "menu",
      workshopError: null,
      workshopPlayer: "P1",
      campaignPlayer: "P1",
      phase: "gameOver",
      matchMode: "skirmish",
      aiActive: false,
      profiles: { P1: { xp: 100, levels: {} }, P2: { xp: 100, levels: {} } },
      matchStats: {},
      winner: "P1",
    });
  });

  it.each([
    ["menu", MainMenu],
    ["campaignMap", CampaignMap],
    ["playing", ResultScreen],
  ] as const)("opens from %s and returns to the origin", (origin, Component) => {
    useGameStore.setState({ screen: origin });
    const source = render(<Component />);
    fireEvent.click(screen.getByRole("button", { name: "Fejlesztés" }));
    expect(useGameStore.getState()).toMatchObject({ screen: "workshop", workshopOrigin: origin });
    source.unmount();
    render(<Workshop />);
    fireEvent.click(screen.getByRole("button", { name: "Vissza" }));
    expect(useGameStore.getState().screen).toBe(origin);
  });

  it("keeps both panels visible and only enables the selected player", async () => {
    render(<Workshop />);
    const p1Panel = screen.getByRole("region", { name: "P1" });
    const p2Panel = screen.getByRole("region", { name: "P2" });
    expect(screen.getByRole("button", { name: "P1" })).toHaveClass("player-selector-P1");
    expect(screen.getByRole("button", { name: "P2" })).toHaveClass("player-selector-P2");
    expect(p1Panel).toHaveClass("accent-cyan");
    expect(p2Panel).toHaveClass("accent-red");
    expect(p1Panel).not.toHaveClass("is-inactive");
    expect(p2Panel).toHaveClass("is-inactive");
    expect(within(p2Panel).getByText("Nem kijelölt játékos")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "P1: Páncél" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "P2: Páncél" })).toBeDisabled();
    await waitFor(() => expect(screen.getByRole("button", { name: "P2" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "P2" }));
    expect(screen.getByRole("button", { name: "P2: Páncél" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "P1: Páncél" })).toBeDisabled();
    expect(p1Panel).toHaveClass("is-inactive");
    expect(p2Panel).not.toHaveClass("is-inactive");
    expect(within(p1Panel).getByText("Nem kijelölt játékos")).toBeInTheDocument();
  });

  it("filters both players' upgrades and weapons while keeping both panels visible", () => {
    render(<Workshop />);
    const p1Panel = screen.getByRole("region", { name: "P1" });
    const p2Panel = screen.getByRole("region", { name: "P2" });
    const stats = screen.getByRole("button", { name: "Statisztika" });
    const armory = screen.getByRole("button", { name: "Fegyvertár" });
    const special = screen.getByRole("button", { name: "Különleges" });

    fireEvent.click(stats);
    expect(stats).toHaveAttribute("aria-pressed", "true");
    expect(within(p1Panel).getByRole("button", { name: "P1: Páncél" })).toBeInTheDocument();
    expect(within(p2Panel).getByRole("button", { name: "P2: Páncél" })).toBeInTheDocument();
    expect(within(p1Panel).queryByRole("button", { name: "P1: Páncéltörő" })).not.toBeInTheDocument();

    fireEvent.click(armory);
    expect(within(p1Panel).queryByRole("button", { name: "P1: Páncél" })).not.toBeInTheDocument();
    expect(within(p1Panel).getByRole("button", { name: "P1: Páncéltörő" })).toBeInTheDocument();
    expect(within(p2Panel).getByRole("button", { name: "P2: Páncéltörő" })).toBeInTheDocument();
    expect(within(p1Panel).getByRole("region", { name: /fejlesztések és fegyverek/i })).toHaveClass("unit-inventory");

    fireEvent.click(special);
    expect(screen.getByRole("heading", { name: "Megerősített pajzs" })).toBeInTheDocument();
    expect(within(p1Panel).queryByRole("button", { name: "P1: Páncél" })).not.toBeInTheDocument();
    expect(within(p2Panel).queryByRole("button", { name: "P2: Páncéltörő" })).not.toBeInTheDocument();
  });

  it("keeps the other panel inactive when opened for P2's campaign", async () => {
    useCampaignStore.getState().switchPlayer("P2");
    useGameStore.setState({ workshopOrigin: "campaignMap", campaignPlayer: "P2" });
    render(<Workshop />);
    expect(screen.getByRole("button", { name: "P1: Páncél" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "P2: Páncél" })).toBeEnabled();
    expect(screen.getByRole("region", { name: "P1" })).toHaveClass("is-inactive");
    expect(screen.getByRole("region", { name: "P2" })).not.toHaveClass("is-inactive");
    expect(screen.queryByRole("button", { name: "P1" })).not.toBeInTheDocument();
    await waitFor(() => expect(useVeyloraStore.getState().pending).toBe(0));
  });

  it("uses each selected color for the tank panels and player buttons", () => {
    usePlayerColors.setState({ colors: { P1: "green", P2: "purple" } });
    render(<Workshop />);
    expect(screen.getByRole("button", { name: "P1" }).style.getPropertyValue("--player-color")).toBe("#54d994");
    expect(screen.getByRole("button", { name: "P2" }).style.getPropertyValue("--player-color")).toBe("#c98bff");
    expect(screen.getByRole("region", { name: "P1" }).style.getPropertyValue("--player-color")).toBe("#54d994");
    const p2 = screen.getByRole("region", { name: "P2" });
    expect(p2.style.getPropertyValue("--player-color")).toBe("#c98bff");
    expect(p2.querySelector("feColorMatrix")).toHaveAttribute(
      "values",
      `${((PLAYER_COLORS.purple >> 16) & 255) / 255} 0 0 0 0 0 ${((PLAYER_COLORS.purple >> 8) & 255) / 255} 0 0 0 0 0 ${(PLAYER_COLORS.purple & 255) / 255} 0 0 0 0 0 1 0`,
    );
  });

  it("keeps a black tank and its player controls legible", () => {
    usePlayerColors.setState({ colors: { P1: "black", P2: "white" } });
    render(<Workshop />);
    const p1 = screen.getByRole("region", { name: "P1" });
    expect(p1.style.getPropertyValue("--player-color")).toBe("#000000");
    expect(p1.style.getPropertyValue("--player-accent")).toBe("#b9c7d6");
    expect(screen.getByRole("button", { name: "P1" }).style.getPropertyValue("--player-accent")).toBe("#b9c7d6");
    const matrix = p1.querySelector("feColorMatrix")?.getAttribute("values");
    const channel = 0x77 / 255;
    expect(matrix).toBe(`${channel} 0 0 0 0 0 ${channel} 0 0 0 0 0 ${channel} 0 0 0 0 0 1 0`);
    expect(screen.getByRole("region", { name: "P2" }).style.getPropertyValue("--player-accent")).toBe("#ffffff");
  });

  it("shows how to acquire the shield and persists equipment shared with the station", async () => {
    render(<Workshop />);
    expect(await screen.findByText(/állomáson vásárolható meg/)).toBeInTheDocument();
    await act(async () => {
      const state = useVeyloraStore.getState;
      await state().complete("secure-mine", state().economy.generation);
      await state().complete("secure-lab", state().economy.generation);
      await state().buy("reinforced-shield");
    });
    expect(screen.getByText("Felszerelve.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Pajzs levétele" }));
    expect(await screen.findByText("Nincs felszerelve.")).toBeInTheDocument();
    await act(async () => { await useVeyloraStore.getState().refresh(); });
    expect(useVeyloraStore.getState().economy.equippedShield).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Pajzs felszerelése" }));
    await waitFor(() => expect(useVeyloraStore.getState().economy.equippedShield).toBe("reinforced-shield"));
    expect(screen.getByText(/csak az új rendszerű kampánycsatákban hat/)).toBeInTheDocument();
  });

  it("does not show P1's owned shield in P2's workshop and retains the selection", async () => {
    const state = useVeyloraStore.getState;
    await state().complete("secure-mine", state().economy.generation);
    await state().complete("secure-lab", state().economy.generation);
    await state().buy("reinforced-shield");
    useGameStore.setState({ screen: "workshop" });
    render(<Workshop />);
    expect(await screen.findByText("Felszerelve.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "P2" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "P2" }));
    expect(screen.queryByText("Felszerelve.")).not.toBeInTheDocument();
    expect(await screen.findByText(/állomáson vásárolható meg/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Pajzs levétele" })).not.toBeInTheDocument();
    expect(useGameStore.getState().workshopPlayer).toBe("P2");
    await waitFor(() => expect(screen.getByRole("button", { name: "Vissza" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Vissza" }));
    await waitFor(() => expect(useGameStore.getState().screen).toBe("menu"));
    expect(state().playerId).toBe("P1");
    expect(state().economy.equippedShield).toBe("reinforced-shield");
  });

  it("switches the campaign map to P2 without exposing P1 progression", async () => {
    usePlayerColors.setState({ colors: { P1: "green", P2: "purple" } });
    useCampaignStore.getState().complete("alpha-01");
    render(<CampaignMap />);
    expect(screen.getByRole("button", { name: "P1" }).style.getPropertyValue("--player-color")).toBe("#54d994");
    expect(screen.getByRole("button", { name: "P2" }).style.getPropertyValue("--player-color")).toBe("#c98bff");
    expect(screen.getByText("Teljesítve: 1 / 6")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "P2" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "P2" }));
    await waitFor(() => expect(useVeyloraStore.getState().playerId).toBe("P2"));
    expect(screen.getByText("Teljesítve: 0 / 6")).toBeInTheDocument();
    expect(useCampaignStore.getState().completedIds).toEqual([]);
    await waitFor(() => expect(screen.getByRole("button", { name: "P1" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "P1" }));
    await waitFor(() => expect(useVeyloraStore.getState().playerId).toBe("P1"));
    expect(screen.getByText("Teljesítve: 1 / 6")).toBeInTheDocument();
  });

  it("surfaces campaign loading failures instead of showing an unowned shield", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("indexedDB", undefined);
    render(<Workshop />);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText(/állomáson vásárolható meg/)).not.toBeInTheDocument();
  });
});
