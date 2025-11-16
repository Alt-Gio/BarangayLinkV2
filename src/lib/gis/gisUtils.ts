/**
 * GIS UTILITY FUNCTIONS
 * Comprehensive geospatial analysis tools
 */

import mapboxgl from 'mapbox-gl';

export interface Coordinate {
  lng: number;
  lat: number;
}

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon';
    coordinates: any;
  };
  properties: Record<string, any>;
}

// ============ DISTANCE CALCULATIONS ============

/**
 * Calculate distance between two points (Haversine formula)
 * @returns Distance in meters
 */
export function calculateDistance(
  point1: Coordinate,
  point2: Coordinate
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = toRadians(point1.lat);
  const φ2 = toRadians(point2.lat);
  const Δφ = toRadians(point2.lat - point1.lat);
  const Δλ = toRadians(point2.lng - point1.lng);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate total path length for a line
 */
export function calculatePathLength(coordinates: Coordinate[]): number {
  let totalDistance = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    totalDistance += calculateDistance(coordinates[i], coordinates[i + 1]);
  }
  return totalDistance;
}

// ============ AREA CALCULATIONS ============

/**
 * Calculate polygon area using spherical excess formula
 * @returns Area in square meters
 */
export function calculatePolygonArea(coordinates: Coordinate[]): number {
  if (coordinates.length < 3) return 0;

  const R = 6371000; // Earth's radius in meters
  let area = 0;

  for (let i = 0; i < coordinates.length - 1; i++) {
    const p1 = coordinates[i];
    const p2 = coordinates[i + 1];

    area += toRadians(p2.lng - p1.lng) * (2 + Math.sin(toRadians(p1.lat)) + Math.sin(toRadians(p2.lat)));
  }

  area = (area * R * R) / 2;
  return Math.abs(area);
}

// ============ BUFFER / PROXIMITY ============

/**
 * Create buffer zone around a point
 * @param radius - Buffer radius in meters
 * @returns Array of coordinates forming circle
 */
export function createBuffer(center: Coordinate, radius: number, points: number = 64): Coordinate[] {
  const coords: Coordinate[] = [];
  const distanceX = radius / (111320 * Math.cos(toRadians(center.lat)));
  const distanceY = radius / 110540;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push({
      lng: center.lng + x,
      lat: center.lat + y,
    });
  }
  coords.push(coords[0]); // Close the polygon
  return coords;
}

/**
 * Find all points within radius of center
 */
export function findPointsWithinRadius(
  center: Coordinate,
  points: Array<{ coordinates: Coordinate; data: any }>,
  radius: number
): Array<{ coordinates: Coordinate; data: any; distance: number }> {
  return points
    .map((point) => ({
      ...point,
      distance: calculateDistance(center, point.coordinates),
    }))
    .filter((point) => point.distance <= radius)
    .sort((a, b) => a.distance - b.distance);
}

// ============ POINT IN POLYGON ============

/**
 * Check if point is inside polygon (Ray Casting Algorithm)
 */
export function isPointInPolygon(point: Coordinate, polygon: Coordinate[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng,
      yi = polygon[i].lat;
    const xj = polygon[j].lng,
      yj = polygon[j].lat;

    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }
  return inside;
}

// ============ BEARING / DIRECTION ============

/**
 * Calculate bearing (direction) from point1 to point2
 * @returns Bearing in degrees (0-360)
 */
export function calculateBearing(point1: Coordinate, point2: Coordinate): number {
  const φ1 = toRadians(point1.lat);
  const φ2 = toRadians(point2.lat);
  const Δλ = toRadians(point2.lng - point1.lng);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  return (toDegrees(θ) + 360) % 360;
}

/**
 * Get compass direction from bearing
 */
export function bearingToDirection(bearing: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

// ============ CENTROID CALCULATIONS ============

/**
 * Calculate centroid of polygon
 */
export function calculateCentroid(coordinates: Coordinate[]): Coordinate {
  let x = 0, y = 0;
  coordinates.forEach((coord) => {
    x += coord.lng;
    y += coord.lat;
  });
  return {
    lng: x / coordinates.length,
    lat: y / coordinates.length,
  };
}

// ============ BOUNDS / BBOX ============

/**
 * Calculate bounding box for set of coordinates
 */
export function calculateBounds(
  coordinates: Coordinate[]
): [[number, number], [number, number]] {
  if (coordinates.length === 0) {
    return [
      [0, 0],
      [0, 0],
    ];
  }

  let minLng = coordinates[0].lng;
  let maxLng = coordinates[0].lng;
  let minLat = coordinates[0].lat;
  let maxLat = coordinates[0].lat;

  coordinates.forEach((coord) => {
    minLng = Math.min(minLng, coord.lng);
    maxLng = Math.max(maxLng, coord.lng);
    minLat = Math.min(minLat, coord.lat);
    maxLat = Math.max(maxLat, coord.lat);
  });

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

// ============ GEOJSON CONVERSION ============

/**
 * Convert coordinates to GeoJSON Point
 */
export function toGeoJSONPoint(coordinate: Coordinate, properties: any = {}): GeoJSONFeature {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [coordinate.lng, coordinate.lat],
    },
    properties,
  };
}

/**
 * Convert coordinates array to GeoJSON LineString
 */
export function toGeoJSONLine(coordinates: Coordinate[], properties: any = {}): GeoJSONFeature {
  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: coordinates.map((c) => [c.lng, c.lat]),
    },
    properties,
  };
}

/**
 * Convert coordinates array to GeoJSON Polygon
 */
export function toGeoJSONPolygon(coordinates: Coordinate[], properties: any = {}): GeoJSONFeature {
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates.map((c) => [c.lng, c.lat])],
    },
    properties,
  };
}

/**
 * Create GeoJSON FeatureCollection
 */
export function createFeatureCollection(features: GeoJSONFeature[]): any {
  return {
    type: 'FeatureCollection',
    features,
  };
}

// ============ FORMATTING UTILITIES ============

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters.toFixed(0)}m`;
  }
  return `${(meters / 1000).toFixed(2)}km`;
}

/**
 * Format area for display
 */
export function formatArea(squareMeters: number): string {
  if (squareMeters < 10000) {
    return `${squareMeters.toFixed(0)}m²`;
  }
  const hectares = squareMeters / 10000;
  if (hectares < 100) {
    return `${hectares.toFixed(2)}ha`;
  }
  return `${(hectares / 100).toFixed(2)}km²`;
}

// ============ HELPER FUNCTIONS ============

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Interpolate between two coordinates
 */
export function interpolateCoordinate(
  start: Coordinate,
  end: Coordinate,
  fraction: number
): Coordinate {
  return {
    lng: start.lng + (end.lng - start.lng) * fraction,
    lat: start.lat + (end.lat - start.lat) * fraction,
  };
}

/**
 * Simplify line using Douglas-Peucker algorithm
 */
export function simplifyLine(
  coordinates: Coordinate[],
  tolerance: number = 0.0001
): Coordinate[] {
  if (coordinates.length <= 2) return coordinates;

  const simplified: Coordinate[] = [coordinates[0]];
  simplifyDouglasPeucker(coordinates, 0, coordinates.length - 1, tolerance, simplified);
  simplified.push(coordinates[coordinates.length - 1]);
  return simplified;
}

function simplifyDouglasPeucker(
  coords: Coordinate[],
  first: number,
  last: number,
  tolerance: number,
  simplified: Coordinate[]
) {
  let maxDistance = 0;
  let index = 0;

  for (let i = first + 1; i < last; i++) {
    const distance = perpendicularDistance(coords[i], coords[first], coords[last]);
    if (distance > maxDistance) {
      maxDistance = distance;
      index = i;
    }
  }

  if (maxDistance > tolerance) {
    simplifyDouglasPeucker(coords, first, index, tolerance, simplified);
    simplified.push(coords[index]);
    simplifyDouglasPeucker(coords, index, last, tolerance, simplified);
  }
}

function perpendicularDistance(
  point: Coordinate,
  lineStart: Coordinate,
  lineEnd: Coordinate
): number {
  const dx = lineEnd.lng - lineStart.lng;
  const dy = lineEnd.lat - lineStart.lat;

  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag === 0) return calculateDistance(point, lineStart);

  const u =
    ((point.lng - lineStart.lng) * dx + (point.lat - lineStart.lat) * dy) / (mag * mag);

  if (u < 0) return calculateDistance(point, lineStart);
  if (u > 1) return calculateDistance(point, lineEnd);

  const intersect = {
    lng: lineStart.lng + u * dx,
    lat: lineStart.lat + u * dy,
  };

  return calculateDistance(point, intersect);
}
