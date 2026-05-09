// ABOUTME: Unit tests for US state and Canadian province parsing and lookup.
// ABOUTME: Tests state extraction from CSV and point-in-polygon state lookup.

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  extractStateFromField,
  lookupState,
  buildStateMap,
  parseCsvToStateMap,
} from '../locations.js';

let usTopo, caTopo;
before(() => {
  usTopo = JSON.parse(
    readFileSync(new URL('../us-states-10m.json', import.meta.url), 'utf-8')
  );
  caTopo = JSON.parse(
    readFileSync(new URL('../ca-provinces.json', import.meta.url), 'utf-8')
  );
});

describe('extractStateFromField', () => {
  it('extracts US state from "CA 94128"', () => {
    assert.strictEqual(extractStateFromField('CA 94128'), 'California');
  });

  it('extracts US state from "DC 20008"', () => {
    assert.strictEqual(
      extractStateFromField('DC 20008'),
      'District of Columbia'
    );
  });

  it('extracts US state from bare abbreviation "NY"', () => {
    assert.strictEqual(extractStateFromField('NY'), 'New York');
  });

  it('extracts Canadian province from "BC V6Z 1S2"', () => {
    assert.strictEqual(
      extractStateFromField('BC V6Z 1S2'),
      'British Columbia'
    );
  });

  it('extracts Canadian province from "ON"', () => {
    assert.strictEqual(extractStateFromField('ON'), 'Ontario');
  });

  it('handles full state name "California"', () => {
    assert.strictEqual(extractStateFromField('California'), 'California');
  });

  it('handles full province name "Quebec"', () => {
    assert.strictEqual(extractStateFromField('Quebec'), 'Quebec');
  });

  it('handles "Washington DC" and variants', () => {
    assert.strictEqual(
      extractStateFromField('Washington DC'),
      'District of Columbia'
    );
    assert.strictEqual(
      extractStateFromField('Washington D.C.'),
      'District of Columbia'
    );
    assert.strictEqual(extractStateFromField('D.C.'), 'District of Columbia');
  });

  it('handles case-insensitive full names', () => {
    assert.strictEqual(extractStateFromField('new york'), 'New York');
    assert.strictEqual(extractStateFromField('TEXAS'), 'Texas');
    assert.strictEqual(
      extractStateFromField('british columbia'),
      'British Columbia'
    );
  });

  it('returns null for non-US/CA values', () => {
    assert.strictEqual(extractStateFromField('75008 Paris'), null);
    assert.strictEqual(extractStateFromField('28003 Madrid'), null);
  });

  it('returns null for empty input', () => {
    assert.strictEqual(extractStateFromField(''), null);
    assert.strictEqual(extractStateFromField(null), null);
  });
});

describe('lookupState', () => {
  it('identifies San Francisco as California', () => {
    const state = lookupState(37.7749, -122.4194, usTopo, caTopo);
    assert.strictEqual(state, 'California');
  });

  it('identifies New York City as New York', () => {
    const state = lookupState(40.7128, -74.006, usTopo, caTopo);
    assert.strictEqual(state, 'New York');
  });

  it('identifies Toronto as Ontario', () => {
    const state = lookupState(43.6532, -79.3832, usTopo, caTopo);
    assert.strictEqual(state, 'Ontario');
  });

  it('identifies Vancouver as British Columbia', () => {
    const state = lookupState(49.2827, -123.1207, usTopo, caTopo);
    assert.strictEqual(state, 'British Columbia');
  });

  it('returns null for coordinates outside US/Canada', () => {
    const state = lookupState(51.5074, -0.1278, usTopo, caTopo);
    assert.strictEqual(state, null);
  });
});

describe('buildStateMap', () => {
  it('builds state map from coordinates', () => {
    const coords = [
      { lat: 37.7749, lng: -122.4194, time: '2025-01-01T00:00:00Z' },
      { lat: 40.7128, lng: -74.006, time: '2025-02-01T00:00:00Z' },
      { lat: 37.7749, lng: -122.4194, time: '2025-03-01T00:00:00Z' },
    ];
    const map = buildStateMap(coords, usTopo, caTopo);
    assert.strictEqual(map.get('California').visitCount, 2);
    assert.strictEqual(map.get('New York').visitCount, 1);
  });

  it('skips coordinates outside US/Canada', () => {
    const coords = [
      { lat: 51.5074, lng: -0.1278, time: '2025-01-01T00:00:00Z' },
    ];
    const map = buildStateMap(coords, usTopo, caTopo);
    assert.strictEqual(map.size, 0);
  });
});

describe('parseCsvToStateMap', () => {
  it('parses CSV with State/Zip column', () => {
    const csv = 'Date,Address,City,State/Zip,Country\n'
      + '2017-06-15T16:36:33Z,123 Main,Washington,DC 20008,USA\n'
      + '2017-07-01T10:00:00Z,456 St,San Fran,CA 94128,USA\n';
    const { stateMap, errors } = parseCsvToStateMap(csv);
    assert.strictEqual(stateMap.size, 2);
    assert.ok(stateMap.has('District of Columbia'));
    assert.ok(stateMap.has('California'));
    assert.strictEqual(errors.length, 0);
  });

  it('skips rows without recognizable state', () => {
    const csv = 'Date,Address,City,State/Zip,Country\n'
      + '2017-06-15T16:36:33Z,123 Rue,Paris,75008 Paris,France\n';
    const { stateMap, errors } = parseCsvToStateMap(csv);
    assert.strictEqual(stateMap.size, 0);
    assert.strictEqual(errors.length, 0);
  });

  it('uses State column if present', () => {
    const csv = 'Date,State,Country\n'
      + '2017-01-01T00:00:00Z,New York,USA\n';
    const { stateMap } = parseCsvToStateMap(csv);
    assert.strictEqual(stateMap.size, 1);
    assert.ok(stateMap.has('New York'));
  });
});
