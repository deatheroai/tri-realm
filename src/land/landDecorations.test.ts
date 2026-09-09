import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  LAND_DECORATION_POSITIONS,
  createLandDecorationMesh,
  treeSwayAngle,
  type LandDecorationKind,
} from "./landDecorations";

describe("LAND_DECORATION_POSITIONS", () => {
  it("has at least one entry of every decoration kind", () => {
    const kinds = new Set(LAND_DECORATION_POSITIONS.map((d) => d.kind));
    const expectedKinds: LandDecorationKind[] = ["tree", "flowerBed", "pathStone", "fountain"];

    for (const kind of expectedKinds) {
      expect(kinds.has(kind)).toBe(true);
    }
  });

  it("has exactly one fountain — a single centerpiece, not several", () => {
    expect(LAND_DECORATION_POSITIONS.filter((d) => d.kind === "fountain")).toHaveLength(1);
  });

  it("connects the path stones to the fountain — every path stone sits strictly between spawn and the fountain", () => {
    const fountain = LAND_DECORATION_POSITIONS.find((d) => d.kind === "fountain")!;
    const pathStones = LAND_DECORATION_POSITIONS.filter((d) => d.kind === "pathStone");

    expect(pathStones.length).toBeGreaterThan(0);
    for (const stone of pathStones) {
      expect(Math.hypot(stone.x, stone.z)).toBeLessThan(Math.hypot(fountain.x, fountain.z));
    }
  });

  it("keeps every position a finite, deterministic literal (no NaN/Infinity from a bad formula)", () => {
    for (const { x, z } of LAND_DECORATION_POSITIONS) {
      expect(Number.isFinite(x)).toBe(true);
      expect(Number.isFinite(z)).toBe(true);
    }
  });
});

describe("createLandDecorationMesh", () => {
  it("builds a distinctly-named group per kind, rooted at ground level", () => {
    for (const kind of ["tree", "flowerBed", "pathStone", "fountain"] as LandDecorationKind[]) {
      const mesh = createLandDecorationMesh(kind);
      expect(mesh).toBeInstanceOf(THREE.Group);
      expect(mesh.name).toBe(kind);
      expect(mesh.position.y).toBe(0); // scene.ts positions the whole group via terrainHeightAt alone
      expect(mesh.children.length).toBeGreaterThan(0);
    }
  });

  it("returns a fresh, independent instance each call", () => {
    const a = createLandDecorationMesh("tree");
    const b = createLandDecorationMesh("tree");

    expect(a).not.toBe(b);
  });

  it("gives the fountain a distinct water accent above its rim", () => {
    const fountain = createLandDecorationMesh("fountain");
    const rim = fountain.getObjectByName("fountain-rim")!;
    const water = fountain.getObjectByName("fountain-water")!;

    expect(water.position.y).toBeGreaterThan(rim.position.y);
  });

  it("gives every flower bed the same fixed bloom layout — deterministic, not random", () => {
    const a = createLandDecorationMesh("flowerBed");
    const b = createLandDecorationMesh("flowerBed");
    const bloomsA = a.children.filter((c) => c.name === "flower-bed-bloom").map((c) => c.position.toArray());
    const bloomsB = b.children.filter((c) => c.name === "flower-bed-bloom").map((c) => c.position.toArray());

    expect(bloomsA.length).toBeGreaterThan(0);
    expect(bloomsA).toEqual(bloomsB);
  });
});

describe("treeSwayAngle", () => {
  it("is a deterministic, pure function of (elapsedSeconds, phaseSeed)", () => {
    expect(treeSwayAngle(4.2, 1.5)).toBe(treeSwayAngle(4.2, 1.5));
  });

  it("stays a gentle lean, not a cartoonish whip — well under a quarter turn", () => {
    for (let t = 0; t < 20; t += 0.37) {
      expect(Math.abs(treeSwayAngle(t, 0))).toBeLessThan(0.1);
    }
  });

  it("settles to no lean at all with zero elapsed time and zero phase", () => {
    expect(treeSwayAngle(0, 0)).toBe(0);
  });

  it("puts different phase seeds out of step with each other, not swaying in lockstep", () => {
    // Two seeds far enough apart that they can't land on the same angle by
    // coincidence at every sampled instant — real wind rippling across a
    // row of trees, not one puppet moving them all identically.
    const anglesA: number[] = [];
    const anglesB: number[] = [];
    for (let t = 0; t < 6; t += 0.5) {
      anglesA.push(treeSwayAngle(t, 0));
      anglesB.push(treeSwayAngle(t, Math.PI / 2));
    }
    expect(anglesA).not.toEqual(anglesB);
  });
});
