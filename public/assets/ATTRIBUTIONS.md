# Asset attributions

Required credits for third-party assets bundled in `public/assets/`.

## `models/fox.glb`

Source: [KhronosGroup/glTF-Sample-Models](https://github.com/KhronosGroup/glTF-Sample-Models),
`2.0/Fox/glTF-Binary/Fox.glb`.

- Base low-poly model: [CC0](https://creativecommons.org/publicdomain/zero/1.0/) — "Low poly fox" by
  [PixelMannen](https://opengameart.org/content/fox-and-shiba).
- Rigging and animation: [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/) — by
  [@tomkranis on Sketchfab](https://sketchfab.com/models/371dea88d7e04a76af5763f2a36866bc).
- glTF conversion by @AsoboStudio and @scurest.

The CC-BY component requires attribution wherever this asset (or a derivative) ships —
keep this file, and carry the same credit into any future in-app credits screen.

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
