import { afterEach, describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createCastlePieceMesh } from "./placement";
import { CASTLE_STRUCTURE_TYPES, findCastleStructureType } from "./castleStructures";
import { upgradeCastlePieceToRealModel, __resetRealCastlePieceModelCacheForTests } from "./realCastlePieceModels";

function fakeGltf(scene: THREE.Object3D) {
  return { scene, animations: [], scenes: [scene], cameras: [], asset: {} } as never;
}

// A bare box, same shape createCastlePieceMesh itself builds — used here
// instead of createCastlePieceMesh so each test calls
// upgradeCastlePieceToRealModel exactly once (createCastlePieceMesh
// already calls it internally; calling it a second time on the same box
// would double the loaded model, since the cache serves the same resolved
// promise to both calls). Added to a wrapping Group, matching main.ts's
// own scene.add(piece) right after createCastlePieceMesh returns — real
// models are added as a *sibling* of the box (box.parent.add(...), not
// box.add(...): three.js's renderer stops descending into an invisible
// object's children entirely, so a child nested under an invisible box
// would go invisible right along with it — found by actually rendering
// and looking, see this module's own comment), so a parent is required
// for the upgrade to have anywhere to put the model at all.
function bareBoxInScene(typeId: string): { box: THREE.Mesh; scene: THREE.Group } {
  const { width, height, depth } = findCastleStructureType(typeId).dimensions;
  const box = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth));
  const scene = new THREE.Group();
  scene.add(box);
  return { box, scene };
}

describe("upgradeCastlePieceToRealModel", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    __resetRealCastlePieceModelCacheForTests();
  });

  it("every catalog type with a realModel is one of the Quaternius-sourced ones", () => {
    // Not every type needs one — Tower (BACKLOG.md's "structure types
    // beyond castles" item) deliberately shipped as a plain box, same
    // Phase 1a discipline Keep/Wall/Gate themselves started under.
    const withRealModel = CASTLE_STRUCTURE_TYPES.filter((t) => t.realModel !== undefined).map((t) => t.id);
    expect(withRealModel.sort()).toEqual(["castle-gate", "castle-keep", "castle-wall"]);
  });

  it("no-ops for a type with no realModel configured, leaving the box exactly as it was", async () => {
    const loadAsyncSpy = vi.spyOn(GLTFLoader.prototype, "loadAsync");

    const { box, scene } = bareBoxInScene("castle-tower");
    await upgradeCastlePieceToRealModel(box, "castle-tower");

    expect(loadAsyncSpy).not.toHaveBeenCalled();
    expect(box.visible).toBe(true);
    expect(scene.children).toEqual([box]);
  });

  it("'replace-ground' (Wall/Gate): hides the box and adds the loaded model as its sibling, base on the ground", async () => {
    const fakeModel = new THREE.Group();
    vi.spyOn(GLTFLoader.prototype, "loadAsync").mockResolvedValue(fakeGltf(fakeModel));

    const { box, scene } = bareBoxInScene("castle-wall");
    expect(box.visible).toBe(true); // synchronous default, before the upgrade lands

    await upgradeCastlePieceToRealModel(box, "castle-wall");

    expect(box.visible).toBe(false);
    // A sibling in the scene, NOT a child of the (now invisible) box —
    // the actual bug this shape fixes (reported with a screenshot: a
    // placed Wall/Gate rendered as nothing at all).
    expect(box.children).toHaveLength(0);
    const visual = scene.children.find((c) => c !== box);
    expect(visual).toBeDefined();
    expect(visual).not.toBe(fakeModel); // cloned, not the shared cached scene
    expect(visual!.position.y).toBeCloseTo(-1.55, 5); // box.position.y (0) - castle-wall's own height/2
  });

  it("'roof-cap' (Keep): keeps the box visible and adds the model as a sibling on top, additive only", async () => {
    const fakeModel = new THREE.Group();
    vi.spyOn(GLTFLoader.prototype, "loadAsync").mockResolvedValue(fakeGltf(fakeModel));

    const { box, scene } = bareBoxInScene("castle-keep");
    await upgradeCastlePieceToRealModel(box, "castle-keep");

    expect(box.visible).toBe(true);
    expect(box.children).toHaveLength(0);
    const visual = scene.children.find((c) => c !== box);
    expect(visual).toBeDefined();
    expect(visual!.position.y).toBeCloseTo(0.7, 5); // castle-keep's own height/2
  });

  it("scales the loaded model by the catalog entry's own measured scale", async () => {
    const fakeModel = new THREE.Group();
    vi.spyOn(GLTFLoader.prototype, "loadAsync").mockResolvedValue(fakeGltf(fakeModel));

    const { box, scene } = bareBoxInScene("castle-keep");
    await upgradeCastlePieceToRealModel(box, "castle-keep");

    const visual = scene.children.find((c) => c !== box)!;
    expect(visual.scale.x).toBeCloseTo(0.28, 5);
  });

  it("positions the model at the box's own x/z, not just a bare local offset", async () => {
    const fakeModel = new THREE.Group();
    vi.spyOn(GLTFLoader.prototype, "loadAsync").mockResolvedValue(fakeGltf(fakeModel));

    const { box, scene } = bareBoxInScene("castle-wall");
    box.position.set(5, 0, -3); // as if main.ts had already positioned it before scene.add
    await upgradeCastlePieceToRealModel(box, "castle-wall");

    const visual = scene.children.find((c) => c !== box)!;
    expect(visual.position.x).toBe(5);
    expect(visual.position.z).toBe(-3);
  });

  it("gives two placements of the same type their own independent visual, instead of fighting over one shared object", async () => {
    // Same real regression AvatarView already guards against for two
    // simultaneous avatar skins (avatarView.test.ts) — here, two placed
    // pieces of the same type sharing one cached gltf.scene.
    const fakeModel = new THREE.Group();
    fakeModel.add(new THREE.Mesh(new THREE.BoxGeometry()));
    vi.spyOn(GLTFLoader.prototype, "loadAsync").mockResolvedValue(fakeGltf(fakeModel));

    const a = bareBoxInScene("castle-wall");
    const b = bareBoxInScene("castle-wall");
    await Promise.all([
      upgradeCastlePieceToRealModel(a.box, "castle-wall"),
      upgradeCastlePieceToRealModel(b.box, "castle-wall"),
    ]);

    const visualA = a.scene.children.find((c) => c !== a.box);
    const visualB = b.scene.children.find((c) => c !== b.box);
    expect(visualA).toBeDefined();
    expect(visualB).toBeDefined();
    expect(visualA).not.toBe(visualB);
  });

  it("leaves the box visible and unmodified if the model fails to load — the box already is the safe fallback", async () => {
    vi.spyOn(GLTFLoader.prototype, "loadAsync").mockRejectedValue(new Error("network blocked"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { box, scene } = bareBoxInScene("castle-wall");
    await upgradeCastlePieceToRealModel(box, "castle-wall");

    expect(box.visible).toBe(true);
    expect(scene.children).toEqual([box]); // nothing added
    expect(box.geometry).toBeInstanceOf(THREE.BoxGeometry);
  });
});

describe("createCastlePieceMesh (real-model wiring)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    __resetRealCastlePieceModelCacheForTests();
  });

  it("still returns the plain box synchronously, unchanged, even for a type with a realModel configured", () => {
    // createCastlePieceMesh itself must never become async — placement,
    // save/load reconstruction, and every existing test all call it
    // expecting a real THREE.Mesh back immediately.
    vi.spyOn(GLTFLoader.prototype, "loadAsync").mockReturnValue(new Promise(() => {})); // never resolves
    const mesh = createCastlePieceMesh("castle-wall");

    expect(mesh).toBeInstanceOf(THREE.Mesh);
    expect(mesh.geometry).toBeInstanceOf(THREE.BoxGeometry);
    expect(mesh.visible).toBe(true);
  });
});
