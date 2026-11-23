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
import { cssPlayerColor, DEFAULT_ARMOR_COLORS, DEFAULT_PLAYER_COLORS, markingColor, playerAccent, usePlayerColors } from "@/game/state/playerColors";
import { tankArmorLayers } from "@/game/assets/tankArmorLayers";

vi.mock("./result/ResultDecorCanvas", () => ({ ResultDecorCanvas: () => null }));
vi.mock("./CampaignStarfieldCanvas", () => ({ CampaignStarfieldCanvas: () => null }));
vi.mock("./gameRef", () => ({ gameRef: { current: { buy: vi.fn(), leaveBattle: vi.fn() } } }));

describe("workshop", () => {
  beforeEach(async () => {
    await waitFor(() => expect(useVeyloraStore.getState().pending).toBe(0));
    vi.stubGlobal("indexedDB", new IDBFactory());
    useMultiplayerStore.getState().leave();
    useAiSettings.setState({ enabled: false });
    usePlayerColors.setState({ colors: { ...DEFAULT_PLAYER_COLORS }, armorColors: { ...DEFAULT_ARMOR_COLORS }, error: null });
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
      aiOpponent: null,
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

  it("shows the CPU's actual upgrades instead of P2 after an AI battle", () => {
    useGameStore.setState({
      workshopOrigin: "playing",
      aiActive: true,
      aiOpponent: { slot: "P2", profile: { xp: 450, levels: { armor: 2 } }, fixedArmor: null },
    });
    render(<Workshop />);
    const ai = screen.getByRole("region", { name: "AI-ellenfél" });
    expect(screen.queryByRole("region", { name: "P2" })).not.toBeInTheDocument();
    expect(within(ai).getByText("Csak megtekintés")).toBeInTheDocument();
    expect(within(ai).getByText("450 XP")).toBeInTheDocument();
    expect(within(ai).getByRole("button", { name: "AI: Páncél" })).toBeDisabled();
    expect(within(ai).getByRole("button", { name: "AI: Páncél" }).closest(".upgrade-row")).toHaveTextContent(/2\/\d/);
    expect(within(ai).getByRole("button", { name: "AI: Standard lövedék" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "P1: Páncél" })).toBeEnabled();
  });

  it("replaces P1 with the mission loadout when P2 fought the AI", () => {
    useGameStore.setState({
      workshopOrigin: "playing",
      matchMode: "operation",
      campaignPlayer: "P2",
      aiActive: true,
      aiOpponent: { slot: "P1", profile: { xp: 0, levels: {}, weapons: ["ap"] }, fixedArmor: 20 },
    });
    render(<Workshop />);
    const ai = screen.getByRole("region", { name: "AI-ellenfél" });
    expect(screen.queryByRole("region", { name: "P1" })).not.toBeInTheDocument();
    expect(within(ai).getByText("Küldetésben rögzített páncélzat: 20")).toBeInTheDocument();
    expect(within(ai).getByRole("button", { name: "AI: Páncéltörő" })).toBeDisabled();
    expect(within(ai).queryByText("0 XP")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "P2: Páncél" })).toBeEnabled();
  });

  it("uses each selected color for the tank panels and player buttons", () => {
    usePlayerColors.setState({ colors: { P1: "green", P2: "purple" }, armorColors: { P1: "olive", P2: "steel" } });
    render(<Workshop />);
    const p1Color = markingColor("P1", usePlayerColors.getState());
    const p2Color = markingColor("P2", usePlayerColors.getState());
    expect(screen.getByRole("button", { name: "P1" }).style.getPropertyValue("--player-color")).toBe(cssPlayerColor(p1Color));
    expect(screen.getByRole("button", { name: "P2" }).style.getPropertyValue("--player-color")).toBe(cssPlayerColor(p2Color));
    const p1 = screen.getByRole("region", { name: "P1" });
    expect(p1.style.getPropertyValue("--player-color")).toBe(cssPlayerColor(p1Color));
    const images = [...p1.querySelectorAll("image")];
    expect(images.slice(1, 4).map((image) => image.getAttribute("href"))).toEqual(Object.values(tankArmorLayers));
    expect(images[2]).toHaveAttribute("filter");
    expect(images[4]).toHaveAttribute("filter");
    expect(images[2]?.getAttribute("filter")).not.toBe(images[4]?.getAttribute("filter"));
    const p2 = screen.getByRole("region", { name: "P2" });
    expect(p2.style.getPropertyValue("--player-color")).toBe(cssPlayerColor(p2Color));
    expect(p2.querySelector("feColorMatrix")).toHaveAttribute(
      "values",
      `${((p2Color >> 16) & 255) / 255} 0 0 0 0 0 ${((p2Color >> 8) & 255) / 255} 0 0 0 0 0 ${(p2Color & 255) / 255} 0 0 0 0 0 1 0`,
    );
  });

  it("keeps a neutral marking and its player controls legible", () => {
    usePlayerColors.setState({ colors: { P1: "white", P2: "white" } });
    render(<Workshop />);
    const p1 = screen.getByRole("region", { name: "P1" });
    const color = markingColor("P1", usePlayerColors.getState());
    expect(p1.style.getPropertyValue("--player-color")).toBe(cssPlayerColor(color));
    expect(p1.style.getPropertyValue("--player-accent")).toBe(cssPlayerColor(playerAccent(color)));
    expect(screen.getByRole("button", { name: "P1" }).style.getPropertyValue("--player-accent")).toBe(cssPlayerColor(playerAccent(color)));
    const matrix = p1.querySelector("feColorMatrix")?.getAttribute("values");
    const channel = (color & 255) / 255;
    expect(matrix).toBe(`${channel} 0 0 0 0 0 ${channel} 0 0 0 0 0 ${channel} 0 0 0 0 0 1 0`);
    expect(screen.getByRole("region", { name: "P2" }).style.getPropertyValue("--player-accent")).toBe(cssPlayerColor(playerAccent(color)));
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
    expect(screen.getByRole("button", { name: "P1" }).style.getPropertyValue("--player-color")).toBe(cssPlayerColor(markingColor("P1", usePlayerColors.getState())));
    expect(screen.getByRole("button", { name: "P2" }).style.getPropertyValue("--player-color")).toBe(cssPlayerColor(markingColor("P2", usePlayerColors.getState())));
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
