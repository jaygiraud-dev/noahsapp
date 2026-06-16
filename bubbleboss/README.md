# BubbleBoss Detailing — Website

A single-page website for **BubbleBoss Detailing**, a mobile auto detailing
service in North Vancouver, BC.

Built from the business poster: same black/gold/red branding, fonts
(Bebas Neue + Barlow), packages, prices and contact info.

## What's here

- `index.html` — the entire site (self-contained, no build step, no
  dependencies beyond Google Fonts loaded over the network).

## Sections

- Hero + "Why BubbleBoss?" card
- Car packages (Exterior Wash, Exterior + Basic Interior,
  Exterior + Interior + Vacuum, Premium Detail)
- Truck / large vehicle "Everything Package"
- Full Wax add-on
- How It Works (Call → We Come To You → Ride Shines)
- About (two friends, North Van local)
- Contact: 604 968 9530 · 778 918 3161 · [@bubbleboss1](https://instagram.com/bubbleboss1)

## How to view it

Just open `index.html` in any browser — double-click the file, done.

## How to put it online (free options)

1. **Netlify Drop** — go to https://app.netlify.com/drop and drag this
   `bubbleboss` folder onto the page. You get a live URL in seconds.
2. **GitHub Pages** — push to GitHub, then enable Pages on this folder.
3. Any web host — upload `index.html`.

## Editing

Everything is in `index.html`. To change prices, package details or phone
numbers, search for the text in the file and edit it directly. Colours live
in the `:root { ... }` block near the top of the `<style>` section.
