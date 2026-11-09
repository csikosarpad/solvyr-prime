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
    });
    expect(parseCampaignContent(extended).sector.locations).toHaveLength(4);
    expect(() => missionById("missing")).toThrow("Unknown");
  });
});
