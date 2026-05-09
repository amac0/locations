// ABOUTME: Unit tests for Timeline.json parsing functions.
// ABOUTME: Tests coordinate extraction from visit and activity segments.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseLatLng, extractCoordinates } from '../locations.js';

describe('parseLatLng', () => {
  it('parses degree notation with positive values', () => {
    const result = parseLatLng('48.8566°, 2.3522°');
    assert.deepStrictEqual(result, { lat: 48.8566, lng: 2.3522 });
  });

  it('parses degree notation with negative longitude', () => {
    const result = parseLatLng('51.5074°, -0.1278°');
    assert.deepStrictEqual(result, { lat: 51.5074, lng: -0.1278 });
  });

  it('parses degree notation with negative latitude', () => {
    const result = parseLatLng('-33.8688°, 151.2093°');
    assert.deepStrictEqual(result, { lat: -33.8688, lng: 151.2093 });
  });

  it('returns null for empty string', () => {
    const result = parseLatLng('');
    assert.strictEqual(result, null);
  });

  it('returns null for malformed input', () => {
    const result = parseLatLng('not a coordinate');
    assert.strictEqual(result, null);
  });
});

describe('extractCoordinates', () => {
  it('extracts coordinates from visit segments', () => {
    const data = {
      semanticSegments: [{
        startTime: '2025-09-01T10:00:00.000+01:00',
        visit: {
          topCandidate: {
            placeLocation: { latLng: '51.5074°, -0.1278°' }
          }
        }
      }]
    };
    const coords = extractCoordinates(data);
    assert.strictEqual(coords.length, 1);
    assert.deepStrictEqual(coords[0].lat, 51.5074);
    assert.deepStrictEqual(coords[0].lng, -0.1278);
    assert.strictEqual(coords[0].time, '2025-09-01T10:00:00.000+01:00');
  });

  it('extracts start and end from activity segments', () => {
    const data = {
      semanticSegments: [{
        startTime: '2025-10-10T09:00:00.000-04:00',
        activity: {
          start: { latLng: '40.7128°, -74.0060°' },
          end: { latLng: '40.7580°, -73.9855°' }
        }
      }]
    };
    const coords = extractCoordinates(data);
    assert.strictEqual(coords.length, 2);
    assert.deepStrictEqual(coords[0].lat, 40.7128);
    assert.deepStrictEqual(coords[1].lat, 40.758);
  });

  it('skips timelinePath segments', () => {
    const data = {
      semanticSegments: [{
        startTime: '2025-08-29T11:00:00.000+01:00',
        timelinePath: [
          { point: '51.5291535°, -0.179714°', time: '2025-08-29T11:42:00.000+01:00' }
        ]
      }]
    };
    const coords = extractCoordinates(data);
    assert.strictEqual(coords.length, 0);
  });

  it('skips segments with missing placeLocation', () => {
    const data = {
      semanticSegments: [{
        startTime: '2025-09-01T10:00:00.000+01:00',
        visit: {
          topCandidate: {
            placeId: 'abc'
          }
        }
      }]
    };
    const coords = extractCoordinates(data);
    assert.strictEqual(coords.length, 0);
  });

  it('handles empty semanticSegments', () => {
    const coords = extractCoordinates({ semanticSegments: [] });
    assert.strictEqual(coords.length, 0);
  });

  it('handles missing semanticSegments key', () => {
    const coords = extractCoordinates({});
    assert.strictEqual(coords.length, 0);
  });
});
