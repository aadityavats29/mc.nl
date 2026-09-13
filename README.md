# Maison Coiffure — website + Studio

The custom Maison Coiffure website (Navy-led homepage direction, 14 Sep 2026) together with
**Maison Coiffure Studio**: the owner's private control centre for every page, price, photo and
menu label, with drafts, previews, publishing, history and the AI-ready published-content export.

**Read `_handoff/HANDOFF.md` first** — provisional identity decisions, photography permissions
still needed, and every open content item awaiting the owner.

## Running it

```bash
npm install        # first time on a new machine: delete node_modules first if it was
                   # installed on a different operating system
npm run dev        # development server on http://localhost:4321
npm run build      # production build
npm start          # run the production server (uses PORT / HOST if set)
```

Node 20+ recommended.

## Accessing Studio

1. Start the site (`npm run dev` or `npm run build && npm start`).
2. Open **http://localhost:4321/studio**.
3. The first visit offers **first-run setup**: create the owner account (name, email, password).
   There are no default or shared credentials anywhere.
4. After signing in: Overview → Pages / Treatments / Services & prices / Photos & videos / Blog /
   Brands / Menus & footer / Business details / Assistant content / Settings. The built-in
   **Owner guide** covers the everyday tasks (replace a photo, change a price, undo a mistake).

The workflow is always **Choose page → Edit → Save draft → Preview → Publish**. Nothing changes on
the public site until Publish is confirmed; publish validates required fields and price semantics
first and warns about photos whose client permission is unconfirmed.

## How it fits together

| Piece | Where |
| --- | --- |
| Content database (records + revisions + media registry + events) | `data/mc.db` (SQLite, created and seeded on first run from `src/lib/seed.ts`) |
| Uploaded media (originals + web derivatives) | `data/media/` |
| Studio | `src/pages/studio/`, engine in `src/lib/studio.ts`, auth in `src/lib/auth.ts` |
| Public pages (server-rendered from published content) | `src/pages/`, read helpers in `src/lib/pub.ts` |
| Assistant export (published content only, bearer token) | `GET /api/assistant/content/v1`, token in Studio → Settings |
| Dynamic sitemap from publication state | `/sitemap.xml` |
| Motion/interaction controller | `public/scripts/motion.js` |
| Archive-derived web images | `public/images/` (originals in the preserved archive stay untouched) |
| Acceptance tests | `verify.mjs` (public site, 39 checks), `studio-verify.mjs` (Studio + AI-readiness, 44 checks) — run each with `node <file>` after a build |

**Backups:** the whole content state is the `data/` folder (plus a JSON export under Studio →
Settings). Copy it daily once hosted, keep ≥30 days; restore = put the folder back and restart.

**Deployment note:** the site is a plain Node server (`npm start`) — any Node host or a small VPS
works. SQLite is the vendor-neutral default store; moving to Postgres or a hosted CMS later is a
data-layer swap, the content model already matches. No hosting vendor has been selected or approved.

## Deliberate behaviour

- Everything renders without JavaScript; motion is progressive enhancement and
  `prefers-reduced-motion` shows final states instantly. Both homepage marquees pause on
  hover/focus, have Pause/Play controls, become manual swipe rows on touch and static layouts
  under reduced motion; loop clones are aria-hidden and out of the tab order.
- Booking/enquiries compose WhatsApp messages to the salon's real number; requests are explicitly
  not confirmed bookings; colour/highlight/Gracefully Grey are requestable only via their
  consultations.
- Prices live once in shared records: a Studio price edit updates the treatment page, catalogue,
  homepage previews, booking selector and assistant export together on publish.
- Only explicitly published content reaches visitors, crawlers, the sitemap and the assistant
  export; drafts, internal notes and unconfirmed brands never leave Studio.
