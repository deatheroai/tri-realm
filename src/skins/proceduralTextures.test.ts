import { describe, expect, it, beforeEach } from "vitest";
import * as THREE from "three";
import {
  generateTexturePixels,
  getProceduralTexture,
  __resetProceduralTextureCacheForTests,
  type ProceduralTextureKind,
} from "./proceduralTextures";

const KINDS: ProceduralTextureKind[] = ["sandstone", "slate", "timber", "gold"];

describe("generateTexturePixels", () => {
  it("returns an RGBA buffer sized for the requested tile", () => {
    const pixels = generateTexturePixels("sandstone", 8);
    expect(pixels.length).toBe(8 * 8 * 4);
  });

  it("is fully opaque — alpha is always 255", () => {
    const pixels = generateTexturePixels("slate", 16);
    for (let i = 3; i < pixels.length; i += 4) {
      expect(pixels[i]).toBe(255);
    }
  });

  it("keeps every channel within a valid byte range", () => {
    for (const kind of KINDS) {
      const pixels = generateTexturePixels(kind, 16);
      for (const value of pixels) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(255);
      }
    }
  });

  it("is grey, not colored — texture detail is shading-only, hue comes from BlockMaterialSkin.color", () => {
    const pixels = generateTexturePixels("gold", 16);
    for (let i = 0; i < pixels.length; i += 4) {
      expect(pixels[i]).toBe(pixels[i + 1]);
      expect(pixels[i + 1]).toBe(pixels[i + 2]);
    }
  });

  it("is deterministic — same kind and size always produce the same pattern", () => {
    const a = generateTexturePixels("timber", 32);
    const b = generateTexturePixels("timber", 32);
    expect(Array.from(a)).toEqual(Array.from(b));
  });

  it("gives each material kind a visually distinct pattern", () => {
    const patterns = KINDS.map((kind) => Array.from(generateTexturePixels(kind, 16)));
    for (let i = 0; i < patterns.length; i++) {
      for (let j = i + 1; j < patterns.length; j++) {
        expect(patterns[i]).not.toEqual(patterns[j]);
      }
    }
  });

  it("isn't a flat/uniform fill — the whole point is per-pixel variation", () => {
    for (const kind of KINDS) {
      const pixels = generateTexturePixels(kind, 16);
      const first = pixels[0];
      const varies = Array.from(pixels).some((v, i) => i % 4 === 0 && v !== first);
      expect(varies).toBe(true);
    }
  });
});

describe("getProceduralTexture", () => {
  beforeEach(() => {
    __resetProceduralTextureCacheForTests();
  });

  it("builds a THREE.DataTexture at the requested size", () => {
    const texture = getProceduralTexture("sandstone", 32);
    expect(texture).toBeInstanceOf(THREE.DataTexture);
    expect(texture.image.width).toBe(32);
    expect(texture.image.height).toBe(32);
  });

  it("tiles by repeating in both directions", () => {
    const texture = getProceduralTexture("slate", 16);
    expect(texture.wrapS).toBe(THREE.RepeatWrapping);
    expect(texture.wrapT).toBe(THREE.RepeatWrapping);
  });

  it("caches by kind — the same kind returns the same texture instance", () => {
    const a = getProceduralTexture("gold");
    const b = getProceduralTexture("gold");
    expect(a).toBe(b);
  });

  it("gives different kinds their own texture instance", () => {
    const sandstone = getProceduralTexture("sandstone");
    const timber = getProceduralTexture("timber");
    expect(sandstone).not.toBe(timber);
  });
});
