# Decisions Log

How this file is used is described in [`AUTONOMY.md`](./AUTONOMY.md). Short
version: things the build loop can't safely decide for itself go in
**Pending**, get asked in one batch at the next check-in, and move to
**Resolved** once answered. **Needs Your Action** is different — not a
choice, just a step only a human can physically do (creating an account,
provisioning infrastructure, etc.); the loop won't block other work waiting
on these.

## Pending Decisions

- **Cadence and push-vs-PR workflow** for autonomous build cycles, per
  `AUTONOMY.md`.
- **Exact form of the land↔air and land↔sea portals** — e.g. a stairway or
  hot-air-balloon launch point for land↔air, a dive spot / underground
  passage / beach for land↔sea. Deferred until Phase 2/3 (`BACKLOG.md`)
  are actually scoped; the world model only requires that portals exist
  as named transition points, not which flavor each one takes.

## Needs Your Action (not decisions — steps only you can take)

None yet.

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
