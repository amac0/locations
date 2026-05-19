# Locations — AttentionFeed Project Document

Use this document when adding the Locations project to the AttentionFeed website (attentionfeed.com).

## What the Project Is

**Locations** is a client-side web tool that processes Google Takeout Timeline.json files and CSV location data to create a colored world map of countries and states/provinces the user has visited. It also tracks visits against curated city checklists (world's largest cities, UNESCO heritage cities, and country capitals). All processing happens in the browser — no data is uploaded.

**Live URL:** https://locations.attentionfeed.com/
**Source:** https://github.com/amac0/locations

## Project Listing for attentionfeed.com

### For the projects page (attentionfeed.com/)

**Title:** Locations
**Status:** live
**One-liner:** Visualize your travel history with an interactive map of countries, states, and cities you've visited
**URL:** /projects/locations

### For the project detail page (/projects/locations)

**Title:** Locations
**Status:** live
**Visit link:** https://locations.attentionfeed.com/

**Introduction:**
Turn your Google location history into a visual travel record. Upload a Timeline.json export from Google Takeout or a CSV of your visits, and instantly see a colored world map of everywhere you've been — plus track your progress against bucket-list city checklists.

**What It Does:**
- Upload your Google Takeout Timeline.json or a CSV file with Date and Country columns (or both — data is merged)
- See a colored world map where visited countries are highlighted by recency (recent visits are darker)
- Toggle to a US/Canada view showing states and provinces you've visited
- Switch between recency-based coloring and simple visited/not-visited view
- Track your travel against curated city checklists: World's 50 Largest Cities, UNESCO World Heritage Cities, and Country Capitals
- City checklists switch to US/Canada-specific lists (Top 50 US/Canada cities, US/CA UNESCO sites, State/Province capitals) when in the US/Canada view
- Cities are detected from both CSV city names and Timeline.json GPS coordinates (proximity-based matching)

**Exports:**
- Download your map as SVG or PNG
- Download a JavaScript widget to embed the map on another page
- Download a consolidated CSV of all your visit data (deduplicated)
- Upload additional files at any time — data accumulates

**Privacy:**
All processing happens entirely in your browser. Your location data is never uploaded to any server. The tool loads map boundary data (country and state polygons) from the site itself, and everything else runs client-side in JavaScript.

**How to Get Your Data:**
1. Open Google Maps on your phone
2. Go to Settings → Personal content → Export Timeline data
3. Download the resulting Timeline.json file
4. Or prepare a CSV with "Date" and "Country" columns (optionally "City" and "State/Zip")

**Feedback:**
Email feedback to [your email].

## Design System Integration

The tool uses the standard AttentionFeed shared assets:
- `shared.css` — provides CSS custom properties, typography (Baloo 2, Inter, IBM Plex Mono), color palette (burgundy primary #6e1423), reset styles
- `shared.js` — provides `<af-header>` and `<af-footer>` web components with Shadow DOM

The header is configured as:
```html
<af-header project-name="Locations" project-url="."></af-header>
<af-footer></af-footer>
```

The app uses its own CSS variables for internal styling (--app-primary, --app-border, etc.) that are tuned to work with the shared design system but don't conflict with it.

## Technical Notes

- **Hosting:** GitHub Pages from amac0/locations repo, main branch
- **Custom domain:** CNAME record `locations` → `amac0.github.io` on Squarespace DNS
- **SSL:** Let's Encrypt via GitHub Pages, HTTPS enforced
- **No build step:** The site is plain HTML + JS modules served directly — no bundler, no framework
- **Dependencies (CDN):** D3.js v7, TopoJSON Client v3
- **Bundled data files:** world-110m.json (~105KB), us-states-10m.json (~114KB), ca-provinces.json (~75KB)
- **Test suite:** 121+ tests using Node.js built-in test runner

## Color Scheme

| Element | Color | Notes |
|---|---|---|
| Visited countries (recency) | `#6e1423` at varying opacity | Burgundy, matching AF brand |
| Visited countries (binary) | `#8b1a2b` | Slightly lighter for border visibility |
| Unvisited | `#ffffff` | White |
| Country/state borders | `#000000` at 0.4px | Black |
| Ocean | `#eff6ff` | Very light blue |
| Map background | `#eff6ff` with 8px border-radius | |

## Supported Input Formats

**Timeline.json (Google Takeout):**
- Post-2024 format with `semanticSegments` array
- Extracts coordinates from `visit` and `activity` segments
- Skips `timelinePath` segments (avoids flight path noise)

**CSV:**
- Requires `Date` and `Country` columns (case-insensitive)
- Optionally: `City`, `State/Zip`, `Address` columns
- Date formats: ISO 8601, m/yyyy, mm/dd/yyyy, m/d/yyyy, bare year (2017)
- Country names normalized: USA, UK, England, Czech Republic, etc. all mapped to canonical forms
- State extraction: handles "CA 94128", "DC 20008", "BC V6Z", full names, "Washington DC"
