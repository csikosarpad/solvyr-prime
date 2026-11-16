import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { App } from "./App";
import { useGameStore } from "@/game/state/gameStore";
import { useMultiplayerStore } from "@/game/state/multiplayerStore";
import { useVeyloraStore } from "@/game/state/veyloraStore";

vi.mock("@/ui/GameCanvas", () => ({ GameCanvas: () => null }));
vi.mock("@/ui/result/ResultDecorCanvas", () => ({ ResultDecorCanvas: () => null }));
vi.mock("@/ui/CampaignStarfieldCanvas", () => ({ CampaignStarfieldCanvas: () => null }));

describe("welcome screen", () => {
  beforeEach(() => {
    vi.stubGlobal("indexedDB", new IDBFactory());
    useMultiplayerStore.getState().leave();
    useGameStore.setState({ screen: "menu", workshopOrigin: "menu", profiles: {} });
  });

  it("opens the functional main menu and keeps it open when returning from another screen", async () => {
    const app = render(<App />);
    expect(screen.getByRole("heading", { name: "Solvyr Prime: Siege Protocol" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Fejlesztés" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "START" }));
    expect(screen.getByRole("heading", { name: "Solvyr Prime: Siege Protocol" })).toHaveFocus();
    expect(screen.getByRole("button", { name: "Műveleti térkép" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Online játék" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Fejlesztés" }));
    await waitFor(() => expect(useVeyloraStore.getState().pending).toBe(0));
    fireEvent.click(screen.getByRole("button", { name: "Vissza" }));
    expect(screen.getByRole("button", { name: "Fejlesztés" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "START" })).not.toBeInTheDocument();
    act(() => useGameStore.getState().setScreen("campaignMap"));
    await waitFor(() => expect(useVeyloraStore.getState().pending).toBe(0));
    act(() => useGameStore.getState().setScreen("menu"));
    expect(screen.getByRole("button", { name: "Fejlesztés" })).toBeInTheDocument();
    app.unmount();
    render(<App />);
    expect(screen.getByRole("button", { name: "START" })).toBeInTheDocument();
  });

  it("az M billentyű minden képernyőn némítást vált, de szövegmezőben gépelve nem", () => {
    useGameStore.setState({ muted: false });
    render(<App />);
    // Már a belépőképernyőn is működik.
    fireEvent.keyDown(window, { key: "m" });
    expect(useGameStore.getState().muted).toBe(true);
    fireEvent.keyDown(window, { key: "M" });
    expect(useGameStore.getState().muted).toBe(false);
    fireEvent.keyDown(window, { key: "m", repeat: true });
    expect(useGameStore.getState().muted).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "START" }));
    fireEvent.click(screen.getByRole("button", { name: "Beállítások" }));
    const nameInput = screen.getByLabelText("P1 neve");
    fireEvent.keyDown(nameInput, { key: "m" });
    expect(useGameStore.getState().muted).toBe(false);
    fireEvent.keyDown(window, { key: "m" });
    expect(useGameStore.getState().muted).toBe(true);
  });
});
