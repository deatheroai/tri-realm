import { describe, expect, it } from "vitest";
import { AVATAR_SKINS } from "./avatarSkins";
import { ATTRIBUTIONS } from "./attributions";

describe("ATTRIBUTIONS", () => {
  it("has at least one entry", () => {
    expect(ATTRIBUTIONS.length).toBeGreaterThan(0);
  });

  it("every entry has a non-empty asset, license, licenseUrl, and creator", () => {
    for (const entry of ATTRIBUTIONS) {
      expect(entry.asset).toBeTruthy();
      expect(entry.license).toBeTruthy();
      expect(entry.licenseUrl).toBeTruthy();
      expect(entry.creator).toBeTruthy();
    }
  });

  it("every licenseUrl and creatorUrl (when present) is a real https link", () => {
    for (const entry of ATTRIBUTIONS) {
      expect(entry.licenseUrl).toMatch(/^https:\/\//);
      if (entry.creatorUrl) {
        expect(entry.creatorUrl).toMatch(/^https:\/\//);
      }
    }
  });

  // The compliance-critical one: CC BY 4.0 legally requires attribution
  // wherever the asset ships. Regression guard so this specific entry can't
  // be silently dropped — everything else here is good practice, this one
  // is a license obligation.
  it("credits the Fox's CC BY 4.0 rigging and animation", () => {
    const entry = ATTRIBUTIONS.find((e) => e.asset.toLowerCase().includes("fox") && e.license.includes("BY"));
    expect(entry).toBeDefined();
    expect(entry?.creator).toContain("tomkranis");
  });

  it("has no duplicate assets", () => {
    const assets = ATTRIBUTIONS.map((e) => e.asset);
    expect(new Set(assets).size).toBe(assets.length);
  });

  // Regression guard for a real gap found 2026-09-12: Mannequin (and its
  // Quaternius-sourced animation library) had a full write-up in
  // public/assets/ATTRIBUTIONS.md but no matching entry here at all — this
  // file's own doc comment says it's meant to mirror that one, but nothing
  // enforced it. Rather than add a one-off "credits Mannequin" test (which
  // would only catch this one skin slipping again, not the next one),
  // generalize: every loaded (kind: "gltf") avatar skin must have at least
  // one credit entry whose asset text names it, keyed off the skin's own id
  // — matches how every existing entry is actually worded ("Fox ...", "Robot
  // model ...", "Princess model ...", "Mannequin model ...", "Female model
  // ..."), so a future gltf skin shipped without updating this file fails
  // automatically instead of silently shipping an incomplete credits screen.
  it("credits every loaded (gltf) avatar skin by name", () => {
    const gltfSkins = AVATAR_SKINS.filter((skin) => skin.kind === "gltf");
    expect(gltfSkins.length).toBeGreaterThan(0);
    for (const skin of gltfSkins) {
      const credited = ATTRIBUTIONS.some((entry) => entry.asset.toLowerCase().includes(skin.id.toLowerCase()));
      expect(credited, `expected an ATTRIBUTIONS entry naming "${skin.id}"`).toBe(true);
    }
  });
});
