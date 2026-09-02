/**
 * In-app mirror of public/assets/ATTRIBUTIONS.md — that file's own text says
 * "carry the same credit into any future in-app credits screen." The Fox's
 * rigging/animation is CC BY 4.0, which legally requires attribution
 * wherever the asset (or a derivative) ships, not just in repo docs — this
 * is what makes that real in the deployed app, not a courtesy. Every entry
 * is shown regardless of license (CC0 doesn't strictly need it, but the
 * markdown file already credits those "for provenance" too — same spirit).
 */
export interface AttributionEntry {
  /** What this credits, e.g. "Fox rigging & animation". */
  asset: string;
  license: string;
  licenseUrl: string;
  creator: string;
  creatorUrl?: string;
}

export const ATTRIBUTIONS: readonly AttributionEntry[] = [
  {
    asset: "Fox model (base)",
    license: "CC0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    creator: "PixelMannen",
    creatorUrl: "https://opengameart.org/content/fox-and-shiba",
  },
  {
    asset: "Fox rigging & animation",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    creator: "@tomkranis (Sketchfab)",
    creatorUrl: "https://sketchfab.com/models/371dea88d7e04a76af5763f2a36866bc",
  },
  {
    asset: "Robot model (RobotExpressive)",
    license: "CC0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    creator: "Tomás Laulhé (Quaternius), modified by Don McCurdy",
    creatorUrl: "https://www.patreon.com/quaternius",
  },
  {
    asset: "Block textures (sandstone, slate, timber, gold)",
    license: "CC0-1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    creator: "ambientCG",
    creatorUrl: "https://ambientcg.com",
  },
];
