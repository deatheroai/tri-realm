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

`TerrainField`'s `kind` now has two real variants
(`src/world/realmMap.ts`): `"land-heightfield"` and `"air-open-volume"`
(air's is a nominal baseline only — flight has no ground collision to
sample it for). `sampleTerrainHeight` is the one place that dispatches on
`kind`; sea adds a third case there once it's scoped, same shape.

Because every realm's map is an instance of this one schema, the systems
that operate on it are written **once** and reused by all three realms:

- **Map loader** — parses a `RealmMap`, regardless of which realm it's for.
- **Save/load** — persists/restores `RealmMap` + entity state generically.
  Implemented (`BACKLOG.md` Phase 1b) in `src/world/realmMapStorage.ts`:
  serialize/validate/deserialize plus save/load/clear against an injected
  storage driver (matches `localStorage`'s shape) rather than the global
  directly, so the module stays realm-agnostic and testable without a DOM.
  `main.ts` is the only place that wires in the real `window.localStorage`
  and decides *when* to save (on placement) and *what* counts as entity
  state to persist (the player's current position) — the module itself
  doesn't know any of that.
- **Structure placement validation** — checks a proposed `PlacedStructure`
  against `terrain`/existing structures; realm-specific rules (e.g. "can't
  place a castle on open water" vs. "can place a dock at the shoreline")
  are supplied as pluggable rule sets per realm, not separate systems.
- **Portal transition** — moves an avatar from one `RealmMap` to another by
  id, using shared logic regardless of source/target realm. Implemented
  (`BACKLOG.md` Phase 2): `src/world/portalTransition.ts`'s
  `findNearbyPortal` is the realm-agnostic half — proximity-based (walk
  or fly within a trigger radius, no click needed), it only knows the
  `Portal` shape, not that realms exist. `main.ts`'s `maybeTriggerPortal`
  is the realm-aware half — swaps `activeRealm` and resets the
  destination's movement state (a transition swaps, it never blends), on
  a short cooldown so arriving next to a portal doesn't immediately
  trigger it again.

### Realm connections

Realms connect via **portals** — explicit, named transition points stored
in the map data, not a seamless walk/fly/swim between physical spaces:

- **Land ↔ Air:** a hot-air-balloon launch point, built first
  (`src/world/landAirPortal.ts`) — a stairway is still wanted as a second
  flavor later (`DECISIONS.md`, 2026-09-02). Both portals' shared
  coordinates/ids live in one neutral module rather than land's and air's
  `RealmMap` files importing each other (which would be circular, since
  each portal needs the other realm's map id and arrival spot).
- **Land ↔ Sea:** e.g. a dive spot, an underground passage, or a beach —
  still a pending decision (`DECISIONS.md`), deferred until sea is scoped.

The exact flavor of a not-yet-built portal is a content decision, not a
structural one — the schema only requires that a portal exist, point at
a target map, and land the avatar at a spawn position there.

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
- **Air module** (`src/air/airMovement.ts`, `BACKLOG.md` Phase 2): free 3D
  flight, no gravity or ground collision (air is "mostly open volume").
  Horizontal movement reuses land's `MoveInput` (`moveX`/`moveZ`, `run`
  doubling as boost); vertical is a separate axis
  (`src/input/verticalInput.ts` — Space/Control, land has no equivalent).
  Its distinct feel: velocity exponentially approaches a target velocity
  each frame rather than snapping to it (same frame-rate-independent
  technique as `followCamera.ts`'s `smoothingFactor`) — genuine
  lift/momentum, not just "land's controller with gravity switched off."
  A dev-only realm switcher (`#dev-realm-panel`) makes this reviewable now
  without waiting on real land↔air portals.
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
  an already-loaded skin is instant — but the cached scene graph is never
  handed out directly. `buildVisual` clones it (`SkeletonUtils`' `clone`,
  not `Object3D.clone` — these are skinned/animated meshes, and a plain
  clone doesn't rebuild the skeleton's bone bindings) before adding it to
  a view's root. That's what makes `AvatarView` genuinely reusable across
  more than one realm at once (below) rather than land-specific: a
  three.js `Object3D` can only have one parent, so two views both
  wanting "Fox" loaded at the same time would otherwise fight over the
  same instance — whichever set it last would silently steal the model
  out from under the other.
- **Realm-agnostic by construction, proven by a second realm using it**:
  `main.ts` holds two independent `AvatarView` instances — one per
  realm's own avatar `Group` (land's from `scene.ts`, air's from
  `src/air/airScene.ts`) — since both realms' scenes persist
  simultaneously (only one renders per frame, per the "no continuous
  blending" note above) and each therefore needs its own live visual.
  The dev skin panel drives both together on every click, so the
  player's chosen skin is one shared identity, not a separate choice per
  realm; each `AvatarView.setSkin` no-ops when already on that skin, so
  this is safe regardless of which realm happens to be active. Air uses
  the same `moveInputToAnimationState`/`faceDirection` calls land does,
  against its own horizontal `MoveInput` — a real air-specific mapping
  (e.g. accounting for vertical velocity, hover vs. glide vs. dive) is
  future refinement, not required for the skin system itself to work
  correctly in a second realm.

### In-app credits (`src/skins/attributions.ts`)

A structured, in-app mirror of `public/assets/ATTRIBUTIONS.md` — a small
"ⓘ Credits" toggle (bottom-center, the one corner the HUD text hadn't
claimed) expands to list every bundled asset's license and creator, each a
real link. Unlike the dev-only skin/structure/realm panels, this one is
real, player-facing UI: the Fox's rigging/animation is CC BY 4.0, which
legally requires attribution wherever the asset ships, not just in repo
docs — this is what makes that true of the deployed app itself, not a
courtesy. `ATTRIBUTIONS.md` stays the source of truth (fuller reasoning,
kept in sync by hand); `attributions.ts` is deliberately just the
structured subset a UI needs (asset/license/licenseUrl/creator).

### Block materials (`src/skins/blockMaterials.ts`, `src/skins/proceduralTextures.ts`)

`BLOCK_MATERIALS[]` pairs a base `color` (hue) with a `textureKind` —
`createCastlePieceMesh(materialId)` (in `src/land/placement.ts`) builds a
`MeshStandardMaterial` from both: `color` for hue, `map` for per-pixel
shading detail generated by `getProceduralTexture(textureKind)`. The
generator (`proceduralTextures.ts`) is a small sum-of-sine-waves pattern
per kind (thin horizontal banding for sandstone, jagged facets for slate,
vertical wavy grain for timber, a diagonal sheen for gold) — the same
"pure deterministic function standing in for real noise" trick
`terrainHeightAt` uses one layer over. Textures are pure greyscale
*shading* (RGB channels always equal), multiplied against `color` by
three.js's own material pipeline, so the generator never needs to know a
material's hue and a material's `.color` stays meaningful for anything
reading it directly (e.g. `e2e/skins.spec.ts`'s color-changes-on-switch
check). Generated once per kind and cached (module-level `Map`), not
rebuilt per placed piece.

That prediction held: `textureKind` gained exactly that sibling.
`BLOCK_MATERIALS` entries now also carry an optional `textureUrls`
(`src/skins/blockMaterials.ts`) naming real photographed ambientCG PBR
maps (color/normal/roughness, plus metalness for gold) under
`public/assets/textures/<id>/` — sourced via the GitHub-releases mirror
described in "Where assets actually come from" below. `createCastlePieceMesh`
still builds the mesh's material on the generated pattern first (synchronous,
never blocks placement), then calls `upgradeToRealTextures`
(`src/skins/realBlockTextures.ts`) to swap each map onto that same
material in place once it loads — mirrors `AvatarView`'s "safe default
first, upgrade once ready" philosophy, so a bad/missing texture file can
only make a piece less detailed, never blank or broken. Real textures
are cached by URL (module-level `Map`), same pattern as `AvatarView`'s
glTF cache.

`color` keeps tinting the *generated* pattern for every material always
(unchanged), but only tints the *real* texture once loaded when a
catalog entry sets `tintRealTexture: true` — off by default, since a
real photo is already the right hue and tinting it would muddy it; the
color resets to white once the real map takes over. Gold is the one
exception: photographed metal is a neutral scratched grey and needs the
gold tint to read as gold at all. (Gold's real metalness map is also
capped at `metalness: 0.35`, not the PBR-standard 1 — this scene lights
with Ambient+Directional only, no environment map, and a fully metallic
surface with no environment to reflect renders almost black. Confirmed
by actually rendering it, not by predicting it — see `BACKLOG.md`.)

### Dev skin switcher

A small on-screen panel (`#dev-skin-panel`, not child-facing UI — same
"labeled dev scaffolding" spirit as the touch-joystick's visual debug
aids) lists every catalog entry as a button; clicking one calls
`avatarView.setSkin()` or sets the active block-material id, live, no
redeploy. Exists specifically so asset iteration (swap a file, refresh,
click the button) doesn't require a rebuild/redeploy cycle per asset
tried.

The currently-selected option in each row is marked (`main.ts`'s
`setActiveButton`, a shared `.active` class any dev panel row can adopt)
— reflects the *actual* resolved state, not just an assumed click
outcome: the avatar row waits on `AvatarView.setSkin`'s own promise and
reads back `avatarView.skinId`, so if a load ever fails and falls back to
the procedural capsule (see above), the panel shows that real outcome
rather than the skin that was clicked. Without this the panels gave no
visual feedback about current state at all — made reviewing the deployed
preview harder than it needed to be.

### Where assets actually come from

This session's network policy blocks the free-asset sites (kenney.nl,
quaternius.com, ambientcg.com, itch.io, opengameart.org, polyhaven.com)
directly — confirmed as an organization egress policy denial, not a bug.
GitHub (`raw.githubusercontent.com`, and — discovered later, see below —
`github.com/.../releases/download/...`) is reachable, and is where every
real asset so far has come from. Assets are committed directly into
`public/assets/` — small enough (each model/texture set is well under
1MB) that external hosting isn't warranted yet.

- `public/assets/models/fox.glb` — Khronos's official glTF sample repo.
- `public/assets/models/robot.glb` ("RobotExpressive") — bundled in
  three.js's own examples.
- `public/assets/textures/{sandstone,slate,timber,gold}/` — real
  ambientCG PBR maps, via the GitHub-releases mirror below.

**GitHub-releases mirror for Kenney/Quaternius/ambientCG content**
(found 2026-08-31, see `DECISIONS.md`): the community npm package
[`@jgengine/assets`](https://www.npmjs.com/package/@jgengine/assets)
maintains a license-verified catalog of CC0 asset packs from these
sites and mirrors the actual archive bytes on its own repo's GitHub
Releases (`github.com/Noisemaker111/jgengine/releases/download/packs/
<provider>-<packId>.zip`) — reachable from this session even though the
providers' own sites aren't, since it's a `github.com` release-asset
download rather than the provider's domain. Not everything in the
catalog is actually mirrored this way (its own index marks some packs
`unpulled` — no pinned archive URL yet, still routes to the blocked
site directly), so this unblocks *some* Kenney/Quaternius/ambientCG
content, not all of it; check a specific pack's source file
(`src/sources/*.js` in the package) before assuming it'll work. Practical
path for any future asset from these providers: check whether
`@jgengine/assets` has it pinned before falling back to asking you to
fetch it.

## Construction system

- Structures (starting with castle pieces) are `PlacedStructure` entries
  on a `RealmMap`, validated on placement against that realm's terrain and
  placement rules.
- The placement/save/render pipeline is written once against the shared
  schema; only the *rule set* (what's placeable where) and the *structure
  catalog* (which structure types exist) vary per realm.
- Implemented (`BACKLOG.md` Phase 1b): `src/world/placementValidation.ts`
  is the once-written pipeline — bounds check, a true 3D overlap check
  against existing structures (so stacking is allowed; only genuine
  overlap is rejected), and a realm-supplied `terrainRule`. Land's catalog
  (`src/land/castleStructures.ts`: Keep/Wall/Gate) and terrain rule
  (`landTerrainPlacementRule` in `src/land/landRealmMap.ts`, trivially
  true today) are the first realm plugging into that shape; sea/air add
  their own catalog + rule later without this file changing.

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
