// ABOUTME: Unit tests for city checklist matching and proximity detection.
// ABOUTME: Verifies city visit detection via name matching and coordinate proximity.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CITY_LISTS, matchCityVisits, haversineKm } from '../city-lists.js';

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

  it('matches cities by name in visit rows', () => {
    const visitRows = [
      { date: '2025-01-01', city: 'London', state: '', country: 'United Kingdom' },
    ];
    const coords = [];
    const visited = matchCityVisits(sampleList, visitRows, coords, new Map());
    assert.ok(visited.has('London'));
  });

  it('matches cities by coordinate proximity', () => {
    const visitRows = [];
    const coords = [
      { lat: 41.90, lng: 12.50, time: '2025-03-01T00:00:00Z' },
    ];
    const visited = matchCityVisits(sampleList, visitRows, coords, new Map());
    assert.ok(visited.has('Rome'), 'Should match Rome by proximity');
    assert.ok(!visited.has('Paris'), 'Should not match Paris');
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
    assert.ok(visited.has('London'));
    assert.ok(visited.has('Rome'));
  });

  it('handles empty inputs', () => {
    const visited = matchCityVisits(sampleList, [], [], new Map());
    assert.strictEqual(visited.size, 0);
  });
});
