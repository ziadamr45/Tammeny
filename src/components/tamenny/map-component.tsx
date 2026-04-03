"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Navigation, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface Location {
  lat: number;
  lng: number;
  name?: string;
}

interface MapComponentProps {
  center?: Location;
  destination?: Location | null;
  showRoute?: boolean;
  markerLabel?: string;
  destinationLabel?: string;
  className?: string;
  onLocationSelect?: (location: Location) => void;
  interactive?: boolean;
  showUserLocation?: boolean;
}

// Cairo default location
const CAIRO_LOCATION: Location = {
  lat: 30.0444,
  lng: 31.2357,
  name: "القاهرة، مصر",
};

export function MapComponent({
  center = CAIRO_LOCATION,
  destination,
  showRoute = false,
  markerLabel = "موقعك الحالي",
  destinationLabel = "الوجهة",
  className,
  onLocationSelect,
  interactive = false,
  showUserLocation = true,
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routeRef = useRef<L.Polyline | null>(null);

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
      });

      // Add OpenStreetMap tiles with Arabic-friendly styling
      L.default.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      // Add zoom control to the bottom-left for RTL
      L.default.control.zoom({ position: "bottomleft" }).addTo(map);

      setMapInstance(map);
    };

    initMap();

    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [leafletLoaded]);

  // Update center when location changes
  useEffect(() => {
    if (!mapInstance) return;
    
    mapInstance.setView([center.lat, center.lng], mapInstance.getZoom());
  }, [center, mapInstance]);

  // Add user location marker
  useEffect(() => {
    if (!mapInstance || !leafletLoaded || !showUserLocation) return;

    const addMarker = async () => {
      const L = await import("leaflet");
      
      // Clear existing markers
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

        // Draw curved route
        const routeLine = L.default.polyline(
          [
            [center.lat, center.lng],
            [destination.lat, destination.lng],
          ],
          {
            color: "#0d9488",
            weight: 4,
            opacity: 0.8,
            dashArray: "10, 10",
            lineCap: "round",
          }
        ).addTo(mapInstance);

        routeRef.current = routeLine;

        // Fit bounds to show both markers
        const bounds = L.default.latLngBounds([
          [center.lat, center.lng],
          [destination.lat, destination.lng],
        ]);
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
  }, [destination, mapInstance, leafletLoaded, center, showRoute, destinationLabel]);

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

  // Get current location
  useEffect(() => {
    if (!showUserLocation) return;

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            name: "موقعك الحالي",
          });
        },
        () => {
          setCurrentLocation(center);
        },
        { enableHighAccuracy: true }
      );
    }
  }, [center, showUserLocation]);

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
    <div className={cn("relative", className)}>
      {/* Map container */}
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Custom controls overlay */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
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

      {/* Location accuracy indicator */}
      {currentLocation && (
        <div className="absolute bottom-4 right-4 z-[1000]">
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
