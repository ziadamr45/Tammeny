"use client";

import { useState, useEffect, useCallback } from 'react';

export interface SavedLocation {
  lat: number;
  lng: number;
  name: string;
  timestamp: number;
  accuracy?: number;
}

const STORAGE_KEY = 'tamenny_last_location';
const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export function useSavedLocation() {
  const [savedLocation, setSavedLocation] = useState<SavedLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved location from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SavedLocation;
        
        // Check if location is not too old (within 24 hours)
        if (Date.now() - parsed.timestamp < MAX_AGE) {
          setSavedLocation(parsed);
        } else {
          // Clear old location
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading saved location:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save location to localStorage
  const saveLocation = useCallback((location: { lat: number; lng: number; name?: string; accuracy?: number }) => {
    try {
      const toSave: SavedLocation = {
        lat: location.lat,
        lng: location.lng,
        name: location.name || 'موقعك الحالي',
        timestamp: Date.now(),
        accuracy: location.accuracy,
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      setSavedLocation(toSave);
    } catch (error) {
      console.error('Error saving location:', error);
    }
  }, []);

  // Clear saved location
  const clearSavedLocation = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
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
        (position) => {
          const location: SavedLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            name: 'موقعك الحالي',
            timestamp: Date.now(),
            accuracy: position.coords.accuracy,
          };
          
          saveLocation(location);
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
