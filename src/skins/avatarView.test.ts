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

  it("sets a distinct diver-shaped group (not the plain capsule) as the visual for the dive-suit skin", async () => {
    const root = new THREE.Group();
    const view = new AvatarView(root);

    await view.setSkin("diveSuit");

    expect(view.skinId).toBe("diveSuit");
    expect(root.children).toHaveLength(1);
    // A Group of primitives (body + mask + tank), not a single Mesh like
    // the plain capsule — see createDiveSuitAvatarMesh.
    const visual = root.children[0];
    expect(visual).toBeInstanceOf(THREE.Group);
    expect(visual.children.length).toBeGreaterThan(1);
  });

  it("keeps the dive-suit visual's rendered height close to the plain capsule's — same body dimensions, just extra small accessories", async () => {
    const capsuleRoot = new THREE.Group();
    await new AvatarView(capsuleRoot).setSkin("capsule");
    const capsuleHeight =
      new THREE.Box3().setFromObject(capsuleRoot).max.y - new THREE.Box3().setFromObject(capsuleRoot).min.y;

    const diveSuitRoot = new THREE.Group();
    await new AvatarView(diveSuitRoot).setSkin("diveSuit");
    const diveSuitHeight =
      new THREE.Box3().setFromObject(diveSuitRoot).max.y - new THREE.Box3().setFromObject(diveSuitRoot).min.y;

    expect(diveSuitHeight).toBeGreaterThan(capsuleHeight * 0.9);
    expect(diveSuitHeight).toBeLessThan(capsuleHeight * 1.3);
  });

  // "bird" (dove/seagull white-cream) and "eagle" (golden-brown) share the
  // exact same shape (buildBirdShapedAvatarMesh) — only the color palette
  // and part-name prefix differ, picked together in the same 2026-09-10
  // color review. One loop covers both rather than duplicating three tests.
  for (const skinId of ["bird", "eagle"]) {
    it(`sets a distinct bird-shaped group (not the plain capsule) as the visual for the ${skinId} skin`, async () => {
      const root = new THREE.Group();
      const view = new AvatarView(root);

      await view.setSkin(skinId);

      expect(view.skinId).toBe(skinId);
      expect(root.children).toHaveLength(1);
      const visual = root.children[0];
      expect(visual).toBeInstanceOf(THREE.Group);
      // body + head + beak + 2 wings + tail
      expect(visual.children.length).toBeGreaterThanOrEqual(6);
    });

    it(`spreads the ${skinId}'s wings notably wider than its own body — the whole point of the shape`, async () => {
      const root = new THREE.Group();
      await new AvatarView(root).setSkin(skinId);
      const visual = root.children[0];

      const bodyMesh = visual.getObjectByName(`${skinId}-body`) as THREE.Mesh;
      const bodyRadius = (bodyMesh.geometry as THREE.CapsuleGeometry).parameters.radius;

      const box = new THREE.Box3().setFromObject(visual);
      const wingspan = box.max.x - box.min.x;

      expect(wingspan).toBeGreaterThan(bodyRadius * 4);
    });

    it(`mirrors the ${skinId}'s left and right wings symmetrically`, async () => {
      const root = new THREE.Group();
      await new AvatarView(root).setSkin(skinId);
      const visual = root.children[0];

      const rightWing = visual.getObjectByName(`${skinId}-wing-right`)!;
      const leftWing = visual.getObjectByName(`${skinId}-wing-left`)!;

      expect(leftWing.position.x).toBeCloseTo(-rightWing.position.x, 5);
      expect(leftWing.position.y).toBeCloseTo(rightWing.position.y, 5);
      expect(leftWing.position.z).toBeCloseTo(rightWing.position.z, 5);
      expect(leftWing.rotation.z).toBeCloseTo(-rightWing.rotation.z, 5);
    });
  }

  it("gives bird and eagle distinct color palettes, not just distinct labels", async () => {
    const birdRoot = new THREE.Group();
    await new AvatarView(birdRoot).setSkin("bird");
    const birdBody = birdRoot.children[0].getObjectByName("bird-body") as THREE.Mesh;
    const birdColor = (birdBody.material as THREE.MeshStandardMaterial).color.getHex();

    const eagleRoot = new THREE.Group();
    await new AvatarView(eagleRoot).setSkin("eagle");
    const eagleBody = eagleRoot.children[0].getObjectByName("eagle-body") as THREE.Mesh;
    const eagleColor = (eagleBody.material as THREE.MeshStandardMaterial).color.getHex();

    expect(birdColor).not.toBe(eagleColor);
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

  describe("hasAnimation", () => {
    it("is false for every state before any skin is set", () => {
      const root = new THREE.Group();
      const view = new AvatarView(root);

      expect(view.hasAnimation("idle")).toBe(false);
      expect(view.hasAnimation("swimIdle")).toBe(false);
    });

    it("is true only for clip names the active skin actually maps, false for ones it doesn't (e.g. swim on a non-swim skin)", async () => {
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
      await view.setSkin("fox"); // maps walk -> "Walk", no swimIdle/swimActive entry

      expect(view.hasAnimation("walk")).toBe(true);
      expect(view.hasAnimation("swimIdle")).toBe(false);
      expect(view.hasAnimation("swimActive")).toBe(false);
    });
  });

  describe("procedural idle/movement bob", () => {
    it("bobs a skin with no clip for the current state (capsule) — the visual's local y moves off 0 over time", async () => {
      const root = new THREE.Group();
      const view = new AvatarView(root);
      await view.setSkin("capsule");

      view.setMoveState("run"); // biggest amplitude, easiest to observe
      view.update(0.1);

      expect(root.children[0].position.y).not.toBe(0);
    });

    it("never bobs a skin that has a real clip for the current state — its own animation is untouched", async () => {
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
      await view.setSkin("fox"); // maps walk -> "Walk", a real clip

      view.setMoveState("walk");
      for (let i = 0; i < 5; i++) view.update(0.1);

      expect(root.children[0].position.y).toBe(0);
    });

    it("resets to 0 rather than carrying a stale offset when switching from a bobbing skin to an animated one", async () => {
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
      await view.setSkin("capsule");
      view.setMoveState("run");
      view.update(0.1);
      expect(root.children[0].position.y).not.toBe(0);

      await view.setSkin("fox");
      expect(root.children[0].position.y).toBe(0);
    });
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
