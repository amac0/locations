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
