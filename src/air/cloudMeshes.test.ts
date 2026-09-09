import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createCloudPlatformMesh } from "./cloudMeshes";

describe("createCloudPlatformMesh", () => {
  it("builds a distinctly-named group made of several puff meshes, not a single primitive", () => {
    const cloud = createCloudPlatformMesh();

    expect(cloud).toBeInstanceOf(THREE.Group);
    expect(cloud.name).toBe("cloud-platform");
    const puffs = cloud.children.filter((c) => c.name === "cloud-puff");
    expect(puffs.length).toBeGreaterThan(1); // a cluster, not one lonely sphere
    for (const puff of puffs) {
      expect(puff).toBeInstanceOf(THREE.Mesh);
    }
  });

  it("is rooted at its own center — airScene.ts positions the whole group directly, no extra offset", () => {
    const cloud = createCloudPlatformMesh();
    expect(cloud.position.x).toBe(0);
    expect(cloud.position.y).toBe(0);
    expect(cloud.position.z).toBe(0);
  });

  it("flattens each puff vertically so the cluster reads as a wide/flat cloud, not a spherical pile", () => {
    const cloud = createCloudPlatformMesh();
    const puffs = cloud.children.filter((c) => c.name === "cloud-puff");

    for (const puff of puffs) {
      expect(puff.scale.y).toBeLessThan(1);
    }
  });

  it("is a fixed, deterministic layout — two calls produce identical puff positions, not a random cluster", () => {
    const a = createCloudPlatformMesh();
    const b = createCloudPlatformMesh();

    const positionsOf = (group: THREE.Group) =>
      group.children.filter((c) => c.name === "cloud-puff").map((c) => c.position.toArray());

    expect(positionsOf(a)).toEqual(positionsOf(b));
  });

  it("returns a fresh, independent instance each call", () => {
    const a = createCloudPlatformMesh();
    const b = createCloudPlatformMesh();

    expect(a).not.toBe(b);
  });
});
