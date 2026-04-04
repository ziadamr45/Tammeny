// Haversine formula for distance calculation
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Calculate ETA based on distance and average speed
export function calculateETA(distanceKm: number, speedKmH: number = 30): number {
  // Returns ETA in minutes
  return Math.round((distanceKm / speedKmH) * 60);
}

// Format distance for display
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} م`;
  }
  return `${distanceKm.toFixed(1)} كم`;
}

// Format duration for display
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} دقيقة`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} ساعة`;
  }
  return `${hours} ساعة ${mins} دقيقة`;
}

// Format speed for display
export function formatSpeed(speedKmH: number): string {
  return `${Math.round(speedKmH)} كم/س`;
}

// Check if point is within geofence
export function isInGeofence(
  centerLat: number,
  centerLng: number,
  pointLat: number,
  pointLng: number,
  radiusMeters: number
): boolean {
  const distance = haversineDistance(centerLat, centerLng, pointLat, pointLng);
  return distance * 1000 <= radiusMeters; // Convert km to meters
}

// Calculate bearing between two points
export function calculateBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  
  let bearing = Math.atan2(y, x) * (180 / Math.PI);
  return (bearing + 360) % 360;
}

// Get direction name from bearing
export function getDirectionName(bearing: number): string {
  const directions = [
    { min: 337.5, max: 360, name: 'شمال' },
    { min: 0, max: 22.5, name: 'شمال' },
    { min: 22.5, max: 67.5, name: 'شمال شرق' },
    { min: 67.5, max: 112.5, name: 'شرق' },
    { min: 112.5, max: 157.5, name: 'جنوب شرق' },
    { min: 157.5, max: 202.5, name: 'جنوب' },
    { min: 202.5, max: 247.5, name: 'جنوب غرب' },
    { min: 247.5, max: 292.5, name: 'غرب' },
    { min: 292.5, max: 337.5, name: 'شمال غرب' },
  ];
  
  const direction = directions.find(d => bearing >= d.min && bearing < d.max);
  return direction?.name || 'شمال';
}
