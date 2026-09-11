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

**Current priority order (set 2026-09-08, review session — supersedes
plain top-to-bottom-per-phase ordering until this note is removed):**

1. `done` Air floating/pitch parity fix (Phase 2 below, 2026-09-08).
2. Dive-suit auto-equip bug (`todo` under Phase 2 below — still open,
   couldn't complete the live-deployment reproduction step this cycle,
   see the item's own 2026-09-08 investigation note).
3. Environment art pass — land parkland dressing (`todo` under Phase 1a),
   cloud-shaped air platforms (`todo` under Phase 2), sea shipwreck
   centerpiece (`todo` under Phase 3, supersedes the old sea-floating-docks
   item). Treat these three as one pass, but each realm's piece can land
   independently on its own track's next cycle.
4. Real Quaternius castle-piece models (`todo` under "Skins / visual
   identity").
5. Camera framing revisit (`todo` under "Skins / visual identity").

Everything under "Later / unscoped" stays parked behind all of the above
with no target, as before.

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
- `todo` **(World) Basic parkland dressing — a foundational starter, not
  a one-off theme.** Locked in during a 2026-09-08 design review: swap
  the current plain gray-cylinder `landmark` meshes (`src/scene.ts`) for
  a light, generic "parkland" set — scattered trees, a few flower-bed
  color patches, a simple path connecting them, one small centerpiece
  (a fountain or gazebo) near spawn. Deliberately generic/light-touch
  rather than a heavily-opinionated theme (a "garden" was the original
  ask, refined here): this repo's stated purpose is to be cloned and
  built on top of, so the goal is "pleasant out of the box," not a
  specific narrative that fights whatever theme a fork actually wants.
  Implement the same way `AIR_FLOATING_PLATFORM_POSITIONS`/
  `SEA_WRECKAGE_POSITIONS` already do: a plain data array (e.g.
  `LAND_DECORATION_POSITIONS`, each entry carrying a decoration kind) that
  `scene.ts` reads to place meshes — the actual foundational value here
  is that a fork can reskin land entirely by swapping one array/asset
  set, without touching terrain/collision code. Procedural-primitives
  first (same discipline block materials used: generated pattern before
  real photographed textures) — real assets can follow later if wanted.
  Rolling-hill terrain and all movement/build mechanics stay untouched.

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
- `done` **Superseded, see the Princess entry below.** Originally: "Still
  want a 'princess figure'-style skin specifically — none of the
  reachable CC0/CC-BY sources (Khronos glTF-Sample-Assets, three.js's
  bundled examples) have a plausible match. Checked again 2026-08-31
  against the new GitHub-releases mirror
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
- `done` **Dev panels now collapse by default on a real phone.** Reported
  2026-09-08 with a screenshot: at today's full button count (six avatar
  skins, four materials, three structures, three realms — the overlap fix
  above never anticipated this many), the shared `#dev-panels` column had
  grown tall enough on a narrow phone to cover most of the actual game
  view, leaving only a sliver of the avatar visible. Fixed the same way
  `#credits` already handles this (expand-on-click, collapsed by
  default): `#dev-panels-toggle` (index.html) + a wrapping
  `#dev-panels-content` div, scoped to `@media (pointer: coarse)` so a
  fine-pointer/desktop device — including every existing E2E test that
  clicks a dev-panel button, all of which run under the desktop Playwright
  project — sees no change at all; only a real touch device starts
  collapsed. `e2e/skins.spec.ts`'s generic overlap-regression check
  updated to look at `#dev-panels-content`'s children (one level deeper
  now) rather than `#dev-panels`' own, so a future new panel is still
  covered automatically, matching its original intent. New E2E coverage
  in `e2e/touch-controls.spec.ts` (the one file that actually runs under
  a real coarse-pointer/touch device) confirms the collapse/expand/
  re-collapse cycle for real, not just via the stylesheet. Full suite
  verified (typecheck, 215 unit tests, build, 61 E2E tests); verified
  visually with real Pixel-5-viewport screenshots, collapsed and expanded.
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
  **Investigated 2026-09-03, deliberately still not done**: the actual
  elevation angle comes from `cameraOffset` in `main.ts` (genuinely
  shared, not `src/camera.ts` which only sets an initial pre-follow
  pose) — so it's technically reachable, not blocked on file ownership
  the way I'd assumed. But changing it moves where the ground plane
  lands on screen, and several E2E tests across *both* tracks
  (`castle-placement.spec.ts`, `land-save-load.spec.ts`,
  `touch-controls.spec.ts`, plus my own `skins.spec.ts`) click at
  hardcoded viewport-ratio positions that assume today's framing — a
  wide blast radius across files I don't own, for a "worth a look, not
  blocking" polish item. Left alone rather than force it through solo;
  flagging the real reason instead of silently skipping it again.
- `done` **In-app credits screen** — with the other Skins items this
  cycle blocked (princess figure, castle-piece models) on external
  access or World's file ownership, picked up something `public/assets/
  ATTRIBUTIONS.md` itself had flagged as outstanding: "carry the same
  credit into any future in-app credits screen." That screen didn't
  exist — the Fox's CC BY 4.0 rigging/animation credit lived only in a
  repo doc, not anywhere a real player of the deployed app would see it,
  which is a genuine (if minor) compliance gap given CC BY legally
  requires attribution wherever the asset ships.
  `src/skins/attributions.ts` is a structured, tested mirror of the
  markdown file; a small "ⓘ Credits" toggle (bottom-center — the one
  corner `#hud-position`/`#hud-structures` hadn't claimed) expands to
  list every bundled asset with real license/creator links. Real,
  player-facing UI, deliberately not part of the dev-only `#dev-panels`
  column. 5 new unit tests (entry shape, real https links, no
  duplicates, and specifically that the compliance-critical Fox-rig
  entry can't be silently dropped), 2 new E2E tests (reveals the
  required credit on click, toggles closed again), `#credits` added to
  the overlap-regression check. Verified visually at both desktop and a
  narrow (390px) viewport — no overlap, readable either way.
- `done` **Dev panel active-state highlighting** — same "usual items all
  blocked/out-of-scope" situation as the credits screen above, so picked
  up a real gap noticed while reviewing: the skin/material dev panel
  buttons gave no visual feedback about which option was actually
  selected, only a hover state — reviewing the deployed preview meant
  trusting your own memory of the last click. `main.ts`'s
  `setActiveButton` (a shared `.active` class any dev panel row can
  adopt) now highlights the current selection in both the Avatar and
  Blocks rows, correct on first load (no click needed) and updated on
  every switch. The avatar row specifically reflects `AvatarView`'s
  actually-*resolved* skin (via its `setSkin` promise), not just the
  clicked one — stays honest if a load ever fails and falls back to the
  procedural capsule, rather than showing a skin that isn't really
  active. 3 new E2E tests, verified visually with real screenshots
  (default state, and after switching both an avatar skin and a block
  material). Structure-type/realm rows (World's) can adopt the same
  shared class later; not touched this cycle.
- `done` **Princess avatar skin — the long-blocked item, unblocked by you
  directly.** Every reachable CC0/CC-BY source came up empty (see the
  superseded item above); you found and hand-delivered the actual asset:
  "Apple White (Royal Pirate)" by oaktyler1996 on Sketchfab, CC-BY 4.0
  (`public/assets/ATTRIBUTIONS.md` has the full credit). The raw export
  was not directly usable: ~43MB (6 mesh chunks, ~607K triangles, four
  2048×2048 textures — likely AI-mesh-generated, per an embedded node
  name) and no rig/animation at all. Reprocessed with
  `@gltf-transform/cli`: simplified to a single ~22K-triangle mesh
  (meshoptimizer) and textures resized to 512×512, landing at a ~2.4MB
  `public/assets/models/princess.glb` — heavier than Fox/Robot but the
  model genuinely has more surface detail (clothing, face, trim).
  `scale` measured for real via `window.__getAvatarWorldHeight` (not
  guessed, same discipline as the Robot-scale fix above): ~1.90 at
  scale 1, already close to Capsule's ~1.8, so no correction needed.
  No animation clips exist in the source, so `animationClipNames` is
  omitted — Princess renders in its authored static pose regardless of
  movement state (documented in `ATTRIBUTIONS.md` and the catalog
  entry's own comment). 1 new E2E test guards the no-mixer path
  specifically; the existing height-sanity and dev-panel-listing E2E
  tests cover it automatically since both iterate `AVATAR_SKINS`. The
  in-app credits E2E test needed a small fix: it looked up the "CC BY
  4.0" license link by name alone, which became ambiguous once a second
  CC-BY asset existed — rescoped to the Fox-specific credit line.
- `done` **Procedural idle/movement "bob" for skins with no real
  animation clip.** Both this section's remaining `todo`s (Quaternius
  castle-piece models, camera framing) were still genuinely
  not-solo/deliberately-deferred this cycle (see their own entries below)
  — same "pick up a real gap while the usual items are stuck" pattern as
  the credits screen and dev-panel active-state highlighting earlier in
  this section. The gap: Princess (no rig/animation at all) and Capsule
  (always procedural) render in a completely static pose regardless of
  movement, which reads as "frozen" next to Fox/Robot/Mannequin's real
  clips. `bobOffset(elapsedSeconds, state)` (`src/skins/avatarSkins.ts`)
  is a small pure sine-wave function — gentle/slow while idle,
  bigger/faster while walking or running — and `AvatarView.update`
  applies it to the visual's own *local* y (never the root `main.ts`
  repositions every frame) only when `hasAnimation(currentState)` is
  false, so Fox/Robot/Mannequin's real clips are completely untouched
  (verified directly: an E2E test asserts Fox's offset stays exactly 0
  across several frames while Princess's genuinely oscillates). Reset to
  0 on every `setSkin` so a skin switch never carries a stale offset into
  the new visual. No external asset needed — purely engine-side, same as
  the generated-pattern block textures were before real photos replaced
  them. 8 new unit tests (`avatarSkins.test.ts`: bounds/periodicity/
  determinism/amplitude-by-state; `avatarView.test.ts`: bobs a
  no-animation skin, never bobs an animated one, resets across a skin
  switch), 1 new E2E test (new `window.__getAvatarVisualLocalY` debug
  hook, same pattern as `__getAvatarWorldHeight`).
- `done` **Real end-to-end regression test for the glTF load-failure
  fallback.** Same "usual two `todo`s still genuinely blocked" situation
  as the bob item above (see the 2026-09-08 note on both below) prompted
  another look for a real gap — found one: "a skin can never brick the
  app" (`AvatarView.buildVisual`'s catch, documented repeatedly across
  `ARCHITECTURE.md`/`DECISIONS.md`) was only ever verified against a
  *mocked* `GLTFLoader.loadAsync` rejection in `avatarView.test.ts`, never
  against a real network failure in a real browser. Added an E2E test
  (`e2e/skins.spec.ts`) that aborts Fox's actual `.glb` request via
  `page.route` before the very first page load and confirms the app still
  comes up fully functional on `FALLBACK_AVATAR_SKIN_ID` ("capsule") —
  right skin id, dev panel correctly highlights Capsule as active, avatar
  still renders at a sane height, and no *uncaught* exception reaches the
  page (the expected `console.error` isn't asserted against, just not
  allowed to escalate). 1 new E2E test, no code changes needed — the
  fallback path already worked, this closes a real coverage gap in
  verifying it against an actual browser/network failure rather than only
  a mock.

**2026-09-08 (this cycle) — both remaining `todo`s below re-checked, still
genuinely not-solo-actionable; one real finding logged.** Investigated
the dive-suit auto-equip item's own blocker (no known deployment URL) —
found it: `deatheroai/tri-realm`'s GitHub repo metadata itself has a
`homepage` field set to `https://tri-realm.vercel.app` (not previously
checked; earlier sessions had only grepped repo *files* for a URL, never
the repo's own GitHub settings). Confirmed this doesn't actually unblock
the item, though: this session's network policy denies `tri-realm.vercel.app`
outright (`CONNECT` → 403, confirmed via the proxy's own status endpoint
as a policy denial, not a technical failure) — the same class of block as
kenney.nl/quaternius.com/etc., not just "URL unknown." So a live-deployment
check still needs an actual human with a real browser, not any automated
session regardless of whether it knows the URL. Recorded here so future
cycles don't re-spend time rediscovering the URL only to hit the same
wall. Camera framing re-read against current code — the blast-radius
reasoning (changing the shared `cameraOffset` in `main.ts` would move
click-position assumptions baked into several of World's own E2E specs)
still holds unchanged; not re-investigated further this cycle.

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
- `done` Land↔air portal implementation — see Phase 2 below
  (`src/world/portalTransition.ts`, `src/world/landAirPortal.ts`); the
  generic transition system lives here in `src/world/`, exercised first
  against land↔air.
- `done` **(World)** Land↔sea portal implementation — flavor resolved
  2026-09-07 (`DECISIONS.md`): a diving-house structure over a basement
  pothole. Same shape as `src/world/landAirPortal.ts`, in a new neutral
  `src/world/landSeaPortal.ts` (avoids the same land/sea circular-import
  problem the air pair already solved this way): the diving house sits on
  a straight -x line from land's spawn (the balloon already claims +x),
  the sea-side exit floats at the sea realm's own spawn depth so it's
  reachable by horizontal swimming alone, no dive required. `createLandRealmMap`/
  `createSeaRealmMap` now each carry a real `Portal` for it — no changes
  needed to `main.ts`'s `maybeTriggerPortal` at all, since it already
  routed a `seaMap.id`-targeted portal to sea generically once sea itself
  existed. Visuals (`src/world/divingHouseMarker.ts`) read differently at
  each end, unlike the balloon's one shared shape: a small stone house
  with a dark basement pothole on land, a sunken stone archway underwater
  on the sea side — placed in `scene.ts`/`seaScene.ts` at the same shared
  constants the trigger logic uses, so the mesh and the mechanism can't
  drift apart. `PORTAL_TRIGGER_RADIUS` moved from `landAirPortal.ts` to
  the genuinely realm-agnostic `portalTransition.ts` (re-exported from
  its old home for that module's own test) now that a second portal pair
  needs the same constant. 9 new unit tests (`landSeaPortal.test.ts`,
  `divingHouseMarker.test.ts`, plus updated `landRealmMap.test.ts`/
  `seaRealmMap.test.ts`); 4 new E2E tests (`e2e/land-sea-portal.spec.ts`)
  cover both directions, the anti-bounce-back cooldown, and that the two
  land-side portals (balloon +x, diving house -x) don't interfere with
  each other. See the duplicate item under Phase 3 below (same item,
  tracked in both places since it sits at the Phase 1b/Phase 3 boundary,
  same as the original Phase 2 entry did for land↔air).

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
- `done` Wired Skins' `AvatarView` (skin-switching/animation) to the air
  avatar. `main.ts` now holds a second, independent `AvatarView` for
  `airAvatar` — both realms' avatar `Group`s persist at once (only one
  scene renders per frame), so each needs its own live visual — driven
  together by the same dev-panel skin buttons, so the player's chosen
  skin carries across Land↔Air rather than resetting. Air reuses land's
  `moveInputToAnimationState`/`faceDirection` against its own horizontal
  `MoveInput` for now (a real air-specific animation mapping is future
  refinement, not required for this to work).
  **Found and fixed a real latent bug while wiring this in**: `AvatarView`
  was handing out its cached glTF scene graph directly, reused byte-for-
  byte across every `setSkin` call — harmless with only one consumer
  (land, until now), but a three.js `Object3D` can only have one parent,
  so a second simultaneous consumer (air) selecting the same skin would
  silently steal the model out from under the first. Fixed in
  `src/skins/avatarView.ts` with `SkeletonUtils`' `clone` (not
  `Object3D.clone` — these are skinned/animated meshes and a plain clone
  doesn't rebuild bone bindings), so every `AvatarView` gets its own
  independent instance. 2 new unit tests (one directly reproducing two
  views sharing one skin), 3 new E2E tests (air's own default, switching
  while in air, and skin identity surviving a realm switch both
  directions) — in `e2e/skins.spec.ts` since this is Skins-track
  behavior, just exercised through the Air realm. Verified visually with
  real screenshots of both Fox and Robot flying in the air realm.
- `done` Air `RealmMap` content: floating platforms are real
  `RealmMap.terrain` data now, not a hardcoded array local to
  `airScene.ts`. `TerrainField`'s air variant
  (`src/world/realmMap.ts`) gained a `platforms: Vec3[]` field — matches
  this schema's own documented intent ("air -> mostly open volume +
  floating terrain"), the same way land's variant already carries its
  height formula. The actual position data
  (`AIR_FLOATING_PLATFORM_POSITIONS`) moved to `src/air/airRealmMap.ts`;
  both `createAirRealmMap`'s `terrain.platforms` and `airScene.ts`'s
  meshes now read from that one array, so the visual and the map data
  can't drift apart (same pattern as `terrainHeightAt` or
  `landAirPortal.ts`'s shared portal positions). Placed as
  `PlacedStructure`s was considered and rejected: those represent
  player-built things (validated via `placementValidation.ts`), while
  platforms are world-authored content — `terrain` is the correct home
  per the schema's own comments. 3 new/updated unit tests; no behavior
  change, so no new E2E coverage needed — existing tests confirm nothing
  broke.
- `done` Land↔air portal — hot-air-balloon flavor, built first per your
  answer to the `AskUserQuestion` check-in (`DECISIONS.md`, 2026-09-02):
  both flavors wanted eventually, balloon prioritized for being more
  visually/thematically distinctive than a stairway (worth proving the
  portal *mechanism* against the more demanding visual). Generic,
  realm-agnostic transition system (`ARCHITECTURE.md`):
  `src/world/portalTransition.ts`'s `findNearbyPortal` (proximity — walk
  or fly within `PORTAL_TRIGGER_RADIUS`, no click needed) is the only
  piece that knows what a "portal" is; `main.ts`'s `maybeTriggerPortal`
  is the only piece that knows realms exist (swaps `activeRealm`, resets
  the destination's movement state, no continuous blending). Both
  portals' shared coordinates/ids live in one neutral module
  (`src/world/landAirPortal.ts`) — land's and air's `RealmMap` files
  would otherwise need to import *each other* (a real circular-import
  risk, since each portal needs the other realm's map id and arrival
  spot) — and both sit on a straight +x line from their realm's own
  spawn, deliberately reachable by holding one direction key rather than
  a precise diagonal (also what makes this reliably E2E-testable).
  A 1.5s cooldown after each transition guards against instantly
  bouncing back through the portal just arrived near, on top of the
  arrival spot already sitting clear of the trigger radius. Visual: a
  shared hot-air-balloon mesh (`src/world/portalMarker.ts` — a sphere
  balloon over a box basket, same rough-primitives language as everything
  else) placed at each portal's actual trigger position, so the marker
  and the mechanism can't drift apart. The dev-only `#dev-realm-panel`
  switcher stays too — a "cheat" for quick review/testing, real portals
  are now the in-world way to do it. 15 new unit tests
  (`portalTransition.test.ts`, `portalMarker.test.ts`,
  `landAirPortal.test.ts`, plus coverage in both realm-map test files);
  3 new E2E tests (`e2e/land-air-portal.spec.ts`) cover both directions
  and the anti-bounce-back cooldown. Land↔sea's flavor is still a
  separate pending decision — sea isn't scoped yet.
- `done` **(World) Air-specific animation/pitch parity with Sea.** Reported
  in a review session on 2026-09-08: flying in Air still read as "walking
  on land" — there's no sense of floating/hovering. Root cause: `main.ts`'s
  air branch (see the AvatarView-wiring item above) called the same
  horizontal-only `moveInputToAnimationState` land uses and never called
  anything like `setVerticalPitch` — so ascending/descending in place
  showed the ground idle pose, and moving horizontally played the walk/run
  clip exactly as if grounded. Fixed by copying sea's own pattern rather
  than inventing a new one: `src/air/airAnimation.ts`'s
  `moveInputToAirAnimationState` treats an active vertical hold as real
  flight even with zero horizontal input — simpler than sea's own
  `moveInputToSeaAnimationState` since air has no passive-drift exception
  to carve out (`stepAirMovement` never moves the avatar vertically except
  from direct input, unlike sea's buoyancy). `AvatarView.setVerticalPitch`
  (already generic, `src/skins/avatarView.ts` — no changes needed there
  beyond its own doc comment) is now also called from air's branch with
  `airMovement.velocity.y`: same sign convention as sea (already verified
  against a real render) noses the model up while ascending, down while
  descending, level at rest — reads correctly for air's "climb/dive"
  framing without needing an inverted convention. Air's wider vertical
  range (+/-4 m/s vs. sea's ~+/-2 m/s active) means it reaches max pitch
  partway into full ascend/descend speed rather than only at the very
  top — a deliberate non-issue, not tuned further, since it still reads
  as "nose tilts into the climb/dive." 8 new unit tests
  (`airAnimation.test.ts`); 3 new E2E tests (`e2e/air-flight.spec.ts`,
  mirroring sea's own pitch/animation-state coverage in
  `e2e/skins.spec.ts`, but landing here since this is squarely
  World-owned `src/air/`/`e2e/air-*.spec.ts` territory, not Skins'):
  vertical-only input is not idle, ascend/descend tilt in opposite
  directions, and pitch eases back to level once vertical input is
  released (air has no buoyancy to keep drifting it, unlike sea). Full
  suite verified: typecheck, 215 unit tests, build, 59 E2E tests all pass.
- `todo` **(World) Cloud-shaped floating platforms.** Locked in during a
  2026-09-08 design review: replace the current plain gray-cylinder
  platforms (`AIR_FLOATING_PLATFORM_POSITIONS`, `airScene.ts`) with
  actual cloud-shaped meshes (a soft puffy cluster — several overlapping
  spheres or a simple low-poly cloud blob — rather than a literal
  geometric primitive). The platform *is* the cloud, not a separate
  backdrop layer — chosen specifically so the flight mechanic and the
  "cloudy sky" visual theme read as the same object, matching the same
  foundational-starter reasoning as Land's parkland item above (a fork
  reskins Air by swapping this one mesh/position set). Placement
  data/collision radius stay as-is — this is a mesh swap, not a schema
  change. Procedural-primitives-first, same as everywhere else in this
  codebase; a real cloud skybox/atmosphere pass is a further layer, not
  required for this item.
- `todo` **Verify: dive-suit auto-equip not triggering via the diving-house
  portal.** Reported in a review session on 2026-09-08: swam through the
  diving house on land into Sea and the dive suit did not auto-equip
  (avatar still read as on-land). Per the code (`main.ts`'s
  `maybeTriggerPortal`, BACKLOG.md's dive-suit item under Phase 3 below)
  this should fire whenever `portal.kind === DIVING_HOUSE_PORTAL_KIND` and
  the current skin isn't already `diveSuit` — and has E2E coverage
  (`e2e/skins.spec.ts`) that's presumably still green, so this needs
  reproduction rather than a blind fix: confirm on the actual live
  Vercel deployment (not just local/test) that the diving-house portal's
  trigger radius is genuinely being entered (not the nearby sea-side
  arch, and not stopping just short of `PORTAL_TRIGGER_RADIUS`), and
  check whether the deployed build is current — a stale/un-redeployed
  Vercel build would show this exact symptom without any code being
  wrong. If it reproduces on a confirmed-current deployment, this is a
  real regression to root-cause and fix.
  **Investigated 2026-09-08 (this cycle), still open — genuinely
  couldn't finish the reproduction step**: ran the exact existing E2E
  coverage (`e2e/skins.spec.ts`'s "land<->sea diving-house portal:
  dive-suit costume change" suite, both tests) plus the full local build/
  test/E2E suite fresh from `origin/main` — everything passes cleanly,
  auto-equip and revert both fire correctly against the current code.
  That's consistent with (not proof of) the "stale/un-redeployed Vercel
  build" hypothesis the item itself raised, but I have no record of the
  actual deployment URL anywhere in this repo (checked `README.md`,
  `ARCHITECTURE.md`, grepped for `vercel.app`/`vercel.com` — nothing), and
  this session has no way to interactively drive the live app the way a
  human playtest would (a static fetch wouldn't exercise portal-trigger
  movement). Genuinely can't complete "confirm on the actual live Vercel
  deployment" from here — left `todo`, not `blocked`, since a persistent/
  manual session with the deployment URL and a browser can pick this up
  directly rather than needing a decision.

## Phase 3 — Sea realm

Phase 1b completed 2026-08-31/09-01, unblocking this phase per its own
"blocked (on Phase 1b completing)" gate, same as Phase 2 (Air) did —
content specifics are left to my judgement per the 2026-08-26 world-model
decision (`DECISIONS.md`), so this proceeded without a fresh check-in.

- `done` Sea realm scoping + swim/buoyancy avatar controller
  (`src/sea/seaMovement.ts`, `src/sea/seaScene.ts`, `src/sea/seaRealmMap.ts`)
  — this phase's design pass and its first hardcoded/minimal content in one
  cycle, same visual-first sequencing land's Phase 1a and air's Phase 2
  both started with. `TerrainField` gained a real `"sea-floor"` kind
  (`src/world/realmMap.ts`: `floorY`/`surfaceY`/`wreckage`), matching the
  schema's own documented intent ("sea -> sea-floor depth + water
  surface"). Reuses land's `MoveInput` (`run` doubles as a stronger "kick")
  and air's vertical axis (`src/input/verticalInput.ts` — dive/surface),
  but the actual feel is genuinely its own, not air reskinned: horizontal
  accelerates more sluggishly and tops out lower (reads as water
  resistance), and vertical isn't purely input-driven — with no vertical
  input held, passive buoyancy drifts the swimmer toward the surface
  (`BUOYANCY_DRIFT_SPEED`), which active dive/surface input overrides
  outright rather than adding to. Also bounded, unlike air's free volume:
  position clamps between the sea floor and the water surface, with
  vertical velocity zeroing out on hitting either bound instead of banking
  a wasted push against it. `createSeaScene()` builds a fogged underwater
  volume (dimmer, cool-tinted lighting; a translucent surface plane; a sea
  floor) with scattered floating wreckage for parallax (`ARCHITECTURE.md`:
  each realm gets its own realm-appropriate floating content) and a plain
  procedural-capsule avatar — no skin-switching/animation-mapping
  refinement beyond reusing land/air's, same deferred polish air's own
  first Phase 2 item left for itself. No land↔sea portal yet (still a
  pending decision, `DECISIONS.md`) and no placement/save-load in sea's
  scope this cycle, mirroring how air's own first item left both for
  later. Reviewable now via `#dev-realm-panel`'s new "Sea" button. 21 new
  unit tests (`seaMovement.test.ts`, `seaRealmMap.test.ts`,
  `seaScene.test.ts`, plus 1 in `realmMap.test.ts`); 5 new E2E tests
  (`e2e/sea-swim.spec.ts`) cover realm switching, horizontal swimming,
  passive buoyant drift, active dive/surface overriding it, and switching
  back to land without cross-realm interference. **Review checkpoint:
  pending your look at the deployed app — try the Sea button in the dev
  panel.**
- `done` **Skins pickup: sea-specific avatar pitch.** World's own sea
  scoping above (and its `main.ts` comment) already wired `AvatarView` to
  the sea avatar and left a real sea-specific visual as future refinement
  — this is that refinement, picked up by the Skins track since it's
  `src/skins/avatarView.ts` territory. `AvatarView.setVerticalPitch`
  (new) leans the model into its actual vertical velocity — nose-down
  while diving, nose-up while surfacing/drifting — called only from
  `main.ts`'s sea branch with `seaMovement.velocity.y`; land/air have no
  meaningful vertical velocity to react to and don't call it, so their
  yaw-only `faceDirection` is untouched. Distinct from, and doesn't
  replace, the still-open swim-stroke-animation `todo` below — this is
  orientation, not a new animation clip (none of the current skins have
  one to use). **Sign convention verified against a real side-on render,
  not guessed**: an early version had it backwards (diving pitched the
  model's nose *up*) — caught by rendering the Fox from a true side
  camera angle (not the game's own steep 3rd-person view, same "render
  and look" lesson as the Robot-scale and Gold-metalness fixes) and
  fixed before landing, with the sign choice now recorded in the
  function's own comment so it can't silently regress. 4 new unit tests
  (`avatarView.test.ts`: settles to level at zero velocity, opposite
  signs for dive vs. surface, clamps past the tuned max velocity, eases
  rather than snaps for a small `dt`); 2 new E2E tests
  (`e2e/skins.spec.ts`, exercised through the Sea realm like the
  AvatarView-in-Air tests are exercised through Air) confirm dive/surface
  produce opposite tilts and that releasing vertical input eases the
  pitch back down as buoyancy takes over.
- `done` Sea-specific animation-*state* mapping
  (`src/sea/seaAnimation.ts`, `moveInputToSeaAnimationState`): land/air's
  generic `moveInputToAnimationState` (`src/skins/avatarSkins.ts`) only
  looks at horizontal move intent, which is right for both of them but
  wrong for sea — an active dive/surface hold (`vertical !== 0`, zero
  horizontal input) is real player-driven swimming that the generic
  mapping was scoring as "idle," so the avatar visibly stopped animating
  while the player was actively diving/surfacing straight down or up.
  Fixed by treating active vertical input as motion too, while
  deliberately *not* triggering on sea's own passive buoyancy drift
  (`BUOYANCY_DRIFT_SPEED` keeps `vertical` at exactly 0, so a player
  holding no keys still reads as idle/floating rather than perpetually
  "swimming"). Still resolves to the same shared `idle`/`walk`/`run`
  clip names — no bundled skin (Fox/Robot/Princess) has a distinct
  swim-stroke clip to map a fourth state onto, so the actual swim
  *animation* stays the separate, asset-gated `todo` right below; this
  closes the "wiring" half of the original item — correcting *when* sea
  shows motion, independent of *which* clip eventually plays for it.
  Distinct from, and doesn't overlap, the vertical-pitch item above
  (orientation vs. state-selection). 8 new unit tests
  (`seaAnimation.test.ts`); land/air keep calling the generic mapping
  unchanged — full suite verified (typecheck, 179 unit tests, build, 45
  E2E tests all pass).
- `done` **Real sea-specific swim-stroke animation clip** — the long-open
  item above, resolved. Found via a different reachable source than the
  ones previously checked: `github.com/J-Ponzo/gltf-universal-animation-library`,
  a GitHub mirror (not itch.io/quaternius.com, both still blocked) of
  Quaternius's CC0 Universal Animation Library, ships a rigged "Mannequin"
  mesh with 46 clips including real `Swim_Idle_Loop`/`Swim_Fwd_Loop`. New
  5th avatar skin `mannequin` (`public/assets/models/mannequin.glb`,
  trimmed from the source's 46 clips down to the 5 this project actually
  uses via `@gltf-transform/cli` prune — Idle_Loop/Walk_Loop/Sprint_Loop
  plus the two swim clips — landing at ~736KB; full provenance in
  `ATTRIBUTIONS.md`). Height measured for real (~1.83 at scale 1, close to
  Capsule's ~1.8, no correction needed) — same discipline as the
  Robot-scale/Princess-scale fixes, not guessed.
  Required real architecture, not just a new catalog entry: `MoveAnimationState`
  (`src/skins/avatarSkins.ts`) gained `swimIdle`/`swimActive` alongside the
  existing idle/walk/run — additive only, every other skin's clip mapping
  is untouched. `AvatarView.hasAnimation` (new) lets a caller check whether
  the active skin actually has a given clip; `withSwimAnimationState`
  (new, `src/sea/seaAnimation.ts`) uses that to route sea to the dedicated
  swim states only when the active skin has them, otherwise falling back
  to exactly today's shared walk/run behavior — Fox/Robot/Princess/Capsule
  are completely unaffected while swimming, verified by a dedicated E2E
  test alongside Mannequin's own. `moveInputToSeaAnimationState` itself is
  unchanged (still just decides *when* sea shows motion; the new function
  decides *which* clip). 7 new unit tests (`avatarSkins.test.ts`,
  `avatarView.test.ts`, `seaAnimation.test.ts`), 3 new E2E tests
  (`e2e/skins.spec.ts`: Mannequin's swimIdle/swimActive states, Fox's
  unaffected walk state, both realms' existing per-skin listing/height
  checks cover Mannequin automatically since they iterate `AVATAR_SKINS`).
  Verified visually with real screenshots (idle floating pose and mid-swim
  in Sea, plus Land for the shared walk/run clips) — the source mesh is a
  plain color-blocked mannequin (orange body, purple joint accents, no
  textures), rougher than Fox/Robot/Princess but functional and
  correctly-scaled; a nicer-looking swim-capable model would be a future
  swap, not a blocker on shipping the actual clips now.
- `done` **New "Female" avatar skin with real limb animation** — you noticed
  Princess stands frozen next to Mannequin's real arm/leg movement and
  asked if that's fixable. It isn't, not for Princess itself: its source
  file genuinely has no skeleton at all (see `ATTRIBUTIONS.md`), so no
  code change can animate it, and — same as the original Princess search —
  no reachable princess/royal-themed *rigged* source turned up this time
  either (Sketchfab, Quaternius's other repos, Kenney's character/fantasy
  kits, all checked). Per your call, this shipped as a new 6th skin
  (`female`) instead of touching Princess, so both are choosable and
  Princess is untouched. Source: `Mesh2Motion/mesh2motion-app` (CC0) — the
  `female_8` character mesh, which you picked after previewing it against
  `female_9` and `female` (the plain/untextured base) side by side, plus
  Mesh2Motion's shared "universal human" animation rig. The mesh and the
  animation library ship as two separate CC0 files with matching bone
  names but no baked-together clips (that's the point of a shared rig,
  not something this project's asset-per-skin, self-contained-glb pattern
  handles by default) — merged offline with a small `@gltf-transform/core`
  script that matches each of 5 clips' channels to the mesh's own skeleton
  by bone name and copies them over (all 990 channels matched, 0 dropped),
  landing at ~907KB. Height and facing verified for real (~1.76 at scale 1
  via `window.__getAvatarWorldHeight`, close to Capsule's ~1.8, no scale
  correction; walks away from camera on forward input with no
  `facingOffset` needed) — same discipline as the Robot-scale/Mannequin
  fixes, not guessed. 1 new E2E test for the skin switch itself plus 1 for
  its swim clips (mirroring Mannequin's); the existing per-skin
  height-ratio, catalog, and bob-vs-animation checks all cover it
  automatically since they iterate `AVATAR_SKINS`. Verified visually with
  real screenshots (idle vs. mid-stride) — full suite passes (typecheck,
  194 unit tests, build, 24 E2E tests in `skins.spec.ts` alone).
- `todo` **Superseded, see the centerpiece-wreck item below.** Originally:
  "Sea `RealmMap` hardening: real floating-docks content beyond the
  current hardcoded wreckage boxes, once reviewed."
- `done` **(World)** Land↔sea portal — flavor resolved 2026-09-07
  (`DECISIONS.md`): a diving-house structure on land, with a basement
  pothole as the actual transition point. Built as `landSeaPortal.ts`
  (same shape as `landAirPortal.ts`) plus a diving-house/sea-arch mesh
  pair (`divingHouseMarker.ts`) — a fixed landmark, not player-placeable,
  per the decision. Confirmed no new plumbing was actually needed: the
  generic transition system (`src/world/portalTransition.ts`) and
  `main.ts`'s `maybeTriggerPortal` already handled a third realm target
  once sea itself existed. See the fuller writeup under Phase 1b above
  (same item, tracked in both places).
- `done` **(Skins)** Dive-suit avatar skin for the diving-house portal
  above — built now that the World-owned portal item existed to wire
  against. New `avatarSkins.ts` catalog entry (`diveSuit`), `kind:
  "procedural"` like Capsule but not the same shape: a
  `proceduralVariant` field lets `AvatarView.buildVisual`
  (`src/skins/avatarView.ts`) dispatch to a distinct
  `createDiveSuitAvatarMesh` — same capsule body/footprint as the
  default procedural mesh (so it lines up with `AVATAR_GROUND_OFFSET`
  and reads at roughly the same height as every other skin) plus a pale
  "glass" mask and a bright tank, rough-primitives language matching
  `portalMarker.ts`/`divingHouseMarker.ts`. No external asset dependency
  — same reasoning Capsule itself never needed one.
  Auto-equip picked as the swap behavior (the implementation-detail
  choice the original item left open): `main.ts`'s `maybeTriggerPortal`
  equips the dive suit crossing into sea specifically through the
  diving-house portal (checked via `Portal.kind`, not just "any
  land<->sea transition", so a future differently-flavored land<->sea
  portal isn't forced into the same costume change) and reverts to
  whatever was worn before crossing back through it — but never fights
  an explicit choice: clicking any skin button (dive suit included)
  while auto-equipped clears the pending revert, same "an explicit
  choice always wins" rule `setActiveButton`'s own honesty already
  followed. Required hoisting the dev panel's skin-apply logic
  (`applyAvatarSkin`) out of the `#dev-skin-panel` setup block to module
  scope so both the click handler and the portal trigger share one path
  and the active-button highlighting stays correct either way.
  6 new unit tests (`avatarSkins.test.ts`: catalog shape;
  `avatarView.test.ts`: distinct visual, sane height vs. Capsule), 2 new
  E2E tests (`e2e/skins.spec.ts`: auto-equip + revert round trip,
  explicit choice overriding the pending revert).
  **Found and fixed a real E2E-flakiness trap while writing the
  tests, not just guessed at**: the diving house's sea-side arrival
  point sits close enough to the sea-side arch's own trigger that an
  immediate return swim can race `main.ts`'s 1.5s anti-bounce-back
  portal cooldown and blow straight through into sea's unbounded open
  water — fixed by explicitly outwaiting the cooldown before the return
  leg. Separately, `expect.poll`'s Node-side round trips (vs.
  `page.waitForFunction`'s in-page polling) left just enough of a lag
  between the real realm-flip and the test releasing its movement key
  that residual horizontal input leaked into the new realm and drifted
  the arrival off its intended spawn — caught by logging live position
  during a failing run (same "render/measure, don't guess" discipline as
  the Robot-scale and Gold-metalness fixes elsewhere in this codebase),
  fixed by switching realm-transition waits to `page.waitForFunction`.
  Verified visually with real screenshots (idle and mid-walk) that the
  mesh's authored front (the mask) actually leads in the direction of
  travel rather than trailing backward.
- `done` **Dive suit read as a plain capsule from common viewing angles —
  fixed.** Reported 2026-09-08 with a real screenshot: after auto-equip,
  the avatar looked completely undecorated, "turned into Capsule." The
  auto-equip and skin-resolution logic itself was verified completely
  correct (confirmed programmatically: `seaAvatarView.skinId` resolves to
  `diveSuit`, and the built visual really is a `THREE.Group` with
  `dive-suit-body`/`dive-suit-mask`/`dive-suit-tank` children, not a
  silent fallback) — the actual bug was legibility, not logic. Root
  cause, found by screenshotting from the real follow camera at several
  headings (front, back, side) rather than guessing: the mask and tank
  are each visible from only one narrow facing, and the mask specifically
  sat close enough to the body's own surface, and was pale/transparent
  enough, to read as invisible once it was actually facing the camera
  (reproduced directly: turned the avatar to face camera, mask vanished
  entirely). Fixed two ways in `createDiveSuitAvatarMesh`
  (`src/skins/avatarView.ts`): (1) the mask and tank now protrude further
  from the body and carry a touch of `emissive` plus higher opacity/
  saturation, so they hold up under Sea's dim cool-tinted fog once they
  do face the camera; (2) a new waist belt (a `TorusGeometry` ring around
  the whole body) reads as equipment from *every* heading, including
  dead-on front/back and side-on — the actual fix for "invisible from
  some angle," since it doesn't depend on which way the avatar is facing
  at all. Verified visually with real screenshots from idle, back
  (walking away — tank visible), front (walking toward camera — belt
  visible even though the mask still doesn't clear the body from dead-on),
  and a side/strafe angle (mask, tank, and belt all visible at once — the
  best-case angle). No test depended on the old geometry values; full
  suite still green (typecheck, 215 unit tests, build, 61 E2E tests).
- `done` **Dive suit still read as basically a plain capsule after the
  above fix — fixed again, this time with more silhouette, not just
  brighter color.** Reported 2026-09-09 with another real screenshot
  (Female skin, swum through the diving house): the avatar showed as a
  dark capsule with one small pale-blue dot and one thin gold ring —
  recognizably *not* a diver. Reproduced first, not guessed: same
  Playwright-against-a-real-dev-server screenshot from the actual follow
  camera, idle/facing-camera/side, matched the report exactly. This
  wasn't the same legibility bug as the 2026-09-08 fix above (that one's
  mask/tank/belt were all present and rendering, just from the wrong
  angle/too faint) — this time the pieces were all visible and bright
  already, there just weren't enough of them to read as a diver instead
  of a decorated capsule; a bigger mask and a slightly bigger belt were
  never going to fix a shape problem. Rebuilt `createDiveSuitAvatarMesh`
  (`src/skins/avatarView.ts`) with more silhouette-changing pieces
  instead: (1) the mask became a flat-fronted box (an actual face-plate
  shape, not an ambiguous sphere) plus a new head-strap ring — the belt's
  own "reads from every angle" trick, now applied to the head too, so the
  head's silhouette changes from every heading, not just its front face;
  (2) a second, higher chest-strap ring in addition to the waist belt, so
  a head-on view (where the tank itself is hidden behind the torso) still
  reads as a harness, not just a belt; (3) a wide flipper plate at the
  feet — divers' single most recognizable silhouette cue, and flat/
  centered so it reads the same from every heading like the belt does.
  Verified visually with real screenshots (idle, facing-camera, side, and
  a zoomed-in crop of front and back) — clearly reads as a diver in gear
  from every angle checked, not a plain capsule. Full suite green
  (typecheck, 215 unit tests, build, 61 E2E tests including both
  diving-house auto-equip/revert tests) — no test depended on the
  specific geometry, only on skin ids and mesh child existence.
  **Follow-up same day**: you asked specifically for flippers, still
  reading as a capsule — right call, the (3) "flipper plate" above was a
  flat box that only peeked out as a thin sliver, not an actual fin
  shape. Replaced it with two real paddle-shaped blades (`dive-suit-
  flipper-left`/`-right`: a flattened, elongated sphere each, splayed
  outward and forward past the body) instead of one centered plate.
  Re-verified visually (idle, side, zoomed front/back) — now
  unmistakably fin-shaped, not a sliver. Full suite re-verified green
  (typecheck, 215 unit tests, build, all 27 skins.spec.ts E2E tests).
  **Second follow-up same day — reframed from scratch**: you clarified
  what you actually wanted was for the dive suit to be "a skin on a
  character," not its own separate body at all — you couldn't tell from
  a screenshot whether Female, Princess, or Fox was the one wearing it,
  because every one of them was being replaced by the same generic
  capsule-derived diver underneath the gear. Fair point, and a different
  ask than the previous two rounds (which only ever polished that generic
  body's own legibility). Reworked the whole mechanism instead of the
  geometry again: `AvatarView` now tracks `underlyingSkinId` (the last
  *real* skin worn) and, when the dive suit is equipped, rebuilds that
  real skin's own visual (Fox/Female/Princess/Robot/Mannequin/Capsule,
  whichever was active) and layers `createDiveGearOverlay` on top of it,
  instead of building a fixed, separate body — mask/head-strap/chest-
  strap/belt/tank/flippers now scale to *that character's own* bounding
  box (fractions of its measured height/width) rather than the capsule's
  hardcoded dimensions, so gear fits Fox, Female, Robot, or anything else
  without a per-skin special case, and each character stays visibly
  itself underneath. `createDiveSuitAvatarMesh` is gone; `avatarSkins.ts`
  dropped the now-unused `proceduralVariant` field (the id check in
  `buildVisual` decides this now, not a catalog flag). On reverting
  (crossing back out through the diving house, or picking a skin from the
  dev panel), the wearer's own real skin renders exactly as it would
  have without ever equipping the suit. Hit one real bug rebuilding this:
  measuring a fresh, not-yet-scene-attached glTF clone's bounding box via
  `THREE.Box3().setFromObject` came back ~30x too small for a skinned
  model (confirmed directly — Fox measured ~0.07 world units instead of
  its real ~2.24) because `Box3.expandByObject` only updates each node's
  own `matrixWorld` as it visits it, in whatever order `children` holds
  them, so a `SkinnedMesh` visited before its own bone hierarchy computes
  its skinned box from bones still at their default identity transform;
  fixed by forcing `updateMatrixWorld(true)` (full recursive update, not
  just the visited node) before measuring. Verified visually with real
  screenshots across Fox, Female, Princess, and Capsule (each now clearly
  recognizable, wearing gear sized to its own body) plus a new unit test
  (`avatarView.test.ts`) asserting the actual gltf model — not a
  substitute — stays in the tree with its animation clips intact while
  the dive suit is equipped. Full suite green: typecheck, 215 unit tests,
  build, 61 E2E tests (including both diving-house auto-equip/revert
  tests, unchanged since this is purely how the dive suit *builds* its
  visual, not the trigger/revert flow around it).
  **Third follow-up same day**: you asked why the dive suit had so many
  yellow rings — fair, the gear overlay above still carried three
  same-colored torus rings (head strap, chest strap, waist belt) over
  from the capsule-only version's own "a ring reads from every angle"
  fix. That trick mattered when the gear's silhouette was the *only*
  thing making the avatar read as a diver; now that it's decorating an
  already-distinctive real character, three stacked rings just look like
  hula hoops. Cut down to one (the waist/weight belt) plus the mask and
  tank, which read as gear on their own. Re-verified visually across
  Fox, Female, and Princess — much cleaner, still clearly "wearing dive
  gear." Full suite re-verified green.
  **Fourth follow-up same day**: asked directly why there was "a blue
  box in front of each avatar" — the mask, honestly, was just a flat
  cyan box floating in front of the face with no frame or strap, so
  fair: it didn't read as a mask at all, just an unexplained rectangle.
  Rebuilt it as three parts instead of one: a dark rubber skirt/frame
  sized to sit flush against the face, a smaller lighter lens inset
  within it (protruding a touch further, like glass sitting inside a
  frame), and a thin strap around the head anchoring it — the strap is
  dark, not the gold "equipment" color, since it's a functional part of
  the mask itself rather than another bright accessory ring (the point
  of the immediately-preceding "too many yellow rings" trim). Verified
  visually across Fox, Female, and Princess — now clearly reads as
  goggles worn on the face. Full suite re-verified green.
  **Fifth follow-up same day**: "the mask should be on the face not a
  box" — still true after the frame/lens/strap rebuild above, because
  that rebuild pushed the frame and lens forward *past* the character's
  own front surface (`box.max.z + headRadius * 0.2`/`* 0.4`), so despite
  having a frame and a strap now it still read as a small box hovering
  in front of the face rather than something worn on it. Re-centered the
  frame directly on `box.max.z` (embedded roughly half into the face
  surface, the same placement the waist belt already uses) so it sits
  flush instead of floating clear of it — and bumped `headY`'s fraction
  up from 0.75 to 0.8 while at it, aiming for closer to the actual face
  height. That second part was a mistake caught by looking, not assumed
  fixed: re-screenshotting showed the lens fully swallowed by the now-
  flush opaque frame (embedded lens, invisible from outside) and, on
  Fox specifically, the head-strap ring sitting up near the ears reading
  as a stray ring floating above the head. Reverted `headY` back to 0.75
  (it was never the problem) and fixed the actual lens bug — its front
  face needs to clear the frame's own front face by a real margin, not
  sit just inside it — by centering the lens right at the frame's front
  face so the lens's own front half pokes out past it. Re-verified
  visually across Fox, Female, and Princess again: frame sits flush on
  the face, lens visible, no stray ring. Fox's placement is still an
  approximation (a single height-fraction + front-z heuristic tuned for
  bipeds doesn't map cleanly onto a quadruped's face) but no longer
  visibly broken. Full suite re-verified green.
  **Sixth follow-up same day — asked for an actual redesign, not another
  position nudge**: right call. Every fix up to this point moved the
  same hard-edged box around; the box shape itself was the problem — a
  flat-faced rectangle just doesn't read as something worn on a face no
  matter where it sits, it reads as a sign held up to one. Rebuilt the
  frame and lens as scaled spheres (`SphereGeometry` + non-uniform
  `.scale`) instead of boxes: smooth, rounded in every direction, no
  hard corners, and deliberately narrower than the full head width (real
  dive-mask/goggle skirts span eyes + nose, not ear to ear — the old box
  spanned nearly the whole head, which was also part of why it read as
  a plate rather than eyewear). Kept the same "frame embedded flush at
  the face surface, lens anchored right at the frame's own front face so
  it still pokes out and stays visible" placement logic from the
  previous two rounds (that part was already right; it was the shape
  riding on top of it that was wrong) and the same dark, non-gold strap.
  Verified visually across Fox, Female, and Princess, plus a zoomed
  crop — now reads as rounded goggles sitting close to the face on every
  skin checked, not a floating or flush box. One real E2E failure hit
  during verification and confirmed (not assumed) to be a flake, not a
  regression: `skins.spec.ts`'s diving-house revert test timed out once
  under 2-worker parallel load, then passed clean both run alone and in
  a full re-run of the file. Full suite green: typecheck, 215 unit
  tests, build, 27 skins.spec.ts E2E tests.
  **Seventh follow-up same day — still "too out of place"; asked to
  actually attach it to the face like a real mask.** Right diagnosis:
  every fix through the sixth round, including that one, was still just
  repositioning a box-fraction estimate (`box.max.z` + a height fraction
  of the whole body) — a reasonable guess at "roughly where the head is,"
  never an actual attachment to the face. Checked whether a real
  attachment point exists rather than assuming one didn't: dumped every
  current skin's bone names directly (not guessed), and every skin with a
  real skeleton (Fox, Robot, Mannequin, Female — everything except
  Princess, which has none) ships a bone with "head" in its name (Fox's
  `b_Head_05`, Robot's `Head`, Mannequin's `DEF-head`, Female's `head`).
  Rebuilt the mask around that: split it out of `createDiveGearOverlay`
  into its own `createMaskGroup` built at local origin, and a new
  `findHeadBone`/`syncMaskToHeadBone` pair that locates that bone and
  moves the mask group to track its actual world position every single
  frame (in `AvatarView.update`, after the mixer has applied that frame's
  pose) — so the mask now follows real head motion from the character's
  own animation (a walk cycle's head bob, a swim stroke) instead of
  sitting at a fixed point computed once. Skins with no skeleton at all
  (Princess, Capsule) keep the old static box-fraction placement as a
  fallback, unchanged. Hit and fixed one real bug getting here, caught by
  measuring rather than assumed correct: the forward offset (how far past
  the bone's own pivot — typically the neck/skull joint, not the face —
  to push the mask) was first derived as a flat fraction of `headRadius`
  (itself from *torso* width), which worked passably for compact humanoid
  heads but buried the mask almost entirely inside Fox's elongated snout
  — measured directly (not guessed) at a ~0.91-world-unit gap between the
  bone and the actual nose tip, against only ~0.24 of forward push from
  the old formula. Fixed by measuring that forward reach directly per
  character instead (`box.max.z` minus the bone's own world Z — "how far
  this character's face actually extends past its head bone"), computed
  once at build time and reused every frame. Verified visually across
  Fox (now clearly sitting over the eyes/snout, a real fix — zoomed crop
  confirms it) and Female, both idle and mid-walk (confirms the
  per-frame tracking actually holds up under animation, not just at
  rest). Full suite green: typecheck, 215 unit tests, build, 61 E2E
  tests.
  **Eighth follow-up, next day (2026-09-10)**: the dive-mask shape
  candidates were compared side by side first this time (three
  variants — thin visor band, wide single-pane wraparound mask, twin
  swim goggles — screenshotted on Fox and Female without touching the
  committed code) rather than iterating another shape blind; the wide
  single-pane mask was picked as the real design. Reported back with two
  concrete problems on it: oversized on Female, misaligned to one side
  on Fox. Root-caused both before touching code, then fixed:
  (1) **sizing** — `headRadius` was derived from the whole body's
  bounding-box *width* (shoulders included), a proxy that happened to
  read fine against Fox (a quadruped's width is close to its actual head
  width) but put a mask sized for shoulders on Female's head — and
  measuring, not assuming, found it was worse than plain shoulder width:
  her rig's bind pose is a T-stance (arms straight out), so "body width"
  was really her full arm-span. (2) **alignment** — `syncMaskToHeadBone`
  only tracked the head bone's *position*, not its rotation; Fox's idle
  clip is named `"Survey"` (a look-around animation), so whenever it
  turned the head independent of the body, the mask kept projecting
  forward along the body's fixed axis instead of the now-turned face,
  drifting visibly to one side. Fixed sizing by deriving `headRadius`
  from the character's own measured *height* instead of width (pose-
  stable — a T-pose doesn't change how tall a character stands, unlike
  how wide it measures). First attempt at this actually measured the
  real head-mesh vertices directly (bounding-box of whatever's
  predominantly skinned to the head bone) rather than a proportional
  guess — abandoned after measuring, not assuming it worked: on Female
  specifically (a mesh + rig merged from separate sources, see
  `avatarSkins.ts`'s `female` entry) most of her visible head came back
  weighted to other bones, undermeasuring badly enough to put the mask
  at her neck. Fixed alignment by tracking the bone's full transform
  (position *and* rotation) via a fixed matrix expressing the mask's
  transform relative to the bone's own bind pose, reapplied on top of
  the bone's current world matrix every frame — mathematically the same
  thing parenting the mask under the bone would give, computed by hand
  to avoid inheriting the bone's own local coordinate scale. Verified
  visually at high resolution (1800×1400 @2x — small default screenshots
  weren't reliable for this level of detail) on both Fox and Female;
  also confirmed directly (not assumed) that the rotation fix visibly
  works — Fox's mask now genuinely turns with its head through the
  "Survey" animation's look-around cycle, sampled every ~500ms across
  several seconds. Full suite green: typecheck, 215 unit tests, build,
  61 E2E tests.
  **Ninth follow-up, same day**: reported two more pieces that "don't
  fit the dive suit narrative" — a big yellow box behind Female's body
  (the tank) and a round hula hoop around her body (the waist belt).
  Same root cause as the eighth follow-up's mask-sizing bug, just never
  applied to the rest of the gear: `createDiveGearOverlay`'s
  `torsoRadius` (which sizes and places the tank, belt, *and* flippers)
  was still derived from the whole body's bounding-box *width* — and
  since Female's bind pose is a T-stance, that width was really her
  ~1.48-world-unit arm-span, on a 1.71-tall character. A belt/tank sized
  off arm-span reads exactly as reported: a hula hoop wide enough to
  loop around her outstretched arms, and a tank cylinder inflated into a
  slab. Fixed the same way the mask's `headRadius` already was: derive
  `torsoRadius` from measured *height* instead, with the proportionality
  constant picked to land close to Fox's own already-correct look under
  the old formula (Fox's build was never T-pose-distorted, so this
  doesn't regress the one skin the old formula happened to suit) —
  flippers' size/placement (which also read raw body width before)
  switched to derive from the corrected `torsoRadius` too, for the same
  pose-stability reason. Verified visually at high resolution: belt now
  sits snugly at the actual waist on Female, tank reads as a normal-
  sized cylinder strapped to her back (checked from behind specifically,
  since it's meant to be mostly hidden from the front) and Fox
  unaffected. Full suite green: typecheck, 215 unit tests, build, 61
  E2E tests.
  **Tenth follow-up, same day**: "not a rubber tube, too bulky" on the
  belt specifically. Real self-inflicted regression from the ninth
  follow-up just above, not a fresh style complaint: the belt's tube
  radius was a fixed `0.05`, tuned back when `torsoRadius` was still the
  arm-span-inflated body-width figure (~0.4-0.78), where a fixed 0.05
  read as a slim ~6-12% of the ring's own radius. Shrinking `torsoRadius`
  to the correct waist-based size (previous fix) without also scaling
  this down left the belt *relatively* much thicker than before — same
  absolute thickness wrapped around a smaller ring reads as a chunkier
  ring, not the same belt at the right size. Fixed by making the tube
  radius a fraction of `torsoRadius` (`* 0.08`) instead of a fixed
  number, so it scales down together with the ring, plus flattened it
  (`scale.y`) into a strap's flat cross-section instead of a round
  cord/hose. Verified visually on both Female (now a slim flat strap,
  not a tube) and Fox (unaffected). Full suite green: typecheck, 215
  unit tests, build, 27 skins.spec.ts E2E tests.
  **Eleventh follow-up, next day (2026-09-11)**: "Belt is now below the
  buttocks for female, it should be on the waist?" Pre-existing bug, not
  a new regression: the belt's vertical position (`waistY`, a fraction of
  total body height) had been `0.44` since the belt's very first version
  — in classic 8-heads-tall figure proportions that lands around the
  crotch/upper-thigh line, not the waist (the crotch itself sits at
  ~0.5). Only became visible now because the ninth follow-up's size fix
  turned the belt into a properly snug ring with an actual height to
  judge; the old oversized arm-span-derived hoop never read as sitting at
  any particular height. First tried raising it to `0.56` — confirmed by
  rendering as Female's correct natural waist — but that regressed Fox:
  a side-view render showed the belt mostly swallowed inside Fox's torso,
  only a sliver visible under the belly. Root cause: a single height
  fraction can't place a "waist" ring correctly on both body plans this
  overlay fits. Measured Fox's and Female's boxes directly rather than
  guessing further — Fox is height 2.37 but *depth* (nose-to-tail)
  4.64, nearly twice as deep as tall; Female is height 1.71 and depth
  just 0.29 (T-pose only distorts her *width*, per the ninth follow-up's
  own note, so depth-vs-height stays a reliable signal even on a T-posed
  rig). Fixed by picking the fraction from that same depth-vs-height
  shape signal instead of a single constant: deep-bodied
  (quadruped-like, `depth > height * 0.6`) characters keep the original
  `0.44` (already correct — a belly-height ring on Fox), upright ones get
  the corrected `0.56` (Female's natural waist). A geometric read of the
  measured box, not a per-skin-name special case, so it should transfer
  to any future quadruped or biped skin without new code. Verified
  visually on both Female (belt now clearly at the natural waist, just
  below the tank straps) and Fox (belt back to a clearly visible ring
  around the belly, no longer hidden). Full suite green: typecheck, 215
  unit tests, build, 61 E2E tests.
- `todo` **(World) Centerpiece shipwreck landmark.** Locked in during a
  2026-09-08 design review, supersedes the sea-floating-docks item above:
  a single large, dramatic broken-ship hull + mast as a real landmark
  (bigger and more distinct than the existing `SEA_WRECKAGE_POSITIONS`
  debris boxes), rather than re-skinning every small piece individually.
  Worth considering placement near the diving-house sea-side arrival
  (`landSeaPortal.ts`'s `SEA_ARRIVAL_POSITION`, or nearby) so it ties
  into that portal's own story, but not required — World's call once
  actually laid out. Keep the existing smaller wreckage pieces around it
  for scale/parallax; this adds one real centerpiece, it doesn't replace
  the whole field. Same procedural-primitives-first approach as
  everywhere else in this codebase for a first pass.

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
