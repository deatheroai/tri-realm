# Autonomous Working Mode

This project can be built by an autonomous working session that designs,
plans, and implements progressively on its own, and only interrupts you for
decisions that genuinely need a human call — batched into one check-in per
cycle rather than one-off pings.

## Parallel tracks

As of 2026-08-30, two tracks run independently and in parallel, each on
its own branch and its own dedicated persistent Claude Code Remote
session, per explicit request — not sequential phases, genuinely
concurrent daily work:

- **World** — branch `claude/world-daily`, owns `BACKLOG.md`'s Phase
  1a/1b/2/3 (land/air/sea, avatar movement, construction/placement
  mechanics, the eventual `RealmMap` schema).
- **Skins** — branch `claude/skins-daily`, owns `BACKLOG.md`'s "Skins /
  visual identity" section (avatar skins, block materials, the dev
  switcher, asset sourcing).

Each fires on its own daily schedule (staggered — World then Skins a few
hours later — so the second cycle each day naturally starts from the
first's already-merged `main`, cutting collision odds) and runs the same
cycle described below, scoped to its own track's `BACKLOG.md` section.
This doc, `DECISIONS.md`, and `BACKLOG.md` stay single shared files —
each track edits its own section; see file ownership below for code.

### File ownership (minimizes merge conflicts between the two tracks)

- **World owns:** `src/land/`, `src/math/`, `src/input/` (movement/
  touch/keyboard — not the skin-switcher panel), `src/camera.ts`,
  terrain/ground/landmark code in `src/scene.ts`, `e2e/land-*.spec.ts`,
  `e2e/castle-placement.spec.ts`, `e2e/touch-controls.spec.ts`.
- **Skins owns:** `src/skins/`, `public/assets/`, the avatar-`Group`
  creation in `src/scene.ts`, the dev-panel wiring in `src/main.ts` /
  `index.html`, `e2e/skins.spec.ts`.
- **Genuinely shared** (both tracks may touch — expect occasional
  overlap to resolve by hand, not a sign something's wrong): the rest of
  `src/main.ts` (both wire into the same per-frame loop), the rest of
  `index.html` (both add HUD/panel markup), and each track's own section
  of `BACKLOG.md` / `DECISIONS.md` / `ARCHITECTURE.md` — edit your own
  track's section; if the other track's section changed too in the same
  merge, keep both, never overwrite one with the other.

#### UI layout convention (avoids visual, not just textual, merge conflicts)

Two independently-scheduled sessions can each add `position: fixed`
overlay markup to `index.html` in the same cycle without a git conflict —
the merge is textually clean, but the *rendered* result can still
overlap on screen (this happened once: a new castle structure-type panel
landed in the same corner as the existing skin panel). Avoid it by
construction, not by remembering to check:

- **Dev-only button panels** (skin switcher, structure-type switcher, and
  any future one) join the existing `#dev-panels` flex column in
  `index.html` rather than getting their own `position: fixed` corner.
  Add a new `<div id="...">` as another child of `#dev-panels` and give
  it the same `#dev-skin-panel, #dev-structure-panel { ... }` shared
  style rule (or extend that selector list) — the column stacks and wraps
  automatically, so a new panel can't collide with an existing one.
- **Corner HUD text** (`#hud-position`, `#hud-structures`,
  `#hud-controls`) stays one small element per corner — if a new one is
  needed, pick an unused corner/edge or extend an existing element's text
  rather than introducing a second element in the same corner.
- **Regression guard:** `e2e/skins.spec.ts` asserts no two fixed overlay
  elements' bounding boxes intersect, checked generically (every child of
  `#dev-panels`, plus the HUD text elements) so a future panel is covered
  without editing the test — a real Playwright layout check, not just a
  visual review, catches this class of bug before it merges.

### Merge protocol for two branches landing on `main` independently

This supersedes the single-branch fast-forward-only guardrail below for
these two tracks specifically (that guardrail still describes how a
single ad-hoc/manual session, like this one, operates). Each cycle,
before pushing:

1. `git fetch origin && git merge origin/main` into your track branch (a
   real merge, not a rebase — the branch may already be visible/
   reviewed elsewhere, don't rewrite its history). Resolve conflicts
   using the file-ownership split above. A conflict that isn't just
   "both sides touched the same doc section" — i.e. two tracks made
   incompatible code changes in genuinely shared territory — is a real
   decision: stop and flag it rather than guessing which side wins.
2. Verify (typecheck, unit tests, build, E2E) on the *merged* result,
   not just your own track's changes in isolation.
3. Push your track branch, then merge it into `main` the same way
   (fetch, merge, verify, push).

## Schedule

Two daily cadences are set for the World and Skins tracks (see Parallel
tracks above) — each track's own session gets woken on its own schedule
and runs the cycle below automatically. Outside of those, ad-hoc cycles
on this or any other session are still kicked off manually — send a
short message (e.g. "next cycle") and the session runs the same
procedure on demand. It reads this doc plus `DECISIONS.md` and
`BACKLOG.md`, so there's no need to repaste instructions each time.

Each cycle (automated or manually kicked off) does two things in order:

1. **Decision check-in.** Read [`DECISIONS.md`](./DECISIONS.md)'s Pending
   section. If it's non-empty, ask those questions directly in this
   conversation (batched into one round, not one at a time) and record the
   answers, moving each item to the Resolved log.
2. **Build cycle.** Read [`BACKLOG.md`](./BACKLOG.md) and pick the next
   unblocked, highest-priority item(s) — as much as fits in one focused
   session. Implement it with tests, run the full test suite (must pass
   before committing), update `BACKLOG.md`, commit, and push.

If nothing is pending and the backlog has an unblocked next item, step 1 is
a no-op and the session goes straight to building. If everything in the
backlog is now blocked on a decision, the session raises that decision (if
not already logged) and stops rather than manufacturing busywork.

## What counts as a "critical decision" (asked, batched, once per cycle)

Logged to `DECISIONS.md` and raised at the next check-in instead of
guessed:

- **Scope/direction changes** — e.g. which realm (land, air, or sea) the
  avatar controller and map representation get built out against first,
  how much "unified" behavior is required at MVP vs. deferred, when to
  start the second/third realm.
- **Engine/tech stack choices** — language, rendering/engine framework,
  networking model — anything that's expensive to reverse once content is
  built on top of it.
- **Irreversible or costly external commitments** — third-party services,
  licenses, paid tiers, anything with a cost implication.
- **Data model / save-format changes** that would break existing world,
  player, or structure-placement saves once persistence exists.
- **Art/audio direction with lasting consequences** — style commitments
  that many future terrain, avatar, or structure assets would need to
  match.
- **Multiplayer, monetization, or anything privacy/legal-adjacent** — out
  of scope until explicitly raised.

## What does NOT require a decision (built autonomously)

- New content built on established, data-driven patterns once those
  patterns exist (new terrain tiles, new structure types, new map
  regions) within an already-chosen realm.
- Refactors, bug fixes, and test coverage for existing behavior.
- Implementation-detail choices (module structure, naming, minor library
  additions that don't have cost/lock-in implications).
- Small UX/polish tweaks that don't change the project's direction.

When in doubt, the session logs the question to `DECISIONS.md` rather than
guessing — but keeps building other unblocked items in the same session
instead of stalling.

## Guardrails

- **Prioritize a reviewable, deployed vertical slice over backend
  abstraction.** You can't appreciate, test, or redirect work that only
  exists as schema/validation/save-system code with nothing on screen.
  Within any phase, order work so the earliest items produce something
  visible and clickable on the live Vercel deployment — hardcoded and
  rough is fine there. Generalizing into the "proper" architecture
  (shared schemas, validation rules, generic persistence) happens *after*
  a rough version has been reviewed and the direction confirmed, not
  before. `BACKLOG.md`'s Phase 1a/1b split is the template for this.
- **Tests gate every commit.** New logic ships with new/updated tests; the
  full suite must pass before anything is pushed. This applies even to
  the earliest visual-first slices (e.g. "the scene renders without
  error") — it's the backend *generality* that gets deferred, not testing
  itself.
- **Core systems (avatar movement, map representation, construction) are
  tested generically where possible** — e.g. terrain-traversal rules,
  placement validity, save/load round-trips — so new content additions get
  validated automatically rather than needing a hand-written test per
  piece of content.
- **`main` gets updated at the end of every cycle that pushes code**,
  once a Vercel project exists, so the live deployment stays current
  (Vercel's free/Hobby tier can't repoint Production Branch away from
  `main` — same workaround `deatheroai/testai` needed). For a single
  ad-hoc/manual session working alone (like this one), that update is a
  pure fast-forward — if `main` is ever diverged for reasons other than
  the two daily tracks below, stop and flag it rather than force-pushing
  over it. **The World and Skins daily tracks use the real-merge
  protocol in "Parallel tracks" above instead**, since two branches land
  on `main` independently there and a fast-forward-only rule can't hold.
- **Push directly to the working branch — no PR per cycle.** Every push
  gets its own Vercel preview deployment automatically, which is the
  review surface; `main` (production) gets fast-forwarded once you've
  reviewed the preview and are happy with it. See `DECISIONS.md`.
- **Actions only a human can take** (creating accounts, provisioning
  infrastructure, etc.) are tracked in `DECISIONS.md` under "Needs Your
  Action" — the loop won't block on these; it keeps building against
  local/mock fallbacks in the meantime where feasible.

## Changing this mode

Cadence, check-in expectations, and push-vs-PR behavior aren't set yet —
just ask, and this doc gets updated to match.
