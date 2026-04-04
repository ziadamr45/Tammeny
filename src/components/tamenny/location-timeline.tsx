"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  MapPin,
  Clock,
  Home,
  Building,
  ShoppingBag,
  GraduationCap,
  Star,
  Heart,
  Briefcase,
  Navigation,
  Car,
  Footprints,
  Bike,
  Train,
  ChevronLeft,
  Route,
  Calendar,
  Eye,
  Share2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  toArabicNumerals,
  formatArabicDate,
  formatArabicTime,
  formatArabicDistance,
} from "@/lib/arabic-numerals";

// Location types
export type LocationType = 
  | "home" 
  | "work" 
  | "school" 
  | "shopping" 
  | "favorite" 
  | "family" 
  | "transit" 
  | "other";

export interface LocationEntry {
  id: string;
  name: string;
  type: LocationType;
  lat: number;
  lng: number;
  timestamp: Date;
  duration?: number; // in minutes
  distance?: number; // in km from previous location
  transportMode?: "car" | "walking" | "bike" | "transit";
  notes?: string;
}

interface LocationTimelineProps {
  locations: LocationEntry[];
  className?: string;
  onLocationClick?: (location: LocationEntry) => void;
  showDate?: boolean;
  compact?: boolean;
}

// Get location type icon
const getLocationTypeIcon = (type: LocationType) => {
  switch (type) {
    case "home":
      return <Home className="w-4 h-4" />;
    case "work":
      return <Briefcase className="w-4 h-4" />;
    case "school":
      return <GraduationCap className="w-4 h-4" />;
    case "shopping":
      return <ShoppingBag className="w-4 h-4" />;
    case "favorite":
      return <Star className="w-4 h-4" />;
    case "family":
      return <Heart className="w-4 h-4" />;
    case "transit":
      return <Train className="w-4 h-4" />;
    default:
      return <MapPin className="w-4 h-4" />;
  }
};

// Get location type color
const getLocationTypeColor = (type: LocationType) => {
  switch (type) {
    case "home":
      return { bg: "bg-green-100", text: "text-green-600", border: "border-green-200" };
    case "work":
      return { bg: "bg-blue-100", text: "text-blue-600", border: "border-blue-200" };
    case "school":
      return { bg: "bg-purple-100", text: "text-purple-600", border: "border-purple-200" };
    case "shopping":
      return { bg: "bg-orange-100", text: "text-orange-600", border: "border-orange-200" };
    case "favorite":
      return { bg: "bg-yellow-100", text: "text-yellow-600", border: "border-yellow-200" };
    case "family":
      return { bg: "bg-pink-100", text: "text-pink-600", border: "border-pink-200" };
    case "transit":
      return { bg: "bg-cyan-100", text: "text-cyan-600", border: "border-cyan-200" };
    default:
      return { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200" };
  }
};

// Get location type name in Arabic
const getLocationTypeName = (type: LocationType) => {
  switch (type) {
    case "home":
      return "المنزل";
    case "work":
      return "العمل";
    case "school":
      return "الدراسة";
    case "shopping":
      return "التسوق";
    case "favorite":
      return "مفضل";
    case "family":
      return "الأهل";
    case "transit":
      return "في الطريق";
    default:
      return "موقع آخر";
  }
};

// Get transport mode icon
const getTransportIcon = (mode?: string) => {
  switch (mode) {
    case "car":
      return <Car className="w-3 h-3" />;
    case "walking":
      return <Footprints className="w-3 h-3" />;
    case "bike":
      return <Bike className="w-3 h-3" />;
    case "transit":
      return <Train className="w-3 h-3" />;
    default:
      return null;
  }
};

// Get transport mode name
const getTransportName = (mode?: string) => {
  switch (mode) {
    case "car":
      return "سيارة";
    case "walking":
      return "مشي";
    case "bike":
      return "دراجة";
    case "transit":
      return "مواصلات";
    default:
      return "";
  }
};

export function LocationTimeline({
  locations,
  className,
  onLocationClick,
  showDate = true,
  compact = false,
}: LocationTimelineProps) {
  const [selectedLocation, setSelectedLocation] = useState<LocationEntry | null>(null);

  // Group locations by date
  const groupedLocations = useMemo(() => {
    const groups: { [key: string]: LocationEntry[] } = {};
    
    locations.forEach((location) => {
      const dateKey = formatArabicDate(location.timestamp);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(location);
    });

    return Object.entries(groups);
  }, [locations]);

  // Format duration
  const formatDuration = (minutes?: number) => {
    if (!minutes) return null;
    if (minutes < 60) {
      return `${toArabicNumerals(minutes)} دقيقة`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${toArabicNumerals(hours)} ساعة`;
    }
    return `${toArabicNumerals(hours)} ساعة ${toArabicNumerals(mins)} دقيقة`;
  };

  if (locations.length === 0) {
    return (
      <Card className={cn("card-shadow", className)}>
        <CardContent className="py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Route className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">لا توجد مواقع في السجل</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {groupedLocations.map(([date, dateLocations]) => (
        <div key={date} className="space-y-4">
          {/* Date header */}
          {showDate && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div className="font-medium text-lg">{date}</div>
              <Badge variant="secondary" className="mr-auto">
                {toArabicNumerals(dateLocations.length)} موقع
              </Badge>
            </div>
          )}

          {/* Timeline */}
          <Card className="card-shadow overflow-hidden">
            <CardContent className={cn("p-4", compact && "p-2")}>
              <div className="space-y-0">
                {dateLocations.map((location, index) => {
                  const colors = getLocationTypeColor(location.type);
                  const isLast = index === dateLocations.length - 1;

                  return (
                    <div
                      key={location.id}
                      className="flex gap-3 cursor-pointer group"
                      onClick={() => {
                        setSelectedLocation(location);
                        onLocationClick?.(location);
                      }}
                    >
                      {/* Timeline connector */}
                      <div className="flex flex-col items-center shrink-0">
                        {/* Animated dot */}
                        <div
                          className={cn(
                            "relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                            "group-hover:scale-110",
                            colors.bg,
                            colors.border,
                            "border-2"
                          )}
                        >
                          {/* Pulse animation */}
                          <div
                            className={cn(
                              "absolute inset-0 rounded-full animate-ping opacity-20",
                              colors.bg
                            )}
                            style={{ animationDelay: `${index * 200}ms` }}
                          />
                          
                          {/* Icon */}
                          <span className={cn("relative z-10", colors.text)}>
                            {getLocationTypeIcon(location.type)}
                          </span>
                        </div>

                        {/* Connector line */}
                        {!isLast && (
                          <div className="w-0.5 flex-1 my-2 bg-gradient-to-b from-primary/40 to-primary/10 relative overflow-hidden">
                            {/* Animated line */}
                            <div
                              className="absolute inset-0 bg-primary/30"
                              style={{
                                animation: "slide-down 2s ease-in-out infinite",
                                animationDelay: `${index * 200}ms`,
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div
                        className={cn(
                          "flex-1 pb-4 transition-all duration-300",
                          "group-hover:bg-muted/30 rounded-xl -mx-2 px-2",
                          compact && "pb-2"
                        )}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="font-medium group-hover:text-primary transition-colors">
                              {location.name}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge
                                variant="secondary"
                                className={cn("text-xs", colors.bg, colors.text, colors.border)}
                              >
                                {getLocationTypeName(location.type)}
                              </Badge>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatArabicTime(location.timestamp)}
                              </span>
                            </div>
                          </div>

                          {/* Transport mode indicator */}
                          {location.transportMode && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              {getTransportIcon(location.transportMode)}
                              <span>{getTransportName(location.transportMode)}</span>
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        {!compact && (
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                            {/* Coordinates */}
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {toArabicNumerals(location.lat.toFixed(4))}، {toArabicNumerals(location.lng.toFixed(4))}
                            </span>

                            {/* Duration */}
                            {location.duration && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDuration(location.duration)}
                              </span>
                            )}

                            {/* Distance */}
                            {location.distance && (
                              <span className="flex items-center gap-1">
                                <Navigation className="w-3 h-3" />
                                {formatArabicDistance(location.distance)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      ))}

      {/* Location Detail Dialog */}
      <Dialog open={!!selectedLocation} onOpenChange={() => setSelectedLocation(null)}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">تفاصيل الموقع</DialogTitle>
            <DialogDescription className="text-center">
              {selectedLocation?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedLocation && (
            <div className="space-y-4">
              {/* Location type badge */}
              <div className="flex justify-center">
                <Badge
                  className={cn(
                    "gap-2 px-4 py-2",
                    getLocationTypeColor(selectedLocation.type).bg,
                    getLocationTypeColor(selectedLocation.type).text
                  )}
                >
                  {getLocationTypeIcon(selectedLocation.type)}
                  {getLocationTypeName(selectedLocation.type)}
                </Badge>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded-xl text-center">
                  <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
                  <div className="font-bold">{formatArabicTime(selectedLocation.timestamp)}</div>
                  <div className="text-xs text-muted-foreground">الوقت</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-xl text-center">
                  <Calendar className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <div className="font-bold text-sm">{formatArabicDate(selectedLocation.timestamp)}</div>
                  <div className="text-xs text-muted-foreground">التاريخ</div>
                </div>
              </div>

              {/* Coordinates */}
              <div className="p-3 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-medium">الإحداثيات</span>
                </div>
                <div className="text-sm text-muted-foreground font-mono">
                  {toArabicNumerals(selectedLocation.lat.toFixed(6))}، {toArabicNumerals(selectedLocation.lng.toFixed(6))}
                </div>
              </div>

              {/* Duration and distance */}
              {(selectedLocation.duration || selectedLocation.distance) && (
                <div className="grid grid-cols-2 gap-3">
                  {selectedLocation.duration && (
                    <div className="p-3 bg-blue-50 rounded-xl text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {formatDuration(selectedLocation.duration)}
                      </div>
                      <div className="text-xs text-muted-foreground">مدة البقاء</div>
                    </div>
                  )}
                  {selectedLocation.distance && (
                    <div className="p-3 bg-primary/5 rounded-xl text-center">
                      <div className="text-lg font-bold text-primary">
                        {formatArabicDistance(selectedLocation.distance)}
                      </div>
                      <div className="text-xs text-muted-foreground">المسافة</div>
                    </div>
                  )}
                </div>
              )}

              {/* Transport mode */}
              {selectedLocation.transportMode && (
                <div className="flex items-center justify-center gap-2 p-3 bg-muted/50 rounded-xl">
                  {getTransportIcon(selectedLocation.transportMode)}
                  <span>طريقة التنقل: {getTransportName(selectedLocation.transportMode)}</span>
                </div>
              )}

              {/* Notes */}
              {selectedLocation.notes && (
                <div className="p-3 bg-muted/50 rounded-xl">
                  <div className="text-xs text-muted-foreground mb-1">ملاحظات</div>
                  <div className="text-sm">{selectedLocation.notes}</div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl gap-2"
                  onClick={() => {
                    toast.success("تم نسخ الموقع!");
                  }}
                >
                  <Share2 className="w-4 h-4" />
                  مشاركة
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl gap-2 text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    toast.success("تم حذف الموقع من السجل");
                    setSelectedLocation(null);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  حذف
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Custom styles for animations */}
      <style jsx global>{`
        @keyframes slide-down {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }
      `}</style>
    </div>
  );
}

// Compact timeline component for embedding
export function LocationTimelineCompact({
  locations,
  className,
}: {
  locations: LocationEntry[];
  className?: string;
}) {
  const lastLocations = locations.slice(0, 5);

  return (
    <div className={cn("flex items-center gap-2 overflow-x-auto pb-2", className)}>
      {lastLocations.map((location, index) => {
        const colors = getLocationTypeColor(location.type);
        return (
          <div
            key={location.id}
            className="flex items-center gap-2 shrink-0"
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                colors.bg
              )}
            >
              <span className={colors.text}>
                {getLocationTypeIcon(location.type)}
              </span>
            </div>
            {index < lastLocations.length - 1 && (
              <div className="w-6 h-0.5 bg-primary/20" />
            )}
          </div>
        );
      })}
      {locations.length > 5 && (
        <Badge variant="secondary" className="shrink-0">
          +{toArabicNumerals(locations.length - 5)}
        </Badge>
      )}
    </div>
  );
}

// Location stats component
export function LocationStats({
  locations,
  className,
}: {
  locations: LocationEntry[];
  className?: string;
}) {
  const stats = useMemo(() => {
    const total = locations.length;
    const types: Record<LocationType, number> = {
      home: 0,
      work: 0,
      school: 0,
      shopping: 0,
      favorite: 0,
      family: 0,
      transit: 0,
      other: 0,
    };

    locations.forEach((loc) => {
      types[loc.type]++;
    });

    const uniqueDays = new Set(
      locations.map((loc) => formatArabicDate(loc.timestamp))
    ).size;

    return { total, types, uniqueDays };
  }, [locations]);

  return (
    <Card className={cn("card-shadow", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">إحصائيات المواقع</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {toArabicNumerals(stats.total)}
            </div>
            <div className="text-xs text-muted-foreground">موقع</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {toArabicNumerals(stats.uniqueDays)}
            </div>
            <div className="text-xs text-muted-foreground">يوم</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {toArabicNumerals(stats.types.home + stats.types.work)}
            </div>
            <div className="text-xs text-muted-foreground">متكرر</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
