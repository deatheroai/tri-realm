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

Phase 1a complete. Stop here and get your read on direction before
Phase 1b.

## Phase 1b — Harden into the real architecture

Only starts once Phase 1a has been reviewed and the direction holds.

- `todo` Define the shared `RealmMap` / `Portal` / `PlacedStructure` data
  schema from `ARCHITECTURE.md` as real TypeScript types (unit tested),
  and refactor the Phase 1a prototype to be backed by it instead of
  hardcoded values.
- `todo` Real castle structure catalog (keep, wall, gate — starter set) +
  placement validation (collision, no-overlap against terrain).
- `todo` Generic save/load of a `RealmMap` + entity state — tested against
  land data first, but not land-specific in implementation.
- `todo` E2E coverage: spawn on a land map, walk around, place a castle
  piece, reload, confirm it's still there.
- `blocked` (on Phase 2/3 existing) Land↔air and land↔sea portal
  implementation — the `Portal` schema exists here, but wiring an actual
  transition needs a real target realm to land in.

## Phase 2 — Air realm

- `blocked` (on Phase 1b completing) Air realm scoping: movement feel,
  floating terrain/platform content — needs its own design pass before
  building, same way land got `ARCHITECTURE.md` treatment.
- `todo` Flight avatar controller module — hardcoded/minimal content
  first, same visual-first sequencing as land, before generalizing.
- `todo` Air `RealmMap` content (floating islands/platforms).
- `todo` Land↔air portal — exact flavor (stairway vs. hot-air-balloon) is
  a pending decision in `DECISIONS.md`; build whichever is chosen there.

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
