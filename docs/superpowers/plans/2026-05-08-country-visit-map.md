# Country Visit Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a client-side web tool that processes Google Takeout Timeline.json and renders a colored world map of countries visited.

**Architecture:** Single-page app following the AttentionFeed pattern. Pure business logic (JSON parsing, coordinate extraction, point-in-polygon country lookup) lives in a separate JS file for testability. Rendering logic (D3 map, upload zone, tooltips) lives inline in index.html. Natural Earth 110m TopoJSON provides country boundaries.

**Tech Stack:** D3.js v7 (CDN), TopoJSON Client v3 (CDN), Node.js built-in test runner for tests, AttentionFeed shared.css/shared.js for branding.

---

## File Structure

```
locations/
  index.html              # Page structure, CSS, D3 rendering, upload zone
  locations.js            # Pure functions: parseTimeline(), parseLatLng(), lookupCountry()
  world-110m.json         # Natural Earth 110m country boundaries (TopoJSON)
  shared.css              # AttentionFeed shared styles (copy from booklist)
  shared.js               # AttentionFeed shared web components (copy from booklist)
  test/
    parser.test.js        # Unit tests for Timeline.json parsing
    geo.test.js           # Unit tests for point-in-polygon country lookup
    integration.test.js   # Integration test: full pipeline from JSON to country map
    e2e.test.js           # E2E test: loads index.html, uploads file, checks map renders
    fixtures/
      small-timeline.json # Minimal Timeline.json with known countries for testing
```

---

### Task 1: Project Setup

**Files:**
- Create: `.gitignore`
- Download: `world-110m.json`
- Copy: `shared.css`, `shared.js`

- [ ] **Step 1: Update .gitignore**

Read the existing `.gitignore`, then update it to include data files and build artifacts:

```
# Data files - do not commit user location data
Timeline.json
takeout-*.zip

# Dependencies
node_modules/

# Reference files
Attention Feed_ Booklist.html
Attention Feed_ Booklist_files/

# Superpowers
.superpowers/

# OS
.DS_Store

# Editor
*.swp
*.swo
```

- [ ] **Step 2: Download world-110m.json**

```bash
curl -o world-110m.json https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json
```

This file is ~240KB. It contains country polygons as TopoJSON with `countries` and `land` objects. Each country has a numeric ID matching ISO 3166-1 numeric codes.

- [ ] **Step 3: Copy shared assets from booklist reference**

```bash
cp "Attention Feed_ Booklist_files/shared.css" shared.css
cp "Attention Feed_ Booklist_files/shared.js" shared.js
```

- [ ] **Step 4: Create test fixtures directory and small-timeline.json**

Create `test/fixtures/small-timeline.json` with segments hitting 3 known countries (UK, France, USA):

```json
{
  "semanticSegments": [
    {
      "startTime": "2025-09-01T10:00:00.000+01:00",
      "endTime": "2025-09-01T12:00:00.000+01:00",
      "startTimeTimezoneUtcOffsetMinutes": 60,
      "endTimeTimezoneUtcOffsetMinutes": 60,
      "visit": {
        "hierarchyLevel": 0,
        "probability": 0.9,
        "topCandidate": {
          "placeId": "ChIJdd4hrwug2EcRmSrV3Vo6llI",
          "semanticType": "UNKNOWN",
          "probability": 0.9,
          "placeLocation": {
            "latLng": "51.5074°, -0.1278°"
          }
        }
      }
    },
    {
      "startTime": "2025-09-05T14:00:00.000+02:00",
      "endTime": "2025-09-05T16:00:00.000+02:00",
      "startTimeTimezoneUtcOffsetMinutes": 120,
      "endTimeTimezoneUtcOffsetMinutes": 120,
      "visit": {
        "hierarchyLevel": 0,
        "probability": 0.85,
        "topCandidate": {
          "placeId": "ChIJD7fiBh9u5kcRYJSMaMOCCwQ",
          "semanticType": "UNKNOWN",
          "probability": 0.85,
          "placeLocation": {
            "latLng": "48.8566°, 2.3522°"
          }
        }
      }
    },
    {
      "startTime": "2025-10-10T09:00:00.000-04:00",
      "endTime": "2025-10-10T09:30:00.000-04:00",
      "startTimeTimezoneUtcOffsetMinutes": -240,
      "endTimeTimezoneUtcOffsetMinutes": -240,
      "activity": {
        "start": {
          "latLng": "40.7128°, -74.0060°"
        },
        "end": {
          "latLng": "40.7580°, -73.9855°"
        },
        "distanceMeters": 5500,
        "probability": 0.95,
        "topCandidate": {
          "type": "IN_SUBWAY",
          "probability": 0.8
        }
      }
    },
    {
      "startTime": "2025-08-29T11:00:00.000+01:00",
      "endTime": "2025-08-29T13:00:00.000+01:00",
      "timelinePath": [
        {
          "point": "51.5291535°, -0.179714°",
          "time": "2025-08-29T11:42:00.000+01:00"
        }
      ]
    },
    {
      "startTime": "2025-12-01T10:00:00.000+01:00",
      "endTime": "2025-12-01T12:00:00.000+01:00",
      "startTimeTimezoneUtcOffsetMinutes": 60,
      "endTimeTimezoneUtcOffsetMinutes": 60,
      "visit": {
        "hierarchyLevel": 0,
        "probability": 0.9,
        "topCandidate": {
          "placeId": "ChIJdd4hrwug2EcRmSrV3Vo6llI",
          "semanticType": "UNKNOWN",
          "probability": 0.9,
          "placeLocation": {
            "latLng": "51.5074°, -0.1278°"
          }
        }
      }
    }
  ]
}
```

This fixture has: 2 UK visits (Sept + Dec 2025), 1 France visit, 1 USA activity, 1 timelinePath (should be skipped). The UK visit in Dec is more recent than Sept, so we can test lastVisit tracking.

- [ ] **Step 5: Commit**

```bash
git add .gitignore world-110m.json shared.css shared.js test/fixtures/small-timeline.json
git commit -m "chore: project setup with world boundaries, shared assets, and test fixtures"
```

---

### Task 2: Coordinate Parsing — Tests

**Files:**
- Create: `test/parser.test.js`

- [ ] **Step 1: Write failing tests for parseLatLng()**

Create `test/parser.test.js`:

```javascript
// ABOUTME: Unit tests for Timeline.json parsing functions.
// ABOUTME: Tests coordinate extraction from visit and activity segments.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseLatLng, extractCoordinates } from '../locations.js';

describe('parseLatLng', () => {
  it('parses degree notation with positive values', () => {
    const result = parseLatLng('48.8566°, 2.3522°');
    assert.deepStrictEqual(result, { lat: 48.8566, lng: 2.3522 });
  });

  it('parses degree notation with negative longitude', () => {
    const result = parseLatLng('51.5074°, -0.1278°');
    assert.deepStrictEqual(result, { lat: 51.5074, lng: -0.1278 });
  });

  it('parses degree notation with negative latitude', () => {
    const result = parseLatLng('-33.8688°, 151.2093°');
    assert.deepStrictEqual(result, { lat: -33.8688, lng: 151.2093 });
  });

  it('returns null for empty string', () => {
    const result = parseLatLng('');
    assert.strictEqual(result, null);
  });

  it('returns null for malformed input', () => {
    const result = parseLatLng('not a coordinate');
    assert.strictEqual(result, null);
  });
});

describe('extractCoordinates', () => {
  it('extracts coordinates from visit segments', () => {
    const data = {
      semanticSegments: [{
        startTime: '2025-09-01T10:00:00.000+01:00',
        visit: {
          topCandidate: {
            placeLocation: { latLng: '51.5074°, -0.1278°' }
          }
        }
      }]
    };
    const coords = extractCoordinates(data);
    assert.strictEqual(coords.length, 1);
    assert.deepStrictEqual(coords[0].lat, 51.5074);
    assert.deepStrictEqual(coords[0].lng, -0.1278);
    assert.strictEqual(coords[0].time, '2025-09-01T10:00:00.000+01:00');
  });

  it('extracts start and end from activity segments', () => {
    const data = {
      semanticSegments: [{
        startTime: '2025-10-10T09:00:00.000-04:00',
        activity: {
          start: { latLng: '40.7128°, -74.0060°' },
          end: { latLng: '40.7580°, -73.9855°' }
        }
      }]
    };
    const coords = extractCoordinates(data);
    assert.strictEqual(coords.length, 2);
    assert.deepStrictEqual(coords[0].lat, 40.7128);
    assert.deepStrictEqual(coords[1].lat, 40.758);
  });

  it('skips timelinePath segments', () => {
    const data = {
      semanticSegments: [{
        startTime: '2025-08-29T11:00:00.000+01:00',
        timelinePath: [
          { point: '51.5291535°, -0.179714°', time: '2025-08-29T11:42:00.000+01:00' }
        ]
      }]
    };
    const coords = extractCoordinates(data);
    assert.strictEqual(coords.length, 0);
  });

  it('skips segments with missing placeLocation', () => {
    const data = {
      semanticSegments: [{
        startTime: '2025-09-01T10:00:00.000+01:00',
        visit: {
          topCandidate: {
            placeId: 'abc'
          }
        }
      }]
    };
    const coords = extractCoordinates(data);
    assert.strictEqual(coords.length, 0);
  });

  it('handles empty semanticSegments', () => {
    const coords = extractCoordinates({ semanticSegments: [] });
    assert.strictEqual(coords.length, 0);
  });

  it('handles missing semanticSegments key', () => {
    const coords = extractCoordinates({});
    assert.strictEqual(coords.length, 0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
node --experimental-vm-modules --test test/parser.test.js
```

Expected: FAIL — `locations.js` does not exist yet.

- [ ] **Step 3: Commit failing tests**

```bash
git add test/parser.test.js
git commit -m "test: add failing unit tests for Timeline.json coordinate parsing"
```

---

### Task 3: Coordinate Parsing — Implementation

**Files:**
- Create: `locations.js`

- [ ] **Step 1: Implement parseLatLng() and extractCoordinates()**

Create `locations.js`:

```javascript
// ABOUTME: Pure functions for processing Google Takeout Timeline.json data.
// ABOUTME: Extracts coordinates from visit/activity segments and looks up countries.

/**
 * Parse a Google Timeline latLng string like "51.5074°, -0.1278°"
 * into { lat, lng } or null if unparseable.
 */
export function parseLatLng(str) {
  if (!str || typeof str !== 'string') return null;
  const parts = str.replace(/°/g, '').split(',').map(s => s.trim());
  if (parts.length !== 2) return null;
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng };
}

/**
 * Extract { lat, lng, time } objects from a parsed Timeline.json object.
 * Reads visit segments (placeLocation) and activity segments (start/end).
 * Skips timelinePath segments.
 */
export function extractCoordinates(data) {
  const segments = data.semanticSegments || [];
  const coords = [];

  for (const seg of segments) {
    if (seg.visit) {
      const latLng = seg.visit.topCandidate?.placeLocation?.latLng;
      const parsed = parseLatLng(latLng);
      if (parsed) {
        coords.push({ ...parsed, time: seg.startTime });
      }
    } else if (seg.activity) {
      const startParsed = parseLatLng(seg.activity.start?.latLng);
      if (startParsed) {
        coords.push({ ...startParsed, time: seg.startTime });
      }
      const endParsed = parseLatLng(seg.activity.end?.latLng);
      if (endParsed) {
        coords.push({ ...endParsed, time: seg.startTime });
      }
    }
    // timelinePath segments are intentionally skipped
  }

  return coords;
}
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
node --experimental-vm-modules --test test/parser.test.js
```

Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add locations.js
git commit -m "feat: implement Timeline.json coordinate parsing"
```

---

### Task 4: Country Lookup — Tests

**Files:**
- Create: `test/geo.test.js`

The country lookup uses TopoJSON + D3-geo for point-in-polygon. Since D3 and TopoJSON are browser CDN libraries, we need to load them in Node for testing. We'll use dynamic `import()` from CDN via `node --experimental-network-imports` or download them locally for testing.

The simpler approach: download the ESM builds for testing.

- [ ] **Step 1: Download D3-geo and TopoJSON client for Node testing**

```bash
npm init -y
npm install --save-dev d3-geo topojson-client
```

The `package.json` needs `"type": "module"` for ES module imports.

After `npm init -y`, edit `package.json` to add `"type": "module"` and the test script:

The resulting `package.json` should contain:

```json
{
  "name": "locations",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "node --test test/*.test.js"
  },
  "devDependencies": {
    "d3-geo": "^3.1.1",
    "topojson-client": "^3.1.0"
  }
}
```

- [ ] **Step 2: Write failing tests for lookupCountry() and buildCountryMap()**

Create `test/geo.test.js`:

```javascript
// ABOUTME: Unit tests for point-in-polygon country lookup.
// ABOUTME: Verifies that coordinates map to correct country names.

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lookupCountry, buildCountryMap } from '../locations.js';

/* Country name lookup table: ISO 3166-1 numeric -> country name.
   The world-110m.json uses numeric IDs. We need to load the lookup. */

let geoData;
before(() => {
  const worldJson = JSON.parse(
    readFileSync(new URL('../world-110m.json', import.meta.url), 'utf-8')
  );
  geoData = worldJson;
});

describe('lookupCountry', () => {
  it('identifies London as United Kingdom', () => {
    const country = lookupCountry(51.5074, -0.1278, geoData);
    assert.strictEqual(country, 'United Kingdom');
  });

  it('identifies Paris as France', () => {
    const country = lookupCountry(48.8566, 2.3522, geoData);
    assert.strictEqual(country, 'France');
  });

  it('identifies New York as United States of America', () => {
    const country = lookupCountry(40.7128, -74.006, geoData);
    assert.strictEqual(country, 'United States of America');
  });

  it('identifies Tokyo as Japan', () => {
    const country = lookupCountry(35.6762, 139.6503, geoData);
    assert.strictEqual(country, 'Japan');
  });

  it('returns null for ocean coordinates', () => {
    const country = lookupCountry(0, -30, geoData);
    assert.strictEqual(country, null);
  });
});

describe('buildCountryMap', () => {
  it('aggregates visit data by country', () => {
    const coords = [
      { lat: 51.5074, lng: -0.1278, time: '2025-09-01T10:00:00.000+01:00' },
      { lat: 48.8566, lng: 2.3522, time: '2025-09-05T14:00:00.000+02:00' },
      { lat: 51.5074, lng: -0.1278, time: '2025-12-01T10:00:00.000+01:00' },
    ];
    const map = buildCountryMap(coords, geoData);

    assert.strictEqual(map.get('United Kingdom').visitCount, 2);
    assert.strictEqual(map.get('France').visitCount, 1);
    assert.deepStrictEqual(
      map.get('United Kingdom').firstVisit,
      new Date('2025-09-01T10:00:00.000+01:00')
    );
    assert.deepStrictEqual(
      map.get('United Kingdom').lastVisit,
      new Date('2025-12-01T10:00:00.000+01:00')
    );
  });

  it('skips coordinates that fall in the ocean', () => {
    const coords = [
      { lat: 0, lng: -30, time: '2025-01-01T00:00:00.000Z' },
    ];
    const map = buildCountryMap(coords, geoData);
    assert.strictEqual(map.size, 0);
  });

  it('handles empty coordinate list', () => {
    const map = buildCountryMap([], geoData);
    assert.strictEqual(map.size, 0);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL — `lookupCountry` and `buildCountryMap` are not exported from `locations.js` yet.

- [ ] **Step 4: Commit failing tests**

```bash
git add test/geo.test.js package.json
git commit -m "test: add failing unit tests for country lookup"
```

---

### Task 5: Country Lookup — Implementation

**Files:**
- Modify: `locations.js`

- [ ] **Step 1: Add lookupCountry() and buildCountryMap() to locations.js**

Append to `locations.js`, after the existing functions. The `lookupCountry` function needs `d3-geo` for `geoContains` and `topojson-client` for feature extraction. In the browser, these come from CDN globals. In Node tests, they come from npm packages. Use a conditional import pattern:

```javascript
import * as topojsonClient from 'topojson-client';
import { geoContains } from 'd3-geo';

/* ISO 3166-1 numeric code -> country name mapping.
   The world-110m.json uses these numeric IDs for each country feature. */
export const COUNTRY_NAMES = {
  '004': 'Afghanistan', '008': 'Albania', '012': 'Algeria', '016': 'American Samoa',
  '020': 'Andorra', '024': 'Angola', '028': 'Antigua and Barbuda', '032': 'Argentina',
  '036': 'Australia', '040': 'Austria', '044': 'Bahamas', '048': 'Bahrain',
  '050': 'Bangladesh', '052': 'Barbados', '056': 'Belgium', '060': 'Bermuda',
  '064': 'Bhutan', '068': 'Bolivia', '070': 'Bosnia and Herzegovina',
  '072': 'Botswana', '076': 'Brazil', '084': 'Belize', '090': 'Solomon Islands',
  '096': 'Brunei', '100': 'Bulgaria', '104': 'Myanmar', '108': 'Burundi',
  '112': 'Belarus', '116': 'Cambodia', '120': 'Cameroon', '124': 'Canada',
  '132': 'Cabo Verde', '140': 'Central African Republic', '144': 'Sri Lanka',
  '148': 'Chad', '152': 'Chile', '156': 'China', '158': 'Taiwan',
  '170': 'Colombia', '174': 'Comoros', '178': 'Congo', '180': 'Dem. Rep. Congo',
  '188': 'Costa Rica', '191': 'Croatia', '192': 'Cuba', '196': 'Cyprus',
  '203': 'Czechia', '204': 'Benin', '208': 'Denmark', '212': 'Dominica',
  '214': 'Dominican Republic', '218': 'Ecuador', '222': 'El Salvador',
  '226': 'Equatorial Guinea', '231': 'Ethiopia', '232': 'Eritrea',
  '233': 'Estonia', '242': 'Fiji', '246': 'Finland', '250': 'France',
  '260': 'French Southern Territories', '262': 'Djibouti', '266': 'Gabon',
  '268': 'Georgia', '270': 'Gambia', '275': 'Palestine', '276': 'Germany',
  '288': 'Ghana', '296': 'Kiribati', '300': 'Greece', '304': 'Greenland',
  '308': 'Grenada', '320': 'Guatemala', '324': 'Guinea', '328': 'Guyana',
  '332': 'Haiti', '340': 'Honduras', '348': 'Hungary', '352': 'Iceland',
  '356': 'India', '360': 'Indonesia', '364': 'Iran', '368': 'Iraq',
  '372': 'Ireland', '376': 'Israel', '380': 'Italy', '384': "Cote d'Ivoire",
  '388': 'Jamaica', '392': 'Japan', '398': 'Kazakhstan', '400': 'Jordan',
  '404': 'Kenya', '408': 'North Korea', '410': 'South Korea', '414': 'Kuwait',
  '417': 'Kyrgyzstan', '418': 'Laos', '422': 'Lebanon', '426': 'Lesotho',
  '428': 'Latvia', '430': 'Liberia', '434': 'Libya', '438': 'Liechtenstein',
  '440': 'Lithuania', '442': 'Luxembourg', '450': 'Madagascar', '454': 'Malawi',
  '458': 'Malaysia', '462': 'Maldives', '466': 'Mali', '470': 'Malta',
  '478': 'Mauritania', '480': 'Mauritius', '484': 'Mexico', '492': 'Monaco',
  '496': 'Mongolia', '498': 'Moldova', '499': 'Montenegro', '504': 'Morocco',
  '508': 'Mozambique', '512': 'Oman', '516': 'Namibia', '520': 'Nauru',
  '524': 'Nepal', '528': 'Netherlands', '540': 'New Caledonia',
  '548': 'Vanuatu', '554': 'New Zealand', '558': 'Nicaragua', '562': 'Niger',
  '566': 'Nigeria', '570': 'Niue', '578': 'Norway', '583': 'Micronesia',
  '584': 'Marshall Islands', '585': 'Palau', '586': 'Pakistan', '591': 'Panama',
  '598': 'Papua New Guinea', '600': 'Paraguay', '604': 'Peru',
  '608': 'Philippines', '616': 'Poland', '620': 'Portugal', '624': 'Guinea-Bissau',
  '626': 'Timor-Leste', '630': 'Puerto Rico', '634': 'Qatar',
  '642': 'Romania', '643': 'Russia', '646': 'Rwanda',
  '654': 'Saint Helena', '659': 'Saint Kitts and Nevis',
  '662': 'Saint Lucia', '670': 'Saint Vincent and the Grenadines',
  '674': 'San Marino', '678': 'Sao Tome and Principe', '682': 'Saudi Arabia',
  '686': 'Senegal', '688': 'Serbia', '690': 'Seychelles', '694': 'Sierra Leone',
  '702': 'Singapore', '703': 'Slovakia', '704': 'Vietnam', '705': 'Slovenia',
  '706': 'Somalia', '710': 'South Africa', '716': 'Zimbabwe', '720': 'South Sudan',
  '724': 'Spain', '728': 'South Sudan', '729': 'Sudan', '732': 'Western Sahara',
  '740': 'Suriname', '748': 'Eswatini', '752': 'Sweden', '756': 'Switzerland',
  '760': 'Syria', '762': 'Tajikistan', '764': 'Thailand', '768': 'Togo',
  '776': 'Tonga', '780': 'Trinidad and Tobago', '784': 'United Arab Emirates',
  '788': 'Tunisia', '792': 'Turkey', '795': 'Turkmenistan', '798': 'Tuvalu',
  '800': 'Uganda', '804': 'Ukraine', '807': 'North Macedonia',
  '818': 'Egypt', '826': 'United Kingdom', '834': 'Tanzania',
  '840': 'United States of America', '854': 'Burkina Faso', '858': 'Uruguay',
  '860': 'Uzbekistan', '862': 'Venezuela', '876': 'Wallis and Futuna',
  '882': 'Samoa', '887': 'Yemen', '894': 'Zambia',
  '-99': 'Northern Cyprus', '010': 'Antarctica'
};

/**
 * Look up which country a lat/lng coordinate falls in.
 * Returns the country name string, or null if not found (e.g., ocean).
 *
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {object} worldTopo - Parsed world-110m.json TopoJSON object
 * @returns {string|null} Country name or null
 */
export function lookupCountry(lat, lng, worldTopo) {
  const countries = topojsonClient.feature(worldTopo, worldTopo.objects.countries);
  for (const feature of countries.features) {
    if (geoContains(feature, [lng, lat])) {
      return COUNTRY_NAMES[feature.id] || `Unknown (${feature.id})`;
    }
  }
  return null;
}

/**
 * Build a Map of country -> { firstVisit, lastVisit, visitCount } from coordinates.
 *
 * @param {Array<{lat: number, lng: number, time: string}>} coords
 * @param {object} worldTopo - Parsed world-110m.json TopoJSON object
 * @returns {Map<string, {firstVisit: Date, lastVisit: Date, visitCount: number}>}
 */
export function buildCountryMap(coords, worldTopo) {
  const countryMap = new Map();

  for (const coord of coords) {
    const country = lookupCountry(coord.lat, coord.lng, worldTopo);
    if (!country) continue;

    const time = new Date(coord.time);
    if (countryMap.has(country)) {
      const entry = countryMap.get(country);
      entry.visitCount++;
      if (time < entry.firstVisit) entry.firstVisit = time;
      if (time > entry.lastVisit) entry.lastVisit = time;
    } else {
      countryMap.set(country, {
        firstVisit: time,
        lastVisit: time,
        visitCount: 1,
      });
    }
  }

  return countryMap;
}
```

**Important:** The `import` statements at the top of `locations.js` work in Node (from `node_modules`) and will be replaced by global references when loaded in the browser via CDN `<script>` tags. To handle both environments, use a conditional pattern at the top of the file:

Replace the bare imports with:

```javascript
let topojsonClient, geoContains;
if (typeof window !== 'undefined') {
  // Browser: loaded via CDN <script> tags as globals
  topojsonClient = window.topojson;
  geoContains = window.d3.geoContains;
} else {
  // Node: import from npm packages for testing
  const topojsonMod = await import('topojson-client');
  const d3Mod = await import('d3-geo');
  topojsonClient = topojsonMod;
  geoContains = d3Mod.geoContains;
}
```

This must be placed at the top of `locations.js`, after the ABOUTME comments and before any function that uses these dependencies. The file must be loaded with top-level await support (ES modules handle this natively).

- [ ] **Step 2: Run tests to verify they pass**

```bash
npm test
```

Expected: All tests in `test/parser.test.js` and `test/geo.test.js` PASS.

- [ ] **Step 3: Commit**

```bash
git add locations.js
git commit -m "feat: implement country lookup with point-in-polygon"
```

---

### Task 6: Integration Tests

**Files:**
- Create: `test/integration.test.js`

- [ ] **Step 1: Write integration test for full pipeline**

Create `test/integration.test.js`:

```javascript
// ABOUTME: Integration test for the full data pipeline.
// ABOUTME: Parses fixture Timeline.json through to country aggregation.

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { extractCoordinates, buildCountryMap } from '../locations.js';

let worldTopo;
let fixtureData;

before(() => {
  worldTopo = JSON.parse(
    readFileSync(new URL('../world-110m.json', import.meta.url), 'utf-8')
  );
  fixtureData = JSON.parse(
    readFileSync(new URL('./fixtures/small-timeline.json', import.meta.url), 'utf-8')
  );
});

describe('full pipeline: Timeline.json -> country map', () => {
  it('extracts correct number of coordinates from fixture', () => {
    const coords = extractCoordinates(fixtureData);
    // 2 UK visits + 1 France visit + 2 USA activity endpoints = 5
    // timelinePath is skipped
    assert.strictEqual(coords.length, 5);
  });

  it('maps coordinates to correct countries', () => {
    const coords = extractCoordinates(fixtureData);
    const countryMap = buildCountryMap(coords, worldTopo);

    assert.ok(countryMap.has('United Kingdom'), 'Should have United Kingdom');
    assert.ok(countryMap.has('France'), 'Should have France');
    assert.ok(
      countryMap.has('United States of America'),
      'Should have United States of America'
    );
    assert.strictEqual(countryMap.size, 3, 'Should have exactly 3 countries');
  });

  it('tracks visit counts correctly', () => {
    const coords = extractCoordinates(fixtureData);
    const countryMap = buildCountryMap(coords, worldTopo);

    assert.strictEqual(countryMap.get('United Kingdom').visitCount, 2);
    assert.strictEqual(countryMap.get('France').visitCount, 1);
    // USA activity has start + end = 2 coordinate entries
    assert.strictEqual(
      countryMap.get('United States of America').visitCount, 2
    );
  });

  it('tracks first and last visit dates correctly', () => {
    const coords = extractCoordinates(fixtureData);
    const countryMap = buildCountryMap(coords, worldTopo);

    const uk = countryMap.get('United Kingdom');
    assert.deepStrictEqual(uk.firstVisit, new Date('2025-09-01T10:00:00.000+01:00'));
    assert.deepStrictEqual(uk.lastVisit, new Date('2025-12-01T10:00:00.000+01:00'));
  });
});
```

- [ ] **Step 2: Run integration tests**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add test/integration.test.js
git commit -m "test: add integration test for full parsing pipeline"
```

---

### Task 7: HTML Page — Upload Zone

**Files:**
- Create: `index.html`

- [ ] **Step 1: Create index.html with upload zone**

Create `index.html` with the AttentionFeed header, page layout, and drag-and-drop upload zone. Follow the booklist pattern exactly for structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Attention Feed: Locations</title>
    <link rel="icon" href="https://attentionfeed.com/shared/favicon.ico">
    <link rel="stylesheet" href="shared.css">
    <script src="shared.js" defer></script>

    <!-- D3.js and TopoJSON from CDN -->
    <script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
    <script src="https://cdn.jsdelivr.net/npm/topojson-client@3"></script>

    <style>
        /* ==================== APP-SPECIFIC VARIABLES ==================== */
        :root {
            --app-bg: #f8f9fb;
            --app-text: #1a1a2e;
            --app-primary: #6366f1;
            --app-card-bg: #ffffff;
            --app-text-muted: #6b7280;
            --app-primary-hover: #4f46e5;
            --app-primary-light: #eef2ff;
            --app-border: #e5e7eb;
            --app-radius: 12px;
            --app-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
        }

        /* ==================== LAYOUT ==================== */
        .page {
            max-width: 1100px;
            margin: 2rem auto;
            padding: 0 1rem;
        }
        .page-title {
            font-size: 1.5rem;
            font-weight: 700;
            letter-spacing: -0.02em;
            margin-bottom: 0.375rem;
        }
        .page-subtitle {
            color: var(--app-text-muted);
            font-size: 0.875rem;
            margin-bottom: 2rem;
        }

        /* ==================== CARDS ==================== */
        .card {
            background: var(--app-card-bg);
            border-radius: var(--app-radius);
            box-shadow: var(--app-shadow);
            padding: 2rem;
        }

        /* ==================== UPLOAD ZONE ==================== */
        .upload-zone {
            border: 2px dashed var(--app-border);
            border-radius: var(--app-radius);
            padding: 3rem 2rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.15s;
        }
        .upload-zone:hover,
        .upload-zone.dragover {
            border-color: var(--app-primary);
            background: var(--app-primary-light);
        }
        .upload-zone h3 {
            font-size: 1.125rem;
            font-weight: 600;
            margin-bottom: 0.25rem;
            color: var(--app-text);
        }
        .upload-zone p {
            color: var(--app-text-muted);
            font-size: 0.875rem;
        }
        .upload-zone input[type="file"] {
            display: none;
        }

        /* ==================== HELP PANEL ==================== */
        .help-panel {
            margin-bottom: 1.5rem;
            background: var(--app-card-bg);
            border-radius: var(--app-radius);
            box-shadow: var(--app-shadow);
            overflow: hidden;
        }
        .help-panel summary {
            padding: 0.75rem 1.25rem;
            font-size: 0.8125rem;
            font-weight: 600;
            color: var(--app-primary);
            cursor: pointer;
            list-style: none;
        }
        .help-panel summary::-webkit-details-marker { display: none; }
        .help-panel summary::before {
            content: '\25B6';
            display: inline-block;
            margin-right: 0.5rem;
            font-size: 0.625rem;
            transition: transform 0.15s;
        }
        .help-panel[open] summary::before {
            transform: rotate(90deg);
        }
        .help-content {
            padding: 0 1.25rem 1rem;
            font-size: 0.8125rem;
            color: var(--app-text-muted);
            line-height: 1.7;
        }
        .help-content ol {
            padding-left: 1.25rem;
        }
        .help-content li {
            margin-bottom: 0.375rem;
        }
        .help-content strong {
            color: var(--app-text);
        }

        /* ==================== FLASH MESSAGES ==================== */
        .flash {
            padding: 0.875rem 1.25rem;
            margin-bottom: 1rem;
            border-radius: 8px;
            font-size: 0.875rem;
        }
        .flash-error {
            background: #fef2f2;
            color: #991b1b;
            border: 1px solid #fecaca;
        }

        /* ==================== STATS ==================== */
        .stats-line {
            font-size: 0.875rem;
            color: var(--app-text-muted);
            margin-bottom: 1rem;
        }
        .stats-line strong {
            color: var(--app-text);
        }

        /* ==================== MAP ==================== */
        .map-container {
            background: var(--app-card-bg);
            border-radius: var(--app-radius);
            box-shadow: var(--app-shadow);
            padding: 1.5rem;
            margin-top: 1.5rem;
        }
        .map-container svg {
            width: 100%;
            height: auto;
        }
        .map-container .country {
            stroke: #fff;
            stroke-width: 0.5;
            transition: opacity 0.15s;
        }
        .map-container .country:hover {
            stroke-width: 1.5;
            stroke: #333;
        }

        /* ==================== LEGEND ==================== */
        .legend {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-top: 1rem;
            font-size: 0.75rem;
            color: var(--app-text-muted);
        }
        .legend-gradient {
            width: 120px;
            height: 12px;
            border-radius: 3px;
        }
        .legend-swatch {
            width: 24px;
            height: 12px;
            border-radius: 3px;
            background: #e5e7eb;
            display: inline-block;
        }

        /* ==================== TOOLTIP ==================== */
        .tooltip {
            position: fixed;
            background: rgba(0, 0, 0, 0.85);
            color: #fff;
            padding: 0.5rem 0.75rem;
            border-radius: 6px;
            font-size: 0.8125rem;
            pointer-events: none;
            z-index: 1000;
            max-width: 240px;
            line-height: 1.4;
            display: none;
        }
        .tooltip .country-name {
            font-weight: 600;
        }
        .tooltip .visit-info {
            font-size: 0.75rem;
            opacity: 0.85;
        }

        /* ==================== PROCESSING INDICATOR ==================== */
        .processing {
            text-align: center;
            padding: 2rem;
            color: var(--app-text-muted);
            font-size: 0.875rem;
        }

        /* ==================== HIDDEN ==================== */
        .hidden {
            display: none !important;
        }

        /* ==================== RESPONSIVE ==================== */
        @media (max-width: 768px) {
            .page {
                padding: 0 0.75rem;
                margin: 1rem auto;
            }
        }
    </style>
</head>
<body>
    <af-header project-name="Locations" project-url="."></af-header>

    <main class="page">
        <h1 class="page-title">Country Visit Map</h1>
        <p class="page-subtitle">Upload your Google Takeout Timeline.json to see a map of countries you've visited. All processing happens in your browser — your data is not uploaded anywhere. NB Coded by AI with Claude Code.</p>

        <details class="help-panel">
            <summary>How to use this tool</summary>
            <div class="help-content">
                <ol>
                    <li><strong>Get your data:</strong> Open Google Maps on your phone, go to Settings > Personal content > Export Timeline data. Download the resulting file.</li>
                    <li><strong>Upload:</strong> Drop the Timeline.json file below or click to select it.</li>
                    <li><strong>View:</strong> A world map appears showing every country you've visited, colored by how recently you were there.</li>
                </ol>
            </div>
        </details>

        <div id="flash-area"></div>

        <!-- Upload Section -->
        <div id="upload-section" class="card">
            <div id="upload-zone" class="upload-zone">
                <h3>Drop your Timeline.json file here</h3>
                <p>Or click to select a file</p>
                <input type="file" id="file-input" accept=".json">
            </div>
        </div>

        <!-- Processing indicator -->
        <div id="processing-section" class="card hidden">
            <div class="processing">Processing location data...</div>
        </div>

        <!-- Results Section (hidden until data processed) -->
        <div id="results-section" class="hidden">
            <div id="stats-line" class="stats-line"></div>
            <div class="map-container">
                <div id="map"></div>
                <div class="legend">
                    <span>Recent</span>
                    <canvas id="legend-gradient" class="legend-gradient" width="120" height="12"></canvas>
                    <span>Long ago</span>
                    <span class="legend-swatch"></span>
                    <span>Not visited</span>
                </div>
            </div>
        </div>
    </main>

    <!-- Tooltip -->
    <div id="tooltip" class="tooltip">
        <div class="country-name"></div>
        <div class="visit-info"></div>
    </div>

    <af-footer></af-footer>

    <script type="module">
    // ABOUTME: Main application script for the country visit map.
    // ABOUTME: Handles file upload, data processing, and D3 map rendering.

    import { parseLatLng, extractCoordinates, buildCountryMap, lookupCountry, COUNTRY_NAMES } from './locations.js';

    /* ==================== STATE ==================== */
    let countryData = null; // Map<string, {firstVisit, lastVisit, visitCount}>
    let worldTopo = null;

    /* ==================== UPLOAD HANDLING ==================== */
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const flashArea = document.getElementById('flash-area');

    uploadZone.addEventListener('click', () => fileInput.click());

    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    });

    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (file) processFile(file);
    });

    function showError(msg) {
      flashArea.innerHTML = `<div class="flash flash-error">${msg}</div>`;
    }

    async function processFile(file) {
      flashArea.innerHTML = '';

      if (!file.name.endsWith('.json')) {
        showError('Please upload a .json file (Timeline.json from Google Takeout).');
        return;
      }

      document.getElementById('upload-section').classList.add('hidden');
      document.getElementById('processing-section').classList.remove('hidden');

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.semanticSegments) {
          throw new Error(
            'This does not look like a Timeline.json file '
            + '(missing semanticSegments).'
          );
        }

        if (!worldTopo) {
          const resp = await fetch('world-110m.json');
          worldTopo = await resp.json();
        }

        const coords = extractCoordinates(data);
        if (coords.length === 0) {
          throw new Error(
            'No location data found in this file. '
            + 'Make sure you are uploading Timeline.json '
            + 'from Google Takeout.'
          );
        }

        countryData = buildCountryMap(coords, worldTopo);
        renderResults(coords);
      } catch (err) {
        document.getElementById('processing-section').classList.add('hidden');
        document.getElementById('upload-section').classList.remove('hidden');
        showError(err.message);
      }
    }

    /* ==================== RESULTS RENDERING ==================== */
    function renderResults(coords) {
      document.getElementById('processing-section').classList.add('hidden');
      document.getElementById('results-section').classList.remove('hidden');

      // Stats
      const times = coords
        .map(c => new Date(c.time).getTime())
        .filter(t => !isNaN(t));
      const minDate = new Date(Math.min(...times));
      const maxDate = new Date(Math.max(...times));
      const fmtOpts = { year: 'numeric', month: 'short' };
      const statsLine = document.getElementById('stats-line');
      statsLine.innerHTML =
        `<strong>${countryData.size}</strong> countries visited`
        + ` &middot; ${minDate.toLocaleDateString('en-US', fmtOpts)}`
        + ` &ndash; ${maxDate.toLocaleDateString('en-US', fmtOpts)}`;

      renderMap();
      renderLegend();
    }

    /* ==================== MAP RENDERING ==================== */
    function renderMap() {
      const mapEl = document.getElementById('map');
      mapEl.innerHTML = '';

      const width = 960;
      const height = 500;

      const svg = d3.select(mapEl)
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

      const projection = d3.geoNaturalEarth1()
        .scale(153)
        .translate([width / 2, height / 2]);

      const path = d3.geoPath().projection(projection);

      const countries = topojson.feature(
        worldTopo, worldTopo.objects.countries
      );

      /* Color scale: years since last visit -> opacity.
         0 years (this year) = full opacity, oldest = 0.2 opacity */
      const now = new Date();
      let maxYears = 0;
      for (const entry of countryData.values()) {
        const years =
          (now - entry.lastVisit) / (365.25 * 24 * 60 * 60 * 1000);
        if (years > maxYears) maxYears = years;
      }
      /* Ensure at least 1 year range to avoid division by zero */
      if (maxYears < 1) maxYears = 1;

      /* COUNTRY_NAMES imported from locations.js */

      svg.selectAll('path')
        .data(countries.features)
        .join('path')
        .attr('d', path)
        .attr('class', 'country')
        .attr('fill', d => {
          const name = COUNTRY_NAMES[d.id];
          if (!name || !countryData.has(name)) return '#e5e7eb';
          const entry = countryData.get(name);
          const years =
            (now - entry.lastVisit) / (365.25 * 24 * 60 * 60 * 1000);
          const opacity = 1 - (years / maxYears) * 0.8;
          return d3.color('#6366f1').copy({ opacity });
        })
        .on('mousemove', (event, d) => {
          const name = COUNTRY_NAMES[d.id];
          const tooltip = document.getElementById('tooltip');
          if (name && countryData.has(name)) {
            const entry = countryData.get(name);
            const fmtOpts = { year: 'numeric', month: 'short' };
            tooltip.querySelector('.country-name').textContent = name;
            tooltip.querySelector('.visit-info').textContent =
              `Last visit: ${entry.lastVisit.toLocaleDateString('en-US', fmtOpts)}`
              + ` · ${entry.visitCount} visit${entry.visitCount > 1 ? 's' : ''}`;
            tooltip.style.display = 'block';
          } else if (name) {
            tooltip.querySelector('.country-name').textContent = name;
            tooltip.querySelector('.visit-info').textContent = 'Not visited';
            tooltip.style.display = 'block';
          }
          tooltip.style.left = (event.clientX + 12) + 'px';
          tooltip.style.top = (event.clientY - 10) + 'px';
        })
        .on('mouseleave', () => {
          document.getElementById('tooltip').style.display = 'none';
        });
    }

    /* ==================== LEGEND ==================== */
    function renderLegend() {
      const canvas = document.getElementById('legend-gradient');
      const ctx = canvas.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 120, 0);
      gradient.addColorStop(0, 'rgba(99, 102, 241, 1)');
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0.2)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(0, 0, 120, 12, 3);
      ctx.fill();
    }

    </script>
</body>
</html>
```

- [ ] **Step 2: Verify the page loads in the browser**

Serve the files and open in a browser:

```bash
npx serve . -l 8000
```

Check that:
- The AF header renders with "locations" branding
- The upload zone is visible with drag-and-drop styling
- The help panel expands/collapses
- No console errors

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add HTML page with upload zone and map rendering"
```

---

### Task 8: E2E Test

**Files:**
- Create: `test/e2e.test.js`

The E2E test verifies the full pipeline works by running the data processing logic end-to-end in Node (since we don't have a headless browser). This tests that a real Timeline.json can be loaded, parsed, and mapped to countries — the same code path the browser uses.

- [ ] **Step 1: Write E2E test**

Create `test/e2e.test.js`:

```javascript
// ABOUTME: End-to-end test for the full location processing pipeline.
// ABOUTME: Tests with the real Timeline.json file if available, otherwise uses fixture.

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { extractCoordinates, buildCountryMap } from '../locations.js';

let worldTopo;

before(() => {
  worldTopo = JSON.parse(
    readFileSync(new URL('../world-110m.json', import.meta.url), 'utf-8')
  );
});

describe('e2e: full pipeline with real or fixture data', () => {
  it('processes Timeline.json and produces a country map', () => {
    /* Use real Timeline.json if present, otherwise fall back to fixture */
    const realPath = new URL('../Timeline.json', import.meta.url);
    const fixturePath = new URL(
      './fixtures/small-timeline.json', import.meta.url
    );
    const dataPath = existsSync(realPath) ? realPath : fixturePath;
    const data = JSON.parse(readFileSync(dataPath, 'utf-8'));

    const coords = extractCoordinates(data);
    assert.ok(coords.length > 0, 'Should extract at least one coordinate');

    const countryMap = buildCountryMap(coords, worldTopo);
    assert.ok(countryMap.size > 0, 'Should identify at least one country');

    /* Every entry should have valid dates and positive visit count */
    for (const [country, entry] of countryMap) {
      assert.ok(
        entry.firstVisit instanceof Date,
        `${country} firstVisit should be a Date`
      );
      assert.ok(
        entry.lastVisit instanceof Date,
        `${country} lastVisit should be a Date`
      );
      assert.ok(
        entry.visitCount > 0,
        `${country} visitCount should be positive`
      );
      assert.ok(
        entry.firstVisit <= entry.lastVisit,
        `${country} firstVisit should be <= lastVisit`
      );
    }

    /* Print summary for human verification */
    console.log(`\n  Countries found: ${countryMap.size}`);
    const sorted = [...countryMap.entries()]
      .sort((a, b) => b[1].visitCount - a[1].visitCount);
    for (const [country, entry] of sorted.slice(0, 10)) {
      console.log(
        `    ${country}: ${entry.visitCount} visits, `
        + `last ${entry.lastVisit.toISOString().slice(0, 10)}`
      );
    }
  });

  it('index.html exists and references required assets', () => {
    const html = readFileSync(
      new URL('../index.html', import.meta.url), 'utf-8'
    );
    assert.ok(html.includes('shared.css'), 'Should load shared.css');
    assert.ok(html.includes('shared.js'), 'Should load shared.js');
    assert.ok(html.includes('locations.js'), 'Should load locations.js');
    assert.ok(html.includes('d3@7'), 'Should load D3 from CDN');
    assert.ok(html.includes('topojson-client@3'), 'Should load TopoJSON from CDN');
    assert.ok(html.includes('world-110m.json'), 'Should reference world-110m.json');
    assert.ok(html.includes('upload-zone'), 'Should have upload zone');
    assert.ok(html.includes('af-header'), 'Should have AF header');
  });
});
```

- [ ] **Step 2: Run all tests**

```bash
npm test
```

Expected: All tests across all 4 test files PASS.

- [ ] **Step 3: Commit**

```bash
git add test/e2e.test.js
git commit -m "test: add e2e test for full pipeline"
```

---

### Task 9: Manual Verification and Final Commit

- [ ] **Step 1: Serve the app and test with real data**

```bash
npx serve . -l 8000
```

Open http://localhost:8000 (or the container-mapped port) in a browser. Upload the real `Timeline.json` file. Verify:
- File upload works (drag-and-drop and click)
- Processing indicator shows
- Map renders with colored countries
- Stats line shows country count and date range
- Hover tooltips work on visited countries
- Unvisited countries are grey
- Legend renders correctly

- [ ] **Step 2: Run full test suite one more time**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 3: Final commit with any fixes**

If any issues were found during manual testing, fix them and commit:

```bash
git add -A
git commit -m "fix: address issues found during manual testing"
```

- [ ] **Step 4: Add node_modules to .gitignore if not already there**

Check that `.gitignore` includes `node_modules/`. If not, add it and commit.
