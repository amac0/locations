// ABOUTME: Unit tests for point-in-polygon country lookup.
// ABOUTME: Verifies that coordinates map to correct country names.

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lookupCountry, buildCountryMap, COUNTRY_NAMES } from '../locations.js';

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

describe('COUNTRY_NAMES', () => {
  it('does not map code 720 (formerly Yemen, not South Sudan)', () => {
    assert.strictEqual(COUNTRY_NAMES['720'], undefined);
  });

  it('maps code 728 to South Sudan', () => {
    assert.strictEqual(COUNTRY_NAMES['728'], 'South Sudan');
  });
});
