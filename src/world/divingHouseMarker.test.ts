import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createDivingHouseMesh, createSeaPortalArchMesh } from "./divingHouseMarker";

describe("createDivingHouseMesh", () => {
  it("builds a distinctly-named group with walls, a roof, and a pothole", () => {
    const house = createDivingHouseMesh();

    expect(house).toBeInstanceOf(THREE.Group);
    expect(house.name).toBe("diving-house");
    expect(house.getObjectByName("diving-house-walls")).toBeInstanceOf(THREE.Mesh);
    expect(house.getObjectByName("diving-house-roof")).toBeInstanceOf(THREE.Mesh);
    expect(house.getObjectByName("diving-house-pothole")).toBeInstanceOf(THREE.Mesh);
  });

  it("returns a fresh, independent instance each call", () => {
    const a = createDivingHouseMesh();
    const b = createDivingHouseMesh();

    expect(a).not.toBe(b);
  });
});

describe("createSeaPortalArchMesh", () => {
  it("builds a distinctly-named group with two pillars and a lintel", () => {
    const arch = createSeaPortalArchMesh();

    expect(arch).toBeInstanceOf(THREE.Group);
    expect(arch.name).toBe("sea-portal-arch");
    expect(arch.getObjectByName("sea-portal-arch-left-pillar")).toBeInstanceOf(THREE.Mesh);
    expect(arch.getObjectByName("sea-portal-arch-right-pillar")).toBeInstanceOf(THREE.Mesh);
    expect(arch.getObjectByName("sea-portal-arch-lintel")).toBeInstanceOf(THREE.Mesh);
  });

  it("returns a fresh, independent instance each call", () => {
    const a = createSeaPortalArchMesh();
    const b = createSeaPortalArchMesh();

    expect(a).not.toBe(b);
  });
});
