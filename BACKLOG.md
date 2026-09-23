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

1. `done` Air floating/pitch parity fix (Phase 2 below, 2026-09-08), plus a
   2026-09-09 refinement (Air's animation-*feel* pass below).
2. Dive-suit auto-equip bug (`todo` under Phase 2 below — still open,
   re-checked 2026-09-09: this session's network policy still blocks
   `tri-realm.vercel.app` outright (403, same policy denial as before),
   so the live-deployment reproduction step is still not solo-actionable
   — needs a human with a real browser).
3. `done` Environment art pass — land parkland dressing (Phase 1a), cloud-
   shaped air platforms (Phase 2), sea shipwreck centerpiece (Phase 3,
   supersedes the old sea-floating-docks item). All three landed
   2026-09-09 in one cycle (see each phase section below for the
   individual writeups).
4. `done` Real Quaternius castle-piece models (Skins / visual identity
   below, 2026-09-09).
5. Camera framing revisit (`todo` under "Skins / visual identity").
6. `done` Air-appropriate procedural "Bird" avatar skin (Skins / visual
   identity below, 2026-09-10 — asked for directly, not previously in
   this list).

Everything under "Later / unscoped" stays parked behind all of the above
with no target, as before — **except 2026-09-11's world cycle**, which
found every item above either `done` or genuinely stuck for this track
(item 2 needs a human; item 5 lives outside World's own section) and
pulled forward "Structure types beyond castles" (`Later / unscoped` below)
rather than stall — a new `castle-tower` type, per `AUTONOMY.md`'s "new
content on an established pattern" bar for not needing a decision — and
**2026-09-12's world cycle**, same situation again (item 2 still needs a
human, item 5 still lives outside this track's section), which pulled
forward "Climbable-slope limit + terrain-face collision" (`Later /
unscoped` below) instead — a real `src/land/` bug fix/core-system gap
closed, not new content, but the same "don't manufacture busywork, don't
stall either" reasoning applies equally to a genuine fix as to new content
— and **2026-09-13's world cycle**, same situation a third time (item 2
still needs a human, item 5 still lives outside this track's section) and
now `Later / unscoped` itself had nothing left but out-of-scope
multiplayer, so this cycle looked past both lists to `ARCHITECTURE.md`'s
own construction-system section, which had flagged real unbuilt scope
("sea/air add their own catalog + rule later") that neither list had ever
turned into a concrete item — built sea's own structure catalog +
placement (Phase 3 below, 2026-09-13), same "new content on an
established, data-driven pattern" bar the two prior pulls-forward used —
and **2026-09-16's world cycle**, same situation again (item 2 still needs
a human, item 5 still lives outside this track's section, `Later /
unscoped` has nothing left but out-of-scope multiplayer), which found
`ARCHITECTURE.md`'s own construction-system section still had one more
flagged gap sea's own item didn't close — "air still has no placement/
save-load" — and closed that one too: air's own structure catalog +
placement (Phase 2 below, 2026-09-16), the third and final realm to plug
into the shared pipeline — and **2026-09-17's world cycle**, same
situation again (item 2 still needs a human, item 5 still lives outside
this track's section, `Later / unscoped` has nothing left but out-of-scope
multiplayer, and construction-system's own gaps are now all closed), which
re-read `ARCHITECTURE.md`'s Avatar controller section instead and found a
different kind of gap: its "Land module" summary has claimed "walk/run,
gravity, ground collision, jump" since the section was first written, but
jump was never actually implemented — closed in `Later / unscoped` below
("Land jump," 2026-09-17) — and **2026-09-18's world cycle**, same
situation again (item 2 still needs a human, item 5 still lives outside
this track's section, `Later / unscoped` has nothing left but out-of-scope
multiplayer), which found a real gap of its own kind while tracing
2026-09-17's own "Land jump" item: land's jump and air/sea's vertical axis
both read `input.getVerticalInput()`/`consumeJumpPressed()` off
`KeyboardInput` alone — `main.ts` never merged in a touch source for
either, the way horizontal move input already merges keyboard with
`TouchJoystick` (`combineMoveInputs`). A touch device has no keyboard at
all, so this meant Space/Control were completely unreachable on a phone:
no way to jump on land, and no way to ascend/descend in Air or dive/
surface in Sea — closed in `Later / unscoped` below ("Touch vertical
controls," 2026-09-18) — and **2026-09-19's world cycle**, same situation
again (item 2 still needs a human, item 5 still lives outside this
track's section, `Later / unscoped` has nothing left but out-of-scope
multiplayer), which found the last gap in this same thread: jump and the
vertical axis both worked correctly by now, but the on-screen controls
hint never told a player either existed — closed in `Later / unscoped`
below ("On-screen controls hint," 2026-09-19) — and **2026-09-20's world
cycle**, same situation again (item 2 still needs a human, item 5 still
lives outside this track's section, `Later / unscoped` has nothing left
but out-of-scope multiplayer), which moved the gap search to
`ARCHITECTURE.md`'s "Realm connections" section instead and found a real,
explicitly-wanted, never-built piece of scope: the land↔air stairway,
the portal's second flavor `DECISIONS.md` (2026-09-02) always intended as
"a second catalog entry, not new plumbing" once the balloon proved the
mechanism — built in Phase 2 below, 2026-09-20 — and **2026-09-20's skins
cycle**, same situation yet again for this track specifically (item 2
still needs a human, item 5 is this track's own but still genuinely
blocked by the E2E blast-radius reasoning below), which merged in that
same stairway work from `main`, found and closed one real stale-doc gap
it left behind (`ARCHITECTURE.md`'s "Realm connections" section still
said "a stairway is still wanted" after the stairway had already shipped
that same morning), and found no further unblocked Skins-track gap this
time — see the "Skins / visual identity" section's own 2026-09-20 note
for the full account of what was checked — and **2026-09-21's world
cycle**, same situation again (item 2 still needs a human, item 5 still
lives outside this track's section, `Later / unscoped` has nothing left
but out-of-scope multiplayer, and `ARCHITECTURE.md` had no further
flagged-but-unbuilt gap left after the stairway closed the last one), so
this cycle looked at the construction catalogs themselves instead: land's
own (`castleStructures.ts`) had grown to four types (Keep/Wall/Gate/Tower)
since Phase 1b, while sea's and air's (`seaStructures.ts`/`airStructures.ts`)
were each still exactly the single starter type they shipped with
(2026-09-13/09-16) — a real, lopsided gap, not manufactured busywork, and
squarely "new content on an established, data-driven pattern within an
already-chosen realm," `AUTONOMY.md`'s own bar for not needing a decision.
Gave sea and air each a second type (Phase 2/3 below, 2026-09-21) — and
**2026-09-21's skins cycle**, same situation yet again for this track
(item 2 still needs a human, item 5 is this track's own but still
genuinely blocked by the same E2E blast-radius reasoning below). This
cycle's own sync from `main` was a clean fast-forward (World's same-day
"Sea and air structure catalogs" cycle above, no Skins-territory
overlap). Checked in-flight branches before searching for a gap:
`claude/dive-suit-auto-equip-zb1qvy` and
`claude/garden-implementation-status-g3b8o5` are both now 10 days stale
(last commit 2026-09-11) — neither is this track's own daily branch, so
per `AUTONOMY.md`'s merge protocol neither was touched, just re-noted
here again. Re-confirmed the live deployment is still unreachable from
this session (`curl` against `tri-realm.vercel.app` still returns the
same 403 policy denial, same as every prior check) — item 2 stays
genuinely not-solo-actionable. Searched for a real gap the way recent
cycles have (stray `TODO`/`FIXME` grep across `src/`/`e2e/`: none;
`ATTRIBUTIONS.md` vs. `attributions.ts` re-compared: still in sync) and
found one in genuinely-shared `ARCHITECTURE.md`'s own Skins section: its
"Realm-agnostic by construction" bullet still claimed air reuses land's
generic `moveInputToAnimationState` and that "both still resolve to the
same shared idle/walk/run clip names; a real air/sea-specific animation
*clip* mapping (e.g. a distinct swim-stroke) remains future refinement" —
both false since `withSwimAnimationState`/`withFloatAnimationState` and
air's own `moveInputToAirAnimationState` shipped (`BACKLOG.md`'s Phase
2/3 history), the exact stale-doc-describing-already-shipped-code shape
the 2026-09-20 stairway-doc fix closed for World's territory, this time
in this track's own. Reworded to describe the real two-step state-then-
clip pipeline (`ARCHITECTURE.md`'s Skins section). No behavior change, so
no new tests; full suite re-verified after the merge and the edit
(typecheck, 324 unit tests, build, 84 E2E tests, all green).

**2026-09-22's world cycle**, same situation yet again (item 2 still needs
a human, item 5 still lives outside this track's section, `Later /
unscoped` has nothing left but out-of-scope multiplayer, and
`ARCHITECTURE.md` had no further flagged-but-unbuilt gap after the prior
cycle's doc fix). This cycle's own sync from `main` was a clean
fast-forward (the prior day's skins-cycle doc fix, no World-territory
overlap). Rather than reach for another catalog-symmetry pass (sea/air
just got a second type each the day before — doing that again purely to
chase land's count would start to look like manufactured busywork, not a
found gap), looked at the construction system's own mechanics instead and
found a real, load-bearing one missing: **there was no way to remove a
placed structure at all, in any realm, once placed.** `PlacedStructure`s
only ever accumulate (`addStructure`) — a misclick (land's own "clicking
an existing piece stacks on top of it" behavior means an overshoot lands a
piece somewhere unwanted) was permanent for the rest of the session, no
recourse short of clearing localStorage and losing everything else built
too. Squarely this track's own charter (`AUTONOMY.md`: "construction/
placement mechanics") and core-system completeness in the same vein as
"Land jump"/"Climbable-slope limit" below, not new content and not a
data-model change (removing an entry from `structures` is already
save-format-compatible, no schema change needed).
Built "undo last placement," keyboard-only first — same staged approach
"Land jump" (2026-09-17) then "Touch vertical controls" (2026-09-18) used,
rather than trying to design a click-to-select-and-delete interaction (a
much larger, riskier UI surface, and a bigger blast radius across every
realm's raycast/stacking logic) in one pass:
`removeLastStructure(map)` (`src/world/realmMap.ts`) is `addStructure`'s
mirror image — immutable, pops the last entry, a genuine no-op (`removed:
undefined`, same map reference) on an already-empty map rather than
throwing. `KeyboardInput.consumeUndoPressed()` (`src/input/keyboardInput.ts`)
is a dedicated `KeyX` binding with the identical reset-on-read/rising-edge
shape `consumeJumpPressed()` already established (holding the key doesn't
undo repeatedly). `main.ts` gained `removeLastLandStructure`/
`removeLastSeaStructure`/`removeLastAirStructure` — each self-guards on
`activeRealm` exactly like `placeCastlePieceAt`/`placeSeaPieceAt`/
`placeAirPieceAt` already do, dispatched from one shared
`removeLastPlacedStructure()` the same "call all three unconditionally,
only the active one does anything" shape `placeStructureAt` uses — so a
press while flying/swimming can't reach back and undo something on land
later, and consuming the key every frame regardless of realm (mirroring
how `jumpPressed` is always consumed) means a stray press can't queue up
across a realm switch either. Each removal also deletes the piece's actual
rendered mesh from its realm's scene (`placedMeshes`/`seaPlacedMeshes`/
`airPlacedMeshes`, keyed by the same `PlacedStructure.id` the placement
functions already use) and re-persists that realm's map, so an undone
piece is really gone, not just hidden, and doesn't come back on reload.
Land's HUD (`#hud-structures`) updates immediately via the existing
`updateStructuresHud`; sea/air have no visible HUD counter (unchanged, per
`AUTONOMY.md`'s "UI layout convention"), same as their own placement
already works — covered by their existing debug-hook pattern instead.
`#hud-controls` gained "Undo: X" — same "an unreachable-without-a-hint
control is a real player-facing gap" reasoning the 2026-09-19 "On-screen
controls hint" item already used for jump/vertical, checked directly
against the narrow-viewport overlap-regression test rather than assumed
safe.
Touch has no undo button yet — deliberately out of scope this cycle, same
"keyboard first, a future cycle can add touch parity" reasoning "Land
jump" used; unlike jump (which blocked an entire *input axis* from ever
being reachable on a phone), a misplaced structure without a touch undo
is inconvenient, not a completely missing capability, so it doesn't carry
the same urgency "Touch vertical controls" (2026-09-18) had.
5 new unit tests (`realmMap.test.ts`: no-op on empty, removes the actual
last-added structure without mutating the input, stays a no-op on a
second call once already empty) plus 5 new (`keyboardInput.test.ts`:
`consumeUndoPressed` mirrors every one of `consumeJumpPressed`'s own
cases — false when idle, true once per fresh press, no re-queue while
held, re-arms after release, independent of the jump queue). 4 new E2E
tests: land (`castle-placement.spec.ts`) confirms undo removes the actual
most-recent piece (checked via the HUD's own "last placed position"
reverting to the first piece's, not just the count dropping) and that
undo with nothing placed is a silent no-op; sea (`sea-construction.spec.ts`)
confirms undo removes a sea piece but pressing it while switched back to
land does nothing to sea's own count (each realm's self-guard actually
holds, not just assumed from reading the code); air
(`air-construction.spec.ts`) confirms the same removal shape there. Full
suite verified (typecheck, 332 unit tests, build, 88 E2E tests, all
green, including the narrow-viewport overlay-regression check with the
updated `#hud-controls` wording).

**2026-09-23's world cycle**, same situation yet again (item 2 still needs
a human, item 5 still lives outside this track's section, `Later /
unscoped` has nothing left but out-of-scope multiplayer). This cycle's own
sync from `main` was a clean fast-forward (the prior day's skins-cycle doc
fix, no World-territory overlap). Re-checked `ARCHITECTURE.md` and the
stray-`TODO`/`FIXME` grep the way recent cycles have — nothing new — so
instead closed the touch-parity gap the prior day's own undo item had
explicitly deferred: undo (`KeyX`) shipped keyboard-only on 2026-09-22,
"a smaller, additive follow-on, not required to make undo usable at all
the way touch's missing vertical axis was" — but it's still a real gap
(a misplaced structure had no recovery at all on a touch-only device),
same "genuine follow-on this track already flagged for itself" bar
"Touch vertical controls" (2026-09-18) used against "Land jump"
(2026-09-17).
`TouchUndoInput` (`src/input/touchUndoInput.ts`) mirrors
`KeyboardInput.consumeUndoPressed()`'s shape exactly — a single button,
rising-edge queued, reset on read — simpler than `TouchVerticalInput`
since undo is a discrete action with no held/axis state to track. A third
button (`#undo-button`, "↺") joins `#vertical-controls`' existing flex
column in `index.html` rather than claiming a new fixed screen position —
the column just grows, same "avoid overlap by construction" idiom
`#dev-panels` already established, verified by the narrow-viewport and
real-touch-device overlap-regression checks in `e2e/skins.spec.ts` (both
still pass unchanged — `#vertical-controls` is checked as one box there,
so a taller box needed no test update) and confirmed with a real
Pixel-5-viewport screenshot. `main.ts`'s undo consumption now merges
`input.consumeUndoPressed() || touchUndo?.consumeUndoPressed()`, the same
merge shape `jumpPressed` already uses for its own two sources.
`#hud-controls`' hint text gained "or ↺" after "Undo: X".
5 new unit tests (`touchUndoInput.test.ts`, mirroring
`touchVerticalInput.test.ts`'s own coverage of the rising-edge/reset-on-
read/touchcancel-releases-like-touchend shapes). 1 new E2E test
(`e2e/touch-controls.spec.ts`): tapping the undo button after a touch
placement removes it, mirroring `castle-placement.spec.ts`'s own keyboard
undo test. Full suite verified (typecheck, 337 unit tests, build, 89 E2E
tests, all green).

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
- `done` **(World) Basic parkland dressing — a foundational starter, not
  a one-off theme.** Locked in during a 2026-09-08 design review, built
  2026-09-09: swapped the old plain gray-cylinder `landmark` meshes
  (`src/scene.ts`) for a light, generic "parkland" set — scattered trees,
  a few flower-bed color patches, a simple stepping-stone path connecting
  spawn to a fountain centerpiece. Deliberately generic/light-touch rather
  than a heavily-opinionated theme, per the design review's own framing —
  a fork can reskin land entirely by swapping one data array/mesh set,
  without touching terrain/collision code (both untouched by this item).
  Implemented exactly the way `AIR_FLOATING_PLATFORM_POSITIONS`/
  `SEA_WRECKAGE_POSITIONS` already do: `src/land/landDecorations.ts`
  holds `LAND_DECORATION_POSITIONS` (a plain array, each entry carrying an
  `x`/`z`/`kind`) and a `createLandDecorationMesh(kind)` factory —
  `scene.ts` just loops over the array and positions each group via
  `terrainHeightAt` alone (every group's local origin sits at ground
  level, same convention `world/portalMarker.ts` already uses). The
  original six landmark coordinates were kept as-is for the "tree"
  entries (already tuned for follow-camera parallax spread); a fountain
  (basin + rim torus + spout + a small emissive "water" sphere) plus four
  stepping-stone path entries were added near spawn, and three flower-bed
  patches (a soil disk + a small fixed, non-random 5-bloom layout) fill
  the middle ground. Procedural primitives throughout — same discipline
  block materials used (generated pattern before real photographed
  textures) — real assets can follow later if wanted, not required here.
  10 new unit tests (`landDecorations.test.ts`: data shape, path-stones-
  between-spawn-and-fountain, deterministic bloom layout, per-kind mesh
  shape); `scene.test.ts` updated (the old generic "landmark" name check
  replaced with a per-kind check, plus a new position-mapping test).
  Verified visually with a real screenshot (trees, flower beds, the
  fountain, and the diving house all visible together near spawn) — full
  suite green (typecheck, 242 unit tests, build, 64 E2E tests).
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
- `done` **Real Quaternius model packs for castle pieces themselves.**
  Picked up 2026-09-09 (explicitly asked for, resolving the "not something
  to do solo without checking in first" note this item used to carry).
  Pulled the "Medieval Village MegaKit" pack for real via
  `@jgengine/assets`'s own CLI (`pull <source-id>`, not just a
  connectivity-check download) and actually inspected every candidate
  model's real geometry (`gltf-transform inspect` — bbox, vertex count)
  before picking one, same "measure, don't guess" discipline as the
  Robot-scale/Female-height fixes. Confirmed the pack is genuinely a
  village/house-building kit, not a fortress kit — no single model reads
  as "a keep" (a fortified tower) — so the fit is per-type, all recorded
  in `src/land/castleStructures.ts`'s own comments:
  - **Wall** (`Wall_UnevenBrick_Straight`) and **Gate**
    (`DoorFrame_Round_Brick` — a free-standing archway, reads as "a gate"
    specifically, not a wall-with-a-door-cut-into-it) fully replace their
    old placeholder box. Both types' `width` already matched the real
    model almost exactly; `height`/`depth` updated to fit (Wall's box was
    a stubby 1.0 tall "fence" scale before — a real building wall is
    genuinely ~3x that).
  - **Keep**: no real model fits as the whole piece, so its box stays
    completely unchanged (dimensions, block-material coloring) and only
    gains a real conical tower-roof cap (`Roof_Tower_RoundTiles`, scaled
    down ~4x to fit) for a more distinctive silhouette — additive, not a
    replacement.

  Architecture (`src/land/realCastlePieceModels.ts`, wired from
  `placement.ts`): `createCastlePieceMesh` still returns the plain box
  synchronously, completely unchanged for every existing caller
  (placement, save/load reconstruction, every pre-existing test) — a real
  model, once loaded, upgrades that same piece in place asynchronously,
  same "safe default first" philosophy `AvatarView`/`realBlockTextures.ts`
  already established. Assets reprocessed with `@gltf-transform/cli`
  (textures resized 2048→256px + pruned — a distant/background prop,
  same reasoning block materials' resolution choice used) down to
  340KB–1.2MB each from the pack's ~25MB-per-model originals.

  **Two real bugs found and fixed while building this, not just
  guessed at** (same "render and look" discipline as the Robot-scale/
  Gold-metalness/dive-suit-legibility fixes elsewhere in this codebase):
  1. The first working version nested the real model as the box's own
     child, then set `box.visible = false` for the "replace" types —
     screenshotted it and the piece rendered as *nothing at all*.
     Root cause: three.js's renderer walks the scene via
     `Object3D.traverseVisible`, which stops descending the instant it
     hits an invisible object — hiding the box silently hid its nested
     child right along with it. Fixed by adding the real model as a
     *sibling* of the box (`box.parent.add(...)`, not `box.add(...)`) —
     the box stays a fully valid, unchanged raycast/stacking target
     either way (three.js's `Raycaster` doesn't gate on `.visible`, and
     `Box3.setFromObject` doesn't either, confirmed by reading three.js's
     own source rather than assuming).
  2. `e2e/castle-placement.spec.ts`'s type-switching test started failing
     intermittently once Wall's real height landed — root-caused (not
     dismissed as a flake) via a temporary debug log: the old
     0.2/0.5/0.8-of-viewport screen-fraction click spread, tuned against
     the *old* short Wall, no longer reliably cleared
     `validatePlacement`'s true-3D overlap check now that Wall's taller
     footprint widened its Y-overlap window against the Keep placed
     first. Fixed by switching the test to click at deliberately
     far-apart *world* coordinates (via the app's own
     `__projectToScreen`, same pattern the "stacking" test in the same
     file already used) instead of guessed screen fractions — robust
     regardless of any structure type's future dimensions.

  8 new unit tests (`realCastlePieceModels.test.ts`: both placement
  modes, scale, world-position correctness, independent instances across
  multiple placements of one type, load-failure fallback); full suite
  verified (typecheck, 250 unit tests, build, 64 E2E tests, re-run
  multiple times to confirm the E2E fix was real, not still flaky).
  Verified visually with real screenshots of all three types placed
  together. `public/assets/ATTRIBUTIONS.md` and the in-app credits screen
  (`src/skins/attributions.ts`) both updated.
- `done` **New procedural "Bird" avatar skin, purpose-built for Air.**
  Asked for directly 2026-09-10 ("avatars that might suit the floating
  air environment better"). Researched what's actually reachable first,
  same discipline the castle-piece-models item above used: no genuine
  rigged flying-creature CC0 asset turned up anywhere this session could
  check — Quaternius's own "Ultimate Animated Animal Pack" (the obvious
  candidate) routes only through the blocked quaternius.com/itch.io
  directly, same class of block the original Princess search hit; the
  reachable Modular Sci-Fi pack's three alien creatures were checked for
  real (`gltf-transform inspect`) and ruled out — idle-only animation
  (no walk/run clip), and a sci-fi look that clashes with the game's
  medieval/nature theme elsewhere. Presented these findings plus a
  recommendation via `AskUserQuestion`; you picked "build a purpose-made
  procedural skin" over the alien fallback, leaving the roster as-is, or
  hand-delivering an asset yourself.
  `createBirdAvatarMesh` (`src/skins/avatarView.ts`, new `proceduralVariant:
  "bird"` alongside the existing `"diveSuit"`) — a body lying *along*
  local Z (elongated front-to-back, unlike every other skin's roughly
  capsule-shaped upright silhouette) with fixed, wide-spread wings: a
  bird's whole point is reading as "shaped for flight" holding
  completely still, which an upright silhouette can't do regardless of
  pose, and there's no rig here to flap them anyway. No external asset
  dependency at all, so it can't hit the same network-block wall future
  sessions keep running into. No animation clips, so it automatically
  gets the same procedural idle/movement bob every other clip-less skin
  (Capsule, Princess) already does, and — flying in Air specifically —
  the same pitch tilt (`setVerticalPitch`, unchanged) every skin already
  gets there.
  `avatarSkins.test.ts`'s "only dive-suit has a proceduralVariant" guard
  updated to a general "every distinctly-shaped procedural skin declares
  a matching variant" check (was already due for generalizing, per its
  own comment) rather than a one-off carve-out. 3 new unit tests
  (`avatarView.test.ts`: distinct group shape, wingspan notably wider
  than the body, left/right wing mirroring). Verified visually with real
  screenshots on Land and flying through Air's cloud platforms (sent to
  you) — full suite green (typecheck, 253 unit tests, build, 64 E2E
  tests, including the narrow-viewport dev-panel-overlap check with the
  new button added).
- `done` **Bird's colors reworked, plus a second "Eagle" skin — reviewed
  live the same day.** You called the first pass "a little ugly... grey
  and too similar to Dive Suit." Rather than guess again, built and
  actually rendered three real, distinct candidates (cardinal red/black,
  dove white-cream, golden-eagle brown) before touching the catalog at
  all — sent as screenshots for review, same discipline this project
  uses for every other real design call (e.g. Female's mesh variant
  picked from a live preview). You picked both white and brown, and
  asked for both as separate selectable skins rather than just the one.
  `avatarView.ts`'s `createBirdAvatarMesh` split into a shared
  `buildBirdShapedAvatarMesh(namePrefix, palette)` builder — identical
  shape, distinct `BirdColorPalette` and part-name prefix (so
  `getObjectByName` lookups stay unambiguous) — with two thin named
  wrappers (`createBirdAvatarMesh`, `createEagleAvatarMesh`), same
  "separate skin, not a mode on one skin" precedent `female`/`princess`
  already set. New `eagle` catalog entry (`proceduralVariant: "eagle"`).
  `AvatarView.buildVisual`'s growing procedural-variant ternary chain
  replaced with a small `buildProceduralVisual` switch while here —
  three variants deep was past where ternary-chaining stays readable.
  4 new/generalized unit tests (the three bird-shape tests now loop over
  both `bird`/`eagle` instead of duplicating; one new test confirms the
  two palettes are actually distinct, not just distinct labels).
  Verified visually with real screenshots of both in Air — full suite
  green (typecheck, 257 unit tests, build, 64 E2E tests).
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
  **Partial de-risking 2026-09-09**: re-read the blast-radius reasoning
  above against current code — still holds, unchanged (a shallower
  elevation moves the on-screen horizon, and a fixed vertical screen
  *fraction* can't tell ground from sky once that moves, which is exactly
  what several of those tests assume). Didn't force the actual elevation
  change through solo again this cycle either, but did shrink the blast
  radius by the two tests actually in this track's own ownership: the two
  remaining `viewport.height * 0.75`-style ground clicks in my own
  `e2e/skins.spec.ts` (block-material switching) now use
  `window.__projectToScreen` against fixed *world* coordinates instead —
  the same camera-angle-agnostic pattern `castle-placement.spec.ts`
  already proved out for its own tests, now covering one more file.
  Doesn't touch `cameraOffset` itself or change any rendered behavior
  (verified: full suite unchanged, 64 E2E tests still green). World's own
  `castle-placement.spec.ts`/`land-save-load.spec.ts`/
  `touch-controls.spec.ts` still carry the same fixed-fraction clicks —
  out of this track's file ownership to migrate proactively without a
  concrete reason (the precedent for touching a World-owned spec file has
  so far only been reactive, fixing a test this track's own change broke
  — see the Quaternius castle-piece item above). Once those are migrated
  too (or a future cycle judges the remaining risk acceptable), the
  elevation change itself becomes a much smaller, more contained edit.
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

- `done` **In-app credits screen was silently missing the Mannequin
  entry — found and fixed, plus a generalized regression guard.** The
  usual two `todo`s below were re-checked first (see the 2026-09-12 note
  further down) and found still genuinely not-solo-actionable, same as
  the last two cycles, so this cycle looked for a real gap instead of
  manufacturing busywork — same pattern that turned up the credits screen
  itself and dev-panel active-state highlighting earlier in this section.
  Found one: `public/assets/ATTRIBUTIONS.md` has a full `models/
  mannequin.glb` section (its own text says this file "is still the
  source of truth... keep both in sync"), but `src/skins/attributions.ts`
  — the in-app mirror players actually see via the "ⓘ Credits" toggle —
  had no Mannequin entry at all; it went straight from Female to nothing,
  so a real player checking credits for the swim-animation source
  (Quaternius, via the `J-Ponzo/gltf-universal-animation-library` GitHub
  mirror — the same reachable-mirror pattern the block textures and
  castle-piece models use) would find it missing. CC0, so not a legal
  compliance gap like Fox's CC-BY the way the original credits-screen
  item was, but still a real "the two files drifted out of sync" bug.
  Added the missing entry. Rather than stop at a one-off fix (which
  would only catch *this* skin slipping through, not the next one),
  generalized the regression guard: a new test
  (`attributions.test.ts`) asserts every `kind: "gltf"` entry in
  `AVATAR_SKINS` has at least one `ATTRIBUTIONS` entry whose asset text
  names its id — matches how every existing entry is actually worded
  ("Fox...", "Robot model...", "Mannequin model...") — so a future gltf
  skin shipped without updating the credits mirror fails a test instead
  of silently shipping an incomplete credits screen, same "tested
  generically where possible" bar the rest of this codebase holds to.
  1 new unit test (the generalized guard above; the existing Fox-CC-BY
  compliance test is untouched, still its own dedicated check since
  that one really is legally load-bearing). No E2E change needed —
  `e2e/skins.spec.ts`'s credits tests don't assert a fixed entry count.
  Full suite verified (typecheck, 263 unit tests, build, 64 E2E tests).

**2026-09-12 (this cycle) — both remaining `todo`s re-checked again,
still not solo-actionable.** Dive-suit auto-equip: unchanged, still
needs a human with a real browser at the live deployment (see
`DECISIONS.md`'s "Needs Your Action") — and a separate, non-daily branch
(`claude/dive-suit-auto-equip-zb1qvy`, active as recently as yesterday)
is already deep into an extensive from-scratch rebuild of the dive-suit
visual itself (mask/tank/belt/flipper sizing, attaching to a real head
bone), so touching `createDiveSuitAvatarMesh` here risks duplicating or
conflicting with that in-progress work rather than helping — left alone,
same reasoning the 2026-09-10 cycle used for not merging it in (not this
track's own daily branch, outside `AUTONOMY.md`'s merge protocol).
Camera framing: unchanged, same blast-radius reasoning as every prior
re-check holds. A second non-daily branch
(`claude/garden-implementation-status-g3b8o5`) is likewise still active
in `public/assets/`/land-decoration territory as of yesterday — noted,
not touched, for the same reason. `claude/floating-in-air-5urm2i` (the
Bird/Eagle color-rework session flagged as in-flight by the 2026-09-10
cycle) has since landed on `main` on its own — its work is the
Bird-colors/Eagle entry already recorded above, nothing left to merge
from it.

**2026-09-10 (this cycle) — both remaining `todo`s re-checked again, still
not solo-actionable; no new backlog item picked up, real parallel work
found instead of manufacturing busywork.** Dive-suit auto-equip: unchanged,
still needs a human with a real browser at the live deployment (see
`DECISIONS.md`'s "Needs Your Action"). Camera framing: unchanged, same
blast-radius reasoning as every prior re-check holds. Before assuming
nothing was left to build, checked for other in-flight work this cycle
might duplicate or conflict with — found three active, unmerged branches
with very recent commits (same day, some within the hour) doing real work
squarely in this track's own territory: `claude/dive-suit-auto-equip-zb1qvy`
(an extensive from-scratch rebuild of the dive-suit visual — dressing the
actual worn character instead of a separate generic body, fixing a T-pose
arm-span sizing bug across the mask/tank/belt/flippers — a much deeper fix
than the angle-legibility one already on `main`), and
`claude/garden-implementation-status-g3b8o5` (real downloaded models/wind-
sway for land's flower beds and trees, `public/assets/` territory). A
third, `claude/avatar-floating-air-realm-yibz10`, predates and is
superseded by the float-vs-run fix already on `main`. None of these are
this track's own daily branches and `AUTONOMY.md`'s merge protocol only
covers `main` + the two daily branches, so none were merged or touched —
logged here purely so a future Skins cycle doesn't duplicate the dive-suit
rework already well underway elsewhere, and checks whether it landed on
`main` yet before touching `createDiveSuitAvatarMesh` itself. With the
usual two items still stuck and the obvious adjacent real gaps already
spoken for by that other work, this cycle picked up a small, genuinely safe
loose end instead: three doc comments (`avatarSkins.ts`'s `bobOffset`,
`avatarView.ts`'s `update`, and `ARCHITECTURE.md`'s matching section) had
gone stale listing "Capsule and Princess" as the only no-animation skins —
true when written, wrong since Dive Suit and (today) Bird also ship with no
clips. Reworded to name the actual current set and point at
`hasAnimation()` as the real source of truth rather than a list that has to
be remembered on every new skin. No behavior change, so no new tests;
full suite re-verified after the edit (typecheck, 253 unit tests, build,
64 E2E tests).

- `done` **Tower gets a real roof-cap model, closing the gap `castleStructures.ts`'s
  own comment had flagged.** 2026-09-13: the two usual `todo`s below re-checked
  again first, still not solo-actionable — dive-suit auto-equip still needs a
  human with a real browser (`DECISIONS.md`'s "Needs Your Action", unchanged);
  camera framing's blast-radius reasoning still holds. Checked for in-flight
  work before building: `claude/dive-suit-auto-equip-zb1qvy` and
  `claude/garden-implementation-status-g3b8o5` (the latter has an open,
  untouched PR #4) are both now 2 days stale (last commit 2026-09-11) —
  neither is this track's own daily branch, so per `AUTONOMY.md`'s merge
  protocol neither was touched, just re-noted here for the next cycle.
  Rather than manufacture busywork, picked up the real, already-flagged gap
  instead: Tower (`BACKLOG.md`'s "structure types beyond castles" item)
  shipped as a plain box with a code comment admitting "nothing in the
  reachable Medieval Village MegaKit index was inspected for a tower-specific
  piece." Actually inspected it this time — pulled the pack for real
  (`@jgengine/assets`'s own CLI, same as the original castle-piece-models
  cycle) and listed all 176 models: confirmed no dedicated fortress-tower
  body model exists (same conclusion Keep's own entry already reached, now
  verified for Tower specifically rather than assumed to generalize).
  Rather than stay a bare box, reused Keep's own already-downloaded
  `castle-keep-roof.glb` (`Roof_Tower_RoundTiles`) as Tower's roof cap too —
  no new asset fetch or attribution entry needed — at a smaller `scale`
  (0.233 vs Keep's 0.28) computed to match Keep's own cap-width-to-box-width
  overhang ratio (≈1.318, measured via `gltf-transform inspect`) against
  Tower's narrower 1.0-wide footprint, rather than guessing a scale and
  eyeballing it.
  **Small refactor while here**: `upgradeCastlePieceToRealModel` used to
  take a bare `typeId` and re-resolve it via `findCastleStructureType` —
  redundant, since its only caller (`placement.ts`) already has the
  resolved `type` in scope right before calling it. Changed the signature
  to take the `CastleStructureType` directly; besides removing the
  redundant lookup, this let `realCastlePieceModels.test.ts`'s "no-ops for
  a type with no realModel" test switch to a synthetic type instead of
  relying on some catalog entry (previously Tower) perpetually lacking a
  `realModel` to exercise that branch — that assumption broke the moment
  Tower gained one, so the test is now independent of which catalog entries
  currently happen to have a real model configured.
  4 unit tests updated (`castleStructures.test.ts`'s Tower test now asserts
  the real `realModel` shape instead of `undefined`; `realCastlePieceModels.test.ts`'s
  catalog-membership test lists all four ids, its no-op test uses a
  synthetic type, and its call sites pass resolved types) plus 1 new test
  (Tower's own roof-cap wiring: box stays visible, cap scaled/positioned
  correctly — mirrors the existing Keep test). Verified visually with a
  real screenshot (Tower now shows a clear conical red-tiled roof, reading
  as a distinct watchtower silhouette next to Keep, not just a taller flat
  box) — full suite green (typecheck, 278 unit tests, build, 68 E2E tests;
  one `sea-construction.spec.ts` reload-depth-timing failure on the first
  run was confirmed flaky — passed both isolated and in a full clean
  re-run — and is unrelated to this change, in World's own sea-buoyancy
  territory, not this track's file ownership).

**2026-09-13 (this cycle) — the one remaining `todo` re-checked, still not
solo-actionable.** Camera framing: unchanged, same blast-radius reasoning
as every prior re-check holds (changing the shared `cameraOffset` in
`main.ts` would move click-position assumptions baked into several of
World's own E2E specs). Dive-suit auto-equip bug itself (`DECISIONS.md`'s
"Needs Your Action") is still genuinely blocked on a human with a real
browser, but its *visual rework* is well underway elsewhere: rechecked
`claude/dive-suit-auto-equip-zb1qvy` (still 2 days stale, last commit
2026-09-11) — not this track's own daily branch, so left untouched per
`AUTONOMY.md`'s merge protocol, same reasoning every prior cycle used; a
future cycle should check whether it's landed on `main` before touching
`createDiveSuitAvatarMesh` itself.

- `done` **Closed a real E2E coverage gap: Bird and Eagle had zero E2E
  tests at all.** 2026-09-15: the two usual `todo`s re-checked again first
  — camera framing's blast-radius reasoning still holds unchanged (the
  fixed-fraction ground clicks in `castle-placement.spec.ts`/
  `land-save-load.spec.ts`/`touch-controls.spec.ts` are still there,
  confirmed by grep, so the risk this track flagged in 2026-09-03/09-09
  hasn't shrunk); dive-suit auto-equip still needs a human with a real
  browser (`DECISIONS.md`'s "Needs Your Action", unchanged). Checked
  in-flight work before building: `claude/dive-suit-auto-equip-zb1qvy` and
  the open, untouched PR #4 (`claude/garden-implementation-status-g3b8o5`)
  are both now 4 days stale (last commit 2026-09-11) — neither is this
  track's own daily branch, so per `AUTONOMY.md`'s merge protocol neither
  was touched, just re-noted here. Also noticed (not this track's to fix,
  logging for visibility): `.autonomy-heartbeat.log` has no entry at all
  for 2026-09-14 on either track, and World's own 2026-09-14 heartbeat
  commit (`f914f4b`, on `claude/world-daily`) never produced any further
  commits or a merge to `main` that day — looks like both daily triggers
  missed firing properly yesterday, worth a human checking the schedule
  config rather than something either track can fix from inside a cycle.
  Rather than manufacture busywork with nothing else unblocked, searched
  for a real gap instead (same pattern as the Mannequin-credit/Tower-roof
  fixes) and found one: grepping `e2e/` for "Bird" or "Eagle" returned zero
  matches — both skins (added/reworked 2026-09-10) had never been touched
  by an E2E test, only unit-tested (`avatarView.test.ts`'s shape checks).
  Neither their dev-panel buttons' existence nor a real switch-in-a-browser
  had ever been verified.
  Considered folding them into the existing "every gltf avatar skin renders
  within a sane height range of the procedural capsule" test by dropping
  its `kind === "gltf"` filter, but measured first rather than assuming
  that was safe (`window.__getAvatarWorldHeight` against a real running
  dev server): Bird/Eagle render at ~0.44 world units — ~0.24x Capsule's
  ~1.80, well under that test's 0.5x floor. Not a bug: both are a body
  lying *along* local Z with wide-spread wings by design (`avatarView.ts`'s
  own comment — "unlike every other skin's roughly capsule-shaped upright
  silhouette"), so their real vertical extent is genuinely small; blindly
  widening the shared ratio bounds to fit them would have weakened the
  actual regression guard the Robot-scale bug needs. Added a dedicated test
  instead (`e2e/skins.spec.ts`, mirrors the existing Robot/Princess
  switch-and-back pattern, looped over both since they share one shape/
  mechanism): confirms each button exists, clicking it resolves to the
  right skin id, it renders a real non-zero-height shape, switching back to
  Fox still works, and no console/page errors occur. Also added both to
  "the dev skin panel lists both avatar skins and block materials"'s
  button-visibility assertions, which had the same blind spot. 1 new E2E
  test (28 in `e2e/skins.spec.ts` now, 69 total); no unit or code changes
  needed — the underlying feature already worked correctly, this closes a
  real verification gap, not a bug. Full suite green (typecheck, 278 unit
  tests, build, 69 E2E tests).
- `done` **Land jump now tilts the avatar into its own vertical velocity —
  closes the exact gap air/sea each had before their own pitch-parity
  fixes.** 2026-09-17: the one remaining `todo` (camera framing) re-checked
  first — its blast-radius reasoning still holds unchanged (grepped
  `castle-placement.spec.ts`/`land-save-load.spec.ts`/`touch-controls.spec.ts`,
  the same fixed-fraction ground clicks are still there). Checked in-flight
  branches before building: `claude/dive-suit-auto-equip-zb1qvy` and
  `claude/garden-implementation-status-g3b8o5` are both 6 days stale (last
  commit 2026-09-11) — neither is this track's own daily branch, so per
  `AUTONOMY.md`'s merge protocol neither was touched.
  Rather than manufacture busywork, this cycle's own merge from `main`
  brought in World's brand-new land jump (`stepLandMovement` gained an
  optional `jumpPressed` impulse, landed the same morning) — and that
  surfaced a real, immediately-checkable gap in this track's own
  territory: `AvatarView.setVerticalPitch` (`src/skins/avatarView.ts`) was
  never called from land's branch in `main.ts` at all, its own doc comment
  explicitly noting land "has no meaningful vertical velocity" — true when
  written, false the moment jump landed. Exactly the same latent bug
  air/sea each shipped with before their own "flying/swimming reads as
  walking on land" pitch-parity fixes (`BACKLOG.md`'s Phase 2/3 history
  above) — jumping left the avatar perfectly level through the whole arc.
  One-line fix: land's branch now calls `avatarView.setVerticalPitch(movement.velocityY,
  dt)`, exactly like air/sea's own calls — `setVerticalPitch` itself is
  already fully generic, needing no changes, same as air's own reuse
  needed none.
  **Verified visually before landing it, not just wired up and assumed
  good** (same "render and look" discipline as the Robot-scale/
  Gold-metalness/sea-pitch-sign fixes elsewhere in this codebase): screenshotted
  Fox, Robot, and Capsule mid-jump via a real running dev-server session.
  Fox and Robot both read well — a clear, not-overdone nose-up lean on
  launch and nose-down lean into the landing, reading like real jump
  momentum rather than a glitch; Capsule (rotationally symmetric, no
  "front" to read a lean off of) shows no visible difference either way,
  confirming the change is harmless even for skins with no orientation
  cues. Existing `PITCH_VELOCITY_FOR_MAX_ANGLE` (tuned against sea's ~2 m/s
  active range) saturates almost immediately against jump's 7 m/s launch —
  same as air's wider range already does, not a new problem this needed to
  solve.
  New `window.__getLandAvatarPitch` debug hook (`src/main.ts`, mirrors
  `__getAirAvatarPitch`/`__getSeaAvatarPitch`) plus 1 new E2E test
  (`e2e/skins.spec.ts`'s new "land avatar vertical pitch" suite): confirms
  the ascend-then-descend sign flip across one real jump arc, then that
  pitch eases back to level once landed — mirrors sea's own "opposite
  directions"/"settles back toward level" pair, adapted to a one-shot jump
  impulse instead of a held key. No new unit tests needed —
  `setVerticalPitch` itself was already fully covered generically by
  `avatarView.test.ts`, unchanged by this. Both the stale "land never
  calls this" comment in `avatarView.ts` and `ARCHITECTURE.md`'s matching
  note updated to describe the actual current behavior instead of asserting
  land will never need it. Full suite green (typecheck, 298 unit tests,
  build, 76 E2E tests).

**2026-09-18 (this cycle) — the one remaining `todo` re-checked, still not
solo-actionable; genuinely nothing else unblocked this time.** Camera
framing: unchanged, same blast-radius reasoning as every prior re-check
holds (grepped `castle-placement.spec.ts`/`land-save-load.spec.ts`/
`touch-controls.spec.ts` again — the same fixed-viewport-fraction ground
clicks are still there). Checked in-flight work before concluding there was
nothing to build: `claude/dive-suit-auto-equip-zb1qvy` and
`claude/garden-implementation-status-g3b8o5` (the latter's open PR #4,
"Trees: more organic canopy shape + gentle wind sway") are both still 7
days stale (last commit 2026-09-11) — neither is this track's own daily
branch, so per `AUTONOMY.md`'s merge protocol neither was touched, just
re-noted here again. This cycle's own sync from `main` brought in World's
new touch-only vertical-movement buttons (`#vertical-controls`,
`src/input/touchVerticalInput.ts` — ascend/descend plus land's jump, now
reachable on a phone) — checked for a Skins-relevant regression the way
the original dev-panel-overlap bug was found (real screenshots, not just
trusting the merge was clean): collapsed and expanded `#dev-panels` at a
real Pixel-5 viewport, both look correct, `#vertical-controls` sits clear
of `#hud-structures` and the dev-panels column in both states — no overlap
bug, so `e2e/skins.spec.ts`'s regression guard didn't need extending (it
also wouldn't have seen the buttons anyway — they're `display: none`
outside `@media (pointer: coarse)`, which the desktop-project test that
guard runs under never triggers). Searched for a real gap the way the
Mannequin-credits/Tower-roof/Bird-Eagle-E2E fixes earlier in this section
did — `ARCHITECTURE.md`'s Skins section, `DECISIONS.md`'s Pending (empty),
and a grep for stray `TODO`s in `src/skins/` all came up empty this time;
unlike those prior cycles, no real gap turned up. Full suite verified after
the sync merge (typecheck, 314 unit tests, build, 79 E2E tests — one
`skins.spec.ts` height-ratio-guard failure on the first parallel run
reproduced neither in isolation nor on a clean full re-run, confirmed
flaky under load, not a regression, same disposition as the
`sea-construction.spec.ts` flake noted in the 2026-09-13 entry above).
Heartbeat commit + this cycle's sync fast-forwarded onto `main` as usual;
no other code changes to land.

- `done` **The dev-panel overlap regression guard had a structural blind
  spot: it never actually saw `#vertical-controls`.** Picked up 2026-09-19:
  the one remaining `todo` (camera framing) re-checked first, same
  blast-radius reasoning as every prior re-check still holding (grepped
  `castle-placement.spec.ts`/`land-save-load.spec.ts`/`touch-controls.spec.ts`
  again — the fixed-fraction ground clicks are still there); dive-suit
  auto-equip still needs a human with a real browser
  (`DECISIONS.md`'s "Needs Your Action", unchanged). Checked in-flight
  branches before building: `claude/dive-suit-auto-equip-zb1qvy` and
  `claude/garden-implementation-status-g3b8o5` are both now 8 days stale
  (last commit 2026-09-11) — neither is this track's own daily branch, so
  per `AUTONOMY.md`'s merge protocol neither was touched, just re-noted
  here again.
  This cycle's own sync from `main` (already current — a concurrent World
  cycle had just fast-forwarded it to `#hud-controls`'s new jump/ascend/
  descend wording) prompted a closer look at the 2026-09-18 entry's own
  finding, rather than re-running the same "grep for a TODO" search that
  came up empty last time: that cycle noted `e2e/skins.spec.ts`'s generic
  overlap guard "wouldn't have seen [`#vertical-controls`] anyway" since
  it's `display: none` outside `@media (pointer: coarse)`, which the
  guard's own "desktop" Playwright project never triggers — and left it
  there as a fact about the test, not a gap in it. Looked closer: that's
  not a narrow one-off limitation, it's the *whole class* of bug
  `AUTONOMY.md`'s "UI layout convention" describes this guard as existing
  to catch, silently unable to see any future `pointer: coarse`-gated
  element at all — the only verification `#vertical-controls` itself ever
  got was a manual Pixel-5 screenshot review, not an automated check, so a
  future regression there (or in any later touch-only overlay) would only
  be caught by another manual review, not this guard.
  Fixed by adding a second suite to `e2e/skins.spec.ts` — "fixed overlay
  layout (real touch device)" — that overrides the file's own tests to
  force real touch/coarse-pointer emulation via `test.use({ ...devices["Pixel
  5"] })` (the same device `playwright.config.ts`'s "mobile" project
  already uses for `touch-controls.spec.ts`, but scoped here to just this
  one describe block rather than moving the whole file to that project,
  since every other test in it assumes mouse clicks). `defaultBrowserType`
  is deliberately excluded from that spread — `test.use()` inside a
  `describe` can't set it (Playwright forces that field to be top-level/
  in config, since changing it forces a new worker) — harmless here since
  the "desktop" project this file already runs under is Chromium anyway,
  the only thing that preset would have picked. The new test taps
  `#dev-panels-toggle` open first (dev panels start collapsed on a
  coarse-pointer device, 2026-09-08) so its buttons are actually part of
  the layout being checked, then reuses the exact same
  `boundingBoxesOverlap` helper the desktop suite already has — which
  needed `#vertical-controls` added to its own selector list (harmless
  for the existing desktop test: the element is invisible there, so
  `boundingBox()` returns null and it's skipped, same as it already was).
  1 new E2E test (30 in `e2e/skins.spec.ts` now, 80 total) — genuinely
  exercises the element for the first time; it passed immediately (no bug
  found, closing a coverage gap rather than fixing a regression), so the
  2026-09-18 manual verification was correct, just never automated. Full
  suite green (typecheck, 314 unit tests, build, 80 E2E tests).

**2026-09-20 (this cycle) — both remaining `todo`s re-checked, still not
solo-actionable; one real stale-doc gap found and closed instead of
manufacturing busywork.** Camera framing: unchanged, same blast-radius
reasoning as every prior re-check holds (grepped
`castle-placement.spec.ts`/`land-save-load.spec.ts`/`touch-controls.spec.ts`
again — the same fixed-viewport-fraction ground clicks are still there;
`e2e/skins.spec.ts` itself has none left, already fully migrated to
world-coordinate clicks in the 2026-09-09 pass). Dive-suit auto-equip
still needs a human with a real browser (`DECISIONS.md`'s "Needs Your
Action", unchanged). Checked in-flight branches before concluding there
was nothing else to build: `claude/dive-suit-auto-equip-zb1qvy` and
`claude/garden-implementation-status-g3b8o5` (the latter's open PR #4,
still untouched) are both now 9 days stale (last commit 2026-09-11) —
neither is this track's own daily branch, so per `AUTONOMY.md`'s merge
protocol neither was touched, just re-noted here again.
This cycle's own sync from `main` was a clean fast-forward (World's own
same-day cycle had just landed the land↔air stairway — the portal's long-
planned second flavor, `DECISIONS.md`'s 2026-09-02 entry). Searched for a
real gap the way recent cycles have (`ARCHITECTURE.md`'s Skins/
Construction sections re-read in full, a repo-wide grep for stray `TODO`/
`FIXME` in `src/`/`e2e/`, `ATTRIBUTIONS.md` vs. `attributions.ts` re-
compared) — nothing new turned up in this track's own territory, but the
stairway merge itself left one real doc-vs-code gap in genuinely-shared
`ARCHITECTURE.md`: its "Realm connections" section still read "a stairway
is still wanted as a second flavor later" the same morning the stairway
had already shipped. Small, safe, and about already-landed World
functionality rather than a Skins-owned concern, so fixed here rather
than left for another cycle to trip over — reworded to describe the
stairway as built, matching the "On-screen controls hint" precedent
(2026-09-19) for touching genuinely-shared doc/text describing the other
track's already-shipped work. No behavior change, so no new tests; full
suite re-verified after the merge and the edit (typecheck, 324 unit
tests, build, 82 E2E tests, all green).

**2026-09-21 (this cycle) — both remaining `todo`s re-checked, still not
solo-actionable; one real stale-doc gap found in this track's own
territory this time.** Camera framing: unchanged, same blast-radius
reasoning as every prior re-check holds (the same fixed-viewport-fraction
ground clicks in `castle-placement.spec.ts`/`land-save-load.spec.ts`/
`touch-controls.spec.ts` are still there). Dive-suit auto-equip: still
needs a human with a real browser — re-tried `curl` against
`tri-realm.vercel.app` directly from this session rather than just
trusting the prior finding, still the same 403 policy denial
(`DECISIONS.md`'s "Needs Your Action", unchanged). Checked in-flight
branches before searching for a gap: `claude/dive-suit-auto-equip-zb1qvy`
and `claude/garden-implementation-status-g3b8o5` are both now 10 days
stale (last commit 2026-09-11) — neither is this track's own daily
branch, so per `AUTONOMY.md`'s merge protocol neither was touched, just
re-noted here again. This cycle's own sync from `main` was a clean
fast-forward (World's same-day "Sea and air structure catalogs" cycle —
no Skins-territory overlap).
Searched for a real gap the same way recent cycles have (repo-wide grep
for stray `TODO`/`FIXME` in `src/`/`e2e/`: none; `ATTRIBUTIONS.md` vs.
`attributions.ts` re-compared: still in sync) and found one in
`ARCHITECTURE.md`'s own Skins section this time, not a World-owned one:
its "Realm-agnostic by construction" bullet still claimed air reuses
land's generic `moveInputToAnimationState`/`faceDirection` directly, and
that "both still resolve to the same shared idle/walk/run clip names; a
real air/sea-specific animation *clip* mapping (e.g. a distinct
swim-stroke) remains future refinement, genuinely gated on sourcing a
skin with one" — both false against current code, confirmed by reading
`src/air/airAnimation.ts`/`src/sea/seaAnimation.ts`/`main.ts` directly
rather than trusting the doc's own wording: air has had its own
`moveInputToAirAnimationState` since the 2026-09-08 pitch-parity fix, and
the dedicated `swimIdle`/`swimActive` clip states
(`withSwimAnimationState`/`withFloatAnimationState`, gated on
`AvatarView.hasAnimation("swimIdle")`) shipped with Mannequin's swim clips
(2026-09-09) and Female's (later) — genuinely-shipped functionality the
doc never caught up to describing, the same stale-doc-describing-
already-shipped-code shape the 2026-09-20 stairway-doc fix closed for
World's own territory, this time in this track's. Reworded the bullet to
describe the real two-step pipeline (state selection per realm, then a
separate clip-selection pass that only two skins currently have clips
for) instead of the outdated single-step, no-clip-mapping description.
No behavior change, so no new tests; full suite re-verified after the
merge and the edit (typecheck, 324 unit tests, build, 84 E2E tests, all
green).

**2026-09-22 (this cycle) — the one remaining `todo` re-checked, still not
solo-actionable; another small stale-doc gap found and closed.** Camera
framing: unchanged, same blast-radius reasoning as every prior re-check
holds (the same fixed-viewport-fraction ground clicks in
`castle-placement.spec.ts`/`land-save-load.spec.ts`/`touch-controls.spec.ts`
are still there, re-grepped this cycle). Dive-suit auto-equip bug itself
lives under World's Phase 2 section, not this track's — re-confirmed
`DECISIONS.md`'s "Needs Your Action" entry is unchanged, still needs a
human with a real browser. Checked in-flight branches before searching for
a gap: `claude/dive-suit-auto-equip-zb1qvy` and
`claude/garden-implementation-status-g3b8o5` are both now 11 days stale
(last commit 2026-09-11) — neither is this track's own daily branch, so
per `AUTONOMY.md`'s merge protocol neither was touched, just re-noted here
again. This cycle's own sync from `main` was a clean fast-forward (World's
same-day cycle, which added "undo last placement" — `KeyX` removes the most
recently placed structure in any realm — no Skins-territory overlap).
Searched for a real gap the same way recent cycles have (repo-wide grep for
stray `TODO`/`FIXME` in `src/`/`e2e/`: none; `ATTRIBUTIONS.md` vs.
`attributions.ts` re-compared: still in sync; `ARCHITECTURE.md`'s Skins
section re-read in full against current code) and found one small one:
`src/skins/avatarSkins.ts`'s `bobOffset` doc comment and
`ARCHITECTURE.md`'s matching "Procedural idle/movement bob" bullet both
still listed the no-animation procedural skins as "Capsule, Dive Suit,
Bird" — true the moment it was last worded (2026-09-10, earlier the same
day Eagle shipped), false since: Eagle (`proceduralVariant: "eagle"`,
confirmed via `avatarSkins.ts` itself) is exactly as no-animation as Bird,
same shape/mechanism, and was simply never folded into this enumeration
comment once it existed. Same stale-doc-describing-already-shipped-code
shape the 2026-09-20/09-21 cycles closed elsewhere in this project, just a
smaller instance. Reworded both to add Eagle to the list; left
`avatarView.ts`'s own comment alone since it already deferred to
`bobOffset`'s comment as the source of truth rather than repeating the
list itself. No behavior change, so no new tests; full suite re-verified
after the merge and the edit (typecheck, 332 unit tests, build, 88 E2E
tests, all green).

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
- `done` **Land↔air portal — stairway, the second flavor.** Picked up
  2026-09-20: the current priority order's own items were both still
  stuck for this track (dive-suit bug needs a human with a browser;
  camera framing lives under "Skins / visual identity", outside this
  track's own section), and `Later / unscoped` had nothing left but
  out-of-scope multiplayer, so — same pattern as every recent cycle — the
  gap search moved to `ARCHITECTURE.md`'s "Realm connections" section
  instead of re-checking the two priority items again. It still read "a
  stairway is still wanted as a second flavor later" exactly as written
  2026-09-02 (`DECISIONS.md`: both flavors wanted eventually, balloon
  built first for being the more visually distinctive of the two,
  "adding the stairway later is a second catalog entry, not new
  plumbing") — a real, explicitly-wanted, never-built piece of scope, not
  manufactured busywork, and squarely "new content on an established,
  data-driven pattern" per `AUTONOMY.md`'s own bar for not needing a
  fresh decision.
  Confirmed the plumbing claim was accurate before building anything:
  `portalTransition.ts`'s `findNearbyPortal` already iterates every
  `Portal` in a map's `portals` array and `main.ts`'s `maybeTriggerPortal`
  already branches purely on `targetRealmMapId` (the diving-house-specific
  dive-suit swap is the only kind-gated behavior, untouched here) — so
  really was just a second catalog entry. Added
  `LAND_AIR_STAIRWAY_PORTAL`/`AIR_LAND_STAIRWAY_PORTAL` to the existing
  `src/world/landAirPortal.ts` (same neutral-module reasoning as the
  balloon pair — avoids land/air `RealmMap` files importing each other),
  on a straight -z line from each realm's own spawn (the shared "forward"
  key, W) — clear of the balloon's +x line, land-sea's -x line, land's
  parkland dressing, and every `AIR_FLOATING_PLATFORM_POSITIONS` entry
  (checked distances against all of them before picking coordinates, not
  just the obvious neighbors). `createLandRealmMap`/`createAirRealmMap`
  now each carry three/two portals respectively. Visual: a new
  `src/world/stairwayMarker.ts` (`createStairwayMarkerMesh`) — same
  "one shared shape at both ends" convention the balloon uses, a plain
  ascending run of 8 stone steps, rough primitives per `AUTONOMY.md`'s
  visual-first guardrail — placed in `scene.ts`/`airScene.ts` at the same
  shared constants the trigger logic uses. 10 new unit tests
  (`stairwayMarker.test.ts`, plus updated `landAirPortal.test.ts`,
  `landRealmMap.test.ts`, `airRealmMap.test.ts`, `scene.test.ts`,
  `airScene.test.ts`); 2 new E2E tests (`e2e/land-air-portal.spec.ts`)
  cover both directions, reusing the existing file's bounce-back-cooldown
  coverage rather than duplicating it for a second portal pair. Verified
  visually with real screenshots from both realms (the land-side stairway
  climbing away from spawn; the air-side top standing clear of both the
  balloon and the cloud platforms) — a live round-trip screenshot also
  incidentally confirmed the full transition works end to end (flew to
  the air-side stairway, it auto-transitioned back to land, landing at
  the expected arrival spot). Full suite green (typecheck, 324 unit
  tests, build, 82 E2E tests).
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
- `done` **(World) Air still "running in the air" after the pitch-parity fix
  above — fixed by reusing sea's swim clips.** Reported 2026-09-09 with a
  live-deployment screenshot: flying with the Female skin still looked like
  a full running stride with nothing under it, even with pitch. Root cause:
  the pitch-parity fix (item above) only addressed orientation — horizontal
  flight still played the shared walk/run clip, a grounded gait that reads
  as wrong the instant there's no visible ground under it. No skin has a
  dedicated flying/glide clip, but `mannequin`/`female` do have real
  swim-stroke clips (`Swim_Idle_Loop`/`Swim_Fwd_Loop`, from the sea
  swim-animation item under Phase 3) — limbs moving through open space
  reads far closer to "flying" than a ground gait does. `main.ts`'s air
  branch now routes `moveInputToAirAnimationState`'s result through sea's
  own `withSwimAnimationState` (`src/sea/seaAnimation.ts`) exactly as
  written — that function was already realm-agnostic (pure state-in/
  state-out plus a "does this skin have swim clips" boolean), so this
  reuses it directly rather than duplicating the routing logic for air;
  its doc comment updated to note the cross-realm reuse. Skins without
  swim clips (Fox/Robot/Princess/Capsule/Dive Suit) keep exactly today's
  walk/run behavior while flying, unchanged — verified directly with a
  dedicated E2E test. 3 new E2E tests (`e2e/air-flight.spec.ts`, mirroring
  `e2e/skins.spec.ts`'s "sea avatar swim animation" suite): Mannequin and
  Female both request `swimIdle`/`swimActive` while flying, Fox stays on
  `walk`. No unit-test changes needed — `withSwimAnimationState` itself was
  already fully covered by `seaAnimation.test.ts`, and this reuses it
  unchanged. Verified visually with a real screenshot (Female flying,
  arms/legs in the swim-stroke pose instead of a running stride) — full
  suite green (typecheck, 215 unit tests, build, 64 E2E tests).
- `done` **(World) Refined the above same day: swim clips read as "a fish,"
  not the "balloon" feel actually wanted.** Reviewed live right after the
  fix above shipped: the active `swimActive` stroke playing while flying
  looked like swimming — deliberate, effortful paddling — when the ask was
  something that drifts regardless of how it's being pushed, more like a
  balloon than a fish. `withFloatAnimationState`
  (`src/air/airAnimation.ts`, replacing air's direct reuse of sea's
  `withSwimAnimationState`) always resolves to the calm `swimIdle` clip for
  a skin with swim clips — moving or not, walking or running — rather than
  distinguishing active vs. idle the way sea genuinely wants to. Sea itself
  is completely untouched (`withSwimAnimationState`'s doc comment records
  why the two stayed separate policies instead of one shared function).
  Skins without swim clips are still unaffected either way. 3 new unit
  tests (`airAnimation.test.ts`); the 2 swim-capable E2E tests in
  `e2e/air-flight.spec.ts` updated to assert `swimIdle` while moving too
  (was `swimActive`), plus a 300ms hold to prove it doesn't switch.
  Verified visually with a real screenshot (Female flying: arms out,
  relaxed, no active kicking) — full suite green (typecheck, 218 unit
  tests, build, 64 E2E tests). **Review checkpoint: confirmed on the live
  deployment — "Like balloons than fish."**
- `done` **(World) Cloud-shaped floating platforms.** Locked in during a
  2026-09-08 design review, built 2026-09-09: replaced the plain gray-
  cylinder platform mesh with an actual cloud-shaped one
  (`src/air/cloudMeshes.ts`'s `createCloudPlatformMesh` — a soft puffy
  cluster of six overlapping, vertically-flattened spheres in a fixed,
  non-random layout, rather than a single sphere or a literal geometric
  primitive). The platform *is* the cloud, not a separate backdrop layer —
  `airScene.ts` swaps the mesh builder only; placement data
  (`AIR_FLOATING_PLATFORM_POSITIONS`) and every position are completely
  unchanged, confirming this really was a mesh swap, not a schema change.
  Top-level group renamed from the old generic `"landmark"` to
  `"cloud-platform"` for self-description, matching land's per-kind
  naming — `airScene.test.ts` updated accordingly. 5 new unit tests
  (`cloudMeshes.test.ts`: puff count/shape, deterministic layout,
  vertical flattening, fresh-instance-per-call). Verified visually with a
  real screenshot (a cloud cluster clearly visible near a flying Fox) —
  full suite green (typecheck, 242 unit tests, build, 64 E2E tests). A
  real cloud skybox/atmosphere pass stays a further layer, not required
  here.
- `done` **(World) Air construction/placement — the third and final realm
  to plug into the shared placement pipeline, plus real save/load.**
  Picked up 2026-09-16: this cycle's own priority-order items were both
  either genuinely stuck for this track (dive-suit bug still needs a human
  with a browser) or outside this track's own section (camera framing lives
  under "Skins / visual identity") — so rather than stall, re-read
  `ARCHITECTURE.md`'s own construction-system section, which explicitly
  flagged this as the one remaining gap once sea's own catalog/rule landed
  ("air still has no placement/save-load... an open design question
  land/sea's floor-based approach doesn't answer for free"). Squarely this
  track's own charter (`AUTONOMY.md`: "construction/placement mechanics"),
  same "new content on an established, data-driven pattern" bar the sea
  construction item (2026-09-13) used — the pipeline itself (`validatePlacement`,
  `addStructure`, `realmMapStorage.ts`) needed zero changes, confirming it's
  genuinely realm-agnostic across all three realms now, not just two.
  New `src/air/airStructures.ts` (a one-type starter catalog, `sky-platform`
  — a flat landing pad, same "rough is fine" discipline sea's own single
  starter type used) and `src/air/airPlacement.ts` (mesh factory, mirrors
  `src/sea/seaPlacement.ts` exactly). `airTerrainPlacementRule`
  (`src/air/airRealmMap.ts`) is trivially true, same reasoning land's rule
  uses — air's "mostly open volume" terrain has no natural bound to reject
  a placement against, unlike sea's real swimmable-band check.
  The open design question itself — air has no ground/floor mesh to
  raycast a click against — is resolved by raycasting against an invisible
  horizontal plane through the avatar's own current altitude instead
  (`main.ts`'s `placeAirPieceAt`), standing in for the missing surface; a
  placed piece under the cursor still wins over the plane behind it (the
  same "closest hit wins" distance comparison land/sea's own
  ground-plus-placed-pieces raycast already uses), so stacking works in air
  too. Air also gained real save/load the same way sea did — no changes
  needed to `realmMapStorage.ts` either: `airMap` and the player's air
  position both persist and restore across a reload, keyed by `AIR_MAP_ID`.
  A new "Air structure:" row joins the existing `#dev-structure-panel`,
  same two-row pattern the Sea row already established. No new HUD element,
  per `AUTONOMY.md`'s "UI layout convention" — two new debug hooks instead
  (`__getAirStructureCount`, `__getLastPlacedAirType`), mirroring sea's own.
  **Found and fixed a real latent bug while building this, not just guessed
  at**: the shared `window`-level click listener that dispatches placement
  to all three realms had no check on the click's actual target, so a click
  on *any* on-screen button (e.g. `#dev-realm-panel`'s own "Air" button)
  bubbled up and attempted a placement at that button's screen position too
  — land/sea's finite ground/floor meshes made this rare in practice (a ray
  from a corner UI element's screen position usually misses their bounded
  extent), but air's placement plane is mathematically infinite, so nearly
  any ray hits it, turning "switch to Air" into "switch to Air, and also
  place a structure" every time. Caught by a failing E2E assertion (2
  structures placed after 1 real click), not guessed at. Fixed by excluding
  the real overlay UI (`#dev-panels`, `#credits`) from the listener, rather
  than requiring the click land exactly on the canvas — several existing
  E2E tests (`castle-placement.spec.ts`, `skins.spec.ts`) deliberately click
  at world coordinates that project outside the visible viewport for
  footprint separation, which target `<html>`, not the canvas, so an
  exact-canvas check would have broken those legitimate clicks too (caught
  by running the full suite before considering this done, not just the new
  spec file).
  8 new unit tests (`airStructures.test.ts`, `airPlacement.test.ts` — both
  direct mirrors of their sea equivalents; 1 new test in
  `airRealmMap.test.ts` for `airTerrainPlacementRule`); 4 new E2E tests
  (`e2e/air-construction.spec.ts`, mirroring `sea-construction.spec.ts`):
  clicking in open air places a piece, placing in air doesn't touch land's
  own HUD-backed count, a placed piece plus the player's air position both
  survive a reload, and a fresh visit starts clean. Full suite verified
  (typecheck, 289 unit tests, build, 73 E2E tests, all green including the
  3 pre-existing tests the click-listener fix's first draft had broken).
- `done` **Air's second structure type: Sky Spire.** Picked up 2026-09-21:
  air's catalog (`src/air/airStructures.ts`) had stayed at its single
  2026-09-16 starter type (`sky-platform`) ever since, unlike land's own
  four-type catalog — a real gap in catalog variety, not a structural one
  (the placement pipeline needed zero changes, same as every prior
  same-pattern addition). New `sky-tower`-shaped entry (id `sky-spire`,
  label "Sky Spire"): narrow and tall (0.7 x 3.0 x 0.7) — a deliberate
  contrast to the platform's flat/wide shape (2.4 x 0.4 x 2.4), same "rough
  box, contrast in silhouette" discipline the platform's own entry and
  land's Tower entry both used. No `realModel` yet, same reasoning every
  other rough-box entry in this codebase gives. Labeled "Sky Spire," not
  "Tower" — land's own catalog already has a "Tower" button in the same
  shared `#dev-structure-panel`, and a label sharing no substring with it
  avoids both a confusing near-duplicate in the dev panel and any risk of
  an ambiguous E2E button lookup (sea's matching new type is named "Reef
  Ridge" for the identical reason, not "Wall").
  1 new E2E test (`e2e/air-construction.spec.ts`, mirroring
  `castle-placement.spec.ts`'s/`sea-construction.spec.ts`'s own
  type-switching tests): defaults to Platform, switching to Sky Spire
  changes new placements. **Found and fixed a real E2E-placement trap
  while writing it, not just guessed at**: the test's first draft placed
  the second piece at world `x = 8` (matching land/sea's own wide
  type-switching separations) — this silently placed *nothing* (the type
  after "switching" still read back as the first piece's), traced to a
  real cause via `window.__projectToScreen` rather than assumed: at air's
  higher, positive spawn altitude specifically, `(8, AIR_SPAWN_Y, -3)`
  projects to a screen point *inside* `#dev-panels`' own bounding box
  (confirmed directly by querying it), which the shared click listener
  deliberately excludes from placement (`ARCHITECTURE.md`'s construction-
  system section) — so the click silently did nothing rather than place a
  structure. Fixed by using a closer `x = 3` separation for air's own test
  specifically (still clears both types' footprints with margin) rather
  than blindly reusing land/sea's wider spread, which only happens to stay
  clear of the panel at their own, lower/zero altitudes.
  The generic unit tests already covering both catalogs automatically
  covered the new entry with no changes needed (`airStructures.test.ts`,
  `airPlacement.test.ts` both iterate `AIR_STRUCTURE_TYPES`). Full suite
  verified (typecheck, 324 unit tests, build, 84 E2E tests).
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
- `done` **(World) Centerpiece shipwreck landmark.** Locked in during a
  2026-09-08 design review, built 2026-09-09, supersedes the old sea-
  floating-docks item: a single large, dramatic broken-ship hull + mast
  (`src/sea/shipwreckMesh.ts`) — two hull segments (a larger main section,
  a smaller stern section) tilted in different directions with a real gap
  between them, so it reads as broken rather than one solid ship, plus a
  mast leaning off the main hull (snapped, not upright) with a crossbar
  yard. Bigger and more distinct than the existing `SEA_WRECKAGE_POSITIONS`
  debris boxes, which stay completely untouched around it for scale/
  parallax — this adds one centerpiece, it doesn't replace the field
  (verified directly: a test asserts the debris count is unchanged).
  Placed near the diving-house sea-side arrival as suggested (a new
  `SEA_SHIPWRECK_POSITION` constant in `seaRealmMap.ts`, resting on
  `SEA_FLOOR_Y`, clear of the portal's own trigger radius) — deliberately
  *not* part of `RealmMap.terrain.wreckage` (that field models the
  scattered debris field the schema itself describes; this is a single
  fixed landmark, same "outside the schema, shared constant" treatment
  the portal markers already get). 6 new unit tests
  (`shipwreckMesh.test.ts`: two distinctly-tilted hull segments with a
  real gap, a leaning mast) plus 3 more in `seaRealmMap.test.ts` (rests on
  the floor, clear of the portal, not a duplicate of the smaller debris);
  `seaScene.test.ts` updated to confirm both the new landmark and the
  unchanged debris count. Verified visually with a real screenshot (the
  full broken-hull-plus-mast silhouette clearly visible) — full suite
  green (typecheck, 242 unit tests, build, 64 E2E tests). Same procedural-
  primitives-first approach as everywhere else in this codebase.
- `done` **(World) Sea construction/placement — the second realm to plug
  into the shared placement pipeline, plus real save/load.** Picked up
  2026-09-13: this cycle's own current-priority-order items were all
  either `done` already or genuinely stuck for this track (dive-suit bug
  still needs a human with a browser; camera framing lives under "Skins /
  visual identity"), and `Later / unscoped` had nothing left but
  out-of-scope multiplayer — so rather than stall, re-read
  `ARCHITECTURE.md`'s own construction-system section, which had flagged
  exactly this as anticipated future work ("sea/air add their own catalog
  + rule later without [`placementValidation.ts`] changing") but nothing
  had picked it up yet. Squarely this track's own charter (`AUTONOMY.md`:
  "construction/placement mechanics"), and "new content on an established,
  data-driven pattern" per its own no-decision-needed bar — the pipeline
  itself (`validatePlacement`, `addStructure`, `realmMapStorage.ts`) was
  already fully realm-agnostic, confirmed by needing zero changes to any
  of those three files.
  New `src/sea/seaStructures.ts` (a one-type starter catalog, `reef-pillar`
  — same "rough is fine, one type first" discipline land's own Phase 1a
  catalog once had before Wall/Gate/Tower were added) and `src/sea/
  seaPlacement.ts` (`createSeaStructureMesh`, mirrors `src/land/
  placement.ts`'s block-material/procedural-texture pipeline exactly, so a
  sea piece can use any block material land's dev panel already offers).
  `seaTerrainPlacementRule` (`src/sea/seaRealmMap.ts`) is sea's own real
  rule — genuinely non-trivial unlike land's always-`true` one, rejecting
  a placement whose center falls outside the swimmable band (below the
  floor or above the surface).
  `main.ts`'s `placeSeaPieceAt` raycasts against the sea floor mesh plus
  already-placed sea pieces, the same shape `placeCastlePieceAt` already
  used for land's ground — both functions now self-guard on `activeRealm`
  and are called unconditionally from one shared `placeStructureAt`
  dispatcher (click listener + touch-joystick tap), so exactly one of them
  ever actually does anything on a given tap. A new second row in the
  existing `#dev-structure-panel` ("Sea structure:") picks sea's active
  type, same two-row pattern the skins panel's Avatar/Blocks rows already
  established.
  Sea also gained real save/load "for free," confirming
  `realmMapStorage.ts`'s own realm-agnostic claim: `seaMap` and the
  player's sea position both persist and restore across a reload via the
  exact same `loadRealmMap`/`saveRealmMap` calls land already used, keyed
  by `SEA_MAP_ID` — no new persistence code needed.
  No new HUD element — deliberately, per `AUTONOMY.md`'s "UI layout
  convention" (no free corner to spend on a second structures counter);
  E2E coverage uses two new debug hooks instead (`__getSeaStructureCount`,
  `__getLastPlacedSeaType`), mirroring the existing per-realm hook pattern
  (`__getAirAltitude`, `__getSeaDepth`, etc.).
  Air still has no placement/save-load — deliberately left alone this
  cycle: a free-flight open volume has no natural raycast surface to click
  against the way land's ground and sea's floor both do, which is a real
  open design question (what would "click to place" even target in open
  air?) rather than a same-pattern extension, so it wasn't forced through
  here.
  14 new unit tests (`seaStructures.test.ts`, `seaPlacement.test.ts` —
  both direct mirrors of their land equivalents; 4 new tests in
  `seaRealmMap.test.ts` for `seaTerrainPlacementRule`'s accept/reject
  bounds, inclusive at both edges); 4 new E2E tests
  (`e2e/sea-construction.spec.ts`): clicking the sea floor places a piece,
  placing in sea doesn't touch land's own HUD-backed count, a placed piece
  plus the player's sea position both survive a reload, and a fresh visit
  starts clean. The reload test found (and fixed, not just worked around)
  a real flakiness trap while being written, same discipline this
  codebase already holds itself to elsewhere: comparing a pre-reload depth
  reading against a post-reload one via exact-equality was itself
  intermittently wrong, since sea's own passive buoyancy
  (`BUOYANCY_DRIFT_SPEED`) keeps drifting the avatar between the moment of
  placement and the moment either reading is taken — fixed by asserting
  "resumed meaningfully deeper than spawn" instead of exact equality
  against a captured value that was itself already stale by a small, real
  amount. Full suite verified (typecheck, 277 unit tests, build, 68 E2E
  tests, the new spec re-run several times to confirm it isn't flaky).
- `done` **Sea's second structure type: Reef Ridge.** Picked up 2026-09-21,
  alongside air's own matching addition above (same finding: land's
  four-type catalog vs. sea/air's still-single starter types each). New
  `reef-ridge` entry (`src/sea/seaStructures.ts`, label "Reef Ridge"): wide
  and low (1.8 x 1.2 x 0.4) — a deliberate contrast to the pillar's
  narrow/tall shape (1.0 x 2.0 x 1.0), same "rough box, contrast in
  silhouette" discipline the pillar's own entry used. No `realModel` yet,
  same reasoning the pillar's own entry gives. Labeled "Reef Ridge," not
  "Wall" — land's own catalog already has a "Wall" button in the same
  shared `#dev-structure-panel`, and a label sharing no substring with it
  avoids a confusing near-duplicate and any risk of an ambiguous E2E
  button lookup (see air's matching "Sky Spire," not "Tower," reasoning
  above).
  1 new E2E test (`e2e/sea-construction.spec.ts`, mirroring
  `castle-placement.spec.ts`'s own type-switching test): defaults to
  Pillar, switching to Reef Ridge changes new placements — an 8-unit `x`
  separation (matching land's own wide spread) worked fine here, unlike
  air's own equivalent test above, since sea's floor sits at a fixed
  negative `y` far from the dev panel's own screen region regardless of
  `x`. The generic unit tests already covering the catalog automatically
  covered the new entry with no changes needed (`seaStructures.test.ts`,
  `seaPlacement.test.ts` both iterate `SEA_STRUCTURE_TYPES`).
  **Also found and fixed a real, reproducible-under-load flakiness bug in
  this same file while verifying, unrelated to the new type itself**: the
  existing "survives a reload" test (`BACKLOG.md`, 2026-09-13's own
  writeup above) failed consistently — not a one-off — whenever run
  alongside the rest of the suite under real parallel-worker CPU
  contention (reproduced identically across multiple full clean
  `npx playwright test` runs and a 4x `--repeat-each` run of the file
  alone; passed every time run in total isolation as a single test). Root
  cause, confirmed rather than assumed: the assertion's margin (dive for
  800ms, then require the post-reload depth below `-4.3`, only 0.3 units
  past the `-4` spawn depth) was too tight against realistic latency
  between releasing the dive key and actually reading depth after
  `page.reload()` — under contention that gap grows enough for passive
  buoyancy (`BUOYANCY_DRIFT_SPEED`, 0.5 m/s upward) to erase the thin
  margin, landing at the same reproducible shortfall (`-4.21...`) every
  time. Fixed by lengthening the dive hold to 1500ms, banking enough extra
  depth that realistic reload-latency drift can't reach the threshold —
  verified against the actual failure mode, not guessed: 20/20 passes
  across a 4x-repeated full-file run after the fix, versus consistent
  failure before it. `e2e/sea-construction.spec.ts`'s own module comment
  now records why the hold is this long.
  Full suite verified (typecheck, 324 unit tests, build, 84 E2E tests, the
  full E2E suite re-run twice clean end to end).

## Later / unscoped

- `done` **Structure types beyond castles — read as "more castle-catalog
  pieces" (the established, data-driven interpretation) since it had no
  further elaboration; flag if a different reading was meant.** Picked up
  2026-09-11: every item in the current priority order was either already
  `done` or genuinely stuck (dive-suit bug still needs a human with a
  browser; the camera-framing item lives under "Skins / visual identity",
  outside this track's own section), so rather than stall the cycle this
  parked item was pulled forward — squarely "new content on an established,
  data-driven pattern within an already-chosen realm," `AUTONOMY.md`'s own
  bar for *not* needing a decision. Fourth `CASTLE_STRUCTURE_TYPES` entry
  (`src/land/castleStructures.ts`): `castle-tower`, a narrower-than-Keep
  (1.0 vs 1.2), taller-than-everything-else (3.6, clears Wall's 3.1) plain
  box — a distinct tall/thin corner-watchtower silhouette, not just a
  resized Keep. No `realModel` yet — same "rough is fine, real assets can
  follow later" discipline Keep/Wall/Gate themselves started under before
  the Quaternius pack landed (`realCastlePieceModels.ts`'s no-op path for a
  type with no `realModel` was previously untested, since every existing
  type had one by the time that module shipped — now genuinely exercised).
  Both `placement.ts`'s `createCastlePieceMesh`/`castlePieceGroundOffset`
  and `placementValidation.ts` are already fully generic over the catalog
  array, and `main.ts`'s `#dev-structure-panel` already builds one button
  per `CASTLE_STRUCTURE_TYPES` entry — so the new type needed zero changes
  outside the catalog itself and its own tests to become placeable, footprint-
  checked, and save/load-able. 3 new/updated unit tests
  (`castleStructures.test.ts`: distinct/tallest-of-the-others shape;
  `realCastlePieceModels.test.ts`: the "every type has a realModel" test
  updated to name exactly which three do, plus a new test for the
  previously-unexercised no-`realModel` no-op path); 1 new E2E assertion
  (`e2e/castle-placement.spec.ts`, extending the existing type-switching
  test) confirms clicking "Tower" places a `castle-tower`. Verified visually
  with a real screenshot (a tall, narrow gray box standing clearly taller
  than the surrounding trees/other structures) — full suite green
  (typecheck, 259 unit tests, build, 64 E2E tests).
- `done` **Climbable-slope limit + terrain-face collision.** Picked up
  2026-09-12: with the current priority order's own items either `done` or
  genuinely stuck for this track (dive-suit bug still needs a human with a
  browser; camera framing lives under "Skins / visual identity", outside
  this track's own section) and no realm yet having actually forced the
  issue, pulled this parked item forward rather than stall the cycle — a
  genuine `src/land/` core-system gap, not new content, so no decision
  needed either way. `stepLandMovement` (`src/land/landMovement.ts`) now
  checks the grade (rise/run) between the avatar's current and candidate
  ground height before accepting a horizontal move: a climb steeper than
  the new `MAX_CLIMB_GRADE` (1.0, a 45° face — comfortably above
  `terrainHeightAt`'s own worst-case local grade, well under 0.5 by
  construction) blocks the horizontal move entirely, like hitting a wall,
  instead of snapping the avatar up to the new height (the actual bug —
  ground collision had zero concept of "too steep," so a literal cliff or
  wall could be climbed for free). Deliberately only gates climbing:
  walking off a ledge into a steep drop is left alone, since gravity
  already handles that correctly today (the avatar falls under gravity
  instead of teleporting down to the new, lower ground instantly) —
  verified directly with a dedicated test, not just assumed. Tested
  generically, per `AUTONOMY.md`'s "core systems tested generically"
  guardrail — a synthetic gentle-slope function and a synthetic sheer-wall
  function, not anything real terrain currently produces — rather than
  waiting for a piece of content to exercise it: 3 new unit tests
  (`landMovement.test.ts`: a gentle slope keeps climbing normally, a
  vertical wall blocks the climb and holds position at its base, walking
  off a ledge into a drop is unaffected). No E2E test added — nothing in
  today's terrain content is actually steep enough to visually demonstrate
  this, and the existing land-walk/save-load/touch-controls E2E coverage
  already confirms ordinary movement over the rolling hills is unaffected.
  `ARCHITECTURE.md`'s "Known gap" note replaced with a description of the
  actual fix. Full suite verified (typecheck, 262 unit tests, build, 64
  E2E tests).
- `done` **Land jump — closed a real doc-vs-code gap, not new content.**
  Picked up 2026-09-17: the current priority order's own items were both
  still stuck for this track (dive-suit bug needs a human with a browser;
  camera framing lives under "Skins / visual identity", outside this
  track's own section) and `Later / unscoped` had nothing left but
  out-of-scope multiplayer, so rather than stall, re-read `ARCHITECTURE.md`'s
  own Avatar controller section for a flagged gap the way the last several
  cycles have — found one, but a different kind than usual: its "Land
  module" summary line has said "walk/run, gravity, ground collision,
  jump" since the section was first written, but no jump had ever actually
  been implemented (confirmed by grepping the whole repo for "jump" —
  the only hit was a test comment noting it *doesn't* exist yet). A real
  gap between documented and actual behavior, same "found a real thing to
  fix, not manufactured busywork" bar the Mannequin-credits and Tower-roof
  fixes elsewhere in this file used, just in this track's own territory
  instead of Skins'.
  `stepLandMovement` (`src/land/landMovement.ts`) gained a `jumpPressed`
  parameter (defaults to `false`, so every pre-existing caller/test is
  unaffected): a one-shot `JUMP_SPEED` upward velocity impulse, applied
  only while grounded (`velocityY === 0`, the exact value the existing
  ground clamp always leaves it at) — holding the key does nothing further
  mid-air, no double-jump or hover. `KeyboardInput.consumeJumpPressed()`
  (`src/input/keyboardInput.ts`) queues a trigger only on the rising edge
  of a fresh Space press (guards against the browser's own keydown
  auto-repeat while held) and resets to `false` the instant it's read;
  `main.ts`'s per-frame loop consumes it unconditionally every frame
  (not just while land is active) so a Space press while flying/swimming —
  where it already drives air/sea's own ascend axis — can't queue up and
  fire a surprise jump the next time the player is back on land. Space is
  deliberately the same physical key as air/sea's ascend
  (`verticalInput.ts`); safe to share since only one realm's movement
  module is ever active at once, and land itself never reads
  `getVerticalInput()`.
  **Measured, not guessed, same "render and look" discipline this codebase
  holds itself to elsewhere**: a live-browser probe (temporary, removed
  before landing) traced real altitude over time to confirm a single press
  produces exactly one clean parabola (~1.4–1.6 units peak, land settles
  back to exact spawn height) and that holding the key for 1.5s — long
  enough for several jump arcs back-to-back if it were wrongly retriggering
  every frame — produces no re-triggering at all, settling and staying
  flat instead. This caught two bad test assumptions before they landed:
  spawn altitude isn't 0 on the rolling-hill terrain (it's whatever
  `terrainHeightAt` gives at the spawn point), and discrete-Euler
  integration at real frame rates overshoots the textbook
  `v²/(2·|g|)` peak-height formula by a real, non-trivial margin — both
  E2E assertions were written against the actual measured numbers instead.
  A new debug hook, `window.__getLandAltitude` (`src/main.ts`, mirrors the
  existing `__getAirAltitude`/`__getSeaDepth` pattern), makes this
  checkable at all — `#hud-position` only ever displays x/z since land had
  no vertical movement worth showing before now.
  Touch has no jump control yet — deliberately out of scope this cycle
  (keyboard-only closes the documented gap; a touch jump button would be a
  separate, additive UI item, not required to make the doc claim true).
  5 new unit tests (`landMovement.test.ts`: jumps from the ground, rises
  then falls back to rest, ignores a second jumpPressed while still
  airborne, doesn't change horizontal speed while jumping;
  `keyboardInput.test.ts`: `consumeJumpPressed` fires once per fresh press,
  not on repeat-while-held, re-arms after a release+press, ignores
  non-jump keys). 2 new E2E tests (`e2e/land-walk.spec.ts`): a press
  produces a real rise-then-settle, and holding the key doesn't keep
  climbing. Full suite verified (typecheck, 298 unit tests, build, 75 E2E
  tests, all green).
- `done` **Touch vertical controls — closed a real, previously-unflagged
  mobile-input gap, not new content.** Picked up 2026-09-18: the current
  priority order's own items were both still stuck for this track
  (dive-suit bug needs a human with a browser; camera framing lives under
  "Skins / visual identity", outside this track's own section), and `Later
  / unscoped` had nothing left but out-of-scope multiplayer, so rather than
  stall, re-read `ARCHITECTURE.md`'s Avatar controller section again the
  way the last several cycles have. Land jump (2026-09-17) itself was fine,
  but tracing how its `jumpPressed`/vertical axis actually reaches
  `stepLandMovement`/`stepAirMovement`/`stepSeaMovement` in `main.ts`
  turned up a real, different-shaped gap: every one of those three calls
  read `input.getVerticalInput()`/`input.consumeJumpPressed()` off the
  single `KeyboardInput` instance only — unlike horizontal move input,
  which has merged keyboard with `TouchJoystick` since mobile support first
  landed (`combineMoveInputs`), nothing ever added a touch source for the
  vertical axis. A real phone has no keyboard at all, so this meant Space/
  Control — land's jump, air's ascend/descend, sea's dive/surface — were
  completely unreachable by a touch-only player: three-quarters of this
  project's own movement surface (jump plus two of the three realms'
  entire vertical range) had no mobile control whatsoever, not spotted
  until now because every prior touch-controls review focused on the
  horizontal joystick alone.
  New `src/input/touchVerticalInput.ts` (`TouchVerticalInput`, two buttons
  — ascend/descend — mirroring `KeyboardInput`'s own
  `getVerticalInput()`/`consumeJumpPressed()` shape exactly, ascend's
  rising edge queuing a jump the same way Space's does) and
  `src/input/combineVerticalInputs.ts` (`combineVerticalInputs`, a
  `Math.max(-1, Math.min(1, a + b))` clamp mirroring `combineMoveInputs`'s
  role for the horizontal axis). `main.ts`'s three call sites
  (`jumpPressed`, air's `vertical`, sea's `vertical`) now merge
  `KeyboardInput` with a new `TouchVerticalInput` instance the same way
  `moveInput` already merges `KeyboardInput` with `TouchJoystick`. Two new
  on-screen buttons (`#vertical-up`/`#vertical-down`, `index.html`)
  bottom-right — mirroring the joystick's bottom-left placement so the two
  never compete for the same screen area — `display: none` by default,
  shown only under `@media (pointer: coarse)`, same idiom
  `#dev-panels-toggle` already established (not `#touch-zone`'s
  pointer-events-only gating, since these are visible buttons rather than
  an invisible drag zone).
  Unlike `TouchJoystick`, `TouchVerticalInput` has no drag geometry — each
  button only ever tracks its own held/not-held state — so it stays
  DOM-light enough to unit test with a fake target, the same way
  `KeyboardInput` already is (`keyboardInput.test.ts`'s `FakeKeyTarget`
  pattern, reused here as `FakeTouchTarget`). 16 new unit tests
  (`touchVerticalInput.test.ts`: the pure `computeTouchVerticalInput`
  mapping, plus the class's held-state/jump-rising-edge behavior, mirroring
  `keyboardInput.test.ts`'s own jump coverage; `combineVerticalInputs.test.ts`:
  pass-through, cancellation, clamping, mirroring `combineMoveInputs.test.ts`).
  4 new E2E tests (`e2e/touch-controls.spec.ts`, the one project that
  actually renders under real `pointer: coarse`/`hasTouch`): tapping the
  ascend button jumps on land (mirrors `land-walk.spec.ts`'s own keyboard
  jump test), holding ascend/descend changes altitude in Air (mirrors
  `air-flight.spec.ts`), and holding descend dives despite buoyancy in Sea
  (mirrors `sea-swim.spec.ts`) — switching realm on this project needed the
  collapsed `#dev-panels-toggle` opened first, same as the existing
  "dev panels stay collapsed..." test already does.
  No changes needed to `placementValidation.ts`/`realmMapStorage.ts`/any
  movement module — purely an input-source addition, same "movement module
  never knows which device produced its input" boundary
  `ARCHITECTURE.md`'s Avatar controller section already documents. Full
  suite verified (typecheck, 314 unit tests, build, 79 E2E tests, all
  green).
- `done` **On-screen controls hint never mentioned jump or the vertical
  axis — closed a real player-facing gap, not new content.** Picked up
  2026-09-19: the two priority-order items were both still stuck for this
  track (dive-suit bug needs a human with a real browser, unchanged since
  `DECISIONS.md`'s "Needs Your Action"; camera framing lives under "Skins
  / visual identity", outside this track's own section), and `Later /
  unscoped` had nothing left but out-of-scope multiplayer, so — same
  pattern as every recent cycle — re-checked `ARCHITECTURE.md` for a real
  gap rather than stall. This time the gap wasn't in the movement code
  itself (jump and touch vertical controls both landed cleanly the last
  two cycles) but in whether a player could ever *discover* them:
  `#hud-controls` (`index.html`), the only on-screen text telling a player
  what the controls are, still read "Move ... Run ... Click / tap
  elsewhere to place a castle piece" — exactly what it said before jump or
  the vertical axis existed. Space/Control (or the touch ascend/descend
  buttons) are land's entire jump and air/sea's entire vertical range —
  without this line, a player has no in-app way to learn those keys exist
  at all, worst in air/sea where vertical movement isn't optional flavor,
  it's most of the realm's own movement.
  Added "Jump/Ascend: Space or ▲ · Descend: Ctrl or ▼" to the hint,
  trimming other wording to keep the total length close to the original
  (the narrow-viewport overlap-regression E2E test caught the first,
  too-long draft immediately — it pushed `#hud-controls` to a fourth
  wrapped line and collided with `#dev-panels-content` at a 390px
  viewport, exactly the class of bug that test exists to catch — fixed by
  shortening the wording, not by touching the shared panel's own
  position). `#hud-controls` is genuinely shared `index.html` territory
  per `AUTONOMY.md` (not one of World's own dev-panel ids), same as the
  original dev-panel-overlap fix was — safe to touch here since it's a
  real gap in already-shipped World functionality (jump, ascend/descend)
  being under-documented, not a Skins-owned concern.
  No test asserts `#hud-controls`'s exact text (only its bounding box, via
  the existing overlap-regression check), so no test needed updating
  beyond re-verifying that check passes with the new wording. Verified
  visually with real screenshots at both desktop (1280px, one line) and
  narrow (390px, three lines, no overlap with the skins/structures/realm
  panels) viewports. Full suite green (typecheck, 314 unit tests, build,
  79 E2E tests, no new tests needed since this is copy-only with an
  existing generic regression guard already covering the risk it
  introduced).
- Multiplayer or shared persistent world — explicitly out of scope until
  raised, per `AUTONOMY.md`.
