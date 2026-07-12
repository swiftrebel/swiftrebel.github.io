# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Spanish-language PWA for managing sales quotes ("cotizaciones") for VIEXSA, a glass installation company in Panama. Users create quotes with line items, preview them, export them as PDF (jsPDF), and share via WhatsApp/Web Share API.

The entire app lives in **`index.html`** (~2,300 lines): CSS in a single `<style>` block at the top, markup in the middle, and all JavaScript in one `<script>` block at the bottom. There is no build system, no package manager, no framework, no tests, and no linter. The only dependency is a vendored copy of jsPDF at `vendor/jspdf.umd.min.js`.

## Running it

Serve the directory with any static server — opening `index.html` via `file://` won't work correctly because of the service worker:

```
python3 -m http.server 8642
```

`.claude/launch.json` defines a `static-preview` server for the preview tools, and `.claude/serve.py` is the equivalent standalone script. Note the launch.json currently points to a stale scratchpad path; if `preview_start` fails, regenerate it to run `.claude/serve.py` instead.

**Service worker caching:** `sw.js` precaches the app shell and serves cache-first. When testing changes, bump `CACHE_NAME` in `sw.js` (currently `viexsa-v4`) or hard-reload with the SW bypassed — otherwise you'll see stale content.

## Deployment

The `origin` remote is `swiftrebel/swiftrebel.github.io`, i.e. pushing to `main` publishes to GitHub Pages.

## Architecture of index.html

**Navigation:** It's a single-page app made of `<section class="view" id="view-*">` elements toggled by `switchView(name)`. Three tab views (`inicio`, `cotizaciones`, `empresa`) are reachable from the tab bar; `nueva` (quote form), `agregar-producto` (product editor), and `preview` are modal-style views reached from buttons, not tabs. `returnView` tracks where `Cancelar`/back should return to.

**Scrolling:** each `.view` is its own `overflow-y: auto` scroll container (not `body` — `html`/`body` are fixed at `100dvh` with `overflow: hidden`). Sticky headers/footers (`.app-header`, `.list-header`, `.modal-header`, `.bottom-cta-wrap`, `.preview-actions`, etc.) are direct children of `.view` and stick relative to that view's own scroll. Any new view must follow the same shape (sticky header + scrollable middle, as direct children of the `.view` section) or scrolling/sticky will break.

**Data model and persistence:**
- Company settings (`companyData`) persist to localStorage under `viexsa-company`, merged over `DEFAULT_COMPANY` on load.
- Quotes (`quotes` array) are **in-memory only**, seeded with 5 demo entries — they reset on reload. Each quote has a numeric `id` (from `nextQuoteId`), a `status` (`enviada` / `aceptada` / `pendiente`), and its own `products` array (`name`, `desc`, `qty`, `width`, `height`, `price`) plus `address`, `productSummary`, `taxEnabled`.
- Clicking a quote row anywhere (`data-action="edit-quote"`, wired via `handleQuoteItemClick`) calls `openEditQuote(id, fromView)`, which loads that quote's data back into the `nueva` form. `persistQuote` writes through `currentQuoteRecord` — a reference to the quote object being edited (or a freshly created one) — so re-saving updates the existing entry in place instead of creating a duplicate.
- Totals are computed with optional ITBMS (Panama sales tax, rate from `companyData.itbms`, default 7%) via the per-quote `taxEnabled` flag.

**Quote output is rendered twice, in parallel:** `renderDocPage(fields, totals)` builds the on-screen HTML preview, and `buildQuotePdf(fields, totals)` (async — it fetches `icons/icon-256.png` and inlines it as the PDF logo via `getLogoDataUrl()`) draws the same document with jsPDF primitives. Any change to the quote layout (fields, terms, totals) must be applied to **both** functions or the preview and the PDF will diverge. Both consume `docFieldsFromForm`, `getCompanyDoc()`, and `getTerms()`. The on-screen brand logo (header, Empresa tab) is `assets/v-logo.svg`; the PDF embeds the rasterized `icons/icon-256.png` instead since jsPDF needs a raster image.

**Save side effects:** Downloading the PDF persists the quote with status `pendiente`; sharing to WhatsApp persists it with status `enviada` (see `persistQuote` and the `pdf-btn` / `shareToWhatsApp` handlers).

## Conventions

- UI copy, labels, toasts, and PDF text are all in Spanish — keep new user-facing text in Spanish.
- Currency is Panama Balboa (`B/.`) formatting via `formatMoney` / `formatCurrency`, pegged 1:1 to USD; dates use `formatDateLabel` with Spanish month abbreviations.
- User-provided strings must go through `escapeHtml` before being interpolated into innerHTML (existing render functions do this).
- Text inputs use `font-size: 16px` and number inputs hide their native spinner arrows — both intentional (16px avoids iOS Safari's auto-zoom-on-focus; hidden spinners avoid them overlapping right-aligned text/cursor). Sequential fields carry `enterkeyhint="next"`/`"done"`, wired up by `setupEnterKeyNav` to actually move focus on Enter — keep both the attribute and the function's scope list in sync when adding fields to a form.

## Future direction

`ARQUITECTURA.md` (in Spanish) is the user's own plan for evolving this prototype into a real app with a Node/Express + SQLite backend, auth, and persistent storage, while keeping the frontend vanilla. It's a roadmap, not current state — nothing in it is implemented yet.
