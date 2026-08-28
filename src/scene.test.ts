import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createScene } from "./scene";

describe("createScene", () => {
  it("includes a ground plane and a player avatar", () => {
    const scene = createScene();

    const ground = scene.getObjectByName("ground");
    const avatar = scene.getObjectByName("avatar");

    expect(ground).toBeInstanceOf(THREE.Mesh);
    expect(avatar).toBeInstanceOf(THREE.Mesh);
  });

  it("places the avatar standing on the ground, not embedded in it", () => {
    const scene = createScene();
    const avatar = scene.getObjectByName("avatar");

    expect(avatar?.position.y).toBeGreaterThan(0);
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
