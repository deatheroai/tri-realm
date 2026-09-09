import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createScene } from "./scene";
import { terrainHeightAt } from "./land/terrain";
import { LAND_DECORATION_POSITIONS } from "./world/landDecorations";

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

  it("includes parkland decorations (trees, flower-beds, path, fountain) so the follow-camera has visual parallax", () => {
    const scene = createScene();

    const trees = scene.children.filter((child) => child.name === "tree");
    const flowerbeds = scene.children.filter((child) => child.name === "flowerbed");
    const paths = scene.children.filter((child) => child.name === "path");
    const fountains = scene.children.filter((child) => child.name === "fountain");

    expect(trees.length).toBeGreaterThan(0);
    expect(flowerbeds.length).toBeGreaterThan(0);
    expect(paths.length).toBeGreaterThan(0);
    expect(fountains).toHaveLength(1);
    // Every entry in the data array actually landed a mesh in the scene —
    // the array is the single source of truth a fork would edit.
    expect(trees.length + flowerbeds.length + paths.length + fountains.length).toBe(
      LAND_DECORATION_POSITIONS.length,
    );
  });

  it("places each decoration on the terrain surface at its data-array position", () => {
    const scene = createScene();

    for (const decoration of LAND_DECORATION_POSITIONS) {
      const expectedY = terrainHeightAt(decoration.x, decoration.z);
      const match = scene.children.find(
        (child) =>
          Math.abs(child.position.x - decoration.x) < 1e-6 &&
          Math.abs(child.position.z - decoration.z) < 1e-6 &&
          Math.abs(child.position.y - expectedY) < 1e-6,
      );
      expect(match, `no mesh found for decoration at (${decoration.x}, ${decoration.z})`).toBeTruthy();
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
