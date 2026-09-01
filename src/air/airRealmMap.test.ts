import { describe, expect, it } from "vitest";
import { createAirRealmMap, AIR_MAP_SIZE } from "./airRealmMap";

describe("createAirRealmMap", () => {
  it("returns an air RealmMap with the expected shape", () => {
    const map = createAirRealmMap();

    expect(map.realm).toBe("air");
    expect(map.id).toBeTruthy();
    expect(map.terrain).toEqual({ kind: "air-open-volume" });
    expect(map.bounds).toEqual({ width: AIR_MAP_SIZE, depth: AIR_MAP_SIZE });
    expect(map.structures).toEqual([]);
    expect(map.entities).toEqual([]);
    expect(map.portals).toEqual([]);
  });

  it("returns a fresh, independent map each call", () => {
    const a = createAirRealmMap();
    const b = createAirRealmMap();

    expect(a).not.toBe(b);
    expect(a.structures).not.toBe(b.structures);
  });
});
