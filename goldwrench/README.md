# Gold Wrench Automotive — Website

A single-page marketing website for **Gold Wrench Automotive**, an honest, fair-priced
auto repair shop in North Vancouver, BC.

## Business details

| | |
|---|---|
| **Name** | Gold Wrench Automotive |
| **Address** | 248 Esplanade East, North Vancouver, BC V7L 1A3 |
| **Phone** | (604) 990-9936 |
| **Hours** | Mon–Fri 8:00 AM – 5:00 PM · Closed weekends |

## Run it

It's a single, self-contained static file — no build step.

```
open goldwrench/index.html      # macOS
# or just double-click the file
```

To serve locally:

```
cd goldwrench && python3 -m http.server 8080
# then visit http://localhost:8080
```

## What's inside

- `index.html` — the entire site (HTML + CSS + a little JS, all inline)
- `images/` — the shop's real photos:
  - `sign.jpeg` — Gold Wrench Automotive sign (featured in the hero card)
  - `storefront.jpeg` — shop exterior, unit 108 (hero/social image + gallery)
  - `bay-x6.jpeg` / `bay-335i.jpeg` — cars on the lifts (gallery)

## Features

- Responsive, mobile-friendly dark/gold "industrial" design fitting the shop's name
- Sticky nav with mobile hamburger menu
- Hero, Services, Why Us, **Our Shop photo gallery**, Reviews, and Hours/Location sections
- Real shop photos throughout (sign in the hero, gallery of the storefront and service bay)
- Live **"Open now / Closed"** indicator and today's-hours highlighting (computed in the browser)
- Embedded Google Map + one-tap **Call** and **Directions** links
- LocalBusiness (`AutoRepair`) JSON-LD structured data + Open Graph tags for SEO

## Notes

Business hours are shown as standard Mon–Fri 8–5 with a "call ahead to confirm"
note. Update them in `index.html` (the `#hoursTable` rows and the JSON-LD block)
if the shop confirms different hours. Review quotes are representative summaries of
public feedback; swap in verbatim Google reviews once collected.
