"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Navigation,
  Clock,
  Calendar,
  ChevronLeft,
  Share2,
  Trash2,
  Download,
  Filter,
  TrendingUp,
  Route,
  Car,
  Footprints,
  Bike,
  CheckCircle,
  XCircle,
  Timer,
  Zap,
  BarChart3,
  FileText,
  Home,
  Building,
  GraduationCap,
  ShoppingBag,
  Star,
  Heart,
  Train,
  Eye,
  Map,
  Loader2,
} from "lucide-react";
import { BottomNav, Header } from "@/components/tamenny/bottom-nav";
import { LocationTimeline, LocationStats, LocationEntry, LocationType } from "@/components/tamenny/location-timeline";
import { OfflineIndicator } from "@/components/tamenny/offline-indicator";
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

// Mock session history
const SESSION_HISTORY = [
  {
    id: "1",
    destination: "المكتب",
    origin: "المنزل",
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    endTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
    distance: 5.2,
    duration: 32,
    status: "completed",
    sharedWith: ["أحمد", "محمد"],
    transportMode: "car",
    locationType: "work" as LocationType,
  },
  {
    id: "2",
    destination: "منزل الأهل",
    origin: "المنزل",
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() - 23 * 60 * 60 * 1000),
    distance: 12.5,
    duration: 45,
    status: "completed",
    sharedWith: ["سارة"],
    transportMode: "car",
    locationType: "family" as LocationType,
  },
  {
    id: "3",
    destination: "الجامعة",
    origin: "المنزل",
    startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 35 * 60 * 1000),
    distance: 8.7,
    duration: 35,
    status: "completed",
    sharedWith: ["مجموعة العائلة"],
    transportMode: "walking",
    locationType: "school" as LocationType,
  },
  {
    id: "4",
    destination: "المطار",
    origin: "المنزل",
    startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endTime: null,
    distance: 25.3,
    duration: 55,
    status: "cancelled",
    sharedWith: ["أحمد"],
    transportMode: "car",
    locationType: "other" as LocationType,
  },
  {
    id: "5",
    destination: "النادي",
    origin: "المنزل",
    startTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000),
    distance: 3.2,
    duration: 20,
    status: "completed",
    sharedWith: ["محمد", "خالد"],
    transportMode: "bike",
    locationType: "favorite" as LocationType,
  },
];

// Mock location history for timeline
const LOCATION_HISTORY: LocationEntry[] = [
  {
    id: "loc-1",
    name: "المنزل",
    type: "home",
    lat: 29.958,
    lng: 31.247,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    duration: 480,
  },
  {
    id: "loc-2",
    name: "المكتب - مدينة نصر",
    type: "work",
    lat: 30.0444,
    lng: 31.2357,
    timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000),
    duration: 120,
    distance: 12.5,
    transportMode: "car",
  },
  {
    id: "loc-3",
    name: "مطعم لكسمبورج",
    type: "favorite",
    lat: 30.05,
    lng: 31.24,
    timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000),
    duration: 60,
    distance: 2.3,
    transportMode: "car",
  },
  {
    id: "loc-4",
    name: "منزل الأهل - مصر الجديدة",
    type: "family",
    lat: 30.08,
    lng: 31.3,
    timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000),
    duration: 180,
    distance: 5.0,
    transportMode: "car",
  },
  {
    id: "loc-5",
    name: "المنزل",
    type: "home",
    lat: 29.958,
    lng: 31.247,
    timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000),
    duration: 480,
    distance: 15.2,
    transportMode: "car",
  },
  {
    id: "loc-6",
    name: "مول سيتي ستارز",
    type: "shopping",
    lat: 30.07,
    lng: 31.29,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    duration: 120,
    distance: 8.5,
    transportMode: "car",
  },
  {
    id: "loc-7",
    name: "المنزل",
    type: "home",
    lat: 29.958,
    lng: 31.247,
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    distance: 10.2,
    transportMode: "car",
  },
];

type FilterType = "all" | "completed" | "cancelled";
type TimeFilter = "week" | "month" | "all";
type ViewMode = "sessions" | "timeline";
type LocationTypeFilter = "all" | LocationType;

export default function HistoryPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [selectedSession, setSelectedSession] = useState<typeof SESSION_HISTORY[0] | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");
  const [viewMode, setViewMode] = useState<ViewMode>("sessions");
  const [locationTypeFilter, setLocationTypeFilter] = useState<LocationTypeFilter>("all");
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Filter sessions
  const filteredSessions = useMemo(() => {
    return SESSION_HISTORY.filter((session) => {
      if (filter === "all") return true;
      return session.status === filter;
    }).filter((session) => {
      const now = new Date();
      const sessionDate = new Date(session.startTime);
      if (timeFilter === "week") {
        return (now.getTime() - sessionDate.getTime()) < 7 * 24 * 60 * 60 * 1000;
      }
      if (timeFilter === "month") {
        return (now.getTime() - sessionDate.getTime()) < 30 * 24 * 60 * 60 * 1000;
      }
      return true;
    });
  }, [filter, timeFilter]);

  // Filter location history
  const filteredLocations = useMemo(() => {
    if (locationTypeFilter === "all") return LOCATION_HISTORY;
    return LOCATION_HISTORY.filter((loc) => loc.type === locationTypeFilter);
  }, [locationTypeFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const completed = SESSION_HISTORY.filter(s => s.status === "completed");
    return {
      totalDistance: completed.reduce((acc, s) => acc + s.distance, 0),
      totalTrips: completed.length,
      totalTime: completed.reduce((acc, s) => acc + s.duration, 0),
      avgSpeed: completed.length > 0 
        ? completed.reduce((acc, s) => acc + (s.distance / (s.duration / 60)), 0) / completed.length 
        : 0,
    };
  }, []);

  const formatDate = (date: Date) => {
    return formatArabicDate(date);
  };

  const formatTime = (date: Date) => {
    return formatArabicTime(date);
  };

  const handleShare = (session: typeof SESSION_HISTORY[0]) => {
    toast.success("تم نسخ تفاصيل الرحلة!");
  };

  const handleDelete = (session: typeof SESSION_HISTORY[0]) => {
    toast.success("تم حذف الرحلة من السجل");
    setSelectedSession(null);
  };

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case "car": return <Car className="w-4 h-4" />;
      case "walking": return <Footprints className="w-4 h-4" />;
      case "bike": return <Bike className="w-4 h-4" />;
      default: return <Car className="w-4 h-4" />;
    }
  };

  // Export data
  const handleExport = (format: "json" | "csv" | "txt") => {
    const data = viewMode === "sessions" ? filteredSessions : filteredLocations;
    
    let content = "";
    let filename = "";
    let mimeType = "";

    if (format === "json") {
      content = JSON.stringify(data, null, 2);
      filename = "tamenny-export.json";
      mimeType = "application/json";
    } else if (format === "csv") {
      if (viewMode === "sessions") {
        content = "الوجهة,المسافة (كم),المدة (دقيقة),الحالة,التاريخ\n";
        filteredSessions.forEach(s => {
          content += `${s.destination},${s.distance},${s.duration},${s.status === "completed" ? "مكتملة" : "ملغاة"},${formatDate(s.startTime)}\n`;
        });
      } else {
        content = "الموقع,النوع,الإحداثيات,التاريخ,الوقت\n";
        filteredLocations.forEach(l => {
          content += `${l.name},${l.type},${l.lat},${l.lng},${formatDate(l.timestamp)},${formatTime(l.timestamp)}\n`;
        });
      }
      filename = "tamenny-export.csv";
      mimeType = "text/csv;charset=utf-8";
    } else {
      content = viewMode === "sessions" 
        ? `سجل الرحلات - طمنّي\n${"=".repeat(30)}\n\n` + 
          filteredSessions.map(s => 
            `📍 ${s.destination}\n   المسافة: ${formatArabicDistance(s.distance)}\n   المدة: ${formatArabicDuration(s.duration, 'minutes')}\n   الحالة: ${s.status === "completed" ? "مكتملة" : "ملغاة"}\n   التاريخ: ${formatDate(s.startTime)}\n`
          ).join("\n")
        : `سجل المواقع - طمنّي\n${"=".repeat(30)}\n\n` +
          filteredLocations.map(l =>
            `📍 ${l.name}\n   النوع: ${l.type}\n   الإحداثيات: ${toArabicNumerals(l.lat.toFixed(4))}، ${toArabicNumerals(l.lng.toFixed(4))}\n   الوقت: ${formatTime(l.timestamp)}\n`
          ).join("\n");
      filename = "tamenny-export.txt";
      mimeType = "text/plain;charset=utf-8";
    }

    const blob = new Blob(["\ufeff" + content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setShowExportDialog(false);
    toast.success("تم تصدير البيانات بنجاح!");
  };

  return (
    <main className="min-h-screen bg-background pb-20">
      <OfflineIndicator />
      <Header />

      <div className="pt-16 px-4 space-y-4">
        {/* Auth Loading State */}
        {authLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        )}

        {/* Content - only show when authenticated */}
        {!authLoading && isAuthenticated && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">السجل</h1>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setShowExportDialog(true)}
                >
                  <Download className="w-4 h-4" />
                  تصدير
                </Button>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-4 gap-2">
              <Card className="p-3 text-center card-shadow">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-1">
                  <Route className="w-4 h-4 text-primary" />
                </div>
                <div className="text-lg font-bold text-primary">{toArabicNumerals(stats.totalTrips)}</div>
                <div className="text-xs text-muted-foreground">رحلة</div>
              </Card>
              <Card className="p-3 text-center card-shadow">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center mx-auto mb-1">
                  <MapPin className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-lg font-bold text-green-600">{toArabicNumerals(stats.totalDistance.toFixed(0))}</div>
                <div className="text-xs text-muted-foreground">كم</div>
              </Card>
          <Card className="p-3 text-center card-shadow">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-1">
              <Timer className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-lg font-bold text-blue-600">{toArabicNumerals(Math.round(stats.totalTime / 60))}</div>
            <div className="text-xs text-muted-foreground">ساعة</div>
          </Card>
          <Card className="p-3 text-center card-shadow">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center mx-auto mb-1">
              <Zap className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-lg font-bold text-amber-600">{toArabicNumerals(stats.avgSpeed.toFixed(0))}</div>
            <div className="text-xs text-muted-foreground">كم/س</div>
          </Card>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === "sessions" ? "default" : "outline"}
            size="sm"
            className={cn(
              "flex-1 rounded-xl gap-2",
              viewMode === "sessions" && "bg-primary"
            )}
            onClick={() => setViewMode("sessions")}
          >
            <Route className="w-4 h-4" />
            الرحلات
          </Button>
          <Button
            variant={viewMode === "timeline" ? "default" : "outline"}
            size="sm"
            className={cn(
              "flex-1 rounded-xl gap-2",
              viewMode === "timeline" && "bg-primary"
            )}
            onClick={() => setViewMode("timeline")}
          >
            <Clock className="w-4 h-4" />
            المواقع
          </Button>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Time filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { value: "week", label: "هذا الأسبوع" },
              { value: "month", label: "هذا الشهر" },
              { value: "all", label: "الكل" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTimeFilter(opt.value as TimeFilter)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm transition-all border-2 whitespace-nowrap",
                  timeFilter === opt.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Status/Type filter based on view mode */}
          {viewMode === "sessions" ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                { value: "all", label: "الكل", icon: BarChart3 },
                { value: "completed", label: "مكتملة", icon: CheckCircle },
                { value: "cancelled", label: "ملغاة", icon: XCircle },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value as FilterType)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-2 border-2 whitespace-nowrap",
                    filter === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <opt.icon className="w-4 h-4" />
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            <Select value={locationTypeFilter} onValueChange={(v) => setLocationTypeFilter(v as LocationTypeFilter)}>
              <SelectTrigger className="w-full rounded-xl">
                <SelectValue placeholder="فلترة حسب نوع الموقع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المواقع</SelectItem>
                <SelectItem value="home">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-green-600" />
                    المنزل
                  </div>
                </SelectItem>
                <SelectItem value="work">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-600" />
                    العمل
                  </div>
                </SelectItem>
                <SelectItem value="school">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-purple-600" />
                    الدراسة
                  </div>
                </SelectItem>
                <SelectItem value="shopping">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-orange-600" />
                    التسوق
                  </div>
                </SelectItem>
                <SelectItem value="favorite">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-600" />
                    المفضل
                  </div>
                </SelectItem>
                <SelectItem value="family">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-600" />
                    الأهل
                  </div>
                </SelectItem>
                <SelectItem value="transit">
                  <div className="flex items-center gap-2">
                    <Train className="w-4 h-4 text-cyan-600" />
                    في الطريق
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Content based on view mode */}
        {viewMode === "sessions" ? (
          /* Session List */
          <div className="space-y-3">
            {filteredSessions.length === 0 ? (
              <Card className="p-8 text-center card-shadow">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Route className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">لا توجد رحلات في هذه الفترة</p>
              </Card>
            ) : (
              filteredSessions.map((session) => (
                <Card
                  key={session.id}
                  className="p-4 card-shadow cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5 border border-transparent hover:border-primary/20"
                  onClick={() => router.push(`/trip/${session.id}`)}
                >
                  <div className="flex items-start gap-3">
                    {/* Status Icon */}
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                      session.status === "completed"
                        ? "bg-green-100"
                        : "bg-red-100"
                    )}>
                      {session.status === "completed" ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{session.destination}</span>
                        <Badge variant="secondary" className="shrink-0 gap-1">
                          {getTransportIcon(session.transportMode)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(session.startTime)}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3 h-3 text-primary" />
                          <span className="font-medium">{formatArabicDistance(session.distance)}</span>
                        </span>
                        <span className="flex items-center gap-1 text-sm">
                          <Clock className="w-3 h-3 text-blue-600" />
                          <span className="font-medium">{formatArabicDuration(session.duration, 'minutes')}</span>
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronLeft className="w-5 h-5 text-muted-foreground shrink-0" />
                  </div>

                  {/* Quick actions */}
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 gap-1 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/trip/${session.id}`);
                      }}
                    >
                      <Eye className="w-3 h-3" />
                      عرض التفاصيل
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 gap-1 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(session);
                      }}
                    >
                      <Share2 className="w-3 h-3" />
                      مشاركة
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        ) : (
          /* Location Timeline */
          <div className="space-y-4">
            <LocationStats locations={filteredLocations} />
            <LocationTimeline
              locations={filteredLocations}
              onLocationClick={(location) => {
                console.log("Location clicked:", location);
              }}
            />
          </div>
        )}

        {/* Weekly Summary */}
        <Card className="p-4 card-shadow bg-gradient-to-l from-primary/10 to-teal-dark/5 border-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">ملخص الأسبوع</h3>
              <p className="text-xs text-muted-foreground">تحسن بنسبة {toArabicNumerals(15)}٪ عن الأسبوع الماضي</p>
            </div>
          </div>
          
          {/* Progress bars */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>المسافة المقطوعة</span>
                <span className="font-medium">{formatArabicDistance(45)}</span>
              </div>
              <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: '75%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>الوقت المستغرق</span>
                <span className="font-medium">{toArabicNumerals(3)} ساعات</span>
              </div>
              <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: '60%' }} />
              </div>
            </div>
          </div>
        </Card>
          </>
        )}
      </div>

      <BottomNav />

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">تصدير البيانات</DialogTitle>
            <DialogDescription className="text-center">
              اختر صيغة التصدير المناسبة
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 rounded-xl h-auto py-4"
              onClick={() => handleExport("json")}
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-right">
                <div className="font-medium">JSON</div>
                <div className="text-xs text-muted-foreground">للمطورين والتطبيقات</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 rounded-xl h-auto py-4"
              onClick={() => handleExport("csv")}
            >
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-right">
                <div className="font-medium">CSV</div>
                <div className="text-xs text-muted-foreground">للجداول و Excel</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 rounded-xl h-auto py-4"
              onClick={() => handleExport("txt")}
            >
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-right">
                <div className="font-medium">نص عادي</div>
                <div className="text-xs text-muted-foreground">للمشاركة والقراءة</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Session Detail Modal */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">تفاصيل الرحلة</DialogTitle>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4 py-4">
              {/* Destination */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg">{selectedSession.destination}</h3>
                <Badge
                  variant="secondary"
                  className={cn(
                    "mt-2",
                    selectedSession.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  )}
                >
                  {selectedSession.status === "completed" ? "مكتملة" : "ملغاة"}
                </Badge>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-muted/50 rounded-xl">
                  <MapPin className="w-5 h-5 text-primary mx-auto mb-1" />
                  <div className="font-bold">{formatArabicDistance(selectedSession.distance)}</div>
                  <div className="text-xs text-muted-foreground">مسافة</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-xl">
                  <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <div className="font-bold">{formatArabicDuration(selectedSession.duration, 'minutes')}</div>
                  <div className="text-xs text-muted-foreground">مدة</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-xl">
                  {getTransportIcon(selectedSession.transportMode)}
                  <div className="font-bold mt-1">
                    {selectedSession.transportMode === "car" ? "سيارة" : selectedSession.transportMode === "walking" ? "مشي" : "دراجة"}
                  </div>
                  <div className="text-xs text-muted-foreground">النوع</div>
                </div>
              </div>

              {/* Time info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                  <span className="text-muted-foreground">وقت البدء</span>
                  <span className="font-medium">{formatTime(new Date(selectedSession.startTime))}</span>
                </div>
                {selectedSession.endTime && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                    <span className="text-muted-foreground">وقت الوصول</span>
                    <span className="font-medium">{formatTime(new Date(selectedSession.endTime))}</span>
                  </div>
                )}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                  <span className="text-muted-foreground">التاريخ</span>
                  <span className="font-medium">{formatDate(new Date(selectedSession.startTime))}</span>
                </div>
              </div>

              {/* Shared with */}
              <div className="p-3 bg-muted/50 rounded-xl">
                <span className="text-sm text-muted-foreground">تمت المشاركة مع:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedSession.sharedWith.map((person) => (
                    <Badge key={person} variant="secondary" className="gap-1">
                      {person}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => handleDelete(selectedSession)}
                >
                  <Trash2 className="w-4 h-4 ml-2" />
                  حذف
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-primary"
                  onClick={() => handleShare(selectedSession)}
                >
                  <Share2 className="w-4 h-4 ml-2" />
                  مشاركة
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
