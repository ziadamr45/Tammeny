"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DynamicMap } from "@/components/tamenny/map-component";
import {
  MapPin,
  Navigation,
  Clock,
  Phone,
  MessageCircle,
  AlertTriangle,
  CheckCircle,
  Shield,
  Volume2,
  VolumeX,
  RefreshCw,
  Heart,
  Zap,
  Bell,
  Send,
  Eye,
  Radio,
  Activity,
  Timer,
  Loader2,
  StopCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { toArabicNumerals, formatArabicDistance } from "@/lib/arabic-numerals";
import { LogoIconInline } from "@/components/tamenny/logo";

interface SessionData {
  id: string;
  encryptedId: string;
  creatorName: string;
  creatorAvatar?: string;
  status: "active" | "completed" | "expired";
  currentLat: number | null;
  currentLng: number | null;
  destLat: number | null;
  destLng: number | null;
  destName: string | null;
  distance: number;
  eta: number | null;
  isGhostMode: boolean;
  startedAt: string;
  expiresAt: string | null;
}

export default function ViewerPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </main>
    }>
      <ViewerPageContent />
    </Suspense>
  );
}

function ViewerPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const encryptedId = params.id as string;
  const isOwner = searchParams.get('owner') === 'true';
  
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isNearby, setIsNearby] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [message, setMessage] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [etaCountdown, setEtaCountdown] = useState<number | null>(null);
  const [progressValue, setProgressValue] = useState(0);
  const [sendingMessage, setSendingMessage] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isNearbyRef = useRef(isNearby);
  const hasArrivedRef = useRef(hasArrived);
  const isMutedRef = useRef(isMuted);

  // Keep refs in sync
  useEffect(() => {
    isNearbyRef.current = isNearby;
  }, [isNearby]);

  useEffect(() => {
    hasArrivedRef.current = hasArrived;
  }, [hasArrived]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Fetch session data from API
  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/location?id=${encodeURIComponent(encryptedId)}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'فشل في تحميل الجلسة');
      }

      // Check if session is expired
      if (data.session.status === 'expired' || data.session.status === 'completed') {
        setSession(data.session);
        setLoading(false);
        return;
      }

      // Calculate progress based on distance
      if (data.session.distance && data.session.destLat) {
        const initialDistance = 5; // Assume 5km initial
        const progress = Math.min(100, Math.max(0, (1 - data.session.distance / initialDistance) * 100));
        setProgressValue(progress);
      }

      // Set session data
      setSession({
        id: data.session.id,
        encryptedId: data.session.encryptedId,
        creatorName: data.session.creatorName || 'المستخدم',
        creatorAvatar: data.session.creatorAvatar,
        status: data.session.status,
        currentLat: data.session.currentLat,
        currentLng: data.session.currentLng,
        destLat: data.session.destLat,
        destLng: data.session.destLng,
        destName: data.session.destName,
        distance: data.session.distance || 0,
        eta: data.session.eta,
        isGhostMode: data.session.isGhostMode,
        startedAt: data.session.startedAt,
        expiresAt: data.session.expiresAt,
      });
      
      // Set ETA countdown
      if (data.session.eta && !etaCountdown) {
        setEtaCountdown(data.session.eta);
      }

      // Check geofencing conditions
      if (data.session.distance < 0.5 && !isNearbyRef.current) {
        isNearbyRef.current = true;
        setTimeout(() => {
          setIsNearby(true);
          toast.success("قريب! أقل من ٥٠٠ متر", {
            icon: <Bell className="w-4 h-4" />,
          });
          if ("vibrate" in navigator && !isMutedRef.current) {
            navigator.vibrate([200, 100, 200]);
          }
        }, 0);
      }

      if (data.session.distance < 0.1 && !hasArrivedRef.current) {
        hasArrivedRef.current = true;
        setTimeout(() => {
          setHasArrived(true);
          toast.success("وصل! 🎉", {
            icon: <CheckCircle className="w-4 h-4 text-green-500" />,
            duration: 10000,
          });
          if ("vibrate" in navigator && !isMutedRef.current) {
            navigator.vibrate([500, 100, 500, 100, 500]);
          }
        }, 0);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في تحميل الجلسة');
    } finally {
      setLoading(false);
      setLastUpdate(new Date());
    }
  }, [encryptedId, etaCountdown]);

  // Initial load and polling
  useEffect(() => {
    if (!encryptedId) return;
    
    fetchSession(); // First load
    
    // Poll every 4 seconds
    pollingRef.current = setInterval(fetchSession, 4000);
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [encryptedId, fetchSession]);

  // ETA countdown
  useEffect(() => {
    if (!etaCountdown || etaCountdown <= 0 || hasArrived) return;

    const interval = setInterval(() => {
      setEtaCountdown((prev) => (prev && prev > 0 ? prev - 1 : 0));
    }, 60000);

    return () => clearInterval(interval);
  }, [etaCountdown, hasArrived]);

  // Progress bar animation
  useEffect(() => {
    if (hasArrived || !session?.destLat) return;

    const progressInterval = setInterval(() => {
      setProgressValue((prev) => Math.min(100, prev + 0.3));
    }, 500);

    return () => clearInterval(progressInterval);
  }, [hasArrived, session?.destLat]);

  // Owner location updates - صاحب الجلسة يرسل موقعه من هنا
  useEffect(() => {
    if (!isOwner || !encryptedId) return;

    const sendOwnerLocation = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition((pos) => {
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
        }).catch(() => {});
      });
    };

    sendOwnerLocation();
    const interval = setInterval(sendOwnerLocation, 5000);
    return () => clearInterval(interval);
  }, [isOwner, encryptedId]);

  const handleSendMessage = async () => {
    if (!message.trim() || !session) return;
    setSendingMessage(true);
    
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.id,
          content: message,
          receiverId: session.id,
          guestName: 'مشاهد',
          type: 'text',
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("تم إرسال الرسالة!", {
          icon: <Send className="w-4 h-4" />,
        });
        setMessage("");
        setShowMessageModal(false);
      } else {
        toast.error(data.error || "فشل في إرسال الرسالة");
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("فشل في إرسال الرسالة");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleStartCall = async () => {
    if (!session) return;
    
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.id,
          content: "طلب مكالمة هاتفية - أرجو الاتصال بي",
          receiverId: session.id,
          guestName: 'مشاهد',
          type: 'call_request',
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("تم إرسال طلب المكالمة!", {
          icon: <Phone className="w-4 h-4" />,
          description: "سيتم إشعار المستخدم بطلبك",
        });
      } else {
        toast.error(data.error || "فشل في إرسال طلب المكالمة");
      }
    } catch (error) {
      console.error('Error sending call request:', error);
      toast.error("فشل في إرسال طلب المكالمة");
    }
  };

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-primary/30" />
            <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>
          <p className="text-muted-foreground animate-pulse">جاري تحميل الجلسة...</p>
        </div>
      </main>
    );
  }

  // Error state
  if (error && !session) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-6 text-center max-w-sm card-shadow">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          <h2 className="text-xl font-bold mb-2">حدث خطأ</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button 
            onClick={() => router.push("/")}
            className="w-full rounded-xl h-12"
          >
            العودة للرئيسية
          </Button>
        </Card>
      </main>
    );
  }

  // Session not found
  if (!session) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-6 text-center max-w-sm card-shadow">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          <h2 className="text-xl font-bold mb-2">الجلسة غير موجودة</h2>
          <p className="text-muted-foreground mb-6">
            انتهت صلاحية رابط المشاركة أو تم إيقافه
          </p>
          <Button 
            onClick={() => router.push("/")}
            className="w-full rounded-xl h-12"
          >
            العودة للرئيسية
          </Button>
        </Card>
      </main>
    );
  }

  // Session completed/expired
  if (session.status === 'completed' || session.status === 'expired') {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-6 text-center max-w-sm card-shadow">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">
            {session.status === 'completed' ? 'تم الوصول!' : 'انتهت الجلسة'}
          </h2>
          <p className="text-muted-foreground mb-6">
            {session.status === 'completed' 
              ? `${session.creatorName} وصل بأمان` 
              : 'انتهت صلاحية رابط المشاركة'}
          </p>
          <Button 
            onClick={() => router.push("/")}
            className="w-full rounded-xl h-12"
          >
            العودة للرئيسية
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-card/95 backdrop-blur-lg border-b border-border z-50">
        <div className="flex items-center justify-between px-4 h-14">
          <LogoIconInline />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              آخر تحديث: {lastUpdate.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <button
              onClick={fetchSession}
              className="p-2 rounded-full hover:bg-muted transition-colors hover:rotate-180 duration-300"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={cn(
                "p-2 rounded-full transition-all",
                isMuted ? "bg-muted" : "hover:bg-muted"
              )}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Volume2 className="w-4 h-4 text-primary" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Status Banner */}
      {hasArrived ? (
        <div className="bg-gradient-to-l from-green-500 to-green-600 text-white px-4 py-4 flex items-center justify-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center relative">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <span className="font-bold text-lg">وصل!</span>
          <Heart className="w-5 h-5 animate-pulse ml-2" />
        </div>
      ) : isNearby ? (
        <div className="bg-gradient-to-l from-yellow-500 to-orange-500 text-white px-4 py-3 flex items-center justify-center gap-2">
          <Zap className="w-5 h-5 animate-bounce" />
          <span className="font-medium">قريب! أقل من ٥٠٠ متر</span>
        </div>
      ) : (
        <div className="bg-gradient-to-l from-primary to-teal-dark text-white px-4 py-3 flex items-center justify-center gap-2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-l from-white/0 via-white/10 to-white/0 animate-[shimmer_2s_infinite]" />
          <Navigation className="w-5 h-5 animate-bounce" />
          <span className="font-medium relative z-10">جاري التتبع...</span>
          <Radio className="w-4 h-4 animate-pulse ml-2" />
        </div>
      )}

      {/* Map */}
      <div className="relative h-[40vh] overflow-hidden shrink-0">
        {session.currentLat && session.currentLng ? (
          <DynamicMap
            center={{ lat: session.currentLat, lng: session.currentLng }}
            destination={session.destLat && session.destLng ? {
              lat: session.destLat,
              lng: session.destLng,
              name: session.destName || 'الوجهة'
            } : undefined}
            showRoute={!!session.destLat && !hasArrived}
            showUserLocation={!hasArrived}
            markerLabel={session.creatorName}
            destinationLabel={session.destName || "الوجهة"}
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-muted-foreground">جاري تحميل الموقع...</p>
            </div>
          </div>
        )}
        
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />

        {/* Live route indicator */}
        {!hasArrived && session.destLat && (
          <div className="absolute top-4 left-4 z-20">
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-medium">المسار المباشر</span>
              <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                {formatArabicDistance(session.distance)}
              </Badge>
            </div>
          </div>
        )}
        
        {/* Arrived celebration overlay */}
        {hasArrived && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="text-center">
              <div className="relative">
                <div className="absolute inset-0 w-24 h-24 rounded-full bg-green-500/30 animate-ping" />
                <div className="relative w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
              </div>
              <span className="text-2xl font-bold text-green-600">تم الوصول!</span>
              <p className="text-muted-foreground mt-2">{session.creatorName} وصل بأمان</p>
            </div>
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="px-4 -mt-4 relative z-10 space-y-4">
        {/* ETA Card */}
        <Card className="p-4 card-shadow border-2 border-primary/20 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500" />
          
          <div className="grid grid-cols-3 gap-4 relative z-10">
            {/* ETA */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm mb-1">
                <Timer className="w-4 h-4" />
                <span>الوصول</span>
              </div>
              <div className="relative inline-block">
                {etaCountdown !== null && !hasArrived && (
                  <div className="absolute inset-0 bg-primary/10 rounded-lg animate-ping" />
                )}
                <div className={cn(
                  "text-3xl font-bold relative",
                  hasArrived ? "text-green-500" : "text-primary"
                )}>
                  {hasArrived ? "—" : (etaCountdown !== null ? toArabicNumerals(Math.round(etaCountdown)) : "—")}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">دقيقة</div>
            </div>
            
            {/* Distance */}
            <div className="text-center border-x border-border">
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm mb-1">
                <MapPin className="w-4 h-4" />
                <span>المسافة</span>
              </div>
              <div className="text-3xl font-bold">
                {formatArabicDistance(session.distance).split(' ')[0]}
              </div>
              <div className="text-xs text-muted-foreground">كم</div>
            </div>
            
            {/* Speed */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm mb-1">
                <Zap className="w-4 h-4" />
                <span>السرعة</span>
              </div>
              <div className="text-3xl font-bold">
                —
              </div>
              <div className="text-xs text-muted-foreground">كم/س</div>
            </div>
          </div>

          {/* Progress bar */}
          {session.destLat && !hasArrived && (
            <div className="mt-4 relative z-10">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Activity className="w-4 h-4" />
                  التقدم نحو الهدف
                </span>
                <span className="font-medium text-primary">
                  {toArabicNumerals(Math.round(progressValue))}٪
                </span>
              </div>
              <div className="h-3 bg-primary/20 rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-l from-primary to-teal-light rounded-full transition-all duration-300 relative overflow-hidden"
                  style={{ width: `${progressValue}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.5s_infinite]" />
                </div>
              </div>
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>نقطة البداية</span>
                <span>{session.destName}</span>
              </div>
            </div>
          )}
        </Card>

        {/* Sender Info */}
        <Card className="p-4 card-shadow hover:shadow-lg transition-all group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-l from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="flex items-center gap-4 relative z-10">
            <Avatar className="w-16 h-16 border-2 border-primary/20 group-hover:border-primary/40 transition-colors">
              <AvatarFallback className="bg-gradient-to-br from-primary to-teal-dark text-primary-foreground text-2xl font-bold">
                {session.creatorName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-bold text-xl">{session.creatorName}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="bg-primary/10 text-primary gap-1">
                  <Shield className="w-3 h-3" />
                  مشفر AES-256
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  🚗
                  سيارة
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-muted/50 rounded-xl flex items-center gap-2 relative z-10">
            {session.isGhostMode ? (
              <>
                <Eye className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-muted-foreground">الوضع الخفي نشط - موقع تقريبي</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-muted-foreground">مشاركة كاملة - موقع دقيق</span>
              </>
            )}
          </div>
        </Card>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-14 rounded-xl text-primary border-primary hover:bg-primary/10 transition-all group"
            onClick={() => setShowMessageModal(true)}
            disabled={isOwner}
          >
            <MessageCircle className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
            {isOwner ? 'رسائلك' : 'رسالة'}
          </Button>
          
          {isOwner ? (
            <Button
              variant="destructive"
              className="h-14 rounded-xl transition-all"
              onClick={async () => {
                await fetch(`/api/sessions/${encryptedId}/stop`, { method: 'POST' });
                router.push('/share');
              }}
            >
              <StopCircle className="w-5 h-5 ml-2" />
              إيقاف المشاركة
            </Button>
          ) : (
            <Button
              variant="outline"
              className="h-14 rounded-xl text-green-600 border-green-600 hover:bg-green-50 transition-all group"
              onClick={handleStartCall}
            >
              <Phone className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
              طلب اتصال
            </Button>
          )}
        </div>

        {/* Trip Details */}
        <Card className="p-4 card-shadow hover:shadow-lg transition-all">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary" />
            تفاصيل الرحلة
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">بدأت منذ</div>
                <div className="font-medium">
                  {session.startedAt 
                    ? toArabicNumerals(Math.round((Date.now() - new Date(session.startedAt).getTime()) / 60000))
                    : toArabicNumerals(0)} دقيقة
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                نشطة
              </Badge>
            </div>
            
            {session.destName && (
              <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">الوجهة</div>
                  <div className="font-medium">{session.destName}</div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  {formatArabicDistance(session.distance)}
                </Badge>
              </div>
            )}
          </div>
        </Card>

        {/* Privacy Notice */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
          <Shield className="w-4 h-4 text-primary" />
          <span>موقعك في أمان - لن يتم مشاركته مع أي شخص</span>
        </div>
      </div>

      {/* Message Modal */}
      <Dialog open={showMessageModal} onOpenChange={setShowMessageModal}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">إرسال رسالة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {session.creatorName[0]}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{session.creatorName}</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {["طمنّي عليك!", "وصلت؟", "استنى شوية", "أنا في الطريق"].map((msg) => (
                <button
                  key={msg}
                  onClick={() => setMessage(msg)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm border-2 transition-all",
                    message === msg
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {msg}
                </button>
              ))}
            </div>
            
            <div className="relative">
              <Input
                placeholder="اكتب رسالتك..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="bg-secondary border-0 rounded-xl pr-10"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && message.trim()) {
                    handleSendMessage();
                  }
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute left-2 top-1/2 -translate-y-1/2 text-primary"
                onClick={handleSendMessage}
                disabled={!message.trim() || sendingMessage}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            <Button
              onClick={handleSendMessage}
              className="w-full h-12 rounded-xl bg-primary"
              disabled={!message.trim() || sendingMessage}
            >
              {sendingMessage ? (
                <>
                  <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 ml-2" />
                  إرسال الرسالة
                </>
              )}
            </Button>
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
