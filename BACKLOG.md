# Backlog

How this is used is described in [`AUTONOMY.md`](./AUTONOMY.md): each
build cycle picks the next unblocked, highest-priority item(s). Design
context for everything below is in [`ARCHITECTURE.md`](./ARCHITECTURE.md);
the decisions behind the sequencing are in [`DECISIONS.md`](./DECISIONS.md).

Status: `todo` / `in-progress` / `done` / `blocked` (with why).

**Sequencing principle (per `AUTONOMY.md`):** every item in Phase 0 and
Phase 1a is ordered to produce something visible and clickable on the live
Vercel deployment as fast as possible — hardcoded and rough is fine.
Phase 1b (schema, validation, generic save/load) only starts once the
rough version has been reviewed, so direction gets checked before the
"proper" architecture gets built under it.

## Phase 0 — Get something live

- `done` Initialize the TypeScript + Vite + Three.js scaffold — a single
  visible scene (ground plane, camera, one placeholder cube, basic
  lighting). Builds clean, 0 npm audit vulnerabilities. **Review
  checkpoint: pending your look at the Vercel preview URL for this push.**
- `done` Set up Vitest (unit — `scene.ts`/`camera.ts` object-graph checks)
  and Playwright (E2E — real headless-Chromium render check: canvas
  visible, non-zero size, no console errors), so tests gate commits from
  the start per `AUTONOMY.md`.

## Phase 1a — Walkable, buildable land (hardcoded, visual-first)

No `RealmMap` schema yet in this phase — a single hardcoded flat/simple
map is fine. The goal is a reviewable vertical slice, not the general
system.

- `done` Land avatar controller: walk/run (WASD/arrows + Shift, or a
  touch-drag virtual joystick for mobile — drag further out to run),
  gravity, ground collision, third-person follow camera, on a flat ground
  plane with a grid + scattered landmarks for movement parallax. Keyboard
  and touch are two independent input sources merged into one move intent,
  so `stepLandMovement` itself doesn't know or care which was used. Pure
  movement/camera-follow/input logic unit tested (31 tests); real
  headless-Chromium E2E tests confirm keyboard walking/running (desktop
  project) and touch-drag joystick movement (mobile/Pixel-5 project with
  real synthetic touch events). **Review checkpoint: confirmed working on
  desktop and mobile — feels good.**
- `done` Swapped the flat plane for varied terrain: a deterministic
  rolling-hill heightfield (`terrainHeightAt`, a small sum of sine waves)
  drives both the displaced ground mesh vertices and `stepLandMovement`'s
  ground collision from the same function, so the two can't visually/
  physically drift apart. Removed the flat-ground grid helper — the
  terrain relief itself now gives the follow-camera enough parallax (grid
  would've looked broken intersecting hills anyway); landmarks now sit at
  their actual local terrain height instead of a fixed y. **Review
  checkpoint: pending your look at the deployed app.**
- `done` Place a placeholder castle piece (a plain box) by clicking/tapping
  a spot on the ground — no placement validation, no persistence yet.
  Raycasts against the ground mesh specifically (not the whole scene), so
  clicking on the avatar or a landmark still resolves to the ground point
  behind it rather than placing on top of that object. On touch devices,
  the joystick zone only intercepts taps within its own rectangle (the
  `pointer: coarse` CSS rule from the mobile-controls pass), so a tap
  elsewhere places a piece instead of being swallowed by the movement
  zone — verified by a real mobile E2E test that also confirms a plain
  tap doesn't accidentally move the avatar. Unit tested (3 tests, 38
  total); E2E confirms both desktop click and mobile tap placement
  accumulate correctly (8 E2E tests total). **Review checkpoint: pending
  your look — this completes Phase 1a's core loop (walk + build).**
- `done` Two small extensions once the core loop was reviewed: (1) taps
  inside the joystick zone place a piece instead of being fully consumed
  by the joystick — TouchJoystick distinguishes a real drag from a
  tap-and-release by tracking max drag distance, so one touch region
  handles both gestures; (2) clicking/tapping an already-placed piece
  stacks a new one on top of it (centered on the hit piece, using its
  actual top-face height) instead of falling through to the ground
  behind it — raycasting now targets the ground plus every placed piece,
  not just the ground. 5 new E2E tests confirm both directions each time
  (tap-vs-drag, stack-vs-fall-through).

Phase 1a complete. Stop here and get your read on direction before
Phase 1b.

## Skins / visual identity — parallel track, not a sequential phase

Runs alongside Phase 1b+ rather than blocking it, per your explicit
request. Engine side is source-agnostic (see `ARCHITECTURE.md`'s "Skins"
section); content depends on where assets actually come from — see
`DECISIONS.md`'s 2026-08-30 entry for the network-access constraint this
surfaced.

- `done` Skin-swapping engine: data-driven avatar-skin and block-material
  catalogs, `AvatarView` (procedural ↔ glTF with animation, graceful
  fallback on load failure), a dev-only live switcher panel. 9 new unit
  tests, 3 new E2E tests.
- `done` First real asset proven end-to-end: an animated fox model
  (`public/assets/models/fox.glb`, from Khronos's official glTF sample
  repo — CC0/CC-BY 4.0, attributed in `public/assets/ATTRIBUTIONS.md`)
  with real Walk/Run/Survey clips driven by actual movement state.
  **Review checkpoint: confirmed — "I love the fox."**
- `done` Fox is now the default avatar skin (was capsule). Split
  `DEFAULT_AVATAR_SKIN_ID` from a new `FALLBACK_AVATAR_SKIN_ID` so the
  error-recovery path always lands on the guaranteed-safe procedural
  skin regardless of what the startup default is.
- `done` **Superseded, see below/2026-08-31 entries.** Originally:
  "Kenney/Quaternius/ambientCG-sourced content (castle-piece model
  packs, PBR stone/wood/brick textures) — blocked on you fetching
  these." Partially un-blocked itself: a GitHub-releases mirror
  (`DECISIONS.md`, 2026-08-31) reaches ambientCG PBR textures (now
  wired in, see the real-photographed-textures item below) and at least
  some Quaternius packs — but not the character/animal packs, so
  princess-figure content is still genuinely blocked (see below), and
  castle-piece *models* (as opposed to block *materials*) are found but
  not yet wired in (also below).
- `done` Second avatar skin: an animated robot (`public/assets/models/robot.glb`,
  "RobotExpressive" from three.js's own bundled examples — CC0, Tomás
  Laulhé/Quaternius, modifications by Don McCurdy — attributed in
  `public/assets/ATTRIBUTIONS.md`). Fourteen built-in clips; `Idle`/
  `Walking`/`Running` wired to our three movement states, a direct
  1:1 match unlike Fox's renamed `Survey`/`Walk`/`Run`. Chosen over two
  other reachable candidates (Khronos's `CesiumMan` — CC-BY 4.0 but only
  one unnamed animation clip and a Cesium-logo trademark caveat; three.js's
  own `Soldier.glb`/`Xbot.glb` — no credit line found, likely Mixamo-derived
  with redistribution terms too unclear to bundle raw). Same review pattern
  as Fox: added to the catalog and dev panel, not yet visually confirmed by
  you — check it via the dev switcher on the next preview.
- `done` **Fixed: Robot shipped far too big** — you reported its head was
  off-screen. Turned out to be exactly that: at `scale: 1` (picked by
  inference — bounding-box math plus reading the model's own demo's
  camera setup — never actually rendered and measured) it was ~4.82
  world units tall, 2.7x the procedural Capsule and 2.15x Fox. Fixed by
  measuring for real instead of inferring: added a small permanent debug
  hook, `window.__getAvatarWorldHeight()` (`src/main.ts`, computes a
  `THREE.Box3` on the live avatar group), used it to read Fox's (2.24)
  and Capsule's (1.8) actual rendered heights as a sane reference, then
  picked `scale: 0.4` for Robot to land at ~1.93 — in between the two.
  Guarded by a new E2E test iterating `AVATAR_SKINS` itself (covers a
  future gltf skin automatically) asserting every skin's rendered height
  stays within 0.5x–1.8x Capsule's — verified it actually catches this
  exact regression by reverting to `scale: 1` and watching it fail with
  the real ratio (2.68x) in the assertion message, then restoring the fix.
- `todo` **Still want:** a "princess figure"-style skin specifically —
  none of the reachable CC0/CC-BY sources (Khronos glTF-Sample-Assets,
  three.js's bundled examples) have a plausible match. Checked again
  2026-08-31 against the new GitHub-releases mirror
  (`DECISIONS.md`/`ARCHITECTURE.md`) — no help there either: Quaternius's
  character/animal packs are marked `unpulled` in that mirror's own
  index (no archive pinned yet, still routes to the blocked
  quaternius.com directly). Genuinely still blocked on you.
- `done` Fixed dev-panel overlap: World's new `#dev-structure-panel` and
  Skins' `#dev-skin-panel` were both anchored `top: 40px` in opposite
  corners, and on narrow viewports their multi-button rows grew wide
  enough to collide in the middle (reported with a screenshot — text
  from both panels was rendering on top of each other). Both now sit in
  one shared `#dev-panels` flex column (top-right, stacked, `flex-wrap`
  on each button row, capped width) instead of claiming opposite
  corners — genuinely-shared `index.html` territory per `AUTONOMY.md`,
  fixed here since Skins already owns "dev-panel wiring". Verified with
  real screenshots at both a narrow (390px) and desktop (1280px)
  viewport — no more overlap either way.
- `done` Real (generated, not flat-color) textures for all four block
  materials: `src/skins/proceduralTextures.ts` builds a small
  sum-of-sine-waves shading pattern per material — thin horizontal
  banding for sandstone, jagged facets for slate, vertical wavy grain
  for timber, a diagonal sheen for gold — applied as each material's
  `.map`, multiplied against its existing `.color` for hue (so the
  color-changes-on-switch E2E check still holds). No external asset
  needed — searched three.js's own bundled `examples/textures/` first
  (it does mirror some ambientCG CC0 textures, e.g. `Ice002`, plus a
  `Scratched_gold` PBR set) but nothing there fit "stone/wood/brick" for
  castle pieces, so this generates the interim texture instead of
  waiting further on it. 13 new unit tests (pattern purity/determinism/
  distinctness, texture caching), 1 new placement test, verified
  visually with a real screenshot of one piece per material. Genuinely
  interim, not a replacement for real photographed PBR — still logged
  below.
- `done` **Real photographed PBR textures**, replacing the generated
  pattern above with actual ambientCG photos (CC0-1.0): sandstone ←
  `PavingStones001`, slate ← `Rock001`, timber ← `Wood001`, gold ←
  `Metal001`. Not blocked after all — found a GitHub-releases mirror of
  ambientCG (and some Quaternius) content that this session *can* reach
  even though ambientcg.com itself is still blocked; see `DECISIONS.md`'s
  2026-08-31 entry for the mechanism and what it does/doesn't cover.
  Downloaded at 1K, resized to 512px + re-encoded (672KB total for all
  four materials × up to 4 maps each — color/normal/roughness, gold also
  metalness). `BLOCK_MATERIALS` gained `textureUrls` + `tintRealTexture`;
  `src/skins/realBlockTextures.ts` swaps each map onto the mesh's
  material in place once loaded, starting from (and, on any failure,
  staying on) the generated pattern already in place — same
  "safe-default-first" philosophy as `AvatarView`. `color` resets to
  white once a real color map loads for every material except Gold
  (keeps its tint — the real metal photo is neutral grey and needs it to
  read as gold at all).
  **Found and fixed during this pass, not just guessed at**: Gold's
  metalness map initially set `metalness: 1`, rendering the piece almost
  **black** — this scene lights with Ambient+Directional only, no
  environment map, and a fully metallic surface with nothing to reflect
  renders near-black. Caught by actually screenshotting it (same lesson
  as the Robot-scale bug above: render and look, don't just wire it up),
  fixed by capping at `metalness: 0.35`.
  Also fixed a latent E2E-flakiness risk while here: the existing
  material-switch test compared `.color`, which — once real textures
  load — converges to white for 3 of 4 materials, so the assertion would
  eventually have started failing intermittently depending on how fast
  the real texture happened to load relative to the test's read. Added
  `window.__getLastPlacedMapUuid()` (texture identity is always distinct
  per material, generated or real) for the timing-independent check, and
  a new test that explicitly polls for the real-texture load to
  complete and asserts the expected end state. 16 new unit tests, 1 new
  E2E test (plus 1 rewritten), verified visually with a real screenshot
  of one piece per material.
- `todo` **Still want:** real Quaternius model packs for castle pieces
  themselves (not just block materials) — the same GitHub-releases
  mirror above does carry at least one relevant pack (a "Medieval
  Village MegaKit" downloaded successfully as a connectivity check, not
  yet inspected for individual model quality/fit). Logged here since I
  found it, but wiring actual glTF castle-piece models into
  `createCastlePieceMesh` would mean changing box-geometry/collision/
  footprint assumptions in `src/land/` — World's file ownership, a
  bigger change than this cycle's scope, not something to do solo
  without checking in first.
- `todo` Revisit the 3rd-person camera's framing once there's more
  character content to actually showcase — noted in `DECISIONS.md`: the
  current steep ~31° elevation makes an elongated quadruped read as
  compressed/vertical rather than clearly "a fox." Not a blocker, just
  worth a look with real content in view.

## Phase 1b — Harden into the real architecture

Only starts once Phase 1a has been reviewed and the direction holds.

- `done` Defined the shared `RealmMap` / `Portal` / `PlacedStructure` data
  schema from `ARCHITECTURE.md` as real TypeScript types
  (`src/world/realmMap.ts`) and refactored the Phase 1a prototype to be
  backed by it: `src/land/landRealmMap.ts` builds the hardcoded `land-01`
  map (same bounds/terrain as before, now data instead of scattered
  constants — `scene.ts`'s ground size reads from it too); `main.ts`
  places pieces via `addStructure` (immutable, mirrors `stepLandMovement`'s
  reassignment style) instead of an ad hoc array/counter, and movement/
  ground-mesh height both sample through `sampleTerrainHeight(terrain, x,
  z)` — a single dispatch point air/sea add cases to later — instead of
  calling the land heightfield formula directly. `Portal`/`EntityRef` are
  typed but left unpopulated (`portals: []`, `entities: []`): no consumer
  yet (portals need a target realm, entities need save/load — both later
  Phase 1b/2/3 items). 7 new unit tests (`realmMap.test.ts`,
  `landRealmMap.test.ts`); all existing unit/E2E tests still pass
  unchanged since the schema is additive under the same runtime behavior.
- `done` Real castle structure catalog (`src/land/castleStructures.ts`:
  Keep/Wall/Gate starter set, each with its own box dimensions — Keep
  matches Phase 1a's original placeholder exactly so the default and
  existing behavior/tests are unchanged) + generic placement validation
  (`src/world/placementValidation.ts`): a proposed placement is checked
  against the map's `bounds`, a true 3D overlap check against existing
  `structures` (so stacking one piece flush atop another still works —
  only a genuine overlap is rejected), and a realm-supplied terrain rule
  (land's is trivially true today — see `landTerrainPlacementRule`, same
  deferred-slope gap as movement's). `createCastlePieceMesh`/
  `castlePieceGroundOffset` now take a structure-type id; a new dev panel
  (`#dev-structure-panel`, separate from the skins one) picks the type for
  new placements live. 13 new unit tests (`placementValidation.test.ts`,
  `castleStructures.test.ts`, updated `placement.test.ts`); 1 new E2E test
  confirms the default type and that switching type changes new
  placements; all pre-existing tests still pass unchanged.
- `done` Generic save/load of a `RealmMap` + entity state
  (`src/world/realmMapStorage.ts`): `serializeRealmMap`/`deserializeRealmMap`
  (structural validation, never throws — a corrupted/foreign save falls
  back to null so the caller can start fresh instead of crashing) and
  `saveRealmMap`/`loadRealmMap`/`clearRealmMap` keyed by `RealmMap.id`,
  against an injected `RealmMapStorageDriver` (matches `localStorage`'s
  shape) rather than the global directly — keeps the module pure/testable
  under Vitest's DOM-less "node" environment, and the backend swappable
  later. Realm-agnostic throughout: validated against land data (the only
  realm that exists) but nothing in the module is land-specific.
  `PlacedStructure` gained a `materialId` field (`src/world/realmMap.ts`)
  so a restored piece rebuilds looking the way it was built, not reverting
  to a default material — safe to add now since no real save existed
  before this item. `main.ts` loads-or-creates the land map on startup
  (falling back to fresh on any storage error), rebuilds a mesh per
  restored structure, restores the player's last position from a restored
  `EntityRef`, and saves after every successful placement (deliberately
  not continuously/on-unload — land-walk's E2E tests reload mid-scenario
  expecting a fresh spawn when nothing's been built yet). 9 new unit tests
  (`realmMapStorage.test.ts`); existing tests updated for the new
  `materialId` field.
- `done` E2E coverage (`e2e/land-save-load.spec.ts`): walk, place a castle
  piece, reload — the structure and the player's position both survive;
  a separate test confirms a fresh visit with nothing saved still starts
  clean. 2 new E2E tests; all pre-existing tests still pass unchanged.
- `blocked` (on Phase 2/3 existing) Land↔air and land↔sea portal
  implementation — the `Portal` schema exists here, but wiring an actual
  transition needs a real target realm to land in.

## Phase 2 — Air realm

Phase 1b completed 2026-08-31/09-01, unblocking this phase per its own
"blocked (on Phase 1b completing)" gate — content specifics for a new
realm are left to my judgement as it's actually built, per the
2026-08-26 world-model decision (`DECISIONS.md`), so this proceeded
without a fresh check-in.

- `done` Air realm scoping + flight avatar controller
  (`src/air/airMovement.ts`, `src/air/airScene.ts`,
  `src/air/airRealmMap.ts`) — this phase's design pass and its first
  hardcoded/minimal content in one cycle, same visual-first sequencing
  land's Phase 1a started with (a rough, reviewable slice before any
  further generalizing). Free 3D flight: horizontal reuses land's
  `MoveInput` (`run` doubles as boost), a new vertical axis
  (`src/input/verticalInput.ts` — Space/Control, land has no equivalent)
  drives ascend/descend, no gravity or ground collision. Distinct feel
  from land: velocity exponentially approaches a target each frame
  instead of snapping to it (same technique as the follow-camera's
  smoothing) — genuine momentum, not land's controller with gravity
  switched off. `createAirScene()` builds an open sky volume with
  scattered floating platforms for parallax (`ARCHITECTURE.md`: each
  realm gets its own realm-appropriate floating content) and a plain
  procedural-capsule avatar — no skin-switching/animation wired to air
  yet (`todo` below). `RealmMap`/`TerrainField` gained a real
  `"air-open-volume"` kind (`src/world/realmMap.ts`) for schema
  completeness, though nothing reads it for collision; `createAirRealmMap`
  itself isn't wired into `main.ts` yet — no placement/save-load in air's
  scope this cycle, mirroring how land's own `RealmMap` waited for
  Phase 1b. Reviewable now via a new dev-only `#dev-realm-panel`
  (Land/Air) — no portals needed yet. 19 new unit tests
  (`airMovement.test.ts`, `airScene.test.ts`, `airRealmMap.test.ts`,
  `verticalInput.test.ts`, plus 1 in `realmMap.test.ts`); 4 new E2E tests
  (`e2e/air-flight.spec.ts`) cover realm switching, horizontal flight,
  ascend/descend, and switching back to land without cross-realm
  interference. **Review checkpoint: pending your look at the deployed
  app — try the Air button in the dev panel.**
- `todo` Wire Skins' `AvatarView` (skin-switching/animation) to the air
  avatar too — currently land-only; air always shows the plain procedural
  capsule. Cross-track, not blocking.
- `todo` Air `RealmMap` content (floating islands/platforms) as real
  `PlacedStructure`-equivalent data instead of the current hardcoded
  `FLOATING_PLATFORM_POSITIONS` array — part of air's own Phase 1b-style
  hardening pass, once this rough slice is reviewed. Wires
  `createAirRealmMap` into `main.ts` for the first time.
- `todo` Land↔air portal — exact flavor (stairway vs. hot-air-balloon) is
  a pending decision in `DECISIONS.md`; build whichever is chosen there.
  Replaces the dev-only realm switcher with the real transition.

## Phase 3 — Sea realm

- `blocked` (on Phase 1b completing) Sea realm scoping: movement feel,
  floating/underwater content.
- `todo` Swim/buoyancy avatar controller module — hardcoded/minimal
  content first, same visual-first sequencing as land.
- `todo` Sea `RealmMap` content (sea floor, floating docks/wreckage).
- `todo` Land↔sea portal — exact flavor (dive spot / underground passage /
  beach) is a pending decision in `DECISIONS.md`.

## Later / unscoped

- `todo` Structure types beyond castles.
- `todo` **Climbable-slope limit + terrain-face collision.** Movement
  currently has no concept of "too steep/tall to climb" — the avatar's
  height snaps directly to `terrainHeightAt` every frame with zero
  horizontal collision against steepness, so a literal cliff or wall
  wouldn't block you, you'd just walk straight up it. Not visible yet
  because the current rolling-hill terrain never gets steeper than ~30%
  grade by construction. Deferred deliberately (see `DECISIONS.md`) —
  pick this up once a realm actually needs real cliffs/walls (e.g. castle
  walls in Phase 1b, or any future terrain authored steeper than today's).
- Multiplayer or shared persistent world — explicitly out of scope until
  raised, per `AUTONOMY.md`.
