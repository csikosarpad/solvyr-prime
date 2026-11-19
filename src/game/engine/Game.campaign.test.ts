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
import { simulateImpact } from "../systems/ai";
import { barrelTip } from "../entities/tank";
import { DEFAULT_WORLD } from "../physics/ballistics";
import { computeStats, type Profile } from "../systems/upgrades";
import { Texture, type Graphics } from "pixi.js";
import { GlowFilter } from "pixi-filters";
import type { PlacedStrategicObjective } from "../systems/strategicObjectives";
import { useCommandStore } from "../state/commandStore";
import { useVeyloraStore } from "../state/veyloraStore";
import { IDBFactory, IDBObjectStore } from "fake-indexeddb";
import { ARMOR_COLORS, DEFAULT_ARMOR_COLORS, DEFAULT_PLAYER_COLORS, PLAYER_COLORS, usePlayerColors } from "../state/playerColors";
import type { WeaponId } from "../data/weapons";
import { DEFAULT_THEME } from "../theme";
import { usePlayerNamesStore } from "../state/playerNames";

vi.hoisted(() => {
  HTMLCanvasElement.prototype.getContext = () => null;
});

describe("Game campaign lifecycle", () => {
  let game: Game;

  beforeEach(async () => {
    vi.stubGlobal("indexedDB", new IDBFactory());
    localStorage.removeItem("ballistic-front:profiles");
    localStorage.removeItem("ballistic-front:profiles:v1");
    await useVeyloraStore.getState().switchPlayer("P1");
    await useVeyloraStore.getState().resetEconomy();
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] });
    useMultiplayerStore.getState().leave();
    useCampaignStore.getState().switchPlayer("P1");
    useCampaignStore.getState().reset();
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
    usePlayerColors.setState({ colors: { ...DEFAULT_PLAYER_COLORS }, armorColors: { ...DEFAULT_ARMOR_COLORS }, error: null });
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

  it("applies both selected colors to the tank and HUD on a new battle", () => {
    usePlayerColors.setState({ colors: { P1: "green", P2: "purple" } });
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    Reflect.set(game, "tankTextures", { body: Texture.EMPTY, barrel: Texture.EMPTY, markings: Texture.EMPTY });
    game.restart({ seed: 42, starterIndex: 0 });
    const tanks: Tank[] = Reflect.get(game, "tanks");
    expect(tanks.map((tank) => tank.color)).toEqual([PLAYER_COLORS.green, PLAYER_COLORS.purple]);
    expect(useGameStore.getState().tanks.map((tank) => tank.color)).toEqual([PLAYER_COLORS.green, PLAYER_COLORS.purple]);
    const layer = Reflect.get(game, "tankLayer");
    for (const [index, color] of [PLAYER_COLORS.green, PLAYER_COLORS.purple].entries()) {
      const [barrel, body, markings] = layer.children[index].children;
      expect(body.tint).toBe(0xffffff);
      expect(markings.tint).toBe(color);
      expect(markings.anchor.x).toBe(body.anchor.x);
      expect(markings.anchor.y).toBe(body.anchor.y);
      expect([body.scale.x, body.scale.y, markings.scale.x, markings.scale.y]).toEqual([1.25, 1.25, 1.25, 1.25]);
      expect([barrel.scale.x, barrel.scale.y]).toEqual([1, 1.25]);
    }
    vi.unstubAllGlobals();
  });

  it("renders a black tank with visible shading and outline without changing its saved color", () => {
    usePlayerColors.setState({ colors: { P1: "black", P2: "white" } });
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    Reflect.set(game, "tankTextures", { body: Texture.EMPTY, barrel: Texture.EMPTY, markings: Texture.EMPTY });
    game.restart({ seed: 42, starterIndex: 0 });
    const layer = Reflect.get(game, "tankLayer");
    expect(layer.children[0].children[1].tint).toBe(0xffffff);
    expect(layer.children[0].children[2].tint).toBe(0x777777);
    expect(layer.children[0].filters[0].color).toBe(0xb9c7d6);
    expect(layer.children[1].children[2].tint).toBe(0xffffff);
    expect(useGameStore.getState().tanks[0]!.color).toBe(0);
    vi.unstubAllGlobals();
  });

  it("tints the armor and barrel together when the main color is not steel", () => {
    usePlayerColors.setState({ armorColors: { P1: "olive", P2: "steel" } });
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    Reflect.set(game, "tankTextures", {
      body: Texture.EMPTY, barrel: Texture.EMPTY, markings: Texture.EMPTY,
      chassis: Texture.EMPTY, armor: Texture.WHITE, details: Texture.EMPTY,
    });
    game.restart({ seed: 42, starterIndex: 0 });
    const layer = Reflect.get(game, "tankLayer");
    const [barrel, chassis, armor, details, markings] = layer.children[0].children;
    expect(armor.texture).toBe(Texture.WHITE);
    expect(armor.tint).toBe(ARMOR_COLORS.olive.tint);
    expect(barrel.tint).toBe(armor.tint);
    expect([chassis.tint, details.tint, markings.tint]).toEqual([0xffffff, 0xffffff, PLAYER_COLORS.blue]);
    expect([chassis, armor, details, markings].map((sprite) => [sprite.anchor.x, sprite.anchor.y, sprite.scale.x]))
      .toEqual(Array(4).fill([0.5, 1, 1.25]));
    expect(layer.children[1].children).toHaveLength(3);
    expect(layer.children[1].children[0].tint).toBe(0xffffff);
    vi.unstubAllGlobals();
  });

  const startForge = (starterIndex = 0) => {
    useCampaignStore.getState().complete("alpha-01");
    expect(game.startCampaign("forge-17")).toBe(true);
    game.restart({ seed: 42, starterIndex });
  };

  it("lets P2 fight their own operation as the human and awards only P2's campaign", async () => {
    useCampaignStore.getState().switchPlayer("P2");
    await useVeyloraStore.getState().switchPlayer("P2");
    expect(await game.startOperation("secure-mine")).toBe(true);
    game.restart({ seed: 42, starterIndex: 1 });
    expect(useGameStore.getState()).toMatchObject({ campaignPlayer: "P2", currentId: "P2", canControl: true });
    const tanks: Tank[] = Reflect.get(game, "tanks");
    tanks[0]!.hp = 0;
    game.fire();
    Reflect.get(game, "explode").call(game, 640, 100);
    expect(useGameStore.getState()).toMatchObject({ winner: "P2", missionSuccess: true });
    await vi.waitFor(() => expect(useVeyloraStore.getState().completedMissionIds).toContain("secure-mine"));
    expect(useVeyloraStore.getState().economy.resources["industrial-ore"]).toBe(20);
    await useVeyloraStore.getState().switchPlayer("P1");
    expect(useVeyloraStore.getState().completedMissionIds).toEqual([]);
    expect(useVeyloraStore.getState().economy.resources).toEqual({});
  });

  it.each(["P1", "P2"] as const)("keeps %s campaign AI XP out of the other human profile", (player) => {
    useCampaignStore.getState().switchPlayer(player);
    game.startCampaign("alpha-01");
    const aiId = player === "P1" ? "P2" : "P1";
    const humanProfile = structuredClone(Reflect.get(game, "profiles")[aiId]);
    Reflect.get(game, "award").call(game, aiId, 120);
    expect(Reflect.get(game, "profiles")[aiId]).toEqual(humanProfile);
    expect(Reflect.get(game, "aiProfile").xp).toBe(120);
    game.leaveBattle();
    expect(Reflect.get(game, "aiProfile").xp).toBe(0);
  });

  it("persists an AI victory separately from both human profiles", () => {
    useAiSettings.getState().setEnabled(true);
    const humanProfiles = structuredClone(Reflect.get(game, "profiles"));
    endBattle("P2");
    const aiProfile: Profile = Reflect.get(game, "aiProfile");
    expect(aiProfile.xp + Object.values(aiProfile.levels).reduce((sum, level) => sum + level, 0)).toBeGreaterThan(0);
    expect(loadProfiles(["P1", "P2", "AI"])).toEqual({ ...humanProfiles, AI: aiProfile });
    const reloaded = new Game();
    expect(Reflect.get(reloaded, "aiProfile")).toEqual(aiProfile);
    reloaded.destroy();
  });

  it("credits a P2 victory only to P2's legacy campaign", () => {
    useCampaignStore.getState().switchPlayer("P2");
    game.startCampaign("alpha-01");
    game.restart({ seed: 42, starterIndex: 1 });
    const tanks: Tank[] = Reflect.get(game, "tanks");
    tanks[0]!.hp = 0;
    game.fire();
    Reflect.get(game, "explode").call(game, 640, 100);
    expect(useGameStore.getState()).toMatchObject({ winner: "P2", campaignPlayer: "P2" });
    expect(useCampaignStore.getState().completedIds).toEqual(["alpha-01"]);
    useCampaignStore.getState().switchPlayer("P1");
    expect(useCampaignStore.getState().completedIds).toEqual([]);
  });

  it("uses only P2's purchased shield in a P2 operation", async () => {
    const state = useVeyloraStore.getState;
    await state().complete("secure-mine", state().economy.generation);
    await state().complete("secure-lab", state().economy.generation);
    await state().buy("reinforced-shield");
    useCampaignStore.getState().switchPlayer("P2");
    await state().switchPlayer("P2");
    expect(await game.startOperation("secure-mine")).toBe(true);
    expect(Reflect.get(game, "tanks")[1].stats.maxEnergyShield).toBe(0);
    await state().complete("secure-mine", state().economy.generation);
    await state().complete("secure-lab", state().economy.generation);
    await state().buy("reinforced-shield");
    expect(await game.startOperation("secure-mine")).toBe(true);
    expect(Reflect.get(game, "tanks")[1].stats.maxEnergyShield).toBeCloseTo(22);
    expect(Reflect.get(game, "tanks")[0].stats.maxEnergyShield).toBe(0);
  });

  it("purchases upgrades between matches, persists them, and keeps both player profiles", () => {
    game.restart({ seed: 42, starterIndex: 0 });
    game.leaveBattle();
    Reflect.get(game, "profiles").P1.xp = 100;
    Reflect.get(game, "profiles").P2.xp = 100;
    useGameStore.setState({ screen: "workshop", workshopOrigin: "menu" });
    game.buy("P1", "armor");
    game.buy("P2", "shield");
    expect(loadProfiles(["P1", "P2"])).toEqual({
      P1: { xp: 60, levels: { armor: 1 } },
      P2: { xp: 50, levels: { shield: 1 } },
    });
    game.startOffline();
    expect(Reflect.get(game, "tanks")[0].stats.maxArmor).toBe(20);
    expect(Reflect.get(game, "tanks")[1].stats.maxEnergyShield).toBe(20);
  });

  it("does not charge XP or change profiles if a workshop purchase cannot be persisted", () => {
    game.restart({ seed: 42, starterIndex: 0 });
    game.leaveBattle();
    Reflect.get(game, "profiles").P1.xp = 100;
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
    game.buy("P1", "armor");
    expect(Reflect.get(game, "profiles").P1).toEqual({ xp: 100, levels: {} });
    expect(useGameStore.getState().workshopError).toBe("workshop.saveError");
  });

  it("starts fixed VEYLORA opponents independently of P2 profile and AI memory", async () => {
    Reflect.get(game, "profiles").P2.levels = { armor: 5, shield: 5, warhead: 5 };
    useAiSettings.setState({ memory: { matches: 999, wins: 999, shots: 999, hits: 999 } });
    expect(await game.startOperation("secure-mine")).toBe(true);
    expect(useGameStore.getState()).toMatchObject({ matchMode: "operation", aiActive: true, opponentSkill: 0.35 });
    expect(Reflect.get(game, "tanks")[1].stats).toMatchObject({ maxArmor: 0, maxEnergyShield: 0, damage: 1 });
    expect(await game.startOperation("secure-lab")).toBe(true);
    expect(Reflect.get(game, "tanks")[1].stats.maxArmor).toBe(20);
    expect(useGameStore.getState().opponentSkill).toBe(0.55);
    expect(useGameStore.getState().strategicObjectives[0]?.type).toBe("RESEARCH_LAB");
    game.startOffline();
    expect(useGameStore.getState()).toMatchObject({ matchMode: "skirmish", campaignMission: null, opponentSkill: null });
  });

  it("does not allow starting the station mission until both planetary operations are complete", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await game.startOperation("secure-station")).toBe(false);
    expect(useGameStore.getState().matchMode).toBe("skirmish");
    await useVeyloraStore.getState().complete("secure-mine", useVeyloraStore.getState().economy.generation);
    expect(await game.startOperation("secure-station")).toBe(false);
    await useVeyloraStore.getState().complete("secure-lab", useVeyloraStore.getState().economy.generation);
    expect(await game.startOperation("secure-station")).toBe(true);
    expect(useGameStore.getState().sector.code).toBe("VEYLORA-STATION");
    expect(useGameStore.getState().opponentSkill).toBe(0.65);
  });

  it("only clears VEYLORA after a successful victory in the station mission", async () => {
    const progress = useVeyloraStore.getState();
    await progress.complete("secure-mine", progress.economy.generation);
    await progress.complete("secure-lab", progress.economy.generation);
    expect(await game.startOperation("secure-station")).toBe(true);
    endBattle("P1");
    await useVeyloraStore.getState().refresh();
    expect(useGameStore.getState().missionSuccess).toBe(true);
    expect(useVeyloraStore.getState().completedMissionIds).toEqual([
      "secure-mine",
      "secure-lab",
      "secure-station",
    ]);
  });

  it.each([
    ["P1", 100, true], ["P1", 20, true], ["P1", 19.99, false],
    ["P2", 100, false], [null, 100, false],
  ] as const)("separates research mission success from battle result: %s / %s HP", async (winner, hp, success) => {
    expect(await game.startOperation("secure-lab")).toBe(true);
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
    await useVeyloraStore.getState().refresh();
    expect(useGameStore.getState()).toMatchObject({ winner, missionSuccess: success });
    expect(useVeyloraStore.getState().completedMissionIds).toEqual(success ? ["secure-lab"] : []);
    expect(useVeyloraStore.getState().economy.technologies).toEqual(success ? ["materials-blueprint"] : []);
    expect(useCampaignStore.getState().completedIds).toEqual([]);
    expect(useAiSettings.getState().memory).toEqual(memory);
    expect(Reflect.get(game, "profiles").P2).toEqual(p2);
    if (winner === "P1") expect(useGameStore.getState().matchStats.P1?.xp).toBeGreaterThanOrEqual(50);
    game.restart({ seed: 42, starterIndex: 0 });
    expect(useGameStore.getState().strategicObjectives[0]?.hp).toBe(100);
    expect(useGameStore.getState().missionSuccess).toBeNull();
  });

  it("completes only the mine after a VEYLORA mine victory and leaves legacy progress untouched", async () => {
    await game.startOperation("secure-mine");
    endBattle("P1");
    await useVeyloraStore.getState().refresh();
    expect(useGameStore.getState().missionSuccess).toBe(true);
    expect(useVeyloraStore.getState().completedMissionIds).toEqual(["secure-mine"]);
    expect(useVeyloraStore.getState().economy.resources["industrial-ore"]).toBe(20);
    expect(useCampaignStore.getState().completedIds).toEqual([]);
  });

  it("blocks VEYLORA start before terrain readiness", async () => {
    Reflect.set(game, "terrain", null);
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await game.startOperation("secure-mine")).toBe(false);
    expect(useGameStore.getState().matchMode).not.toBe("operation");
  });

  it("does not start a match if mission selection cannot be saved", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(IDBObjectStore.prototype, "put").mockImplementationOnce(() => { throw new Error("quota"); });
    expect(await game.startOperation("secure-mine")).toBe(false);
    expect(useGameStore.getState().matchMode).toBe("skirmish");
  });

  it("applies the purchased shield only to P1 operations and follows later XP upgrades without altering old modes", async () => {
    Reflect.get(game, "profiles").P1.levels = {};
    const state = useVeyloraStore.getState;
    await state().complete("secure-mine", state().economy.generation);
    await state().complete("secure-lab", state().economy.generation);
    await state().buy("reinforced-shield");
    expect(await game.startOperation("secure-mine")).toBe(true);
    expect(Reflect.get(game, "tanks")[0].stats.maxEnergyShield).toBeCloseTo(22);
    game.leaveBattle();
    Reflect.get(game, "profiles").P1.levels.shield = 1;
    await game.startOperation("secure-mine");
    expect(Reflect.get(game, "tanks")[0].stats.maxEnergyShield).toBeCloseTo(44);
    expect(Reflect.get(game, "tanks")[1].stats.maxEnergyShield).toBe(0);
    game.leaveBattle();
    Reflect.get(game, "profiles").P1.levels.shield = 5;
    await game.startOperation("secure-lab");
    expect(Reflect.get(game, "tanks")[0].stats.maxEnergyShield).toBeCloseTo(132);
    game.startOffline();
    expect(Reflect.get(game, "tanks")[0].stats.maxEnergyShield).toBe(100);
    game.startCampaign();
    expect(Reflect.get(game, "tanks")[0].stats.maxEnergyShield).toBe(100);
    game.startMultiplayer({ seed: 42, starterIndex: 0 }, useGameStore.getState().profiles, 0);
    expect(Reflect.get(game, "tanks")[0].stats.maxEnergyShield).toBe(100);
  });

  it("keeps an active battle shield snapshot when economy is reset elsewhere, but removes it next deployment", async () => {
    const state = useVeyloraStore.getState;
    await state().complete("secure-mine", state().economy.generation);
    await state().complete("secure-lab", state().economy.generation);
    await state().buy("reinforced-shield");
    Reflect.get(game, "profiles").P1.levels.shield = 1;
    await game.startOperation("secure-mine");
    await state().resetEconomy();
    expect(Reflect.get(game, "tanks")[0].stats.maxEnergyShield).toBeCloseTo(44);
    await game.startOperation("secure-mine");
    expect(Reflect.get(game, "tanks")[0].stats.maxEnergyShield).toBe(20);
  });

  it("applies equipment changes only at the next operation", async () => {
    const state = useVeyloraStore.getState;
    await state().complete("secure-mine", state().economy.generation);
    await state().complete("secure-lab", state().economy.generation);
    await state().buy("reinforced-shield");
    await game.startOperation("secure-mine");
    expect(Reflect.get(game, "tanks")[0].shield).toBeCloseTo(22);
    await state().equipShield(null);
    expect(Reflect.get(game, "tanks")[0].stats.maxEnergyShield).toBeCloseTo(22);
    await game.startOperation("secure-mine");
    expect(Reflect.get(game, "tanks")[0].stats.maxEnergyShield).toBe(0);
    await state().equipShield("reinforced-shield");
    await game.startOperation("secure-mine");
    expect(Reflect.get(game, "tanks")[0].shield).toBeCloseTo(22);
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

  it("passes explosions to background buildings without adding them to mission objectives", () => {
    const decor = Reflect.get(game, "buildingDecor");
    decor.setTextures({ radar: Texture.WHITE, defense: Texture.WHITE, foundry: Texture.WHITE });
    startForge();
    const sprite = decor.children[0];
    const objectives = useGameStore.getState().strategicObjectives;
    game.fire();
    Reflect.get(game, "explode").call(game, sprite.x, sprite.y);
    expect(sprite.tint).toBe(0x999999);
    expect(useGameStore.getState().strategicObjectives.map((objective) => objective.id))
      .toEqual(objectives.map((objective) => objective.id));
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
      Reflect.set(game, "tankTextures", { body: Texture.EMPTY, barrel: Texture.EMPTY, markings: Texture.EMPTY });
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

  it("publishes only the local player's post-match upgrade while the workshop is open", () => {
    useMultiplayerStore.setState({
      credentials: { roomCode: "ABC123", playerId: "P2", token: "token" },
    });
    const originalPublish = useMultiplayerStore.getState().publish;
    const publish = vi.fn(async () => {});
    useMultiplayerStore.setState({ publish });
    game.startMultiplayer(
      { seed: 42, starterIndex: 0 },
      { P1: { xp: 100, levels: {} }, P2: { xp: 100, levels: {} } },
      0,
    );
    Reflect.set(Reflect.get(game, "turns"), "phase", "gameOver");
    useGameStore.setState({ screen: "workshop", workshopOrigin: "playing" });
    game.buy("P1", "armor");
    game.buy("P2", "armor");
    expect(publish).toHaveBeenCalledOnce();
    expect(publish).toHaveBeenCalledWith("upgrade_purchased", { upgradeId: "armor" });
    expect(Reflect.get(game, "profiles").P2).toEqual({ xp: 100, levels: {} });
    useMultiplayerStore.setState({ publish: originalPublish });
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

  it("XP reset clears XP upgrades but preserves campaign progress and the separate campaign economy", async () => {
    useCampaignStore.getState().complete("alpha-01");
    await useVeyloraStore.getState().complete("secure-mine", useVeyloraStore.getState().economy.generation);
    const economy = structuredClone(useVeyloraStore.getState().economy);
    game.resetProgress();
    expect(useCampaignStore.getState().completedIds).toEqual(["alpha-01"]);
    expect(useGameStore.getState().profiles).toEqual({
      P1: { xp: 0, levels: {} },
      P2: { xp: 0, levels: {} },
    });
    expect(useVeyloraStore.getState().economy).toEqual(economy);
  });

  it("the defending human tank dodges during shell flight from its leftover movement budget", () => {
    game.restart({ seed: 42, starterIndex: 0 });
    const tanks: Tank[] = Reflect.get(game, "tanks");
    const shooter = tanks[0]!;
    const defender = tanks[1]!;
    defender.moveLeft = 4;
    const shooterX = shooter.x;
    const defenderX = defender.x;
    game.fire();
    expect(useGameStore.getState().phase).toBe("flying");
    expect(useGameStore.getState().canDodge).toBe(true);
    game.move(1);
    game.move(1);
    // A keret elfogyott: a harmadik lépés már nem mozdít.
    game.move(1);
    expect(defender.x).toBe(defenderX + 4);
    expect(shooter.x).toBe(shooterX);
    expect(useGameStore.getState().canDodge).toBe(false);
  });

  it("unlocked weapons are selectable per shot and the laser resolves instantly in a straight line", () => {
    Reflect.set(game, "profiles", { P1: { xp: 0, levels: {}, weapons: ["laser"] }, P2: { xp: 0, levels: {} } });
    game.restart({ seed: 42, starterIndex: 0 });
    expect(useGameStore.getState().weaponOptions).toEqual(["standard", "laser"]);
    game.selectWeapon("laser");
    expect(useGameStore.getState().weapon).toBe("laser");
    const tanks: Tank[] = Reflect.get(game, "tanks");
    const target = tanks[1]!;
    useGameStore.getState().setAim(0, 400);
    game.fire();
    // Nincs repülési fázis: a lövés azonnal feloldódik, és a kör a célponté.
    expect(useGameStore.getState().phase).toBe("aiming");
    expect(useGameStore.getState().currentId).toBe("P2");
    expect(target.hp).toBe(100 - 34);
  });

  it("a weapon that is not unlocked cannot be selected and the shot stays standard", () => {
    game.restart({ seed: 42, starterIndex: 0 });
    game.selectWeapon("ap");
    expect(useGameStore.getState().weapon).toBe("standard");
    expect(useGameStore.getState().weaponOptions).toEqual(["standard"]);
  });

  it.each<WeaponId>(["standard", "ap", "incendiary", "homing"])(
    "%s keeps its shot colors on the fading trail after impact",
    (weapon) => {
      Reflect.set(game, "profiles", {
        P1: { xp: 0, levels: {}, weapons: [weapon] },
        P2: { xp: 0, levels: {} },
      });
      game.restart({ seed: 42, starterIndex: 0 });
      game.selectWeapon(weapon);
      game.fire();
      const trail = Reflect.get(game, "shellTrail");
      trail.push(200, 100);
      trail.push(210, 105);
      const stroke = vi.spyOn(Reflect.get(game, "trailGfx"), "stroke");
      Reflect.get(game, "drawShellTrail").call(game);
      const colors = {
        standard: DEFAULT_THEME.shell,
        ap: { core: 0xeef4ff, glow: 0x8cafff },
        incendiary: { core: 0xffedb5, glow: 0xff792e },
        homing: { core: 0xe2ffe8, glow: 0x70edb0 },
        laser: { core: 0xff8296, glow: 0xff2e4d },
      };
      expect(stroke).toHaveBeenNthCalledWith(1, expect.objectContaining({ color: colors[weapon].glow }));
      expect(stroke).toHaveBeenNthCalledWith(2, expect.objectContaining({ color: colors[weapon].core }));
      const before = [...stroke.mock.calls];
      stroke.mockClear();
      Reflect.get(game, "explode").call(game, 210, 105, null);
      expect(Reflect.get(game, "activeShot")).toBeNull();
      Reflect.get(game, "drawShellTrail").call(game);
      expect(stroke.mock.calls).toEqual(before);
      game.restart({ seed: 42, starterIndex: 0 });
      expect(trail.length).toBe(0);
    },
  );

  it.each<WeaponId>(["standard", "ap", "incendiary", "homing"])(
    "%s applies warhead glow only when the upgrade affects the shot",
    (weapon) => {
      const glowSizes: number[] = [];
      const trailAlphas: number[] = [];
      Reflect.set(game, "profiles", {
        P1: { xp: 0, levels: {}, weapons: [weapon] },
        P2: { xp: 0, levels: {} },
      });
      for (const warhead of [0, 1, 5]) {
        game.restart({ seed: 42, starterIndex: 0 });
        const tanks: Tank[] = Reflect.get(game, "tanks");
        tanks[0]!.stats = computeStats({ warhead });
        game.selectWeapon(weapon);
        game.fire();
        const trail = Reflect.get(game, "shellTrail");
        trail.push(200, 100);
        trail.push(210, 105);
        const graphics: Graphics = Reflect.get(game, "trailGfx");
        const stroke = vi.spyOn(graphics, "stroke");
        stroke.mockClear();
        Reflect.get(game, "draw").call(game, 0);
        glowSizes.push(Reflect.get(game, "shellGlow").width);
        const outerStroke = stroke.mock.calls[0]![0];
        if (!outerStroke || typeof outerStroke !== "object" || !("alpha" in outerStroke)) {
          throw new Error("Expected a trail stroke with an explicit alpha");
        }
        trailAlphas.push(outerStroke.alpha ?? 1);
      }
      if (weapon === "standard") {
        expect(glowSizes[1]).toBeGreaterThan(glowSizes[0]!);
        expect(glowSizes[2]).toBeGreaterThan(glowSizes[1]!);
        expect(trailAlphas[1]).toBeGreaterThan(trailAlphas[0]!);
        expect(trailAlphas[2]).toBeGreaterThan(trailAlphas[1]!);
      } else {
        expect(new Set(glowSizes).size).toBe(1);
        expect(new Set(trailAlphas).size).toBe(1);
      }
    },
  );

  it("armor piercing damages only on direct hit and half the damage bypasses armor", () => {
    Reflect.set(game, "profiles", { P1: { xp: 0, levels: {}, weapons: ["ap"] }, P2: { xp: 0, levels: { armor: 5 } } });
    game.restart({ seed: 42, starterIndex: 0 });
    game.selectWeapon("ap");
    const tanks: Tank[] = Reflect.get(game, "tanks");
    const target = tanks[1]!;
    expect(target.armor).toBe(100);
    game.fire();
    // Terepbecsapódás a célpont mellett: nincs repeszsebzés.
    Reflect.get(game, "explode").call(game, target.x + 20, target.y - 6, null);
    expect(target.hp).toBe(100);
    expect(target.armor).toBe(100);
    // Második lövés: a célpont (P2) után ismét P1 jön, közvetlen találattal.
    useGameStore.getState().setAim(45, 200);
    game.fire();
    Reflect.get(game, "explode").call(game, 200, 100, null);
    game.selectWeapon("ap");
    game.fire();
    Reflect.get(game, "explode").call(game, target.x, target.y - 6, target);
    // 70 sebzés, pajzs nincs: 35 átüti a páncélt, 35 a páncélon kopik.
    expect(target.hp).toBe(65);
    expect(target.armor).toBe(65);
  });

  const igniteNearTarget = () => {
    Reflect.set(game, "profiles", { P1: { xp: 0, levels: {}, weapons: ["incendiary"] }, P2: { xp: 0, levels: {} } });
    game.restart({ seed: 42, starterIndex: 0 });
    game.selectWeapon("incendiary");
    const tanks: Tank[] = Reflect.get(game, "tanks");
    const target = tanks[1]!;
    game.fire();
    Reflect.get(game, "explode").call(game, target.x + 40, target.y, null);
    return { shooter: tanks[0]!, target };
  };

  const advanceBattle = (seconds: number, fps = 60) => {
    for (let frame = 0; frame < Math.round(seconds * fps); frame++) {
      Reflect.get(game, "update").call(game, 1 / fps);
    }
  };

  const incomingShot = (weapon: WeaponId = "homing") => {
    Reflect.set(game, "profiles", { P1: { xp: 0, levels: {}, weapons: [weapon] }, P2: { xp: 0, levels: {} } });
    game.restart({ seed: 42, starterIndex: 0 });
    game.selectWeapon(weapon);
    const tanks: Tank[] = Reflect.get(game, "tanks");
    const target = tanks[1]!;
    target.hp = 31;
    target.moveLeft = 0;
    game.fire();
    Reflect.set(game, "shell", {
      pos: { x: target.x - 100, y: target.y - 6 },
      vel: { x: 600, y: 0 },
    });
    return target;
  };

  it("the doomed defender speaks before a lethal homing impact even above the critical HP threshold", () => {
    const target = incomingShot();
    const announce = vi.spyOn(useCommandStore.getState(), "announce");
    advanceBattle(1 / 60);
    expect(target.hp).toBe(31);
    expect(Reflect.get(game, "shell")).not.toBeNull();
    expect(announce.mock.calls.filter(([key]) => key.startsWith("command.lastStand."))).toEqual([
      [expect.any(String), { id: expect.any(String) }, "critical", "P2"],
    ]);
    advanceBattle(0.5);
    expect(target.hp).toBe(0);
    expect(useGameStore.getState()).toMatchObject({ phase: "gameOver", winner: "P1" });
    expect(announce.mock.calls.filter(([key]) => key.startsWith("command.lastStand."))).toHaveLength(1);
  });

  it.each(["shield", "armor"] as const)("does not announce a lethal homing hit when %s prevents destruction", (defense) => {
    const target = incomingShot();
    target[defense] = 60;
    advanceBattle(0.5);
    expect(target.hp).toBe(31);
    expect(useCommandStore.getState().messages.some((message) => message.key.startsWith("command.lastStand."))).toBe(false);
  });

  it("does not mistake homing guidance for a guaranteed hit when the actual trajectory misses", () => {
    const target = incomingShot();
    Reflect.set(game, "shell", {
      pos: { x: target.x - 100, y: target.y - 100 },
      vel: { x: -600, y: 0 },
    });
    advanceBattle(0.5);
    expect(target.hp).toBe(31);
    expect(useCommandStore.getState().messages.some((message) => message.key.startsWith("command.lastStand."))).toBe(false);
  });

  it("does not predict a doomed moving target before its escape choices are resolved", () => {
    const target = incomingShot();
    target.moveLeft = 60;
    advanceBattle(1 / 60);
    expect(target.hp).toBe(31);
    expect(useCommandStore.getState().messages.some((message) => message.key.startsWith("command.lastStand."))).toBe(false);
  });

  it("accounts for armor piercing when predicting a fatal direct hit", () => {
    const target = incomingShot("ap");
    target.hp = 20;
    target.armor = 100;
    Reflect.set(game, "shell", {
      pos: { x: target.x - 80, y: target.y - 6 },
      vel: { x: 1000, y: 0 },
    });
    advanceBattle(1 / 60);
    expect(target.hp).toBe(20);
    expect(useCommandStore.getState().messages.filter((message) => message.key.startsWith("command.lastStand."))).toHaveLength(1);
    advanceBattle(0.25);
    expect(target.hp).toBe(0);
  });

  it("does not predict a losing defender if burning will end the match before the incoming impact", () => {
    const target = incomingShot();
    const tanks: Tank[] = Reflect.get(game, "tanks");
    tanks[0]!.hp = 1;
    tanks[0]!.moveLeft = 0;
    Reflect.set(game, "burnZones", [{
      x: tanks[0]!.x, radius: 42, damagePerSecond: 30, secondsLeft: 1, ownerId: "P2", exposure: new Map(),
    }]);
    const announce = vi.spyOn(useCommandStore.getState(), "announce");
    advanceBattle(1 / 60);
    expect(useGameStore.getState().phase).toBe("flying");
    expect(announce.mock.calls.filter(([key, , , speaker]) =>
      key.startsWith("command.lastStand.") && speaker === "P2",
    )).toHaveLength(0);
    advanceBattle(1 / 60);
    expect(target.hp).toBe(31);
    expect(useGameStore.getState()).toMatchObject({ phase: "gameOver", winner: "P2" });
  });

  it.each([
    [0, "P1", "command.victory.goodBattle"],
    [0.5, "P2", "command.victory.cameToWin"],
    [0.99, "P1", "command.victory.countOnUs"],
  ] as const)("selects victory line %s for the winning commander after the fanfare", (random, winner, message) => {
    vi.spyOn(usePlayerNamesStore, "getState").mockReturnValue({
      ...usePlayerNamesStore.getState(), names: { P1: "Nova", P2: "Orion" },
    });
    endBattle(winner);
    vi.spyOn(Math, "random").mockReturnValue(random);
    const announce = vi.spyOn(useCommandStore.getState(), "announce");
    vi.advanceTimersByTime(1799);
    expect(announce).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    const name = winner === "P1" ? "Nova" : "Orion";
    expect(announce).toHaveBeenCalledExactlyOnceWith(message, { user: name }, "info", winner);
    expect(useCommandStore.getState().messages).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "command.victory", params: { name } }),
      expect.objectContaining({ key: message, params: { user: name } }),
    ]));
  });

  it("does not celebrate a draw", () => {
    endBattle(null);
    vi.advanceTimersByTime(3000);
    expect(useCommandStore.getState().messages.some((message) => message.key.startsWith("command.victory"))).toBe(false);
  });

  it.each(["restart", "leaveBattle"] as const)("cancels the victory quote on %s", (action) => {
    endBattle("P1");
    game[action]();
    vi.advanceTimersByTime(3000);
    expect(useCommandStore.getState().messages.some((message) => message.key.startsWith("command.victory"))).toBe(false);
  });

  it.each([
    [0, "command.lastStand.fought"],
    [0.5, "command.lastStand.end"],
    [0.99, "command.lastStand.served"],
  ] as const)("selects farewell variant %s once before a trapped burning tank dies", (random, message) => {
    const { target } = igniteNearTarget();
    target.hp = 4;
    target.moveLeft = 0;
    vi.spyOn(Math, "random").mockReturnValue(random);
    const announce = vi.spyOn(useCommandStore.getState(), "announce");
    advanceBattle(1 / 60);
    expect(target.hp).toBe(4);
    expect(announce).toHaveBeenCalledWith(message, { id: expect.any(String) }, "critical", "P2");
    advanceBattle(0.6);
    expect(target.hp).toBe(0);
    const keys = announce.mock.calls.map(([key]) => key);
    expect(keys.filter((key) => key.startsWith("command.lastStand."))).toEqual([message]);
    expect(keys.indexOf(message)).toBeLessThan(keys.indexOf("command.destroyed"));
    expect(keys).not.toContain("command.burning");
  });

  it.each([
    { state: "healthy", hp: 40, shield: 0, armor: 0, seconds: 4, dps: 20, movement: 0 },
    { state: "shielded", hp: 4, shield: 40, armor: 0, seconds: 4, dps: 8, movement: 0 },
    { state: "armored", hp: 4, shield: 0, armor: 40, seconds: 4, dps: 8, movement: 0 },
    { state: "surviving the remaining fire", hp: 4, shield: 0, armor: 0, seconds: 0.25, dps: 8, movement: 0 },
    { state: "able to escape", hp: 4, shield: 0, armor: 0, seconds: 4, dps: 8, movement: 60 },
    { state: "outside the fire", hp: 4, shield: 0, armor: 0, seconds: 4, dps: 8, movement: 0 },
  ])("does not give a premature farewell when $state", ({ state, hp, shield, armor, seconds, dps, movement }) => {
    const { target } = igniteNearTarget();
    Object.assign(target, { hp, shield, armor, moveLeft: movement });
    const zone = Reflect.get(game, "burnZones")[0];
    zone.secondsLeft = seconds;
    zone.damagePerSecond = dps;
    if (state === "outside the fire") target.x -= 100;
    advanceBattle(1 / 60);
    expect(useCommandStore.getState().messages.some((message) => message.key.startsWith("command.lastStand."))).toBe(false);
  });

  it("counts overlapping fires and remaining defenses when deciding that burning is fatal", () => {
    const { target } = igniteNearTarget();
    Object.assign(target, { hp: 12, shield: 10, armor: 10, moveLeft: 0 });
    const zones = Reflect.get(game, "burnZones");
    zones[0].secondsLeft = 2;
    zones.push({ ...zones[0], exposure: new Map() });
    advanceBattle(1 / 60);
    expect(useCommandStore.getState().messages.filter((message) => message.key.startsWith("command.lastStand."))).toHaveLength(1);
    expect(target.hp).toBe(12);
  });

  it("allows the same unit to send a new farewell in a new battle", () => {
    const announce = vi.spyOn(useCommandStore.getState(), "announce");
    for (let battle = 0; battle < 2; battle++) {
      const { target } = igniteNearTarget();
      target.hp = 4;
      target.moveLeft = 0;
      advanceBattle(1 / 60);
    }
    expect(announce.mock.calls.filter(([key]) => key.startsWith("command.lastStand."))).toHaveLength(2);
  });

  it.each([30, 60, 120])("burns for exactly four seconds at eight damage per second at %i FPS", (fps) => {
    const { target } = igniteNearTarget();
    expect(target.hp).toBe(94);
    advanceBattle(1, fps);
    expect(target.hp).toBe(86);
    expect(useGameStore.getState().tanks[1]!.hp).toBe(86);
    expect(useGameStore.getState().currentId).toBe("P2");
    advanceBattle(3, fps);
    expect(target.hp).toBe(62);
    expect(Reflect.get(game, "burnZones")).toHaveLength(0);
    advanceBattle(1, fps);
    expect(target.hp).toBe(62);
  });

  it("stops burn damage outside the fire and resumes it on re-entry without waiting for a turn", () => {
    const { target } = igniteNearTarget();
    advanceBattle(0.25);
    expect(target.hp).toBe(92);
    game.move(-1);
    game.move(-1);
    advanceBattle(0.5);
    expect(target.hp).toBe(92);
    game.move(1);
    game.move(1);
    advanceBattle(0.25);
    expect(target.hp).toBe(90);
    const burningMessages = useCommandStore.getState().messages.filter((message) => message.key === "command.burning");
    expect(burningMessages).toHaveLength(2);
  });

  it("burns both tanks through their defenses but awards XP only for enemy damage", () => {
    const { shooter, target } = igniteNearTarget();
    shooter.x = target.x;
    target.shield = 3;
    target.armor = 3;
    advanceBattle(1);
    expect(shooter.hp).toBe(92);
    expect(target).toMatchObject({ shield: 0, armor: 0, hp: 92, hitSinceTurn: true });
    expect(useGameStore.getState().matchStats.P1).toMatchObject({ damage: 14, xp: 14 });
  });

  it("burning ground can finish the match during flight without resolving the shot or victory twice", () => {
    const { target } = igniteNearTarget();
    target.hp = 4;
    useGameStore.getState().setAim(90, 600);
    game.fire();
    expect(useGameStore.getState().phase).toBe("flying");
    const resolveElimination = vi.spyOn(Reflect.get(game, "turns"), "resolveElimination");
    advanceBattle(0.5);
    expect(useGameStore.getState()).toMatchObject({ phase: "gameOver", winner: "P1" });
    expect(target.hp).toBe(0);
    expect(Reflect.get(game, "shell")).toBeNull();
    expect(Reflect.get(game, "activeShot")).toBeNull();
    expect(Reflect.get(game, "aiTimers")).toHaveLength(0);
    advanceBattle(1);
    expect(resolveElimination).toHaveBeenCalledTimes(1);
  });

  it("resolves simultaneous burn deaths as a draw", () => {
    const { shooter, target } = igniteNearTarget();
    shooter.x = target.x;
    shooter.hp = target.hp = 1;
    advanceBattle(0.25);
    expect([shooter.hp, target.hp]).toEqual([0, 0]);
    expect(useGameStore.getState()).toMatchObject({ phase: "gameOver", winner: null });
  });

  it("does not apply burn damage or age the fire after leaving the battle", () => {
    const { target } = igniteNearTarget();
    game.leaveBattle();
    advanceBattle(2);
    expect(target.hp).toBe(94);
    expect(Reflect.get(game, "burnZones")[0].secondsLeft).toBe(4);
  });

  it("the AI escapes fire before thinking about its shot, then shoots once from safety", () => {
    useAiSettings.getState().setEnabled(true);
    const { target: ai } = igniteNearTarget();
    const startX = ai.x;
    const brain = Reflect.get(game, "aiBrain");
    vi.spyOn(brain, "planMove").mockReturnValue(0);
    vi.spyOn(brain, "decide").mockReturnValue({ angle: 135, power: 300, error: 0 });
    advanceBattle(0.25);
    expect(ai).toMatchObject({ x: startX - 4, moveLeft: ai.stats.moveBudget - 4, hp: 94 });
    expect(useGameStore.getState().phase).toBe("aiming");
    vi.advanceTimersByTime(2000);
    expect(useGameStore.getState().phase).toBe("flying");
    expect(useGameStore.getState().matchStats.P2!.shots).toBe(1);
    expect(ai.x).toBe(startX - 4);
  });

  it.each(["aiming", "flying"])("the AI uses remaining movement to escape during the human's %s phase", (phase) => {
    useAiSettings.getState().setEnabled(true);
    const { target: ai } = igniteNearTarget();
    Reflect.get(game, "launchShot").call(game, 90, 600);
    Reflect.get(game, "explode").call(game, 640, 100, null);
    expect(useGameStore.getState().currentId).toBe("P1");
    if (phase === "flying") {
      useGameStore.getState().setAim(90, 600);
      game.fire();
    }
    const startX = ai.x;
    advanceBattle(0.25);
    expect(ai).toMatchObject({ x: startX - 4, hp: 94 });
    expect(useGameStore.getState()).toMatchObject({ currentId: "P1", phase });
    expect(Reflect.get(game, "aiTimers")).toHaveLength(0);
  });

  it("does not grant the AI extra movement when fire traps it after its budget is exhausted", () => {
    useAiSettings.getState().setEnabled(true);
    const { target: ai } = igniteNearTarget();
    ai.moveLeft = 0;
    const startX = ai.x;
    advanceBattle(0.25);
    expect(ai).toMatchObject({ x: startX, moveLeft: 0, hp: 92 });
    expect(Reflect.get(game, "aiEscapingFire")).toBe(false);
  });

  it("rechecks fire safety when executing both a planned advance and a projectile dodge", () => {
    useAiSettings.getState().setEnabled(true);
    const { target: ai } = igniteNearTarget();
    Reflect.get(game, "burnZones")[0].x = ai.x - 44;
    vi.spyOn(Reflect.get(game, "aiBrain"), "decide").mockReturnValue({ angle: 135, power: 300, error: 0 });
    const startX = ai.x;
    const budget = ai.moveLeft;
    Reflect.get(game, "aiMove").call(game, -1, 5);
    expect(ai).toMatchObject({ x: startX, moveLeft: budget });
    Reflect.get(game, "turns").fire();
    Reflect.get(game, "aiDodgeStep").call(game, -1, startX + 5, 42);
    expect(ai).toMatchObject({ x: startX, moveLeft: budget });
  });

  it("homing shells steer toward the defender during flight", () => {
    Reflect.set(game, "profiles", { P1: { xp: 0, levels: {}, weapons: ["homing"] }, P2: { xp: 0, levels: {} } });
    game.restart({ seed: 42, starterIndex: 0 });
    game.selectWeapon("homing");
    const tanks: Tank[] = Reflect.get(game, "tanks");
    const target = tanks[1]!;
    game.fire();
    // A lövedéket a célfelvételi sugáron belülre helyezzük, vízszintes sebességgel.
    Reflect.set(game, "shell", { pos: { x: target.x - 150, y: target.y - 100 }, vel: { x: 100, y: 0 } });
    Reflect.get(game, "stepShell").call(game);
    const shell = Reflect.get(game, "shell") as { vel: { x: number; y: number } };
    // Rávezetés nélkül vy = gravitáció/60 = 10 lenne; a kormányzás lefelé fordít.
    expect(shell.vel.y).toBeGreaterThan(10.5);
  });

  it("buying a weapon spends XP, persists in the profile and appears among the options", () => {
    Reflect.set(game, "profiles", { P1: { xp: 400, levels: {} }, P2: { xp: 0, levels: {} } });
    game.restart({ seed: 42, starterIndex: 0 });
    // Meccs közben nincs vásárlás.
    game.buyWeapon("P1", "ap");
    expect(loadProfiles(["P1"]).P1!.weapons).toBeUndefined();
    // Valódi meccslezárás: a győztes P1 +50 XP-t kap, a profilok mentésre kerülnek.
    const tanks: Tank[] = Reflect.get(game, "tanks");
    tanks[1]!.hp = 0;
    game.fire();
    Reflect.get(game, "explode").call(game, 640, 100, null);
    expect(useGameStore.getState().phase).toBe("gameOver");
    game.buyWeapon("P1", "ap");
    expect(loadProfiles(["P1"]).P1).toMatchObject({ xp: 300, weapons: ["ap"] });
    game.restart({ seed: 42, starterIndex: 0 });
    expect(useGameStore.getState().weaponOptions).toEqual(["standard", "ap"]);
    game.selectWeapon("ap");
    expect(useGameStore.getState().weapon).toBe("ap");
  });

  it("the AI dodges a guaranteed player hit during flight based on its predicted impact", () => {
    useAiSettings.getState().setEnabled(true);
    game.restart({ seed: 42, starterIndex: 0 });
    const tanks: Tank[] = Reflect.get(game, "tanks");
    const ai = tanks[1]!;
    const mask = Reflect.get(game, "terrain").mask;
    // A kitérési esély-dobás mindig sikerüljön.
    vi.spyOn(Math, "random").mockReturnValue(0);
    // Az AI a kiszámolt becsapódási pontra áll, így a lövés biztosan veszélyzónában éri.
    const angle = 60;
    const power = 400;
    const wind = useGameStore.getState().wind;
    const impact = simulateImpact(
      barrelTip({ ...tanks[0]!, angle }),
      angle,
      power,
      { gravity: DEFAULT_WORLD.gravity, wind },
      mask,
    );
    expect(impact).not.toBeNull();
    ai.x = Math.round(impact!.pos.x);
    ai.y = mask.surfaceY(ai.x);
    useGameStore.getState().setAim(angle, power);
    const aiX = ai.x;
    game.fire();
    // Az AI tankot a játékos nem mozgathatja kitérésként.
    expect(useGameStore.getState().canDodge).toBe(false);
    game.move(1);
    expect(ai.x).toBe(aiX);
    vi.advanceTimersByTime(3000);
    expect(ai.x).not.toBe(aiX);
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
    expect(useGameStore.getState().campaignNewRoutes).toEqual([]);
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

  it("starts an independent campaign sector without prior sector completions", () => {
    expect(game.startCampaign("prime-00")).toBe(true);
    expect(useGameStore.getState().sector.id).toBe("prime-00");
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
