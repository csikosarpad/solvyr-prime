import { describe, expect, it } from "vitest";
import { SECTORS, sectorById, sectorStatus, validateSectorGraph } from "./sectors";

describe("campaign sector graph", () => {
  it("contains five unique sectors and a reachable PRIME endpoint", () => {
    expect(SECTORS).toHaveLength(5);
    expect(() => validateSectorGraph(SECTORS)).not.toThrow();
    expect(sectorStatus("alpha-01", [])).toBe("available");
    expect(sectorStatus("prime-00", [])).toBe("locked");
    expect(sectorStatus("vanguard-12", ["alpha-01", "delta-08"])).toBe("locked");
    expect(sectorStatus("vanguard-12", ["alpha-01", "forge-17"])).toBe("available");
    expect(sectorStatus("forge-17", ["alpha-01", "delta-08", "vanguard-12", "prime-00"])).toBe("available");
  });

  it("puts protected structures in Forge and Prime only, with non-overlapping slots away from tank spawns", () => {
    expect(SECTORS.filter((sector) => sector.strategicObjectives?.length).map((sector) => sector.id)).toEqual([
      "forge-17",
      "prime-00",
    ]);
    for (const sector of SECTORS) {
      if (!sector.strategicObjectives) continue;
      const slots = sector.strategicObjectiveSlots!;
      expect(sector.strategicObjectives.map((objective) => objective.type)).toEqual(["ENERGY_NODE", "CIVIL_HABITAT"]);
      const maxWidth = Math.max(...sector.strategicObjectives.map((objective) => objective.width));
      for (const x of slots) {
        expect(x - maxWidth / 2).toBeGreaterThan(1280 * 0.12 + 12);
        expect(x + maxWidth / 2).toBeLessThan(1280 * 0.88 - 12);
      }
      for (let index = 1; index < slots.length; index++) {
        expect(slots[index]! - slots[index - 1]!).toBeGreaterThan(maxWidth);
      }
    }
  });
  it("rejects unknown IDs, missing references, cycles and duplicate IDs", () => {
    expect(() => sectorById("unknown")).toThrow("Unknown sector");
    expect(() => validateSectorGraph(SECTORS.slice(1))).toThrow("Missing");
    expect(() => validateSectorGraph([...SECTORS, SECTORS[0]!])).toThrow("Duplicate");
    expect(() =>
      validateSectorGraph(
        SECTORS.map((sector) => (sector.id === "alpha-01" ? { ...sector, prerequisites: ["prime-00"] } : sector)),
      ),
    ).toThrow("Cyclic");
  });
});
