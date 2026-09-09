import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createShipwreckMesh } from "./shipwreckMesh";

describe("createShipwreckMesh", () => {
  it("builds a distinctly-named group with two separate hull segments and a mast", () => {
    const wreck = createShipwreckMesh();

    expect(wreck).toBeInstanceOf(THREE.Group);
    expect(wreck.name).toBe("shipwreck");
    expect(wreck.getObjectByName("shipwreck-hull-main")).toBeInstanceOf(THREE.Mesh);
    expect(wreck.getObjectByName("shipwreck-hull-stern")).toBeInstanceOf(THREE.Mesh);
    expect(wreck.getObjectByName("shipwreck-mast")).toBeInstanceOf(THREE.Mesh);
    expect(wreck.getObjectByName("shipwreck-yard")).toBeInstanceOf(THREE.Mesh);
  });

  it("keeps the two hull segments apart — a real gap, so it reads as broken rather than one solid ship", () => {
    const wreck = createShipwreckMesh();
    const main = wreck.getObjectByName("shipwreck-hull-main")!;
    const stern = wreck.getObjectByName("shipwreck-hull-stern")!;

    const gap = main.position.distanceTo(stern.position);
    expect(gap).toBeGreaterThan(2);
  });

  it("tilts the two hull segments in different directions — listing, not upright", () => {
    const wreck = createShipwreckMesh();
    const main = wreck.getObjectByName("shipwreck-hull-main")!;
    const stern = wreck.getObjectByName("shipwreck-hull-stern")!;

    expect(main.rotation.z).not.toBe(0);
    expect(stern.rotation.z).not.toBe(0);
    expect(Math.sign(main.rotation.z)).not.toBe(Math.sign(stern.rotation.z));
  });

  it("leans the mast rather than standing it upright — reads as snapped", () => {
    const wreck = createShipwreckMesh();
    const mast = wreck.getObjectByName("shipwreck-mast")!;

    expect(mast.rotation.z).not.toBe(0);
  });

  it("is rooted at its own resting point — seaScene.ts positions the whole group via SEA_SHIPWRECK_POSITION alone", () => {
    const wreck = createShipwreckMesh();
    expect(wreck.position.x).toBe(0);
    expect(wreck.position.y).toBe(0);
    expect(wreck.position.z).toBe(0);
  });

  it("returns a fresh, independent instance each call", () => {
    const a = createShipwreckMesh();
    const b = createShipwreckMesh();

    expect(a).not.toBe(b);
  });
});
