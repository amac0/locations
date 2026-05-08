# Country Visit Map — Design Spec

Client-side web tool that processes a Google Takeout Timeline.json file and renders a colored world map showing countries visited, with color intensity indicating recency.

## Architecture

Single-page client-side web app following the AttentionFeed pattern (like booklist.attentionfeed.com):
- One HTML file with inline CSS and JS
- AttentionFeed shared assets (shared.css, shared.js for `<af-header>` web component)
- D3.js + TopoJSON client library loaded from CDN
- Bundled Natural Earth 110m world boundaries TopoJSON (~150KB separate file)
- All processing happens in the browser. No server, no data uploaded anywhere.

## User Flow

1. User lands on page, sees drag-and-drop upload zone (same pattern as booklist)
2. User drops or selects a Timeline.json file
3. App parses the JSON, extracts lat/lng coordinates from semantic segments
4. Each coordinate is matched to a country via point-in-polygon lookup against bundled boundaries
5. Colored world map renders: visited countries colored by recency, unvisited countries grey
6. Stats displayed: total countries visited, date range of location data
7. Hover tooltip on each visited country shows: country name, most recent visit date, total visit count

## Input Format

Raw Timeline.json file from Google Takeout (the post-2024 on-device export format).

### Data Extraction

Extract coordinates from two segment types within `semanticSegments`:

- **visit segments**: `visit.topCandidate.placeLocation.latLng` (format: `"51.529422°, -0.1804909°"`)
- **activity segments**: `activity.start.latLng` and `activity.end.latLng` (same format)

timelinePath segments are excluded to avoid marking countries only traversed by flight path GPS.

### Coordinate Parsing

The latLng strings use degree notation: `"51.529422°, -0.1804909°"`. Parse by stripping the degree symbol and splitting on comma.

### Coordinate-to-Country Mapping

Client-side point-in-polygon lookup using Natural Earth 110m TopoJSON boundaries. For each extracted coordinate, determine which country polygon contains the point. Coordinates that fall in oceans or don't match any polygon are discarded.

### Aggregation

Build a map of `{ countryName -> { firstVisit: Date, lastVisit: Date, visitCount: number } }` from all matched coordinates. Timestamps come from the segment's `startTime` field.

## Map Rendering

- **Library**: D3.js for SVG rendering, TopoJSON client for decoding boundary data
- **Projection**: Natural Earth projection (purpose-built for world maps)
- **Color scale**: Single-hue indigo gradient using AttentionFeed primary color (#6366f1). Full opacity for visits this year, fading to ~20% opacity for the oldest visits. Unvisited countries: #e5e7eb (light grey).
- **Interactivity**: Hover highlights country border, tooltip shows country name + last visit date + visit count
- **Responsive**: SVG uses viewBox to scale to container width
- **Legend**: Gradient bar showing "Recent" to "Long ago" plus grey swatch for "Not visited"

## Stats Display

Above or below the map, show:
- Total countries visited (e.g., "23 countries visited")
- Date range of data (e.g., "Aug 2025 - May 2026")

## File Structure

```
locations/
  index.html          # The app (HTML + inline CSS + JS)
  world-110m.json     # Natural Earth 110m TopoJSON boundaries
```

## Dependencies (CDN)

- D3.js (d3-geo, d3-selection, d3-scale)
- TopoJSON client (topojson-client)

## Out of Scope

- No login or accounts
- No server-side processing
- No data persistence (refresh = re-upload)
- No export functionality
- No support for old Records.json or Location History.json formats
- No support for zip files (raw Timeline.json only)
