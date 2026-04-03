"use client";

import { useState, useEffect, useCallback } from 'react';

export interface SavedLocation {
  lat: number;
  lng: number;
  name: string;
  timestamp: number;
  accuracy?: number;
}

// Max age for cached location (24 hours)
const MAX_AGE = 24 * 60 * 60 * 1000;

export function useSavedLocation() {
  const [savedLocation, setSavedLocation] = useState<SavedLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved location from database on mount
  useEffect(() => {
    let mounted = true;

    const loadLocation = async () => {
      try {
        const response = await fetch('/api/user/location');
        const data = await response.json();

        if (mounted && data.success && data.location) {
          // Check if location is not too old
          const locationAge = Date.now() - (data.location.timestamp || 0);
          if (locationAge < MAX_AGE) {
            setSavedLocation({
              lat: data.location.lat,
              lng: data.location.lng,
              name: data.location.name,
              timestamp: data.location.timestamp,
              accuracy: data.location.accuracy,
            });
          }
        }
      } catch (error) {
        console.error('Error loading saved location:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadLocation();

    return () => {
      mounted = false;
    };
  }, []);

  // Save location to database (encrypted)
  const saveLocation = useCallback(async (location: { lat: number; lng: number; name?: string; accuracy?: number }) => {
    try {
      const toSave: SavedLocation = {
        lat: location.lat,
        lng: location.lng,
        name: location.name || 'موقعك الحالي',
        timestamp: Date.now(),
        accuracy: location.accuracy,
      };

      // Save to database via API (encrypted on server side)
      const response = await fetch('/api/user/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat: location.lat,
          lng: location.lng,
          name: toSave.name,
          accuracy: location.accuracy,
        }),
      });

      if (response.ok) {
        setSavedLocation(toSave);
      }
    } catch (error) {
      console.error('Error saving location:', error);
    }
  }, []);

  // Clear saved location from database
  const clearSavedLocation = useCallback(async () => {
    try {
      // We don't actually delete, just clear local state
      // The location remains in database for next login
      setSavedLocation(null);
    } catch (error) {
      console.error('Error clearing saved location:', error);
    }
  }, []);

  // Get current location and save it
  const getCurrentLocation = useCallback(async (): Promise<SavedLocation | null> => {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location: SavedLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            name: 'موقعك الحالي',
            timestamp: Date.now(),
            accuracy: position.coords.accuracy,
          };

          await saveLocation(location);
          resolve(location);
        },
        (error) => {
          console.error('Geolocation error:', error.message);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    });
  }, [saveLocation]);

  return {
    savedLocation,
    isLoading,
    saveLocation,
    clearSavedLocation,
    getCurrentLocation,
  };
}
