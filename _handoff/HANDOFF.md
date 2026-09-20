# Maison Coiffure website — build handoff

Built 13 September 2026 from the preserved content archive and the two 10 September briefs
(design/interaction brief and master content brief). Custom static build (Astro 5), no WordPress,
no theme code. Nothing has been published; this is a local build for design review.

## What was built

Every destination in the owner's required menu, with the design brief's newer labels:

- Home (calm hero with logo entrance, MC statement word reveal, two-column treatment explorer
  with contextual hover previews, Salon Party feature, stylist excerpt, recent work, practical block)
- About → MC Philosophy (`/about/philosophy`) and About the Hairstylist (`/about/hairstylists`,
  My Story retained inside it, structure ready for future real collaborators)
- Treatments index (`/treatments`) as a full catalogue destination, plus the eight child pages:
  Haircuts, Curls, Colouring, Highlights/Lowlights, Superloop, Grey Hair, Head Massage, Salon Party
- Hair Care & Recovery retained inside the catalogue at `/treatments#hair-care`; Signature
  Blow-Dry with Haircuts/styling; optional coaching in the catalogue (no new top-level page)
- For Businesses → Corporate Salon and Care Homes, each with its own quote enquiry
- Blog (empty state, no fabricated posts), Gallery (real MC work), Contact, Book (`/book`)

Facts, prices, durations and booking semantics come only from the September booking
specification as reproduced in the master brief (fixed / from / quote / consultation preserved);
Superloop keeps its V2 page-5 content and "from €89". The rejected V2 page 15 text is not used.
The catalogue is structured data (`src/data/services.ts`), not page text, so a future CMS/Studio
can take it over without rewriting pages.

Booking is honest: the Book page and all on-location pages compose WhatsApp messages to the
salon's real number. Requests are explicitly requests, not confirmed appointments. Colour, toner,
highlight and Gracefully Grey treatments cannot be requested directly — only their consultations —
implementing the consultation gate at the level a static site can.

## MC implementation decisions (ours, not observed reference effects)

- Split hero (identity panel + full-height MC photograph) at the specified 92svh scale; chosen
  because the only usable MC photography is portrait-orientation.
- Explorer previews follow the pointer on fine pointers ≥900px, with a stable side panel for
  keyboard focus and nothing floating on touch; identical text is exposed via aria-describedby.
- Motion timings implement the brief's MC specification exactly (1000ms logo entrance, 650ms/24ms
  word reveal capped at 1200ms, 550ms section reveals, 180/120ms previews, 320ms drawer).
  All content renders without JavaScript; reduced motion shows final states immediately.
- Optional page-change fade was omitted (the brief marks it optional; native navigation stays instant).

## Provisional identity — needs owner sign-off

- **Palette**: Moodboard 2 · Terracotta, chosen by Vansh from the palette exploration pack on
  20 Sep 2026. Documented archive colours warm beige `#D3C1BA`, taupe `#BAA195`, terracotta
  `#914827`, plus derived working tones (canvas `#FBF7F3`, surface `#E9DCD4`, deep terracotta
  `#7A3A1E`, ink `#40332C`, border `#DFCFC5`, muted `#7E6C61`). This replaces the provisional
  September-booking burgundy/ivory set. The owner's final identity sign-off is still open; the
  full pack lives in `_handoff/palettes/` if she wants to compare.
- **Mark**: the concept-3 M/C monogram, extracted as an untouched vector path from the original
  artwork (`Maisson Coiffure_3.pdf` / `Maisson Coiffure_NEW.ai`), recoloured via CSS only.
- **Wordmark spelling**: the original artwork spells "MAISSON COIFFURE"; the brief mandates
  "Maison Coiffure" in prose and flags the final wordmark spelling as unconfirmed. The build
  therefore uses the (spelling-neutral) monogram plus "Maison Coiffure" set in type, and does not
  reproduce the double-s wordmark. Decide the final spelling before production logo exports.
- **Type**: Playfair Display + Mulish (self-hosted, licensed for web) as stand-ins for the
  serif-headline / clean-sans direction. The packaged brand fonts (Nomark, Lamora, Avenir Next,
  Louis George Cafe) have no documented web-embedding licence, so they are not embedded.
- **Concept-3 pink discrepancy** (label `#F4D5DB` vs artwork fill `#CFA3B3`) remains open; it does
  not affect the provisional palette but must be settled with the final identity.

## Photography used, and what it needs

All images are real MC photographs from the archive (before/after source groups + the supplied
portrait). Watermarked, unpurchased stock previews were **not** used anywhere. Selection favoured
back-of-head shots without identifiable faces; four images were purposefully cropped to remove
bystanders visible in mirrors, and three candidates were rejected for identifiable third parties.

| Slug | Source (Before-After Images/…) | Used on |
| --- | --- | --- |
| hero-curls | Maaike/IMG_8432.heic | Home hero, Philosophy, Gallery |
| curls-long | Maaike/IMG_8423.HEIC | Curls, Gallery |
| curls-back (cropped) | Muriel/IMG_8308.HEIC | reserve |
| curls-defined | Muriel/IMG_8312.HEIC | Home, Gallery |
| grey-bob | Jana/IMG_9977.heic | Grey Hair, Home, Gallery |
| grey-long (cropped) | Connie/IMG_0031.HEIC | Care Homes, Gallery |
| haircut-bob (cropped) | Corps/IMG_8234.HEIC | Haircuts, Gallery |
| haircut-layers | Sanne/IMG_4337.JPG | Gallery |
| colour-blonde-long | Zoe/IMG_3692.JPG | reserve |
| highlights-blonde | Zoe/IMG_3695.JPG | Highlights/Lowlights, Gallery |
| colour-copper (cropped) | Patricia/IMG_4915.JPG | Colouring, Home, Gallery |
| care-waves | Carine/IMG_0016.HEIC | Salon Party, Home feature, Gallery |
| haircut-short | Thijs/IMG_4788.JPG | Corporate Salon, Gallery |
| haircut-classic | VaderThijs/IMG_3837.jpg | reserve |
| stylist-portrait | …/Philosophy MC/7 WEB.jpg | Hairstylist, Home |

Before launch the owner must: (1) confirm client publication permission for every photograph used;
(2) review the selection (some shots are from the academy environment rather than the home salon,
and care-waves may read as a "before"); (3) optionally supply a purchased/owned landscape hero.
No before/after pairing is claimed anywhere, because pairing and direction were never confirmed.

## Open content items (do not invent; awaiting owner)

1. Final logo selection and wordmark spelling (above); owner confirmation of the terracotta palette.
2. Owner display name and current qualification wording for About the Hairstylist. The supplied
   My Story text is presented in lightly trimmed form: the introductory-rate sentence ("Until my
   certification is complete, my treatments are available at lower rates…") is omitted because the
   newer catalogue supersedes old rate statements; the paragraph describing the Business & Team
   Operations Lead role and the sentence about intercultural blogs were shortened for web reading;
   em dashes were normalised per the owner's punctuation feedback. The complete preserved text
   remains in the master brief for Jolene's final selection — the My Story split is the deferred
   follow-up recorded there (not sent).
3. Highlights/Lowlights long-form editorial (page currently uses only supplied catalogue facts
   plus consultation routing). Corporate Salon long-form copy (page uses the supplied concise
   organisation copy).
4. Email mailbox `appointment@maisoncoiffure.nl` — existence unconfirmed; it is displayed as
   supplied. Verify or remove before launch. LinkedIn URL never supplied (omitted). Postcode and
   exact daily times unsupplied (site says "by appointment" only).
5. Blog articles (empty state shipped). Verified before/after pairs and captions for the gallery.
6. Domain `maisoncoiffure.nl` — DNS/hosting control not verified; `astro.config.mjs` assumes it
   for canonical URLs and the sitemap.
7. Deposit/cancellation/no-show/expiry/rescheduling policies (Section 20 of the specification)
   remain open business decisions; nothing about them is published.
8. Brand list is displayed as requested (Kérastase, Balmain, L'Oréal, Milkshake, Lush,
   Moroccanoil, O-Way) as plain text; no partner logos are used without permission files.

## Verification performed

43 automated checks passed (see `verify.mjs`): every page at 320px and 1440px with no horizontal
overflow or console errors; dropdown click/hover-intent/Escape/focus behaviour; hover preview
appear/clamp/clear and keyboard equivalent; drawer modal focus trap and ≤480px width; reduced
motion final states; full readability with JavaScript disabled; hero entrance once per session;
no Favorites section; recovery/Superloop/coaching retained; price semantics intact; consultation
gate on the Book page; short landscape viewport. Screenshots were reviewed at 1440/1280/1024/768/
390/320.

## Later phases (not in this build)

The Studio portal & AI-ready brief (drafts/publish, owner editing, assistant content export) is a
separate implementation phase. This build prepares for it: shared structured content, stable
canonical routes, server-rendered HTML, sitemap, truthful HairSalon structured data, and no
content that exists only behind hover or script. The chatbot remains a later integration.

---

# Update 2 — 14 September briefs (Navy-led homepage, image folder, Studio & AI-ready)

## Navy-led homepage (implemented)

The homepage now follows the owner's newer Navy-led direction, with MC's own identity and material:

1. **Logo landing over a landscape hero** — intact concept-3 monogram, one 1000ms downward
   entrance (once per session; instant on back navigation and reduced motion), discreet Book
   action, no splash screen. Header is now minimal (mark + Book + Menu) at every width; the full
   MC sitemap lives in the drawer, and a no-JS fallback nav lists every page.
2. **Spacious centred introduction** — the approved MC quote is the introduction heading (the
   Goldust-style word-by-word sequence is removed per the update); faint MC monogram watermark at
   5% opacity; heading 650ms / copy 550ms+100ms reveals at the lower-80% trigger.
3. **Animated About cards** — continuous 28px/s track (About us): MC Philosophy, About the
   Hairstylist, Visit Maison Coiffure. Pause/Play, hover/focus pause, offscreen/hidden-tab pause,
   aria-hidden clones outside the tab order; manual snap row with prev/next and dots on touch;
   static grid under reduced motion.
4. **Brand marquee** — 35px/s, only the owner-confirmed list (Kérastase, Balmain, L'Oréal,
   Milkshake, Lush, Moroccanoil, O-Way). **No logo artwork was supplied for any brand**, so the
   confirmed names render as quiet typographic marks; real marks with usage permission are an
   awaited asset, and the section is fully manageable (confirm/visibility/order) in Studio.
5. **Treatment explorer with the retained hover previews** — unchanged interaction, restyled
   surfaces.
6–8. Salon Party, Recent work and the practical block retained; the previous full stylist split
   was dropped from the homepage because the About cards provide that entrance (the full
   Philosophy and Hairstylist pages are untouched).

**Hero image: open item.** The update requires a real landscape photograph of the owner or the
actual salon. The additional image folder and the whole archive contain **no landscape original at
all** (verified: every image is portrait after EXIF rotation). The layout is complete and uses a
purposeful landscape crop of the home-salon curls photo (Maaike/IMG_8432) as a clearly flagged
stand-in; the owner needs to supply the real landscape hero (or approve this crop).

## Additional image folder review (14 Sep brief)

`/Users/adityavats/Library/Mobile Documents/com~apple~CloudDocs/MC Website` was inventoried
recursively (theme folders excluded) and every file hashed against the preserved archive manifest:
**all 130 image files and all other files are byte-identical duplicates of already-preserved
archive files. There is nothing new.** Locations reviewed: all the table's search locations,
including `01. Home` (only the known unpurchased iStock previews), `Philosophy MC` (the known
portrait and mirror selfie) and `Before-After Images` (the 42 known photos). Consequently no image
was added or replaced; the placement record from the first build stands unchanged, and the open
questions remain: landscape hero, client publication permissions, verified before/after pairs.

## Maison Coiffure Studio + AI-ready foundation (implemented)

The site now runs as a served app (Astro SSR + SQLite in `data/mc.db`) with the private `/studio`
control centre. Delivered against the Studio brief:

- Real sign-in (first-run owner setup, scrypt-hashed passwords, server-side sessions), Owner /
  Editor roles with an optional publish permission, server-side authorisation on every Studio and
  API route, noindex/no-store on all of it. CSRF origin checks on all form posts.
- Shared structured records with plain-language editors for every public content item: home
  sections, standard-page section library (text / photo / photo+text / quote / FAQ / CTA, with
  add, duplicate, move up/down, hide, restore, remove), treatments, shared price groups with
  fixed/from/quote/consultation semantics enforced ("unknown never becomes €0"), stylist profiles
  (future collaborators supported), brands with confirmed/visible gating, blog, gallery, menus &
  footer, business details, booking wording.
- Draft → real-renderer preview (authorised only) → validated publish with a confirmation step
  showing affected pages and photo-permission warnings → revision history with restore-to-draft →
  discard-changes → unpublish. Autosave while typing; concurrent edits conflict safely (newer
  work preserved, nothing overwritten). URL renames create redirects automatically.
- Media: uploads (sharp derivatives, originals preserved), alt/caption/credit, publication-status
  flags, desktop/phone focal points, "Used on…" lists, deletion blocked while a photo is in use.
- AI-ready: server-rendered readable HTML everywhere; dynamic `/sitemap.xml` from the current
  publication state with real lastmod; truthful HairSalon JSON-LD; the authenticated read-only
  export `GET /api/assistant/content/v1` (bearer token in Studio → Settings) containing only
  explicitly published content with stable IDs, canonical URLs, clean text, structured prices and
  withdrawal records; the Assistant Content screen labelled "content ready for a future
  assistant" with per-record inspection. No chatbot is integrated or simulated.
- Owner guide, JSON content backup download, and documented data-folder backup/restore.

**Verified:** 44 automated Studio/AI checks (real saved data and public results: draft privacy,
publish propagation of a shared price to every surface, consultation-gate validation, export auth
+ draft/note exclusion + withdrawal records, unpublish removing page/sitemap/export, conflict
handling, section ops, slug-rename redirects, editor-role limits, history restore, media upload
and path-traversal refusal) plus 39 public-site checks (responsive 320–1440, marquee behaviour on
desktop/touch/reduced-motion, hover previews, drawer, no-JS, homepage order, booking gate).

**Deliberate simplifications to flag** (within the brief's spirit, recorded honestly):
- Rich text is a safe light syntax (paragraphs, headings, lists, bold, links) rather than a
  WYSIWYG toolbar; everything is HTML-escaped and link schemes are restricted.
- Reordering uses accessible Move up/down buttons (no drag-and-drop yet).
- Live side-by-side preview is an embedded draft-preview frame refreshed on save, not keystroke-live.
- The "Edit this page" shortcut opens the page's Studio editor (no click-to-section mapping yet).
- SQLite is the vendor-neutral durable store pending a hosting decision; daily backups ≥30 days
  are documented as an operator task, not yet an automated job (no infrastructure exists yet).
- Password self-reset by email is not built (no mail service exists); recovery paths are in the
  owner guide.
