import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createScene } from "./scene";

describe("createScene", () => {
  it("includes a ground plane and a placeholder marker", () => {
    const scene = createScene();

    const ground = scene.getObjectByName("ground");
    const marker = scene.getObjectByName("marker");

    expect(ground).toBeInstanceOf(THREE.Mesh);
    expect(marker).toBeInstanceOf(THREE.Mesh);
  });

  it("includes at least one light so the scene isn't pitch black", () => {
    const scene = createScene();

    const lights = scene.children.filter((child) => child instanceof THREE.Light);

    expect(lights.length).toBeGreaterThan(0);
  });
});
