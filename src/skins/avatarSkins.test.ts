import { describe, expect, it } from "vitest";
import { AVATAR_SKINS, DEFAULT_AVATAR_SKIN_ID, moveInputToAnimationState } from "./avatarSkins";

describe("AVATAR_SKINS catalog", () => {
  it("includes the default procedural skin and at least one real gltf skin", () => {
    const procedural = AVATAR_SKINS.find((s) => s.kind === "procedural");
    const gltf = AVATAR_SKINS.find((s) => s.kind === "gltf");

    expect(procedural).toBeDefined();
    expect(procedural?.id).toBe(DEFAULT_AVATAR_SKIN_ID);
    expect(gltf).toBeDefined();
    expect(gltf?.modelUrl).toBeTruthy();
  });

  it("has unique ids", () => {
    const ids = AVATAR_SKINS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every gltf skin declares a modelUrl", () => {
    for (const skin of AVATAR_SKINS) {
      if (skin.kind === "gltf") {
        expect(skin.modelUrl).toBeTruthy();
      }
    }
  });
});

describe("moveInputToAnimationState", () => {
  it("is idle when there is no input", () => {
    expect(moveInputToAnimationState(0, 0, false)).toBe("idle");
  });

  it("is walk when moving without run", () => {
    expect(moveInputToAnimationState(0, -1, false)).toBe("walk");
  });

  it("is run when moving with run held", () => {
    expect(moveInputToAnimationState(0, -1, true)).toBe("run");
  });

  it("ignores the run flag when there's no actual movement", () => {
    expect(moveInputToAnimationState(0, 0, true)).toBe("idle");
  });
});
