// ABOUTME: Pure functions for processing Google Takeout Timeline.json data.
// ABOUTME: Extracts coordinates from visit/activity segments and looks up countries.

// Load topojson and d3-geo from npm in Node, or from CDN globals in the browser.
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

// ISO 3166-1 numeric code to country name mapping for world-110m topology.
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
  '706': 'Somalia', '710': 'South Africa', '716': 'Zimbabwe',
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
 * Look up the country name for a given lat/lng coordinate using world topology.
 * Returns the country name string, or null if the point falls in the ocean.
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
 * Aggregate an array of { lat, lng, time } coords into a Map keyed by country name.
 * Each entry holds { visitCount, firstVisit, lastVisit } as Date objects.
 * Coordinates that fall in the ocean (no country match) are skipped.
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

/* Common alternative spellings/abbreviations -> canonical COUNTRY_NAMES value */
const COUNTRY_ALIASES = {
  'usa': 'United States of America',
  'us': 'United States of America',
  'united states': 'United States of America',
  'u.s.a.': 'United States of America',
  'u.s.': 'United States of America',
  'america': 'United States of America',
  'uk': 'United Kingdom',
  'u.k.': 'United Kingdom',
  'great britain': 'United Kingdom',
  'britain': 'United Kingdom',
  'england': 'United Kingdom',
  'scotland': 'United Kingdom',
  'wales': 'United Kingdom',
  'northern ireland': 'United Kingdom',
  'czech republic': 'Czechia',
  'ivory coast': "Cote d'Ivoire",
  'côte d\'ivoire': "Cote d'Ivoire",
  'burma': 'Myanmar',
  'holland': 'Netherlands',
  'the netherlands': 'Netherlands',
  'republic of ireland': 'Ireland',
  'uae': 'United Arab Emirates',
  'drc': 'Dem. Rep. Congo',
  'democratic republic of congo': 'Dem. Rep. Congo',
  'democratic republic of the congo': 'Dem. Rep. Congo',
  'republic of congo': 'Congo',
  'east timor': 'Timor-Leste',
  'cape verde': 'Cabo Verde',
  'swaziland': 'Eswatini',
  'macedonia': 'North Macedonia',
  'russia': 'Russia',
  'russian federation': 'Russia',
  'south korea': 'South Korea',
  'north korea': 'North Korea',
  'taiwan': 'Taiwan',
  'palestine': 'Palestine',
};

/**
 * Normalize a country name from user input to the canonical name used in COUNTRY_NAMES.
 * Handles common abbreviations, alternative spellings, and case differences.
 * Returns null for empty/falsy input.
 */
export function normalizeCountryName(name) {
  if (!name || typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (!trimmed) return null;

  /* Check aliases first (case-insensitive) */
  const lower = trimmed.toLowerCase();
  if (COUNTRY_ALIASES[lower]) {
    return COUNTRY_ALIASES[lower];
  }

  /* Check if it's already a canonical name (case-insensitive match) */
  const canonicalNames = Object.values(COUNTRY_NAMES);
  const found = canonicalNames.find(
    cn => cn.toLowerCase() === lower
  );
  if (found) return found;

  /* Return as-is (trimmed) for unknown names */
  return trimmed;
}

/**
 * Parse a date string, handling ISO formats and m/yyyy or mm/yyyy.
 * Returns a Date object or null if unparseable.
 */
export function parseDateStr(str) {
  if (!str || typeof str !== 'string') return null;
  const trimmed = str.trim();
  if (!trimmed) return null;

  /* Try bare year (e.g., "2017") */
  const yearOnly = trimmed.match(/^(\d{4})$/);
  if (yearOnly) {
    const year = parseInt(yearOnly[1], 10);
    if (year < 100) return null;
    return new Date(Date.UTC(year, 0, 1));
  }

  /* Try m/yyyy or mm/yyyy format */
  const monthYear = trimmed.match(/^(\d{1,2})\/(\d{4})$/);
  if (monthYear) {
    const month = parseInt(monthYear[1], 10);
    const year = parseInt(monthYear[2], 10);
    if (month >= 1 && month <= 12) {
      return new Date(Date.UTC(year, month - 1, 1));
    }
    return null;
  }

  /* Try m/d/yyyy or mm/dd/yyyy format */
  const mdyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdyMatch) {
    const month = parseInt(mdyMatch[1], 10);
    const day = parseInt(mdyMatch[2], 10);
    const year = parseInt(mdyMatch[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const d = new Date(Date.UTC(year, month - 1, day));
      /* Verify the date didn't roll over (e.g., Feb 30 -> Mar 2) */
      if (d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
        return null;
      }
      return d;
    }
    return null;
  }

  /* Fall back to standard Date parsing */
  const date = new Date(trimmed);
  if (isNaN(date.getTime())) return null;
  return date;
}

/**
 * Parse a CSV string with Date and Country columns into a country map.
 * Returns { countryMap: Map, errors: string[] }.
 * The column matching is case-insensitive.
 */
export function parseCsvToCountryMap(csv) {
  const errors = [];
  const countryMap = new Map();

  if (!csv || typeof csv !== 'string' || !csv.trim()) {
    errors.push('CSV file is empty.');
    return { countryMap, errors };
  }

  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) {
    errors.push('CSV file has no data rows.');
    return { countryMap, errors };
  }

  /* Parse header to find column indices */
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const dateIdx = header.findIndex(
    h => h === 'date' || h === 'timestamp' || h === 'time'
  );
  const countryIdx = header.findIndex(
    h => h === 'country' || h === 'country_name'
  );

  if (dateIdx === -1) {
    errors.push(
      'CSV missing required "Date" column. '
      + 'Expected a column named Date, Timestamp, or Time.'
    );
    return { countryMap, errors };
  }
  if (countryIdx === -1) {
    errors.push(
      'CSV missing required "Country" column. '
      + 'Expected a column named Country or Country_Name.'
    );
    return { countryMap, errors };
  }

  /* Parse data rows */
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (!row.trim()) continue;

    const cols = row.split(',').map(c => c.trim());
    const dateStr = cols[dateIdx];
    const countryStr = cols[countryIdx];

    if (!countryStr) {
      errors.push(`Row ${i + 1}: missing country value.`);
      continue;
    }

    const date = parseDateStr(dateStr);
    if (!date) {
      errors.push(`Row ${i + 1}: invalid date "${dateStr}".`);
      continue;
    }

    const country = normalizeCountryName(countryStr);
    if (!country) {
      errors.push(`Row ${i + 1}: empty country after normalization.`);
      continue;
    }

    if (countryMap.has(country)) {
      const entry = countryMap.get(country);
      entry.visitCount++;
      if (date < entry.firstVisit) entry.firstVisit = date;
      if (date > entry.lastVisit) entry.lastVisit = date;
    } else {
      countryMap.set(country, {
        firstVisit: date,
        lastVisit: date,
        visitCount: 1,
      });
    }
  }

  return { countryMap, errors };
}

/**
 * Merge two country maps into one. Combines visit counts and expands date ranges.
 * Returns a new Map (does not mutate inputs).
 */
export function mergeCountryMaps(mapA, mapB) {
  const merged = new Map();

  for (const [country, entry] of mapA) {
    merged.set(country, { ...entry });
  }

  for (const [country, entry] of mapB) {
    if (merged.has(country)) {
      const existing = merged.get(country);
      existing.visitCount += entry.visitCount;
      if (entry.firstVisit < existing.firstVisit) {
        existing.firstVisit = entry.firstVisit;
      }
      if (entry.lastVisit > existing.lastVisit) {
        existing.lastVisit = entry.lastVisit;
      }
    } else {
      merged.set(country, { ...entry });
    }
  }

  return merged;
}

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

/**
 * Extract raw visit rows from CSV for re-export.
 * Returns array of { date: string, city: string, state: string, country: string }.
 */
export function extractCsvRows(csv) {
  const rows = [];
  if (!csv || typeof csv !== 'string' || !csv.trim()) return rows;

  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return rows;

  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const dateIdx = header.findIndex(
    h => h === 'date' || h === 'timestamp' || h === 'time'
  );
  const cityIdx = header.findIndex(h => h === 'city');
  const stateIdx = header.findIndex(
    h => h === 'state' || h === 'state/zip' || h === 'province'
      || h === 'state_province' || h === 'region'
  );
  const countryIdx = header.findIndex(
    h => h === 'country' || h === 'country_name'
  );

  if (dateIdx === -1) return rows;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const cols = line.split(',').map(c => c.trim());

    const dateStr = cols[dateIdx];
    const date = parseDateStr(dateStr);
    if (!date) continue;

    const city = cityIdx !== -1 ? cols[cityIdx] || '' : '';
    const stateRaw = stateIdx !== -1 ? cols[stateIdx] || '' : '';
    const countryRaw = countryIdx !== -1 ? cols[countryIdx] || '' : '';

    const state = extractStateFromField(stateRaw)
      || extractStateFromField(countryRaw) || '';
    const country = normalizeCountryName(countryRaw) || '';

    if (!state && !country) continue;

    rows.push({
      date: date.toISOString(),
      city,
      state,
      country,
    });
  }

  return rows;
}

/* US state abbreviation -> full name */
const US_STATE_ABBREVS = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
  'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
  'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
  'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
  'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
  'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
  'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
  'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
  'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia',
  'PR': 'Puerto Rico', 'GU': 'Guam',
  'VI': 'United States Virgin Islands',
  'AS': 'American Samoa',
  'MP': 'Commonwealth of the Northern Mariana Islands',
};

/* Canadian province abbreviation -> full name */
const CA_PROVINCE_ABBREVS = {
  'AB': 'Alberta', 'BC': 'British Columbia', 'MB': 'Manitoba',
  'NB': 'New Brunswick', 'NL': 'Newfoundland and Labrador',
  'NS': 'Nova Scotia', 'NT': 'Northwest Territories', 'NU': 'Nunavut',
  'ON': 'Ontario', 'PE': 'Prince Edward Island', 'QC': 'Quebec',
  'SK': 'Saskatchewan', 'YT': 'Yukon Territory',
};

/* Common alternative spellings for states/provinces */
const STATE_ALIASES = {
  'washington dc': 'District of Columbia',
  'washington d.c.': 'District of Columbia',
  'washington, dc': 'District of Columbia',
  'washington, d.c.': 'District of Columbia',
  'd.c.': 'District of Columbia',
  'yukon': 'Yukon Territory',
  'pei': 'Prince Edward Island',
  'nfld': 'Newfoundland and Labrador',
  'newfoundland': 'Newfoundland and Labrador',
  'virgin islands': 'United States Virgin Islands',
  'us virgin islands': 'United States Virgin Islands',
  'u.s. virgin islands': 'United States Virgin Islands',
  'usvi': 'United States Virgin Islands',
  'northern mariana islands': 'Commonwealth of the Northern Mariana Islands',
  'northern marianas': 'Commonwealth of the Northern Mariana Islands',
  'cnmi': 'Commonwealth of the Northern Mariana Islands',
};

/**
 * Extract a US state or Canadian province name from a State/Zip field.
 * Handles formats like "CA 94128", "DC 20008", "BC V6Z 1S2", "NY",
 * "California", "Washington DC", etc.
 * Returns the full state/province name or null if not recognized.
 */
export function extractStateFromField(str) {
  if (!str || typeof str !== 'string') return null;
  const trimmed = str.trim();
  if (!trimmed) return null;

  /* Check aliases first (case-insensitive) */
  const lower = trimmed.toLowerCase();
  if (STATE_ALIASES[lower]) return STATE_ALIASES[lower];

  /* Check if it's a full state/province name */
  const allNames = [
    ...Object.values(US_STATE_ABBREVS),
    ...Object.values(CA_PROVINCE_ABBREVS),
  ];
  const nameMatch = allNames.find(n => n.toLowerCase() === lower);
  if (nameMatch) return nameMatch;

  /* Try to extract 2-letter code from the beginning */
  const abbrevMatch = trimmed.match(/^([A-Z]{2})(?:\s|$)/);
  if (abbrevMatch) {
    const code = abbrevMatch[1];
    if (US_STATE_ABBREVS[code]) return US_STATE_ABBREVS[code];
    if (CA_PROVINCE_ABBREVS[code]) return CA_PROVINCE_ABBREVS[code];
  }

  return null;
}

/**
 * Look up the US state or Canadian province for a lat/lng coordinate.
 * Returns the state/province name or null if not in US/Canada.
 */
export function lookupState(lat, lng, usTopo, caTopo) {
  /* Check US states */
  const usFeatures = topojsonClient.feature(usTopo, usTopo.objects.states);
  for (const feature of usFeatures.features) {
    if (geoContains(feature, [lng, lat])) {
      return feature.properties?.name || null;
    }
  }

  /* Check Canadian provinces */
  const caFeatures = topojsonClient.feature(caTopo, caTopo.objects.provinces);
  for (const feature of caFeatures.features) {
    if (geoContains(feature, [lng, lat])) {
      return feature.properties?.name || null;
    }
  }

  return null;
}

/**
 * Build a state/province visit map from coordinates (like buildCountryMap but for states).
 * Skips coordinates outside US/Canada.
 */
export function buildStateMap(coords, usTopo, caTopo) {
  const stateMap = new Map();

  for (const coord of coords) {
    const state = lookupState(coord.lat, coord.lng, usTopo, caTopo);
    if (!state) continue;

    const time = new Date(coord.time);
    if (stateMap.has(state)) {
      const entry = stateMap.get(state);
      entry.visitCount++;
      if (time < entry.firstVisit) entry.firstVisit = time;
      if (time > entry.lastVisit) entry.lastVisit = time;
    } else {
      stateMap.set(state, {
        firstVisit: time,
        lastVisit: time,
        visitCount: 1,
      });
    }
  }

  return stateMap;
}

/**
 * Parse a CSV string into a state/province visit map.
 * Looks for a "State", "State/Zip", or "Province" column.
 * Skips rows that don't have a recognizable US/CA state.
 * Returns { stateMap: Map, errors: string[] }.
 */
export function parseCsvToStateMap(csv) {
  const errors = [];
  const stateMap = new Map();

  if (!csv || typeof csv !== 'string' || !csv.trim()) {
    return { stateMap, errors };
  }

  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return { stateMap, errors };

  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const dateIdx = header.findIndex(
    h => h === 'date' || h === 'timestamp' || h === 'time'
  );
  const stateIdx = header.findIndex(
    h => h === 'state' || h === 'state/zip' || h === 'province'
      || h === 'state_province' || h === 'region'
  );
  const countryIdx = header.findIndex(
    h => h === 'country' || h === 'country_name'
  );

  if (dateIdx === -1) {
    return { stateMap, errors };
  }
  /* If neither state nor country column exists, nothing to extract */
  if (stateIdx === -1 && countryIdx === -1) {
    return { stateMap, errors };
  }

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (!row.trim()) continue;

    const cols = row.split(',').map(c => c.trim());
    const dateStr = cols[dateIdx];
    const stateStr = stateIdx !== -1 ? cols[stateIdx] : '';
    const countryStr = countryIdx !== -1 ? cols[countryIdx] : '';

    const date = parseDateStr(dateStr);
    if (!date) continue;

    /* Try state/zip column first, then fall back to country column
       (handles territories like Puerto Rico listed as a country) */
    let state = stateStr ? extractStateFromField(stateStr) : null;
    if (!state && countryStr) {
      state = extractStateFromField(countryStr);
    }
    if (!state) continue;

    if (stateMap.has(state)) {
      const entry = stateMap.get(state);
      entry.visitCount++;
      if (date < entry.firstVisit) entry.firstVisit = date;
      if (date > entry.lastVisit) entry.lastVisit = date;
    } else {
      stateMap.set(state, {
        firstVisit: date,
        lastVisit: date,
        visitCount: 1,
      });
    }
  }

  return { stateMap, errors };
}
