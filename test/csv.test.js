// ABOUTME: Unit tests for CSV parsing and country name normalization.
// ABOUTME: Verifies CSV import and merging with Timeline.json country data.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeCountryName,
  parseCsvToCountryMap,
  mergeCountryMaps,
  parseDateStr,
} from '../locations.js';

describe('parseDateStr', () => {
  it('parses ISO date strings', () => {
    const d = parseDateStr('2017-06-15T16:36:33Z');
    assert.ok(d instanceof Date);
    assert.strictEqual(d.getUTCFullYear(), 2017);
  });

  it('parses m/yyyy format', () => {
    const d = parseDateStr('6/2017');
    assert.ok(d instanceof Date);
    assert.strictEqual(d.getUTCFullYear(), 2017);
    assert.strictEqual(d.getUTCMonth(), 5); // June = 5
    assert.strictEqual(d.getUTCDate(), 1);
  });

  it('parses mm/yyyy format', () => {
    const d = parseDateStr('12/2019');
    assert.ok(d instanceof Date);
    assert.strictEqual(d.getUTCFullYear(), 2019);
    assert.strictEqual(d.getUTCMonth(), 11); // December = 11
  });

  it('returns null for invalid strings', () => {
    assert.strictEqual(parseDateStr('not-a-date'), null);
    assert.strictEqual(parseDateStr(''), null);
  });

  it('parses yyyy-mm-dd format', () => {
    const d = parseDateStr('2020-03-15');
    assert.ok(d instanceof Date);
    assert.strictEqual(d.getUTCFullYear(), 2020);
  });

  it('parses m/d/yyyy format', () => {
    const d = parseDateStr('3/15/2020');
    assert.ok(d instanceof Date);
    assert.strictEqual(d.getUTCFullYear(), 2020);
    assert.strictEqual(d.getUTCMonth(), 2); // March = 2
    assert.strictEqual(d.getUTCDate(), 15);
  });

  it('parses mm/dd/yyyy format', () => {
    const d = parseDateStr('12/25/2019');
    assert.ok(d instanceof Date);
    assert.strictEqual(d.getUTCFullYear(), 2019);
    assert.strictEqual(d.getUTCMonth(), 11);
    assert.strictEqual(d.getUTCDate(), 25);
  });

  it('parses bare year (e.g., "2017")', () => {
    const d = parseDateStr('2017');
    assert.ok(d instanceof Date);
    assert.strictEqual(d.getUTCFullYear(), 2017);
    assert.strictEqual(d.getUTCMonth(), 0);
    assert.strictEqual(d.getUTCDate(), 1);
  });

  it('returns null for invalid month 0/yyyy', () => {
    assert.strictEqual(parseDateStr('0/2020'), null);
  });

  it('returns null for invalid month 13/yyyy', () => {
    assert.strictEqual(parseDateStr('13/2020'), null);
  });
});

describe('normalizeCountryName', () => {
  it('normalizes "USA" to canonical name', () => {
    assert.strictEqual(
      normalizeCountryName('USA'),
      'United States of America'
    );
  });

  it('normalizes "United States" to canonical name', () => {
    assert.strictEqual(
      normalizeCountryName('United States'),
      'United States of America'
    );
  });

  it('normalizes "UK" to canonical name', () => {
    assert.strictEqual(
      normalizeCountryName('UK'),
      'United Kingdom'
    );
  });

  it('normalizes "England" to United Kingdom', () => {
    assert.strictEqual(
      normalizeCountryName('England'),
      'United Kingdom'
    );
  });

  it('normalizes "Czech Republic" to Czechia', () => {
    assert.strictEqual(
      normalizeCountryName('Czech Republic'),
      'Czechia'
    );
  });

  it('normalizes "South Korea" to match COUNTRY_NAMES', () => {
    assert.strictEqual(
      normalizeCountryName('South Korea'),
      'South Korea'
    );
  });

  it('handles case-insensitive input', () => {
    assert.strictEqual(
      normalizeCountryName('usa'),
      'United States of America'
    );
  });

  it('trims whitespace', () => {
    assert.strictEqual(
      normalizeCountryName('  France  '),
      'France'
    );
  });

  it('passes through already-canonical names', () => {
    assert.strictEqual(normalizeCountryName('France'), 'France');
    assert.strictEqual(normalizeCountryName('Germany'), 'Germany');
    assert.strictEqual(normalizeCountryName('Japan'), 'Japan');
  });

  it('returns null for empty input', () => {
    assert.strictEqual(normalizeCountryName(''), null);
    assert.strictEqual(normalizeCountryName(null), null);
    assert.strictEqual(normalizeCountryName(undefined), null);
  });

  it('returns the input trimmed for unknown names', () => {
    assert.strictEqual(
      normalizeCountryName('Atlantis'),
      'Atlantis'
    );
  });
});

describe('parseCsvToCountryMap', () => {
  it('parses CSV with Date and Country columns', () => {
    const csv = 'Date,Address,City,State/Zip,Country\n'
      + '2017-06-15T16:36:33Z,123 Main St,Washington,DC,USA\n'
      + '2017-07-01T10:00:00Z,456 Rue,Paris,,France\n';
    const { countryMap, errors } = parseCsvToCountryMap(csv);
    assert.strictEqual(countryMap.size, 2);
    assert.ok(countryMap.has('United States of America'));
    assert.ok(countryMap.has('France'));
    assert.strictEqual(errors.length, 0);
  });

  it('aggregates multiple visits to same country', () => {
    const csv = 'Date,Country\n'
      + '2017-01-01T00:00:00Z,USA\n'
      + '2017-06-01T00:00:00Z,USA\n'
      + '2018-01-01T00:00:00Z,United States\n';
    const { countryMap } = parseCsvToCountryMap(csv);
    assert.strictEqual(countryMap.size, 1);
    const usa = countryMap.get('United States of America');
    assert.strictEqual(usa.visitCount, 3);
    assert.deepStrictEqual(
      usa.firstVisit,
      new Date('2017-01-01T00:00:00Z')
    );
    assert.deepStrictEqual(
      usa.lastVisit,
      new Date('2018-01-01T00:00:00Z')
    );
  });

  it('reports errors for rows with missing country', () => {
    const csv = 'Date,Country\n'
      + '2017-01-01T00:00:00Z,USA\n'
      + '2017-02-01T00:00:00Z,\n';
    const { countryMap, errors } = parseCsvToCountryMap(csv);
    assert.strictEqual(countryMap.size, 1);
    assert.strictEqual(errors.length, 1);
    assert.ok(errors[0].includes('Row 3'));
  });

  it('reports errors for rows with invalid date', () => {
    const csv = 'Date,Country\n'
      + 'not-a-date,France\n';
    const { countryMap, errors } = parseCsvToCountryMap(csv);
    assert.strictEqual(countryMap.size, 0);
    assert.strictEqual(errors.length, 1);
    assert.ok(errors[0].includes('Row 2'));
  });

  it('finds Date and Country columns case-insensitively', () => {
    const csv = 'date,country\n'
      + '2017-01-01T00:00:00Z,France\n';
    const { countryMap, errors } = parseCsvToCountryMap(csv);
    assert.strictEqual(countryMap.size, 1);
    assert.ok(countryMap.has('France'));
    assert.strictEqual(errors.length, 0);
  });

  it('returns error if Date column missing', () => {
    const csv = 'Country,City\nUSA,NYC\n';
    const { countryMap, errors } = parseCsvToCountryMap(csv);
    assert.strictEqual(countryMap.size, 0);
    assert.strictEqual(errors.length, 1);
    assert.ok(errors[0].toLowerCase().includes('date'));
  });

  it('returns error if Country column missing', () => {
    const csv = 'Date,City\n2017-01-01T00:00:00Z,NYC\n';
    const { countryMap, errors } = parseCsvToCountryMap(csv);
    assert.strictEqual(countryMap.size, 0);
    assert.strictEqual(errors.length, 1);
    assert.ok(errors[0].toLowerCase().includes('country'));
  });

  it('parses dates in m/yyyy format', () => {
    const csv = 'Date,Country\n'
      + '6/2017,France\n'
      + '12/2019,Germany\n';
    const { countryMap, errors } = parseCsvToCountryMap(csv);
    assert.strictEqual(errors.length, 0);
    assert.strictEqual(countryMap.size, 2);
    const france = countryMap.get('France');
    assert.strictEqual(france.firstVisit.getUTCFullYear(), 2017);
    assert.strictEqual(france.firstVisit.getUTCMonth(), 5);
  });

  it('handles empty CSV', () => {
    const csv = '';
    const { countryMap, errors } = parseCsvToCountryMap(csv);
    assert.strictEqual(countryMap.size, 0);
    assert.ok(errors.length > 0);
  });
});

describe('mergeCountryMaps', () => {
  it('merges two maps with distinct countries', () => {
    const a = new Map([
      ['France', { firstVisit: new Date('2020-01-01'), lastVisit: new Date('2020-06-01'), visitCount: 2 }],
    ]);
    const b = new Map([
      ['Germany', { firstVisit: new Date('2021-01-01'), lastVisit: new Date('2021-06-01'), visitCount: 1 }],
    ]);
    const merged = mergeCountryMaps(a, b);
    assert.strictEqual(merged.size, 2);
    assert.ok(merged.has('France'));
    assert.ok(merged.has('Germany'));
  });

  it('merges overlapping countries correctly', () => {
    const a = new Map([
      ['France', { firstVisit: new Date('2020-01-01'), lastVisit: new Date('2020-06-01'), visitCount: 2 }],
    ]);
    const b = new Map([
      ['France', { firstVisit: new Date('2019-01-01'), lastVisit: new Date('2021-06-01'), visitCount: 3 }],
    ]);
    const merged = mergeCountryMaps(a, b);
    assert.strictEqual(merged.size, 1);
    const france = merged.get('France');
    assert.strictEqual(france.visitCount, 5);
    assert.deepStrictEqual(france.firstVisit, new Date('2019-01-01'));
    assert.deepStrictEqual(france.lastVisit, new Date('2021-06-01'));
  });

  it('handles empty maps', () => {
    const a = new Map();
    const b = new Map([
      ['France', { firstVisit: new Date('2020-01-01'), lastVisit: new Date('2020-06-01'), visitCount: 1 }],
    ]);
    const merged = mergeCountryMaps(a, b);
    assert.strictEqual(merged.size, 1);
  });
});
