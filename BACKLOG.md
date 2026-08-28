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

- `done` Land avatar controller: walk/run (WASD/arrows, Shift to run),
  gravity, ground collision, third-person follow camera, on a flat ground
  plane with a grid + scattered landmarks for movement parallax. Pure
  movement/camera-follow/input logic unit tested (22 tests); a real
  headless-Chromium E2E test confirms walking and running actually move
  the avatar. **Review checkpoint: pending your look at the deployed app —
  WASD/arrows to walk, Shift to run.**
- `todo` Swap the flat plane for simple varied terrain (a heightfield or a
  few raised/lowered areas) so it reads as land, not a void. **Review
  checkpoint.**
- `todo` Place a placeholder castle piece (a simple box/prefab) by
  clicking a spot on the ground and seeing it appear — no placement
  validation, no persistence yet. **Review checkpoint: the core loop
  (walk + place something) is visible and clickable end to end.**

Stop here and get your read on direction before Phase 1b.

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
- Multiplayer or shared persistent world — explicitly out of scope until
  raised, per `AUTONOMY.md`.
