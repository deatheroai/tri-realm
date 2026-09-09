import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createAirScene } from "./airScene";
import { AIR_FLOATING_PLATFORM_POSITIONS } from "./airRealmMap";

describe("createAirScene", () => {
  it("includes a player avatar group with a default visual, and no ground", () => {
    const scene = createAirScene();

    const avatar = scene.getObjectByName("avatar");
    const ground = scene.getObjectByName("ground");

    expect(avatar).toBeInstanceOf(THREE.Group);
    expect(avatar?.children).toHaveLength(1);
    expect(avatar?.children[0]).toBeInstanceOf(THREE.Mesh);
    expect(ground).toBeUndefined(); // air is open volume, no ground plane
  });

  it("spawns the avatar above the origin, floating free", () => {
    const scene = createAirScene();
    const avatar = scene.getObjectByName("avatar");

    expect(avatar?.position.y).toBeGreaterThan(0);
  });

  it("places one cloud platform per AIR_FLOATING_PLATFORM_POSITIONS entry, at that entry's position", () => {
    // Was a plain "landmark"-named cylinder before the cloud-shaped
    // platform item (BACKLOG.md, 2026-09-08 design review) —
    // src/air/cloudMeshes.ts now names the group "cloud-platform".
    const scene = createAirScene();

    const platforms = scene.children.filter((child) => child.name === "cloud-platform");

    expect(platforms).toHaveLength(AIR_FLOATING_PLATFORM_POSITIONS.length);
    const platformPositions = platforms.map((p) => ({ x: p.position.x, y: p.position.y, z: p.position.z }));
    expect(platformPositions).toEqual(AIR_FLOATING_PLATFORM_POSITIONS);
  });

  it("includes at least one light so the scene isn't pitch black", () => {
    const scene = createAirScene();

    const lights = scene.children.filter((child) => child instanceof THREE.Light);

    expect(lights.length).toBeGreaterThan(0);
  });

  it("includes the air-land portal marker", () => {
    const scene = createAirScene();

    expect(scene.getObjectByName("portal-marker")).toBeInstanceOf(THREE.Group);
  });
});
