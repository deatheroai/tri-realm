# Autonomous Working Mode

This project can be built by an autonomous working session that designs,
plans, and implements progressively on its own, and only interrupts you for
decisions that genuinely need a human call — batched into one check-in per
cycle rather than one-off pings.

## Schedule

Not yet set. Until a cadence is chosen, cycles are kicked off manually —
send a short message (e.g. "next cycle") and the session runs the same
procedure below on demand. It reads this doc plus `DECISIONS.md` and
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

- **Tests gate every commit.** New logic ships with new/updated tests; the
  full suite must pass before anything is pushed.
- **Core systems (avatar movement, map representation, construction) are
  tested generically where possible** — e.g. terrain-traversal rules,
  placement validity, save/load round-trips — so new content additions get
  validated automatically rather than needing a hand-written test per
  piece of content.
- **Push-vs-PR workflow is a pending decision** — see `DECISIONS.md`. Until
  resolved, prefer PRs so changes are reviewable.
- **Actions only a human can take** (creating accounts, provisioning
  infrastructure, etc.) are tracked in `DECISIONS.md` under "Needs Your
  Action" — the loop won't block on these; it keeps building against
  local/mock fallbacks in the meantime where feasible.

## Changing this mode

Cadence, check-in expectations, and push-vs-PR behavior aren't set yet —
just ask, and this doc gets updated to match.
