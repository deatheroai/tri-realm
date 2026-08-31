import type { Vec3 } from "../math/vec3";
import type { EntityRef, PlacedStructure, Portal, RealmMap, TerrainField } from "./realmMap";

/**
 * Generic save/load for a `RealmMap` + its entity state (`BACKLOG.md`
 * Phase 1b). Realm-agnostic: works against `RealmMap`'s shape only, so
 * it's exercised against land data first (the only realm that exists
 * yet) without knowing anything land-specific — air/sea use it unchanged.
 *
 * `RealmMapStorageDriver` matches the small subset of the Web Storage API
 * (`localStorage`) this needs — injected rather than reaching for
 * `window.localStorage` directly, so this file stays pure/testable (unit
 * tests run under Vitest's "node" environment — no DOM, no `localStorage`
 * global) and the backend is swappable later (e.g. a real server) without
 * touching callers. `main.ts` passes the real `window.localStorage`.
 */
export interface RealmMapStorageDriver {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const STORAGE_KEY_PREFIX = "tri-realm:map:";

function storageKeyFor(mapId: string): string {
  return `${STORAGE_KEY_PREFIX}${mapId}`;
}

export function serializeRealmMap(map: RealmMap): string {
  return JSON.stringify(map);
}

/**
 * Parses and structurally validates a serialized `RealmMap`. Never
 * throws — returns null for anything malformed, foreign, or from an
 * incompatible future format, so a corrupted/unexpected save falls back
 * to a fresh map instead of crashing the app.
 */
export function deserializeRealmMap(json: string): RealmMap | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  return isRealmMap(parsed) ? parsed : null;
}

export function saveRealmMap(map: RealmMap, storage: RealmMapStorageDriver): void {
  storage.setItem(storageKeyFor(map.id), serializeRealmMap(map));
}

/** Loads a previously-saved `RealmMap` by id, or null if there is none
 * (or it failed to parse/validate) — callers fall back to a fresh map. */
export function loadRealmMap(mapId: string, storage: RealmMapStorageDriver): RealmMap | null {
  const raw = storage.getItem(storageKeyFor(mapId));
  return raw === null ? null : deserializeRealmMap(raw);
}

export function clearRealmMap(mapId: string, storage: RealmMapStorageDriver): void {
  storage.removeItem(storageKeyFor(mapId));
}

function isVec3(value: unknown): value is Vec3 {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.x === "number" && typeof v.y === "number" && typeof v.z === "number";
}

function isPlacedStructure(value: unknown): value is PlacedStructure {
  if (typeof value !== "object" || value === null) return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.id === "string" &&
    typeof s.type === "string" &&
    isVec3(s.position) &&
    typeof s.rotation === "number" &&
    typeof s.realmMapId === "string"
  );
}

function isEntityRef(value: unknown): value is EntityRef {
  if (typeof value !== "object" || value === null) return false;
  const e = value as Record<string, unknown>;
  return typeof e.id === "string" && isVec3(e.position);
}

function isPortal(value: unknown): value is Portal {
  if (typeof value !== "object" || value === null) return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    isVec3(p.position) &&
    typeof p.targetRealmMapId === "string" &&
    isVec3(p.targetSpawnPosition) &&
    typeof p.kind === "string"
  );
}

// Doesn't check `kind` against a fixed set of values — new realms register
// new terrain kinds (see sampleTerrainHeight in realmMap.ts) without this
// validator needing to change.
function isTerrainField(value: unknown): value is TerrainField {
  return typeof value === "object" && value !== null && typeof (value as Record<string, unknown>).kind === "string";
}

function isRealmMap(value: unknown): value is RealmMap {
  if (typeof value !== "object" || value === null) return false;
  const m = value as Record<string, unknown>;
  const bounds = m.bounds as Record<string, unknown> | null;
  return (
    typeof m.id === "string" &&
    (m.realm === "land" || m.realm === "air" || m.realm === "sea") &&
    typeof bounds === "object" &&
    bounds !== null &&
    typeof bounds.width === "number" &&
    typeof bounds.depth === "number" &&
    isTerrainField(m.terrain) &&
    Array.isArray(m.structures) &&
    m.structures.every(isPlacedStructure) &&
    Array.isArray(m.entities) &&
    m.entities.every(isEntityRef) &&
    Array.isArray(m.portals) &&
    m.portals.every(isPortal)
  );
}
