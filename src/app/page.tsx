"use client";

import { useState, useEffect, useRef } from "react";
import { BottomNav, Header } from "@/components/tamenny/bottom-nav";
import { StatusCard, ActionButton, ShareOption, DestinationCard } from "@/components/tamenny/share-card";
import { MapPin, Navigation, Clock, Shield, Eye, Plus, AlertTriangle, StopCircle, Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

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
  const [selectedDuration, setSelectedDuration] = useState(5);
  const [destination, setDestination] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [duration, setDuration] = useState(0);
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

  const durationOptions = [
    { value: 5, label: "٥ دقائق", description: "مشاركة سريعة" },
    { value: 30, label: "٣٠ دقيقة", description: "رحلة قصيرة" },
    { value: 60, label: "ساعة واحدة", description: "رحلة متوسطة" },
    { value: -1, label: "حتى الوصول", description: "تتبع مستمر" },
  ];

  return (
    <main className="min-h-screen bg-background pb-20">
      <Header />

      {/* Map Background */}
      <div className="relative h-[45vh] bg-gradient-to-b from-primary/20 to-primary/5">
        {/* Map placeholder - in production, use Google Maps */}
        <div
          ref={mapRef}
          className="absolute inset-0 flex items-center justify-center"
        >
          {/* Grid pattern for map simulation */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%">
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Location marker */}
          {location && (
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 animate-ping absolute" />
              <div className="w-16 h-16 rounded-full bg-primary/30 flex items-center justify-center animate-pulse-location">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Navigation className="w-4 h-4 text-white" />
                </div>
              </div>
              <span className="mt-2 text-sm font-medium bg-card px-3 py-1 rounded-full shadow-md">
                {location.name}
              </span>
            </div>
          )}
        </div>

        {/* Status cards overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex gap-3 overflow-x-auto pb-2">
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
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6 -mt-2 relative z-10">
        {/* Destination Card */}
        <DestinationCard />

        {/* Share Button */}
        {status === "idle" && (
          <Card className="p-4 card-shadow bg-gradient-to-l from-primary to-primary/90">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-white text-lg">شارك موقعك دلوقتي</div>
                <div className="text-white/80 text-sm">
                  ابدا رحلة آمنة مع تتبع موقعك
                </div>
              </div>
              <Button
                onClick={handleShareLocation}
                className="bg-white text-primary hover:bg-white/90 rounded-xl px-6"
              >
                <Share2 className="w-4 h-4 ml-2" />
                شارك
              </Button>
            </div>
          </Card>
        )}

        {/* Active Sharing Status */}
        {status === "sharing" && (
          <Card className="p-4 card-shadow border-2 border-primary">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-primary">جاري المشاركة</div>
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
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 card-shadow hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-medium text-sm">أضف أماناً!</div>
                <div className="text-xs text-muted-foreground">10 أصدقاء</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 card-shadow hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-medium text-sm">أضف خصوصية!</div>
                <div className="text-xs text-muted-foreground">وضع خفي</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activities */}
        <Card className="p-4 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">آخر الأنشطة</h3>
            <span className="text-sm text-primary">عرض الكل</span>
          </div>
          <div className="space-y-3">
            <ActivityItem
              icon={<MapPin className="w-4 h-4" />}
              title="رحلة إلى المكتب"
              time="منذ ٢ ساعة"
              distance="٥.٢ كم"
            />
            <ActivityItem
              icon={<Navigation className="w-4 h-4" />}
              title="تتبع مع أحمد"
              time="أمس"
              distance="١٢ كم"
            />
          </div>
        </Card>
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
    </main>
  );
}

function ActivityItem({
  icon,
  title,
  time,
  distance,
}: {
  icon: React.ReactNode;
  title: string;
  time: string;
  distance: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{time}</div>
      </div>
      <div className="text-sm font-medium text-primary">{distance}</div>
    </div>
  );
}
