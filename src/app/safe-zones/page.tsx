"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  MapPin,
  Plus,
  Home,
  Briefcase,
  GraduationCap,
  Building2,
  ShoppingBag,
  Heart,
  Star,
  Trash2,
  Edit3,
  Bell,
  BellOff,
  Map,
  CheckCircle2,
  AlertTriangle,
  Navigation,
  Shield,
  Loader2,
  Baby,
  Radar,
  Radio,
  Pause,
  Play,
} from "lucide-react";
import { BottomNav, Header } from "@/components/tamenny/bottom-nav";
import { DynamicMap } from "@/components/tamenny/map-component";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

// Types
interface SafeZone {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  radius: number;
  color: string;
  notifyOnEnter: boolean;
  notifyOnExit: boolean;
  childAlertEnabled: boolean;
  childName: string | null;
  createdAt: string;
}

type ZoneType = "home" | "work" | "school" | "family" | "shopping" | "favorite" | "other";
type ZoneColor = "safe" | "caution";

// Zone type configurations
const zoneTypeConfig: Record<ZoneType, { icon: React.ElementType; label: string; defaultColor: ZoneColor }> = {
  home: { icon: Home, label: "المنزل", defaultColor: "safe" },
  work: { icon: Briefcase, label: "العمل", defaultColor: "caution" },
  school: { icon: GraduationCap, label: "المدرسة", defaultColor: "safe" },
  family: { icon: Heart, label: "العائلة", defaultColor: "safe" },
  shopping: { icon: ShoppingBag, label: "التسوق", defaultColor: "caution" },
  favorite: { icon: Star, label: "مفضل", defaultColor: "safe" },
  other: { icon: MapPin, label: "أخرى", defaultColor: "caution" },
};

export default function SafeZonesPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [zones, setZones] = useState<SafeZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedZone, setSelectedZone] = useState<SafeZone | null>(null);
  const [showMapPreview, setShowMapPreview] = useState<string | null>(null);

  // ========================================
  // حالة مراقبة المناطق الآمنة
  // ========================================
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [monitoringLoading, setMonitoringLoading] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [swSupported, setSwSupported] = useState(true);

  // New zone form state
  const [newZone, setNewZone] = useState<Partial<SafeZone>>({
    name: "",
    type: "other",
    radius: 200,
    color: "safe",
    notifyOnEnter: true,
    notifyOnExit: true,
    childAlertEnabled: false,
    childName: null,
    latitude: 0,
    longitude: 0,
  });

  // ========================================
  // التحقق من دعم Service Worker
  // ========================================
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      setSwSupported(true);
      // التحقق من حالة المراقبة المحفوظة
      const savedMonitoring = localStorage.getItem('geofence_monitoring_active');
      if (savedMonitoring === 'true') {
        setMonitoringActive(true);
      }
    } else {
      setSwSupported(false);
    }
  }, []);

  // ========================================
  // الاستماع لرسائل Service Worker
  // ========================================
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'GET_LOCATION') {
        // Service Worker يطلب الموقع
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              // إرسال الموقع للـ Service Worker
              if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                  type: 'LOCATION_RESPONSE',
                  coords: {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                  },
                });
              }
              setCurrentPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            },
            () => {
              // خطأ في الحصول على الموقع
            },
            { enableHighAccuracy: true, timeout: 10000 }
          );
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, []);

  // ========================================
  // تفعيل/إيقاف مراقبة المناطق
  // ========================================
  const toggleMonitoring = useCallback(async () => {
    if (!swSupported) {
      toast.error('المتصفح لا يدعم هذه الميزة');
      return;
    }

    // التحقق من وجود مناطق
    if (zones.length === 0) {
      toast.error('أضف منطقة آمنة واحدة على الأقل');
      return;
    }

    setMonitoringLoading(true);

    try {
      // طلب إذن الموقع
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      if (permission.state === 'denied') {
        toast.error('إذن الموقع مرفوض. الرجاء تفعيله من الإعدادات');
        setMonitoringLoading(false);
        return;
      }

      // الحصول على الموقع الحالي
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
        });
      });

      setCurrentPosition({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });

      // إرسال رسالة للـ Service Worker
      const registration = await navigator.serviceWorker.ready;
      
      if (!monitoringActive) {
        // تفعيل المراقبة
        await registration.active?.postMessage({ type: 'START_GEOFENCE_MONITORING' });
        setMonitoringActive(true);
        localStorage.setItem('geofence_monitoring_active', 'true');
        toast.success('تم تفعيل مراقبة المناطق الآمنة');
      } else {
        // إيقاف المراقبة
        await registration.active?.postMessage({ type: 'STOP_GEOFENCE_MONITORING' });
        setMonitoringActive(false);
        localStorage.setItem('geofence_monitoring_active', 'false');
        toast.success('تم إيقاف مراقبة المناطق الآمنة');
      }
    } catch (err) {
      console.error('Error toggling monitoring:', err);
      toast.error('فشل في تغيير حالة المراقبة');
    } finally {
      setMonitoringLoading(false);
    }
  }, [monitoringActive, swSupported, zones.length]);

  // Get user's GPS location for new zone
  const getUserLocationForZone = useCallback(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setNewZone(prev => ({
            ...prev,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }));
        },
        () => {
          // Keep 0,0 — user will need to enter manually
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch safe zones from API
  const fetchZones = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch("/api/safe-zones");
      const data = await response.json();

      if (data.success) {
        setZones(data.safeZones);
        setError(null);
      } else {
        setError(data.error || "فشل في تحميل المناطق الآمنة");
      }
    } catch (err) {
      console.error("Error fetching safe zones:", err);
      setError("فشل في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch zones when user is available
  useEffect(() => {
    if (user?.id) {
      fetchZones();
    }
  }, [user?.id, fetchZones]);

  const handleAddZone = async () => {
    if (!newZone.name) {
      toast.error("الرجاء إدخال اسم المنطقة");
      return;
    }

    try {
      const response = await fetch("/api/safe-zones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newZone),
      });

      const data = await response.json();

      if (data.success) {
        setZones([...zones, data.safeZone]);
        setShowAddDialog(false);
        resetNewZone();
        toast.success("تم إضافة المنطقة الآمنة بنجاح");
      } else {
        toast.error(data.error || "فشل في إضافة المنطقة الآمنة");
      }
    } catch (err) {
      console.error("Error adding zone:", err);
      toast.error("فشل في إضافة المنطقة الآمنة");
    }
  };

  const handleEditZone = async () => {
    if (!selectedZone || !newZone.name) {
      toast.error("الرجاء إدخال اسم المنطقة");
      return;
    }

    try {
      const response = await fetch(`/api/safe-zones/${selectedZone.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newZone),
      });

      const data = await response.json();

      if (data.success) {
        setZones(zones.map((z) =>
          z.id === selectedZone.id ? data.safeZone : z
        ));
        setShowEditDialog(false);
        setSelectedZone(null);
        resetNewZone();
        toast.success("تم تحديث المنطقة الآمنة");
      } else {
        toast.error(data.error || "فشل في تحديث المنطقة الآمنة");
      }
    } catch (err) {
      console.error("Error editing zone:", err);
      toast.error("فشل في تحديث المنطقة الآمنة");
    }
  };

  const handleDeleteZone = async () => {
    if (!selectedZone) return;

    try {
      const response = await fetch(`/api/safe-zones/${selectedZone.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setZones(zones.filter((z) => z.id !== selectedZone.id));
        setShowDeleteDialog(false);
        setSelectedZone(null);
        toast.success("تم حذف المنطقة الآمنة");
      } else {
        toast.error(data.error || "فشل في حذف المنطقة الآمنة");
      }
    } catch (err) {
      console.error("Error deleting zone:", err);
      toast.error("فشل في حذف المنطقة الآمنة");
    }
  };

  const openEditDialog = (zone: SafeZone) => {
    setSelectedZone(zone);
    setNewZone({
      name: zone.name,
      type: zone.type,
      radius: zone.radius,
      color: zone.color,
      notifyOnEnter: zone.notifyOnEnter,
      notifyOnExit: zone.notifyOnExit,
      childAlertEnabled: zone.childAlertEnabled,
      childName: zone.childName,
      latitude: zone.latitude,
      longitude: zone.longitude,
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (zone: SafeZone) => {
    setSelectedZone(zone);
    setShowDeleteDialog(true);
  };

  const resetNewZone = () => {
    setNewZone({
      name: "",
      type: "other",
      radius: 200,
      color: "safe",
      notifyOnEnter: true,
      notifyOnExit: true,
      childAlertEnabled: false,
      childName: null,
      latitude: 0,
      longitude: 0,
    });
    getUserLocationForZone();
  };

  const safeZones = zones.filter((z) => z.color === "safe");
  const cautionZones = zones.filter((z) => z.color === "caution");

  return (
    <main className="min-h-screen bg-background pb-20">
      <Header />

      <div className="pt-16 px-4">
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
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold">المناطق الآمنة</h1>
                <p className="text-sm text-muted-foreground">
                  {zones.length} منطقة محفوظة
                </p>
              </div>
              <Button
                onClick={() => {
                  getUserLocationForZone();
                  setShowAddDialog(true);
                }}
                className="bg-primary rounded-xl"
              >
                <Plus className="w-4 h-4 ml-2" />
                إضافة منطقة
              </Button>
            </div>

            {/* ========================================
                بطاقة حالة المراقبة
            ======================================== */}
            <Card className={cn(
              "mb-4 p-4 border-2 transition-all",
              monitoringActive 
                ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700" 
                : "bg-muted/50 border-border"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    monitoringActive 
                      ? "bg-green-200 dark:bg-green-800" 
                      : "bg-muted"
                  )}>
                    {monitoringActive ? (
                      <Radar className="w-6 h-6 text-green-600 dark:text-green-400 animate-pulse" />
                    ) : (
                      <Radio className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h4 className={cn(
                      "font-medium",
                      monitoringActive ? "text-green-700 dark:text-green-400" : "text-foreground"
                    )}>
                      {monitoringActive ? "المراقبة نشطة" : "المراقبة متوقفة"}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {monitoringActive 
                        ? "يتم تتبع موقعك وإرسال الإشعارات" 
                        : "فعّل المراقبة للحصول على الإشعارات"
                      }
                    </p>
                  </div>
                </div>
                <Button
                  onClick={toggleMonitoring}
                  disabled={monitoringLoading || !swSupported || zones.length === 0}
                  variant={monitoringActive ? "destructive" : "default"}
                  className={cn(
                    "rounded-xl",
                    !monitoringActive && "bg-primary"
                  )}
                >
                  {monitoringLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : monitoringActive ? (
                    <>
                      <Pause className="w-4 h-4 ml-2" />
                      إيقاف
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 ml-2" />
                      تفعيل
                    </>
                  )}
                </Button>
              </div>
              
              {/* حالة الموقع الحالي */}
              {monitoringActive && currentPosition && (
                <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <Navigation className="w-4 h-4" />
                    <span>
                      الموقع الحالي: {currentPosition.lat.toFixed(4)}, {currentPosition.lng.toFixed(4)}
                    </span>
                  </div>
                </div>
              )}

              {/* رسالة عند عدم وجود مناطق */}
              {zones.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  أضف منطقة آمنة واحدة على الأقل لتفعيل المراقبة
                </p>
              )}
            </Card>

            {/* Info Banner */}
            <Card className="mb-4 p-4 bg-gradient-to-l from-primary/10 to-teal-500/5 border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-primary">نظام المناطق الآمنة</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    احصل على إشعارات عند دخول أو خروج أصدقائك من المناطق المحددة
                  </p>
                </div>
              </div>
            </Card>

            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">جاري التحميل...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <Card className="p-6 text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={fetchZones} variant="outline">
                  إعادة المحاولة
                </Button>
              </Card>
            )}

            {/* Safe Zones */}
            {!loading && !error && safeZones.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <h2 className="font-semibold">مناطق آمنة</h2>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    {safeZones.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {safeZones.map((zone) => (
                    <ZoneCard
                      key={zone.id}
                      zone={zone}
                      onEdit={openEditDialog}
                      onDelete={openDeleteDialog}
                      onShowMap={setShowMapPreview}
                      showMapPreview={showMapPreview === zone.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Caution Zones */}
            {!loading && !error && cautionZones.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <h2 className="font-semibold">مناطق تنبيه</h2>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                    {cautionZones.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {cautionZones.map((zone) => (
                    <ZoneCard
                      key={zone.id}
                      zone={zone}
                      onEdit={openEditDialog}
                      onDelete={openDeleteDialog}
                      onShowMap={setShowMapPreview}
                      showMapPreview={showMapPreview === zone.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && zones.length === 0 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-10 h-10 text-primary" />
                </div>
                <h3 className="font-medium text-lg mb-2">لا توجد مناطق آمنة</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  أضف مناطق آمنة للحصول على إشعارات عند الدخول والخروج
                </p>
                <Button
                  onClick={() => setShowAddDialog(true)}
                  variant="outline"
                  className="rounded-xl"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة منطقة جديدة
                </Button>
              </div>
            )}

            {/* Stats Cards */}
            {!loading && !error && zones.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold text-green-600">{safeZones.length}</div>
                      <div className="text-xs text-green-600/70">منطقة آمنة</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">{cautionZones.length}</div>
                      <div className="text-xs text-yellow-600/70">منطقة تنبيه</div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Tips Card */}
            {!loading && !error && (
              <Card className="p-4 bg-muted/50">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <Navigation className="w-4 h-4 text-primary" />
                  نصائح
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    <span>اضغط على المنطقة لعرضها على الخريطة</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    <span>يمكنك تعديل نصف قطر المنطقة من 50 إلى 500 متر</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    <span>المناطق الخضراء للمناطق الآمنة، الصفراء للتنبيه</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    <span>فعّل المراقبة للحصول على إشعارات الدخول والخروج</span>
                  </li>
                </ul>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Add Zone Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة منطقة آمنة جديدة</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Zone Name */}
            <div className="space-y-2">
              <Label>اسم المنطقة</Label>
              <Input
                value={newZone.name || ""}
                onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                placeholder="مثال: المنزل، العمل..."
                className="text-right"
              />
            </div>

            {/* Zone Type */}
            <div className="space-y-2">
              <Label>نوع المنطقة</Label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(zoneTypeConfig) as ZoneType[]).map((type) => {
                  const config = zoneTypeConfig[type];
                  const Icon = config.icon;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewZone({ ...newZone, type })}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all",
                        newZone.type === type
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <Icon className="w-5 h-5 text-primary" />
                      <span className="text-xs">{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Zone Color */}
            <div className="space-y-2">
              <Label>تصنيف المنطقة</Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setNewZone({ ...newZone, color: "safe" })}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all",
                    newZone.color === "safe"
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : "border-border hover:border-green-300"
                  )}
                >
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>آمنة</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewZone({ ...newZone, color: "caution" })}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all",
                    newZone.color === "caution"
                      ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                      : "border-border hover:border-yellow-300"
                  )}
                >
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <span>تنبيه</span>
                </button>
              </div>
            </div>

            {/* Radius */}
            <div className="space-y-2">
              <Label>نصف القطر: {newZone.radius} متر</Label>
              <Slider
                value={[newZone.radius || 200]}
                onValueChange={(value) => setNewZone({ ...newZone, radius: value[0] })}
                min={50}
                max={500}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>50م</span>
                <span>500م</span>
              </div>
            </div>

            {/* Alerts */}
            <div className="space-y-3">
              <Label>الإشعارات</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm">إشعار عند الدخول</span>
                <Switch
                  checked={newZone.notifyOnEnter}
                  onCheckedChange={(checked) => setNewZone({ ...newZone, notifyOnEnter: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">إشعار عند الخروج</span>
                <Switch
                  checked={newZone.notifyOnExit}
                  onCheckedChange={(checked) => setNewZone({ ...newZone, notifyOnExit: checked })}
                />
              </div>
            </div>

            {/* Child Exit Alert Section */}
            <div className="space-y-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Baby className="w-5 h-5 text-blue-500" />
                  <span className="font-medium text-sm">تنبيه خروج الأطفال</span>
                </div>
                <Switch
                  checked={newZone.childAlertEnabled}
                  onCheckedChange={(checked) => setNewZone({ ...newZone, childAlertEnabled: checked })}
                />
              </div>
              {newZone.childAlertEnabled && (
                <div className="space-y-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                  <Label className="text-xs">اسم الطفل</Label>
                  <Input
                    value={newZone.childName || ""}
                    onChange={(e) => setNewZone({ ...newZone, childName: e.target.value })}
                    placeholder="أدخل اسم الطفل"
                    className="text-right bg-white dark:bg-background"
                  />
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    سيتم إرسال تنبيه فوري عند خروج الطفل من هذه المنطقة
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              إلغاء
            </Button>
            <Button className="bg-primary" onClick={handleAddZone}>
              إضافة المنطقة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Zone Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل المنطقة الآمنة</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Zone Name */}
            <div className="space-y-2">
              <Label>اسم المنطقة</Label>
              <Input
                value={newZone.name || ""}
                onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                className="text-right"
              />
            </div>

            {/* Zone Type */}
            <div className="space-y-2">
              <Label>نوع المنطقة</Label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(zoneTypeConfig) as ZoneType[]).map((type) => {
                  const config = zoneTypeConfig[type];
                  const Icon = config.icon;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewZone({ ...newZone, type })}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all",
                        newZone.type === type
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <Icon className="w-5 h-5 text-primary" />
                      <span className="text-xs">{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Zone Color */}
            <div className="space-y-2">
              <Label>تصنيف المنطقة</Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setNewZone({ ...newZone, color: "safe" })}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all",
                    newZone.color === "safe"
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : "border-border hover:border-green-300"
                  )}
                >
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>آمنة</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewZone({ ...newZone, color: "caution" })}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all",
                    newZone.color === "caution"
                      ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                      : "border-border hover:border-yellow-300"
                  )}
                >
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <span>تنبيه</span>
                </button>
              </div>
            </div>

            {/* Radius */}
            <div className="space-y-2">
              <Label>نصف القطر: {newZone.radius} متر</Label>
              <Slider
                value={[newZone.radius || 200]}
                onValueChange={(value) => setNewZone({ ...newZone, radius: value[0] })}
                min={50}
                max={500}
                step={10}
                className="w-full"
              />
            </div>

            {/* Alerts */}
            <div className="space-y-3">
              <Label>الإشعارات</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm">إشعار عند الدخول</span>
                <Switch
                  checked={newZone.notifyOnEnter}
                  onCheckedChange={(checked) => setNewZone({ ...newZone, notifyOnEnter: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">إشعار عند الخروج</span>
                <Switch
                  checked={newZone.notifyOnExit}
                  onCheckedChange={(checked) => setNewZone({ ...newZone, notifyOnExit: checked })}
                />
              </div>
            </div>

            {/* Child Exit Alert Section */}
            <div className="space-y-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Baby className="w-5 h-5 text-blue-500" />
                  <span className="font-medium text-sm">تنبيه خروج الأطفال</span>
                </div>
                <Switch
                  checked={newZone.childAlertEnabled}
                  onCheckedChange={(checked) => setNewZone({ ...newZone, childAlertEnabled: checked })}
                />
              </div>
              {newZone.childAlertEnabled && (
                <div className="space-y-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                  <Label className="text-xs">اسم الطفل</Label>
                  <Input
                    value={newZone.childName || ""}
                    onChange={(e) => setNewZone({ ...newZone, childName: e.target.value })}
                    placeholder="أدخل اسم الطفل"
                    className="text-right bg-white dark:bg-background"
                  />
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    سيتم إرسال تنبيه فوري عند خروج الطفل من هذه المنطقة
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              إلغاء
            </Button>
            <Button className="bg-primary" onClick={handleEditZone}>
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المنطقة الآمنة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف "{selectedZone?.name}"؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteZone}
              className="bg-destructive hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Map Preview Dialog */}
      <Dialog open={!!showMapPreview} onOpenChange={() => setShowMapPreview(null)}>
        <DialogContent className="max-w-md h-[400px]">
          <DialogHeader>
            <DialogTitle>
              {zones.find((z) => z.id === showMapPreview)?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 rounded-xl overflow-hidden">
            {showMapPreview && (
              <DynamicMap
                center={{
                  lat: zones.find((z) => z.id === showMapPreview)?.latitude || 0,
                  lng: zones.find((z) => z.id === showMapPreview)?.longitude || 0,
                }}
                className="h-[280px] w-full"
                showUserLocation={false}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </main>
  );
}

// Zone Card Component
function ZoneCard({
  zone,
  onEdit,
  onDelete,
  onShowMap,
  showMapPreview,
}: {
  zone: SafeZone;
  onEdit: (zone: SafeZone) => void;
  onDelete: (zone: SafeZone) => void;
  onShowMap: (id: string | null) => void;
  showMapPreview: boolean;
}) {
  const typeConfig = zoneTypeConfig[zone.type as ZoneType] || zoneTypeConfig.other;
  const Icon = typeConfig.icon;

  return (
    <Card
      className={cn(
        "p-4 card-shadow transition-all cursor-pointer hover:shadow-lg",
        zone.color === "safe"
          ? "border-r-4 border-r-green-500"
          : "border-r-4 border-r-yellow-500"
      )}
      onClick={() => onShowMap(showMapPreview ? null : zone.id)}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            zone.color === "safe"
              ? "bg-green-100 dark:bg-green-900/30"
              : "bg-yellow-100 dark:bg-yellow-900/30"
          )}
        >
          <Icon
            className={cn(
              "w-6 h-6",
              zone.color === "safe" ? "text-green-600" : "text-yellow-600"
            )}
          />
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{zone.name}</h3>
            <Badge
              variant="secondary"
              className={cn(
                "text-xs",
                zone.color === "safe"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
              )}
            >
              {typeConfig.label}
            </Badge>
          </div>

          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {zone.radius}م
            </span>
            <span className="flex items-center gap-1">
              {zone.notifyOnEnter || zone.notifyOnExit ? (
                <Bell className="w-3 h-3 text-green-500" />
              ) : (
                <BellOff className="w-3 h-3 text-muted-foreground" />
              )}
              {zone.notifyOnEnter || zone.notifyOnExit ? "الإشعارات مفعلة" : "الإشعارات معطلة"}
            </span>
          </div>

          {/* Alert badges */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {zone.notifyOnEnter && (
              <Badge variant="outline" className="text-xs border-green-300 text-green-600">
                دخول
              </Badge>
            )}
            {zone.notifyOnExit && (
              <Badge variant="outline" className="text-xs border-blue-300 text-blue-600">
                خروج
              </Badge>
            )}
            {zone.childAlertEnabled && (
              <Badge variant="outline" className="text-xs border-purple-300 text-purple-600 dark:border-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20">
                <Baby className="w-3 h-3 ml-1" />
                {zone.childName || "طفل"}
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(zone);
            }}
          >
            <Edit3 className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(zone);
            }}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Mini Map Preview */}
      {showMapPreview && (
        <div className="mt-3 rounded-xl overflow-hidden border border-border">
          <DynamicMap
            center={{ lat: zone.latitude, lng: zone.longitude }}
            className="h-32 w-full"
            showUserLocation={false}
          />
        </div>
      )}
    </Card>
  );
}
