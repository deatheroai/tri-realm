# Decisions Log

How this file is used is described in [`AUTONOMY.md`](./AUTONOMY.md). Short
version: things the build loop can't safely decide for itself go in
**Pending**, get asked in one batch at the next check-in, and move to
**Resolved** once answered. **Needs Your Action** is different — not a
choice, just a step only a human can physically do (creating an account,
provisioning infrastructure, etc.); the loop won't block other work waiting
on these.

## Pending Decisions

- **Exact form of the land↔air and land↔sea portals** — e.g. a stairway or
  hot-air-balloon launch point for land↔air, a dive spot / underground
  passage / beach for land↔sea. Deferred until Phase 2/3 (`BACKLOG.md`)
  are actually scoped; the world model only requires that portals exist
  as named transition points, not which flavor each one takes.

## Needs Your Action (not decisions — steps only you can take)

None outstanding — Vercel project imported 2026-08-26 (see Resolved).

## Resolved

- **2026-08-25 — Initial README added.** Described the project's purpose
  (a foundational engine for land/air/sea worlds with unified avatar
  navigation, a shared map representation, and player-driven construction
  starting with castles) and goals in `README.md`.

- **2026-08-26 — Tech stack: TypeScript + Three.js, deployed to Vercel.**
  Driven by an explicit requirement that the project be deployable and
  testable on a free platform like Vercel — which is a web-hosting
  platform, not a native-app host. Ruled out Godot and Bevy (both would
  need a secondary WASM export bolted onto an engine built primarily for
  native) and a from-scratch engine (too slow to reach anything playable).
  Chosen stack mirrors the working pattern already proven in
  `deatheroai/testai`: TypeScript, Vite, deployed as a static build to
  Vercel. Testing tooling (Vitest + Playwright) carried over from the same
  precedent to satisfy `AUTONOMY.md`'s "tests gate every commit" guardrail.
  Full rationale recorded in `ARCHITECTURE.md`.

- **2026-08-26 — World model: hybrid — separate maps per realm, one
  shared schema, connected by named portals.** Not one continuous 3D
  space. Each realm (land, air, sea) is its own map, buildable and
  testable independently, but all three are instances of the same
  `RealmMap` schema and are operated on by the same shared systems
  (loader, save/load, structure placement). Realms connect via portals —
  explicitly requested: land↔air via a stairway or hot-air-balloon launch
  point, land↔sea via diving, an underground passage, or a beach (exact
  choice deferred, see Pending above). Each realm is expected to have a
  genuinely distinct movement feel and its own realm-appropriate floating
  elements (e.g. floating islands/platforms in air, floating docks/wreckage
  in sea) — the specific content is left to my judgement per-realm as each
  one is actually built, per explicit instruction. Full schema in
  `ARCHITECTURE.md`.

- **2026-08-26 — First realm to build: land.** Confirmed as originally
  recommended — matches the README's castle-building precedent and has
  the most conventional movement (terrain collision, no buoyancy/lift
  math), lowest risk to validate the avatar + construction systems
  against before generalizing to air/sea. Sequencing recorded in
  `BACKLOG.md`.

- **2026-08-26 — Backlog reprioritized: visible/deployed vertical slice
  before backend generalization.** You flagged that if a lot of backend
  gets built first, you can't appreciate, test, or redirect the work —
  need to be able to check direction on the live Vercel app quickly.
  `BACKLOG.md` restructured: Phase 1 split into Phase 1a (walk on land,
  place a placeholder structure — all hardcoded, no schema, each item
  ends in something reviewable on Vercel) and Phase 1b (the `RealmMap`
  schema, real validation, generic save/load — only starts once 1a is
  reviewed). Made a standing guardrail in `AUTONOMY.md` so future phases
  (air, sea) follow the same visual-first sequencing rather than needing
  to be asked again each time.

- **2026-08-26 — Push directly to the working branch, no PR-per-cycle.**
  Every push to the working branch gets its own Vercel preview deployment
  automatically, so a PR isn't needed just to get something reviewable —
  I push, you review on the branch's preview URL, and `main` (production)
  gets fast-forwarded once you're happy with it. Matches how this project
  has worked so far. Cadence itself stays manual-kickoff (send a message
  to start a cycle) — not raised as a separate blocking decision since
  that's already working fine.

- **2026-08-26 — Vercel project imported.** Repo imported into Vercel with
  Root Directory at the repo root. GitHub default branch switched to
  `main` beforehand so Production Branch tracks `main` correctly. Ready
  for Phase 0's first deployable build.
