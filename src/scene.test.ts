import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createScene } from "./scene";
import { terrainHeightAt } from "./land/terrain";
import { LAND_DECORATION_POSITIONS } from "./land/landDecorations";

describe("createScene", () => {
  it("includes a ground plane and a player avatar group with a default visual", () => {
    const scene = createScene();

    const ground = scene.getObjectByName("ground");
    const avatar = scene.getObjectByName("avatar");

    expect(ground).toBeInstanceOf(THREE.Mesh);
    // The avatar is a Group so AvatarView can swap its visual child (skins);
    // it should start with exactly one child — the default procedural mesh.
    expect(avatar).toBeInstanceOf(THREE.Group);
    expect(avatar?.children).toHaveLength(1);
    expect(avatar?.children[0]).toBeInstanceOf(THREE.Mesh);
  });

  it("places the avatar standing on the terrain surface, not embedded in it", () => {
    const scene = createScene();
    const avatar = scene.getObjectByName("avatar");
    const spawnGroundHeight = terrainHeightAt(0, 0);

    expect(avatar?.position.y).toBeGreaterThan(spawnGroundHeight);
  });

  it("gives the ground mesh real height variation, not a flat plane", () => {
    const scene = createScene();
    const ground = scene.getObjectByName("ground") as THREE.Mesh;
    const position = ground.geometry.attributes.position;

    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < position.count; i++) {
      const z = position.getZ(i); // pre-rotation local z == world height
      min = Math.min(min, z);
      max = Math.max(max, z);
    }

    expect(max - min).toBeGreaterThan(1);
  });

  it("includes parkland dressing (trees/flower beds/path/fountain) so the follow-camera has visual parallax", () => {
    // Replaced the old plain-cylinder "landmark" meshes (BACKLOG.md,
    // 2026-09-08 design review) — one decoration group per
    // LAND_DECORATION_POSITIONS entry, named by its own kind
    // (src/land/landDecorations.ts) rather than a single generic name.
    const scene = createScene();

    const decorationKinds = new Set(LAND_DECORATION_POSITIONS.map((d) => d.kind));
    for (const kind of decorationKinds) {
      const matches = scene.children.filter((child) => child.name === kind);
      expect(matches.length).toBeGreaterThan(0);
    }
  });

  it("places one decoration group per LAND_DECORATION_POSITIONS entry, at that entry's terrain-matched position", () => {
    const scene = createScene();

    const decorations = scene.children.filter((child) =>
      LAND_DECORATION_POSITIONS.some((d) => d.kind === child.name),
    );

    expect(decorations).toHaveLength(LAND_DECORATION_POSITIONS.length);
    for (const { x, z } of LAND_DECORATION_POSITIONS) {
      const match = decorations.find((d) => d.position.x === x && d.position.z === z);
      expect(match).toBeDefined();
      expect(match!.position.y).toBeCloseTo(terrainHeightAt(x, z), 5);
    }
  });

  it("includes at least one light so the scene isn't pitch black", () => {
    const scene = createScene();

    const lights = scene.children.filter((child) => child instanceof THREE.Light);

    expect(lights.length).toBeGreaterThan(0);
  });

  it("includes the land-air portal marker", () => {
    const scene = createScene();

    expect(scene.getObjectByName("portal-marker")).toBeInstanceOf(THREE.Group);
  });
});
