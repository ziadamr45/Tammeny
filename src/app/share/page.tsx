"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Share2,
  Clock,
  MapPin,
  Navigation,
  Shield,
  Eye,
  EyeOff,
  Lock,
  Copy,
  Check,
  Users,
  Plus,
  X,
  Zap,
  Timer,
  Hourglass,
  Infinity,
  Sparkles,
  Search,
  Target,
  Loader2,
  QrCode,
  Download,
  StopCircle,
  Radio,
} from "lucide-react";
import { BottomNav, Header } from "@/components/tamenny/bottom-nav";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { QRCodeSVG } from "qrcode.react";

const DURATION_OPTIONS = [
  { value: 5, label: "٥ دقائق", description: "مشاركة سريعة", icon: Zap, color: "bg-yellow-500" },
  { value: 30, label: "٣٠ دقيقة", description: "رحلة قصيرة", icon: Timer, color: "bg-blue-500" },
  { value: 60, label: "ساعة واحدة", description: "رحلة متوسطة", icon: Clock, color: "bg-green-500" },
  { value: 120, label: "ساعتين", description: "رحلة طويلة", icon: Hourglass, color: "bg-purple-500" },
  { value: -1, label: "حتى الوصول", description: "تتبع مستمر", icon: Infinity, color: "bg-primary" },
];

export default function SharePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [selectedDuration, setSelectedDuration] = useState(5);
  const [destination, setDestination] = useState("");
  const [showDestinationSearch, setShowDestinationSearch] = useState(false);
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [isRestricted, setIsRestricted] = useState(false);
  const [allowedEmails, setAllowedEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // NEW: Active sharing state
  const [activeEncryptedId, setActiveEncryptedId] = useState<string | null>(null);
  const [isSharingActive, setIsSharingActive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Get current location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          lastLocationRef.current = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
        },
        () => {
          // Use mock location for Cairo
          setLocation({ lat: 30.0444, lng: 31.2357 });
          lastLocationRef.current = { lat: 30.0444, lng: 31.2357 };
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // Start location updates for active session
  const startLocationUpdates = useCallback((encryptedId: string) => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
    }

    const sendLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLocation = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          
          // Update local state
          setLocation(newLocation);
          lastLocationRef.current = newLocation;

          // Send to server
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

    // Send immediately
    sendLocation();
    
    // Then send every 5 seconds
    locationIntervalRef.current = setInterval(sendLocation, 5000);
  }, []);

  // Stop location updates
  const stopLocationUpdates = useCallback(() => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocationUpdates();
    };
  }, [stopLocationUpdates]);

  // Stop sharing function
  const stopSharing = async () => {
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
    
    setActiveEncryptedId(null);
    setIsSharingActive(false);
    setShareLink("");
    setViewerCount(0);
    toast.success("تم إيقاف مشاركة الموقع");
  };

  const handleAddEmail = () => {
    if (newEmail && !allowedEmails.includes(newEmail)) {
      setAllowedEmails([...allowedEmails, newEmail]);
      setNewEmail("");
      toast.success("تم إضافة البريد الإلكتروني");
    }
  };

  const handleRemoveEmail = (email: string) => {
    setAllowedEmails(allowedEmails.filter((e) => e !== email));
  };

  const handleShare = async () => {
    if (!location) {
      toast.error("لم يتم تحديد موقعك بعد");
      return;
    }

    setIsAnimating(true);

    try {
      const res = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration: selectedDuration,
          startLat: location.lat,
          startLng: location.lng,
          destName: destination || null,
          isGhostMode,
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
      setIsSharingActive(true);
      setShowSuccessModal(true);

      // Start location updates
      startLocationUpdates(data.encryptedId);

      toast.success("تم إنشاء رابط المشاركة بنجاح!");

    } catch (error) {
      console.error('Share error:', error);
      toast.error(error instanceof Error ? error.message : "فشل إنشاء الجلسة، حاول تاني");
    } finally {
      setIsAnimating(false);
    }
  };

  const handleCopyLink = async () => {
    const durationText = selectedDuration === -1 
      ? "حتى الوصول" 
      : selectedDuration >= 60 
        ? `${selectedDuration / 60} ساعة` 
        : `${selectedDuration} دقيقة`;

    const shareMessage = `أنا مشارك موقعي معاك لمدة ${durationText} ⏱️
تابعني لحظة بلحظة من هنا 👇
${shareLink}
ولو الرابط فتح عندك متأخر، حمّل التطبيق عشان تشوفني مباشر 📍`;

    await navigator.clipboard.writeText(shareMessage);
    setCopied(true);
    toast.success("تم نسخ الرسالة!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareNative = async () => {
    const durationText = selectedDuration === -1 
      ? "حتى الوصول" 
      : selectedDuration >= 60 
        ? `${selectedDuration / 60} ساعة` 
        : `${selectedDuration} دقيقة`;

    const shareMessage = `أنا مشارك موقعي معاك لمدة ${durationText} ⏱️
تابعني لحظة بلحظة من هنا 👇
${shareLink}
ولو الرابط فتح عندك متأخر، حمّل التطبيق عشان تشوفني مباشر 📍`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "طمنّي - مشاركة الموقع",
          text: shareMessage,
          url: shareLink,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  const popularDestinations = [
    { name: "المنزل", icon: "🏠" },
    { name: "العمل", icon: "🏢" },
    { name: "الجامعة", icon: "🎓" },
    { name: "المطار", icon: "✈️" },
  ];

  return (
    <main className="min-h-screen bg-background pb-20">
      <Header />

      <div className="pt-16 px-4 space-y-6">
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
              <h1 className="text-xl font-bold">شارك موقعك</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isSharingActive ? "bg-green-500 animate-pulse" : "bg-muted-foreground"
                )} />
                <span>{isSharingActive ? "مشاركة نشطة" : "GPS نشط"}</span>
              </div>
            </div>

            {/* ACTIVE SHARING BANNER - shown when sharing is active */}
            {isSharingActive && activeEncryptedId && (
              <Card className="p-4 card-shadow bg-gradient-to-l from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-700 animate-in slide-in-from-top duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping opacity-50" />
                  </div>
                  <span className="font-bold text-green-700 dark:text-green-400">أنت تشارك موقعك الآن</span>
                  <Badge variant="outline" className="border-green-300 text-green-600 dark:border-green-700 dark:text-green-400">
                    <Eye className="w-3 h-3 ml-1" />
                    {viewerCount > 0 ? `${viewerCount} مشاهد` : "مباشر"}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 mb-3 text-sm text-green-600 dark:text-green-400">
                  <Radio className="w-4 h-4 animate-pulse" />
                  <span>موقعك بيتحدث كل ٥ ثواني تلقائياً</span>
                </div>

                <div className="bg-white dark:bg-green-900/30 rounded-xl p-3 mb-3 border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-green-700 dark:text-green-400">رابط مشفر آمن</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyLink}
                      className="h-7 text-xs text-green-600 hover:text-green-700"
                    >
                      {copied ? <Check className="w-3 h-3 ml-1" /> : <Copy className="w-3 h-3 ml-1" />}
                      {copied ? "تم النسخ" : "نسخ"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 break-all">
                    {shareLink}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleShareNative}
                    variant="outline"
                    className="flex-1 rounded-xl h-11 border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/30"
                  >
                    <Share2 className="w-4 h-4 ml-2" />
                    مشاركة الرابط
                  </Button>
                  <Button
                    onClick={stopSharing}
                    variant="destructive"
                    className="flex-1 rounded-xl h-11"
                  >
                    <StopCircle className="w-4 h-4 ml-2" />
                    إيقاف المشاركة
                  </Button>
                </div>
              </Card>
            )}

            {/* Location Status Card */}
            <Card className="p-4 card-shadow bg-gradient-to-l from-primary/10 to-teal-dark/5 border-primary/20">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  isSharingActive 
                    ? "bg-green-100 dark:bg-green-900/30 animate-pulse" 
                    : "bg-primary/20"
                )}>
                  <MapPin className={cn(
                    "w-6 h-6",
                    isSharingActive ? "text-green-600" : "text-primary"
                  )} />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">موقعك الحالي</div>
                  <div className="font-medium">
                    {location 
                      ? isSharingActive 
                        ? "مشاركة نشطة" 
                        : "تم تحديد الموقع"
                      : "جاري التحديد..."}
                  </div>
                  {location && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </div>
                  )}
                </div>
                {location && (
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    isSharingActive 
                      ? "bg-green-100 dark:bg-green-900/30" 
                      : "bg-green-100"
                  )}>
                    <Check className={cn(
                      "w-4 h-4",
                      isSharingActive ? "text-green-600" : "text-green-600"
                    )} />
                  </div>
                )}
              </div>
            </Card>

            {/* Duration Selection - only show when not sharing */}
            {!isSharingActive && (
              <>
                <Card className="p-4 card-shadow">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    مدة المشاركة
                  </h3>
                  <div className="space-y-2">
                    {DURATION_OPTIONS.map((option) => {
                      const IconComponent = option.icon;
                      const isSelected = selectedDuration === option.value;
                      
                      return (
                        <button
                          key={option.value}
                          onClick={() => setSelectedDuration(option.value)}
                          className={cn(
                            "w-full p-4 rounded-xl border-2 text-right transition-all duration-300 relative overflow-hidden group",
                            isSelected
                              ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                              : "border-border hover:border-primary/50 hover:bg-muted/50"
                          )}
                        >
                          <div
                            className={cn(
                              "absolute top-0 left-0 w-1 h-full bg-primary transition-all duration-300",
                              isSelected ? "opacity-100" : "opacity-0"
                            )}
                          />
                          
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                              isSelected ? option.color + " text-white shadow-lg" : "bg-muted"
                            )}>
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{option.label}</div>
                              <div className="text-sm text-muted-foreground">
                                {option.description}
                              </div>
                            </div>
                            <div
                              className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                                isSelected
                                  ? "border-primary bg-primary"
                                  : "border-border group-hover:border-primary/50"
                              )}
                            >
                              {isSelected && (
                                <Check className="w-4 h-4 text-white animate-in zoom-in duration-200" />
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Card>

                {/* Destination */}
                <Card className="p-4 card-shadow">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    الوجهة (اختياري)
                  </h3>
                  
                  {/* Quick destinations */}
                  <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
                    {popularDestinations.map((dest) => (
                      <button
                        key={dest.name}
                        onClick={() => setDestination(dest.name)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all border-2",
                          destination === dest.name
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <span className="ml-1">{dest.icon}</span>
                        {dest.name}
                      </button>
                    ))}
                  </div>

                  {/* Search input */}
                  <div className="relative">
                    <Input
                      placeholder="ابحث عن وجهة..."
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="bg-secondary border-0 rounded-xl pr-10"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                  
                  {destination && (
                    <div className="mt-3 p-3 bg-primary/10 rounded-xl flex items-center justify-between animate-in slide-in-from-top duration-200">
                      <div className="flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">{destination}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDestination("")}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </Card>

                {/* Privacy Options */}
                <Card className="p-4 card-shadow">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    خيارات الخصوصية
                  </h3>

                  {/* Ghost Mode */}
                  <div
                    className={cn(
                      "p-4 rounded-xl border-2 mb-3 cursor-pointer transition-all duration-300",
                      isGhostMode
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => setIsGhostMode(!isGhostMode)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                        isGhostMode ? "bg-primary text-white" : "bg-muted"
                      )}>
                        {isGhostMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">الوضع الخفي</div>
                        <div className="text-xs text-muted-foreground">
                          إظهار منطقة تقريبية بدلاً من الموقع الدقيق
                        </div>
                      </div>
                      <div
                        className={cn(
                          "w-12 h-7 rounded-full p-1 transition-all duration-300",
                          isGhostMode ? "bg-primary" : "bg-muted"
                        )}
                      >
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300",
                            isGhostMode ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Restricted Access */}
                  <div
                    className={cn(
                      "p-4 rounded-xl border-2 cursor-pointer transition-all duration-300",
                      isRestricted
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => setIsRestricted(!isRestricted)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                        isRestricted ? "bg-primary text-white" : "bg-muted"
                      )}>
                        <Lock className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">مشاركة خاصة</div>
                        <div className="text-xs text-muted-foreground">
                          فقط الأشخاص المحددون يمكنهم رؤية موقعك
                        </div>
                      </div>
                      <div
                        className={cn(
                          "w-12 h-7 rounded-full p-1 transition-all duration-300",
                          isRestricted ? "bg-primary" : "bg-muted"
                        )}
                      >
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300",
                            isRestricted ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Allowed Emails */}
                  {isRestricted && (
                    <div className="mt-4 space-y-3 animate-in slide-in-from-top duration-200">
                      <div className="flex gap-2">
                        <Input
                          placeholder="أضف بريد إلكتروني..."
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="bg-secondary border-0 rounded-xl"
                          onKeyDown={(e) => e.key === "Enter" && handleAddEmail()}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleAddEmail}
                          className="shrink-0 rounded-xl"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      {allowedEmails.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {allowedEmails.map((email) => (
                            <div
                              key={email}
                              className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm animate-in zoom-in duration-200"
                            >
                              <Users className="w-3 h-3" />
                              {email}
                              <button
                                onClick={() => handleRemoveEmail(email)}
                                className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>

                {/* Share Button */}
                <Button
                  onClick={handleShare}
                  disabled={isAnimating || !location}
                  className="w-full h-16 text-lg rounded-2xl bg-gradient-to-l from-primary to-teal-dark hover:opacity-90 transition-all duration-300 shadow-lg shadow-primary/30 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white/10 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
                  
                  <div className="flex items-center gap-2 relative z-10">
                    {isAnimating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>جاري إنشاء الرابط...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>شارك موقعك دلوقتي</span>
                        <Share2 className="w-5 h-5" />
                      </>
                    )}
                  </div>
                </Button>

                {/* Help text */}
                <p className="text-center text-sm text-muted-foreground">
                  سيتم إنشاء رابط مشفر آمن لمشاركة موقعك
                </p>
              </>
            )}
          </>
        )}
      </div>

      <BottomNav />

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={(open) => {
        setShowSuccessModal(open);
        if (!open && isSharingActive) {
          // Don't close if sharing is active - user needs to see the banner
        }
      }}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-lg">
              تم بدء مشاركة الموقع
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Success animation */}
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-12 h-12 text-green-500 animate-in zoom-in duration-300" />
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-green-500 animate-ping opacity-20" />
              </div>
            </div>

            {/* Status */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400 mb-2">
                <Radio className="w-4 h-4 animate-pulse" />
                <span className="font-medium">موقعك بيتحدث الآن</span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-400">
                يتم إرسال موقعك كل ٥ ثواني تلقائياً
              </p>
            </div>

            {/* Share link preview */}
            <div className="bg-secondary rounded-xl p-4 border-2 border-dashed border-primary/30">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">رابط مشفر آمن</span>
              </div>
              <p className="text-sm text-muted-foreground text-center break-all">
                {shareLink}
              </p>
            </div>

            {/* Duration info */}
            <div className="bg-primary/10 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-primary">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  الرابط صالح لمدة{" "}
                  {selectedDuration === -1
                    ? "حتى الوصول"
                    : selectedDuration >= 60
                    ? `${selectedDuration / 60} ساعة`
                    : `${selectedDuration} دقيقة`}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="flex-1 rounded-xl h-12"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 ml-2 text-green-500" />
                    <span className="text-green-500">تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 ml-2" />
                    نسخ الرسالة
                  </>
                )}
              </Button>
              <Button
                onClick={handleShareNative}
                className="flex-1 rounded-xl h-12 bg-primary"
              >
                <Share2 className="w-4 h-4 ml-2" />
                مشاركة
              </Button>
            </div>

            {/* QR Code Button */}
            <Button
              onClick={() => {
                setShowSuccessModal(false);
                setShowQRModal(true);
              }}
              variant="outline"
              className="w-full rounded-xl h-12 border-primary/30 hover:bg-primary/5"
            >
              <QrCode className="w-5 h-5 ml-2 text-primary" />
              شارك بـ QR Code
            </Button>

            {/* Close button */}
            <Button
              onClick={() => setShowSuccessModal(false)}
              variant="ghost"
              className="w-full rounded-xl"
            >
              متابعة المشاركة
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-lg">
              مشاركة بـ QR Code
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* QR Code */}
            <div className="flex items-center justify-center">
              <div 
                ref={qrRef}
                className="bg-white p-4 rounded-2xl shadow-lg"
              >
                <QRCodeSVG
                  value={shareLink}
                  size={200}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: "/icon-192.png",
                    x: undefined,
                    y: undefined,
                    height: 40,
                    width: 40,
                    excavate: true,
                  }}
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-primary/10 rounded-xl p-4 text-center">
              <p className="text-sm text-muted-foreground">
                امسح الكود بواسطة كاميرا الهاتف للمتابعة
              </p>
            </div>

            {/* Link preview */}
            <div className="bg-secondary rounded-xl p-3 border-2 border-dashed border-primary/30">
              <p className="text-xs text-muted-foreground text-center break-all">
                {shareLink}
              </p>
            </div>

            {/* Download Button */}
            <Button
              onClick={() => {
                const svg = qrRef.current?.querySelector('svg');
                if (svg) {
                  const svgData = new XMLSerializer().serializeToString(svg);
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  const img = new Image();
                  img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx?.fillRect(0, 0, canvas.width, canvas.height);
                    ctx?.drawImage(img, 0, 0);
                    const pngFile = canvas.toDataURL('image/png');
                    const downloadLink = document.createElement('a');
                    downloadLink.download = 'tamenny-qr.png';
                    downloadLink.href = pngFile;
                    downloadLink.click();
                    toast.success('تم تحميل الكود!');
                  };
                  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                }
              }}
              variant="outline"
              className="w-full rounded-xl h-12"
            >
              <Download className="w-4 h-4 ml-2" />
              تحميل الكود
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
