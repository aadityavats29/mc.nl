# Maison Coiffure — custom website build

A custom, static-first build of the new Maison Coiffure website (Astro 5, TypeScript, no CMS
yet, no WordPress, no theme code). Content, prices and booking semantics come from the preserved
MC master brief and the September 2026 booking specification; design and motion follow the
10 September design & interaction brief.

**Read `_handoff/HANDOFF.md` first** — it records the provisional identity decisions (palette,
monogram, type), the photography permissions still needed, and every open content item awaiting
the owner.

## Running it

```bash
npm install
npm run dev       # local dev server
npm run build     # static production build in dist/
npm run preview   # serve the production build
```

Node 20+ recommended.

## Where things live

| Path | Contents |
| --- | --- |
| `src/data/services.ts` | The complete service catalogue as structured data (single source for every price shown anywhere, the treatments index, and the Book page) |
| `src/data/site.ts` | Contact details, availability, navigation, hair-length definitions, global price condition |
| `src/data/explorer.ts` | The eight treatment-explorer rows (summaries + hover previews) |
| `src/data/images.ts` | Image manifest: every photo's archive source, dimensions and alt text |
| `src/pages/` | All 18 pages (file-based routing) |
| `src/components/` | Header, drawer, footer, price tables, explorer, enquiry form, monogram |
| `src/styles/global.css` | Design tokens (provisional MC palette), layout, motion CSS |
| `public/scripts/motion.js` | The motion/interaction controller (reveals, quote, previews, drawer, dropdowns, WhatsApp forms) |
| `public/images/` | Web derivatives generated from original archive photography (originals untouched) |
| `public/mc-monogram.svg` | The M/C mark, extracted as vector from the original concept-3 artwork |
| `verify.mjs` | Automated acceptance checks (43 checks; needs Playwright + Chromium) |
| `shots.mjs` | Screenshot harness used during review |
| `_handoff/` | Handoff notes, image contact sheets and review candidates |

## Deliberate behaviour

- Everything renders without JavaScript; animation is progressive enhancement, and
  `prefers-reduced-motion` shows final states instantly.
- The hero logo entrance plays once per session and never on back/anchor navigation.
- Booking and enquiries compose WhatsApp messages to the salon's real number; nothing pretends
  to be a live reservation system, and colour/highlight/Gracefully Grey treatments can only be
  *requested* via their consultations.
- No Favorites/bestsellers section anywhere (explicit owner direction).
# mc.nl
