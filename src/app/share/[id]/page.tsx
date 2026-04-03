"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
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
  ArrowRight,
  Shield,
  Volume2,
  VolumeX,
  RefreshCw,
  Share2,
  Heart,
  AlertCircle,
  Car,
  Footprints,
  Bike,
  Timer,
  TrendingDown,
  Zap,
  Bell,
  Send,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SessionData {
  id: string;
  creatorName: string;
  status: "active" | "completed" | "expired";
  startedAt: string;
  expiresAt: string | null;
  destination: { lat: number; lng: number; name: string } | null;
  currentLocation: { lat: number; lng: number };
  eta: number | null;
  distance: number;
  speed: number;
  isGhostMode: boolean;
  transportMode: "car" | "walking" | "bike";
}

// Mock data for demo
const MOCK_SESSION: SessionData = {
  id: "demo123",
  creatorName: "أحمد",
  status: "active",
  startedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  destination: {
    lat: 30.05,
    lng: 31.25,
    name: "المكتب",
  },
  currentLocation: { lat: 30.04, lng: 31.24 },
  eta: 15,
  distance: 2.5,
  speed: 45,
  isGhostMode: false,
  transportMode: "car",
};

export default function ViewerPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isNearby, setIsNearby] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [message, setMessage] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [showSafetyCheck, setShowSafetyCheck] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const isNearbyRef = useRef(isNearby);
  const hasArrivedRef = useRef(hasArrived);
  const isMutedRef = useRef(isMuted);

  // Keep isMutedRef in sync
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    // Simulate loading session data
    setTimeout(() => {
      setSession(MOCK_SESSION);
      setLoading(false);
    }, 1000);

    // Simulate location updates with geofencing
    const interval = setInterval(() => {
      setSession((prev) => {
        if (!prev) return null;
        const newDistance = Math.max(0, prev.distance - 0.1);
        const newEta = Math.max(0, (prev.eta || 0) - 0.5);
        
        // Check geofencing conditions
        if (newDistance < 0.5 && !isNearbyRef.current) {
          isNearbyRef.current = true;
          // Use setTimeout to defer setState outside of this context
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

        if (newDistance < 0.1 && !hasArrivedRef.current) {
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
        
        return {
          ...prev,
          currentLocation: {
            lat: prev.currentLocation.lat + 0.001,
            lng: prev.currentLocation.lng + 0.001,
          },
          eta: newEta,
          distance: newDistance,
          speed: Math.max(0, prev.speed + (Math.random() - 0.5) * 10),
        };
      });
      setLastUpdate(new Date());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Safety check timer
  useEffect(() => {
    if (!session || session.status !== "active") return;
    
    const safetyTimer = setTimeout(() => {
      setShowSafetyCheck(true);
    }, 60000); // Ask for safety check after 1 minute

    return () => clearTimeout(safetyTimer);
  }, [session]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    toast.success("تم إرسال الرسالة!");
    setMessage("");
    setShowMessageModal(false);
  };

  const handleSafetyConfirm = () => {
    setShowSafetyCheck(false);
    toast.success("شكراً للتأكيد!");
  };

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case "car": return <Car className="w-4 h-4" />;
      case "walking": return <Footprints className="w-4 h-4" />;
      case "bike": return <Bike className="w-4 h-4" />;
      default: return <Car className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-primary/30" />
            <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </div>
          <p className="text-muted-foreground">جاري تحميل الجلسة...</p>
        </div>
      </main>
    );
  }

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

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-card/95 backdrop-blur-lg border-b border-border z-50">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-bold text-primary">طمنّي</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              آخر تحديث: {lastUpdate.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <button
              onClick={() => setLastUpdate(new Date())}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-full hover:bg-muted transition-colors"
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
        <div className="bg-gradient-to-l from-green-500 to-green-600 text-white px-4 py-4 flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg">وصل!</span>
          <Heart className="w-5 h-5 animate-pulse ml-2" />
        </div>
      ) : isNearby ? (
        <div className="bg-gradient-to-l from-yellow-500 to-orange-500 text-white px-4 py-3 flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300">
          <Zap className="w-5 h-5" />
          <span className="font-medium">قريب! أقل من ٥٠٠ متر</span>
        </div>
      ) : (
        <div className="bg-gradient-to-l from-primary to-teal-dark text-white px-4 py-3 flex items-center justify-center gap-2">
          <Navigation className="w-5 h-5 animate-bounce" />
          <span className="font-medium">جاري التتبع...</span>
        </div>
      )}

      {/* Map */}
      <div ref={mapRef} className="relative h-[40vh] overflow-hidden">
        {/* Real OpenStreetMap */}
        <DynamicMap
          center={session.currentLocation}
          destination={session.destination}
          showRoute={!!session.destination && !hasArrived}
          showUserLocation={!hasArrived}
          markerLabel={session.creatorName}
          destinationLabel={session.destination?.name || "الوجهة"}
          className="absolute inset-0"
        />
        
        {/* Map overlay gradient */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent pointer-events-none z-[500]" />
        
        {/* Arrived celebration overlay */}
        {hasArrived && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[600]">
            <div className="text-center animate-in zoom-in duration-500">
              <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <span className="text-2xl font-bold text-green-600">تم الوصول!</span>
            </div>
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="px-4 -mt-4 relative z-10 space-y-4">
        {/* ETA Card */}
        <Card className="p-4 card-shadow border-2 border-primary/20">
          <div className="grid grid-cols-3 gap-4">
            {/* ETA */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm mb-1">
                <Timer className="w-4 h-4" />
                <span>الوصول</span>
              </div>
              <div className="text-3xl font-bold text-primary">
                {session.eta ? Math.round(session.eta) : "—"}
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
                {session.distance.toFixed(1)}
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
                {Math.round(session.speed)}
              </div>
              <div className="text-xs text-muted-foreground">كم/س</div>
            </div>
          </div>

          {/* Progress bar */}
          {session.destination && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">التقدم نحو الهدف</span>
                <span className="font-medium text-primary">
                  {Math.round((1 - session.distance / 2.5) * 100)}%
                </span>
              </div>
              <Progress value={(1 - session.distance / 2.5) * 100} className="h-2" />
            </div>
          )}
        </Card>

        {/* Sender Info */}
        <Card className="p-4 card-shadow">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-primary/20">
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
                  {getTransportIcon(session.transportMode)}
                  {session.transportMode === "car" ? "سيارة" : session.transportMode === "walking" ? "مشي" : "دراجة"}
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Privacy status */}
          <div className="mt-4 p-3 bg-muted/50 rounded-xl flex items-center gap-2">
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
            className="h-14 rounded-xl text-primary border-primary hover:bg-primary/10"
          >
            <Phone className="w-5 h-5 ml-2" />
            اتصال
          </Button>
          <Button
            variant="outline"
            className="h-14 rounded-xl text-primary border-primary hover:bg-primary/10"
            onClick={() => setShowMessageModal(true)}
          >
            <MessageCircle className="w-5 h-5 ml-2" />
            رسالة
          </Button>
        </div>

        {/* Trip Details */}
        <Card className="p-4 card-shadow">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary" />
            تفاصيل الرحلة
          </h3>
          <div className="space-y-4">
            {/* Start time */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">بدأت منذ</div>
                <div className="font-medium">٥ دقائق</div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                نشطة
              </Badge>
            </div>
            
            {/* Destination */}
            {session.destination && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">الوجهة</div>
                  <div className="font-medium">{session.destination.name}</div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  {session.distance.toFixed(1)} كم
                </Badge>
              </div>
            )}

            {/* ETA trend */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">متوسط السرعة</div>
                <div className="font-medium">{Math.round(session.speed)} كم/ساعة</div>
              </div>
            </div>
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
            
            {/* Quick messages */}
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
              />
            </div>
            
            <Button
              onClick={handleSendMessage}
              className="w-full h-12 rounded-xl bg-primary"
              disabled={!message.trim()}
            >
              <Send className="w-4 h-4 ml-2" />
              إرسال الرسالة
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Safety Check Modal */}
      <Dialog open={showSafetyCheck} onOpenChange={setShowSafetyCheck}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">تأكيد الأمان</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="w-10 h-10 text-primary animate-pulse" />
              </div>
            </div>
            <p className="text-center text-muted-foreground">
              هل أنت بخير؟ تم التتبع لمدة دقيقة.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setShowSafetyCheck(false)}
              >
                لاحقاً
              </Button>
              <Button
                className="flex-1 rounded-xl bg-primary"
                onClick={handleSafetyConfirm}
              >
                <CheckCircle className="w-4 h-4 ml-2" />
                أنا بخير
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
