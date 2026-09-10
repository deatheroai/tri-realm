# Asset attributions

Required credits for third-party assets bundled in `public/assets/`. Also
surfaced in the deployed app itself (`src/skins/attributions.ts`, an
"ⓘ Credits" toggle bottom-center) — this file is still the source of truth
and the fuller explanation of provenance/licensing reasoning; keep both in
sync when an entry here changes.

## `models/fox.glb`

Source: [KhronosGroup/glTF-Sample-Models](https://github.com/KhronosGroup/glTF-Sample-Models),
`2.0/Fox/glTF-Binary/Fox.glb`.

- Base low-poly model: [CC0](https://creativecommons.org/publicdomain/zero/1.0/) — "Low poly fox" by
  [PixelMannen](https://opengameart.org/content/fox-and-shiba).
- Rigging and animation: [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/) — by
  [@tomkranis on Sketchfab](https://sketchfab.com/models/371dea88d7e04a76af5763f2a36866bc).
- glTF conversion by @AsoboStudio and @scurest.

The CC-BY component requires attribution wherever this asset (or a derivative) ships —
carried into the in-app credits screen (2026-09-02, see above) as well as this file.

## `models/robot.glb`

Source: [mrdoob/three.js](https://github.com/mrdoob/three.js),
`examples/models/gltf/RobotExpressive/RobotExpressive.glb` (bundled with three.js's own
`webgl_animation_skinning_morph` example, credited there).

- Model: [CC0](https://creativecommons.org/publicdomain/zero/1.0/) — "RobotExpressive" by
  [Tomás Laulhé](https://www.patreon.com/quaternius) (Quaternius), modifications by
  [Don McCurdy](https://donmccurdy.com/).
- Fourteen built-in animation clips (Idle, Walking, Running, Jump, Dance, and more) —
  `Idle`/`Walking`/`Running` are wired to our idle/walk/run movement states; the rest are
  unused for now but available in the file if a future emote system wants them.

CC0 — no attribution legally required, but credited here anyway for provenance.

## `textures/{sandstone,slate,timber,gold}/*.jpg`

Source: [ambientCG](https://ambientcg.com) materials `PavingStones001` (sandstone),
`Rock001` (slate), `Wood001` (timber), `Metal001` (gold) — downloaded via the community
[`@jgengine/assets`](https://github.com/Noisemaker111/jgengine) index's GitHub Releases
mirror (`Noisemaker111/jgengine`, `packs` release), since ambientcg.com itself is blocked
by this session's network policy but that mirror isn't (see `DECISIONS.md`).

- All four: [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/) — ambientCG.
- Downloaded at 1K resolution, resized to 512px and re-encoded as JPEG (quality 82) before
  committing, to keep the bundle small — same reasoning as the models above. Color, normal
  (GL convention), and roughness maps for all four; gold also carries a metalness map.

CC0 — no attribution legally required, but credited here anyway for provenance.

## `models/mannequin.glb`

Source: [J-Ponzo/gltf-universal-animation-library](https://github.com/J-Ponzo/gltf-universal-animation-library)
(a GitHub mirror of Quaternius's Universal Animation Library, standard/free tier —
`quaternius.com`/`quaternius.itch.io` are both blocked by this session's network policy,
but this GitHub repo isn't, same "reachable mirror" pattern as the ambientCG textures above).

- Model + all animation clips: [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/) —
  by [Quaternius](https://www.patreon.com/quaternius).
- The source library ships 46 clips (combat, sitting, spellcasting, and more) on a single
  rigged "Mannequin" mesh, meant as a general-purpose animation reference rather than a
  finished character — bundled here specifically because it's the first reachable free
  source with genuine **swim** clips (`Swim_Idle_Loop`, `Swim_Fwd_Loop`), closing the
  long-open "sea-specific swim-stroke animation" backlog item. Trimmed to 5 clips before
  committing (`Idle_Loop`, `Walk_Loop`, `Sprint_Loop`, `Swim_Idle_Loop`, `Swim_Fwd_Loop` —
  the ones this project's idle/walk/run/swim states actually use) via
  `@gltf-transform/cli`'s `prune`, cutting the packed `.glb` from the source's ~46-clip
  size down to ~736KB.
- Idle/Walk/Sprint clips are wired to the usual idle/walk/run movement states, same as
  Fox/Robot; the two Swim clips are additionally wired to sea-specific "swimIdle"/
  "swimActive" states (`src/skins/avatarSkins.ts`, `src/sea/seaAnimation.ts`) — only used
  when swimming in the Sea realm, every other skin (lacking swim clips) keeps using the
  regular walk/run animation while swimming, unchanged.

CC0 — no attribution legally required, but credited here anyway for provenance.

## `models/princess.glb`

Source: [Sketchfab](https://sketchfab.com/3d-models/apple-white-royal-pirate-365255d49d5e46e8a25b2bf921ef5b64),
"Apple White (Royal Pirate)" by [oaktyler1996](https://sketchfab.com/oaktyler1996).

- Model: [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/) — requires attribution wherever
  this asset (or a derivative) ships, carried into the in-app credits screen as well as this file.
- Static model — no rig or animation clips in the source file, so this skin has no idle/walk/run
  animation (unlike Fox and Robot); it renders in its authored pose regardless of movement state.
- Heavily reprocessed before committing: the source export was ~43MB (6 mesh chunks, ~607K
  triangles total, four 2048×2048 textures) — far too large to ship as-is. Simplified to a single
  ~22K-triangle mesh (meshoptimizer, via `@gltf-transform/cli optimize`) and textures resized to
  512×512, bringing the packed `.glb` down to ~2.4MB. This is a lossy simplification of the
  original artist's geometry; the CC-BY credit is for the underlying work, not a claim that this
  file is unmodified.

## `models/female.glb`

Source: [Mesh2Motion/mesh2motion-app](https://github.com/Mesh2Motion/mesh2motion-app)
(commit `2d3d1ff`), the `female_8` character mesh (`static/models-variation/human/female_8.glb`)
and the shared "universal human" animation library (`static/animations/human-base-animations.glb`).

- Model, rig, and animations: [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/) —
  Mesh2Motion (`LICENSE-CC0.MD` in the source repo covers "all 3d models, blend files, rigs,
  animations").
- A separate skin from Princess, not a replacement — see the entry above. Princess's source file
  genuinely has no skeleton at all, so no code or asset change can give it real limb movement; no
  reachable princess/royal-themed *rigged* source turned up either (Sketchfab/Quaternius/Kenney
  searched), so this uses Mesh2Motion's CC0 rig instead. It reads as a generic person, not
  royalty — a deliberate tradeoff, kept as its own skin (`female`) rather than overwriting the
  existing Princess.
- The mesh and the animation library ship as two separate files with matching bone names (that's
  the point of a shared "universal" rig) but no baked-together clips. Merged offline with a small
  `@gltf-transform/core` script: for each of 5 clips (`Idle_A`, `Walk`, `Sprint`, `Swim_Idle`,
  `Swim_Fwd`), every channel's target bone was matched by name into the mesh's own skeleton and
  copied over, renamed to `Idle_Loop`/`Walk_Loop`/`Sprint_Loop`/`Swim_Idle_Loop`/`Swim_Fwd_Loop`
  (same naming convention as Mannequin) — all 990 channels across the 5 clips matched a bone by
  name, 0 dropped. Confirmed the walk/run clips are in-place loops (root bone's translation stays
  at the origin throughout), so they don't fight the engine's own root-position movement, same as
  every other skin. Packed `.glb` is ~907KB.

## `models/castle-wall.glb`, `models/castle-gate.glb`, `models/castle-keep-roof.glb`

Source: Quaternius's "Medieval Village MegaKit", via the same `@jgengine/assets` GitHub-releases
mirror described above (`Noisemaker111/jgengine`, `packs` release) — reachable even though
quaternius.com/opengameart.org themselves are blocked by this session's network policy.

- All three: [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/) — Quaternius.
- A village/house-building kit, not a dedicated fortress kit — no single model in it reads as
  "a keep" (a fortified tower), so the fit varies per `castle-*` structure type
  (`src/land/castleStructures.ts` records the measurements this was based on):
  - `castle-wall.glb` (source: `Wall_UnevenBrick_Straight`) and `castle-gate.glb` (source:
    `DoorFrame_Round_Brick` — a free-standing archway, not a wall-with-a-door-cut-into-it, so it
    reads as "a gate" specifically) fully replace their type's old placeholder box once loaded.
  - `castle-keep-roof.glb` (source: `Roof_Tower_RoundTiles`) is a roof cap only — Keep's own box
    stays exactly as it was (block-material colored, unchanged dimensions), just topped with this
    for a more distinctive silhouette.
- Each downloaded at the pack's own resolution (2048×2048 textures, ~25MB per model — a full
  scene export retains every material in the source file, most unused by any one piece) and
  reprocessed with `@gltf-transform/cli`: textures resized to 256×256 (a distant/background prop,
  same "generated pattern before real photos" discipline as the block materials, just resolution
  instead of interim-vs-real) and pruned, landing at 340KB–1.2MB each.
- `realCastlePieceModels.ts` upgrades each placed piece's box in place once its model loads (same
  "safe default first" philosophy as every other real asset here) — a load failure leaves the
  plain box exactly as it already was.

CC0 — no attribution legally required, but credited here anyway for provenance.

## `models/flower.glb`

Source: Quaternius's "Stylized Nature MegaKit" (Standard/free tier), source file
`glTF/Flower_3_Group.gltf`, via the same `@jgengine/assets` GitHub-releases mirror described
above (`Noisemaker111/jgengine`, `packs` release) — reachable even though quaternius.com itself
is blocked by this session's network policy.

- [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/) — Quaternius.
- You asked whether the flower bed's colored balls were meant to be flowers, then asked for a
  real asset instead of the procedural stem/blossom/center built earlier the same day — this
  replaces that procedural bloom, per model, once it loads (`realFlowerModel.ts`); the soil disc
  underneath and the procedural version itself both stay, as the safe default.
- Downloaded at the pack's own resolution (2048×2048 `Leaves.png`, 1008×981 `Flowers.png` — the
  model's two materials) and reprocessed with `@gltf-transform/cli`: converted to a single `.glb`,
  both textures resized to 256×256 (same "distant/background prop" discipline the castle pieces
  above already use) and pruned, landing at 192KB (down from ~3MB before resizing).
- Authored at a much larger, single-plant scale (bbox ~1.5 × 2.0 × 1.6 units) — `realFlowerModel.ts`
  scales it down (0.35×, measured via `gltf-transform inspect` against the flower bed's own
  0.8-radius soil disc, not guessed) to sit comfortably within one bed's existing footprint.

CC0 — no attribution legally required, but credited here anyway for provenance.
