"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BottomNav, Header } from "@/components/tamenny/bottom-nav";
import { StatusCard, ActionButton, ShareOption } from "@/components/tamenny/share-card";
import { DynamicMap, calculateDistance, calculateETA, interpolateRoute } from "@/components/tamenny/map-component";
import { OfflineIndicator } from "@/components/tamenny/offline-indicator";
import { QuickShareWidget, QuickShareCompact } from "@/components/tamenny/quick-share-widget";
import { StatusWidget, LiveStats } from "@/components/tamenny/status-widget";
import { MapPin, Navigation, Clock, Shield, Eye, AlertTriangle, StopCircle, Share2, Phone, AlertCircle, Bell, User, Layers, Locate, Maximize2, Radio, Heart, Zap, Activity, Route, X, Plus, Check, RefreshCw, ChevronDown, Home, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  toArabicNumerals,
  formatArabicNumber,
  formatArabicDistance,
  formatArabicDuration,
  formatArabicTimeFromMinutes,
} from "@/lib/arabic-numerals";

// Status types
type AppStatus = "idle" | "tracking" | "sharing";

// Default location (will be updated with user's actual GPS)
const DEFAULT_LOCATION = {
  lat: 0,
  lng: 0,
  name: "موقعك الحالي",
};

export default function HomePage() {
  // Auth protection
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        if (!data.success || !data.user) {
          router.replace('/login');
        } else {
          setAuthChecked(true);
        }
      } catch {
        router.replace('/login');
      }
    };
    checkAuth();
  }, [router]);
  
  const [status, setStatus] = useState<AppStatus>("idle");
  const [location, setLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(5);
  const [destination, setDestination] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [sharingProgress, setSharingProgress] = useState(0);
  const [routeIndex, setRouteIndex] = useState(0);
  const [eta, setEta] = useState(0);
  const [isEmergencyPressed, setIsEmergencyPressed] = useState(false);
  const [routeProgress, setRouteProgress] = useState(0);
  const [animateMarker, setAnimateMarker] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [waypoints, setWaypoints] = useState<{ lat: number; lng: number; name?: string }[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const mapRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number | null>(null);

  // Calculate route info when destination is set
  const routeInfo = destination ? {
    distance: calculateDistance(location || DEFAULT_LOCATION, destination),
    duration: calculateETA(calculateDistance(location || DEFAULT_LOCATION, destination), 30),
    progress: routeProgress,
  } : null;

  // Get current location on mount - works anywhere in the world
  useEffect(() => {
    if (!authChecked) return;
    
    let mounted = true;
    
    const fetchLocation = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (mounted) {
              const { latitude, longitude } = position.coords;
              // Use actual user location anywhere in the world
              setLocation({
                lat: latitude,
                lng: longitude,
                name: "موقعك الحالي",
              });
            }
          },
          () => {
            // Keep trying to get location
            if (mounted) {
              // Don't set a default location, keep trying
              console.log("Could not get location, will retry...");
            }
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
      }
    };
    
    fetchLocation();
    
    return () => {
      mounted = false;
    };
  }, [authChecked]);

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

  // Watch position when sharing - use real location updates anywhere in world
  useEffect(() => {
    if (status !== "sharing") return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed } = position.coords;
        
        // Use actual user location anywhere in the world
        setLocation({
          lat: latitude,
          lng: longitude,
          name: "موقعك الحالي",
        });
        setSpeed(speed ? speed * 3.6 : 0);
        
        // Update distance if destination is set
        if (destination) {
          const dist = calculateDistance({ lat: latitude, lng: longitude }, destination);
          setDistance(dist);
          setEta(calculateETA(dist, 30));
          
          // Calculate route progress
          if (location) {
            const totalDist = calculateDistance(location, destination);
            const progress = Math.round((1 - dist / totalDist) * 100);
            setRouteProgress(Math.max(0, Math.min(100, progress)));
          }
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    // ETA countdown
    const etaInterval = setInterval(() => {
      setEta((prev) => Math.max(0, prev - 1));
    }, 60000); // Every minute

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(etaInterval);
    };
  }, [status, destination, location]);

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
      triggerEmergency();
      return;
    }
    
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdown]);

  // Pull to refresh simulation
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        touchStartRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartRef.current !== null && window.scrollY === 0) {
        const pull = e.touches[0].clientY - touchStartRef.current;
        setPullDistance(Math.max(0, Math.min(pull, 100)));
      }
    };

    const handleTouchEnd = () => {
      if (pullDistance > 60) {
        setIsRefreshing(true);
        setTimeout(() => {
          setIsRefreshing(false);
          toast.success("تم التحديث!");
        }, 1500);
      }
      setPullDistance(0);
      touchStartRef.current = null;
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pullDistance]);

  const handleShareLocation = async () => {
    setShowShareModal(true);
  };

  const handleConfirmShare = async () => {
    setShowShareModal(false);
    setStatus("sharing");
    setEta(selectedDuration === -1 ? 30 : selectedDuration);
    
    // If destination is set, show route
    if (destination) {
      setShowRoute(true);
      setAnimateMarker(true);
      const dist = calculateDistance(location || DEFAULT_LOCATION, destination);
      setDistance(dist);
      setEta(calculateETA(dist, 30));
    }
    
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
    setSharingProgress(0);
    setRouteIndex(0);
    setShowRoute(false);
    setAnimateMarker(false);
    setRouteProgress(0);
    setWaypoints([]);
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

  const handleEmergencyButtonDown = () => {
    setIsEmergencyPressed(true);
  };

  const handleEmergencyButtonUp = () => {
    setIsEmergencyPressed(false);
  };

  const handleSetDestination = (dest: { lat: number; lng: number; name: string }) => {
    setDestination(dest);
    setShowDestinationModal(false);
    setWaypoints([]); // No waypoints for now
    toast.success("تم تحديد الوجهة");
  };

  const handleClearRoute = () => {
    setDestination(null);
    setShowRoute(false);
    setAnimateMarker(false);
    setRouteProgress(0);
    setWaypoints([]);
    setDistance(0);
    setEta(0);
    toast.success("تم إلغاء المسار");
  };

  const handleRouteComplete = () => {
    toast.success("تم الوصول إلى الوجهة!");
    setStatus("idle");
    setAnimateMarker(false);
  };

  // Quick share handler
  const handleQuickShare = (duration: number) => {
    setSelectedDuration(duration);
    setStatus("sharing");
    setEta(duration);
    toast.success(`بدأت المشاركة لمدة ${formatArabicDuration(duration, "minutes")}`);
  };

  const durationOptions = [
    { value: 5, label: "٥ دقائق", description: "مشاركة سريعة" },
    { value: 30, label: "٣٠ دقيقة", description: "رحلة قصيرة" },
    { value: 60, label: "ساعة واحدة", description: "رحلة متوسطة" },
    { value: -1, label: "حتى الوصول", description: "تتبع مستمر" },
  ];

  return (
    <main className="min-h-screen bg-background pb-20 relative overflow-hidden">
      {/* Auth Loading */}
      {!authChecked && (
        <div className="fixed inset-0 bg-background flex items-center justify-center z-[100]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">جاري التحقق...</p>
          </div>
        </div>
      )}
      
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ transform: "translate(-30%, -30%)" }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl animate-pulse" style={{ transform: "translate(30%, 30%)", animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ transform: "translate(-50%, -50%)", animationDelay: "0.5s" }} />
      </div>

      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Pull to Refresh Indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="fixed top-0 left-0 right-0 z-[60] flex justify-center pt-2 pointer-events-none"
          style={{ transform: `translateY(${Math.min(pullDistance * 0.5, 40)}px)` }}
        >
          <div className={cn(
            "flex flex-col items-center gap-1 transition-all",
            isRefreshing && "animate-spin"
          )}>
            <RefreshCw className={cn(
              "w-6 h-6 text-primary transition-all",
              pullDistance > 60 && "text-green-500"
            )} />
            <span className="text-xs text-muted-foreground">
              {isRefreshing ? "جاري التحديث..." : pullDistance > 60 ? "اسحب للتحديث" : "اسحب للأسفل"}
            </span>
          </div>
        </div>
      )}

      <Header />

      {/* Emergency Countdown Overlay */}
      {countdown !== null && (
        <div className="fixed inset-0 bg-destructive/95 z-50 flex flex-col items-center justify-center text-white">
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
            <div className="relative text-6xl font-bold mb-4">{countdown}</div>
          </div>
          <p className="text-xl mb-2">تنبيه الطوارئ</p>
          <p className="text-white/80 mb-8">سيتم إرسال التنبيه تلقائياً</p>
          <Button
            onClick={handleEmergencyCancel}
            className="bg-white text-destructive hover:bg-white/90 rounded-xl px-8 h-14 shadow-lg hover:shadow-xl transition-all"
          >
            إلغاء
          </Button>
        </div>
      )}

      {/* Map Background */}
      <div className="relative h-[45vh] overflow-hidden shrink-0">
        {/* Real OpenStreetMap with Route */}
        <DynamicMap
          center={location || undefined}
          destination={destination}
          waypoints={waypoints}
          showRoute={showRoute}
          showUserLocation={true}
          markerLabel={location?.name || "موقعك الحالي"}
          destinationLabel={destination?.name || "الوجهة"}
          routeStyle={status === "sharing" ? "active" : "planned"}
          animateMarker={animateMarker}
          routeInfo={routeInfo}
          onRouteComplete={handleRouteComplete}
          className="absolute inset-0 h-full w-full"
        />
        
        {/* Map overlay gradient */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />

        {/* Live Now Indicator */}
        {status === "sharing" && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full shadow-lg">
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                <div className="absolute inset-0 w-3 h-3 rounded-full bg-white animate-ping" />
              </div>
              <span className="font-medium text-sm">مباشر الآن</span>
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
          </div>
        )}

        {/* Route Info Card */}
        {destination && showRoute && (
          <div className="absolute top-4 left-4 right-4 z-20 animate-in slide-in-from-top duration-300">
            <Card className="p-3 bg-white/95 backdrop-blur-sm shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Route className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{destination.name}</div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {formatArabicDistance(routeInfo?.distance || 0, "km")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatArabicDuration(routeInfo?.duration || 0, "minutes")}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearRoute}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Route progress */}
              {status === "sharing" && routeProgress > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">تقدم الرحلة</span>
                    <span className="font-medium text-primary">{toArabicNumerals(routeProgress)}٪</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-l from-primary to-teal-light rounded-full transition-all duration-500"
                      style={{ width: `${routeProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Status cards overlay */}
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <EnhancedStatusCard
              icon={<Shield className="w-5 h-5" />}
              label="حالة الأمان"
              value="نشط"
              isPrimary
              isAnimating={status === "sharing"}
            />
            <EnhancedStatusCard
              icon={<MapPin className="w-5 h-5" />}
              label="المسافة"
              value={formatArabicDistance(distance, "km")}
              isAnimating={status === "sharing"}
            />
            <EnhancedStatusCard
              icon={<Navigation className="w-5 h-5" />}
              label="السرعة"
              value={`${toArabicNumerals(speed)} كم/س`}
              isAnimating={status === "sharing"}
            />
            <EnhancedStatusCard
              icon={<Clock className="w-5 h-5" />}
              label="الوصول"
              value={`${toArabicNumerals(eta)} د`}
              isAnimating={status === "sharing"}
            />
          </div>
        </div>

        {/* Emergency FAB */}
        <Link href="/sos" className="absolute bottom-24 left-4 z-20">
          <button
            onClick={(e) => {
              e.preventDefault();
              handleEmergency();
            }}
            onMouseDown={handleEmergencyButtonDown}
            onMouseUp={handleEmergencyButtonUp}
            onMouseLeave={handleEmergencyButtonUp}
            onTouchStart={handleEmergencyButtonDown}
            onTouchEnd={handleEmergencyButtonUp}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-200",
              isEmergencyPressed 
                ? "bg-destructive/80 scale-95 shadow-destructive/50" 
                : "bg-destructive hover:scale-105 shadow-destructive/30 hover:shadow-destructive/50"
            )}
          >
            <div className="absolute inset-0 rounded-full bg-destructive animate-ping opacity-30" />
            <AlertCircle className="w-7 h-7 text-white relative z-10" />
          </button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6 -mt-2 relative z-10">
        {/* Status Widget (when sharing) */}
        <StatusWidget
          isSharing={status === "sharing"}
          duration={selectedDuration}
          distance={distance}
          speed={speed}
          destination={destination || undefined}
          currentLocation={location || undefined}
          onStopSharing={handleStopSharing}
        />

        {/* Destination Card */}
        {!destination && status !== "sharing" && (
          <Card
            className="p-4 card-shadow cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5"
            onClick={() => setShowDestinationModal(true)}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Plus className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg">أضف وجهة</div>
                <div className="text-sm text-muted-foreground">
                  حدد وجهتك لتتبع رحلتك
                </div>
              </div>
              <Navigation className="w-5 h-5 text-muted-foreground" />
            </div>
          </Card>
        )}

        {/* Share Button */}
        {status === "idle" && (
          <Card className="p-4 card-shadow bg-gradient-to-l from-primary to-teal-dark border-0 overflow-hidden relative group">
            {/* Animated decorative pattern */}
            <div className="absolute inset-0 opacity-10 overflow-hidden">
              <div className="absolute -top-4 -left-4 w-20 h-20 rounded-full bg-white animate-pulse" />
              <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-white animate-pulse" style={{ animationDelay: '0.5s' }} />
              <div className="absolute top-1/2 left-1/3 w-8 h-8 rounded-full bg-white animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
            
            {/* Animated route line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 overflow-hidden">
              <div className="h-full w-1/3 bg-white/50 rounded-full animate-[shimmer_2s_infinite]" />
            </div>
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
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
                className="bg-white text-primary hover:bg-white/90 rounded-xl px-6 shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <Share2 className="w-4 h-4 ml-2" />
                شارك
              </Button>
            </div>
          </Card>
        )}

        {/* Quick Share Widget */}
        {status === "idle" && (
          <QuickShareWidget
            onShareStart={(duration) => {
              setSelectedDuration(duration);
              setStatus("sharing");
              setEta(duration);
              toast.success(`بدأت المشاركة لمدة ${formatArabicDuration(duration, "minutes")}`);
            }}
          />
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/contacts">
            <Card className="p-4 card-shadow hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 border border-transparent hover:border-primary/30 group overflow-hidden relative">
              {/* Animated background on hover */}
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="font-medium">جهات الاتصال</div>
                  <div className="text-xs text-muted-foreground">أضف أماناً!</div>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/dashboard">
            <Card className="p-4 card-shadow hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 border border-transparent hover:border-purple-300 group overflow-hidden relative">
              <div className="absolute inset-0 bg-purple-50/0 group-hover:bg-purple-50/50 transition-colors" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium">لوحة التحكم</div>
                  <div className="text-xs text-muted-foreground">تحليلات الرحلات</div>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Live Stats (when sharing) */}
        <LiveStats
          isSharing={status === "sharing"}
          distance={distance}
          speed={speed}
          eta={eta}
        />

        {/* Notifications Banner */}
        <Card className="p-4 card-shadow bg-gradient-to-l from-yellow-50 to-orange-50 border-yellow-200 border overflow-hidden relative group hover:shadow-lg transition-all">
          <div className="absolute inset-0 bg-gradient-to-l from-yellow-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center shrink-0 group-hover:animate-pulse">
              <Bell className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-yellow-800">فعّل الإشعارات</div>
              <div className="text-sm text-yellow-600">للحصول على تنبيهات الوصول</div>
            </div>
            <Button size="sm" variant="outline" className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 hover:shadow-md transition-all">
              تفعيل
            </Button>
          </div>
        </Card>

        {/* Recent Activities - Empty state if no trips */}
        <Card className="p-4 card-shadow hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              آخر الأنشطة
            </h3>
            <Link href="/history" className="text-sm text-primary hover:underline hover:text-teal-dark transition-colors">عرض الكل</Link>
          </div>
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <Activity className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              لا توجد رحلات حتى الآن. ابدأ مشاركة موقعك!
            </p>
          </div>
        </Card>

        {/* Stats Card - Will show 0 if no data */}
        <Link href="/dashboard">
          <Card className="p-4 card-shadow bg-gradient-to-r from-primary/5 to-teal-dark/5 border-primary/10 hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1 group overflow-hidden relative">
            {/* Decorative element */}
            <div className="absolute top-0 left-0 w-24 h-24 bg-primary/10 rounded-full -translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-center justify-around relative z-10">
              <StatItem value="٠" label="رحلة" />
              <div className="w-px h-10 bg-border" />
              <StatItem value="٠" label="كم" />
              <div className="w-px h-10 bg-border" />
              <StatItem value="٠" label="جهة اتصال" />
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

      {/* Destination Modal */}
      <Dialog open={showDestinationModal} onOpenChange={setShowDestinationModal}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-lg">تحديد الوجهة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground text-center">
              اختر وجهتك أو ابحث عنها على الخريطة
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleSetDestination({ lat: 30.0480, lng: 31.2395, name: "المكتب" })}
                className="p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-right"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">المكتب</div>
                    <div className="text-sm text-muted-foreground">اضغط للاختيار</div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => handleSetDestination({ lat: 30.0500, lng: 31.2400, name: "منزل الأهل" })}
                className="p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-right"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <div className="font-medium">منزل الأهل</div>
                    <div className="text-sm text-muted-foreground">اضغط للاختيار</div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => handleSetDestination({ lat: 30.0450, lng: 31.2350, name: "المنزل" })}
                className="p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-right"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <Home className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">المنزل</div>
                    <div className="text-sm text-muted-foreground">اضغط للاختيار</div>
                  </div>
                </div>
              </button>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowDestinationModal(false)}
            >
              إلغاء
            </Button>
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
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-destructive/20 animate-ping" />
                <div className="relative w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-destructive" />
                </div>
              </div>
            </div>
            <p className="text-center text-muted-foreground">
              سيتم إرسال تنبيه طوارئ مع موقعك الحالي إلى جهات الاتصال المختارة
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl hover:bg-muted transition-colors"
                onClick={handleEmergencyCancel}
              >
                إلغاء
              </Button>
              <Link href="/sos" className="flex-1">
                <Button
                  variant="destructive"
                  className="w-full rounded-xl hover:shadow-lg transition-all"
                  onClick={handleEmergencyConfirm}
                >
                  تأكيد
                </Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </main>
  );
}

// Enhanced Status Card Component
function EnhancedStatusCard({
  icon,
  label,
  value,
  isPrimary,
  isAnimating,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isPrimary?: boolean;
  isAnimating?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-3 rounded-xl min-w-[85px] transition-all duration-300",
        isPrimary
          ? "bg-gradient-to-br from-primary to-teal-dark text-primary-foreground shadow-lg"
          : "bg-card card-shadow hover:shadow-lg hover:-translate-y-0.5"
      )}
    >
      <div className={cn("mb-1 relative", isPrimary ? "text-primary-foreground" : "text-primary")}>
        {isAnimating && (
          <div className="absolute inset-0 animate-ping opacity-30">
            {icon}
          </div>
        )}
        {icon}
      </div>
      <span className={cn("text-xs", isPrimary ? "text-primary-foreground/80" : "text-muted-foreground")}>
        {label}
      </span>
      <span className={cn("font-bold text-sm", isPrimary ? "text-primary-foreground" : "text-foreground")}>
        {value}
      </span>
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
