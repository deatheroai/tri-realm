# Decisions Log

How this file is used is described in [`AUTONOMY.md`](./AUTONOMY.md). Short
version: things the build loop can't safely decide for itself go in
**Pending**, get asked in one batch at the next check-in, and move to
**Resolved** once answered. **Needs Your Action** is different — not a
choice, just a step only a human can physically do (creating an account,
provisioning infrastructure, etc.); the loop won't block other work waiting
on these.

## Pending Decisions

None outstanding — land↔sea portal flavor resolved 2026-09-07 (see
Resolved).

## Needs Your Action (not decisions — steps only you can take)

- **Confirm on the live deployment whether the dive-suit auto-equip bug
  (`BACKLOG.md`, Phase 2) actually reproduces.** The deployment URL is
  now known — `https://tri-realm.vercel.app` (found 2026-09-08 in the
  GitHub repo's own `homepage` field, not previously checked) — but this
  session's network policy blocks `tri-realm.vercel.app` outright, same
  as kenney.nl/quaternius.com/etc., so no automated session can actually
  drive the live app to check. Every automated angle (full local
  build/test/E2E suite against current code) already passes clean, which
  is consistent with — but doesn't prove — the "stale/un-redeployed
  Vercel build" hypothesis the item itself raised. Needs a human with a
  real browser at that URL: walk into the diving house from land and
  confirm whether the dive suit actually auto-equips on the current
  deployment.

## Resolved

- **2026-09-09 — Dive suit still looked basically like a plain capsule
  after the 2026-09-08 fix below; fixed again with more silhouette.** You
  sent another real screenshot (Female skin, swum through the diving
  house) showing a dark capsule with one small dot and one thin ring —
  still not recognizably a diver. Reproduced first against a real local
  dev server before touching anything, and it matched exactly. Different
  root cause than the 08-09 fix: that one's mask/tank/belt were all
  rendering correctly, just from the wrong angle or too faint — this
  time everything was already visible and bright, there just wasn't
  enough shape to beat a plain capsule silhouette. Rebuilt
  `createDiveSuitAvatarMesh` (`src/skins/avatarView.ts`) with a boxy
  mask/visor plus a head-strap ring (the belt's own every-angle trick,
  now on the head too), a second chest-strap ring so a head-on view
  still reads as a harness even with the tank hidden behind the torso,
  and a wide flipper plate at the feet. Verified visually (idle, facing-
  camera, side, plus zoomed front/back crops) — now clearly reads as a
  diver in gear from every angle checked. Full suite green (typecheck,
  215 unit tests, build, 61 E2E tests). See `BACKLOG.md`'s "Skins /
  visual identity" section for the full writeup.

  **Follow-up same day** — you specifically asked for flippers, still
  reading as a capsule: right call, the "flipper plate" in that fix was
  a flat box only peeking out as a thin sliver, not an actual fin shape.
  Replaced with two real paddle-shaped flipper blades splayed outward
  from the feet. Re-verified visually and full suite re-verified green.

  **Second follow-up same day — you clarified the actual ask: "a skin on
  a character," not its own separate body.** You couldn't tell from a
  screenshot whether Female, Princess, or Fox was underneath, because the
  dive suit was always the same generic body regardless of who equipped
  it — right call, and a different problem than the previous two rounds
  (both of which only polished that one generic body). Reworked the
  mechanism: the dive suit now dresses whichever real skin was actually
  worn last (tracked as `AvatarView`'s `underlyingSkinId`) instead of
  replacing it, with gear scaled to *that character's own* measured
  bounding box rather than hardcoded capsule dimensions — Fox stays Fox,
  Female stays Female, wearing gear sized to fit. Found and fixed a real
  bug along the way: measuring a bounding box on a freshly built,
  not-yet-scene-attached skinned model came back ~30x too small (a
  three.js gotcha — `Box3` can visit a `SkinnedMesh` before its own bone
  hierarchy has a fresh world matrix); fixed with an explicit full
  matrix-world update before measuring. Verified visually across Fox,
  Female, Princess, and Capsule — each stays clearly recognizable now.
  Full suite green. See `BACKLOG.md`'s "Skins / visual identity" section
  for the full writeup.

  **Third follow-up same day** — you asked why the dive suit had so many
  yellow rings: fair, it still had three (head strap, chest strap, waist
  belt) left over from when the gear's silhouette alone had to carry all
  the "reads as a diver" weight against a blank capsule. Decorating a
  real character doesn't need that anymore — cut to one (the weight
  belt) plus the mask and tank. Re-verified visually, full suite green.

  **Fourth follow-up same day** — asked directly why there was "a blue
  box in front of each avatar": fair, the mask was just a flat cyan box
  with no frame or strap, so it didn't read as a mask at all. Rebuilt as
  a dark frame + inset lens + a thin (dark, not gold) strap around the
  head, so it reads as goggles worn on the face instead of a floating
  rectangle. Re-verified visually, full suite green.

  **Fifth follow-up same day** — "the mask should be on the face not a
  box": still true after the rebuild above, since the frame/lens were
  positioned forward of the character's own front surface. Re-centered
  the frame flush on that surface (embedded half into it, like the
  waist belt already is). One mistake made and caught by re-screenshot
  rather than assumed fixed: also bumped the head-height fraction while
  at it, which swallowed the lens inside the now-flush frame (invisible)
  and put a stray ring near Fox's ears — reverted that part, fixed the
  lens by anchoring it right at the frame's front face so its own front
  half still pokes out past it. Re-verified visually across Fox, Female,
  Princess. Full suite green.

  **Sixth follow-up same day** — asked for an actual redesign instead of
  another position nudge: right call. Every fix so far moved the same
  hard-edged box; the box shape itself was the problem — a flat-faced
  rectangle reads as a sign held to the face, not something worn on it.
  Rebuilt the frame and lens as scaled spheres (smooth, rounded, no hard
  corners) sized narrower than the full head (real mask/goggle skirts
  span eyes + nose, not ear to ear), kept the same flush-at-the-surface
  placement logic that was already correct. Verified visually across
  Fox, Female, and Princess plus a zoomed crop. Full suite green (one
  E2E timeout during verification confirmed as a parallel-load flake,
  not a regression — passed clean alone and in a full re-run).

  **Seventh follow-up same day** — still "too out of place," asked for
  an actual attachment to the face. Right diagnosis: every fix through
  the sixth round was still repositioning a box-fraction guess, never a
  real attachment point. Checked rather than assumed one didn't exist:
  dumped every skin's bone names directly, and every skinned character
  (all but Princess, which has no rig) ships a bone with "head" in its
  name. Rebuilt the mask to track that bone's actual world position
  every frame — it now follows real head motion from the character's
  own animation. Caught and fixed one real bug along the way: the
  forward push off the bone's pivot was first a flat fraction of head
  size, which buried the mask almost entirely inside Fox's elongated
  snout (measured directly: ~0.91 world units short). Fixed by measuring
  each character's actual face-to-bone distance instead of guessing a
  generic fraction. Verified visually across Fox and Female, idle and
  mid-walk. Full suite green.

  **Eighth follow-up, next day (2026-09-10)** — three mask-shape
  candidates were screenshotted side by side first this time, without
  touching committed code, and you picked the wide single-pane mask.
  Reported back two concrete problems on it: oversized on Female,
  misaligned to one side on Fox. Root-caused both before fixing:
  (1) `headRadius` was derived from body *width*, and Female's rig
  turned out to be bind-posed in a T-stance, so "width" was really her
  arm-span — an even bigger mismatch than shoulder width alone. Fixed by
  deriving it from body *height* instead, which a T-pose doesn't affect.
  (2) the mask only tracked the head bone's position, not its rotation;
  Fox's idle clip is literally named "Survey" (a look-around animation),
  so an independent head turn left the mask projecting along the body's
  old fixed direction. Fixed by tracking the bone's full transform
  (position + rotation) via a matrix fixed relative to its bind pose,
  reapplied on the bone's current transform every frame. Verified at
  high resolution on both characters, including confirming the rotation
  fix by sampling Fox's mask through several seconds of its look-around
  cycle. Full suite green.

  **Ninth follow-up, same day** — reported two more pieces that "don't
  fit the narrative": a big yellow box behind Female's body (the tank)
  and a round hula hoop around her body (the belt). Same root cause as
  the mask-sizing bug just fixed, never applied to the rest of the
  gear: `torsoRadius` (sizing/placing the tank, belt, and flippers) was
  still derived from body width — her T-pose arm-span again. Fixed by
  deriving it from height too, tuned to keep Fox's already-correct look
  unchanged. Verified visually — belt now sits at her actual waist,
  tank reads as a normal-sized tank on her back. Full suite green.

  **Tenth follow-up, same day** — "too bulky, like a rubber tube" on the
  belt. A real regression from the fix just above, not a fresh
  complaint: its tube thickness was a fixed number tuned for the old,
  much larger arm-span-based `torsoRadius`; shrinking the ring without
  shrinking the tube to match left it proportionally chunkier. Fixed by
  making the tube thickness a fraction of `torsoRadius` instead of
  fixed, plus flattened it into a strap's cross-section instead of a
  round cord. Verified visually on Female and Fox. Full suite green.

- **2026-09-08 — Dive suit looked like a plain capsule; fixed.** You
  reported the avatar reading as an undecorated Capsule after switching
  to the Dive Suit skin. Confirmed programmatically first (not assumed):
  the auto-equip/skin-resolution logic is completely correct — the built
  visual really is the distinct dive-suit mesh, not a silent fallback.
  The actual bug was legibility: screenshotting the real follow camera
  from several headings showed the mask and tank each only read from one
  narrow facing, and the mask specifically vanished entirely once it was
  actually facing the camera (too close to the body's surface, too pale/
  transparent). Fixed by making the mask/tank protrude further and hold
  up better under Sea's dim fog, plus adding a waist belt that reads as
  equipment from every heading regardless of which way the avatar faces —
  see `BACKLOG.md`'s "Skins / visual identity" section for the full
  writeup and verification screenshots taken from idle/back/front/side.

- **2026-09-08 — Dev panels covered the game view on a real phone; fixed
  with a collapse toggle.** You sent a screenshot from an actual phone:
  the shared `#dev-panels` column (six avatar skins, four materials,
  three structures, three realms — more buttons than existed when the
  original dev-panel-overlap fix was written) had grown tall enough to
  leave only a sliver of the avatar visible. Fixed directly in this
  session (not deferred to a daily cycle) since it was a small, contained,
  well-precedented change: a collapse-by-default toggle scoped to
  `@media (pointer: coarse)`, mirroring the existing `#credits` toggle
  exactly — a fine-pointer/desktop device (every existing E2E test
  included) sees no change at all; only a real touch device starts
  collapsed. Full suite verified (typecheck, 215 unit tests, build, 61
  E2E tests, one new) and confirmed visually with real Pixel-5-viewport
  screenshots, collapsed and expanded. See `BACKLOG.md`'s "Skins / visual
  identity" section for the full writeup.

- **2026-09-08 — Environment art pass designed and prioritized: land
  parkland, cloud platforms, sea shipwreck centerpiece.** You asked
  whether there's a plan to populate the three realms visually (garden/
  cloud/shipwreck themes) — there wasn't; every realm's dressing today is
  still plain placeholder primitives (gray cylinders for land landmarks
  and air platforms, brown boxes for sea wreckage). Designed together in
  this session: **Land** gets a generic "parkland" dressing (trees,
  flower-bed patches, a path, one small fountain/gazebo centerpiece) —
  deliberately light-touch rather than a heavily-themed garden, since you
  clarified this repo's purpose is to be cloned and built upon, so the
  goal is a pleasant, easily-reskinned default rather than an opinionated
  narrative. **Air** gets cloud-*shaped* floating platforms (the platform
  mesh itself becomes the cloud, not just backdrop dressing) for the same
  foundational-starter reasoning. **Sea** gets one dramatic centerpiece
  shipwreck landmark alongside the existing smaller debris, rather than
  re-skinning every wreckage box — this supersedes the old "Sea RealmMap
  hardening" backlog item. All three implemented the same way
  (`AIR_FLOATING_PLATFORM_POSITIONS`/`SEA_WRECKAGE_POSITIONS`'s existing
  data-array pattern) so a fork can reskin a realm by swapping one
  array/asset set. **Priority**: you asked for a full review of open
  items first; agreed order (now in `BACKLOG.md`'s new "Current priority
  order" note) is the Air pitch-parity fix, then the dive-suit bug, then
  this three-realm art pass, then the existing castle-model/camera-framing
  polish items, with "Later/unscoped" still parked behind all of it.

- **2026-09-08 — Review feedback: Air/Sea animation gaps flagged; "Female"
  skin turned out to already be merged mid-review.** You reviewed the
  deployed app and reported three things in a persistent session: (1)
  flying in Air still reads as "walking on land," no sense of floating —
  confirmed as a real gap, logged as a `todo` under Phase 2 in
  `BACKLOG.md` (Air never got the vertical-pitch/animation-state
  treatment Sea already has). (2) the dive suit didn't auto-equip after
  swimming through the diving-house portal into Sea — you confirmed you
  went through the actual portal (not the `#dev-realm-panel` cheat
  button, which is correctly excluded from auto-equip by design), so
  this is logged as a `todo` bug under Phase 3 in `BACKLOG.md` for the
  next cycle to reproduce and root-cause (starting with whether the live
  Vercel deployment is actually current). (3) you recalled a second,
  female-presenting build layered on top of Princess — an initial search
  of `main` and every branch found nothing, so this was logged as a new
  request; **correction moments later**: PR #1
  (`claude/princess-animation-flexibility-p16jcj`, from a 2026-09-07
  session where you'd asked whether Princess's frozen pose was fixable)
  merged to `main` mid-conversation, adding exactly this — a new 6th
  `female` skin (Mesh2Motion CC0 `female_8` + a matched animation rig,
  since Princess's own source has no skeleton to animate). Your memory
  was correct; it simply hadn't reached `main` yet when first checked.
  The redundant new-skin request was removed from `BACKLOG.md` once this
  came to light — no further action needed there.

- **2026-09-07 — Daily-routine feedback channel fixed: fresh sessions
  stay fresh, feedback moves to a persistent session + this file.** You
  reported having to "revoke it from the email each time" after replying
  inside a day's Skins-daily session on mobile — the routine's session
  kept seeming to disappear. Root cause: since 2026-09-04 both daily
  triggers spin up a brand-new, disposable session on every fire (by
  design, so a track's chat doesn't grow unbounded over weeks) — so a
  reply inside one day's cycle session never reaches the next day's,
  which is a different session entirely, and an `AskUserQuestion` raised
  inside an unattended fire became a stale prompt on a session that was
  about to vanish. You confirmed the disposable-session design is what
  you actually wanted (chat length, not continuity, was the concern) —
  so the fix is the feedback channel, not the session lifecycle:
  unattended daily fires now only log a pending question to this file's
  Pending section and never call `AskUserQuestion`; you give
  decisions/feedback in any persistent session on the repo instead (this
  one, or the manual/legacy per-track sessions), which updates this file,
  and the next automated cycle picks up the resolution by reading the
  file — no session continuity required. Both daily triggers'
  prompts and `AUTONOMY.md`'s "Parallel tracks" section (new "Feedback
  channel" subsection) updated to match.

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

- **2026-08-30 — Two parallel daily tracks set up: World and Skins.**
  You asked for world-building and skin-generation to run as genuinely
  parallel daily work, not sequential phases. Resolved via
  `AskUserQuestion`:
  1. **Two separate branches/sessions**, not one session alternating —
     real parallelism, matching what "parallel" actually means.
  2. **Autonomous daily cycles** — each track's session follows
     `AUTONOMY.md`'s existing cycle (check `DECISIONS.md`'s Pending,
     otherwise build the next unblocked item in its own `BACKLOG.md`
     section) and only stops for a genuine decision, same bar as this
     session has used throughout.

  Set up: `claude/world-daily` and `claude/skins-daily` branches (both
  from `main`'s current tip), a dedicated persistent session per track,
  and a daily trigger per track waking its session (staggered — World
  then Skins a few hours later, so the second cycle each day starts from
  the first's already-merged `main`). File ownership split and the
  two-branches-on-`main` merge protocol (a real merge now, not
  fast-forward-only) recorded in `AUTONOMY.md`'s new "Parallel tracks"
  section — that's the source of truth for how this actually works day
  to day, not this entry.

  This session (`claude/tri-realm-readme-wh2lr2`) remains available for
  direct/manual work as before — the two new sessions handle the daily
  automated cadence specifically.

- **2026-08-31 — Found a partial way around the Kenney/Quaternius/ambientCG
  network block: a GitHub-releases mirror.** Not a decision exactly, but
  a technical discovery worth logging prominently since it changes the
  "blocked, needs you" framing on several `BACKLOG.md` items. While
  looking for real PBR textures, checked the npm registry (also
  reachable) for existing CC0-asset tooling and found
  [`@jgengine/assets`](https://www.npmjs.com/package/@jgengine/assets) —
  a community-maintained, license-verified index of CC0 packs from
  Kenney/Quaternius/ambientCG/etc. Its own `download.js` reveals a
  **default mirror**: it re-hosts the actual archive bytes for every
  *pinned* source on its own repo's GitHub Releases
  (`github.com/Noisemaker111/jgengine/releases/download/packs/
  <provider>-<packId>.zip`). Tested directly — `curl -L` on that URL
  pattern returns real archive bytes (confirmed ~100MB for a Quaternius
  pack, and several ambientCG material zips), because it's a
  `github.com` release-asset download, not the provider's own domain,
  and this session's policy only blocks the latter.

  **What this does and doesn't unblock**: ambientCG PBR materials and at
  least some Quaternius packs (its own index pins e.g. a "Medieval
  Village MegaKit" — real castle-relevant content) are reachable this
  way. Not everything: the index marks several packs (Quaternius's
  animated-character/animal packs among them) `unpulled` — no archive
  URL pinned yet, would still route to the blocked site directly if
  pulled. So the "princess figure" ask and similar character content
  are **still blocked** even with this discovery; stone/wood/metal PBR
  materials are not. Full mechanics recorded in `ARCHITECTURE.md`'s
  "Where assets actually come from".

  **Acted on immediately**: pulled real ambientCG textures (sandstone →
  PavingStones001, slate → Rock001, timber → Wood001, gold → Metal001,
  all CC0-1.0) this way, replacing the generated-pattern interim
  textures with real photographed ones — see `BACKLOG.md`. Logged here
  rather than filed only as a Skins backlog item because it's relevant
  to World's still-blocked castle-piece-model-pack item too — worth
  checking this same mirror before assuming that's still blocked.

- **2026-09-02 — Land↔air portal flavor: hot-air-balloon launch point
  first, stairway second — want both eventually.** Asked via
  `AskUserQuestion` now that air is scoped (`BACKLOG.md` Phase 2)
  enough to build a real portal against. You confirmed both flavors are
  wanted long-term and left the build order to my judgement; picked the
  balloon first for being the more visually/thematically distinctive of
  the two (a plain stairway reads as just a taller wall next to the
  existing castle pieces) — worth proving the portal *mechanism* against
  the more demanding visual first. The generic `Portal`
  transition system (`ARCHITECTURE.md`) is realm-agnostic either way, so
  adding the stairway later is a second catalog entry, not new plumbing.
  Land↔sea's flavor stays a separate, still-pending decision (moved back
  to Pending above) — sea isn't scoped yet, so there's nothing concrete
  to weigh flavors against.

- **2026-09-07 — Land↔sea portal flavor: a diving house, with a
  dive-suit change, over a basement pothole.** Resolved directly in chat,
  in response to the flavor question raised at the 2026-09-05 sea-scoping
  cycle (previously Pending). Your direction: a small diving-house
  structure on the land side the avatar can walk into; inside, the
  avatar's visual changes into a dedicated dive suit; the actual
  transition happens by descending through a pothole in the house's
  basement, arriving in the sea realm. More elaborate than land↔air's
  balloon/stairway (a bare launch point) — a real little scene with a
  costume change, not just a marked spot on the ground.
  **Build split, logged as concrete `BACKLOG.md` items for each track**:
  World owns the diving-house structure (model/placement, likely a new
  entry alongside `castleStructures.ts`'s Keep/Wall/Gate, though it need
  not be a placeable player structure — a fixed landmark is enough) and
  the basement pothole's actual portal-trigger wiring
  (`src/world/landSeaPortal.ts`, same shape as `landAirPortal.ts`).
  Skins owns the dive-suit avatar skin itself — a new `avatarSkins.ts`
  catalog entry, wired into `AvatarView` the same way Fox/Robot/Princess/
  Mannequin are — and the swap-into-it moment as the avatar enters the
  house/descends the pothole. Left to whichever track actually builds
  each half: exactly how automatic the suit swap is (auto-equip on entry
  vs. still showing the player's chosen skin underneath, whether it
  reverts on returning to land) — implementation detail, not itself
  decision-worthy per `AUTONOMY.md`'s bar.
