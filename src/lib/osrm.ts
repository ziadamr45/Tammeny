// OSRM Routing API Integration
// Using public OSRM server for routing

const OSRM_SERVER = 'https://router.project-osrm.org';

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface RouteInfo {
  distance: number; // meters
  duration: number; // seconds
  geometry: [number, number][];
  steps: RouteStep[];
}

export interface RouteStep {
  distance: number;
  duration: number;
  instruction: string;
  name: string;
}

// Get route between two points
export async function getRoute(
  start: RoutePoint,
  end: RoutePoint
): Promise<RouteInfo | null> {
  try {
    const response = await fetch(
      `${OSRM_SERVER}/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true`
    );
    
    if (!response.ok) {
      throw new Error('OSRM request failed');
    }
    
    const data = await response.json();
    
    if (data.code !== 'Ok' || !data.routes?.length) {
      return null;
    }
    
    const route = data.routes[0];
    
    return {
      distance: route.distance,
      duration: route.duration,
      geometry: route.geometry.coordinates,
      steps: route.legs[0]?.steps?.map((step: Record<string, unknown>) => ({
        distance: step.distance,
        duration: step.duration,
        instruction: step.maneuver?.instruction || '',
        name: step.name || '',
      })) || [],
    };
  } catch (error) {
    console.error('OSRM routing error:', error);
    return null;
  }
}

// Get nearest road point
export async function getNearestRoad(point: RoutePoint): Promise<RoutePoint | null> {
  try {
    const response = await fetch(
      `${OSRM_SERVER}/nearest/v1/driving/${point.lng},${point.lat}`
    );
    
    if (!response.ok) {
      throw new Error('OSRM nearest request failed');
    }
    
    const data = await response.json();
    
    if (data.code !== 'Ok' || !data.waypoints?.length) {
      return null;
    }
    
    const location = data.waypoints[0].location;
    return {
      lng: location[0],
      lat: location[1],
    };
  } catch (error) {
    console.error('OSRM nearest error:', error);
    return null;
  }
}

// Get route table (distance matrix)
export async function getRouteTable(
  sources: RoutePoint[],
  destinations: RoutePoint[]
): Promise<{ distances: number[][]; durations: number[][] } | null> {
  try {
    const sourcesStr = sources.map(p => `${p.lng},${p.lat}`).join(';');
    const destsStr = destinations.map(p => `${p.lng},${p.lat}`).join(';');
    const sourcesIndices = sources.map((_, i) => i).join(';');
    const destsIndices = destinations.map((_, i) => i + sources.length).join(';');
    
    const response = await fetch(
      `${OSRM_SERVER}/table/v1/driving/${sourcesStr};${destsStr}?sources=${sourcesIndices}&destinations=${destsIndices}&annotations=duration,distance`
    );
    
    if (!response.ok) {
      throw new Error('OSRM table request failed');
    }
    
    const data = await response.json();
    
    if (data.code !== 'Ok') {
      return null;
    }
    
    return {
      distances: data.distances,
      durations: data.durations,
    };
  } catch (error) {
    console.error('OSRM table error:', error);
    return null;
  }
}

// Decode polyline (for alternative routing services)
export function decodePolyline(encoded: string): [number, number][] {
  const coordinates: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  
  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    
    shift = 0;
    result = 0;
    
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    
    coordinates.push([lng / 1e5, lat / 1e5]);
  }
  
  return coordinates;
}
