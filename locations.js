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
