import { describe, expect, it } from "vitest";
import {
  clearRealmMap,
  deserializeRealmMap,
  loadRealmMap,
  saveRealmMap,
  serializeRealmMap,
  type RealmMapStorageDriver,
} from "./realmMapStorage";
import type { RealmMap } from "./realmMap";

/** In-memory stand-in for `localStorage` — Vitest runs unit tests under a
 * "node" environment (no DOM/localStorage global), and this keeps the
 * module under test decoupled from any particular storage backend. */
function fakeStorage(): RealmMapStorageDriver {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

function sampleMap(): RealmMap {
  return {
    id: "land-01",
    realm: "land",
    bounds: { width: 50, depth: 50 },
    terrain: { kind: "land-heightfield" },
    structures: [
      {
        id: "land-01-structure-1",
        type: "castle-keep",
        position: { x: 1, y: 2, z: 3 },
        rotation: 0,
        realmMapId: "land-01",
        materialId: "sandstone",
      },
    ],
    entities: [{ id: "player", position: { x: 4, y: 5, z: 6 } }],
    portals: [],
  };
}

describe("serializeRealmMap / deserializeRealmMap", () => {
  it("round-trips a RealmMap exactly", () => {
    const map = sampleMap();

    const roundTripped = deserializeRealmMap(serializeRealmMap(map));

    expect(roundTripped).toEqual(map);
  });

  it("returns null for invalid JSON instead of throwing", () => {
    expect(deserializeRealmMap("not json{{{")).toBeNull();
  });

  it("returns null for well-formed JSON that isn't a RealmMap", () => {
    expect(deserializeRealmMap(JSON.stringify({ hello: "world" }))).toBeNull();
    expect(deserializeRealmMap(JSON.stringify({ ...sampleMap(), realm: "ocean" }))).toBeNull();
    expect(deserializeRealmMap(JSON.stringify({ ...sampleMap(), structures: "not-an-array" }))).toBeNull();
  });
});

describe("saveRealmMap / loadRealmMap / clearRealmMap", () => {
  it("saves and loads a map by its id", () => {
    const storage = fakeStorage();
    const map = sampleMap();

    saveRealmMap(map, storage);

    expect(loadRealmMap(map.id, storage)).toEqual(map);
  });

  it("returns null when nothing has been saved for that id", () => {
    const storage = fakeStorage();

    expect(loadRealmMap("land-01", storage)).toBeNull();
  });

  it("keeps different map ids independent", () => {
    const storage = fakeStorage();
    const land = sampleMap();
    const other: RealmMap = { ...sampleMap(), id: "air-01", realm: "air" };

    saveRealmMap(land, storage);
    saveRealmMap(other, storage);

    expect(loadRealmMap(land.id, storage)).toEqual(land);
    expect(loadRealmMap(other.id, storage)).toEqual(other);
  });

  it("clearRealmMap removes a saved map", () => {
    const storage = fakeStorage();
    const map = sampleMap();
    saveRealmMap(map, storage);

    clearRealmMap(map.id, storage);

    expect(loadRealmMap(map.id, storage)).toBeNull();
  });
});
