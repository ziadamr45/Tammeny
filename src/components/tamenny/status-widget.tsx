"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DynamicMap } from "@/components/tamenny/map-component";
import {
  MapPin,
  Clock,
  Navigation,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Activity,
  StopCircle,
  Maximize2,
  Minimize2,
  Share2,
  Zap,
  AlertTriangle,
  Check,
  X,
  Route,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  toArabicNumerals,
  formatArabicDistance,
  formatArabicTimeFromSeconds,
  formatArabicDuration,
} from "@/lib/arabic-numerals";

// Types
interface StatusWidgetProps {
  isSharing: boolean;
  duration: number; // in minutes
  distance: number; // in km
  speed: number; // in km/h
  destination?: {
    name: string;
    lat: number;
    lng: number;
  };
  currentLocation?: {
    lat: number;
    lng: number;
    name?: string;
  };
  onStopSharing?: () => void;
  className?: string;
}

export function StatusWidget({
  isSharing,
  duration,
  distance,
  speed,
  destination,
  currentLocation,
  onStopSharing,
  className,
}: StatusWidgetProps) {
  const [expanded, setExpanded] = useState(false);
  const [showFullMap, setShowFullMap] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [batterySaver, setBatterySaver] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(duration * 60);
  const prevIsSharingRef = useRef(isSharing);

  // Get battery level
  useEffect(() => {
    const getBattery = async () => {
      try {
        // @ts-expect-error - Battery API is not in TypeScript
        const battery = await navigator.getBattery?.();
        if (battery) {
          setBatteryLevel(Math.round(battery.level * 100));
          setBatterySaver(battery.level < 0.2);

          battery.addEventListener("levelchange", () => {
            setBatteryLevel(Math.round(battery.level * 100));
            setBatterySaver(battery.level < 0.2);
          });
        }
      } catch {
        setBatteryLevel(75);
      }
    };

    getBattery();
  }, []);

  // Update elapsed and remaining time
  useEffect(() => {
    if (!isSharing) return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
      setRemainingTime((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isSharing]);

  // Reset when sharing stops - using a callback pattern
  useEffect(() => {
    // Only reset when transitioning from sharing to not sharing
    if (prevIsSharingRef.current && !isSharing) {
      // Use timeout to defer setState outside the effect
      const timer = setTimeout(() => {
        setElapsedTime(0);
        setRemainingTime(duration * 60);
      }, 0);
      return () => clearTimeout(timer);
    }
    prevIsSharingRef.current = isSharing;
  }, [isSharing, duration]);

  // Calculate progress
  const progress = useMemo(() => {
    if (duration <= 0) return 0;
    return Math.min(100, (elapsedTime / (duration * 60)) * 100);
  }, [elapsedTime, duration]);

  // Get battery icon and color
  const getBatteryInfo = () => {
    if (batteryLevel === null) {
      return { icon: <Battery className="w-4 h-4" />, color: "text-muted-foreground" };
    }
    if (batteryLevel < 20) {
      return { icon: <BatteryLow className="w-4 h-4" />, color: "text-red-500" };
    }
    if (batteryLevel < 50) {
      return { icon: <BatteryMedium className="w-4 h-4" />, color: "text-yellow-500" };
    }
    return { icon: <BatteryFull className="w-4 h-4" />, color: "text-green-500" };
  };

  const batteryInfo = getBatteryInfo();

  // Format time
  const formatTime = (seconds: number) => {
    return formatArabicTimeFromSeconds(seconds);
  };

  // Don't show if not sharing
  if (!isSharing) return null;

  return (
    <>
      <Card
        className={cn(
          "overflow-hidden transition-all duration-300",
          expanded ? "p-4" : "p-3",
          "bg-gradient-to-l from-primary/5 to-teal-50/50 border-primary/20",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-30" />
            </div>
            <div>
              <div className="font-bold text-primary flex items-center gap-2">
                جاري المشاركة
                <Badge className="bg-green-100 text-green-700 gap-1 animate-pulse text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  مباشر
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                الوقت المتبقي: {formatTime(remainingTime)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg h-8 w-8"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg h-8 w-8 text-destructive hover:bg-destructive/10"
              onClick={onStopSharing}
            >
              <StopCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">تقدم المشاركة</span>
            <span className="font-medium text-primary">{toArabicNumerals(Math.round(progress))}٪</span>
          </div>
          <Progress value={progress} className="h-2 bg-primary/20" />
        </div>

        {/* Stats grid */}
        <div className={cn(
          "grid gap-2 transition-all duration-300",
          expanded ? "grid-cols-4" : "grid-cols-3"
        )}>
          {/* Distance */}
          <div className="p-2 bg-white/50 rounded-lg text-center">
            <Route className="w-4 h-4 mx-auto text-primary mb-1" />
            <div className="text-sm font-bold">{formatArabicDistance(distance, "km")}</div>
            <div className="text-xs text-muted-foreground">المسافة</div>
          </div>

          {/* Speed */}
          <div className="p-2 bg-white/50 rounded-lg text-center">
            <Gauge className="w-4 h-4 mx-auto text-blue-500 mb-1" />
            <div className="text-sm font-bold">{toArabicNumerals(speed)} كم/س</div>
            <div className="text-xs text-muted-foreground">السرعة</div>
          </div>

          {/* Elapsed time */}
          <div className="p-2 bg-white/50 rounded-lg text-center">
            <Clock className="w-4 h-4 mx-auto text-purple-500 mb-1" />
            <div className="text-sm font-bold">{formatTime(elapsedTime)}</div>
            <div className="text-xs text-muted-foreground">المدة</div>
          </div>

          {/* Battery (only when expanded) */}
          {expanded && (
            <div className="p-2 bg-white/50 rounded-lg text-center">
              <div className={cn("flex justify-center mb-1", batteryInfo.color)}>
                {batteryInfo.icon}
              </div>
              <div className="text-sm font-bold">
                {batteryLevel ? `${toArabicNumerals(batteryLevel)}٪` : "--"}
              </div>
              <div className="text-xs text-muted-foreground">البطارية</div>
            </div>
          )}
        </div>

        {/* Destination info (if set) */}
        {destination && expanded && (
          <div className="mt-3 p-3 bg-white/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1">
                <div className="font-medium">{destination.name}</div>
                <div className="text-xs text-muted-foreground">الوجهة النهائية</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg"
                onClick={() => setShowFullMap(true)}
              >
                <Navigation className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Mini map (when expanded and has location) */}
        {expanded && currentLocation && (
          <div className="mt-3">
            <div
              className="h-32 rounded-xl overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setShowFullMap(true)}
            >
              <DynamicMap
                center={currentLocation}
                destination={destination}
                showRoute={!!destination}
                showUserLocation
                markerLabel="موقعك"
                destinationLabel={destination?.name || "الوجهة"}
                className="h-full w-full"
              />
            </div>
          </div>
        )}

        {/* Battery saver indicator */}
        {batterySaver && expanded && (
          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-amber-700">وضع توفير البطارية نشط</span>
          </div>
        )}
      </Card>

      {/* Full map dialog */}
      <Dialog open={showFullMap} onOpenChange={setShowFullMap}>
        <DialogContent className="max-w-lg mx-4 rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="p-4 bg-white/80 backdrop-blur-sm absolute top-0 left-0 right-0 z-10">
            <DialogTitle className="text-center text-lg">موقعك الحالي</DialogTitle>
          </DialogHeader>
          <div className="h-[60vh]">
            <DynamicMap
              center={currentLocation}
              destination={destination}
              showRoute={!!destination}
              showUserLocation
              markerLabel="موقعك"
              destinationLabel={destination?.name || "الوجهة"}
              className="h-full w-full"
            />
          </div>
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <Card className="p-3 bg-white/90 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-medium text-sm">
                      {currentLocation?.name || "موقعك الحالي"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatArabicDistance(distance, "km")} • {formatTime(remainingTime)} متبقي
                    </div>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => {
                    onStopSharing?.();
                    setShowFullMap(false);
                  }}
                >
                  <StopCircle className="w-4 h-4 ml-1" />
                  إيقاف
                </Button>
              </div>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Compact inline version
export function StatusCompact({
  isSharing,
  duration,
  distance,
  speed,
  onStopSharing,
  className,
}: {
  isSharing: boolean;
  duration: number;
  distance: number;
  speed: number;
  onStopSharing?: () => void;
  className?: string;
}) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isSharing) return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isSharing]);

  if (!isSharing) return null;

  const remainingTime = Math.max(0, duration * 60 - elapsedTime);

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2 px-4 rounded-full bg-primary text-white",
        className
      )}
    >
      <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
      <span className="text-sm font-medium">
        مباشر • {formatArabicDistance(distance, "km")}
      </span>
      <span className="text-sm">•</span>
      <span className="text-sm">{toArabicNumerals(speed)} كم/س</span>
      {onStopSharing && (
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full h-6 w-6 text-white hover:bg-white/20"
          onClick={onStopSharing}
        >
          <X className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}

// Live stats component
export function LiveStats({
  isSharing,
  distance,
  speed,
  eta,
  className,
}: {
  isSharing: boolean;
  distance: number;
  speed: number;
  eta: number; // in minutes
  className?: string;
}) {
  if (!isSharing) return null;

  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      <div className="p-3 bg-white/50 rounded-xl text-center">
        <Activity className="w-5 h-5 mx-auto text-primary mb-1" />
        <div className="text-lg font-bold">{toArabicNumerals(speed)}</div>
        <div className="text-xs text-muted-foreground">كم/س</div>
      </div>
      <div className="p-3 bg-white/50 rounded-xl text-center">
        <Clock className="w-5 h-5 mx-auto text-blue-500 mb-1" />
        <div className="text-lg font-bold">{toArabicNumerals(eta)}</div>
        <div className="text-xs text-muted-foreground">دقيقة</div>
      </div>
      <div className="p-3 bg-white/50 rounded-xl text-center">
        <MapPin className="w-5 h-5 mx-auto text-purple-500 mb-1" />
        <div className="text-lg font-bold">{toArabicNumerals(distance.toFixed(1))}</div>
        <div className="text-xs text-muted-foreground">كم</div>
      </div>
    </div>
  );
}
