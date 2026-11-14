import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGameStore } from "@/game/state/gameStore";
import { useCampaignStore } from "@/game/state/campaignStore";
import { useAiSettings } from "@/game/state/aiSettings";
import { useMultiplayerStore } from "@/game/state/multiplayerStore";
import { CampaignMap } from "./CampaignMap";
import { MainMenu } from "./main-menu/MainMenu";
import { ResultScreen } from "./ResultScreen";
import { Hud } from "./Hud";
import { VeyloraOperations } from "./VeyloraOperations";
import { gameRef } from "./gameRef";
import { TRAINING_SECTOR, sectorById } from "@/game/data/sectors";
import { useVeyloraStore } from "@/game/state/veyloraStore";
import { IDBFactory } from "fake-indexeddb";

vi.mock("./gameRef", () => ({
  gameRef: { current: { startCampaign: vi.fn(() => true), leaveBattle: vi.fn(), restart: vi.fn() } },
}));
vi.mock("./result/ResultDecorCanvas", () => ({ ResultDecorCanvas: () => null }));
vi.mock("./CampaignStarfieldCanvas", () => ({
  CampaignStarfieldCanvas: ({ warpSequence }: { warpSequence: number }) => (
    <div data-testid="starfield" data-warp-sequence={warpSequence} />
  ),
}));

describe("Campaign Map UI", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.stubGlobal("indexedDB", new IDBFactory());
    useCampaignStore.getState().reset();
    await useVeyloraStore.getState().resetEconomy();
    useMultiplayerStore.getState().leave();
    useAiSettings.getState().setEnabled(false);
    useGameStore.setState({
      screen: "menu",
      matchMode: "skirmish",
      aiActive: false,
      winner: null,
      phase: "aiming",
      tanks: [],
      matchSequence: 0,
      profiles: {},
      matchStats: {},
      sector: TRAINING_SECTOR,
      campaignNewRoutes: [],
      strategicObjectives: [],
    });
  });

  it("opens the map from the menu and leaves any existing battle", () => {
    render(<MainMenu />);
    expect(screen.getByText("Teljesítve: 0 / 5")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Műveleti térkép" }));
    expect(gameRef.current?.leaveBattle).toHaveBeenCalledOnce();
    expect(useGameStore.getState().screen).toBe("campaignMap");
  });

  it("opens VEYLORA as a second-level sector after ALPHA and returns to the operation map", async () => {
    const { unmount: unmountMap } = render(<CampaignMap />);
    const node = await screen.findByRole("button", { name: /VEYLORA-03 · Bányászati szektor, Zárolt/ });
    fireEvent.click(node);
    expect(screen.getByRole("button", { name: "Szektor megnyitása" })).toBeDisabled();
    act(() => useCampaignStore.getState().complete("alpha-01"));
    expect(screen.getByRole("button", { name: /VEYLORA-03 · Bányászati szektor, Elérhető/ })).toBeEnabled();
    expect(screen.getByRole("heading", { name: "VEYLORA-03 · Bányászati szektor" })).toBeInTheDocument();
    expect(screen.getByText("Teljesítve: 0 / 3")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Szektor megnyitása" }));
    expect(useGameStore.getState().screen).toBe("veylora");
    unmountMap();
    const { unmount } = render(<VeyloraOperations />);
    expect(await screen.findByRole("button", { name: "Művelet indítása" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^VEYLORA-B,/ }));
    expect(screen.getByRole("button", { name: "Művelet indítása" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Műveleti térkép" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Műveleti térkép" }));
    expect(useGameStore.getState().screen).toBe("campaignMap");
    unmount();
  });

  it("deploys only the real ALPHA-01 operation without changing quick-battle AI settings", () => {
    render(<CampaignMap />);
    expect(screen.getByRole("button", { name: /SECTOR ALPHA-01, Training Grounds, Elérhető/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "Művelet indítása" }));
    expect(gameRef.current?.startCampaign).toHaveBeenCalledOnce();
    expect(gameRef.current?.startCampaign).toHaveBeenCalledWith("alpha-01");
    expect(useGameStore.getState().screen).toBe("playing");
    expect(useAiSettings.getState().enabled).toBe(false);
  });

  it("shows 1/6 and replay after completion, and resets with confirmation only", () => {
    useCampaignStore.getState().complete("alpha-01");
    render(<CampaignMap />);
    expect(screen.getByText("Teljesítve: 1 / 6")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /SECTOR ALPHA-01,/ }));
    expect(screen.getByRole("button", { name: "Művelet újrajátszása" })).toBeEnabled();
    const confirm = vi.spyOn(window, "confirm");
    fireEvent.click(screen.getByRole("button", { name: "Kampányhaladás törlése" }));
    const dialog = screen.getByRole("dialog", { name: "Törlöd a kampányhaladást?" });
    expect(dialog).toHaveAccessibleDescription(/Az XP és a fejlesztések megmaradnak/);
    expect(within(dialog).getByRole("button", { name: "Mégse" })).toHaveFocus();
    fireEvent.click(within(dialog).getByRole("button", { name: "Mégse" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(useCampaignStore.getState().completedIds).toEqual(["alpha-01"]);
    fireEvent.click(screen.getByRole("button", { name: "Kampányhaladás törlése" }));
    fireEvent.keyDown(screen.getByRole("button", { name: "Mégse" }), { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Kampányhaladás törlése" }));
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(useCampaignStore.getState().completedIds).toEqual(["alpha-01"]);
    fireEvent.click(screen.getByRole("button", { name: "Kampányhaladás törlése" }));
    fireEvent.click(screen.getByRole("button", { name: "Törlés" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(useCampaignStore.getState().completedIds).toEqual([]);
    expect(confirm).not.toHaveBeenCalled();
    confirm.mockRestore();
  });

  it("blocks launch and displays a load error", () => {
    useCampaignStore.setState({ error: "campaign.loadError" });
    render(<CampaignMap />);
    expect(screen.getByRole("alert")).toHaveTextContent("kampánymentés");
    expect(screen.getByRole("button", { name: "Művelet indítása" })).toBeDisabled();
  });

  it.each(["P1", "P2", null])("returns from campaign results without granting progress in React: %s", (winner) => {
    useGameStore.setState({ matchMode: "campaign", aiActive: true, phase: "gameOver", winner });
    const { rerender } = render(<ResultScreen />);
    rerender(<ResultScreen />);
    expect(useCampaignStore.getState().completedIds).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "Műveleti térkép" }));
    expect(gameRef.current?.leaveBattle).toHaveBeenCalledOnce();
    expect(useGameStore.getState().screen).toBe("campaignMap");
  });

  it("allows abandoning a campaign battle only after confirmation", () => {
    useGameStore.setState({ screen: "playing", matchMode: "campaign" });
    render(<Hud />);
    fireEvent.click(screen.getByRole("button", { name: "Vissza a térképre" }));
    fireEvent.click(screen.getByRole("button", { name: "Harc folytatása" }));
    expect(useGameStore.getState().screen).toBe("playing");
    fireEvent.click(screen.getByRole("button", { name: "Vissza a térképre" }));
    fireEvent.click(screen.getByRole("button", { name: "Bevetés megszakítása" }));
    expect(useGameStore.getState().screen).toBe("campaignMap");
    expect(useCampaignStore.getState().completedIds).toEqual([]);
  });

  it("surfaces unsaved progress on the map", () => {
    render(<CampaignMap />);
    act(() => useCampaignStore.setState({ completedIds: ["alpha-01"], error: "campaign.saveError" }));
    expect(screen.getByRole("alert")).toHaveTextContent("mentése sikertelen");
  });

  it("triggers a new warp on every node click, including repeated and locked selections", () => {
    render(<CampaignMap />);
    const starfield = screen.getByTestId("starfield");
    expect(starfield).toHaveAttribute("data-warp-sequence", "0");
    fireEvent.click(screen.getByRole("button", { name: /SECTOR ALPHA-01,/ }));
    expect(starfield).toHaveAttribute("data-warp-sequence", "1");
    fireEvent.click(screen.getByRole("button", { name: /SECTOR ALPHA-01,/ }));
    expect(starfield).toHaveAttribute("data-warp-sequence", "2");
    fireEvent.click(screen.getByRole("button", { name: /VEYLORA-03 · Bányászati szektor, Zárolt/ }));
    expect(starfield).toHaveAttribute("data-warp-sequence", "3");
    expect(screen.getByRole("button", { name: "Szektor megnyitása" })).toBeDisabled();
  });

  it("allows inspection of independently available sectors and keeps VEYLORA locked before ALPHA", () => {
    render(<CampaignMap />);
    fireEvent.click(screen.getByRole("button", { name: /SECTOR PRIME-00,/ }));
    expect(screen.getByRole("heading", { name: "Capital Perimeter" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Művelet indítása" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: /VEYLORA-03 · Bányászati szektor, Zárolt/ }));
    expect(screen.getByRole("heading", { name: "VEYLORA-03 · Bányászati szektor" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Szektor megnyitása" })).toBeDisabled();
    expect(useCampaignStore.getState().selectedId).toBe("prime-00");
  });

  it("announces the Forge objective trial without promising campaign persistence", () => {
    render(<CampaignMap />);
    fireEvent.click(screen.getByRole("button", { name: /SECTOR FORGE-17,/ }));
    const panel = screen.getByRole("heading", { name: "Industrial Expanse" }).parentElement;
    expect(panel).toHaveTextContent("Energiareaktor");
    expect(panel).toHaveTextContent("Civil telep");
    expect(panel).toHaveTextContent("kampánykár-mentés és szerződéses jutalom még nincs");
  });

  it("places the campaign objective between the header and map layout and explains current unlock rules", () => {
    const { container } = render(<CampaignMap />);
    const goal = screen.getByRole("region", { name: "A kampány célja" });
    expect(goal).toHaveTextContent("VEYLORA-03 az ALPHA-01 teljesítése után nyílik meg");
    expect(goal).toHaveTextContent("A többi szektor és küldetései közti függéseket később határozzuk meg");
    expect(container.querySelector(".campaign-header")?.nextElementSibling).toBe(goal);
    expect(goal.nextElementSibling).toHaveClass("workshop-players");
    expect(goal.nextElementSibling?.nextElementSibling).toHaveClass("campaign-layout");
    fireEvent.click(screen.getByRole("button", { name: /SECTOR PRIME-00,/ }));
    const panel = screen.getByRole("heading", { name: "Capital Perimeter" }).parentElement;
    expect(panel).toHaveTextContent("Energiareaktor");
    expect(panel).toHaveTextContent("Civil telep");
  });
  it("shows objective type, state and HP in the campaign HUD only", () => {
    useGameStore.setState({
      matchMode: "campaign",
      strategicObjectives: [
        {
          id: "energy-node-01",
          type: "ENERGY_NODE",
          worldX: 1040,
          worldY: 550,
          width: 48,
          height: 44,
          hp: 40,
          maxHp: 100,
          playerCausedDamage: 60,
        },
      ],
    });
    render(<Hud />);
    expect(screen.getByRole("region", { name: "Védendő létesítmények" })).toHaveTextContent(
      "Energiareaktor · Sérült · 40/100 HP",
    );
    act(() => useGameStore.setState({ matchMode: "skirmish" }));
    expect(screen.queryByRole("region", { name: "Védendő létesítmények" })).not.toBeInTheDocument();
  });
  it("reserves all card layouts but exposes only the active one and restarts its arrival effect", () => {
    const { container } = render(<CampaignMap />);
    const cards = container.querySelectorAll(".campaign-sector-content");
    expect(cards).toHaveLength(5);
    expect(container.querySelector(".campaign-sector-content.is-arriving")).toBeNull();
    const node = screen.getByRole("button", { name: /SECTOR PRIME-00,/ });
    fireEvent.click(node);
    const active = container.querySelector(".campaign-sector-content.is-active");
    const departing = container.querySelector(".campaign-sector-content.is-departing");
    expect(departing).toHaveTextContent("Training Grounds");
    expect(departing).toHaveAttribute("aria-hidden", "true");
    expect(departing?.querySelector("button")).toBeDisabled();
    expect(active).toHaveClass("is-arriving");
    expect(active).toHaveAttribute("aria-hidden", "false");
    expect(screen.queryByRole("heading", { name: "Training Grounds" })).not.toBeInTheDocument();
    container.querySelectorAll('.campaign-sector-content[aria-hidden="true"] button').forEach((button) => {
      expect(button).toBeDisabled();
    });
    fireEvent.click(node);
    expect(container.querySelectorAll(".campaign-sector-content.is-departing")).toHaveLength(1);
    expect(container.querySelector(".campaign-sector-content.is-departing")).toHaveTextContent("Capital Perimeter");
    expect(container.querySelector(".campaign-sector-content.is-active")).not.toBe(active);
    expect(screen.getAllByRole("button", { name: "Művelet indítása" })).toHaveLength(1);
  });

  it("launches an unlocked branch and persists its operation in the main menu", () => {
    useCampaignStore.getState().complete("alpha-01");
    const { unmount } = render(<CampaignMap />);
    fireEvent.click(screen.getByRole("button", { name: /SECTOR FORGE-17,/ }));
    expect(useCampaignStore.getState().selectedId).toBe("forge-17");
    fireEvent.click(screen.getByRole("button", { name: "Művelet indítása" }));
    expect(gameRef.current?.startCampaign).toHaveBeenCalledWith("forge-17");
    unmount();
    render(<MainMenu />);
    expect(screen.getByText("Industrial Expanse")).toBeInTheDocument();
  });

  it("shows real new routes on results, never grants completion from rendering", () => {
    useGameStore.setState({
      matchMode: "campaign",
      phase: "gameOver",
      winner: "P1",
      sector: sectorById("forge-17"),
      campaignNewRoutes: ["vanguard-12"],
    });
    const { rerender } = render(<ResultScreen />);
    expect(screen.getByText("Új útvonal elérhető: Defense Grid")).toBeInTheDocument();
    act(() => useGameStore.setState({ campaignNewRoutes: [] }));
    rerender(<ResultScreen />);
    expect(screen.queryByText(/Új útvonal elérhető/)).not.toBeInTheDocument();
    expect(useCampaignStore.getState().completedIds).toEqual([]);
  });

  it("does not imply that PRIME completes the operation or that other sectors are optional", () => {
    const store = useCampaignStore.getState();
    ["alpha-01", "forge-17", "vanguard-12", "prime-00"].forEach((id) => store.complete(sectorById(id).id));
    render(<CampaignMap />);
    expect(screen.getByText("Teljesítve: 4 / 6")).toBeInTheDocument();
    expect(screen.queryByText(/művelet teljesült/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /SECTOR DELTA-08, Crystal Basin, Elérhető/ })).toBeEnabled();
  });

  it("shows only sector codes in map nodes and full descriptions in the right panel", () => {
    const { container } = render(<CampaignMap />);
    const alphaNode = screen.getByRole("button", { name: /SECTOR ALPHA-01,/ });
    expect(alphaNode).toHaveTextContent("ALPHA-01");
    expect(alphaNode.querySelector("strong")).toBeNull();
    expect(alphaNode.querySelector(".campaign-node-symbol")).toBeNull();
    expect(screen.getByRole("heading", { name: "Training Grounds" })).toBeInTheDocument();
    expect(container.querySelectorAll(".campaign-node")).toHaveLength(6);
  });
});
