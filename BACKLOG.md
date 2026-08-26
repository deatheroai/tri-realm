# Backlog

How this is used is described in [`AUTONOMY.md`](./AUTONOMY.md): each
build cycle picks the next unblocked, highest-priority item(s). Design
context for everything below is in [`ARCHITECTURE.md`](./ARCHITECTURE.md);
the decisions behind the sequencing are in [`DECISIONS.md`](./DECISIONS.md).

Status: `todo` / `in-progress` / `done` / `blocked` (with why).

## Phase 0 — Project scaffolding

- `todo` Initialize the TypeScript + Vite + Three.js project scaffold
  (empty scene, camera, basic lighting), deployable to Vercel as a static
  build.
- `todo` Set up Vitest (unit) and Playwright (E2E) so tests can gate
  commits per `AUTONOMY.md`.
- `todo` Define the shared `RealmMap` / `Portal` / `PlacedStructure` data
  schema from `ARCHITECTURE.md` as real TypeScript types, with unit tests
  covering (de)serialization.

## Phase 1 — Land realm (first realm)

- `todo` Land terrain representation + renderer conforming to `RealmMap`
  (heightfield vs. tile-based grid — implementation detail, not a
  decision item).
- `todo` Land avatar controller: walk/run, gravity, ground collision,
  camera follow.
- `todo` Generic save/load of a `RealmMap` + entity state — built and
  tested against land data first, but not land-specific in
  implementation.
- `todo` Castle structure catalog (keep, wall, gate — starter set) +
  placement validation against land terrain (collision, no-overlap).
- `todo` Minimal placement UI/UX: preview a structure, confirm placement,
  see it persist across a reload.
- `todo` E2E coverage: spawn on a land map, walk around, place a castle
  piece, reload, confirm it's still there.
- `blocked` (on Phase 2/3 existing) Land↔air and land↔sea portal
  implementation — the `Portal` schema is defined in Phase 0, but wiring
  an actual transition needs a real target realm to land in.

## Phase 2 — Air realm

- `blocked` (on Phase 1 completing) Air realm scoping: movement feel,
  floating terrain/platform content — needs its own design pass before
  building, same way land got `ARCHITECTURE.md` treatment.
- `todo` Flight avatar controller module.
- `todo` Air `RealmMap` content (floating islands/platforms).
- `todo` Land↔air portal — exact flavor (stairway vs. hot-air-balloon) is
  a pending decision in `DECISIONS.md`; build whichever is chosen there.

## Phase 3 — Sea realm

- `blocked` (on Phase 1 completing) Sea realm scoping: movement feel,
  floating/underwater content.
- `todo` Swim/buoyancy avatar controller module.
- `todo` Sea `RealmMap` content (sea floor, floating docks/wreckage).
- `todo` Land↔sea portal — exact flavor (dive spot / underground passage /
  beach) is a pending decision in `DECISIONS.md`.

## Later / unscoped

- `todo` Structure types beyond castles.
- Multiplayer or shared persistent world — explicitly out of scope until
  raised, per `AUTONOMY.md`.
