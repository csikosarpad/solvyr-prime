import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Game } from "@/game/engine/Game";
import { useGameStore } from "@/game/state/gameStore";
import { gameRef } from "./gameRef";
import { Hud } from "./Hud";
import { useMultiplayerStore } from "@/game/state/multiplayerStore";

const power = () => useGameStore.getState().power;
const angle = () => useGameStore.getState().angle;

describe("Hud billentyűk", () => {
  beforeEach(() => {
    useMultiplayerStore.setState({ credentials: null });
    useGameStore.setState({
      phase: "aiming",
      canControl: true,
      power: 400,
      maxPower: 600,
      angle: 45,
      currentId: "P1",
      tanks: [],
      screen: "playing",
      matchMode: "skirmish",
    });
    render(<Hud />);
  });

  afterEach(() => vi.restoreAllMocks());

  it.each(["skirmish", "campaign"] as const)("Escape megnyitja a főmenü megerősítését lövés közben is: %s", (matchMode) => {
    const leaveBattle = vi.fn();
    gameRef.current = { leaveBattle } as unknown as Game;
    act(() => useGameStore.setState({ matchMode, phase: "flying", canControl: false }));
    fireEvent.keyDown(window, { key: "Escape", repeat: true });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(leaveBattle).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Bevetés megszakítása" }));
    expect(leaveBattle).toHaveBeenCalledOnce();
    expect(useGameStore.getState().screen).toBe("menu");
  });

  it.each(["skirmish", "campaign"] as const)("csak jóváhagyás után lép a főmenübe: %s", (matchMode) => {
    const leaveBattle = vi.fn();
    const fire = vi.fn();
    gameRef.current = { leaveBattle, fire } as unknown as Game;
    act(() => useGameStore.setState({ matchMode }));
    fireEvent.click(screen.getByRole("button", { name: "Főmenü" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("ebben a menetben gyűjtött XP elvész");
    fireEvent.keyDown(window, { key: " " });
    expect(fire).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Harc folytatása" }));
    expect(leaveBattle).not.toHaveBeenCalled();
    expect(useGameStore.getState().screen).toBe("playing");
    fireEvent.click(screen.getByRole("button", { name: "Főmenü" }));
    fireEvent.click(screen.getByRole("button", { name: "Bevetés megszakítása" }));
    expect(leaveBattle).toHaveBeenCalledOnce();
    expect(useGameStore.getState().screen).toBe("menu");
  });

  it("Escape esetén nem lép ki, és a kampánytérképhez is megerősítést kér", () => {
    const leaveBattle = vi.fn();
    gameRef.current = { leaveBattle } as unknown as Game;
    act(() => useGameStore.setState({ matchMode: "campaign", phase: "flying", canControl: false }));
    fireEvent.click(screen.getByRole("button", { name: "Főmenü" }));
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { bubbles: true, cancelable: true }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(leaveBattle).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Vissza a térképre" }));
    fireEvent.click(screen.getByRole("button", { name: "Bevetés megszakítása" }));
    expect(useGameStore.getState().screen).toBe("campaignMap");
  });

  it("online nem kínálja fel a helyi csata megszakítását", () => {
    act(() => useMultiplayerStore.setState({
      credentials: { roomCode: "room", playerId: "P1", token: "test" },
    }));
    expect(screen.queryByRole("button", { name: "Főmenü" })).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("fel/le nyíl 10-zel változtatja az erőt, Shift-tel 50-nel", () => {
    fireEvent.keyDown(window, { key: "ArrowUp" });
    expect(power()).toBe(410);
    fireEvent.keyDown(window, { key: "ArrowDown", shiftKey: true });
    expect(power()).toBe(360);
  });

  it("az erő a [100, maxPower] tartományban marad", () => {
    act(() => useGameStore.setState({ power: 590 }));
    fireEvent.keyDown(window, { key: "ArrowUp", shiftKey: true });
    expect(power()).toBe(600);
    act(() => useGameStore.setState({ power: 120 }));
    fireEvent.keyDown(window, { key: "ArrowDown", shiftKey: true });
    expect(power()).toBe(100);
  });

  it("lövés közben nem változik az erő", () => {
    act(() => useGameStore.setState({ phase: "flying" }));
    fireEvent.keyDown(window, { key: "ArrowUp" });
    expect(power()).toBe(400);
  });

  it("Ctrl+bal/jobb a szöget állítja, és nem mozgatja a tankot", () => {
    const move = vi.fn();
    gameRef.current = { move } as unknown as Game;
    fireEvent.keyDown(window, { key: "ArrowLeft", ctrlKey: true });
    expect(angle()).toBe(46);
    fireEvent.keyDown(window, { key: "ArrowRight", ctrlKey: true, shiftKey: true });
    expect(angle()).toBe(41);
    expect(move).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(move).toHaveBeenCalledWith(-1);
    expect(angle()).toBe(41);
  });

  it("a ± gombok 1° / 10 erő lépést adnak, zárolva tiltottak", () => {
    fireEvent.click(screen.getByRole("button", { name: "Tűzszög növelése" }));
    fireEvent.click(screen.getByRole("button", { name: "Töltet csökkentése" }));
    expect(angle()).toBe(46);
    expect(power()).toBe(390);
    act(() => useGameStore.setState({ phase: "flying" }));
    expect(screen.getByRole("button", { name: "Tűzszög csökkentése" })).toBeDisabled();
  });

  it("a nyomva tartott gomb ismétel", () => {
    vi.useFakeTimers();
    try {
      const button = screen.getByRole("button", { name: "Töltet növelése" });
      fireEvent.pointerDown(button, { button: 0 });
      expect(power()).toBe(410);
      act(() => {
        vi.advanceTimersByTime(350 + 90 * 2);
      });
      expect(power()).toBe(440);
      fireEvent.pointerUp(button);
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(power()).toBe(440);
    } finally {
      vi.useRealTimers();
    }
  });

  it("a T billentyű röppálya-előnézetet kér, ha még elérhető", () => {
    const requestPreview = vi.fn();
    gameRef.current = { requestPreview } as unknown as Game;
    fireEvent.keyDown(window, { key: "t" });
    expect(requestPreview).toHaveBeenCalledOnce();
  });

  it("az elhasznált előnézet gombja tiltott", () => {
    act(() => useGameStore.setState({ previewAvailable: false }));
    expect(screen.getByRole("button", { name: /felhasználva/i })).toBeDisabled();
  });

  it("az aktív tűzvezetés gombja további töltetek mellett is tiltott", () => {
    const requestPreview = vi.fn();
    gameRef.current = { requestPreview } as unknown as Game;
    act(() => useGameStore.setState({ previewActive: true, previewAvailable: true, previewRemaining: 3 }));
    const button = screen.getByRole("button", { name: "Tűzvezető rendszer aktív" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(button);
    expect(requestPreview).not.toHaveBeenCalled();
    act(() => useGameStore.setState({ previewActive: false }));
  });

  it("az átrendezett action bar minden meglévő műveletet elérhetővé tesz", () => {
    const move = vi.fn();
    const fire = vi.fn();
    const requestPreview = vi.fn();
    gameRef.current = { move, fire, requestPreview } as unknown as Game;
    act(() => useGameStore.setState({ previewAvailable: true, previewRemaining: 1, muted: false }));

    fireEvent.click(screen.getByRole("button", { name: "Átcsoportosítás balra" }));
    fireEvent.click(screen.getByRole("button", { name: "Átcsoportosítás jobbra" }));
    fireEvent.click(screen.getByRole("button", { name: /Tűzvezetés/i }));
    fireEvent.click(screen.getByRole("button", { name: "TÜZET!" }));
    fireEvent.click(screen.getByRole("button", { name: "Kommunikáció: aktív (M)" }));

    expect(move.mock.calls).toEqual([[-1], [1]]);
    expect(requestPreview).toHaveBeenCalledOnce();
    expect(fire).toHaveBeenCalledOnce();
    expect(useGameStore.getState().muted).toBe(true);
  });

  it("a HUD külön csíkot mutat a HP-nak, a pajzsnak és a páncélnak, ha vannak", () => {
    act(() =>
      useGameStore.setState({
        tanks: [
          {
            id: "P1",
            hp: 80,
            maxHp: 100,
            shield: 12,
            maxShield: 40,
            armor: 15,
            maxArmor: 60,
            moveLeft: 0,
            color: 0xffffff,
          },
          {
            id: "P2",
            hp: 100,
            maxHp: 100,
            shield: 0,
            maxShield: 0,
            armor: 0,
            maxArmor: 0,
            moveLeft: 0,
            color: 0xffffff,
          },
        ],
      }),
    );
    expect(screen.getByRole("region", { name: "P1" })).toHaveTextContent("P1");
    expect(screen.getByRole("region", { name: "P1" })).toHaveTextContent("80/100 HP");
    const meters = screen.getAllByRole("meter");
    // P1: HP + pajzs + páncél, P2: csak HP.
    expect(meters).toHaveLength(4);
    const shield = screen.getByRole("meter", { name: "Energiapajzs" });
    expect(shield).toHaveAttribute("aria-valuenow", "12");
    expect(shield).toHaveAttribute("aria-valuemax", "40");
    expect(screen.getByRole("meter", { name: "Páncélzat" })).toHaveAttribute("aria-valuetext", "15/60");
  });

  it("a játékosszín jelenik meg mindkét panelen, és a HP-csík a HP-értékhez igazodik", () => {
    act(() =>
      useGameStore.setState({
        tanks: [
          {
            id: "P1",
            hp: 75,
            maxHp: 100,
            shield: 0,
            maxShield: 0,
            armor: 0,
            maxArmor: 0,
            moveLeft: 0,
            color: 0x54d994,
          },
          {
            id: "P2",
            hp: 25,
            maxHp: 100,
            shield: 0,
            maxShield: 0,
            armor: 0,
            maxArmor: 0,
            moveLeft: 0,
            color: 0xc98bff,
          },
        ],
      }),
    );

    const p1 = screen.getByRole("region", { name: "P1" });
    const p2 = screen.getByRole("region", { name: "P2" });
    expect(p1.style.getPropertyValue("--unit-accent")).toBe("#54d994");
    expect(p2.style.getPropertyValue("--unit-accent")).toBe("#c98bff");
    expect(p1.querySelector(".hud-health-fill")).toHaveStyle({ width: "75%" });
    expect(p2.querySelector(".hud-health-fill")).toHaveStyle({ width: "25%" });
  });

  it("a lövedék repülése alatt a nyilak és a mozgásgombok kitérést hívnak, ha van keret", () => {
    const move = vi.fn();
    gameRef.current = { move } as unknown as Game;
    act(() => useGameStore.setState({ phase: "flying", canControl: false, canDodge: true }));
    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(move.mock.calls).toEqual([[1], [-1]]);
    expect(screen.getByRole("button", { name: "Átcsoportosítás balra" })).toBeEnabled();
    // Ctrl+nyíl (szögállítás) kitéréskor nem mozgat.
    fireEvent.keyDown(window, { key: "ArrowRight", ctrlKey: true });
    expect(move).toHaveBeenCalledTimes(2);
    act(() => useGameStore.setState({ canDodge: false }));
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(move).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "Átcsoportosítás balra" })).toBeDisabled();
  });

  it("a fegyverválasztó gombbal és számbillentyűvel vált, egyetlen fegyvernél rejtett", () => {
    const selectWeapon = vi.fn();
    gameRef.current = { selectWeapon } as unknown as Game;
    act(() =>
      useGameStore.setState({
        phase: "aiming",
        canControl: true,
        weapon: "standard",
        weaponOptions: ["standard", "laser"],
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Lézer/ }));
    expect(selectWeapon).toHaveBeenCalledWith("laser");
    fireEvent.keyDown(window, { key: "2" });
    expect(selectWeapon).toHaveBeenCalledTimes(2);
    expect(selectWeapon).toHaveBeenLastCalledWith("laser");
    // Nem létező sorszám nem vált.
    fireEvent.keyDown(window, { key: "5" });
    expect(selectWeapon).toHaveBeenCalledTimes(2);
    act(() => useGameStore.setState({ weaponOptions: ["standard"] }));
    expect(screen.queryByRole("group", { name: "Fegyver" })).toBeNull();
  });

  it("a szög a [0, 180] tartományban marad", () => {
    act(() => useGameStore.setState({ angle: 2 }));
    fireEvent.keyDown(window, { key: "ArrowRight", ctrlKey: true, shiftKey: true });
    expect(angle()).toBe(0);
    act(() => useGameStore.setState({ angle: 178 }));
    fireEvent.keyDown(window, { key: "ArrowLeft", ctrlKey: true, shiftKey: true });
    expect(angle()).toBe(180);
  });

  it("a szélindikátor az előjelet iránnyal, az erősséget abszolút értékkel mutatja", () => {
    act(() => useGameStore.setState({ wind: -42 }));
    expect(screen.getByRole("status", { name: "Légköri szél: -42" })).toHaveTextContent("←");
    expect(screen.getByRole("status", { name: "Légköri szél: -42" })).toHaveTextContent("42");

    act(() => useGameStore.setState({ wind: 0 }));
    expect(screen.getByRole("status", { name: "Légköri szél: 0" })).toHaveTextContent("—");
  });
});
