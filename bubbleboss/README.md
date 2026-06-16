# BubbleBoss Detailing — Website

A single-page website for **BubbleBoss Detailing**, a mobile auto detailing
service in North Vancouver, BC. Built from the business poster, using your
own real photos and videos.

## What's here

```
bubbleboss/
├── index.html        ← the whole site (open this)
├── img/              ← optimized photos + video poster frames
│   ├── hero.jpg          (black VW — hero background)
│   ├── car-vw.jpg        (black VW — gallery)
│   ├── poster-v1.jpg     (green BMW M4 — video thumbnail)
│   ├── foam-wash.jpg     (foam bath — video thumbnail)
│   └── black-camaro.jpg  (Camaro — gallery)
└── media/            ← web-compressed videos (from 40MB → ~7MB total)
    ├── wash-m4.mp4
    └── wash-foam.mp4
```

## Sections

- Top **$10-off** offer banner (new customers)
- Sticky nav + hero with a real photo background
- **Our Work** gallery — 2 photos + 2 tap-to-play videos (lightbox)
- Car packages, truck package, full-wax add-on — each with a "Book This" button
- How It Works (Call → We Come To You → Ride Shines)
- Why BubbleBoss (value props)
- Service Area (North Shore pills)
- FAQ (collapsible)
- Contact: 604 968 9530 · 778 918 3161 · @bubbleboss1
- Sticky mobile bar (Call / Text / DM) + LocalBusiness SEO data

## View it

Open `index.html` in any browser — double-click it.

## Put it online (free)

1. **Netlify Drop** — https://app.netlify.com/drop → drag the `bubbleboss`
   folder on. Live URL in seconds (videos + images included).
2. **GitHub Pages** — push, then enable Pages on this folder.

## Editing

Everything is in `index.html`. Prices, phone numbers and text are plain
HTML — search and edit. Colours are in the `:root { ... }` block at the top
of `<style>`. To swap a gallery photo, drop a new file in `img/` and update
the matching `<img src="...">`.

### Things to confirm / customize
- **Instagram handle:** the poster says `@bubbleboss1` but your videos are
  watermarked `@bubblebosswashing1`. The site currently uses `@bubbleboss1`
  everywhere — change it if the other one is correct.
- **"$10 off first detail"** offer — remove the top banner + FAQ entry if you
  don't want to run it.
- **"Exterior + Basic Interior"** was listed at $10–15 on the poster (below
  the $25 wash, looked like a typo) — set to **$35** here. Adjust if needed.
