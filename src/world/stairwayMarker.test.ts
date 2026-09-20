import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createStairwayMarkerMesh } from "./stairwayMarker";

describe("createStairwayMarkerMesh", () => {
  it("builds a distinctly-named group with a rising run of steps", () => {
    const marker = createStairwayMarkerMesh();

    expect(marker).toBeInstanceOf(THREE.Group);
    expect(marker.name).toBe("stairway-marker");
    expect(marker.getObjectByName("stairway-step-0")).toBeInstanceOf(THREE.Mesh);
    expect(marker.getObjectByName("stairway-step-7")).toBeInstanceOf(THREE.Mesh);
  });

  it("each step sits higher and further back than the last, forming a climb", () => {
    const marker = createStairwayMarkerMesh();
    const first = marker.getObjectByName("stairway-step-0");
    const last = marker.getObjectByName("stairway-step-7");

    expect(first).toBeDefined();
    expect(last).toBeDefined();
    expect(last!.position.y).toBeGreaterThan(first!.position.y);
    expect(last!.position.z).toBeLessThan(first!.position.z);
  });

  it("returns a fresh, independent instance each call", () => {
    const a = createStairwayMarkerMesh();
    const b = createStairwayMarkerMesh();

    expect(a).not.toBe(b);
  });
});
