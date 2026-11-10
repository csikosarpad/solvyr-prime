import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCommandStore } from "@/game/state/commandStore";
import { useLocaleStore } from "@/i18n";
import { CommandConsole } from "./CommandConsole";

describe("structure messages in the command console", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useLocaleStore.getState().setLocale("hu");
    useCommandStore.getState().clear();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    useLocaleStore.getState().setLocale("hu");
    useCommandStore.getState().clear();
  });

  it("types building damage and destruction into the visible combat log", () => {
    render(<CommandConsole />);
    act(() => {
      useCommandStore
        .getState()
        .log("command.ENERGY_NODEDamaged", { source: "AI (P2)", damage: 60, hp: 40, maxHp: 100 }, "warning");
    });
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByRole("log")).toHaveTextContent("AI (P2): energiareaktor sérült, −60 HP (40/100)");
    act(() => {
      useCommandStore
        .getState()
        .log("command.CIVIL_HABITATDestroyed", { source: "P1", damage: 40, hp: 0, maxHp: 100 }, "critical");
    });
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByRole("log")).toHaveTextContent("P1: civil telep megsemmisült, −40 HP (0/100)");
    act(() => useLocaleStore.getState().setLocale("en"));
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByRole("log")).toHaveTextContent("P1: civil habitat destroyed");
    expect(screen.getByRole("log")).toHaveTextContent("AI (P2): energy reactor damaged");
  });
});
