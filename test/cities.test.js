// ABOUTME: Unit tests for city checklist matching.
// ABOUTME: Verifies city visit detection against curated city lists.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CITY_LISTS, matchCityVisits } from '../city-lists.js';

describe('CITY_LISTS data', () => {
  it('top50 has exactly 50 cities', () => {
    assert.strictEqual(CITY_LISTS.top50.cities.length, 50);
  });

  it('unesco has at least 100 cities', () => {
    assert.ok(CITY_LISTS.unesco.cities.length >= 100);
  });

  it('all top50 cities have name and country', () => {
    for (const city of CITY_LISTS.top50.cities) {
      assert.ok(city.name, `Missing name in top50`);
      assert.ok(city.country, `Missing country for ${city.name}`);
    }
  });

  it('all unesco cities have name, country, and year', () => {
    for (const city of CITY_LISTS.unesco.cities) {
      assert.ok(city.name, `Missing name in unesco`);
      assert.ok(city.country, `Missing country for ${city.name}`);
      assert.ok(city.year, `Missing year for ${city.name}`);
    }
  });
});

describe('matchCityVisits', () => {
  const sampleList = [
    { name: 'London', country: 'United Kingdom' },
    { name: 'Paris', country: 'France' },
    { name: 'Tokyo', country: 'Japan' },
    { name: 'New York City', country: 'United States of America' },
  ];

  it('matches cities by exact name in visit rows', () => {
    const visitRows = [
      { date: '2025-01-01', city: 'London', state: '', country: 'United Kingdom' },
      { date: '2025-02-01', city: 'Paris', state: '', country: 'France' },
    ];
    const countryData = new Map([
      ['United Kingdom', { visitCount: 1 }],
      ['France', { visitCount: 1 }],
    ]);
    const visited = matchCityVisits(sampleList, visitRows, countryData);
    assert.strictEqual(visited.size, 2);
    assert.ok(visited.has('London'));
    assert.ok(visited.has('Paris'));
    assert.ok(!visited.has('Tokyo'));
  });

  it('matches case-insensitively', () => {
    const visitRows = [
      { date: '2025-01-01', city: 'london', state: '', country: 'United Kingdom' },
    ];
    const countryData = new Map([
      ['United Kingdom', { visitCount: 1 }],
    ]);
    const visited = matchCityVisits(sampleList, visitRows, countryData);
    assert.ok(visited.has('London'));
  });

  it('returns empty set with no matching visits', () => {
    const visitRows = [
      { date: '2025-01-01', city: 'Berlin', state: '', country: 'Germany' },
    ];
    const countryData = new Map([['Germany', { visitCount: 1 }]]);
    const visited = matchCityVisits(sampleList, visitRows, countryData);
    assert.strictEqual(visited.size, 0);
  });

  it('handles empty visit data', () => {
    const visited = matchCityVisits(sampleList, [], new Map());
    assert.strictEqual(visited.size, 0);
  });
});
