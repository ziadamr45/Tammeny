"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DynamicMap } from "@/components/tamenny/map-component";
import {
  AlertTriangle,
  Phone,
  MapPin,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Clock,
  Users,
  X,
  Check,
  Volume2,
  Vibrate,
  Shield,
  Navigation,
  Share2,
  RefreshCw,
  Home,
  Heart,
  Briefcase,
  AlertCircle,
  User,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import {
  toArabicNumerals,
  formatArabicDistance,
  formatArabicTimeFromSeconds,
} from "@/lib/arabic-numerals";

// SOS Status types
type SOSStatus = "inactive" | "counting" | "active";

// Mock location (fallback)
const MOCK_LOCATION = {
  lat: 30.0444,
  lng: 31.2357,
  name: "القاهرة، مصر",
};

// Contact type
interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  isFavorite: boolean;
}

export default function SOSPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [status, setStatus] = useState<SOSStatus>("inactive");
  const [countdown, setCountdown] = useState(5);
  const [location, setLocation] = useState<typeof MOCK_LOCATION | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [batterySaver, setBatterySaver] = useState(false);
  const [eta, setEta] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [sharingLink, setSharingLink] = useState("");
  const [activeDuration, setActiveDuration] = useState(0);
  const [notifiedContacts, setNotifiedContacts] = useState<string[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [currentSosId, setCurrentSosId] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const vibrationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auth check
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

  // Get current location on mount
  useEffect(() => {
    const fetchLocation = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              name: "موقعك الحالي",
            });
          },
          () => {
            setTimeout(() => setLocation(MOCK_LOCATION), 0);
          },
          { enableHighAccuracy: true }
        );
      } else {
        setTimeout(() => setLocation(MOCK_LOCATION), 0);
      }
    };
    
    fetchLocation();
  }, []);

  // Get battery level
  useEffect(() => {
    const getBattery = async () => {
      try {
        // @ts-expect-error - Battery API is not in TypeScript
        const battery = await navigator.getBattery?.();
        if (battery) {
          setBatteryLevel(Math.round(battery.level * 100));
          setBatterySaver(battery.level < 0.2);

          battery.addEventListener("levelchange", () => {
            setBatteryLevel(Math.round(battery.level * 100));
          });
        }
      } catch {
        // Battery API not supported
        setBatteryLevel(75); // Mock value
      }
    };

    getBattery();
  }, []);

  // Fetch emergency contacts
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await fetch('/api/contacts');
        const data = await response.json();
        if (data.success && data.contacts) {
          setContacts(data.contacts.map((c: { id: string; name: string; relation: string; phone: string; isEmergency: boolean }) => ({
            id: c.id,
            name: c.name,
            relation: c.relation,
            phone: c.phone,
            isFavorite: c.isEmergency,
          })));
        }
      } catch {
        // Failed to fetch contacts
      } finally {
        setLoadingContacts(false);
      }
    };

    fetchContacts();
  }, []);

  // Play alert sound
  const playAlertSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
    } catch {
      // Audio not supported
    }
  }, []);

  // Start vibration pattern
  const startVibration = useCallback(() => {
    if ("vibrate" in navigator) {
      vibrationIntervalRef.current = setInterval(() => {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }, 1000);
    }
  }, []);

  // Stop vibration
  const stopVibration = useCallback(() => {
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }
    if ("vibrate" in navigator) {
      navigator.vibrate(0);
    }
  }, []);

  // Activate SOS
  const activateSOS = useCallback(async () => {
    setStatus("active");
    startVibration();
    playAlertSound();

    try {
      const response = await fetch('/api/sos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: location?.lat,
          longitude: location?.lng,
          locationName: location?.name,
          batteryLevel: batteryLevel,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Generate sharing link
        const link = `${window.location.origin}/share/sos-${data.sosSession.id}`;
        setSharingLink(link);

        // Store SOS ID for deactivation
        setCurrentSosId(data.sosSession.id);

        // Mark notified contacts
        const favoriteContacts = contacts.filter((c) => c.isFavorite);
        setTimeout(() => {
          setNotifiedContacts(favoriteContacts.map((c) => c.id));
          if (data.notifiedCount > 0) {
            toast.success(`تم إرسال تنبيه الطوارئ إلى ${toArabicNumerals(data.notifiedCount)} جهة اتصال`);
          } else {
            toast.warning("لا توجد جهات اتصال للإبلاغ");
          }
        }, 1000);

        // Simulate ETA
        setEta(Math.floor(Math.random() * 10) + 5);
      } else {
        toast.error(data.error || "فشل في إرسال تنبيه الطوارئ");
      }
    } catch {
      toast.error("حدث خطأ أثناء إرسال تنبيه الطوارئ");
    }
  }, [playAlertSound, startVibration, contacts, location, batteryLevel]);

  // Handle SOS button press
  const handleSOSPress = () => {
    setStatus("counting");
    setCountdown(5);
    playAlertSound();
  };

  // Cancel countdown
  const handleCancel = () => {
    setStatus("inactive");
    setCountdown(5);
    stopVibration();
    toast.success("تم إلغاء تنبيه الطوارئ");
  };

  // Countdown timer
  useEffect(() => {
    if (status !== "counting") return;

    if (countdown <= 0) {
      // Use setTimeout to defer state updates outside effect
      setTimeout(() => activateSOS(), 0);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [status, countdown, activateSOS]);

  // Active duration timer
  useEffect(() => {
    if (status !== "active") return;

    const interval = setInterval(() => {
      setActiveDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  // Deactivate SOS
  const handleDeactivate = () => {
    setShowConfirmDialog(true);
  };

  // Confirm deactivate
  const confirmDeactivate = async () => {
    try {
      if (currentSosId) {
        const response = await fetch('/api/sos', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sosId: currentSosId }),
        });

        const data = await response.json();
        if (!data.success) {
          toast.error(data.error || "فشل في إلغاء تنبيه الطوارئ");
          return;
        }
      }
    } catch {
      toast.error("حدث خطأ أثناء إلغاء تنبيه الطوارئ");
      return;
    }

    setStatus("inactive");
    setCountdown(5);
    setActiveDuration(0);
    setNotifiedContacts([]);
    setCurrentSosId(null);
    stopVibration();
    setShowConfirmDialog(false);
    toast.success("تم إلغاء تنبيه الطوارئ");
  };

  // Quick call contact
  const handleCall = (phone: string, name: string) => {
    toast.success(`جاري الاتصال بـ ${name}...`);
    // In a real app, this would open the phone dialer
    window.open(`tel:${phone}`, "_self");
  };

  // Get battery icon
  const getBatteryIcon = () => {
    if (batteryLevel === null) return <Battery className="w-5 h-5" />;
    if (batteryLevel < 20) return <BatteryLow className="w-5 h-5 text-red-500" />;
    if (batteryLevel < 50) return <BatteryMedium className="w-5 h-5 text-yellow-500" />;
    return <BatteryFull className="w-5 h-5 text-green-500" />;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-red-50 to-background pb-20">
      {/* Auth Loading */}
      {!authChecked && (
        <div className="fixed inset-0 bg-background flex items-center justify-center z-[100]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">جاري التحقق...</p>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 hover:bg-muted rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </Link>
            <h1 className="font-bold text-lg">تنبيه الطوارئ</h1>
          </div>
          <Badge
            variant={status === "active" ? "destructive" : status === "counting" ? "default" : "secondary"}
            className="gap-1.5 animate-pulse"
          >
            <AlertCircle className="w-3 h-3" />
            {status === "inactive" ? "غير نشط" : status === "counting" ? "جاري العد" : "نشط"}
          </Badge>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* SOS Button Section */}
        <div className="flex flex-col items-center justify-center py-8">
          {status === "inactive" && (
            <>
              {/* Pulse rings */}
              <div className="relative">
                <div className="absolute inset-0 w-48 h-48 rounded-full bg-red-500/20 animate-[ping_2s_ease-in-out_infinite]" />
                <div className="absolute inset-0 w-48 h-48 rounded-full bg-red-500/20 animate-[ping_2s_ease-in-out_infinite_0.5s]" />
                <div className="absolute inset-0 w-48 h-48 rounded-full bg-red-500/20 animate-[ping_2s_ease-in-out_infinite_1s]" />

                {/* Main button */}
                <button
                  onClick={handleSOSPress}
                  className="relative w-48 h-48 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-2xl shadow-red-500/50 flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 group"
                >
                  <AlertTriangle className="w-16 h-16 text-white mb-2 group-hover:animate-bounce" />
                  <span className="text-white font-bold text-2xl">SOS</span>
                  <span className="text-white/80 text-sm mt-1">اضغط للطوارئ</span>
                </button>
              </div>

              <p className="text-center text-muted-foreground mt-6 max-w-xs">
                سيتم إرسال تنبيه مع موقعك الحالي إلى جهات الاتصال المختارة
              </p>
            </>
          )}

          {status === "counting" && (
            <>
              {/* Countdown display */}
              <div className="relative">
                <div className="absolute inset-0 w-48 h-48 rounded-full bg-red-500/30 animate-pulse" />
                <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-2xl shadow-red-500/50 flex flex-col items-center justify-center">
                  <div className="text-7xl font-bold text-white animate-pulse">
                    {toArabicNumerals(countdown)}
                  </div>
                  <span className="text-white/80 text-sm mt-2">ثانية</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Volume2 className="w-5 h-5 text-red-500 animate-pulse" />
                <Vibrate className="w-5 h-5 text-red-500 animate-pulse" />
                <span className="text-red-600 font-medium">جاري العد التنازلي...</span>
              </div>

              <Button
                onClick={handleCancel}
                variant="outline"
                size="lg"
                className="mt-6 rounded-2xl px-8 border-2 border-red-300 hover:bg-red-50 hover:border-red-500"
              >
                <X className="w-5 h-5 ml-2" />
                إلغاء التنبيه
              </Button>
            </>
          )}

          {status === "active" && (
            <>
              {/* Active status display */}
              <div className="relative">
                <div className="absolute inset-0 w-48 h-48 rounded-full bg-red-500/30 animate-ping" />
                <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-2xl shadow-red-500/50 flex flex-col items-center justify-center">
                  <Check className="w-16 h-16 text-white mb-2" />
                  <span className="text-white font-bold text-xl">نشط</span>
                  <span className="text-white/80 text-sm mt-1">
                    {formatArabicTimeFromSeconds(activeDuration)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-green-600 font-medium">جاري مشاركة الموقع</span>
              </div>

              <Button
                onClick={handleDeactivate}
                variant="outline"
                size="lg"
                className="mt-6 rounded-2xl px-8 border-2 border-green-300 bg-green-50 hover:bg-green-100 text-green-700"
              >
                <Check className="w-5 h-5 ml-2" />
                إنهاء التنبيه
              </Button>
            </>
          )}
        </div>

        {/* Location Display */}
        {location && (
          <Card className="p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="font-medium">موقعك الحالي</span>
              </div>
              {status === "active" && (
                <Badge className="bg-green-100 text-green-700 gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  مباشر
                </Badge>
              )}
            </div>

            {/* Mini map */}
            <div className="h-40 rounded-xl overflow-hidden border">
              <DynamicMap
                center={location}
                showUserLocation
                markerLabel="موقعك"
                className="h-full w-full"
              />
            </div>

            <div className="flex items-center justify-between mt-3 text-sm">
              <span className="text-muted-foreground">
                خط العرض: {toArabicNumerals(location.lat.toFixed(4))}°
              </span>
              <span className="text-muted-foreground">
                خط الطول: {toArabicNumerals(location.lng.toFixed(4))}°
              </span>
            </div>
          </Card>
        )}

        {/* Active Status Info */}
        {status === "active" && (
          <div className="grid grid-cols-2 gap-4">
            {/* Sharing Status */}
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Share2 className="w-5 h-5 text-primary" />
                <span className="font-medium text-sm">حالة المشاركة</span>
              </div>
              <div className="text-lg font-bold text-primary">
                {toArabicNumerals(notifiedContacts.length)} جهة اتصال
              </div>
              <div className="text-xs text-muted-foreground">تم إبلاغهم</div>
            </Card>

            {/* ETA */}
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-sm">الوقت المتوقع</span>
              </div>
              <div className="text-lg font-bold text-blue-600">
                {toArabicNumerals(eta)} دقيقة
              </div>
              <div className="text-xs text-muted-foreground">للوصول للمساعدة</div>
            </Card>

            {/* Battery Status */}
            <Card className="p-4 bg-amber-50 border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                {getBatteryIcon()}
                <span className="font-medium text-sm">البطارية</span>
              </div>
              <div className="text-lg font-bold">
                {batteryLevel ? `${toArabicNumerals(batteryLevel)}٪` : "غير معروف"}
              </div>
              {batterySaver && (
                <Badge variant="outline" className="mt-1 text-xs">
                  <BatteryLow className="w-3 h-3 ml-1" />
                  وضع توفير البطارية
                </Badge>
              )}
            </Card>

            {/* Duration */}
            <Card className="p-4 bg-purple-50 border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-sm">المدة</span>
              </div>
              <div className="text-lg font-bold text-purple-600">
                {formatArabicTimeFromSeconds(activeDuration)}
              </div>
              <div className="text-xs text-muted-foreground">منذ التفعيل</div>
            </Card>
          </div>
        )}

        {/* Emergency Contacts */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-bold">جهات الاتصال</span>
            </div>
            <Link href="/emergency-contacts">
              <Button variant="ghost" size="sm" className="text-primary">
                تعديل
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {loadingContacts ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">لا توجد جهات اتصال</p>
                <Link href="/emergency-contacts">
                  <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    إضافة جهة اتصال
                  </Button>
                </Link>
              </div>
            ) : (
              contacts.map((contact) => (
                <div
                  key={contact.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl transition-all",
                    notifiedContacts.includes(contact.id)
                      ? "bg-green-50 border border-green-200"
                      : "bg-muted/50 hover:bg-muted"
                  )}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {contact.name}
                      {contact.isFavorite && (
                        <Heart className="w-4 h-4 text-red-500 fill-current" />
                      )}
                      {notifiedContacts.includes(contact.id) && (
                        <Check className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{contact.relation}</div>
                  </div>
                  <Button
                    onClick={() => handleCall(contact.phone, contact.name)}
                    variant="outline"
                    size="icon"
                    className="rounded-full border-green-300 hover:bg-green-50 hover:border-green-500"
                  >
                    <Phone className="w-4 h-4 text-green-600" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <Link href="/emergency-contacts">
            <Card className="p-3 text-center hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1">
              <Users className="w-6 h-6 mx-auto text-primary mb-2" />
              <span className="text-xs font-medium">جهات الاتصال</span>
            </Card>
          </Link>
          <Link href="/safe-zones">
            <Card className="p-3 text-center hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1">
              <Shield className="w-6 h-6 mx-auto text-primary mb-2" />
              <span className="text-xs font-medium">المناطق الآمنة</span>
            </Card>
          </Link>
          <Link href="/settings">
            <Card className="p-3 text-center hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1">
              <Navigation className="w-6 h-6 mx-auto text-primary mb-2" />
              <span className="text-xs font-medium">الإعدادات</span>
            </Card>
          </Link>
        </div>

        {/* Tips */}
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-amber-800 mb-1">نصائح للطوارئ</div>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• حافظ على هدوئك وابقي في مكانك إن أمكن</li>
                <li>• شارك موقعك مع أشخاص موثوقين</li>
                <li>• احتفظ ببطارية هاتفك لأطول فترة ممكنة</li>
                <li>• اتصل بالطوارئ الرسمية عند الحاجة</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Confirm Deactivate Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-lg">إنهاء تنبيه الطوارئ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <p className="text-center text-muted-foreground">
              هل أنت متأكد من إنهاء تنبيه الطوارئ؟ سيتم إبلاغ جهات الاتصال بأنك بخير.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setShowConfirmDialog(false)}
              >
                إلغاء
              </Button>
              <Button
                className="flex-1 rounded-xl bg-green-600 hover:bg-green-700"
                onClick={confirmDeactivate}
              >
                تأكيد
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Styles */}
      <style jsx global>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </main>
  );
}
