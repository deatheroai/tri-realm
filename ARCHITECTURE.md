# Architecture

This describes tri-realm's intended technical shape. Decisions recorded
here trace back to `DECISIONS.md` — check there for the reasoning and
date; this doc just states the resulting design.

## Stack

- **Language/rendering:** TypeScript + [Three.js](https://threejs.org/).
- **Build tooling:** Vite (fast dev server, static production build).
- **Hosting:** static build deployed to Vercel — no server-side runtime
  assumed for the engine itself.
- **Testing:** Vitest for unit tests (pure logic — world/save/placement
  systems), Playwright for end-to-end coverage (movement, building,
  portals in a real browser). Both gate every commit per `AUTONOMY.md`.

This mirrors the stack already proven out in `deatheroai/testai`, chosen
specifically because it deploys cleanly to a free host and is testable in
CI without any native build step.

## World model

Each realm — **land**, **air**, **sea** — is a **separate map**, not a
region of one continuous 3D space. This is the "hybrid" model: separate,
independently buildable and testable worlds, unified by sharing one data
schema and one set of engine systems, rather than by occupying the same
physical coordinate space.

### `RealmMap` schema

The shape every realm's map data conforms to, regardless of which realm
it is:

```ts
interface RealmMap {
  id: string;                 // e.g. "land-01"
  realm: "land" | "air" | "sea";
  bounds: { width: number; depth: number };  // or a chunk/grid definition
  terrain: TerrainField;      // realm-specific meaning, shared shape:
                               //   land -> walkable ground height
                               //   sea  -> sea-floor depth + water surface
                               //   air  -> mostly open volume + floating terrain
  structures: PlacedStructure[];
  entities: EntityRef[];      // avatars/NPCs currently in this map
  portals: Portal[];          // named transition points to other realms
}

interface Portal {
  id: string;
  position: Vec3;
  targetRealmMapId: string;
  targetSpawnPosition: Vec3;
  kind: string;                // e.g. "stairway", "hot-air-balloon",
                                //      "dive-spot", "underground-passage",
                                //      "beach" — flavor, not structural
}

interface PlacedStructure {
  id: string;
  type: string;                // e.g. "castle-keep", "castle-wall"
  position: Vec3;
  rotation: number;
  realmMapId: string;
}
```

Because every realm's map is an instance of this one schema, the systems
that operate on it are written **once** and reused by all three realms:

- **Map loader** — parses a `RealmMap`, regardless of which realm it's for.
- **Save/load** — persists/restores `RealmMap` + entity state generically.
- **Structure placement validation** — checks a proposed `PlacedStructure`
  against `terrain`/existing structures; realm-specific rules (e.g. "can't
  place a castle on open water" vs. "can place a dock at the shoreline")
  are supplied as pluggable rule sets per realm, not separate systems.
- **Portal transition** — moves an avatar from one `RealmMap` to another by
  id, using shared logic regardless of source/target realm.

### Realm connections

Realms connect via **portals** — explicit, named transition points stored
in the map data, not a seamless walk/fly/swim between physical spaces:

- **Land ↔ Air:** e.g. a stairway or a hot-air-balloon launch point.
- **Land ↔ Sea:** e.g. a dive spot, an underground passage, or a beach.

The exact flavor of each portal is a content decision, not a structural
one (see `DECISIONS.md`'s Pending section) — the schema only requires that
a portal exist, point at a target map, and land the avatar at a spawn
position there.

### Distinct realm identity

Land, air, and sea are expected to feel genuinely different to move
through and build in — not the same controller reskinned. Each realm gets
its own movement module (below) and its own realm-appropriate floating/
terrain content (e.g. floating islands or platforms in air, floating docks
or wreckage in sea) — the specific content for air and sea is left to
judgement when each realm is actually scoped and built, per
`DECISIONS.md`.

## Avatar controller

A shared core, plus a pluggable movement module selected by whichever
realm's map the avatar currently occupies:

- **Shared core:** input handling, position/velocity state, camera rig,
  collision against the active `RealmMap`'s terrain.
- **Land module:** walk/run, gravity, ground collision, jump.
- **Air module** *(built when air realm is scoped)*: flight — free
  movement with its own feel (lift/momentum, not literally freefall-only).
- **Sea module** *(built when sea realm is scoped)*: swim/buoyancy —
  resistance and vertical drift distinct from both land and air.

A realm transition (via portal) swaps the active movement module and
teleports the avatar to the target map's spawn position — no continuous
blending between modules is required under this model.

## Construction system

- Structures (starting with castle pieces) are `PlacedStructure` entries
  on a `RealmMap`, validated on placement against that realm's terrain and
  placement rules.
- The placement/save/render pipeline is written once against the shared
  schema; only the *rule set* (what's placeable where) and the *structure
  catalog* (which structure types exist) vary per realm.

## Modularity

New realms, movement modules, or structure types are meant to extend this
system without reworking it:

- A new realm = a new `RealmMap` instance + a new movement module + a
  realm-specific placement rule set — not a new parallel engine.
- A new structure type = a new catalog entry + placement rule, reusing the
  existing `PlacedStructure` pipeline.
- A new movement type (e.g. mounted movement, gliding) = a new pluggable
  module behind the same avatar-core interface.

## Open questions

Tracked in `DECISIONS.md`'s Pending section as they come up (e.g. portal
flavor choices, cadence/workflow). This doc gets updated whenever a
structural decision changes what's written here.
