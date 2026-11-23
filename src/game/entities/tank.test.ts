import { describe, expect, it } from "vitest";
import { computeStats } from "../systems/upgrades";
import { TerrainMask } from "../terrain/mask";
import { applyDamage, createTank, explosionDamage, hoverTank, moveTank, MOVE_BUDGET, regenTankShield, settleTank } from "./tank";

const flat = () => TerrainMask.fromHeightmap(new Float32Array(200).fill(100), 200);

describe("tank", () => {
  it("only a soldier can hover up to 60px and descend for one quarter of the cost", () => {
    const mask = flat();
    const soldier = createTank("a", 50, 0, 45, undefined, "soldier");
    const tank = createTank("b", 50, 0, 45);
    settleTank(soldier, mask);
    settleTank(tank, mask);
    expect(hoverTank(tank, -1, mask)).toBe(false);
    soldier.moveLeft = 75;
    for (let i = 0; i < 30; i++) expect(hoverTank(soldier, -1, mask)).toBe(true);
    expect(soldier).toMatchObject({ y: 40, moveLeft: 15, hovering: true });
    expect(hoverTank(soldier, -1, mask)).toBe(false);
    soldier.moveLeft = 100;
    expect(hoverTank(soldier, -1, mask)).toBe(false);
    expect(moveTank(soldier, 1, mask)).toBe(true);
    expect(soldier.y).toBe(40);
    settleTank(soldier, mask);
    expect(soldier.y).toBe(40);
    for (let i = 0; i < 30; i++) expect(hoverTank(soldier, 1, mask)).toBe(true);
    expect(soldier).toMatchObject({ y: 100, moveLeft: 83, hovering: false });
    expect(hoverTank(soldier, 1, mask)).toBe(false);
  });

  it("reserves enough movement for landing, including when moving over lower ground", () => {
    const heights = new Float32Array(200).fill(100);
    heights.fill(112, 52);
    const mask = TerrainMask.fromHeightmap(heights, 200);
    const soldier = createTank("a", 50, 0, 45, undefined, "soldier");
    settleTank(soldier, mask);
    expect(hoverTank(soldier, -1, mask)).toBe(true);
    soldier.moveLeft = 3;
    expect(moveTank(soldier, 1, mask)).toBe(false);
    expect(hoverTank(soldier, 1, mask)).toBe(true);
    expect(soldier).toMatchObject({ y: 100, moveLeft: 2.5, hovering: false });

    soldier.moveLeft = 60;
    for (let i = 0; i < 30; i++) hoverTank(soldier, -1, mask);
    expect(soldier).toMatchObject({ y: 52, moveLeft: 12, hovering: true });
    expect(moveTank(soldier, -1, mask)).toBe(false);
    for (let i = 0; i < 30; i++) hoverTank(soldier, 1, mask);
    expect(soldier).toMatchObject({ y: 100, moveLeft: 0, hovering: false });
  });

  it("blocks hovering movement through terrain and beyond the height limit over a drop", () => {
    const hm = new Float32Array(200).fill(100);
    hm.fill(70, 52, 70);
    hm.fill(180, 70);
    const mask = TerrainMask.fromHeightmap(hm, 200);
    const soldier = createTank("a", 50, 0, 45, undefined, "soldier");
    settleTank(soldier, mask);
    expect(hoverTank(soldier, -1, mask)).toBe(true);
    expect(moveTank(soldier, 1, mask)).toBe(false);
    soldier.x = 68;
    expect(moveTank(soldier, 1, mask)).toBe(false);
  });

  it("a talajra igazodik", () => {
    const t = createTank("a", 50, 0, 45);
    settleTank(t, flat());
    expect(t.y).toBe(100);
  });

  it("a mozgás fogyasztja a keretet, és a keret végén megáll", () => {
    const mask = flat();
    const t = createTank("a", 50, 0, 45);
    settleTank(t, mask);
    let steps = 0;
    while (moveTank(t, 1, mask)) steps++;
    expect(steps * 2).toBe(MOVE_BUDGET);
    expect(t.moveLeft).toBe(0);
  });

  it("a meredek fal megállítja", () => {
    const hm = new Float32Array(200).fill(100);
    for (let x = 60; x < 200; x++) hm[x] = 50;
    const mask = TerrainMask.fromHeightmap(hm, 200);
    const t = createTank("a", 55, 0, 45);
    settleTank(t, mask);
    expect(moveTank(t, 1, mask)).toBe(true);
    t.x = 59;
    expect(moveTank(t, 1, mask)).toBe(false);
  });

  it("a sebzés a távolsággal csökken, és a hp nem megy 0 alá", () => {
    const t = createTank("a", 50, 0, 45);
    settleTank(t, flat());
    const near = explosionDamage(t, 50, 94, 30);
    const far = explosionDamage(t, 150, 94, 30);
    expect(near).toBeGreaterThan(far);
    expect(far).toBe(0);
    applyDamage(t, 999);
    expect(t.hp).toBe(0);
  });

  it("a sebzést előbb a pajzs, majd a páncél nyeli el, a HP csak utána sérül", () => {
    const t = createTank("a", 50, 0, 45, computeStats({ shield: 1, armor: 1 }));
    expect(t).toMatchObject({ shield: 20, armor: 20, hp: 100 });
    applyDamage(t, 10);
    expect(t).toMatchObject({ shield: 10, armor: 20, hp: 100 });
    applyDamage(t, 25);
    expect(t).toMatchObject({ shield: 0, armor: 5, hp: 100 });
    applyDamage(t, 15);
    expect(t).toMatchObject({ shield: 0, armor: 0, hp: 90 });
  });

  it("a páncél nem töltődik vissza, a pajzs igen", () => {
    const t = createTank("a", 50, 0, 45, computeStats({ shield: 1, armor: 1 }));
    applyDamage(t, 40);
    expect(t).toMatchObject({ shield: 0, armor: 0 });
    regenTankShield(t);
    regenTankShield(t);
    expect(t).toMatchObject({ shield: 4, armor: 0 });
  });

  it("találat után a következő körben nincs pajzsvisszatöltés, utána újra van", () => {
    const t = createTank("a", 50, 0, 45, computeStats({ shield: 1 }));
    applyDamage(t, 10);
    regenTankShield(t);
    expect(t.shield).toBe(10);
    regenTankShield(t);
    expect(t.shield).toBe(14);
  });

  it("a pajzs körönként a maximum 20%-ával töltődik vissza", () => {
    const t = createTank("a", 50, 0, 45, computeStats({ shield: 5 }));
    applyDamage(t, 100);
    expect(t.shield).toBe(0);
    regenTankShield(t);
    expect(t.shield).toBe(0);
    regenTankShield(t);
    expect(t.shield).toBe(20);
    regenTankShield(t);
    expect(t.shield).toBe(40);
  });

  it("pajzs nélküli tanknál a visszatöltés nem csinál semmit", () => {
    const t = createTank("a", 50, 0, 45);
    regenTankShield(t);
    expect(t.shield).toBe(0);
  });
});
