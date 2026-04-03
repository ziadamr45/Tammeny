"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DynamicMap } from "@/components/tamenny/map-component";
import { BottomNav, Header } from "@/components/tamenny/bottom-nav";
import {
  MapPin,
  Clock,
  Route,
  Share2,
  ChevronLeft,
  Navigation,
  Gauge,
  AlertTriangle,
  CheckCircle,
  Shield,
  Timer,
  TrendingUp,
  MessageCircle,
  Download,
  Home,
  Building,
  ShoppingBag,
  GraduationCap,
  Star,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  toArabicNumerals,
  formatArabicDistance,
  formatArabicDuration,
  formatArabicDate,
  formatArabicTime,
} from "@/lib/arabic-numerals";

// Mock trip data
const MOCK_TRIP = {
  id: "trip-001",
  destination: "المكتب - مدينة نصر",
  origin: "منزلي - المعادي",
  startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
  endTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
  distance: 12.5,
  duration: 32,
  avgSpeed: 23.4,
  maxSpeed: 45,
  status: "completed",
  transportMode: "car",
  sharedWith: ["أحمد", "محمد", "سارة"],
  safetyScore: 95,
  originCoords: { lat: 29.958, lng: 31.247, name: "المعادي" },
  destinationCoords: { lat: 30.0444, lng: 31.2357, name: "مدينة نصر" },
  checkpoints: [
    { time: new Date(Date.now() - 2 * 60 * 60 * 1000), location: "المعادي", coords: { lat: 29.958, lng: 31.247 }, type: "start" },
    { time: new Date(Date.now() - 1.9 * 60 * 60 * 1000), location: "كوبري السيدة عائشة", coords: { lat: 29.98, lng: 31.25 }, type: "checkpoint" },
    { time: new Date(Date.now() - 1.8 * 60 * 60 * 1000), location: "المقطم", coords: { lat: 30.0, lng: 31.25 }, type: "checkpoint" },
    { time: new Date(Date.now() - 1.7 * 60 * 60 * 1000), location: "العباسية", coords: { lat: 30.02, lng: 31.24 }, type: "checkpoint" },
    { time: new Date(Date.now() - 1.6 * 60 * 60 * 1000), location: "روكسي", coords: { lat: 30.03, lng: 31.235 }, type: "checkpoint" },
    { time: new Date(Date.now() - 1.5 * 60 * 60 * 1000), location: "مدينة نصر", coords: { lat: 30.0444, lng: 31.2357 }, type: "end" },
  ],
  safetyEvents: [
    { time: new Date(Date.now() - 1.85 * 60 * 60 * 1000), type: "speed_alert", message: "تنبيه سرعة عالية", location: "المقطم", severity: "warning" },
    { time: new Date(Date.now() - 1.75 * 60 * 60 * 1000), type: "safe_zone_enter", message: "دخول منطقة آمنة", location: "قرب العباسية", severity: "info" },
    { time: new Date(Date.now() - 1.65 * 60 * 60 * 1000), type: "check_in", message: "تأكيد الأمان", location: "روكسي", severity: "success" },
  ],
  route: [
    { lat: 29.958, lng: 31.247 },
    { lat: 29.98, lng: 31.25 },
    { lat: 30.0, lng: 31.25 },
    { lat: 30.02, lng: 31.24 },
    { lat: 30.03, lng: 31.235 },
    { lat: 30.0444, lng: 31.2357 },
  ],
};

// Location type icons
const getLocationIcon = (type: string) => {
  switch (type) {
    case "start":
      return <Home className="w-4 h-4" />;
    case "end":
      return <Flag className="w-4 h-4" />;
    case "checkpoint":
      return <MapPin className="w-4 h-4" />;
    case "office":
      return <Building className="w-4 h-4" />;
    case "shopping":
      return <ShoppingBag className="w-4 h-4" />;
    case "university":
      return <GraduationCap className="w-4 h-4" />;
    case "favorite":
      return <Star className="w-4 h-4" />;
    default:
      return <MapPin className="w-4 h-4" />;
  }
};

// Safety event type icons and colors
const getSafetyEventStyle = (type: string) => {
  switch (type) {
    case "speed_alert":
      return { icon: <Gauge className="w-4 h-4" />, color: "text-orange-600", bg: "bg-orange-100", border: "border-orange-200" };
    case "safe_zone_enter":
      return { icon: <Shield className="w-4 h-4" />, color: "text-green-600", bg: "bg-green-100", border: "border-green-200" };
    case "safe_zone_exit":
      return { icon: <Shield className="w-4 h-4" />, color: "text-yellow-600", bg: "bg-yellow-100", border: "border-yellow-200" };
    case "check_in":
      return { icon: <CheckCircle className="w-4 h-4" />, color: "text-teal-600", bg: "bg-teal-100", border: "border-teal-200" };
    case "sos":
      return { icon: <AlertTriangle className="w-4 h-4" />, color: "text-red-600", bg: "bg-red-100", border: "border-red-200" };
    default:
      return { icon: <AlertTriangle className="w-4 h-4" />, color: "text-gray-600", bg: "bg-gray-100", border: "border-gray-200" };
  }
};

export default function TripDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showFullMap, setShowFullMap] = useState(false);

  // In a real app, we would fetch trip data based on tripId
  const trip = useMemo(() => MOCK_TRIP, []);

  // Calculate trip statistics
  const stats = useMemo(() => ({
    distance: trip.distance,
    duration: trip.duration,
    avgSpeed: trip.avgSpeed,
    maxSpeed: trip.maxSpeed,
    checkpointsCount: trip.checkpoints.length,
    safetyScore: trip.safetyScore,
  }), [trip]);

  // Format trip summary for sharing
  const tripSummary = `
رحلة طمنّي
━━━━━━━━━━━━━
📍 من: ${trip.origin}
📍 إلى: ${trip.destination}
━━━━━━━━━━━━━
📏 المسافة: ${formatArabicDistance(stats.distance)}
⏱️ المدة: ${formatArabicDuration(stats.duration, 'minutes')}
🚗 متوسط السرعة: ${toArabicNumerals(stats.avgSpeed.toFixed(1))} كم/ساعة
━━━━━━━━━━━━━
📅 ${formatArabicDate(trip.startTime)}
🕐 ${formatArabicTime(trip.startTime)} - ${formatArabicTime(trip.endTime)}
━━━━━━━━━━━━━
✅ حالة الرحلة: مكتملة
🛡️ درجة الأمان: ${toArabicNumerals(stats.safetyScore)}٪
━━━━━━━━━━━━━
تم مشاركة الموقع مع: ${trip.sharedWith.join('، ')}
  `.trim();

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "ملخص رحلة طمنّي",
          text: tripSummary,
        });
      } else {
        await navigator.clipboard.writeText(tripSummary);
        toast.success("تم نسخ ملخص الرحلة!");
      }
    } catch {
      await navigator.clipboard.writeText(tripSummary);
      toast.success("تم نسخ ملخص الرحلة!");
    }
    setShowShareDialog(false);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([tripSummary], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `trip-${tripId}-summary.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("تم تحميل ملخص الرحلة!");
  };

  return (
    <main className="min-h-screen bg-background pb-20">
      <Header />

      <div className="pt-16 px-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">تفاصيل الرحلة</h1>
            <p className="text-sm text-muted-foreground">
              {formatArabicDate(trip.startTime)}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowShareDialog(true)}
          >
            <Share2 className="w-4 h-4" />
            مشاركة
          </Button>
        </div>

        {/* Route Map */}
        <Card className="overflow-hidden card-shadow">
          <div className="h-48 relative overflow-hidden">
            <DynamicMap
              center={trip.originCoords}
              destination={trip.destinationCoords}
              waypoints={trip.checkpoints.slice(1, -1).map(c => ({
                lat: c.coords.lat,
                lng: c.coords.lng,
                name: c.location,
              }))}
              showRoute={true}
              routeStyle="completed"
              routeInfo={{
                distance: stats.distance,
                duration: stats.duration,
                progress: 100,
              }}
              className="h-full w-full"
            />
            
            {/* Expand map button */}
            <Button
              variant="secondary"
              size="sm"
              className="absolute bottom-2 left-2 gap-1.5 z-20"
              onClick={() => setShowFullMap(true)}
            >
              <Navigation className="w-4 h-4" />
              عرض كامل
            </Button>
          </div>

          {/* Origin & Destination */}
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <div className="w-0.5 h-8 bg-gradient-to-b from-green-500 to-red-500" />
                <div className="w-3 h-3 rounded-full bg-red-500" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground">من</div>
                  <div className="font-medium">{trip.origin}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">إلى</div>
                  <div className="font-medium">{trip.destination}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trip Statistics */}
        <Card className="card-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              إحصائيات الرحلة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {/* Distance */}
              <div className="p-3 bg-primary/5 rounded-xl border border-primary/20">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Route className="w-4 h-4" />
                  <span className="text-xs">المسافة</span>
                </div>
                <div className="text-xl font-bold">{formatArabicDistance(stats.distance)}</div>
              </div>

              {/* Duration */}
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs">المدة</span>
                </div>
                <div className="text-xl font-bold text-blue-600">{formatArabicDuration(stats.duration, 'minutes')}</div>
              </div>

              {/* Avg Speed */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-center gap-2 text-amber-600 mb-1">
                  <Gauge className="w-4 h-4" />
                  <span className="text-xs">متوسط السرعة</span>
                </div>
                <div className="text-xl font-bold text-amber-600">
                  {toArabicNumerals(stats.avgSpeed.toFixed(1))} كم/س
                </div>
              </div>

              {/* Max Speed */}
              <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                <div className="flex items-center gap-2 text-orange-600 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs">أقصى سرعة</span>
                </div>
                <div className="text-xl font-bold text-orange-600">
                  {toArabicNumerals(stats.maxSpeed)} كم/س
                </div>
              </div>
            </div>

            {/* Safety Score */}
            <div className="mt-4 p-4 bg-gradient-to-l from-teal-50 to-green-50 rounded-xl border border-teal-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <div className="font-medium">درجة الأمان</div>
                    <div className="text-sm text-muted-foreground">أداء ممتاز</div>
                  </div>
                </div>
                <div className="text-3xl font-bold text-teal-600">
                  {toArabicNumerals(stats.safetyScore)}٪
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trip Timeline */}
        <Card className="card-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Timer className="w-5 h-5 text-primary" />
              خط سير الرحلة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trip.checkpoints.map((checkpoint, index) => (
                <div key={index} className="flex gap-3">
                  {/* Timeline connector */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      checkpoint.type === "start"
                        ? "bg-green-100 text-green-600"
                        : checkpoint.type === "end"
                          ? "bg-red-100 text-red-600"
                          : "bg-primary/10 text-primary"
                    )}>
                      {getLocationIcon(checkpoint.type)}
                    </div>
                    {index < trip.checkpoints.length - 1 && (
                      <div className="w-0.5 h-12 bg-gradient-to-b from-primary/30 to-primary/10 my-1" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{checkpoint.location}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {toArabicNumerals(checkpoint.coords.lat.toFixed(4))}، {toArabicNumerals(checkpoint.coords.lng.toFixed(4))}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatArabicTime(checkpoint.time)}
                      </div>
                    </div>
                    
                    {checkpoint.type === "start" && (
                      <Badge variant="secondary" className="mt-2 bg-green-100 text-green-700">
                        نقطة الانطلاق
                      </Badge>
                    )}
                    {checkpoint.type === "end" && (
                      <Badge variant="secondary" className="mt-2 bg-red-100 text-red-700">
                        وجهة الوصول
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Safety Events */}
        <Card className="card-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              أحداث الأمان
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trip.safetyEvents.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>لا توجد أحداث أمان خلال هذه الرحلة</p>
              </div>
            ) : (
              <div className="space-y-3">
                {trip.safetyEvents.map((event, index) => {
                  const style = getSafetyEventStyle(event.type);
                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border",
                        style.bg,
                        style.border
                      )}
                    >
                      <div className={cn("p-2 rounded-lg", style.bg)}>
                        <span className={style.color}>{style.icon}</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{event.message}</div>
                        <div className="text-sm text-muted-foreground">
                          {event.location} • {formatArabicTime(event.time)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shared With */}
        <Card className="card-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              تمت المشاركة مع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {trip.sharedWith.map((person, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="px-3 py-1.5 text-sm"
                >
                  {person}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 rounded-xl gap-2"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4" />
            تحميل التقرير
          </Button>
          <Button
            className="flex-1 rounded-xl gap-2 bg-primary"
            onClick={() => setShowShareDialog(true)}
          >
            <Share2 className="w-4 h-4" />
            مشاركة الملخص
          </Button>
        </div>
      </div>

      <BottomNav />

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">مشاركة ملخص الرحلة</DialogTitle>
            <DialogDescription className="text-center">
              شارك تفاصيل هذه الرحلة مع الآخرين
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Preview */}
            <div className="p-4 bg-muted/50 rounded-xl text-sm whitespace-pre-wrap font-mono text-right" dir="rtl">
              {tripSummary.split('\n').slice(0, 8).join('\n')}...
            </div>

            {/* Share options */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="rounded-xl gap-2"
                onClick={() => {
                  navigator.clipboard.writeText(tripSummary);
                  toast.success("تم نسخ الملخص!");
                  setShowShareDialog(false);
                }}
              >
                <Share2 className="w-4 h-4" />
                نسخ
              </Button>
              <Button
                className="rounded-xl gap-2 bg-primary"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4" />
                مشاركة
              </Button>
            </div>

            {/* Quick contacts */}
            <div className="border-t pt-4">
              <div className="text-sm text-muted-foreground mb-2">إرسال سريع إلى:</div>
              <div className="flex gap-2">
                {trip.sharedWith.slice(0, 3).map((person, index) => (
                  <Button
                    key={index}
                    variant="secondary"
                    size="sm"
                    className="rounded-full gap-1"
                  >
                    <MessageCircle className="w-3 h-3" />
                    {person}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Map Dialog */}
      <Dialog open={showFullMap} onOpenChange={setShowFullMap}>
        <DialogContent className="max-w-full h-[90vh] p-0 rounded-2xl">
          <div className="relative w-full h-full">
            <DynamicMap
              center={trip.originCoords}
              destination={trip.destinationCoords}
              waypoints={trip.checkpoints.slice(1, -1).map(c => ({
                lat: c.coords.lat,
                lng: c.coords.lng,
                name: c.location,
              }))}
              showRoute={true}
              routeStyle="completed"
              routeInfo={{
                distance: stats.distance,
                duration: stats.duration,
                progress: 100,
              }}
              className="w-full h-full rounded-2xl"
            />
            
            {/* Close button */}
            <Button
              variant="secondary"
              className="absolute top-4 right-4 z-20 gap-2"
              onClick={() => setShowFullMap(false)}
            >
              <ChevronLeft className="w-4 h-4" />
              رجوع
            </Button>

            {/* Route info */}
            <div className="absolute bottom-4 left-4 right-4 z-20">
              <Card className="bg-white/95 backdrop-blur-sm">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Route className="w-4 h-4 text-primary" />
                        <span className="font-bold">{formatArabicDistance(stats.distance)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-blue-600">{formatArabicDuration(stats.duration, 'minutes')}</span>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700">
                      مكتملة
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
