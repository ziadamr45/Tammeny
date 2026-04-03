"use client";

import { useState } from "react";
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
} from "lucide-react";
import { BottomNav, Header } from "@/components/tamenny/bottom-nav";
import { DynamicMap } from "@/components/tamenny/map-component";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Types
interface SafeZone {
  id: string;
  name: string;
  type: ZoneType;
  lat: number;
  lng: number;
  radius: number;
  color: ZoneColor;
  notifications: boolean;
  enterAlert: boolean;
  exitAlert: boolean;
  createdAt: Date;
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

// Mock initial safe zones
const INITIAL_ZONES: SafeZone[] = [
  {
    id: "1",
    name: "المنزل",
    type: "home",
    lat: 30.0444,
    lng: 31.2357,
    radius: 200,
    color: "safe",
    notifications: true,
    enterAlert: true,
    exitAlert: true,
    createdAt: new Date("2025-01-15"),
  },
  {
    id: "2",
    name: "العمل",
    type: "work",
    lat: 30.0564,
    lng: 31.2273,
    radius: 150,
    color: "caution",
    notifications: true,
    enterAlert: true,
    exitAlert: false,
    createdAt: new Date("2025-02-10"),
  },
  {
    id: "3",
    name: "مدرسة الأبناء",
    type: "school",
    lat: 30.0334,
    lng: 31.2427,
    radius: 100,
    color: "safe",
    notifications: true,
    enterAlert: true,
    exitAlert: true,
    createdAt: new Date("2025-03-01"),
  },
];

export default function SafeZonesPage() {
  const [zones, setZones] = useState<SafeZone[]>(INITIAL_ZONES);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedZone, setSelectedZone] = useState<SafeZone | null>(null);
  const [showMapPreview, setShowMapPreview] = useState<string | null>(null);

  // New zone form state
  const [newZone, setNewZone] = useState<Partial<SafeZone>>({
    name: "",
    type: "other",
    radius: 200,
    color: "safe",
    notifications: true,
    enterAlert: true,
    exitAlert: true,
    lat: 30.0444,
    lng: 31.2357,
  });

  const handleAddZone = () => {
    if (!newZone.name) {
      toast.error("الرجاء إدخال اسم المنطقة");
      return;
    }

    const zone: SafeZone = {
      id: Date.now().toString(),
      name: newZone.name || "",
      type: newZone.type || "other",
      lat: newZone.lat || 30.0444,
      lng: newZone.lng || 31.2357,
      radius: newZone.radius || 200,
      color: newZone.color || "safe",
      notifications: newZone.notifications ?? true,
      enterAlert: newZone.enterAlert ?? true,
      exitAlert: newZone.exitAlert ?? true,
      createdAt: new Date(),
    };

    setZones([...zones, zone]);
    setShowAddDialog(false);
    resetNewZone();
    toast.success("تم إضافة المنطقة الآمنة بنجاح");
  };

  const handleEditZone = () => {
    if (!selectedZone || !newZone.name) {
      toast.error("الرجاء إدخال اسم المنطقة");
      return;
    }

    setZones(zones.map((z) =>
      z.id === selectedZone.id
        ? { ...z, ...newZone, name: newZone.name || z.name }
        : z
    ));
    setShowEditDialog(false);
    setSelectedZone(null);
    resetNewZone();
    toast.success("تم تحديث المنطقة الآمنة");
  };

  const handleDeleteZone = () => {
    if (!selectedZone) return;

    setZones(zones.filter((z) => z.id !== selectedZone.id));
    setShowDeleteDialog(false);
    setSelectedZone(null);
    toast.success("تم حذف المنطقة الآمنة");
  };

  const toggleNotifications = (zoneId: string) => {
    setZones(
      zones.map((z) =>
        z.id === zoneId ? { ...z, notifications: !z.notifications } : z
      )
    );
    const zone = zones.find((z) => z.id === zoneId);
    toast.success(zone?.notifications ? "تم إيقاف الإشعارات" : "تم تفعيل الإشعارات");
  };

  const openEditDialog = (zone: SafeZone) => {
    setSelectedZone(zone);
    setNewZone({
      name: zone.name,
      type: zone.type,
      radius: zone.radius,
      color: zone.color,
      notifications: zone.notifications,
      enterAlert: zone.enterAlert,
      exitAlert: zone.exitAlert,
      lat: zone.lat,
      lng: zone.lng,
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
      notifications: true,
      enterAlert: true,
      exitAlert: true,
      lat: 30.0444,
      lng: 31.2357,
    });
  };

  const safeZones = zones.filter((z) => z.color === "safe");
  const cautionZones = zones.filter((z) => z.color === "caution");

  return (
    <main className="min-h-screen bg-background pb-20">
      <Header />

      <div className="pt-16 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">المناطق الآمنة</h1>
            <p className="text-sm text-muted-foreground">
              {zones.length} منطقة محفوظة
            </p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-primary rounded-xl"
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة منطقة
          </Button>
        </div>

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

        {/* Safe Zones */}
        {safeZones.length > 0 && (
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
                  onToggleNotifications={toggleNotifications}
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
        {cautionZones.length > 0 && (
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
                  onToggleNotifications={toggleNotifications}
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
        {zones.length === 0 && (
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
        {zones.length > 0 && (
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
          </ul>
        </Card>
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
                  checked={newZone.enterAlert}
                  onCheckedChange={(checked) => setNewZone({ ...newZone, enterAlert: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">إشعار عند الخروج</span>
                <Switch
                  checked={newZone.exitAlert}
                  onCheckedChange={(checked) => setNewZone({ ...newZone, exitAlert: checked })}
                />
              </div>
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
                  checked={newZone.enterAlert}
                  onCheckedChange={(checked) => setNewZone({ ...newZone, enterAlert: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">إشعار عند الخروج</span>
                <Switch
                  checked={newZone.exitAlert}
                  onCheckedChange={(checked) => setNewZone({ ...newZone, exitAlert: checked })}
                />
              </div>
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
                  lat: zones.find((z) => z.id === showMapPreview)?.lat || 30.0444,
                  lng: zones.find((z) => z.id === showMapPreview)?.lng || 31.2357,
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
  onToggleNotifications,
  onEdit,
  onDelete,
  onShowMap,
  showMapPreview,
}: {
  zone: SafeZone;
  onToggleNotifications: (id: string) => void;
  onEdit: (zone: SafeZone) => void;
  onDelete: (zone: SafeZone) => void;
  onShowMap: (id: string | null) => void;
  showMapPreview: boolean;
}) {
  const typeConfig = zoneTypeConfig[zone.type];
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
              {zone.notifications ? (
                <Bell className="w-3 h-3 text-green-500" />
              ) : (
                <BellOff className="w-3 h-3 text-muted-foreground" />
              )}
              {zone.notifications ? "الإشعارات مفعلة" : "الإشعارات معطلة"}
            </span>
          </div>

          {/* Alert badges */}
          <div className="flex items-center gap-2 mt-2">
            {zone.enterAlert && (
              <Badge variant="outline" className="text-xs border-green-300 text-green-600">
                دخول
              </Badge>
            )}
            {zone.exitAlert && (
              <Badge variant="outline" className="text-xs border-blue-300 text-blue-600">
                خروج
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
            center={{ lat: zone.lat, lng: zone.lng }}
            className="h-32 w-full"
            showUserLocation={false}
          />
        </div>
      )}

      {/* Toggle notifications */}
      <div
        className="flex items-center justify-between mt-3 pt-3 border-t border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-sm text-muted-foreground">الإشعارات</span>
        <Switch
          checked={zone.notifications}
          onCheckedChange={() => onToggleNotifications(zone.id)}
        />
      </div>
    </Card>
  );
}
