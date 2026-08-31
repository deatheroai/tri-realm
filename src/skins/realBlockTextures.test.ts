import { afterEach, describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { upgradeToRealTextures, __resetRealTextureCacheForTests } from "./realBlockTextures";

function fakeTexture(): THREE.Texture<HTMLImageElement> {
  const texture = new THREE.Texture<HTMLImageElement>();
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

describe("upgradeToRealTextures", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    __resetRealTextureCacheForTests();
  });

  it("swaps in the loaded color map and resets color to white when untinted", async () => {
    vi.spyOn(THREE.TextureLoader.prototype, "loadAsync").mockResolvedValue(fakeTexture());

    const material = new THREE.MeshStandardMaterial({ color: 0xb8a488 });
    upgradeToRealTextures(material, { color: "/assets/textures/sandstone/color.jpg" }, { tint: false });

    await vi.waitFor(() => expect(material.map).toBeInstanceOf(THREE.Texture));
    expect(material.color.getHex()).toBe(0xffffff);
  });

  it("keeps the material's color as a tint when tint is true", async () => {
    vi.spyOn(THREE.TextureLoader.prototype, "loadAsync").mockResolvedValue(fakeTexture());

    const material = new THREE.MeshStandardMaterial({ color: 0xd4af37 });
    upgradeToRealTextures(material, { color: "/assets/textures/gold/color.jpg" }, { tint: true });

    await vi.waitFor(() => expect(material.map).toBeInstanceOf(THREE.Texture));
    expect(material.color.getHex()).toBe(0xd4af37);
  });

  it("loads normal, roughness, and metalness maps into their own slots", async () => {
    vi.spyOn(THREE.TextureLoader.prototype, "loadAsync").mockResolvedValue(fakeTexture());

    const material = new THREE.MeshStandardMaterial();
    upgradeToRealTextures(
      material,
      {
        color: "/assets/textures/gold/color.jpg",
        normal: "/assets/textures/gold/normal.jpg",
        roughness: "/assets/textures/gold/roughness.jpg",
        metalness: "/assets/textures/gold/metalness.jpg",
      },
      { tint: true },
    );

    await vi.waitFor(() => {
      expect(material.map).toBeInstanceOf(THREE.Texture);
      expect(material.normalMap).toBeInstanceOf(THREE.Texture);
      expect(material.roughnessMap).toBeInstanceOf(THREE.Texture);
      expect(material.metalnessMap).toBeInstanceOf(THREE.Texture);
    });
  });

  it("raises metalness above its 0 default once a metalnessMap loads, so the map's own values actually take effect", async () => {
    vi.spyOn(THREE.TextureLoader.prototype, "loadAsync").mockResolvedValue(fakeTexture());

    const material = new THREE.MeshStandardMaterial(); // default metalness is 0
    upgradeToRealTextures(material, { color: "x.jpg", metalness: "metalness.jpg" }, { tint: true });

    // Not all the way to 1: this scene has no environment map, and a fully
    // metallic surface with only Ambient+Directional lighting renders
    // almost black (confirmed with a real screenshot) — see realBlockTextures.ts.
    await vi.waitFor(() => expect(material.metalness).toBeGreaterThan(0));
    expect(material.metalness).toBeLessThan(1);
  });

  it("leaves the existing map in place (the generated fallback) if the real texture fails to load", async () => {
    vi.spyOn(THREE.TextureLoader.prototype, "loadAsync").mockRejectedValue(new Error("404"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const fallback = fakeTexture();
    const material = new THREE.MeshStandardMaterial({ color: 0xb8a488, map: fallback });
    upgradeToRealTextures(material, { color: "/assets/textures/sandstone/color.jpg" }, { tint: false });

    await vi.waitFor(() => expect(console.error).toHaveBeenCalled());
    expect(material.map).toBe(fallback);
    expect(material.color.getHex()).toBe(0xb8a488); // untouched — never overwritten on failure
  });

  it("does nothing for a map slot with no url", async () => {
    const loadSpy = vi.spyOn(THREE.TextureLoader.prototype, "loadAsync").mockResolvedValue(fakeTexture());

    const material = new THREE.MeshStandardMaterial();
    upgradeToRealTextures(material, { color: "x.jpg" }, { tint: false });

    await vi.waitFor(() => expect(material.map).toBeInstanceOf(THREE.Texture));
    expect(loadSpy).toHaveBeenCalledTimes(1); // only the color map, not normal/roughness/metalness
  });

  it("caches by URL — loading the same texture twice only fetches it once", async () => {
    const loadSpy = vi.spyOn(THREE.TextureLoader.prototype, "loadAsync").mockResolvedValue(fakeTexture());

    const materialA = new THREE.MeshStandardMaterial();
    const materialB = new THREE.MeshStandardMaterial();
    upgradeToRealTextures(materialA, { color: "shared.jpg" }, { tint: false });
    upgradeToRealTextures(materialB, { color: "shared.jpg" }, { tint: false });

    await vi.waitFor(() => {
      expect(materialA.map).toBeInstanceOf(THREE.Texture);
      expect(materialB.map).toBeInstanceOf(THREE.Texture);
    });
    expect(loadSpy).toHaveBeenCalledTimes(1);
  });
});
