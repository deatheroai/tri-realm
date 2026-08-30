import { afterEach, describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { AvatarView, AVATAR_GROUND_OFFSET, __resetGltfCacheForTests } from "./avatarView";

describe("AVATAR_GROUND_OFFSET", () => {
  it("is a positive height", () => {
    expect(AVATAR_GROUND_OFFSET).toBeGreaterThan(0);
  });
});

describe("AvatarView", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    __resetGltfCacheForTests();
  });

  it("starts with no children until a skin is set", () => {
    const root = new THREE.Group();
    new AvatarView(root);
    expect(root.children).toHaveLength(0);
  });

  it("sets the procedural capsule as the visual for the capsule skin", async () => {
    const root = new THREE.Group();
    const view = new AvatarView(root);

    await view.setSkin("capsule");

    expect(view.skinId).toBe("capsule");
    expect(root.children).toHaveLength(1);
    expect(root.children[0]).toBeInstanceOf(THREE.Mesh);
  });

  it("loads a gltf skin and wires up its animation clips", async () => {
    const fakeModel = new THREE.Group();
    const fakeClip = new THREE.AnimationClip("Walk", 1, []);
    vi.spyOn(GLTFLoader.prototype, "loadAsync").mockResolvedValue({
      scene: fakeModel,
      animations: [fakeClip],
      scenes: [fakeModel],
      cameras: [],
      asset: {},
    } as never);

    const root = new THREE.Group();
    const view = new AvatarView(root);

    await view.setSkin("fox");

    expect(view.skinId).toBe("fox");
    expect(root.children).toHaveLength(1);
    expect(root.children[0]).toBe(fakeModel);
  });

  it("falls back to the procedural capsule if the gltf model fails to load", async () => {
    vi.spyOn(GLTFLoader.prototype, "loadAsync").mockRejectedValue(new Error("network blocked"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const root = new THREE.Group();
    const view = new AvatarView(root);

    await view.setSkin("fox");

    expect(view.skinId).toBe("capsule");
    expect(root.children).toHaveLength(1);
    expect(root.children[0]).toBeInstanceOf(THREE.Mesh);
  });

  it("does not throw when updating or changing move state with no animated skin active", () => {
    const root = new THREE.Group();
    const view = new AvatarView(root);

    expect(() => {
      view.setMoveState("walk");
      view.update(1 / 60);
      view.faceDirection(0, -1, 1 / 60);
    }).not.toThrow();
  });
});
