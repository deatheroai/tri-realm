import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createAirScene } from "./airScene";

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

  it("includes scattered floating platforms for movement parallax", () => {
    const scene = createAirScene();

    const landmarks = scene.children.filter((child) => child.name === "landmark");

    expect(landmarks.length).toBeGreaterThan(0);
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
