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

- **2026-08-26 — Climbable-slope limit / terrain-face collision deferred.**
  You asked whether steps/stairs were in scope for the terrain work.
  Clarified the real gap: small steps already work for free (movement
  snaps to `terrainHeightAt` every frame, no max step-height check), but
  there's no "too steep to climb" concept at all — a literal cliff or
  wall wouldn't block horizontal movement today. Not visible yet since
  the current rolling-hill terrain never exceeds ~30% grade by
  construction. Chose to defer rather than build now — logged as a
  `Later / unscoped` item in `BACKLOG.md` — since Phase 1a's terrain goal
  ("reads as land, not a void") is met and this is real, separate scope
  (a max-climbable-angle check plus terrain-face collision), not a bug in
  what's already built. Revisit once a realm actually needs real cliffs
  or walls — castle walls in Phase 1b are the most likely trigger.

- **2026-08-30 — Visual identity ("skins") scoped: engine now, real free
  assets sourced from GitHub, a dev-only live switcher.** You asked to
  scope skin generation as parallel work alongside world-building, with
  tooling identified. Two things resolved via `AskUserQuestion`:

  1. **Asset track: free CC0 packs first** (Kenney/Quaternius/ambientCG),
     escalate to AI 3D generation only for gaps those don't cover.
  2. **Build the dev skin-switcher now**, not later — matches this
     project's whole "review quickly on Vercel" pattern.

  **Real constraint found while acting on this, reported rather than
  routed around**: this session's network egress policy blocks
  kenney.nl, quaternius.com, ambientcg.com outright (403 — confirmed via
  the proxy's own status endpoint as an organization policy denial, not
  a technical failure) — also itch.io, opengameart.org, polyhaven.com.
  I cannot fetch from any of these myself from inside this session.
  GitHub (`raw.githubusercontent.com`) and the npm registry *are*
  reachable.

  **Revised, working plan**:
  - **Engine side (built this round, doesn't depend on any asset
    source)**: a data-driven skin catalog (`src/skins/avatarSkins.ts`,
    `src/skins/blockMaterials.ts`), a `AvatarView` controller that swaps
    between a procedural mesh and a loaded glTF model + its animations
    with a graceful fallback to procedural on any load failure, and a
    dev-only on-screen panel to switch both live, no redeploy. See
    `ARCHITECTURE.md`'s new "Skins" section.
  - **First real asset, sourced from GitHub today**: Khronos's official
    glTF sample-asset repo has a genuine animated low-poly fox
    (`KhronosGroup/glTF-Sample-Models`, `2.0/Fox`) with built-in
    Walk/Run/Survey animation clips — CC0 base model, CC-BY 4.0
    rig/animation (attribution recorded in
    `public/assets/ATTRIBUTIONS.md`, required by that license). Wired in
    as a second selectable avatar skin, proving the whole pipeline
    (loading, scaling, animation-state switching driven by actual
    movement input) works end to end with a real, not placeholder,
    asset. Verified: the model itself walks normally on all fours from a
    proper side-on debug view — what looked like an odd upright pose in
    our normal 3rd-person camera is that camera's steep ~31° elevation
    viewing an elongated quadruped nearly end-on, not a model or
    animation bug. Worth revisiting camera framing later once there's
    more character content to actually showcase, not a blocker now.
  - **Kenney/Quaternius/ambientCG content (castle-piece packs, PBR
    textures) still needs you**: since I can't reach those sites, the
    practical flow is you download packs in your own browser and either
    push the files to the repo yourself or hand them to me in this
    session to wire in — I can't source them myself. Logged as a
    `BACKLOG.md` item, not blocking further engine work in the meantime.

- **2026-08-30 — Fox skin reviewed: confirmed, "I love the fox."** Closes
  out the review checkpoint above.

- **2026-08-30 — Fox made the default avatar skin.** Follow-up to the
  above. Split `DEFAULT_AVATAR_SKIN_ID` (now `"fox"`, shown on first
  load) from a new `FALLBACK_AVATAR_SKIN_ID` (`"capsule"`, always
  procedural) — `AvatarView`'s error-recovery path now falls back to the
  guaranteed-safe procedural skin specifically, not whatever "default"
  happens to mean, so a broken/missing asset can never cascade into
  trying to load a second broken skin. Capsule stays selectable in the
  dev panel.
