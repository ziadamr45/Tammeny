"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSavedLocation } from "@/hooks/use-saved-location";
import { BottomNav, Header } from "@/components/tamenny/bottom-nav";
import { SplashScreen } from "@/components/tamenny/splash-screen";
import { StatusCard, ActionButton, ShareOption } from "@/components/tamenny/share-card";
import { DynamicMap, calculateDistance, calculateETA, interpolateRoute } from "@/components/tamenny/map-component";
import { OfflineIndicator } from "@/components/tamenny/offline-indicator";
import { QuickShareWidget, QuickShareCompact } from "@/components/tamenny/quick-share-widget";
import { StatusWidget, LiveStats } from "@/components/tamenny/status-widget";
import { MapPin, Navigation, Clock, Shield, Eye, AlertTriangle, StopCircle, Share2, Phone, AlertCircle, Bell, User, Layers, Locate, Maximize2, Radio, Heart, Zap, Activity, Route, X, Plus, Check, ChevronDown, Home, Building2, Sparkles, TrendingUp, Timer, Compass, Gauge, Crosshair, Satellite, Wifi, Battery, BatteryLow, Signal, MessageCircle } from "lucide-react";
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
  
  // Saved location - loads last known location instantly
  const { savedLocation, saveLocation } = useSavedLocation();
  
  const [status, setStatus] = useState<AppStatus>("idle");
  const [location, setLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [isLocating, setIsLocating] = useState(false); // True while searching for new location
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
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(true); // Default to true for SSR consistency
  const [activeEncryptedId, setActiveEncryptedId] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [notificationsBannerVisible, setNotificationsBannerVisible] = useState(true);
  const [quickStats, setQuickStats] = useState({ trips: 0, distance: 0, contacts: 0 });
  const [recentTrips, setRecentTrips] = useState<Array<{ id: string; destination: string; startTime: string; distance: number; status: string }>>([]);
  const [safeZones, setSafeZones] = useState<Array<{ id: string; name: string; type: string; latitude: number; longitude: number }>>([]);
  const [userSettings, setUserSettings] = useState<{ stealthMode: boolean; batterySaver: boolean; notificationsEnabled: boolean }>({ stealthMode: false, batterySaver: false, notificationsEnabled: true });
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

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

  // Calculate route info when destination is set
  const routeInfo = destination ? {
    distance: calculateDistance(location || DEFAULT_LOCATION, destination),
    duration: calculateETA(calculateDistance(location || DEFAULT_LOCATION, destination), 30),
    progress: routeProgress,
  } : null;

  // Get battery level
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as Navigator & { getBattery: () => Promise<{ level: number }> }).getBattery().then((battery) => {
        setBatteryLevel(battery.level * 100);
      });
    }
  }, []);

  // Fetch quick stats and recent trips after auth
  useEffect(() => {
    if (!authChecked) return;

    const fetchData = async () => {
      try {
        const [tripsRes, contactsRes, safeZonesRes, settingsRes] = await Promise.all([
          fetch('/api/trips?time=week'),
          fetch('/api/contacts'),
          fetch('/api/safe-zones'),
          fetch('/api/user/settings'),
        ]);
        const [tripsData, contactsData, safeZonesData, settingsData] = await Promise.all([
          tripsRes.json(),
          contactsRes.json(),
          safeZonesRes.json(),
          settingsRes.json(),
        ]);

        if (tripsData.success) {
          setQuickStats(prev => ({
            ...prev,
            trips: tripsData.stats?.totalTrips || 0,
            distance: Math.round(tripsData.stats?.totalDistance || 0),
          }));
          setRecentTrips((tripsData.trips || []).slice(0, 3));
        }
        if (contactsData.success) {
          setQuickStats(prev => ({
            ...prev,
            contacts: contactsData.contacts?.length || 0,
          }));
        }
        if (safeZonesData.success) {
          setSafeZones(safeZonesData.zones || []);
        }
        if (settingsData.success && settingsData.settings) {
          setUserSettings({
            stealthMode: settingsData.settings.stealthMode || false,
            batterySaver: settingsData.settings.batterySaver || false,
            notificationsEnabled: settingsData.settings.notificationsEnabled ?? true,
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [authChecked]);

  // Handle notifications permission
  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) {
      toast.error("متصفحك لا يدعم الإشعارات");
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      toast.success("تم تفعيل الإشعارات بنجاح!");
      setNotificationsBannerVisible(false);
      // Save preference
      await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationsEnabled: true }),
      }).catch(() => {});
    } else if (permission === 'denied') {
      toast.error("تم رفض الإشعارات. يمكنك تفعيلها من إعدادات المتصفح");
    }
  };

  // Check online status
  useEffect(() => {
    // Set initial online status after hydration (deferred to avoid cascading renders)
    const initialOnline = navigator.onLine;
    setTimeout(() => setIsOnline(initialOnline), 0);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get current location on mount - works anywhere in the world
  // First: Load saved location instantly, then search for new location in background
  useEffect(() => {
    if (!authChecked) return;
    
    let mounted = true;
    
    // Use setTimeout to defer state updates outside effect body
    setTimeout(() => {
      if (!mounted) return;
      
      // Step 1: Load saved location immediately (instant display)
      if (savedLocation) {
        setLocation({
          lat: savedLocation.lat,
          lng: savedLocation.lng,
          name: savedLocation.name,
        });
      }
      
      // Step 2: Start searching for fresh location in background
      setIsLocating(true);
      
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (mounted) {
              const { latitude, longitude, accuracy } = position.coords;
              const newLocation = {
                lat: latitude,
                lng: longitude,
                name: "موقعك الحالي",
              };
              
              // Update location state
              setLocation(newLocation);
              setIsLocating(false);
              setGpsAccuracy(accuracy);
              
              // Save to localStorage for next time
              saveLocation(newLocation);
            }
          },
          () => {
            // Could not get new location - keep showing saved location
            if (mounted) {
              setIsLocating(false);
              console.log("Could not get fresh location, using saved location");
            }
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
      } else {
        setIsLocating(false);
      }
    }, 0);
    
    return () => {
      mounted = false;
    };
  }, [authChecked, savedLocation, saveLocation]);

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
        setGpsAccuracy(position.coords.accuracy);
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
        const { latitude, longitude, speed, accuracy } = position.coords;
        
        // Use actual user location anywhere in the world
        setLocation({
          lat: latitude,
          lng: longitude,
          name: "موقعك الحالي",
        });
        setSpeed(speed ? speed * 3.6 : 0);
        setGpsAccuracy(accuracy);
        
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

  const handleShareLocation = async () => {
    setShowShareModal(true);
  };

  // Start location updates for active session
  const startLocationUpdates = useCallback((encryptedId: string, batterySaver: boolean) => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
    }

    // Use 30s interval if batterySaver is enabled, otherwise 5s
    const updateInterval = batterySaver ? 30000 : 5000;

    const sendLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLocation = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          
          setLocation({
            lat: newLocation.lat,
            lng: newLocation.lng,
            name: "موقعك الحالي",
          });

          // Send to server (stealthMode is checked server-side)
          fetch('/api/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              encryptedId,
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              speed: pos.coords.speed || 0,
              accuracy: pos.coords.accuracy,
            }),
          }).catch((err) => {
            console.error('Failed to send location:', err);
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };

    sendLocation();
    locationIntervalRef.current = setInterval(sendLocation, updateInterval);
  }, []);

  // Stop location updates
  const stopLocationUpdates = useCallback(() => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  }, []);

  const handleConfirmShare = async () => {
    setShowShareModal(false);
    
    if (!location) {
      toast.error("لم يتم تحديد موقعك بعد");
      return;
    }

    try {
      // Create real session in database
      const res = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration: selectedDuration,
          startLat: location.lat,
          startLng: location.lng,
          destName: destination?.name || null,
          destLat: destination?.lat || null,
          destLng: destination?.lng || null,
          sessionType: selectedDuration === -1 ? 'until_arrival' : 'minutes',
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'فشل في إنشاء الجلسة');
      }

      // Set active sharing state
      setActiveEncryptedId(data.encryptedId);
      setShareLink(data.shareUrl);
      setStatus("sharing");
      setEta(selectedDuration === -1 ? 30 : selectedDuration);

      // Start location updates (with batterySaver setting)
      startLocationUpdates(data.encryptedId, userSettings.batterySaver);
      
      // If destination is set, show route
      if (destination) {
        setShowRoute(true);
        setAnimateMarker(true);
        const dist = calculateDistance(location, destination);
        setDistance(dist);
        setEta(calculateETA(dist, 30));
      }
      
      // Generate share message with real link
      const durationText = selectedDuration === -1 
        ? "حتى الوصول" 
        : selectedDuration >= 60 
          ? `${selectedDuration / 60} ساعة` 
          : `${selectedDuration} دقيقة`;
      
      const shareMessage = `أنا مشارك موقعي معاك لمدة ${durationText} ⏱️
تابعني لحظة بلحظة من هنا 👇
${data.shareUrl}
ولو الرابط فتح عندك متأخر، حمّل التطبيق عشان تشوفني مباشر 📍`;

      // Try to use Web Share API
      if (navigator.share) {
        try {
          await navigator.share({
            title: "طمنّي - مشاركة الموقع",
            text: shareMessage,
            url: data.shareUrl,
          });
          toast.success("تمت المشاركة بنجاح!");
        } catch {
          // User cancelled
        }
      } else {
        await navigator.clipboard.writeText(shareMessage);
        toast.success("تم نسخ رابط المشاركة!");
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error(error instanceof Error ? error.message : "فشل إنشاء الجلسة");
    }
  };

  const handleStopSharing = async () => {
    stopLocationUpdates();
    
    if (activeEncryptedId) {
      try {
        await fetch(`/api/sessions/${encodeURIComponent(activeEncryptedId)}/stop`, {
          method: 'POST',
        });
      } catch (error) {
        console.error('Error stopping session:', error);
      }
    }
    
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
    setActiveEncryptedId(null);
    setShareLink(null);
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

  // Quick share handler - creates real session
  const handleQuickShare = async (duration: number) => {
    if (!location) {
      toast.error("لم يتم تحديد موقعك بعد");
      return;
    }

    try {
      const res = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration,
          startLat: location.lat,
          startLng: location.lng,
          sessionType: duration === -1 ? 'until_arrival' : 'minutes',
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setActiveEncryptedId(data.encryptedId);
      setShareLink(data.shareUrl);
      setSelectedDuration(duration);
      setStatus("sharing");
      setEta(duration);
      startLocationUpdates(data.encryptedId, userSettings.batterySaver);
      toast.success(`بدأت المشاركة لمدة ${formatArabicDuration(duration, "minutes")}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل بدء المشاركة");
    }
  };

  // WhatsApp share handler
  const handleWhatsAppShare = async () => {
    if (!location) {
      toast.error("لم يتم تحديد موقعك بعد");
      return;
    }

    try {
      // Create real session
      const res = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration: 30,
          startLat: location.lat,
          startLng: location.lng,
          sessionType: 'minutes',
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'فشل في إنشاء الجلسة');
      }

      // Set active sharing state
      setActiveEncryptedId(data.encryptedId);
      setShareLink(data.shareUrl);
      setStatus("sharing");

      // Start location updates (with batterySaver setting)
      startLocationUpdates(data.encryptedId, userSettings.batterySaver);

      const message = `أنا مشارك موقعي معاك على طمنّي 📍
موقعي الحالي: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}
تابعني لحظة بلحظة من هنا 👇
${data.shareUrl}

حمّل تطبيق طمنّي للأمان 🛡️`;

      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");
      toast.success("جاري فتح واتساب...");
    } catch (error) {
      console.error('WhatsApp share error:', error);
      toast.error("فشل إنشاء رابط المشاركة");
    }
  };

  const durationOptions = [
    { value: 5, label: "٥ دقائق", description: "مشاركة سريعة" },
    { value: 30, label: "٣٠ دقيقة", description: "رحلة قصيرة" },
    { value: 60, label: "ساعة واحدة", description: "رحلة متوسطة" },
    { value: -1, label: "حتى الوصول", description: "تتبع مستمر" },
  ];

  // Get GPS accuracy color
  const getAccuracyColor = () => {
    if (!gpsAccuracy) return "text-muted-foreground";
    if (gpsAccuracy < 10) return "text-green-500";
    if (gpsAccuracy < 30) return "text-yellow-500";
    return "text-red-500";
  };

  // Get GPS accuracy text
  const getAccuracyText = () => {
    if (!gpsAccuracy) return "غير معروف";
    if (gpsAccuracy < 10) return "ممتاز";
    if (gpsAccuracy < 30) return "جيد";
    return "ضعيف";
  };

  // Show splash screen while checking auth
  if (!authChecked) {
    return <SplashScreen isVisible={true} />;
  }

  return (
    <>
      {/* Splash Screen - for page transitions */}
      <SplashScreen isVisible={!authChecked} />
    
    <main className="min-h-screen bg-background pb-20 relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-primary/10 to-teal-light/5 rounded-full blur-3xl animate-pulse" style={{ transform: "translate(-30%, -30%)" }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-teal-500/10 to-primary/5 rounded-full blur-3xl animate-pulse" style={{ transform: "translate(30%, 30%)", animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-full blur-3xl animate-pulse" style={{ transform: "translate(-50%, -50%)", animationDelay: "0.5s" }} />
      </div>

      {/* Offline Indicator */}
      <OfflineIndicator />

      <Header />

      {/* Emergency Countdown Overlay */}
      {countdown !== null && (
        <div className="fixed inset-0 bg-destructive/95 z-50 flex flex-col items-center justify-center text-white animate-scale-in">
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
            <div className="absolute inset-0 bg-white/10 rounded-full animate-pulse" />
            <div className="relative text-7xl font-bold mb-4 animate-pulse">{countdown}</div>
          </div>
          <p className="text-2xl font-bold mb-2">تنبيه الطوارئ</p>
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
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/50 to-transparent pointer-events-none z-10" />

        {/* Live Now Indicator */}
        {status === "sharing" && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 animate-scale-in">
            <div className="flex items-center gap-2 bg-gradient-to-l from-primary to-teal-dark text-white px-5 py-2.5 rounded-full shadow-lg animate-status-pulse">
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-white" />
                <div className="absolute inset-0 w-3 h-3 rounded-full bg-white animate-ping" />
              </div>
              <span className="font-bold text-sm">مباشر الآن</span>
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
          </div>
        )}

        {/* GPS Status Indicator */}
        {location && !isLocating && (
          <div className="absolute top-4 right-4 z-20 animate-slide-up delay-200">
            <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg text-xs font-medium",
              gpsAccuracy && gpsAccuracy < 30 
                ? "bg-green-500/90 text-white" 
                : "bg-white/90 text-muted-foreground"
            )}>
              <Crosshair className={cn("w-3.5 h-3.5", getAccuracyColor())} />
              <span>GPS {getAccuracyText()}</span>
            </div>
          </div>
        )}

        {/* Route Info Card */}
        {destination && showRoute && (
          <div className="absolute top-4 left-4 right-4 z-20 animate-slide-up">
            <Card className="p-4 bg-white/95 backdrop-blur-md shadow-xl border-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-teal-dark flex items-center justify-center animate-float">
                    <Route className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">{destination.name}</div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        {formatArabicDistance(routeInfo?.distance || 0, "km")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        {formatArabicDuration(routeInfo?.duration || 0, "minutes")}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearRoute}
                  className="text-destructive hover:bg-destructive/10 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Route progress */}
              {status === "sharing" && routeProgress > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">تقدم الرحلة</span>
                    <span className="font-bold text-primary">{toArabicNumerals(routeProgress)}٪</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-l from-primary to-teal-light rounded-full transition-all duration-500 relative"
                      style={{ width: `${routeProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                    </div>
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
              value={`${toArabicNumerals(speed.toFixed(0))} كم/س`}
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
        <div className="absolute bottom-24 left-4 z-20">
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
              "group w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 relative overflow-hidden",
              isEmergencyPressed 
                ? "bg-destructive/80 scale-95 shadow-destructive/50" 
                : "bg-gradient-to-br from-destructive to-red-600 hover:scale-110 shadow-destructive/30 hover:shadow-destructive/50"
            )}
          >
            <div className="absolute inset-0 rounded-full bg-destructive animate-ping opacity-20" />
            <div className="absolute inset-0 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors" />
            <AlertCircle className="w-7 h-7 text-white relative z-10 group-hover:animate-pulse" />
          </button>
        </div>
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

        {/* System Status Bar */}
        <Card className="p-3 card-shadow bg-gradient-to-l from-slate-50 to-slate-100/50 border-0">
          <div className="flex items-center justify-around">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", isOnline ? "bg-green-500 animate-pulse" : "bg-red-500")} />
              <span className="text-xs text-muted-foreground">{isOnline ? "متصل" : "غير متصل"}</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <Satellite className={cn("w-4 h-4", gpsAccuracy && gpsAccuracy < 30 ? "text-green-500" : "text-yellow-500")} />
              <span className="text-xs text-muted-foreground">GPS {getAccuracyText()}</span>
            </div>
            {batteryLevel !== null && (
              <>
                <div className="w-px h-4 bg-border" />
                <div className="flex items-center gap-2">
                  {batteryLevel < 20 ? (
                    <BatteryLow className="w-4 h-4 text-red-500" />
                  ) : (
                    <Battery className={cn("w-4 h-4", batteryLevel < 50 ? "text-yellow-500" : "text-green-500")} />
                  )}
                  <span className="text-xs text-muted-foreground">{toArabicNumerals(batteryLevel.toFixed(0))}٪</span>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Destination Card */}
        {!destination && status !== "sharing" && (
          <Card
            className="p-4 card-shadow-xl cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-primary/30 group animate-slide-up overflow-hidden relative"
            onClick={() => setShowDestinationModal(true)}
          >
            <div className="absolute inset-0 bg-gradient-to-l from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-teal-light/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg">أضف وجهة</div>
                <div className="text-sm text-muted-foreground">
                  حدد وجهتك لتتبع رحلتك
                </div>
              </div>
              <Navigation className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Card>
        )}

        {/* Share Button */}
        {status === "idle" && (
          <Card className="p-4 card-shadow-xl bg-gradient-to-l from-primary via-teal-dark to-primary bg-[length:200%_100%] animate-gradient border-0 overflow-hidden relative group animate-slide-up delay-100">
            {/* Animated decorative pattern */}
            <div className="absolute inset-0 opacity-10 overflow-hidden">
              <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full bg-white animate-float" />
              <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white animate-float" style={{ animationDelay: '0.5s' }} />
              <div className="absolute top-1/2 left-1/3 w-10 h-10 rounded-full bg-white animate-float" style={{ animationDelay: '1s' }} />
            </div>
            
            {/* Animated route line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 overflow-hidden">
              <div className="h-full w-1/3 bg-white/50 rounded-full animate-[shimmer_2s_infinite]" />
            </div>
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
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
            onShareStart={handleQuickShare}
          />
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/contacts" className="block animate-slide-up delay-200">
            <Card className="p-4 card-shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-1 border border-transparent hover:border-primary/30 group overflow-hidden relative h-full">
              {/* Animated background on hover */}
              <div className="absolute inset-0 bg-gradient-to-l from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-teal-light/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="font-bold">جهات الاتصال</div>
                  <div className="text-xs text-muted-foreground">أضف أماناً!</div>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/dashboard" className="block animate-slide-up delay-300">
            <Card className="p-4 card-shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-1 border border-transparent hover:border-purple-300 group overflow-hidden relative h-full">
              <div className="absolute inset-0 bg-gradient-to-l from-purple-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="font-bold">لوحة التحكم</div>
                  <div className="text-xs text-muted-foreground">تحليلات الرحلات</div>
                </div>
              </div>
            </Card>
          </Link>
          {/* WhatsApp Share Button */}
          <div className="col-span-2 animate-slide-up delay-400">
            <Card 
              className="p-4 card-shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-1 border border-transparent hover:border-green-300 group overflow-hidden relative bg-gradient-to-l from-green-50 to-emerald-50/50"
              onClick={handleWhatsAppShare}
            >
              <div className="absolute inset-0 bg-gradient-to-l from-green-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-green-700">أرسل موقعي على واتساب</div>
                  <div className="text-xs text-green-600">شارك موقعك مباشرة مع أهلك</div>
                </div>
                <Share2 className="w-5 h-5 text-green-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </div>
        </div>

        {/* Live Stats (when sharing) */}
        <LiveStats
          isSharing={status === "sharing"}
          distance={distance}
          speed={speed}
          eta={eta}
        />

        {/* Notifications Banner */}
        {notificationsBannerVisible && (
          <Card className="p-4 card-shadow-xl bg-gradient-to-l from-amber-50 via-orange-50 to-yellow-50 border-amber-200 border overflow-hidden relative group hover:shadow-lg transition-all animate-slide-up delay-400">
            <div className="absolute inset-0 bg-gradient-to-l from-amber-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-amber-400 to-orange-400" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shrink-0 group-hover:animate-pulse">
                <Bell className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-amber-800">فعّل الإشعارات</div>
                <div className="text-sm text-amber-600">للحصول على تنبيهات الوصول</div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-100 hover:shadow-md transition-all rounded-xl"
                onClick={handleEnableNotifications}
              >
                تفعيل
              </Button>
            </div>
          </Card>
        )}

        {/* Recent Activities */}
        <Card className="p-4 card-shadow-xl hover:shadow-lg transition-all animate-slide-up delay-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              آخر الأنشطة
            </h3>
            <Link href="/history" className="text-sm text-primary hover:underline hover:text-teal-dark transition-colors font-medium">عرض الكل</Link>
          </div>
          {recentTrips.length > 0 ? (
            <div className="space-y-3">
              {recentTrips.map((trip) => (
                <div key={trip.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{trip.destination || "رحلة"}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(trip.startTime).toLocaleDateString('ar-EG')} • {formatArabicDistance(trip.distance, "km")}
                    </div>
                  </div>
                  <div className={cn("text-xs font-medium", trip.status === 'completed' ? "text-green-600" : "text-yellow-600")}>
                    {trip.status === 'completed' ? 'مكتملة' : 'جارية'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                لا توجد رحلات حتى الآن. ابدأ مشاركة موقعك!
              </p>
            </div>
          )}
        </Card>

        {/* Stats Card */}
        <Link href="/dashboard" className="block">
          <Card className="p-4 card-shadow-xl bg-gradient-to-r from-primary/5 via-teal-dark/5 to-primary/5 border-primary/10 hover:shadow-2xl transition-all cursor-pointer hover:-translate-y-1 group overflow-hidden relative animate-slide-up delay-500">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full -translate-x-12 -translate-y-12 group-hover:scale-150 transition-transform duration-500" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-teal-light/10 to-transparent rounded-full translate-x-8 translate-y-8 group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-center justify-around relative z-10">
              <StatItem value={toArabicNumerals(quickStats.trips.toString())} label="رحلة" icon={<Route className="w-4 h-4" />} />
              <div className="w-px h-12 bg-border/50" />
              <StatItem value={toArabicNumerals(quickStats.distance.toString())} label="كم" icon={<MapPin className="w-4 h-4" />} />
              <div className="w-px h-12 bg-border/50" />
              <StatItem value={toArabicNumerals(quickStats.contacts.toString())} label="جهة اتصال" icon={<User className="w-4 h-4" />} />
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
              {durationOptions.map((option, index) => (
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
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <p className="text-sm text-muted-foreground text-center">
              اختر وجهتك من المناطق الآمنة
            </p>
            {safeZones.length > 0 ? (
              <div className="flex flex-col gap-3">
                {safeZones.map((zone) => {
                  const zoneIcon = zone.type === 'home' ? <Home className="w-6 h-6 text-green-600" /> :
                    zone.type === 'work' ? <Building2 className="w-6 h-6 text-blue-600" /> :
                    zone.type === 'school' ? <Sparkles className="w-6 h-6 text-purple-600" /> :
                    <MapPin className="w-6 h-6 text-primary" />;
                  const zoneColor = zone.type === 'home' ? 'from-green-100 to-emerald-100' :
                    zone.type === 'work' ? 'from-blue-100 to-indigo-100' :
                    zone.type === 'school' ? 'from-purple-100 to-pink-100' :
                    'from-primary/20 to-teal-light/20';

                  return (
                    <button
                      key={zone.id}
                      onClick={() => handleSetDestination({ lat: zone.latitude, lng: zone.longitude, name: zone.name })}
                      className="p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-right group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center group-hover:scale-110 transition-transform", zoneColor)}>
                          {zoneIcon}
                        </div>
                        <div>
                          <div className="font-bold">{zone.name}</div>
                          <div className="text-sm text-muted-foreground">اضغط للاختيار</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">لم تضف مناطق آمنة بعد</p>
                <Link href="/safe-zones">
                  <Button variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    إضافة منطقة آمنة
                  </Button>
                </Link>
              </div>
            )}
            <Button
              variant="outline"
              className="w-full rounded-xl"
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
                <div className="absolute inset-0 rounded-full bg-destructive/10 animate-pulse" />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-destructive/20 to-red-100 flex items-center justify-center">
                  <AlertCircle className="w-12 h-12 text-destructive animate-pulse" />
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
    </main>
    </>
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
        "flex flex-col items-center justify-center p-3 rounded-2xl min-w-[85px] transition-all duration-300 group",
        isPrimary
          ? "bg-gradient-to-br from-primary to-teal-dark text-primary-foreground shadow-xl"
          : "bg-card card-shadow-xl hover:shadow-2xl hover:-translate-y-0.5 border border-transparent hover:border-primary/20"
      )}
    >
      <div className={cn("mb-1 relative", isPrimary ? "text-primary-foreground" : "text-primary group-hover:scale-110 transition-transform")}>
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

function StatItem({ value, label, icon }: { value: string; label: string; icon?: React.ReactNode }) {
  return (
    <div className="text-center group">
      <div className="flex items-center justify-center gap-1 mb-1">
        {icon && <div className="text-primary opacity-50 group-hover:opacity-100 transition-opacity">{icon}</div>}
        <div className="text-2xl font-bold gradient-text">{value}</div>
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
