// ABOUTME: Unit tests for city checklist matching and proximity detection.
// ABOUTME: Verifies city visit detection via name matching and coordinate proximity.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CITY_LISTS, matchCityVisits, haversineKm, cityKey } from '../city-lists.js';

describe('CITY_LISTS data', () => {
  it('top50 has exactly 50 cities', () => {
    assert.strictEqual(CITY_LISTS.top50.cities.length, 50);
  });

  it('unesco has at least 100 cities', () => {
    assert.ok(CITY_LISTS.unesco.cities.length >= 100);
  });

  it('usca_top50 has exactly 50 cities', () => {
    assert.strictEqual(CITY_LISTS.usca_top50.cities.length, 50);
  });

  it('usca_unesco has at least 20 cities', () => {
    assert.ok(CITY_LISTS.usca_unesco.cities.length >= 20);
  });

  it('all top50 cities have name, country, lat, lng, radiusKm', () => {
    for (const city of CITY_LISTS.top50.cities) {
      assert.ok(city.name, `Missing name`);
      assert.ok(city.country, `Missing country for ${city.name}`);
      assert.ok(typeof city.lat === 'number', `Missing lat for ${city.name}`);
      assert.ok(typeof city.lng === 'number', `Missing lng for ${city.name}`);
      assert.ok(typeof city.radiusKm === 'number', `Missing radiusKm for ${city.name}`);
    }
  });

  it('all unesco cities have name, country, year, lat, lng, radiusKm', () => {
    for (const city of CITY_LISTS.unesco.cities) {
      assert.ok(city.name, `Missing name`);
      assert.ok(city.country, `Missing country for ${city.name}`);
      assert.ok(city.year, `Missing year for ${city.name}`);
      assert.ok(typeof city.lat === 'number', `Missing lat for ${city.name}`);
      assert.ok(typeof city.lng === 'number', `Missing lng for ${city.name}`);
      assert.ok(typeof city.radiusKm === 'number', `Missing radiusKm for ${city.name}`);
    }
  });

  it('all usca_top50 cities have state field', () => {
    for (const city of CITY_LISTS.usca_top50.cities) {
      assert.ok(city.state, `Missing state for ${city.name}`);
    }
  });

  it('all usca_unesco cities have site field', () => {
    for (const city of CITY_LISTS.usca_unesco.cities) {
      assert.ok(city.site, `Missing site for ${city.name}`);
    }
  });

  it('capitals list has at least 150 cities', () => {
    assert.ok(CITY_LISTS.capitals.cities.length >= 150);
  });

  it('usca_capitals list has all 50 US states + DC + territories + CA provinces', () => {
    assert.ok(CITY_LISTS.usca_capitals.cities.length >= 64);
  });

  it('all capitals have lat/lng/radiusKm', () => {
    for (const city of CITY_LISTS.capitals.cities) {
      assert.ok(city.name, `Missing name`);
      assert.ok(city.country, `Missing country for ${city.name}`);
      assert.ok(typeof city.lat === 'number', `Missing lat for ${city.name}`);
      assert.ok(typeof city.lng === 'number', `Missing lng for ${city.name}`);
    }
  });

  it('all usca_capitals have state field', () => {
    for (const city of CITY_LISTS.usca_capitals.cities) {
      assert.ok(city.state, `Missing state for ${city.name}`);
    }
  });
});

describe('haversineKm', () => {
  it('returns 0 for same point', () => {
    assert.strictEqual(haversineKm(51.5, -0.1, 51.5, -0.1), 0);
  });

  it('computes reasonable distance London to Paris (~340km)', () => {
    const d = haversineKm(51.5074, -0.1278, 48.8566, 2.3522);
    assert.ok(d > 330 && d < 350, `Expected ~340km, got ${d}`);
  });

  it('computes reasonable distance NYC to LA (~3940km)', () => {
    const d = haversineKm(40.7128, -74.006, 34.0522, -118.2437);
    assert.ok(d > 3900 && d < 4000, `Expected ~3940km, got ${d}`);
  });
});

describe('matchCityVisits', () => {
  const sampleList = [
    { name: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278, radiusKm: 20 },
    { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, radiusKm: 15 },
    { name: 'Tokyo', country: 'Japan', lat: 35.6895, lng: 139.6917, radiusKm: 20 },
    { name: 'Rome', country: 'Italy', lat: 41.9028, lng: 12.4964, radiusKm: 15 },
  ];

  /* Helper to check visited set using cityKey */
  const london = sampleList[0];
  const paris = sampleList[1];
  const rome = sampleList[3];

  it('matches cities by name in visit rows', () => {
    const visitRows = [
      { date: '2025-01-01', city: 'London', state: '', country: 'United Kingdom' },
    ];
    const coords = [];
    const visited = matchCityVisits(sampleList, visitRows, coords, new Map());
    assert.ok(visited.has(cityKey(london)));
  });

  it('matches cities by coordinate proximity', () => {
    const visitRows = [];
    const coords = [
      { lat: 41.90, lng: 12.50, time: '2025-03-01T00:00:00Z' },
    ];
    const visited = matchCityVisits(sampleList, visitRows, coords, new Map());
    assert.ok(visited.has(cityKey(rome)), 'Should match Rome by proximity');
    assert.ok(!visited.has(cityKey(paris)), 'Should not match Paris');
  });

  it('does not match distant coordinates', () => {
    const coords = [
      { lat: 52.52, lng: 13.405, time: '2025-01-01T00:00:00Z' },
    ];
    const visited = matchCityVisits(sampleList, [], coords, new Map());
    assert.strictEqual(visited.size, 0, 'Berlin coords should not match any list city');
  });

  it('combines name and proximity matches', () => {
    const visitRows = [
      { date: '2025-01-01', city: 'London', state: '', country: 'United Kingdom' },
    ];
    const coords = [
      { lat: 41.90, lng: 12.50, time: '2025-03-01T00:00:00Z' },
    ];
    const visited = matchCityVisits(sampleList, visitRows, coords, new Map());
    assert.strictEqual(visited.size, 2);
    assert.ok(visited.has(cityKey(london)));
    assert.ok(visited.has(cityKey(rome)));
  });

  it('handles empty inputs', () => {
    const visited = matchCityVisits(sampleList, [], [], new Map());
    assert.strictEqual(visited.size, 0);
  });

  it('matches "New York" to "New York City" via prefix', () => {
    const list = [
      { name: 'New York City', country: 'United States of America', lat: 40.7128, lng: -74.006, radiusKm: 20 },
    ];
    const visitRows = [
      { date: '2025-01-01', city: 'New York', state: 'New York', country: 'United States of America' },
    ];
    const visited = matchCityVisits(list, visitRows, [], new Map());
    assert.ok(visited.has(cityKey(list[0])));
  });

  it('does NOT match "Porto" to "Portola Valley" (not a prefix)', () => {
    const list = [
      { name: 'Porto', country: 'Portugal', lat: 41.1579, lng: -8.6291, radiusKm: 10 },
    ];
    const visitRows = [
      { date: '2025-01-01', city: 'Portola Valley', state: 'California', country: 'United States of America' },
    ];
    const visited = matchCityVisits(list, visitRows, [], new Map());
    assert.ok(!visited.has(cityKey(list[0])));
  });

  it('does NOT match "Jerusalem" via "Salem" (not a prefix)', () => {
    const list = [
      { name: 'Jerusalem', country: 'Israel', lat: 31.7683, lng: 35.2137, radiusKm: 10 },
    ];
    const visitRows = [
      { date: '2025-01-01', city: 'Salem', state: 'Oregon', country: 'United States of America' },
    ];
    const visited = matchCityVisits(list, visitRows, [], new Map());
    assert.ok(!visited.has(cityKey(list[0])));
  });

  it('disambiguates by state: Carlsbad CA does NOT match Carlsbad NM', () => {
    const list = [
      { name: 'Carlsbad', state: 'New Mexico', country: 'United States of America', lat: 32.42, lng: -104.23, radiusKm: 10 },
    ];
    const visitRows = [
      { date: '2025-01-01', city: 'Carlsbad', state: 'California', country: 'United States of America' },
    ];
    const visited = matchCityVisits(list, visitRows, [], new Map());
    assert.ok(!visited.has(cityKey(list[0])), 'Carlsbad CA should not match Carlsbad NM');
  });

  it('disambiguates by state: Austin TX matches when row has state Texas', () => {
    const list = [
      { name: 'Austin', state: 'Texas', country: 'United States of America', lat: 30.27, lng: -97.74, radiusKm: 12 },
    ];
    const visitRows = [
      { date: '2025-01-01', city: 'Austin', state: 'Texas', country: 'United States of America' },
    ];
    const visited = matchCityVisits(list, visitRows, [], new Map());
    assert.ok(visited.has(cityKey(list[0])));
  });

  it('does NOT match Virginia to West Virginia (exact state match)', () => {
    const list = [
      { name: 'Richmond', state: 'Virginia', country: 'United States of America', lat: 37.54, lng: -77.44, radiusKm: 10 },
    ];
    const visitRows = [
      { date: '2025-01-01', city: 'Richmond', state: 'West Virginia', country: 'United States of America' },
    ];
    const visited = matchCityVisits(list, visitRows, [], new Map());
    assert.ok(!visited.has(cityKey(list[0])), 'Richmond WV should not match Richmond VA');
  });

  it('disambiguates by country: Victoria Seychelles does NOT match Victoria Canada', () => {
    const list = [
      { name: 'Victoria', country: 'Seychelles', lat: -4.62, lng: 55.45, radiusKm: 8 },
    ];
    const visitRows = [
      { date: '2025-01-01', city: 'Victoria', state: 'British Columbia', country: 'Canada' },
    ];
    const visited = matchCityVisits(list, visitRows, [], new Map());
    assert.ok(!visited.has(cityKey(list[0])), 'Victoria Seychelles should not match Victoria BC');
  });

  it('handles duplicate city names (Cuenca Spain vs Ecuador)', () => {
    const list = [
      { name: 'Cuenca', country: 'Spain', lat: 40.07, lng: -2.14, radiusKm: 8 },
      { name: 'Cuenca', country: 'Ecuador', lat: -2.90, lng: -79.01, radiusKm: 8 },
    ];
    const visitRows = [
      { date: '2025-01-01', city: 'Cuenca', state: '', country: 'Spain' },
    ];
    const visited = matchCityVisits(list, visitRows, [], new Map());
    assert.ok(visited.has(cityKey(list[0])), 'Cuenca Spain should match');
    assert.ok(!visited.has(cityKey(list[1])), 'Cuenca Ecuador should NOT match');
  });

  it('disambiguates same name, same country, different state (Portland OR vs ME)', () => {
    const list = [
      { name: 'Portland', state: 'Oregon', country: 'United States of America', lat: 45.51, lng: -122.68, radiusKm: 12 },
      { name: 'Portland', state: 'Maine', country: 'United States of America', lat: 43.66, lng: -70.26, radiusKm: 10 },
    ];
    const visitRows = [
      { date: '2025-01-01', city: 'Portland', state: 'Oregon', country: 'United States of America' },
    ];
    const visited = matchCityVisits(list, visitRows, [], new Map());
    assert.ok(visited.has(cityKey(list[0])), 'Portland OR should match');
    assert.ok(!visited.has(cityKey(list[1])), 'Portland ME should NOT match');
  });

  it('matches city without state/country data (fallback)', () => {
    const list = [
      { name: 'Timbuktu', lat: 16.77, lng: -3.01, radiusKm: 8 },
    ];
    const visitRows = [
      { date: '2025-01-01', city: 'Timbuktu', state: '', country: '' },
    ];
    const visited = matchCityVisits(list, visitRows, [], new Map());
    assert.ok(visited.has(cityKey(list[0])));
  });
});
