"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Navigation,
  Mountain,
  Target,
  Clock,
  Share2,
  RefreshCw,
  Maximize2,
  Minimize2,
  Radio,
  CheckCircle,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DynamicMap } from "./map-component";
import {
  toArabicNumerals,
  formatArabicDistance,
  formatArabicTime,
} from "@/lib/arabic-numerals";

interface LocationData {
  lat: number;
  lng: number;
  accuracy: number; // in meters
  altitude?: number | null; // in meters
  altitudeAccuracy?: number | null;
  speed?: number | null; // in m/s
  heading?: number | null; // in degrees
  timestamp: Date;
}

interface LiveLocationPreviewProps {
  className?: string;
  showShareButton?: boolean;
  onShare?: () => void;
  showExpandButton?: boolean;
  defaultExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
}

// Cairo default location
const DEFAULT_LOCATION: LocationData = {
  lat: 30.0444,
  lng: 31.2357,
  accuracy: 15,
  altitude: 75,
  altitudeAccuracy: 10,
  speed: 0,
  heading: 0,
  timestamp: new Date(),
};

export function LiveLocationPreview({
  className,
  showShareButton = true,
  onShare,
  showExpandButton = true,
  defaultExpanded = false,
  onExpandChange,
}: LiveLocationPreviewProps) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isMountedRef = useRef(true);

  // Fetch location function
  const fetchLocation = (isInitial: boolean = false) => {
    if (isInitial) {
      setIsRefreshing(true);
      setError(null);
    }

    if (!("geolocation" in navigator)) {
      if (isMountedRef.current) {
        setError("خدمة الموقع غير متاحة في جهازك");
        setIsLoading(false);
        setIsRefreshing(false);
        setLocation(DEFAULT_LOCATION);
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (isMountedRef.current) {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
            timestamp: new Date(position.timestamp),
          });
          setLastUpdated(new Date());
          setIsLoading(false);
          setIsRefreshing(false);
        }
      },
      () => {
        if (isMountedRef.current) {
          setError("تعذر الحصول على الموقع. يتم استخدام موقع افتراضي.");
          setIsLoading(false);
          setIsRefreshing(false);
          setLocation(DEFAULT_LOCATION);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Handle refresh button click
  const handleRefresh = () => {
    setIsRefreshing(true);
    setError(null);
    fetchLocation(true);
  };

  // Initial location fetch on mount
  useEffect(() => {
    isMountedRef.current = true;
    
    // Use setTimeout to defer setState calls to next tick
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        fetchLocation(true);
      }
    }, 0);

    return () => {
      clearTimeout(timer);
      isMountedRef.current = false;
    };
  }, []);

  // Auto-refresh location every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isExpanded && isMountedRef.current) {
        fetchLocation(false);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isExpanded]);

  // Watch position when expanded
  useEffect(() => {
    if (!isExpanded || !("geolocation" in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (isMountedRef.current) {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
            timestamp: new Date(position.timestamp),
          });
          setLastUpdated(new Date());
        }
      },
      () => {},
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isExpanded]);

  const handleExpandToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onExpandChange?.(newExpanded);
  };

  const handleShare = () => {
    onShare?.();
  };

  // Calculate speed in km/h
  const speedKmh = location?.speed ? location.speed * 3.6 : 0;

  // Format coordinates for display
  const formatCoordinate = (value: number, isLat: boolean) => {
    const absolute = Math.abs(value);
    const degrees = Math.floor(absolute);
    const minutes = Math.floor((absolute - degrees) * 60);
    const seconds = ((absolute - degrees - minutes / 60) * 3600).toFixed(1);
    const direction = isLat ? (value >= 0 ? "ش" : "ج") : (value >= 0 ? "ق" : "غ");
    return `${toArabicNumerals(degrees)}° ${toArabicNumerals(minutes)}' ${toArabicNumerals(seconds)}" ${direction}`;
  };

  // Get heading direction in Arabic
  const getHeadingDirection = (heading: number | null | undefined): string => {
    if (heading === null || heading === undefined) return "-";
    const directions = [
      { min: 337.5, max: 360, name: "شمال" },
      { min: 0, max: 22.5, name: "شمال" },
      { min: 22.5, max: 67.5, name: "شمال شرق" },
      { min: 67.5, max: 112.5, name: "شرق" },
      { min: 112.5, max: 157.5, name: "جنوب شرق" },
      { min: 157.5, max: 202.5, name: "جنوب" },
      { min: 202.5, max: 247.5, name: "جنوب غرب" },
      { min: 247.5, max: 292.5, name: "غرب" },
      { min: 292.5, max: 337.5, name: "شمال غرب" },
    ];
    const dir = directions.find((d) => heading >= d.min && heading < d.max);
    return dir?.name || "-";
  };

  // Get accuracy color
  const getAccuracyColor = (accuracy: number): string => {
    if (accuracy <= 10) return "text-green-600 bg-green-100 dark:bg-green-900/30";
    if (accuracy <= 30) return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30";
    return "text-red-600 bg-red-100 dark:bg-red-900/30";
  };

  return (
    <Card className={cn("overflow-hidden card-shadow", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="font-medium text-sm">موقعك الحالي</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              {isLoading ? (
                "جاري التحديد..."
              ) : error ? (
                <span className="text-amber-600">{error}</span>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  GPS نشط
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showExpandButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExpandToggle}
              className="h-8 w-8"
            >
              {isExpanded ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Mini Map */}
      <div className={cn("relative", isExpanded ? "h-64" : "h-32")}>
        {location ? (
          <DynamicMap
            center={{ lat: location.lat, lng: location.lng }}
            showUserLocation={true}
            markerLabel="موقعك الحالي"
            className="absolute inset-0"
          />
        ) : (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <Radio className="w-8 h-8 text-muted-foreground animate-pulse" />
          </div>
        )}

        {/* Accuracy overlay */}
        {location && (
          <div className="absolute bottom-2 left-2 z-[1000]">
            <Badge
              variant="secondary"
              className={cn("text-xs", getAccuracyColor(location.accuracy))}
            >
              <Target className="w-3 h-3 ml-1" />
              دقة {formatArabicDistance(location.accuracy, "m")}
            </Badge>
          </div>
        )}

        {/* Live indicator */}
        {location && (
          <div className="absolute top-2 right-2 z-[1000]">
            <Badge variant="secondary" className="bg-green-500 text-white text-xs">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse ml-1" />
              مباشر
            </Badge>
          </div>
        )}
      </div>

      {/* Location Details */}
      <div className="p-3 space-y-3">
        {/* Coordinates */}
        {location && (
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
              <span className="text-xs text-muted-foreground">خط العرض</span>
              <span className="text-xs font-mono font-medium" dir="ltr">
                {formatCoordinate(location.lat, true)}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
              <span className="text-xs text-muted-foreground">خط الطول</span>
              <span className="text-xs font-mono font-medium" dir="ltr">
                {formatCoordinate(location.lng, false)}
              </span>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Speed */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Navigation className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">السرعة</div>
              <div className="font-bold text-sm">
                {formatArabicDistance(speedKmh, "km").split(" ")[0]} كم/س
              </div>
            </div>
          </div>

          {/* Altitude */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Mountain className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">الارتفاع</div>
              <div className="font-bold text-sm">
                {location?.altitude
                  ? formatArabicDistance(location.altitude, "m")
                  : "غير متاح"}
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Compass className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">الاتجاه</div>
              <div className="font-bold text-sm">
                {getHeadingDirection(location?.heading)}
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Clock className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">آخر تحديث</div>
              <div className="font-bold text-sm">
                {lastUpdated ? formatArabicTime(lastUpdated) : "-"}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex-1 h-10 rounded-xl"
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                جاري التحديث...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 ml-2" />
                تحديث الموقع
              </>
            )}
          </Button>
          {showShareButton && (
            <Button
              size="sm"
              onClick={handleShare}
              className="flex-1 h-10 rounded-xl bg-primary"
            >
              <Share2 className="w-4 h-4 ml-2" />
              مشاركة الموقع
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// Compact inline version
export function LiveLocationCompact({
  className,
  onShare,
}: {
  className?: string;
  onShare?: () => void;
}) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    if (!("geolocation" in navigator)) {
      // Use setTimeout to defer setState to avoid lint error
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          setLocation(DEFAULT_LOCATION);
          setIsLoading(false);
        }
      }, 0);
      return () => {
        clearTimeout(timer);
        isMountedRef.current = false;
      };
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (isMountedRef.current) {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            speed: position.coords.speed,
            heading: position.coords.heading,
            timestamp: new Date(position.timestamp),
          });
          setIsLoading(false);
        }
      },
      () => {
        if (isMountedRef.current) {
          setLocation(DEFAULT_LOCATION);
          setIsLoading(false);
        }
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const speedKmh = location?.speed ? location.speed * 3.6 : 0;

  return (
    <Card className={cn("p-3 card-shadow", className)}>
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          {!isLoading && (
            <div className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
              <CheckCircle className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">موقعك الحالي</div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Navigation className="w-3 h-3" />
              {toArabicNumerals(speedKmh.toFixed(0))} كم/س
            </span>
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              {formatArabicDistance(location?.accuracy || 0, "m")}
            </span>
          </div>
        </div>
        {onShare && (
          <Button size="sm" onClick={onShare} className="rounded-lg shrink-0">
            <Share2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}

// Live coordinates display component
export function LiveCoordinates({
  lat,
  lng,
  className,
}: {
  lat: number;
  lng: number;
  className?: string;
}) {
  const formatCoord = (value: number, isLat: boolean) => {
    const direction = isLat ? (value >= 0 ? "ش" : "ج") : (value >= 0 ? "ق" : "غ");
    return `${toArabicNumerals(Math.abs(value).toFixed(6))}° ${direction}`;
  };

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">خط العرض:</span>
        <span className="font-mono" dir="ltr">{formatCoord(lat, true)}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">خط الطول:</span>
        <span className="font-mono" dir="ltr">{formatCoord(lng, false)}</span>
      </div>
    </div>
  );
}

export default LiveLocationPreview;
