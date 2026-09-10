import { afterEach, describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createLandDecorationMesh } from "./landDecorations";
import { upgradeFlowerBedToRealModel, __resetRealFlowerModelCacheForTests, FLOWER_MODEL_SCALE } from "./realFlowerModel";

function fakeGltf(scene: THREE.Object3D) {
  return { scene, animations: [], scenes: [scene], cameras: [], asset: {} } as never;
}

describe("upgradeFlowerBedToRealModel", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    __resetRealFlowerModelCacheForTests();
  });

  it("hides the procedural stem/bloom/center children and adds the loaded model as a sibling", async () => {
    const fakeModel = new THREE.Group();
    vi.spyOn(GLTFLoader.prototype, "loadAsync").mockResolvedValue(fakeGltf(fakeModel));

    const bed = createLandDecorationMesh("flowerBed");
    const proceduralNames = ["flower-bed-stem", "flower-bed-bloom", "flower-bed-center"];
    const proceduralChildren = bed.children.filter((c) => proceduralNames.includes(c.name));
    expect(proceduralChildren.length).toBeGreaterThan(0); // synchronous default, before the upgrade lands
    for (const child of proceduralChildren) {
      expect(child.visible).toBe(true);
    }

    await upgradeFlowerBedToRealModel(bed);

    for (const child of proceduralChildren) {
      expect(child.visible).toBe(false);
    }
    const visual = bed.getObjectByName("flower-bed-real-model");
    expect(visual).toBeDefined();
    expect(visual).not.toBe(fakeModel); // cloned, not the shared cached scene
  });

  it("keeps the soil disc visible — only the bloom pieces are replaced", async () => {
    const fakeModel = new THREE.Group();
    vi.spyOn(GLTFLoader.prototype, "loadAsync").mockResolvedValue(fakeGltf(fakeModel));

    const bed = createLandDecorationMesh("flowerBed");
    await upgradeFlowerBedToRealModel(bed);

    const soil = bed.getObjectByName("flower-bed-soil");
    expect(soil).toBeDefined();
    expect(soil!.visible).toBe(true);
  });

  it("scales the loaded model by the measured constant", async () => {
    const fakeModel = new THREE.Group();
    vi.spyOn(GLTFLoader.prototype, "loadAsync").mockResolvedValue(fakeGltf(fakeModel));

    const bed = createLandDecorationMesh("flowerBed");
    await upgradeFlowerBedToRealModel(bed);

    const visual = bed.getObjectByName("flower-bed-real-model")!;
    expect(visual.scale.x).toBeCloseTo(FLOWER_MODEL_SCALE, 5);
  });

  it("gives two flower beds their own independent visual, instead of fighting over one shared object", async () => {
    // Same real regression AvatarView (and realCastlePieceModels) already
    // guard against — here, two flower beds sharing one cached gltf.scene.
    const fakeModel = new THREE.Group();
    fakeModel.add(new THREE.Mesh(new THREE.BoxGeometry()));
    vi.spyOn(GLTFLoader.prototype, "loadAsync").mockResolvedValue(fakeGltf(fakeModel));

    const bedA = createLandDecorationMesh("flowerBed");
    const bedB = createLandDecorationMesh("flowerBed");
    await Promise.all([upgradeFlowerBedToRealModel(bedA), upgradeFlowerBedToRealModel(bedB)]);

    const visualA = bedA.getObjectByName("flower-bed-real-model");
    const visualB = bedB.getObjectByName("flower-bed-real-model");
    expect(visualA).toBeDefined();
    expect(visualB).toBeDefined();
    expect(visualA).not.toBe(visualB);
  });

  it("leaves the procedural blooms visible and unmodified if the model fails to load", async () => {
    vi.spyOn(GLTFLoader.prototype, "loadAsync").mockRejectedValue(new Error("network blocked"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const bed = createLandDecorationMesh("flowerBed");
    const before = bed.children.map((c) => c.name);

    await upgradeFlowerBedToRealModel(bed);

    expect(bed.children.map((c) => c.name)).toEqual(before); // nothing added
    for (const child of bed.children) {
      expect(child.visible).toBe(true);
    }
  });
});

describe("createLandDecorationMesh('flowerBed') (real-model wiring)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    __resetRealFlowerModelCacheForTests();
  });

  it("still returns the procedural group synchronously, unchanged, even though a real model is configured", () => {
    vi.spyOn(GLTFLoader.prototype, "loadAsync").mockReturnValue(new Promise(() => {})); // never resolves
    const bed = createLandDecorationMesh("flowerBed");

    expect(bed).toBeInstanceOf(THREE.Group);
    expect(bed.children.some((c) => c.name === "flower-bed-bloom")).toBe(true);
  });
});
