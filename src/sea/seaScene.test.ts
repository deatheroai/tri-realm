import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createSeaScene } from "./seaScene";
import { SEA_WRECKAGE_POSITIONS, SEA_AVATAR_SPAWN_Y, SEA_FLOOR_Y, SEA_SURFACE_Y } from "./seaRealmMap";

describe("createSeaScene", () => {
  it("includes a player avatar group with a default visual, a sea floor, and a water surface", () => {
    const scene = createSeaScene();

    const avatar = scene.getObjectByName("avatar");
    const floor = scene.getObjectByName("sea-floor");
    const surface = scene.getObjectByName("sea-surface");

    expect(avatar).toBeInstanceOf(THREE.Group);
    expect(avatar?.children).toHaveLength(1);
    expect(avatar?.children[0]).toBeInstanceOf(THREE.Mesh);
    expect(floor).toBeInstanceOf(THREE.Mesh);
    expect(surface).toBeInstanceOf(THREE.Mesh);
  });

  it("spawns the avatar mid-water, between the floor and the surface", () => {
    const scene = createSeaScene();
    const avatar = scene.getObjectByName("avatar");

    expect(avatar?.position.y).toBe(SEA_AVATAR_SPAWN_Y);
    expect(avatar?.position.y).toBeGreaterThan(SEA_FLOOR_Y);
    expect(avatar?.position.y).toBeLessThan(SEA_SURFACE_Y);
  });

  it("places the water surface at SEA_SURFACE_Y and the floor at/below SEA_FLOOR_Y", () => {
    const scene = createSeaScene();

    expect(scene.getObjectByName("sea-surface")?.position.y).toBe(SEA_SURFACE_Y);
    expect(scene.getObjectByName("sea-floor")!.position.y).toBeLessThanOrEqual(SEA_FLOOR_Y);
  });

  it("places one wreckage piece per SEA_WRECKAGE_POSITIONS entry, at that entry's position", () => {
    const scene = createSeaScene();

    const landmarks = scene.children.filter((child) => child.name === "landmark");

    expect(landmarks).toHaveLength(SEA_WRECKAGE_POSITIONS.length);
    const landmarkPositions = landmarks.map((l) => ({ x: l.position.x, y: l.position.y, z: l.position.z }));
    expect(landmarkPositions).toEqual(SEA_WRECKAGE_POSITIONS);
  });

  it("includes at least one light so the scene isn't pitch black", () => {
    const scene = createSeaScene();

    const lights = scene.children.filter((child) => child instanceof THREE.Light);

    expect(lights.length).toBeGreaterThan(0);
  });
});
