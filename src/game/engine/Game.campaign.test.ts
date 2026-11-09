import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Game } from "./Game";
import { TerrainMask } from "../terrain/mask";
import { useGameStore } from "../state/gameStore";
import { useCampaignStore } from "../state/campaignStore";
import { useAiSettings } from "../state/aiSettings";
import { useMultiplayerStore } from "../state/multiplayerStore";
import { tankContains, type Tank } from "../entities/tank";
import { TRAINING_SECTOR, sectorById } from "../data/sectors";
import { loadProfiles, saveProfiles } from "../systems/profileStorage";
import { Texture } from "pixi.js";
import { GlowFilter } from "pixi-filters";
import type { PlacedStrategicObjective } from "../systems/strategicObjectives";
import { useCommandStore } from "../state/commandStore";
import { useVeyloraStore } from "../state/veyloraStore";

vi.hoisted(() => {
  HTMLCanvasElement.prototype.getContext = () => null;
});

describe("Game campaign lifecycle", () => {
  let game: Game;

  beforeEach(() => {
    vi.useFakeTimers();
    useMultiplayerStore.getState().leave();
    useCampaignStore.getState().reset();
    useVeyloraStore.getState().reset();
    useAiSettings.getState().setEnabled(false);
    useGameStore.setState({ screen: "playing", muted: true, sector: TRAINING_SECTOR, campaignNewRoutes: [],
      matchMode: "skirmish", campaignMission: null, missionSuccess: null, opponentSkill: null });
    game = new Game();
    Reflect.set(game, "terrain", {
      mask: TerrainMask.fromHeightmap(new Array(1280).fill(550), 720),
      build: vi.fn(),
      carve: vi.fn(),
    });
    vi.spyOn(Reflect.get(game, "battlefieldLayers"), "draw").mockImplementation(() => {});
  });

  afterEach(() => {
    game.destroy();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const endBattle = (winner: "P1" | "P2" | null) => {
    game.restart({ seed: 42, starterIndex: 0 });
    const tanks: Tank[] = Reflect.get(game, "tanks");
    tanks[1]!.hp = winner === "P2" ? 100 : 0;
    tanks[0]!.hp = winner === "P1" ? 100 : 0;
    game.fire();
    Reflect.get(game, "explode").call(game, 640, 100);
  };

  const startForge = (starterIndex = 0) => {
    useCampaignStore.getState().complete("alpha-01");
    expect(game.startCampaign("forge-17")).toBe(true);
    game.restart({ seed: 42, starterIndex });
  };

  it("starts fixed VEYLORA opponents independently of P2 profile and AI memory", () => {
    Reflect.get(game, "profiles").P2.levels = { armor: 5, shield: 5, warhead: 5 };
    useAiSettings.setState({ memory: { matches: 999, wins: 999, shots: 999, hits: 999 } });
    expect(game.startOperation("secure-mine")).toBe(true);
    expect(useGameStore.getState()).toMatchObject({ matchMode: "operation", aiActive: true, opponentSkill: 0.35 });
    expect(Reflect.get(game, "tanks")[1].stats).toMatchObject({ maxArmor: 0, maxEnergyShield: 0, damage: 1 });
    expect(game.startOperation("secure-lab")).toBe(true);
    expect(Reflect.get(game, "tanks")[1].stats.maxArmor).toBe(20);
    expect(useGameStore.getState().opponentSkill).toBe(0.55);
    expect(useGameStore.getState().strategicObjectives[0]?.type).toBe("RESEARCH_LAB");
    game.startOffline();
    expect(useGameStore.getState()).toMatchObject({ matchMode: "skirmish", campaignMission: null, opponentSkill: null });
  });

  it.each([
    ["P1", 100, true], ["P1", 20, true], ["P1", 19.99, false],
    ["P2", 100, false], [null, 100, false],
  ] as const)("separates research mission success from battle result: %s / %s HP", (winner, hp, success) => {
    expect(game.startOperation("secure-lab")).toBe(true);
    game.restart({ seed: 42, starterIndex: 0 });
    const memory = structuredClone(useAiSettings.getState().memory);
    const p2 = structuredClone(Reflect.get(game, "profiles").P2);
    const objectives: PlacedStrategicObjective[] = Reflect.get(game, "strategicObjectives");
    objectives[0] = { ...objectives[0]!, hp };
    const tanks: Tank[] = Reflect.get(game, "tanks");
    tanks[0]!.hp = winner === "P1" ? 100 : 0;
    tanks[1]!.hp = winner === "P2" ? 100 : 0;
    game.fire();
    Reflect.get(game, "explode").call(game, 640, 100);
    expect(useGameStore.getState()).toMatchObject({ winner, missionSuccess: success });
    expect(useVeyloraStore.getState().completedMissionIds).toEqual(success ? ["secure-lab"] : []);
    expect(useCampaignStore.getState().completedIds).toEqual([]);
    expect(useAiSettings.getState().memory).toEqual(memory);
    expect(Reflect.get(game, "profiles").P2).toEqual(p2);
    if (winner === "P1") expect(useGameStore.getState().matchStats.P1?.xp).toBeGreaterThanOrEqual(50);
    game.restart({ seed: 42, starterIndex: 0 });
    expect(useGameStore.getState().strategicObjectives[0]?.hp).toBe(100);
    expect(useGameStore.getState().missionSuccess).toBeNull();
  });

  it("completes only the mine after a VEYLORA mine victory and leaves legacy progress untouched", () => {
    game.startOperation("secure-mine");
    endBattle("P1");
    expect(useGameStore.getState().missionSuccess).toBe(true);
    expect(useVeyloraStore.getState().completedMissionIds).toEqual(["secure-mine"]);
    expect(useCampaignStore.getState().completedIds).toEqual([]);
  });

  it("blocks VEYLORA start before terrain readiness", () => {
    Reflect.set(game, "terrain", null);
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(game.startOperation("secure-mine")).toBe(false);
    expect(useGameStore.getState().matchMode).not.toBe("operation");
  });

  it("does not start a match if mission selection cannot be saved", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => { throw new Error("quota"); });
    expect(game.startOperation("secure-mine")).toBe(false);
    expect(useGameStore.getState().matchMode).toBe("skirmish");
  });

  it("places the two Forge objectives on the terrain and exposes their HP", () => {
    startForge();
    expect(useGameStore.getState().strategicObjectives).toEqual([
      { id: "energy-node-01", type: "ENERGY_NODE", worldX: expect.any(Number), worldY: 550, width: 48, height: 44, hp: 100, maxHp: 100, playerCausedDamage: 0 },
      { id: "civil-habitat-01", type: "CIVIL_HABITAT", worldX: expect.any(Number), worldY: 550, width: 64, height: 32, hp: 100, maxHp: 100, playerCausedDamage: 0 },
    ]);
    game.startOffline();
    expect(useGameStore.getState().strategicObjectives).toEqual([]);
    expect(Reflect.get(game, "strategicObjectives")).toEqual([]);
  });

  it("does not spawn Forge buildings in other campaign sectors", () => {
    game.startCampaign();
    expect(useGameStore.getState().strategicObjectives).toEqual([]);
  });

  it("does not change seeded weather when randomizing objective positions", () => {
    game.startCampaign();
    game.restart({ seed: 42, starterIndex: 0 });
    const wind = useGameStore.getState().wind;
    startForge();
    expect(useGameStore.getState().wind).toBe(wind);
  });

  it.each([0, 1])("attributes only player-caused building damage (starter %s)", (starterIndex) => {
    startForge(starterIndex);
    const objective = useGameStore.getState().strategicObjectives[0]!;
    Reflect.get(game, "launchShot").call(game, 90, 100);
    Reflect.get(game, "explode").call(game, objective.worldX, objective.worldY - objective.height / 2);
    expect(useGameStore.getState().strategicObjectives[0]).toMatchObject({
      hp: 40, playerCausedDamage: starterIndex === 0 ? 60 : 0,
    });
    expect(useGameStore.getState().strategicObjectives[1]?.hp).toBe(100);
    expect(useGameStore.getState().matchStats.P1?.damage).toBe(0);
    expect(useGameStore.getState().matchStats.P2?.damage).toBe(0);
    expect(useCommandStore.getState().messages).toEqual(expect.arrayContaining([
      expect.objectContaining({
        key: "command.ENERGY_NODEDamaged",
        tone: "warning",
        params: expect.objectContaining({ damage: 60, hp: 40, maxHp: 100 }),
      }),
    ]));
    expect(useCommandStore.getState().messages.at(-1)?.params?.source).toContain(starterIndex === 0 ? "P1" : "AI");
  });

  it("uses the pre-crater center for damage then settles without fall damage", () => {
    startForge();
    const terrain = Reflect.get(game, "terrain");
    terrain.carve.mockImplementation(() => {
      terrain.mask = TerrainMask.fromHeightmap(new Array(1280).fill(700), 720);
    });
    game.fire();
    const objective = useGameStore.getState().strategicObjectives[0]!;
    Reflect.get(game, "explode").call(game, objective.worldX, objective.worldY - objective.height / 2);
    expect(useGameStore.getState().strategicObjectives[0]).toMatchObject({ worldY: 700, hp: 40, playerCausedDamage: 60 });
    expect(useGameStore.getState().strategicObjectives[1]).toMatchObject({ worldY: 700, hp: 100, playerCausedDamage: 0 });
  });

  it("leaves a shell passing through an objective unaffected until an existing collision explodes", () => {
    startForge();
    game.fire();
    const objective = useGameStore.getState().strategicObjectives[0]!;
    Reflect.set(game, "shell", { pos: { x: objective.worldX, y: objective.worldY - objective.height / 2 }, vel: { x: 0, y: 0 } });
    Reflect.get(game, "stepShell").call(game);
    expect(Reflect.get(game, "terrain").carve).not.toHaveBeenCalled();
    expect(useGameStore.getState().strategicObjectives[0]?.hp).toBe(100);
    expect(Reflect.get(game, "shell")).not.toBeNull();
  });

  it("keeps ruins on the terrain without further HP or player-damage changes", () => {
    startForge();
    const objectives: PlacedStrategicObjective[] = Reflect.get(game, "strategicObjectives");
    objectives[0] = { ...objectives[0]!, hp: 15, playerCausedDamage: 85 };
    game.fire();
    const objective = objectives[0];
    Reflect.get(game, "explode").call(game, objective.worldX, objective.worldY - objective.height / 2);
    expect(useGameStore.getState().strategicObjectives[0]).toMatchObject({ hp: 15, playerCausedDamage: 85 });
    expect(useCommandStore.getState().messages.some((message) => message.key === "command.ENERGY_NODEDestroyed")).toBe(false);
  });

  it("spawns Prime objectives after the mandatory Forge route and varies positions between match seeds", () => {
    startForge();
    useCampaignStore.getState().complete("forge-17");
    useCampaignStore.getState().complete("vanguard-12");
    expect(game.startCampaign("prime-00")).toBe(true);
    game.restart({ seed: 42, starterIndex: 0 });
    const first = useGameStore.getState().strategicObjectives;
    expect(first.map((objective) => objective.id)).toEqual(["prime-energy-node-01", "prime-civil-habitat-01"]);
    game.restart({ seed: 43, starterIndex: 0 });
    expect(useGameStore.getState().strategicObjectives.map((objective) => objective.worldX))
      .not.toEqual(first.map((objective) => objective.worldX));
    game.restart({ seed: 42, starterIndex: 0 });
    expect(useGameStore.getState().strategicObjectives).toEqual(first);
  });

  it.each(["energy-node-01", "civil-habitat-01"])("logs destruction once and does not log more damage to a ruin: %s", (id) => {
    startForge();
    const objectives: PlacedStrategicObjective[] = Reflect.get(game, "strategicObjectives");
    const index = objectives.findIndex((objective) => objective.id === id);
    objectives[index] = { ...objectives[index]!, hp: 40, playerCausedDamage: 60 };
    const objective = objectives[index]!;
    game.fire();
    Reflect.get(game, "explode").call(game, objective.worldX, objective.worldY - objective.height / 2);
    const key = `command.${objective.type}Destroyed`;
    expect(useCommandStore.getState().messages.filter((message) => message.key === key)).toHaveLength(1);
    Reflect.get(game, "launchShot").call(game, 90, 100);
    Reflect.get(game, "explode").call(game, objective.worldX, objective.worldY - objective.height / 2);
    expect(useCommandStore.getState().messages.filter((message) => message.key === key)).toHaveLength(1);
  });
  it.each([false, true])("adds team-colored glow and releases filters on restart (touch: %s)", (touch) => {
    vi.stubGlobal("matchMedia", () => ({ matches: touch }));
    try {
      Reflect.set(game, "tankTextures", { body: Texture.EMPTY, barrel: Texture.EMPTY });
      game.startOffline();
      const layer = Reflect.get(game, "tankLayer");
      const glows: GlowFilter[] = layer.children.map((root: { filters: GlowFilter[] }) => root.filters[0]);
      expect(glows).toHaveLength(2);
      const tanks: Tank[] = Reflect.get(game, "tanks");
      glows.forEach((glow, i) => {
        expect(glow).toBeInstanceOf(GlowFilter);
        expect(glow.color).toBe(tanks[i]!.color);
        expect(glow.distance).toBe(touch ? 3 : 4);
      });
      const destroyed = glows.map((glow) => vi.spyOn(glow, "destroy"));
      game.restart();
      destroyed.forEach((destroy) => expect(destroy).toHaveBeenCalledOnce());
      expect(layer.children).toHaveLength(2);
      const finalDestroyed = layer.children.map((root: { filters: GlowFilter[] }) =>
        vi.spyOn(root.filters[0]!, "destroy"),
      );
      game.destroy();
      finalDestroyed.forEach((destroy: ReturnType<typeof vi.spyOn>) => expect(destroy).toHaveBeenCalledOnce());
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it.each([-60, 0, 60])("fires an actual direct hit with AI assistance in wind %s", (wind) => {
    game.startCampaign();
    game.restart({ seed: 42, starterIndex: 1 });
    const tanks: Tank[] = Reflect.get(game, "tanks");
    const target = tanks[0]!;
    const shooter = tanks[1]!;
    target.x = 120;
    shooter.x = 450;
    useGameStore.setState({ wind });
    vi.spyOn(Math, "random").mockReturnValue(0);
    Reflect.get(game, "aiAimAndFire").call(game);
    expect(useGameStore.getState()).toMatchObject({ previewActive: true, previewRemaining: 0 });
    vi.advanceTimersByTime(700);
    expect(useGameStore.getState().phase).toBe("flying");
    for (let i = 0; i < 900 && Reflect.get(game, "shell"); i++) {
      Reflect.get(game, "stepShell").call(game);
    }
    const [impactX, impactY] = Reflect.get(game, "terrain").carve.mock.calls[0];
    expect(tankContains(target, impactX, impactY)).toBe(true);
    expect(target.hp).toBeLessThan(100);
    expect(shooter.hp).toBe(100);
  });

  it("does not consume AI assistance when no direct hit is possible", () => {
    game.startCampaign();
    game.restart({ seed: 42, starterIndex: 1 });
    const tanks: Tank[] = Reflect.get(game, "tanks");
    tanks[1]!.stats = { ...tanks[1]!.stats, maxPower: 100 };
    useGameStore.setState({ wind: 0 });
    vi.spyOn(Math, "random").mockReturnValue(0);
    Reflect.get(game, "aiAimAndFire").call(game);
    expect(useGameStore.getState()).toMatchObject({ previewActive: false, previewRemaining: 1 });
    vi.advanceTimersByTime(700);
    expect(useGameStore.getState().phase).toBe("flying");
  });

  it.each(["skirmish", "campaign"] as const)("consumes only one preview charge while already active: %s", (mode) => {
    game.startOffline(mode);
    game.restart({ seed: 42, starterIndex: 0 });
    Reflect.get(game, "previewAllowance").reset({ P1: 3, P2: 3 });
    game.requestPreview();
    expect(useGameStore.getState()).toMatchObject({
      previewActive: true, previewAvailable: false, previewRemaining: 2,
    });
    for (let i = 0; i < 10; i++) game.requestPreview();
    expect(useGameStore.getState().previewRemaining).toBe(2);
    Reflect.get(game, "beginTurn").call(game);
    expect(useGameStore.getState()).toMatchObject({ previewActive: false, previewAvailable: true });
    game.requestPreview();
    expect(useGameStore.getState().previewRemaining).toBe(1);
    Reflect.get(game, "beginTurn").call(game);
    game.requestPreview();
    game.requestPreview();
    expect(useGameStore.getState()).toMatchObject({ previewActive: true, previewRemaining: 0 });
    Reflect.get(game, "beginTurn").call(game);
    game.requestPreview();
    expect(useGameStore.getState()).toMatchObject({ previewActive: false, previewAvailable: false, previewRemaining: 0 });
  });

  it.each(["skirmish", "campaign"] as const)("keeps purchased preview charges available across real shots: %s", (mode) => {
    game.startOffline(mode);
    endBattle("P1");
    Reflect.get(game, "profiles").P1.xp = 1000;
    for (let i = 0; i < 3; i++) game.buy("P1", "smartAim");
    expect(useGameStore.getState().profiles.P1?.levels.smartAim).toBe(3);
    game.restart({ seed: 42, starterIndex: 0 });
    const tanks: Tank[] = Reflect.get(game, "tanks");
    tanks.forEach((tank) => { tank.hp = 1000; });
    expect(useGameStore.getState().previewRemaining).toBe(4);
    for (let remaining = 3; remaining >= 0; remaining--) {
      expect(useGameStore.getState()).toMatchObject({
        currentId: "P1", previewActive: false, previewAvailable: true,
      });
      game.requestPreview();
      game.requestPreview();
      expect(useGameStore.getState()).toMatchObject({ previewActive: true, previewRemaining: remaining });
      game.fire();
      Reflect.get(game, "explode").call(game, 640, 100);
      Reflect.get(game, "launchShot").call(game, 135, 400);
      Reflect.get(game, "explode").call(game, 640, 100);
    }
    expect(useGameStore.getState()).toMatchObject({
      currentId: "P1", previewActive: false, previewAvailable: false, previewRemaining: 0,
    });
  });

  it("destroys its renderer without releasing resources shared with other Pixi canvases", () => {
    const destroy = vi.fn();
    Reflect.set(game, "app", { renderer: {}, destroy });
    game.destroy();
    expect(destroy).toHaveBeenCalledWith({ removeView: true }, { children: true });
  });

  it.each(["skirmish", "campaign"] as const)("discards unfinished XP but preserves earlier progress: %s", (mode) => {
    const profiles = { P1: { xp: 120, levels: { armor: 1 } }, P2: { xp: 80, levels: {} } };
    Reflect.set(game, "profiles", structuredClone(profiles));
    saveProfiles(profiles);
    game.startOffline(mode);
    Reflect.get(game, "award").call(game, "P1", 25);
    Reflect.get(game, "award").call(game, "P2", 10);
    expect(Reflect.get(game, "profiles").P1.xp).toBe(145);
    expect(loadProfiles(["P1", "P2"])).toEqual(profiles);
    game.leaveBattle();
    game.leaveBattle();
    expect(useGameStore.getState().profiles).toEqual(profiles);
    expect(useGameStore.getState().matchStats.P1?.xp).toBe(0);
    expect(useCampaignStore.getState().completedIds).toEqual([]);
    game.startCampaign();
    expect(useGameStore.getState().profiles).toEqual(profiles);
  });

  it("retains completed match XP when returning to the menu", () => {
    game.startCampaign();
    endBattle("P1");
    const completed = loadProfiles(["P1", "P2"]);
    expect(useGameStore.getState().matchStats.P1?.xp).toBeGreaterThanOrEqual(50);
    game.leaveBattle();
    expect(useGameStore.getState().profiles).toEqual(completed);
    expect(useCampaignStore.getState().completedIds).toContain("alpha-01");
  });

  it("does not carry provisional XP into a restarted match", () => {
    game.startOffline();
    const before = structuredClone(Reflect.get(game, "profiles"));
    Reflect.get(game, "award").call(game, "P1", 25);
    game.restart();
    expect(Reflect.get(game, "profiles")).toEqual(before);
    expect(useGameStore.getState().matchStats.P1?.xp).toBe(0);
  });

  it("keeps the existing immediate XP persistence for online matches", () => {
    game.startMultiplayer(
      { seed: 42, starterIndex: 0 },
      { P1: { xp: 100, levels: {} }, P2: { xp: 100, levels: {} } },
      0,
    );
    Reflect.get(game, "award").call(game, "P1", 25);
    expect(loadProfiles(["P1"]).P1?.xp).toBe(125);
    game.leaveBattle();
    expect(useGameStore.getState().profiles.P1?.xp).toBe(125);
  });

  it("forces campaign AI but preserves quick-battle preference, including rematch", () => {
    game.startCampaign();
    expect(useGameStore.getState()).toMatchObject({ matchMode: "campaign", aiActive: true });
    expect(useAiSettings.getState().enabled).toBe(false);
    const firstId = useGameStore.getState().matchId;
    game.restart();
    expect(useGameStore.getState().matchId).not.toBe(firstId);
    expect(useGameStore.getState().aiActive).toBe(true);
    game.startOffline();
    expect(useGameStore.getState()).toMatchObject({ matchMode: "skirmish", aiActive: false });
  });

  it.each(["P1", "P2", null] as const)("completes ALPHA only for a campaign P1 victory: %s", (winner) => {
    game.startCampaign();
    endBattle(winner);
    expect(useGameStore.getState()).toMatchObject({ phase: "gameOver", winner });
    expect(useCampaignStore.getState().completedIds).toEqual(winner === "P1" ? ["alpha-01"] : []);
  });

  it("does not complete the sector after a quick-battle victory", () => {
    game.startOffline();
    endBattle("P1");
    expect(useCampaignStore.getState().completedIds).toEqual([]);
  });

  it("stops AI actions, physics and player controls when leaving a battle", () => {
    game.startCampaign();
    game.restart({ seed: 42, starterIndex: 1 });
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    game.leaveBattle();
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(10000);
    game.fire();
    game.move(-1);
    Reflect.get(game, "update").call(game, 1);
    expect(Reflect.get(game, "shell")).toBeNull();
    expect(useGameStore.getState().canControl).toBe(false);
    expect(useCampaignStore.getState().completedIds).toEqual([]);
  });

  it("full progress reset clears campaign, XP and upgrade levels", () => {
    useCampaignStore.getState().complete("alpha-01");
    game.resetProgress();
    expect(useCampaignStore.getState().completedIds).toEqual([]);
    expect(useGameStore.getState().profiles).toEqual({
      P1: { xp: 0, levels: {} },
      P2: { xp: 0, levels: {} },
    });
  });

  it("builds the selected real sector, retains it on rematch and resets it for quick battles", () => {
    useCampaignStore.getState().complete("alpha-01");
    expect(game.startCampaign("forge-17")).toBe(true);
    expect(useGameStore.getState().sector.id).toBe("forge-17");
    expect(Reflect.get(game, "terrain").build).toHaveBeenLastCalledWith(
      1280,
      720,
      expect.any(Number),
      sectorById("forge-17"),
    );
    game.restart();
    expect(useGameStore.getState().sector.id).toBe("forge-17");
    endBattle("P1");
    expect(useCampaignStore.getState().completedIds).toEqual(["alpha-01", "forge-17"]);
    expect(useGameStore.getState().campaignNewRoutes).toEqual(["vanguard-12"]);
    endBattle("P1");
    expect(useGameStore.getState().campaignNewRoutes).toEqual([]);
    game.startOffline();
    expect(useGameStore.getState().sector.id).toBe("alpha-01");
  });

  it.each(["P2", null] as const)("does not complete a selected new sector after loss/draw: %s", (winner) => {
    useCampaignStore.getState().complete("alpha-01");
    game.startCampaign("delta-08");
    endBattle(winner);
    expect(useGameStore.getState().sector.id).toBe("delta-08");
    expect(useCampaignStore.getState().completedIds).toEqual(["alpha-01"]);
  });

  it("rejects a locked campaign operation without starting a match", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(game.startCampaign("prime-00")).toBe(false);
    expect(useGameStore.getState().sector.id).toBe("alpha-01");
  });

  it("preserves a campaign selected before the terrain is initialized", () => {
    useCampaignStore.getState().complete("alpha-01");
    const terrain = Reflect.get(game, "terrain");
    Reflect.set(game, "terrain", null);
    expect(game.startCampaign("delta-08")).toBe(true);
    Reflect.set(game, "terrain", terrain);
    game.restart();
    expect(useGameStore.getState()).toMatchObject({
      sector: sectorById("delta-08"),
      matchMode: "campaign",
      aiActive: true,
    });
  });

  it("resets the sector for online battles without changing campaign progress", () => {
    useCampaignStore.getState().complete("alpha-01");
    game.startCampaign("forge-17");
    game.startMultiplayer({ seed: 42, starterIndex: 0 }, useGameStore.getState().profiles, 0);
    expect(useGameStore.getState().sector.id).toBe("alpha-01");
    expect(useGameStore.getState().aiActive).toBe(false);
    expect(useCampaignStore.getState().completedIds).toEqual(["alpha-01"]);
  });
});
