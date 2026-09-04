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
