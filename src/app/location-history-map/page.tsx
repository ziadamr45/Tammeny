"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import {
  MapPin,
  Navigation,
  Clock,
  Calendar,
  ChevronLeft,
  Filter,
  Map,
  Layers,
  Eye,
  Loader2,
  Home,
  Building,
  GraduationCap,
  ShoppingBag,
  Star,
  Heart,
  Train,
  Car,
  Footprints,
  Bike,
  Route,
  Timer,
  Zap,
  TrendingUp,
  CalendarDays,
  List,
  MapIcon,
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Locate,
  History,
  Sparkles,
} from "lucide-react";
import { BottomNav, Header } from "@/components/tamenny/bottom-nav";
import { OfflineIndicator } from "@/components/tamenny/offline-indicator";
import { DynamicMap } from "@/components/tamenny/map-component";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  toArabicNumerals,
  formatArabicDistance,
  formatArabicDuration,
  formatArabicDate,
  formatArabicTime,
} from "@/lib/arabic-numerals";
import { useAuth } from "@/hooks/use-auth";
import "leaflet/dist/leaflet.css";

// Location type
type LocationType = "home" | "work" | "school" | "shopping" | "favorite" | "family" | "transit" | "other";

// Location history item
interface LocationHistoryItem {
  id: string;
  lat: number;
  lng: number;
  name: string;
  type: LocationType;
  timestamp: Date;
  duration: number; // in minutes
  distance?: number; // from previous location
  address?: string;
}

// Filter state
interface FilterState {
  types: LocationType[];
  dateRange: "today" | "week" | "month" | "all";
  showRoutes: boolean;
  clusterMarkers: boolean;
}



// Location type config
const locationTypeConfig: Record<LocationType, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  home: { label: "المنزل", icon: <Home className="w-4 h-4" />, color: "text-green-600", bgColor: "bg-green-100" },
  work: { label: "العمل", icon: <Building className="w-4 h-4" />, color: "text-blue-600", bgColor: "bg-blue-100" },
  school: { label: "الدراسة", icon: <GraduationCap className="w-4 h-4" />, color: "text-purple-600", bgColor: "bg-purple-100" },
  shopping: { label: "التسوق", icon: <ShoppingBag className="w-4 h-4" />, color: "text-orange-600", bgColor: "bg-orange-100" },
  favorite: { label: "المفضلة", icon: <Star className="w-4 h-4" />, color: "text-yellow-600", bgColor: "bg-yellow-100" },
  family: { label: "الأهل", icon: <Heart className="w-4 h-4" />, color: "text-pink-600", bgColor: "bg-pink-100" },
  transit: { label: "المواصلات", icon: <Train className="w-4 h-4" />, color: "text-cyan-600", bgColor: "bg-cyan-100" },
  other: { label: "أخرى", icon: <MapPin className="w-4 h-4" />, color: "text-gray-600", bgColor: "bg-gray-100" },
};

export default function LocationHistoryMapPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [locationHistory, setLocationHistory] = useState<LocationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<LocationHistoryItem | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [mapZoom, setMapZoom] = useState(13);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  
  const [filters, setFilters] = useState<FilterState>({
    types: [],
    dateRange: "all",
    showRoutes: true,
    clusterMarkers: false,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Load location history from API
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchLocationHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/location-history?range=${filters.dateRange}`);
        const data = await response.json();

        if (data.success) {
          // Map API locations to LocationHistoryItem format
          const historyItems: LocationHistoryItem[] = (data.locations || []).map((loc: {
            id: string; lat: number; lng: number; sessionId: string;
            timestamp: string; speed: number | null; accuracy: number | null;
          }) => {
            // Find the session this location belongs to
            const session = (data.sessions || []).find((s: { id: string; destName: string | null }) => s.id === loc.sessionId);
            return {
              id: loc.id,
              lat: loc.lat,
              lng: loc.lng,
              name: session?.destName || 'موقع مسجل',
              type: 'other' as LocationType,
              timestamp: new Date(loc.timestamp),
              duration: 0,
              distance: undefined,
              address: undefined,
            };
          });

          setLocationHistory(historyItems);

          // Set map center to most recent location
          if (historyItems.length > 0) {
            setMapCenter({ lat: historyItems[0].lat, lng: historyItems[0].lng });
          }
        } else {
          console.error('Failed to fetch location history:', data.error);
        }
      } catch (error) {
        console.error('Error fetching location history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocationHistory();
  }, [isAuthenticated, filters.dateRange]);

  // Filter locations
  const filteredLocations = useMemo(() => {
    let filtered = [...locationHistory];
    
    // Filter by type
    if (filters.types.length > 0) {
      filtered = filtered.filter(loc => filters.types.includes(loc.type));
    }
    
    // Filter by date range
    const now = new Date();
    switch (filters.dateRange) {
      case "today":
        filtered = filtered.filter(loc => {
          const diff = now.getTime() - loc.timestamp.getTime();
          return diff < 24 * 60 * 60 * 1000;
        });
        break;
      case "week":
        filtered = filtered.filter(loc => {
          const diff = now.getTime() - loc.timestamp.getTime();
          return diff < 7 * 24 * 60 * 60 * 1000;
        });
        break;
      case "month":
        filtered = filtered.filter(loc => {
          const diff = now.getTime() - loc.timestamp.getTime();
          return diff < 30 * 24 * 60 * 60 * 1000;
        });
        break;
    }
    
    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [locationHistory, filters]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalLocations = filteredLocations.length;
    const totalDuration = filteredLocations.reduce((acc, loc) => acc + loc.duration, 0);
    const uniqueTypes = [...new Set(filteredLocations.map(loc => loc.type))].length;
    
    // Calculate most visited type
    const typeCounts: Record<string, number> = {};
    filteredLocations.forEach(loc => {
      typeCounts[loc.type] = (typeCounts[loc.type] || 0) + 1;
    });
    const mostVisitedType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
    
    return {
      totalLocations,
      totalDuration,
      uniqueTypes,
      mostVisitedType: mostVisitedType ? mostVisitedType[0] as LocationType : null,
    };
  }, [filteredLocations]);

  // Toggle type filter
  const toggleTypeFilter = (type: LocationType) => {
    setFilters(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type],
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      types: [],
      dateRange: "all",
      showRoutes: true,
      clusterMarkers: false,
    });
  };

  // Format relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `منذ ${toArabicNumerals(minutes)} دقيقة`;
    if (hours < 24) return `منذ ${toArabicNumerals(hours)} ساعة`;
    if (days < 7) return `منذ ${toArabicNumerals(days)} يوم`;
    return formatArabicDate(date);
  };

  // Auth Loading
  if (authLoading) {
    return (
      <main className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </main>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      <OfflineIndicator />
      <Header />

      <div className="pt-16">
        {/* Header */}
        <div className="px-4 py-4 bg-gradient-to-l from-primary/5 to-transparent">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <MapIcon className="w-6 h-6 text-primary" />
                خريطة المواقع
              </h1>
              <p className="text-sm text-muted-foreground">
                عرض {toArabicNumerals(filteredLocations.length)} موقع
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                className={cn("gap-2 rounded-xl", showFilters && "bg-primary text-white")}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4" />
                الفلاتر
                {filters.types.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {toArabicNumerals(filters.types.length)}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2 bg-muted/50 p-1 rounded-xl">
            <Button
              variant={viewMode === "map" ? "default" : "ghost"}
              size="sm"
              className={cn("flex-1 gap-2 rounded-lg", viewMode === "map" && "bg-white shadow-sm")}
              onClick={() => setViewMode("map")}
            >
              <Map className="w-4 h-4" />
              الخريطة
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className={cn("flex-1 gap-2 rounded-lg", viewMode === "list" && "bg-white shadow-sm")}
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
              القائمة
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="mx-4 p-4 card-shadow-xl animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">الفلاتر</h3>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-destructive">
                مسح الكل
              </Button>
            </div>

            {/* Date Range Filter */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">الفترة الزمنية</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "today", label: "اليوم" },
                  { value: "week", label: "هذا الأسبوع" },
                  { value: "month", label: "هذا الشهر" },
                  { value: "all", label: "الكل" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilters(prev => ({ ...prev, dateRange: opt.value as FilterState["dateRange"] }))}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm transition-all border-2",
                      filters.dateRange === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">نوع الموقع</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(locationTypeConfig).map(([type, config]) => (
                  <button
                    key={type}
                    onClick={() => toggleTypeFilter(type as LocationType)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all border-2",
                      filters.types.includes(type as LocationType)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className={config.color}>{config.icon}</span>
                    {config.label}
                    {filters.types.includes(type as LocationType) && (
                      <CheckCircle className="w-3.5 h-3.5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="mt-4 pt-4 border-t flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showRoutes}
                  onChange={(e) => setFilters(prev => ({ ...prev, showRoutes: e.target.checked }))}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm">إظهار المسارات</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.clusterMarkers}
                  onChange={(e) => setFilters(prev => ({ ...prev, clusterMarkers: e.target.checked }))}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm">تجميع العلامات</span>
              </label>
            </div>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="px-4 py-4 grid grid-cols-4 gap-2">
          <Card className="p-3 text-center card-shadow group hover:-translate-y-0.5 transition-all">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-1 group-hover:scale-110 transition-transform">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div className="text-lg font-bold text-primary">{toArabicNumerals(stats.totalLocations)}</div>
            <div className="text-xs text-muted-foreground">موقع</div>
          </Card>
          <Card className="p-3 text-center card-shadow group hover:-translate-y-0.5 transition-all">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-1 group-hover:scale-110 transition-transform">
              <Timer className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-lg font-bold text-blue-600">{toArabicNumerals(Math.round(stats.totalDuration / 60))}</div>
            <div className="text-xs text-muted-foreground">ساعة</div>
          </Card>
          <Card className="p-3 text-center card-shadow group hover:-translate-y-0.5 transition-all">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center mx-auto mb-1 group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-lg font-bold text-purple-600">{toArabicNumerals(stats.uniqueTypes)}</div>
            <div className="text-xs text-muted-foreground">نوع</div>
          </Card>
          <Card className="p-3 text-center card-shadow group hover:-translate-y-0.5 transition-all">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center mx-auto mb-1 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-lg font-bold text-amber-600">
              {stats.mostVisitedType ? locationTypeConfig[stats.mostVisitedType].label.substring(0, 4) : "-"}
            </div>
            <div className="text-xs text-muted-foreground">الأكثر</div>
          </Card>
        </div>

        {/* Map View */}
        {viewMode === "map" && (
          <div className="px-4">
            <Card className="overflow-hidden card-shadow-xl border-0 relative">
              {/* Map Container */}
              <div className="h-[50vh] relative">
                {loading ? (
                  <div className="h-full bg-muted flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                ) : (
                  <DynamicMap
                    center={mapCenter || undefined}
                    className="w-full h-full"
                    showUserLocation={false}
                  />
                )}
                
                {/* Map Controls */}
                <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-10 h-10 p-0 rounded-xl shadow-lg"
                    onClick={() => setMapZoom(prev => Math.min(prev + 1, 18))}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-10 h-10 p-0 rounded-xl shadow-lg"
                    onClick={() => setMapZoom(prev => Math.max(prev - 1, 2))}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-10 h-10 p-0 rounded-xl shadow-lg"
                    onClick={() => {
                      if (filteredLocations.length > 0) {
                        setMapCenter({
                          lat: filteredLocations[0].lat,
                          lng: filteredLocations[0].lng,
                        });
                      }
                    }}
                  >
                    <Locate className="w-4 h-4" />
                  </Button>
                </div>

                {/* Location count badge */}
                <div className="absolute top-4 left-4 z-[400]">
                  <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm shadow-lg gap-1 px-3 py-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    {toArabicNumerals(filteredLocations.length)} موقع
                  </Badge>
                </div>

                {/* Legend */}
                <div className="absolute bottom-4 left-4 right-4 z-[400]">
                  <Card className="p-3 bg-white/95 backdrop-blur-sm shadow-lg">
                    <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide text-xs">
                      {Object.entries(locationTypeConfig).slice(0, 4).map(([type, config]) => (
                        <div key={type} className="flex items-center gap-1.5 shrink-0">
                          <div className={cn("w-3 h-3 rounded-full", config.bgColor)} />
                          <span className="text-muted-foreground">{config.label}</span>
                        </div>
                      ))}
                      <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground">
                        <span>+٤</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="px-4 py-4 space-y-4">
            {/* Loading state */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-muted-foreground mt-2">جاري تحميل المواقع...</p>
              </div>
            )}

            {/* Empty state */}
            {!loading && filteredLocations.length === 0 && (
              <Card className="p-8 text-center card-shadow-xl">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center mx-auto mb-4">
                  <History className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-bold mb-2">لا توجد مواقع</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  لا توجد مواقع مطابقة للفلاتر المحددة
                </p>
                <Button onClick={clearFilters} variant="outline">
                  مسح الفلاتر
                </Button>
              </Card>
            )}

            {/* Location List */}
            {!loading && filteredLocations.length > 0 && (
              <div className="space-y-3">
                {filteredLocations.map((location, index) => {
                  const config = locationTypeConfig[location.type];
                  return (
                    <Card
                      key={location.id}
                      className="p-4 card-shadow-xl cursor-pointer hover:shadow-2xl transition-all hover:-translate-y-0.5 border border-transparent hover:border-primary/20 group animate-slide-up overflow-hidden relative"
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => setSelectedLocation(location)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-l from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-start gap-3 relative z-10">
                        {/* Icon */}
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", config.bgColor)}>
                          <span className={config.color}>{config.icon}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold truncate">{location.name}</span>
                            <Badge variant="secondary" className={cn("shrink-0 text-xs", config.bgColor, config.color)}>
                              {config.label}
                            </Badge>
                          </div>
                          
                          {location.address && (
                            <p className="text-sm text-muted-foreground truncate mb-2">
                              {location.address}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {formatRelativeTime(location.timestamp)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Timer className="w-3.5 h-3.5" />
                              {formatArabicDuration(location.duration, "minutes")}
                            </span>
                          </div>
                        </div>

                        {/* Arrow */}
                        <ChevronLeft className="w-5 h-5 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="px-4 py-4">
          <Card className="p-4 card-shadow-xl bg-gradient-to-l from-primary/10 via-teal-dark/5 to-primary/5 border-primary/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-teal-light/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-bold">تحليل أنماط التنقل</div>
                <div className="text-sm text-muted-foreground">
                  اكتشف أنماط تنقلك واقتراحات لتحسينها
                </div>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl">
                عرض
              </Button>
            </div>
          </Card>
        </div>

        {/* Timeline Summary */}
        <div className="px-4 pb-4">
          <Card className="p-4 card-shadow-xl">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              ملخص النشاط
            </h3>
            <div className="space-y-3">
              {/* Time distribution */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>الوقت المستغرق</span>
                  <span className="font-bold">{formatArabicDuration(stats.totalDuration, "minutes")}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-l from-primary to-teal-light rounded-full" style={{ width: `${Math.min(stats.totalDuration / 1440 * 100, 100)}%` }} />
                </div>
              </div>
              
              {/* Location types distribution */}
              <div className="pt-3 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">توزيع المواقع</span>
                </div>
                <div className="flex gap-1">
                  {Object.entries(locationTypeConfig).slice(0, 6).map(([type, config]) => {
                    const count = filteredLocations.filter(loc => loc.type === type).length;
                    const percentage = filteredLocations.length > 0 ? (count / filteredLocations.length) * 100 : 0;
                    return (
                      <div
                        key={type}
                        className={cn("h-2 rounded-full transition-all", config.bgColor)}
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                        title={`${config.label}: ${count}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <BottomNav />

      {/* Location Detail Dialog */}
      <Dialog open={!!selectedLocation} onOpenChange={() => setSelectedLocation(null)}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">تفاصيل الموقع</DialogTitle>
          </DialogHeader>
          {selectedLocation && (
            <div className="space-y-4 py-4">
              {/* Location Icon */}
              <div className="text-center">
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2",
                  locationTypeConfig[selectedLocation.type].bgColor
                )}>
                  <span className={cn("scale-150", locationTypeConfig[selectedLocation.type].color)}>
                    {locationTypeConfig[selectedLocation.type].icon}
                  </span>
                </div>
                <h3 className="font-bold text-lg">{selectedLocation.name}</h3>
                <Badge variant="secondary" className={cn(
                  "mt-2",
                  locationTypeConfig[selectedLocation.type].bgColor,
                  locationTypeConfig[selectedLocation.type].color
                )}>
                  {locationTypeConfig[selectedLocation.type].label}
                </Badge>
              </div>

              {/* Mini Map */}
              <div className="h-32 rounded-xl overflow-hidden border">
                <DynamicMap
                  center={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
                  className="w-full h-full"
                  showUserLocation={false}
                  markerLabel={selectedLocation.name}
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-muted/50 rounded-xl">
                  <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <div className="font-bold">{formatArabicTime(selectedLocation.timestamp)}</div>
                  <div className="text-xs text-muted-foreground">الوقت</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-xl">
                  <Timer className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                  <div className="font-bold">{formatArabicDuration(selectedLocation.duration, "minutes")}</div>
                  <div className="text-xs text-muted-foreground">المدة</div>
                </div>
              </div>

              {/* Address */}
              {selectedLocation.address && (
                <div className="p-3 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">{selectedLocation.address}</span>
                  </div>
                </div>
              )}

              {/* Date */}
              <div className="p-3 bg-muted/50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">التاريخ</span>
                  </div>
                  <span className="font-medium">{formatArabicDate(selectedLocation.timestamp)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl">
                  <Navigation className="w-4 h-4 ml-2" />
                  التنقل
                </Button>
                <Button className="flex-1 rounded-xl bg-primary">
                  <Eye className="w-4 h-4 ml-2" />
                  عرض على الخريطة
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
