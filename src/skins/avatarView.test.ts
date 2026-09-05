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
    // Not fakeModel itself — AvatarView clones the loaded scene graph (see
    // the two-views-share-one-skin test below for why) — but a real clone
    // of it, not some unrelated object.
    expect(root.children[0]).not.toBe(fakeModel);
    expect(root.children[0]).toBeInstanceOf(THREE.Group);
  });

  it("gives two AvatarView instances their own independent visual for the same skin, instead of fighting over one shared object", async () => {
    // A real regression: land's and air's AvatarView (src/main.ts) can both
    // have "fox" selected at once. Before AvatarView cloned the loaded
    // scene graph, the second view.setSkin("fox") would silently steal the
    // model out from under the first (a three.js Object3D can only have
    // one parent) — this asserts both roots keep their own visible child.
    const fakeModel = new THREE.Group();
    fakeModel.add(new THREE.Mesh(new THREE.BoxGeometry()));
    const fakeClip = new THREE.AnimationClip("Walk", 1, []);
    vi.spyOn(GLTFLoader.prototype, "loadAsync").mockResolvedValue({
      scene: fakeModel,
      animations: [fakeClip],
      scenes: [fakeModel],
      cameras: [],
      asset: {},
    } as never);

    const rootA = new THREE.Group();
    const rootB = new THREE.Group();
    const viewA = new AvatarView(rootA);
    const viewB = new AvatarView(rootB);

    await Promise.all([viewA.setSkin("fox"), viewB.setSkin("fox")]);

    expect(rootA.children).toHaveLength(1);
    expect(rootB.children).toHaveLength(1);
    expect(rootA.children[0]).not.toBe(rootB.children[0]);
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

  describe("setVerticalPitch", () => {
    it("pitches toward level (no rotation) when vertical velocity is zero", () => {
      const root = new THREE.Group();
      root.rotation.x = 0.4; // start already tilted, as if just done diving
      const view = new AvatarView(root);

      view.setVerticalPitch(0, 1); // dt large enough to fully settle in one call
      expect(root.rotation.x).toBeCloseTo(0, 5);
    });

    it("pitches opposite signs for diving (negative velocity) vs. surfacing (positive velocity)", () => {
      const diveRoot = new THREE.Group();
      const diveView = new AvatarView(diveRoot);
      diveView.setVerticalPitch(-2, 1);

      const surfaceRoot = new THREE.Group();
      const surfaceView = new AvatarView(surfaceRoot);
      surfaceView.setVerticalPitch(2, 1);

      expect(diveRoot.rotation.x).not.toBeCloseTo(0, 5);
      expect(surfaceRoot.rotation.x).toBeCloseTo(-diveRoot.rotation.x, 5);
    });

    it("clamps the pitch angle rather than growing unbounded past the tuned max velocity", () => {
      const root = new THREE.Group();
      const view = new AvatarView(root);

      view.setVerticalPitch(2, 1);
      const atMax = root.rotation.x;
      view.setVerticalPitch(200, 1); // wildly beyond sea's real vertical range
      expect(root.rotation.x).toBeCloseTo(atMax, 5);
    });

    it("eases toward the target rather than snapping instantly for a small dt", () => {
      const root = new THREE.Group();
      const view = new AvatarView(root);

      // Positive (surfacing) velocity noses the model up, i.e. negative
      // rotation.x for this model's axis convention (verified against a
      // real side-on render, see setVerticalPitch's own comment).
      view.setVerticalPitch(2, 1 / 60);
      expect(root.rotation.x).toBeLessThan(0);
      expect(Math.abs(root.rotation.x)).toBeLessThan(Math.PI / 6); // well short of the full 30 degrees yet
    });
  });
});
