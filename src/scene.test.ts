import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createScene } from "./scene";
import { terrainHeightAt } from "./land/terrain";

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

  it("includes scattered landmarks so the follow-camera has visual parallax", () => {
    const scene = createScene();

    const landmarks = scene.children.filter((child) => child.name === "landmark");

    expect(landmarks.length).toBeGreaterThan(0);
  });

  it("includes at least one light so the scene isn't pitch black", () => {
    const scene = createScene();

    const lights = scene.children.filter((child) => child instanceof THREE.Light);

    expect(lights.length).toBeGreaterThan(0);
  });
});
