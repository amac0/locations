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

  it('index.html has export buttons for SVG, PNG, and JS widget', () => {
    const html = readFileSync(
      new URL('../index.html', import.meta.url), 'utf-8'
    );
    assert.ok(html.includes('export-svg-btn'), 'Should have SVG export button');
    assert.ok(html.includes('export-png-btn'), 'Should have PNG export button');
    assert.ok(html.includes('export-js-btn'), 'Should have JS export button');
    assert.ok(html.includes('exportSvg'), 'Should have SVG export function');
    assert.ok(html.includes('exportPng'), 'Should have PNG export function');
    assert.ok(html.includes('exportJs'), 'Should have JS export function');
  });

  it('index.html has zoom and pan functionality', () => {
    const html = readFileSync(
      new URL('../index.html', import.meta.url), 'utf-8'
    );
    assert.ok(html.includes('d3.zoom'), 'Should use d3.zoom');
    assert.ok(html.includes('reset-zoom-btn'), 'Should have reset zoom button');
    assert.ok(html.includes('zoomIdentity'), 'Should reset to zoomIdentity');
  });
});
