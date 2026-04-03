"use client";

import { useState, useEffect, useRef } from "react";
import { BottomNav, Header } from "@/components/tamenny/bottom-nav";
import { StatusCard, ActionButton, ShareOption, DestinationCard } from "@/components/tamenny/share-card";
import { MapPin, Navigation, Clock, Shield, Eye, Plus, AlertTriangle, StopCircle, Share2, Phone, AlertCircle, Bell, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Status types
type AppStatus = "idle" | "tracking" | "sharing";

// Mock location for demo
const MOCK_LOCATION = {
  lat: 30.0444,
  lng: 31.2357,
  name: "القاهرة، مصر",
};

export default function HomePage() {
  const [status, setStatus] = useState<AppStatus>("idle");
  const [location, setLocation] = useState<typeof MOCK_LOCATION | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(5);
  const [destination, setDestination] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Get current location on mount
  useEffect(() => {
    let mounted = true;
    
    const fetchLocation = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (mounted) {
              setLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                name: "موقعك الحالي",
              });
            }
          },
          () => {
            // Use mock location if geolocation fails
            if (mounted) {
              setLocation(MOCK_LOCATION);
            }
          }
        );
      } else {
        if (mounted) {
          setLocation(MOCK_LOCATION);
        }
      }
    };
    
    fetchLocation();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Watch position when tracking
  useEffect(() => {
    if (status !== "tracking") return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          name: "موقعك الحالي",
        });
        setSpeed(position.coords.speed ? position.coords.speed * 3.6 : 0);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [status]);

  // Emergency countdown
  useEffect(() => {
    if (countdown === null) return;
    
    const triggerEmergency = () => {
      setCountdown(null);
      toast.error("تم إرسال تنبيه الطوارئ!", {
        duration: 10000,
      });
      // Vibrate
      if ("vibrate" in navigator) {
        navigator.vibrate([500, 100, 500, 100, 500]);
      }
    };
    
    if (countdown <= 0) {
      // Trigger emergency
      triggerEmergency();
      return;
    }
    
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleShareLocation = async () => {
    setShowShareModal(true);
  };

  const handleConfirmShare = async () => {
    setShowShareModal(false);
    setStatus("sharing");
    
    // Generate share message
    const shareMessage = `أنا مشارك موقعي معاك لمدة ${selectedDuration} دقيقة ⏱️
تابعني لحظة بلحظة من هنا 👇
${window.location.origin}/share/demo123
ولو الرابط فتح عندك متأخر، حمّل التطبيق عشان تشوفني مباشر 📍`;

    // Try to use Web Share API
    if (navigator.share) {
      try {
        await navigator.share({
          title: "طمنّي - مشاركة الموقع",
          text: shareMessage,
          url: `${window.location.origin}/share/demo123`,
        });
        toast.success("تمت المشاركة بنجاح!");
      } catch {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareMessage);
      toast.success("تم نسخ رابط المشاركة!");
    }
  };

  const handleStopSharing = () => {
    setStatus("idle");
    setDestination(null);
    setDistance(0);
    setDuration(0);
    toast.success("تم إيقاف المشاركة");
  };

  const handleEmergency = () => {
    setShowEmergencyModal(true);
  };

  const handleEmergencyConfirm = () => {
    setShowEmergencyModal(false);
    setCountdown(5);
  };

  const handleEmergencyCancel = () => {
    setCountdown(null);
    setShowEmergencyModal(false);
  };

  const durationOptions = [
    { value: 5, label: "٥ دقائق", description: "مشاركة سريعة" },
    { value: 30, label: "٣٠ دقيقة", description: "رحلة قصيرة" },
    { value: 60, label: "ساعة واحدة", description: "رحلة متوسطة" },
    { value: -1, label: "حتى الوصول", description: "تتبع مستمر" },
  ];

  return (
    <main className="min-h-screen bg-background pb-20">
      <Header />

      {/* Emergency Countdown Overlay */}
      {countdown !== null && (
        <div className="fixed inset-0 bg-destructive/95 z-50 flex flex-col items-center justify-center text-white">
          <div className="text-6xl font-bold mb-4 animate-pulse">{countdown}</div>
          <p className="text-xl mb-2">تنبيه الطوارئ</p>
          <p className="text-white/80 mb-8">سيتم إرسال التنبيه تلقائياً</p>
          <Button
            onClick={handleEmergencyCancel}
            className="bg-white text-destructive hover:bg-white/90 rounded-xl px-8"
          >
            إلغاء
          </Button>
        </div>
      )}

      {/* Map Background */}
      <div className="relative h-[45vh] bg-gradient-to-b from-primary/20 to-primary/5 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-xl" />
          <div className="absolute top-1/3 -left-10 w-32 h-32 bg-primary/5 rounded-full blur-lg" />
        </div>

        {/* Map placeholder - in production, use Google Maps */}
        <div
          ref={mapRef}
          className="absolute inset-0 flex items-center justify-center"
        >
          {/* Grid pattern for map simulation */}
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%">
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Road lines simulation */}
          <svg className="absolute inset-0 w-full h-full opacity-20">
            <line x1="0" y1="30%" x2="100%" y2="70%" stroke="var(--primary)" strokeWidth="2" />
            <line x1="20%" y1="100%" x2="80%" y2="0" stroke="var(--primary)" strokeWidth="1.5" />
          </svg>

          {/* Location marker */}
          {location && (
            <div className="relative z-10 flex flex-col items-center">
              {/* Outer pulse rings */}
              <div className="absolute w-32 h-32 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute w-24 h-24 rounded-full bg-primary/15 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
              
              {/* Main marker */}
              <div className="relative w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-primary/40 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                    <Navigation className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
              
              {/* Location label */}
              <div className="mt-3 bg-card/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-primary/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium">{location.name}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status cards overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <StatusCard
              icon={<Shield className="w-4 h-4" />}
              label="حالة الأمان"
              value="نشط"
              isPrimary
            />
            <StatusCard
              icon={<MapPin className="w-4 h-4" />}
              label="المسافة"
              value={`${distance} كم`}
            />
            <StatusCard
              icon={<Navigation className="w-4 h-4" />}
              label="السرعة"
              value={`${speed} كم/س`}
            />
            <StatusCard
              icon={<Clock className="w-4 h-4" />}
              label="المدة"
              value={`${duration} د`}
            />
          </div>
        </div>

        {/* Emergency FAB */}
        <button
          onClick={handleEmergency}
          className="absolute bottom-24 left-4 w-14 h-14 rounded-full bg-destructive text-white flex items-center justify-center shadow-lg shadow-destructive/30 hover:scale-105 transition-transform z-20"
        >
          <AlertCircle className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6 -mt-2 relative z-10">
        {/* Destination Card */}
        <DestinationCard />

        {/* Share Button */}
        {status === "idle" && (
          <Card className="p-4 card-shadow bg-gradient-to-l from-primary to-teal-dark border-0 overflow-hidden relative">
            {/* Decorative pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-4 -left-4 w-20 h-20 rounded-full bg-white" />
              <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-white" />
            </div>
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <Eye className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-white text-lg">شارك موقعك دلوقتي</div>
                <div className="text-white/80 text-sm">
                  ابدأ رحلة آمنة مع تتبع موقعك
                </div>
              </div>
              <Button
                onClick={handleShareLocation}
                className="bg-white text-primary hover:bg-white/90 rounded-xl px-6 shadow-lg"
              >
                <Share2 className="w-4 h-4 ml-2" />
                شارك
              </Button>
            </div>
          </Card>
        )}

        {/* Active Sharing Status */}
        {status === "sharing" && (
          <Card className="p-4 card-shadow border-2 border-primary bg-primary/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-white animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-primary text-lg">جاري المشاركة</div>
                <div className="text-sm text-muted-foreground">
                  {selectedDuration === -1 ? "حتى الوصول" : `${selectedDuration} دقيقة`}
                </div>
              </div>
              <Button
                onClick={handleStopSharing}
                variant="destructive"
                className="rounded-xl"
              >
                <StopCircle className="w-4 h-4 ml-2" />
                إيقاف
              </Button>
            </div>
            
            {/* Progress bar */}
            <div className="mt-4 h-2 bg-primary/20 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full w-2/3 animate-pulse" style={{ animationDuration: '2s' }} />
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/contacts">
            <Card className="p-4 card-shadow hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1 border border-transparent hover:border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="font-medium">جهات الاتصال</div>
                  <div className="text-xs text-muted-foreground">أضف أماناً!</div>
                </div>
              </div>
            </Card>
          </Link>
          <Card className="p-4 card-shadow hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1 border border-transparent hover:border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="font-medium">الوضع الخفي</div>
                <div className="text-xs text-muted-foreground">أضف خصوصية!</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Notifications Banner */}
        <Card className="p-4 card-shadow bg-yellow-50 border-yellow-200 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-yellow-800">فعّل الإشعارات</div>
              <div className="text-sm text-yellow-600">للحصول على تنبيهات الوصول</div>
            </div>
            <Button size="sm" variant="outline" className="border-yellow-300 text-yellow-700 hover:bg-yellow-100">
              تفعيل
            </Button>
          </div>
        </Card>

        {/* Recent Activities */}
        <Card className="p-4 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">آخر الأنشطة</h3>
            <Link href="/history" className="text-sm text-primary hover:underline">عرض الكل</Link>
          </div>
          <div className="space-y-3">
            <ActivityItem
              icon={<MapPin className="w-4 h-4" />}
              title="رحلة إلى المكتب"
              time="منذ ٢ ساعة"
              distance="٥.٢ كم"
              color="primary"
            />
            <ActivityItem
              icon={<Navigation className="w-4 h-4" />}
              title="تتبع مع أحمد"
              time="أمس"
              distance="١٢ كم"
              color="green"
            />
            <ActivityItem
              icon={<Shield className="w-4 h-4" />}
              title="رحلة عائلية"
              time="منذ ٣ أيام"
              distance="٨.٧ كم"
              color="purple"
            />
          </div>
        </Card>

        {/* Stats Card */}
        <Link href="/history">
          <Card className="p-4 card-shadow bg-gradient-to-r from-primary/5 to-teal-dark/5 border-primary/10 hover:shadow-lg transition-all cursor-pointer hover:-translate-y-0.5">
            <div className="flex items-center justify-around">
              <StatItem value="٢٤" label="رحلة" />
              <div className="w-px h-10 bg-border" />
              <StatItem value="١٥٦" label="كم" />
              <div className="w-px h-10 bg-border" />
              <StatItem value="٨" label="جهة اتصال" />
            </div>
          </Card>
        </Link>
      </div>

      <BottomNav />

      {/* Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-lg">شارك موقعك</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground text-center">
              اختر مدة المشاركة
            </p>
            <div className="space-y-3">
              {durationOptions.map((option) => (
                <ShareOption
                  key={option.value}
                  duration={option.value}
                  label={option.label}
                  description={option.description}
                  selected={selectedDuration === option.value}
                  onClick={() => setSelectedDuration(option.value)}
                />
              ))}
            </div>
            <ActionButton
              icon={<Share2 className="w-4 h-4" />}
              label="شارك الآن"
              onClick={handleConfirmShare}
              className="w-full"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Emergency Modal */}
      <Dialog open={showEmergencyModal} onOpenChange={setShowEmergencyModal}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-lg text-destructive">تنبيه الطوارئ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-destructive" />
              </div>
            </div>
            <p className="text-center text-muted-foreground">
              سيتم إرسال تنبيه طوارئ مع موقعك الحالي إلى جهات الاتصال المختارة
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={handleEmergencyCancel}
              >
                إلغاء
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl"
                onClick={handleEmergencyConfirm}
              >
                تأكيد
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function ActivityItem({
  icon,
  title,
  time,
  distance,
  color = "primary",
}: {
  icon: React.ReactNode;
  title: string;
  time: string;
  distance: string;
  color?: "primary" | "green" | "purple";
}) {
  const colors = {
    primary: "bg-primary/10 text-primary",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer group">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colors[color])}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{time}</div>
      </div>
      <Badge variant="secondary" className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
        {distance}
      </Badge>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-primary">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
