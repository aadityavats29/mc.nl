/**
 * Web derivatives generated from original Maison Coiffure photography in the
 * preserved content archive (before-and-after source groups and the supplied
 * portrait). Selections favour images without identifiable faces.
 *
 * IMPORTANT: publication permission for client photographs has not been
 * confirmed by the owner. No before/after pairing is claimed anywhere on the
 * site. See _handoff/HANDOFF.md before launch.
 */

export interface McImage {
  slug: string;
  alt: string;
  w: number;
  h: number;
  widths: number[];
  source: string; // original archive file, for traceability
}

const W = [480, 800, 1200, 1800];

export const images = {
  /** STAND-IN hero: purposeful landscape crop of the home-salon curls photo.
   *  The Navy-led homepage brief requires a real landscape photograph of the
   *  owner or the actual salon interior; no landscape original exists anywhere
   *  in the archive (verified 14 Sep 2026), so this crop completes the layout
   *  while that image is awaited. See _handoff/HANDOFF.md. */
  heroWide: {
    slug: 'hero-wide',
    alt: 'Long, freshly shaped brown curls in the Maison Coiffure home salon.',
    w: 2836, h: 1700, widths: [800, 1200, 1800, 2400],
    source: 'Before-After Images/Maaike/IMG_8432.heic (landscape crop)',
  },
  heroCurls: {
    slug: 'hero-curls',
    alt: 'Long, freshly shaped brown curls seen from behind in the Maison Coiffure home salon.',
    w: 2836, h: 3782, widths: W,
    source: 'Before-After Images/Maaike/IMG_8432.heic',
  },
  curlsLong: {
    slug: 'curls-long',
    alt: 'Long dark curls with natural definition, photographed from behind.',
    w: 4284, h: 5712, widths: W,
    source: 'Before-After Images/Maaike/IMG_8423.HEIC',
  },
  curlsBack: {
    slug: 'curls-back',
    alt: 'Shoulder-length curls with soft, natural texture, seen from behind.',
    w: 2014, h: 1934, widths: W,
    source: 'Before-After Images/Muriel/IMG_8308.HEIC',
  },
  curlsDefined: {
    slug: 'curls-defined',
    alt: 'Defined, bouncy curls, seen from behind.',
    w: 2344, h: 3126, widths: W,
    source: 'Before-After Images/Muriel/IMG_8312.HEIC',
  },
  greyBob: {
    slug: 'grey-bob',
    alt: 'A sleek silver-grey bob, cut to sit neatly above the shoulders.',
    w: 2558, h: 3410, widths: W,
    source: 'Before-After Images/Jana/IMG_9977.heic',
  },
  greyLong: {
    slug: 'grey-long',
    alt: 'Long natural grey-blonde hair falling smoothly down the back.',
    w: 3016, h: 2878, widths: W,
    source: 'Before-After Images/Connie/IMG_0031.HEIC',
  },
  haircutBob: {
    slug: 'haircut-bob',
    alt: 'A rounded blonde bob with a clean, even hemline, seen from behind.',
    w: 2661, h: 2823, widths: W,
    source: 'Before-After Images/Corps/IMG_8234.HEIC',
  },
  haircutLayers: {
    slug: 'haircut-layers',
    alt: 'Freshly cut hair with soft layers and movement, seen from behind.',
    w: 4284, h: 5712, widths: W,
    source: 'Before-After Images/Sanne/IMG_4337.JPG',
  },
  colourBlondeLong: {
    slug: 'colour-blonde-long',
    alt: 'Long blonde hair with soft, multidimensional colour.',
    w: 4284, h: 5712, widths: W,
    source: 'Before-After Images/Zoe/IMG_3692.JPG',
  },
  highlightsBlonde: {
    slug: 'highlights-blonde',
    alt: 'Long hair with fine blonde highlights and natural depth underneath.',
    w: 4284, h: 5712, widths: W,
    source: 'Before-After Images/Zoe/IMG_3695.JPG',
  },
  colourCopper: {
    slug: 'colour-copper',
    alt: 'Glossy warm copper hair colour with a smooth finish.',
    w: 4284, h: 3999, widths: W,
    source: 'Before-After Images/Patricia/IMG_4915.JPG',
  },
  careWaves: {
    slug: 'care-waves',
    alt: 'Soft blonde waves with natural texture, seen from behind.',
    w: 4284, h: 5712, widths: W,
    source: 'Before-After Images/Carine/IMG_0016.HEIC',
  },
  haircutShort: {
    slug: 'haircut-short',
    alt: 'A short, precisely shaped haircut, seen from behind.',
    w: 4284, h: 5712, widths: W,
    source: 'Before-After Images/Thijs/IMG_4788.JPG',
  },
  haircutClassic: {
    slug: 'haircut-classic',
    alt: 'A tidy classic haircut with a clean neckline.',
    w: 4284, h: 5712, widths: W,
    source: 'Before-After Images/VaderThijs/IMG_3837.jpg',
  },
  stylistPortrait: {
    slug: 'stylist-portrait',
    alt: 'The Maison Coiffure hairstylist, smiling with arms crossed by a window.',
    w: 2375, h: 3167, widths: W,
    source: 'Website pages/02. About/Philosophy MC/7 WEB.jpg',
  },
} satisfies Record<string, McImage>;

export function srcset(img: McImage): string {
  return img.widths.map((w) => `/images/${img.slug}-${w}.webp ${w}w`).join(', ');
}
export function src(img: McImage, w = 800): string {
  return `/images/${img.slug}-${w}.webp`;
}

/** Gallery selection: real MC work, no identifiable faces, no pairing claims. */
export const galleryImages: McImage[] = [
  images.heroCurls,
  images.greyBob,
  images.colourCopper,
  images.haircutBob,
  images.highlightsBlonde,
  images.curlsDefined,
  images.curlsLong,
  images.greyLong,
  images.haircutShort,
  images.careWaves,
  images.haircutLayers,
];
