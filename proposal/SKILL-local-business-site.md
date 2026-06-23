---
name: local-business-site
description: >-
  Build a premium, single-file marketing website for a local service business
  (auto shop, trades, restaurant, salon, clinic, etc.) with a cohesive themed
  design, real content researched from the web, interactive components
  (photo gallery + lightbox, animated logo strip, inquiry/quote form with photo
  upload), and a deploy/handoff workflow. Use when someone says "build / redesign
  a website for [local business]", references a business URL, or wants lead-capture
  features added to a small-business site.
---

# Skill: Local Business Website Builder

A repeatable method for turning a small local business into a high-converting,
visually premium website — built as **one self-contained `index.html`** that
runs anywhere and deploys in minutes. Distilled from building a vintage British
& Italian restoration shop site (Silk Cat Automotive).

---

## 0. Operating principles

1. **One file, zero build step.** Everything (HTML + CSS + JS + inline SVG) lives
   in a single `index.html`. Only external dependency: Google Fonts. It opens by
   double-click, deploys as a static folder, and never breaks on `npm` drift.
2. **Real content beats lorem ipsum.** Research the actual business first
   (services, hours, address, phone, reviews, the brands/products it features).
   A site that says true things converts; a generic template doesn't.
3. **Theme the whole thing around the business's soul,** not a stock template.
   Pick a design language that matches what they sell (see §2).
4. **Every section earns its place by driving a call, a quote, or trust.**
5. **Respect IP, hard.** Never embed copyrighted/press/stock photos you find
   online, and never bundle exact trademarked corporate logos. Use the client's
   own photos, properly-licensed stock the client supplies, or original
   stylized emblems. (See §7 — this comes up constantly and clients push on it.)
6. **Deliver something they can see immediately** — zip the folder and send it,
   because their live host may lag or be misconfigured.

---

## 1. Discovery / research workflow

Before writing any code, gather the facts. The business URL often 403s to
automated fetchers, so lean on web search.

- `WebSearch "<business name> <city>"` → identity, category, specialty.
- `WebSearch "<business> reviews hours services"` → pull real service list,
  hours, and **review excerpts with reviewer names** (these become testimonials).
- Capture: legal name, year established, address, phone (format as `tel:` +
  display), email if public, hours, service list, the brands/products featured,
  owner/staff names (great for testimonials and an "about" voice), star rating
  and review count.
- If the client sends screenshots of their Google Business profile, mine them
  for: exact rating + review count, real reviews (name + text), the full service
  list, attributes (wheelchair access, payments, "appointments recommended"),
  and the brand logos they actually display.

Write the facts into the copy. Use the **real rating** (e.g. 4.7★ / 65 reviews),
never a fake 5.0.

---

## 2. Design language by industry (pick one, commit fully)

The theme is the differentiator. Choose a palette + type system that *is* the brand.

| Business vibe | Palette | Display font | Label/UI font | Body font |
|---|---|---|---|---|
| Classic/luxury auto, restoration | Parchment cream + British Racing Green + Rosso red + brass | Playfair Display | Oswald (signage caps) | Spectral |
| Modern/performance auto, detailing | Near-black + chrome silver + champagne gold | Cormorant Garamond | Inter | Inter |
| Trades (plumbing/electrical/HVAC) | White + bold primary (blue/orange) + slate | Sora / Outfit | Inter | Inter |
| Restaurant/café | Warm cream + terracotta/olive + ink | Fraunces / Cormorant | Inter | Inter |
| Salon/spa/clinic | Off-white + sage/blush + charcoal | Cormorant / Playfair | Inter | Inter |

**Token block** (CSS `:root`) — always define these so the whole site stays
cohesive and re-themeable:

```css
:root{
  --paper:#efe6d1; --paper2:#e7dbbf; --ink:#241f17; --ink2:#534b3c;
  --green:#163d2d; --green-d:#0e2a1e; --red:#962030;
  --brass:#b08a45; --brass-l:#d8b15a;
  --line:rgba(36,31,23,.22);
  --disp:'Playfair Display',Georgia,serif;
  --sign:'Oswald',sans-serif;
  --body:'Spectral',Georgia,serif;
  --maxw:1180px;
}
```

Texture & polish that read "premium": a faint SVG-noise paper grain overlay,
soft radial color glows behind the hero, double-rule borders, a tri-color
"racing stripe" accent, brass hairlines, and a hard offset box-shadow
(`box-shadow:6px 6px 0 var(--green)`) for a printed-poster feel.

---

## 3. Page architecture (section order)

A proven order for a local service business:

1. **Top bar** — one line: "Since YYYY · [tagline] · PHONE" (dark, small caps).
2. **Sticky nav** — logo + section links + phone CTA button + mobile hamburger.
3. **Hero** — full-bleed; either a cinematic photo backdrop (client's own photos,
   sepia-tinted + dark veil for legibility) or a themed illustration. Big serif
   headline, italic sub-headline accent, two CTAs (primary = Inquire/Book,
   secondary = Call), a credibility line.
4. **Stats band** — 3–4 numbers (years in business, year established, # of
   brands/marques, **real** star rating). Count-up on scroll.
5. **Logo/brand strip** — animated marquee of brands/products served (see §5).
6. **Services grid** — 6–9 cards with inline-SVG icons, numbered, hover lift.
   Use the client's *real* service descriptions when available.
7. **About / heritage** — split: story copy + a real photo of their work.
8. **Gallery** — filterable grid of the client's photos + lightbox (see §6).
9. **Inquiry / quote form** — vehicle/job details + photo upload (see §4). The
   single highest-leverage feature.
10. **Reviews** — real testimonials with names + a rating badge + "read all on
    Google" link.
11. **Visit / contact** — address, phone, hours, a styled map panel, directions.
12. **Final CTA band** + **footer**.

Wire the hero's primary button and nav to the inquiry section.

---

## 4. The inquiry/quote form (highest ROI feature)

This catches after-hours visitors, texters, and "is this something you even do?"
leads that never cold-call. For a niche shop, also add **photo upload** — it
qualifies the lead and gets the owner excited about the job.

**Fields:** name (req) · phone + email (require at least one) · the job specifics
(for auto: Year / Make / Model with a `<datalist>` of common makes so it's free-
text but guided) · service-type `<select>` · "describe your project" textarea
(req) · **drag-and-drop photo upload**.

**Make it work live with no backend → Netlify Forms:**

```html
<form name="quote" method="POST" data-netlify="true"
      netlify-honeypot="bot-field" enctype="multipart/form-data" action="?ok=1#inquiry">
  <input type="hidden" name="form-name" value="quote" />
  <p hidden><label>Leave empty: <input name="bot-field" /></label></p>
  <!-- fields … -->
  <input id="photos" name="photos" type="file" accept="image/*" multiple hidden />
</form>
```

Key facts learned:
- **File uploads to Netlify require a native form POST** (not AJAX). So don't
  `preventDefault` on a real host. Netlify captures the POST then redirects to
  `action` → detect `?ok=1` on load to show the success state.
- **Demo gracefully:** if `location.protocol === 'file:'`, `preventDefault()` and
  show the success message so it's demoable from the zip with no server.
- **Curate the file list with `DataTransfer`** so previews/remove work *and* the
  native submit sends exactly the chosen files:

```js
let store=new DataTransfer();
function ingest(list){
  for(const f of list){
    if(!f.type.startsWith('image/')) continue;
    if(f.size>12*1024*1024) continue;            // 12MB cap
    if([...store.files].some(x=>x.name===f.name&&x.size===f.size)) continue;
    if(store.items.length>=8) break;             // max 8
    store.items.add(f);
  }
  fileInput.files=store.files; renderThumbs();   // sync curated set to the input
}
// drag events: add .over class; on drop → ingest(e.dataTransfer.files)
// remove(i): rebuild DataTransfer without index i, reassign fileInput.files
```

Validate (name, phone-or-email, the job fields, message) before submit and show
friendly inline errors. After deploy, the client adds their email under
Netlify → Forms → Notifications. (Alternatives if not Netlify: Formspree,
FormSubmit.co.)

---

## 5. Brand/product logo strip

An infinite, two-row marquee that pauses on hover, with a shine-sweep on each
tile. Render tiles from a JS array so it's easy to edit.

```css
.track{display:flex;width:max-content;gap:24px}
.row1 .track{animation:scrollX 48s linear infinite}
.row2 .track{animation:scrollX 60s linear infinite reverse}
.marquee:hover .track{animation-play-state:paused}
@keyframes scrollX{from{transform:translateX(0)}to{transform:translateX(-50%)}}
/* duplicate the items array (arr.concat(arr)) so the -50% loop is seamless */
```

**Logos = the recurring IP trap.** Clients will insist on "real logos." The
honest, safe options, in order of preference:
1. **Client uploads an official logo pack** (brands publish press/media kits) →
   drop the files in `photos/` and `<img>` them. This is the only way to get the
   *exact* official marks, and it's the client's call to use them.
2. **Original stylized emblems** you author as inline SVG (geometric roundels,
   rings, stars, tridents, wordmarks in a serif). Legitimate as nominative "brands
   we service" marks; no copyrighted artwork reproduced. This is the default.

Do **not** download/recreate pixel-exact trademarked logos yourself. Keep
emblems monochrome (brass/cream) for cohesion; size them generously (~60px) so
the strip doesn't look sparse/"blank". Add the legal line: *"Marque names &
emblems shown to indicate vehicles serviced; [business] is an independent
specialist, not affiliated with any manufacturer."*

---

## 6. Gallery + lightbox

Filterable grid (chips per category) + a full lightbox. Drive everything from a
JS data object so adding photos is trivial.

```js
const GALLERY={ Ferrari:[{src:'photos/ferrari-01.jpeg',cap:'…'}], Jaguar:[…] };
// flatten to PHOTOS[] with a .brand tag; render grid; clicking a tile opens
// the lightbox at that index within the *current filter*.
```

Lightbox needs: prev/next, keyboard (←/→/Esc), swipe (touchstart/touchend
delta > 50px), a "3 / 14" counter, click-backdrop-to-close, and
`document.body.style.overflow='hidden'` while open. Add `loading="lazy"` and an
`onerror` fallback on every `<img>` so a missing file degrades gracefully.

---

## 7. Photos & IP guardrails (read before adding any image)

- **Only use images the client owns or has licensed.** Their phone snaps are
  perfect and unmistakably authentic (parking-lot shots, local plates).
- **Refuse press/marketing/stock photos** the client pastes from articles
  (tell-tale: studio light, staged bokeh, pristine locations). Explain the
  copyright risk plainly and offer: (a) use their own photos, (b) they grab a
  genuinely free image (Unsplash/Pexels/Pixabay — free for commercial use; *not*
  Getty/iStock/Shutterstock/Dreamstime), or (c) generate an original image.
- This environment often **blocks outbound downloads** (image hosts 403 even with
  the sandbox off) — you usually can't fetch a stock photo yourself. Have the
  client upload it instead (same flow they use for their own photos).

**Optimize every photo** before committing (raw phone shots are ~3–7 MB each):

```python
from PIL import Image, ImageOps   # pip install Pillow
im = ImageOps.exif_transpose(Image.open(f)).convert("RGB")   # bake rotation, drop EXIF
# resize so max(w,h)==1600, then:
im.save(f, "JPEG", quality=82, optimize=True, progressive=True)
```

Typical result: ~90 MB of phone photos → ~6 MB. Note: committing then
re-optimizing leaves the big blobs in git *history*; mention `git filter-repo`
if they want clones slimmed (only with explicit consent — it rewrites history).

---

## 8. Reusable interaction snippets

- **Scroll reveal:** `IntersectionObserver` toggling an `.in` class on `.reveal`
  elements (with `.d1/.d2/.d3` stagger delays). Unobserve after firing.
- **Count-up stats:** observe `[data-count]`, increment via `requestAnimationFrame`.
- **Sticky nav state:** toggle a `.scrolled` class past 30px scroll.
- **Mobile nav:** hamburger toggles an `.open` class; close on link click.
- **Cinematic hero:** stacked `.hb` divs with `background-image`, cross-fade via
  staggered `@keyframes` + a slow `scale()` Ken-Burns pan; a `.hero-veil`
  gradient over them for text legibility; light text with `text-shadow`. Honor
  `@media (prefers-reduced-motion:reduce)`.
- Always add `@media(prefers-reduced-motion:reduce)` to disable marquees/pans.

---

## 9. Deliverable & deploy workflow

- **Always send a zip of the whole folder** (HTML + `photos/`), because a lone
  `index.html` shows broken images without its `photos/` folder:
  ```python
  import shutil; shutil.make_archive('site','zip','.','sitefolder')
  ```
- **Deploy:** Netlify (drag-drop the folder, or connect the repo with publish dir
  = the site folder and **no build command**). Forms auto-detect on deploy.
  - Watch out: a repo-level `netlify.toml` configured for a *different* app will
    hijack/fail the build and serve a stale deploy. If the live site looks old,
    suspect this first; verify publish dir + "Clear cache and deploy".
- When a client says "nothing changed," check whether they're looking at a
  **stale deploy** vs. the committed code — confirm with `grep` on the file and
  re-send the zip so they can see the true current state.

## 10. Bonus deliverables

- **Sales/packages poster** (to upsell tiers of features): author an HTML poster,
  render to PDF with **WeasyPrint**, rasterize to a big PNG with **PyMuPDF**
  (`fitz`, `Matrix(5,5)` for print-res). Set a custom single tall `@page` size so
  it's one continuous poster, not paginated.
- **Feature-tier menu** for pricing conversations: Starter (one-pager) → Growth
  (+ lead capture + booking) → Pro (+ accounts/loyalty + online payments), with
  recurring revenue (hosting, SEO/ads, SMS credits, per-feature add-ons).

---

## Build checklist

- [ ] Researched real services, hours, address, phone, brands, reviews, rating
- [ ] Picked a committed theme (palette + 3 fonts) matching the business
- [ ] Single self-contained `index.html`; tokens in `:root`
- [ ] Hero, stats (real rating), brand strip, services, about, gallery, **inquiry
      form**, reviews, contact/map, CTA, footer
- [ ] Inquiry form: vehicle/job fields + photo upload, Netlify-wired, demo-safe
- [ ] Gallery + lightbox (keyboard + swipe + lazy + fallback)
- [ ] Only owned/licensed photos; all optimized to ~1600px / q82
- [ ] Stylized emblems OR client-supplied official logos — no bundled trademarks
- [ ] Real testimonials with names + rating badge + Google link
- [ ] Reduced-motion handled; mobile nav + responsive grids
- [ ] Zipped folder delivered; deploy notes (publish dir, notifications) given
