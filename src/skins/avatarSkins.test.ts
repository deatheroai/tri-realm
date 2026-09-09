import { describe, expect, it } from "vitest";
import {
  AVATAR_SKINS,
  DEFAULT_AVATAR_SKIN_ID,
  DIVE_SUIT_AVATAR_SKIN_ID,
  FALLBACK_AVATAR_SKIN_ID,
  bobOffset,
  moveInputToAnimationState,
  type MoveAnimationState,
} from "./avatarSkins";

describe("AVATAR_SKINS catalog", () => {
  it("includes a procedural fallback skin and at least one real gltf skin", () => {
    const procedural = AVATAR_SKINS.find((s) => s.kind === "procedural");
    const gltf = AVATAR_SKINS.find((s) => s.kind === "gltf");

    expect(procedural).toBeDefined();
    expect(gltf).toBeDefined();
    expect(gltf?.modelUrl).toBeTruthy();
  });

  it("DEFAULT_AVATAR_SKIN_ID names a real catalog entry", () => {
    expect(AVATAR_SKINS.some((s) => s.id === DEFAULT_AVATAR_SKIN_ID)).toBe(true);
  });

  it("FALLBACK_AVATAR_SKIN_ID names a procedural entry — it must never itself be able to fail to load", () => {
    const fallback = AVATAR_SKINS.find((s) => s.id === FALLBACK_AVATAR_SKIN_ID);
    expect(fallback?.kind).toBe("procedural");
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

  it("at least one skin declares real swim-specific animation clips (the long-open sea-swim-animation backlog item)", () => {
    const swimCapable = AVATAR_SKINS.filter(
      (s) => s.animationClipNames?.swimIdle && s.animationClipNames?.swimActive,
    );
    expect(swimCapable.length).toBeGreaterThan(0);
  });

  it("a skin with swimIdle also declares swimActive, and vice versa — half a swim mapping is a bug, not a valid state", () => {
    for (const skin of AVATAR_SKINS) {
      const hasIdle = Boolean(skin.animationClipNames?.swimIdle);
      const hasActive = Boolean(skin.animationClipNames?.swimActive);
      expect(hasIdle).toBe(hasActive);
    }
  });

  it("DIVE_SUIT_AVATAR_SKIN_ID names a real, procedural catalog entry (auto-equipped by main.ts's diving-house portal — no asset load to fail)", () => {
    const diveSuit = AVATAR_SKINS.find((s) => s.id === DIVE_SUIT_AVATAR_SKIN_ID);
    expect(diveSuit).toBeDefined();
    expect(diveSuit?.kind).toBe("procedural");
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

describe("bobOffset", () => {
  const states: MoveAnimationState[] = ["idle", "walk", "run", "swimIdle", "swimActive"];

  it("is exactly 0 at elapsedSeconds 0 for every state", () => {
    for (const state of states) {
      expect(bobOffset(0, state)).toBe(0);
    }
  });

  it("is a deterministic pure function of (elapsedSeconds, state)", () => {
    expect(bobOffset(1.234, "walk")).toBe(bobOffset(1.234, "walk"));
  });

  it("stays within a small, bounded amplitude — this is a subtle idle/movement cue, not a visible jump", () => {
    for (const state of states) {
      for (let t = 0; t < 10; t += 0.05) {
        expect(Math.abs(bobOffset(t, state))).toBeLessThanOrEqual(0.1);
      }
    }
  });

  it("run bobs with a bigger amplitude than idle — more motion while actually moving fast", () => {
    const maxAmplitude = (state: MoveAnimationState) => {
      let max = 0;
      for (let t = 0; t < 5; t += 0.01) max = Math.max(max, Math.abs(bobOffset(t, state)));
      return max;
    };
    expect(maxAmplitude("run")).toBeGreaterThan(maxAmplitude("idle"));
  });

  it("is periodic — repeats after its own period rather than drifting", () => {
    // idle's period is 2.4s (see BOB_PARAMS) — sampling a non-round elapsed
    // time one period later should reproduce the same value.
    expect(bobOffset(0.7, "idle")).toBeCloseTo(bobOffset(0.7 + 2.4, "idle"), 10);
  });
});
