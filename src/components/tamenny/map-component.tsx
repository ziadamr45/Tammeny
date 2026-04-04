"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Navigation, AlertCircle, Clock, Route } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

// Types
interface Location {
  lat: number;
  lng: number;
  name?: string;
}

interface Waypoint {
  lat: number;
  lng: number;
  name?: string;
  type?: "start" | "end" | "waypoint";
}

interface RouteInfo {
  distance: number; // in km
  duration: number; // in minutes
  progress?: number; // 0-100
}

interface MapComponentProps {
  center?: Location;
  destination?: Location | null;
  waypoints?: Waypoint[];
  showRoute?: boolean;
  markerLabel?: string;
  destinationLabel?: string;
  className?: string;
  onLocationSelect?: (location: Location) => void;
  interactive?: boolean;
  showUserLocation?: boolean;
  routeStyle?: "planned" | "active" | "completed";
  routeColor?: string;
  animateMarker?: boolean;
  routeInfo?: RouteInfo | null;
  onRouteComplete?: () => void;
}

// Default location (0,0 - will be updated with user's actual location)
const DEFAULT_LOCATION: Location = {
  lat: 0,
  lng: 0,
  name: "موقعك الحالي",
};

// World bounds (no restriction)
const WORLD_BOUNDS = {
  north: 90,
  south: -90,
  east: 180,
  west: -180,
};

export function MapComponent({
  center = DEFAULT_LOCATION,
  destination,
  waypoints = [],
  showRoute = false,
  markerLabel = "موقعك الحالي",
  destinationLabel = "الوجهة",
  className,
  onLocationSelect,
  interactive = false,
  showUserLocation = true,
  routeStyle = "active",
  routeColor,
  animateMarker = false,
  routeInfo,
  onRouteComplete,
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routeRef = useRef<L.Polyline | null>(null);
  const waypointMarkersRef = useRef<L.Marker[]>([]);
  const animatedMarkerRef = useRef<L.Marker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Get current theme (handle hydration)
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark');

  // Load Leaflet dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        const L = await import("leaflet");
        
        // Fix default marker icons
        delete (L.default.Icon.Default.prototype as { _getIconUrl?: () => string })._getIconUrl;
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });
        
        setLeafletLoaded(true);
      } catch (error) {
        console.error("Failed to load Leaflet:", error);
      }
    };
    
    loadLeaflet();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded || mapInstance) return;

    const initMap = async () => {
      const L = await import("leaflet");
      
      const map = L.default.map(mapRef.current!, {
        center: [center.lat, center.lng],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
        // No bounds restriction - works anywhere in the world
        minZoom: 2,
      });

      // Choose tile layer based on theme
      // Carto Dark Matter for dark mode, OpenStreetMap for light mode
      const tileUrl = isDark 
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

      const tileLayer = L.default.tileLayer(tileUrl, {
        maxZoom: 19,
        attribution: isDark ? '&copy; <a href="https://carto.com/">CARTO</a>' : '',
      }).addTo(map);

      tileLayerRef.current = tileLayer;

      // Add zoom control to the bottom-left for RTL
      L.default.control.zoom({ position: "bottomleft" }).addTo(map);

      mapInstanceRef.current = map;
      setMapInstance(map);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leafletLoaded, isDark, center.lat, center.lng]);

  // Update center when location changes
  useEffect(() => {
    if (!mapInstance) return;
    
    mapInstance.setView([center.lat, center.lng], mapInstance.getZoom());
  }, [center, mapInstance]);

  // Update tile layer when theme changes
  useEffect(() => {
    if (!mapInstance || !leafletLoaded) return;

    const updateTileLayer = async () => {
      const L = await import("leaflet");
      
      // Remove existing tile layer
      if (tileLayerRef.current) {
        mapInstance.removeLayer(tileLayerRef.current);
      }

      // Add new tile layer based on current theme
      const tileUrl = isDark 
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

      const tileLayer = L.default.tileLayer(tileUrl, {
        maxZoom: 19,
        attribution: isDark ? '&copy; <a href="https://carto.com/">CARTO</a>' : '',
      }).addTo(mapInstance);

      // Make sure tile layer is behind markers
      tileLayer.bringToBack();
      tileLayerRef.current = tileLayer;
    };

    updateTileLayer();
  }, [isDark, mapInstance, leafletLoaded]);

  // Get route style based on type
  const getRouteStyle = useCallback(() => {
    const baseColor = routeColor || "#0d9488";
    
    switch (routeStyle) {
      case "planned":
        return {
          color: "#94a3b8",
          weight: 4,
          opacity: 0.6,
          dashArray: "10, 10",
        };
      case "active":
        return {
          color: baseColor,
          weight: 5,
          opacity: 0.9,
        };
      case "completed":
        return {
          color: "#22c55e",
          weight: 4,
          opacity: 0.8,
        };
      default:
        return {
          color: baseColor,
          weight: 4,
          opacity: 0.8,
        };
    }
  }, [routeStyle, routeColor]);

  // Add user location marker
  useEffect(() => {
    if (!mapInstance || !leafletLoaded || !showUserLocation) return;

    const addMarker = async () => {
      const L = await import("leaflet");
      
      // Clear existing markers (but not destination or waypoint markers)
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      // Create custom icon for user location
      const userIcon = L.default.divIcon({
        html: `
          <div class="relative">
            <div class="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/20 animate-ping"></div>
            <div class="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/40"></div>
            <div class="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500 flex items-center justify-center shadow-lg">
              <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
          </div>
        `,
        className: "user-location-marker",
        iconSize: [50, 50],
        iconAnchor: [25, 25],
      });

      const marker = L.default.marker([center.lat, center.lng], { icon: userIcon })
        .addTo(mapInstance)
        .bindPopup(markerLabel);

      markersRef.current.push(marker);
    };

    addMarker();
  }, [center, mapInstance, leafletLoaded, showUserLocation, markerLabel]);

  // Add waypoints
  useEffect(() => {
    if (!mapInstance || !leafletLoaded || waypoints.length === 0) return;

    const addWaypoints = async () => {
      const L = await import("leaflet");

      // Clear existing waypoint markers
      waypointMarkersRef.current.forEach((marker) => marker.remove());
      waypointMarkersRef.current = [];

      waypoints.forEach((waypoint, index) => {
        // Create waypoint icon based on type
        const waypointIcon = L.default.divIcon({
          html: `
            <div class="relative -translate-x-1/2 -translate-y-1/2">
              <div class="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center shadow-lg border-2 border-white">
                <span class="text-white text-xs font-bold">${index + 1}</span>
              </div>
              ${waypoint.name ? `
                <div class="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap bg-white px-2 py-1 rounded-md shadow text-xs font-medium">
                  ${waypoint.name}
                </div>
              ` : ''}
            </div>
          `,
          className: "waypoint-marker",
          iconSize: [30, 40],
          iconAnchor: [15, 15],
        });

        const waypointMarker = L.default.marker([waypoint.lat, waypoint.lng], { icon: waypointIcon })
          .addTo(mapInstance);

        waypointMarkersRef.current.push(waypointMarker);
      });
    };

    addWaypoints();

    return () => {
      waypointMarkersRef.current.forEach((marker) => marker.remove());
      waypointMarkersRef.current = [];
    };
  }, [waypoints, mapInstance, leafletLoaded]);

  // Add destination marker and route
  useEffect(() => {
    if (!mapInstance || !leafletLoaded || !destination) return;

    const addDestination = async () => {
      const L = await import("leaflet");

      // Create custom destination icon
      const destIcon = L.default.divIcon({
        html: `
          <div class="relative -translate-x-1/2 -translate-y-full">
            <div class="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shadow-lg border-2 border-white">
              <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              </svg>
            </div>
            <div class="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap bg-white px-2 py-1 rounded-md shadow text-xs font-medium">
              ${destinationLabel}
            </div>
          </div>
        `,
        className: "destination-marker",
        iconSize: [40, 50],
        iconAnchor: [20, 50],
      });

      const destMarker = L.default.marker([destination.lat, destination.lng], { icon: destIcon })
        .addTo(mapInstance);

      markersRef.current.push(destMarker);

      // Draw route if enabled
      if (showRoute) {
        // Remove existing route
        if (routeRef.current) {
          routeRef.current.remove();
        }

        // Build route points including waypoints
        const routePoints: [number, number][] = [[center.lat, center.lng]];
        
        // Add waypoints in order
        waypoints.forEach((wp) => {
          routePoints.push([wp.lat, wp.lng]);
        });
        
        // Add destination
        routePoints.push([destination.lat, destination.lng]);

        // Get route style
        const style = getRouteStyle();

        // Draw route line
        const routeLine = L.default.polyline(routePoints, style).addTo(mapInstance);

        routeRef.current = routeLine;

        // Fit bounds to show all markers
        const bounds = L.default.latLngBounds(routePoints);
        mapInstance.fitBounds(bounds, { padding: [50, 50] });
      }
    };

    addDestination();

    return () => {
      if (routeRef.current) {
        routeRef.current.remove();
        routeRef.current = null;
      }
    };
  }, [destination, mapInstance, leafletLoaded, center, showRoute, destinationLabel, waypoints, getRouteStyle]);

  // Animate marker along route
  useEffect(() => {
    if (!mapInstance || !leafletLoaded || !animateMarker || !destination || !showRoute) return;

    const animateMarkerAlongRoute = async () => {
      const L = await import("leaflet");

      // Build route points
      const routePoints: [number, number][] = [[center.lat, center.lng]];
      waypoints.forEach((wp) => {
        routePoints.push([wp.lat, wp.lng]);
      });
      routePoints.push([destination.lat, destination.lng]);

      // Create animated marker icon
      const animatedIcon = L.default.divIcon({
        html: `
          <div class="relative">
            <div class="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/30 animate-ping"></div>
            <div class="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary flex items-center justify-center shadow-lg">
              <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              </svg>
            </div>
          </div>
        `,
        className: "animated-marker",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      // Remove existing animated marker
      if (animatedMarkerRef.current) {
        animatedMarkerRef.current.remove();
      }

      // Create animated marker
      const animatedMarker = L.default.marker(routePoints[0], { icon: animatedIcon })
        .addTo(mapInstance);

      animatedMarkerRef.current = animatedMarker;

      // Calculate total distance for progress
      let totalDistance = 0;
      for (let i = 0; i < routePoints.length - 1; i++) {
        const dx = routePoints[i + 1][1] - routePoints[i][1];
        const dy = routePoints[i + 1][0] - routePoints[i][0];
        totalDistance += Math.sqrt(dx * dx + dy * dy);
      }

      const duration = 10000; // 10 seconds for the animation
      let startTime: number | null = null;

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Calculate position along route
        const targetDistance = progress * totalDistance;
        let currentDistance = 0;
        let currentPosition: [number, number] = routePoints[0];

        for (let i = 0; i < routePoints.length - 1; i++) {
          const dx = routePoints[i + 1][1] - routePoints[i][1];
          const dy = routePoints[i + 1][0] - routePoints[i][0];
          const segmentDistance = Math.sqrt(dx * dx + dy * dy);

          if (currentDistance + segmentDistance >= targetDistance) {
            const segmentProgress = (targetDistance - currentDistance) / segmentDistance;
            currentPosition = [
              routePoints[i][0] + dy * segmentProgress,
              routePoints[i][1] + dx * segmentProgress,
            ];
            break;
          }

          currentDistance += segmentDistance;
          currentPosition = routePoints[i + 1];
        }

        // Update marker position
        animatedMarker.setLatLng(currentPosition);

        // Center map on marker
        mapInstance.panTo(currentPosition, { animate: false });

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          // Animation complete
          if (onRouteComplete) {
            onRouteComplete();
          }
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animateMarkerAlongRoute();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (animatedMarkerRef.current) {
        animatedMarkerRef.current.remove();
        animatedMarkerRef.current = null;
      }
    };
  }, [animateMarker, destination, mapInstance, leafletLoaded, showRoute, center, waypoints, onRouteComplete]);

  // Handle click for location selection
  useEffect(() => {
    if (!mapInstance || !interactive || !onLocationSelect) return;

    const handleClick = async (e: L.LeafletMouseEvent) => {
      onLocationSelect({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    };

    mapInstance.on("click", handleClick);

    return () => {
      mapInstance.off("click", handleClick);
    };
  }, [mapInstance, interactive, onLocationSelect]);

  // Get current location on mount - works anywhere in the world
  useEffect(() => {
    if (!showUserLocation) return;

    const getLocation = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            // Use actual user location anywhere in the world
            setCurrentLocation({
              lat: latitude,
              lng: longitude,
              name: "موقعك الحالي",
            });
          },
          (error) => {
            console.log("Geolocation error:", error.message);
            // If GPS fails, keep trying to get location
            // Map will show default view until location is obtained
          },
          { 
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          }
        );
      }
    };

    getLocation();
    
    // Keep trying to get location every 30 seconds if not available
    const interval = setInterval(() => {
      if (!currentLocation) {
        getLocation();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [showUserLocation, currentLocation]);

  if (!leafletLoaded) {
    return (
      <div className={cn("relative bg-muted animate-pulse", className)}>
        <div className="absolute inset-0 flex items-center justify-center">
          <MapPin className="w-8 h-8 text-muted-foreground animate-bounce" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-xl isolate", className)}>
      {/* Map container with constrained z-index */}
      <div ref={mapRef} className="w-full h-full min-h-[200px] [&_.leaflet-pane]:z-[1] [&_.leaflet-control]:z-[10] [&_.leaflet-popup]:z-[20]" />
      
      {/* Custom controls overlay */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
        {currentLocation && (
          <button
            onClick={() => mapInstance?.setView([currentLocation.lat, currentLocation.lng], 17)}
            className="w-10 h-10 rounded-xl bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            title="موقعي الحالي"
          >
            <Navigation className="w-5 h-5 text-teal-600" />
          </button>
        )}
      </div>

      {/* Route info overlay */}
      {showRoute && routeInfo && (
        <div className="absolute top-4 left-4 z-[400]">
          <div className="bg-white/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Route className="w-4 h-4 text-primary" />
                <span className="font-bold text-primary">{routeInfo.distance.toFixed(1)} كم</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-blue-600">{routeInfo.duration} دقيقة</span>
              </div>
            </div>
            {routeInfo.progress !== undefined && (
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">التقدم</span>
                  <span className="font-medium">{routeInfo.progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${routeInfo.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Location accuracy indicator */}
      {currentLocation && (
        <div className="absolute bottom-4 right-4 z-[400]">
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium">GPS نشط</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Skeleton component for loading state
export function MapSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative bg-gradient-to-br from-teal-50 to-teal-100", className)}>
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <pattern id="grid-skeleton" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid-skeleton)" />
        </svg>
      </div>
      
      {/* Center marker */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-teal-500/20 animate-pulse" />
          <div className="mt-2 w-24 h-6 bg-teal-500/20 rounded animate-pulse" />
        </div>
      </div>
      
      {/* Loading text */}
      <div className="absolute bottom-4 right-4">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4 text-teal-600 animate-spin" />
          <span className="text-xs font-medium">جاري تحميل الخريطة...</span>
        </div>
      </div>
    </div>
  );
}

// Dynamic wrapper for SSR compatibility
import dynamic from "next/dynamic";

export const DynamicMap = dynamic(() => Promise.resolve(MapComponent), {
  ssr: false,
  loading: () => <MapSkeleton className="h-full w-full" />,
});

// Route utility functions
export function calculateDistance(loc1: Location, loc2: Location): number {
  // Haversine formula
  const R = 6371; // Earth's radius in km
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
  const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateETA(distance: number, speedKmh: number = 30): number {
  // Returns ETA in minutes
  return Math.round((distance / speedKmh) * 60);
}

export function interpolateRoute(start: Location, end: Location, progress: number): Location {
  return {
    lat: start.lat + (end.lat - start.lat) * progress,
    lng: start.lng + (end.lng - start.lng) * progress,
  };
}
