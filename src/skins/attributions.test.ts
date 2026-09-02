import { describe, expect, it } from "vitest";
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
});
