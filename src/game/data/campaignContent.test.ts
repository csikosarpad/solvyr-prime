import { describe, expect, it } from "vitest";
import { VEYLORA, missionById, missionBattlefield, parseCampaignContent } from "./campaignContent";

describe("campaign content", () => {
  it("loads the two planets and non-combat station from the bundled JSON", () => {
    expect(VEYLORA.sector.id).toBe("veylora-03");
    expect(VEYLORA.sector.locations.map((location) => location.kind)).toEqual(["planet", "planet", "station"]);
    expect(VEYLORA.missions).toHaveLength(2);
    expect(missionBattlefield(missionById("secure-lab")).strategicObjectives?.[0]?.type).toBe("RESEARCH_LAB");
    expect(parseCampaignContent(structuredClone(VEYLORA))).toEqual(VEYLORA);
  });

  it.each([
    null,
    { ...VEYLORA, schemaVersion: 2 },
    { ...VEYLORA, contentVersion: 1.5 },
    { ...VEYLORA, missions: [] },
    { ...VEYLORA, battlefields: [] },
    { ...VEYLORA, missions: [...VEYLORA.missions, VEYLORA.missions[0]] },
    { ...VEYLORA, sector: { ...VEYLORA.sector, name: "unknown.key" } },
    { ...VEYLORA, sector: { ...VEYLORA.sector, locations: [] } },
  ])("rejects malformed or incomplete content rather than substituting defaults", (raw) => {
    expect(() => parseCampaignContent(raw)).toThrow();
  });

  it("rejects bad terrain, positions, AI values and missing protection references", () => {
    const terrain = structuredClone(VEYLORA);
    terrain.battlefields[0]!.terrain!.points = [
      [0, 0.6],
      [0.7, 0.6],
    ];
    expect(() => parseCampaignContent(terrain)).toThrow("terrain");
    const slots = structuredClone(VEYLORA);
    slots.battlefields[1]!.strategicObjectiveSlots = [510, 520, 530];
    expect(() => parseCampaignContent(slots)).toThrow("Overlapping");
    const skill = structuredClone(VEYLORA);
    skill.missions[0]!.opponent.skill = 2;
    expect(() => parseCampaignContent(skill)).toThrow("number");
    const protection = structuredClone(VEYLORA);
    protection.missions[1]!.protection!.objectiveId = "missing";
    expect(() => parseCampaignContent(protection)).toThrow("protection");
  });

  it("requires one location per mission but accepts additional configured locations and missions", () => {
    const duplicate = structuredClone(VEYLORA);
    duplicate.sector.locations[2]!.missionIds = ["secure-mine"];
    expect(() => parseCampaignContent(duplicate)).toThrow("Duplicate");
    const extended = structuredClone(VEYLORA);
    extended.missions.push({ ...extended.missions[0]!, id: "additional-mine" });
    extended.sector.locations.push({
      id: "new-planet",
      kind: "planet",
      name: "veylora.mine",
      missionIds: ["additional-mine"],
      recipeIds: [],
    });
    expect(parseCampaignContent(extended).sector.locations).toHaveLength(4);
    expect(() => missionById("missing")).toThrow("Unknown");
  });

  it("validates reward amounts, economic references and station recipes", () => {
    expect(VEYLORA.missions[0]!.rewards.resources["industrial-ore"]).toBe(20);
    expect(VEYLORA.recipes[0]!.effect.maxEnergyShieldMultiplier).toBe(1.1);
    for (const amount of [-1, 0, 0.5, Infinity, NaN]) {
      const content = structuredClone(VEYLORA);
      content.missions[0]!.rewards.resources["industrial-ore"] = amount;
      expect(() => parseCampaignContent(content)).toThrow();
    }
    const missing = structuredClone(VEYLORA);
    missing.recipes[0]!.technologies = ["missing"];
    expect(() => parseCampaignContent(missing)).toThrow("economic");
    const station = structuredClone(VEYLORA);
    station.sector.locations[0]!.recipeIds = ["reinforced-shield"];
    expect(() => parseCampaignContent(station)).toThrow("station");
    const effect = structuredClone(VEYLORA);
    effect.recipes[0]!.effect.maxEnergyShieldMultiplier = 10;
    expect(() => parseCampaignContent(effect)).toThrow("number");
  });
});
