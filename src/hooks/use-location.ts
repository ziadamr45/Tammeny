"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";

interface LocationState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: Date | null;
  error: string | null;
  loading: boolean;
}

interface UseLocationOptions {
  enableHighAccuracy?: boolean;
  maximumAge?: number;
  timeout?: number;
  watchPosition?: boolean;
}

export function useLocation(options: UseLocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    maximumAge = 10000,
    timeout = 20000,
    watchPosition = false,
  } = options;

  const [state, setState] = useState<LocationState>({
    lat: null,
    lng: null,
    accuracy: null,
    speed: null,
    heading: null,
    timestamp: null,
    error: null,
    loading: true,
  });

  const watchIdRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const onSuccess = useCallback((position: GeolocationPosition) => {
    if (!mountedRef.current) return;
    setState({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed,
      heading: position.coords.heading,
      timestamp: new Date(position.timestamp),
      error: null,
      loading: false,
    });
  }, []);

  const onError = useCallback((error: GeolocationPositionError) => {
    if (!mountedRef.current) return;
    let errorMessage: string;
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = "تم رفض إذن الوصول للموقع";
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = "الموقع غير متاح";
        break;
      case error.TIMEOUT:
        errorMessage = "انتهت مهلة تحديد الموقع";
        break;
      default:
        errorMessage = "حدث خطأ غير متوقع";
    }
    setState((prev) => ({
      ...prev,
      error: errorMessage,
      loading: false,
    }));
  }, []);

  const requestLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setState((prev) => ({
        ...prev,
        error: "خدمة الموقع غير مدعومة في متصفحك",
        loading: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    if (watchPosition) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        onSuccess,
        onError,
        { enableHighAccuracy, maximumAge, timeout }
      );
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, {
        enableHighAccuracy,
        maximumAge,
        timeout,
      });
    }
  }, [enableHighAccuracy, maximumAge, timeout, watchPosition, onSuccess, onError]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    requestLocation();
    return () => {
      mountedRef.current = false;
      stopWatching();
    };
  }, [requestLocation, stopWatching]);

  return {
    ...state,
    requestLocation,
    stopWatching,
    hasLocation: state.lat !== null && state.lng !== null,
  };
}

// Hook for distance calculation - memoized to avoid recalculation
export function useDistance(
  from: { lat: number; lng: number } | null,
  to: { lat: number; lng: number } | null
) {
  const result = useMemo(() => {
    if (!from || !to) {
      return { distance: null, bearing: null };
    }

    // Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = ((to.lat - from.lat) * Math.PI) / 180;
    const dLng = ((to.lng - from.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((from.lat * Math.PI) / 180) *
        Math.cos((to.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Calculate bearing
    const y =
      Math.sin(dLng) * Math.cos((to.lat * Math.PI) / 180);
    const x =
      Math.cos((from.lat * Math.PI) / 180) * Math.sin((to.lat * Math.PI) / 180) -
      Math.sin((from.lat * Math.PI) / 180) *
        Math.cos((to.lat * Math.PI) / 180) *
        Math.cos(dLng);
    let brng = (Math.atan2(y, x) * 180) / Math.PI;
    brng = (brng + 360) % 360;
    
    return { distance, bearing: brng };
  }, [from, to]);

  return result;
}

// Hook for geofencing - memoized to avoid recalculation
export function useGeofence(
  center: { lat: number; lng: number } | null,
  radiusMeters: number,
  currentLocation: { lat: number; lng: number } | null
) {
  const result = useMemo(() => {
    if (!center || !currentLocation) {
      return { isInside: false, distanceToCenter: null };
    }

    // Calculate distance
    const R = 6371000; // Earth's radius in meters
    const dLat =
      ((currentLocation.lat - center.lat) * Math.PI) / 180;
    const dLng =
      ((currentLocation.lng - center.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((center.lat * Math.PI) / 180) *
        Math.cos((currentLocation.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return {
      isInside: distance <= radiusMeters,
      distanceToCenter: distance,
    };
  }, [center, radiusMeters, currentLocation]);

  return result;
}
