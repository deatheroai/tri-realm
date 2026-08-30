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

Implemented as real TypeScript types in `src/world/realmMap.ts` (`BACKLOG.md`
Phase 1b); `src/land/landRealmMap.ts` builds the hardcoded land instance the
Phase 1a prototype now runs against instead of scattered constants. The
shape every realm's map data conforms to, regardless of which realm it is:

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
- **Input is device-agnostic by construction.** Each input source (keyboard,
  touch joystick, and later anything else — gamepad, on-screen buttons)
  produces the same small `MoveInput` shape (`moveX`/`moveZ`/`run`)
  independently; sources are merged into one intent (`combineMoveInputs`)
  before movement logic ever sees them. A movement module never knows or
  cares which device produced its input — mobile support was added without
  touching `stepLandMovement` at all.
- **Land module:** walk/run, gravity, ground collision, jump.
- **Air module** *(built when air realm is scoped)*: flight — free
  movement with its own feel (lift/momentum, not literally freefall-only).
- **Sea module** *(built when sea realm is scoped)*: swim/buoyancy —
  resistance and vertical drift distinct from both land and air.

A realm transition (via portal) swaps the active movement module and
teleports the avatar to the target map's spawn position — no continuous
blending between modules is required under this model.

**Known gap:** the land module's ground collision has no concept of "too
steep to climb" — position snaps to `terrainHeightAt` every frame with no
max step-height check and no horizontal collision against steepness, so a
literal cliff or wall doesn't block movement today. Deliberately deferred
(see `DECISIONS.md`) rather than an oversight — a max-climbable-angle
check plus terrain-face collision is real, separate scope from the
current rolling-hill terrain, which never gets steep enough to expose it.

## Skins (visual identity)

Everything an object *looks like* — the avatar's model, a castle block's
material — is deliberately separate from what it *is* mechanically. This
mirrors the input-source split above: a movement module never knows which
input device drove it; equally, `stepLandMovement` and the placement/
raycasting logic never know which skin is currently rendering the avatar
or a block. Skins are swappable purely visually, live, with zero coupling
to game logic.

### Avatar skins (`src/skins/avatarSkins.ts`, `src/skins/avatarView.ts`)

- A small catalog (`AvatarSkin[]`) declares each option: `kind:
  "procedural"` (built from primitives, no asset dependency) or `kind:
  "gltf"` (a loaded model, with `modelUrl`, a `scale` to normalize its
  authored size to our world units, and `animationClipNames` mapping our
  three movement states — `idle`/`walk`/`run` — to that model's actual
  clip names).
- `AvatarView` owns the avatar's current visual inside the stable `Group`
  scene.ts creates (named `"avatar"`, positioned every frame by
  `main.ts` regardless of skin). `setSkin(id)` builds the new visual
  fully (including loading + wiring animations) *before* swapping it in,
  so there's never a frame where the avatar is invisible mid-load. A
  failed glTF load falls back to the procedural capsule automatically
  (logged, not thrown) — a skin can never brick the app.
- `moveInputToAnimationState` (pure, unit-tested) maps the same
  `MoveInput` movement already uses to an animation state; `AvatarView`
  crossfades between clips when it changes, and `faceDirection` smoothly
  turns the model to face its actual movement direction — necessary once
  a skin has a real "front" (unlike the rotationally-symmetric capsule).
- glTF loads are cached by URL (module-level `Map`) so switching back to
  an already-loaded skin is instant.

### Block materials (`src/skins/blockMaterials.ts`)

A simpler catalog of flat colors for now (`BLOCK_MATERIALS[]`) —
`createCastlePieceMesh(materialId)` picks one. Swapped for real textures
once a texture source is available (see `DECISIONS.md`); the catalog
shape doesn't need to change when that happens, just `color` becoming
`textureUrl` for a given entry.

### Dev skin switcher

A small on-screen panel (`#dev-skin-panel`, not child-facing UI — same
"labeled dev scaffolding" spirit as the touch-joystick's visual debug
aids) lists every catalog entry as a button; clicking one calls
`avatarView.setSkin()` or sets the active block-material id, live, no
redeploy. Exists specifically so asset iteration (swap a file, refresh,
click the button) doesn't require a rebuild/redeploy cycle per asset
tried.

### Where assets actually come from

This session's network policy blocks the free-asset sites (kenney.nl,
quaternius.com, ambientcg.com, itch.io, opengameart.org, polyhaven.com)
directly — confirmed as an organization egress policy denial, not a bug.
GitHub (`raw.githubusercontent.com`) is reachable, and is where the first
two real assets came from: `public/assets/models/fox.glb` (Khronos's
official glTF sample repo) and `public/assets/models/robot.glb`
("RobotExpressive", bundled in three.js's own examples). Assets are
committed directly into `public/assets/` — small enough (163KB and 453KB
respectively) that external hosting isn't warranted yet. See
`DECISIONS.md` for the full reasoning and the practical path for
Kenney/ambientCG-sourced content (you fetch, then either push directly or
hand the files to me).

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
