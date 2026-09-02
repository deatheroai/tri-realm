import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createPortalMarkerMesh } from "./portalMarker";

describe("createPortalMarkerMesh", () => {
  it("builds a distinctly-named group with a balloon and a basket", () => {
    const marker = createPortalMarkerMesh();

    expect(marker).toBeInstanceOf(THREE.Group);
    expect(marker.name).toBe("portal-marker");
    expect(marker.getObjectByName("portal-marker-balloon")).toBeInstanceOf(THREE.Mesh);
    expect(marker.getObjectByName("portal-marker-basket")).toBeInstanceOf(THREE.Mesh);
  });

  it("returns a fresh, independent instance each call", () => {
    const a = createPortalMarkerMesh();
    const b = createPortalMarkerMesh();

    expect(a).not.toBe(b);
  });
});
