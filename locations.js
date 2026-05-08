// ABOUTME: Pure functions for processing Google Takeout Timeline.json data.
// ABOUTME: Extracts coordinates from visit/activity segments and looks up countries.

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
