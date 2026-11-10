import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRAINING_SECTOR, sectorById } from "@/game/data/sectors";
import { useGameStore } from "@/game/state/gameStore";
import { useLocaleStore } from "@/i18n";
import { Hud } from "./Hud";
import { SectorBriefing } from "./SectorBriefing";
import { BRIEFING_STORAGE_KEY, useBriefingPreferences } from "@/game/state/briefingPreferences";

describe("Sector briefing", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.removeItem(BRIEFING_STORAGE_KEY);
    useBriefingPreferences.setState({ hiddenSectorIds: [], error: null });
    useLocaleStore.getState().setLocale("hu");
    useGameStore.setState({
      matchSequence: 0,
      phase: "aiming",
      tanks: [],
      canControl: true,
      sector: TRAINING_SECTOR,
      matchMode: "skirmish",
      strategicObjectives: [],
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    useLocaleStore.getState().setLocale("hu");
    useGameStore.setState({ matchSequence: 0 });
    useBriefingPreferences.setState({ hiddenSectorIds: [], error: null });
    vi.restoreAllMocks();
  });

  it("stays visible until acknowledged, without saving an unchecked preference", () => {
    render(<SectorBriefing />);
    expect(screen.getByRole("status", { name: "Szektor eligazítás" })).toHaveTextContent("SECTOR BRIEFING");
    expect(screen.getByText(TRAINING_SECTOR.code)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: TRAINING_SECTOR.name })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(60000));
    expect(screen.getByRole("status", { name: "Szektor eligazítás" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Értettem" }));
    expect(screen.queryByRole("status", { name: "Szektor eligazítás" })).not.toBeInTheDocument();
    expect(localStorage.getItem(BRIEFING_STORAGE_KEY)).toBeNull();
  });

  it("localizes the controls without dismissing or clearing the checkbox", () => {
    render(<SectorBriefing />);
    fireEvent.click(screen.getByRole("checkbox"));
    act(() => {
      vi.advanceTimersByTime(1000);
      useLocaleStore.getState().setLocale("de");
    });
    expect(screen.getByRole("status", { name: "Sektoreinweisung" })).toHaveTextContent("Übungsgelände");
    expect(screen.getByRole("heading", { name: TRAINING_SECTOR.name })).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Verstanden" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("does not create an auto-dismiss timer", () => {
    const before = vi.getTimerCount();
    const { unmount } = render(<SectorBriefing />);
    expect(vi.getTimerCount()).toBe(before);
    unmount();
    expect(vi.getTimerCount()).toBe(before);
  });

  it("uses the selected battle's briefing rather than the training text", () => {
    useGameStore.setState({ sector: sectorById("delta-08") });
    render(<SectorBriefing />);
    expect(screen.getByRole("heading", { name: "Crystal Basin" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Mély központi medence");
  });

  it("csak elkészült meccsnél jelenik meg, új meccsnél megismétlődik, körváltáskor nem", () => {
    render(<Hud />);
    expect(screen.queryByRole("status", { name: "Szektor eligazítás" })).not.toBeInTheDocument();
    act(() => useGameStore.getState().sync({ matchSequence: 1 }));
    expect(screen.getByRole("status", { name: "Szektor eligazítás" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Értettem" }));
    act(() => useGameStore.getState().sync({ currentId: "P2", wind: 35, phase: "flying" }));
    expect(screen.queryByRole("status", { name: "Szektor eligazítás" })).not.toBeInTheDocument();
    expect(screen.getByText(TRAINING_SECTOR.name)).toBeInTheDocument();
    act(() => useGameStore.getState().sync({ matchSequence: 2, phase: "aiming" }));
    expect(screen.getByRole("status", { name: "Szektor eligazítás" })).toBeInTheDocument();
    expect(useGameStore.getState().canControl).toBe(true);
  });

  it("persists suppression only for the acknowledged sector across modes and remounts", () => {
    const { unmount } = render(<SectorBriefing />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(useBriefingPreferences.getState().hiddenSectorIds).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "Értettem" }));
    expect(JSON.parse(localStorage.getItem(BRIEFING_STORAGE_KEY)!)).toEqual({
      version: 1,
      hiddenSectorIds: ["alpha-01"],
    });
    unmount();
    useGameStore.setState({ matchMode: "campaign" });
    const next = render(<SectorBriefing />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    next.unmount();
    useGameStore.setState({ sector: sectorById("delta-08") });
    render(<SectorBriefing />);
    expect(screen.getByRole("status")).toHaveTextContent("Crystal Basin");
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("shows a write error and lets the player retry or close without suppression", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("quota");
    });
    render(<SectorBriefing />);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Értettem" }));
    expect(screen.getByRole("alert")).toHaveTextContent("mentése sikertelen");
    expect(useBriefingPreferences.getState().hiddenSectorIds).toEqual([]);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Értettem" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("does not let checkbox/button keyboard events reach battle hotkeys", () => {
    const keydown = vi.fn();
    window.addEventListener("keydown", keydown);
    try {
      render(<SectorBriefing />);
      fireEvent.keyDown(screen.getByRole("checkbox"), { key: " " });
      fireEvent.keyDown(screen.getByRole("button", { name: "Értettem" }), { key: "Enter" });
      expect(keydown).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener("keydown", keydown);
    }
  });
});
