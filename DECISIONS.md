# Decisions Log

How this file is used is described in [`AUTONOMY.md`](./AUTONOMY.md). Short
version: things the build loop can't safely decide for itself go in
**Pending**, get asked in one batch at the next check-in, and move to
**Resolved** once answered. **Needs Your Action** is different — not a
choice, just a step only a human can physically do (creating an account,
provisioning infrastructure, etc.); the loop won't block other work waiting
on these.

## Pending Decisions

- **Which realm to build first: land, air, or sea?** The avatar
  controller, map representation, and construction system all need a
  concrete first target to build and test against before generalizing.
- **Engine/tech stack.** No language, rendering engine, or framework has
  been chosen yet (custom engine vs. an existing framework, 2D vs. 3D,
  target platform(s)).
- **Cadence and push-vs-PR workflow** for autonomous build cycles, per
  `AUTONOMY.md`.

## Needs Your Action (not decisions — steps only you can take)

None yet.

## Resolved

- **2026-08-25 — Initial README added.** Described the project's purpose
  (a foundational engine for land/air/sea worlds with unified avatar
  navigation, a shared map representation, and player-driven construction
  starting with castles) and goals in `README.md`.
