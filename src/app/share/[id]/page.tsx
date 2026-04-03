"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  isGhostMode: boolean;
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
  isGhostMode: false,
};

export default function ViewerPage() {
  const params = useParams();
  const sessionId = params.id as string;
  
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isNearby, setIsNearby] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulate loading session data
    setTimeout(() => {
      setSession(MOCK_SESSION);
      setLoading(false);
    }, 1000);

    // Simulate location updates
    const interval = setInterval(() => {
      if (session) {
        // Update location slightly
        setSession((prev) =>
          prev
            ? {
                ...prev,
                currentLocation: {
                  lat: prev.currentLocation.lat + 0.001,
                  lng: prev.currentLocation.lng + 0.001,
                },
                eta: Math.max(0, (prev.eta || 0) - 0.5),
                distance: Math.max(0, prev.distance - 0.1),
              }
            : null
        );
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [session]);

  // Geofencing notifications
  useEffect(() => {
    if (!session) return;

    const checkGeofence = () => {
      if (session.distance < 0.5 && !isNearby) {
        setIsNearby(true);
        // Play notification sound
        if (!isMuted) {
          // In production, play actual sound
        }
        // Vibrate if supported
        if ("vibrate" in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
      }

      if (session.distance < 0.1 && !hasArrived) {
        setHasArrived(true);
      }
    };
    
    checkGeofence();
  }, [session?.distance, isNearby, hasArrived, isMuted]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground">جاري تحميل الجلسة...</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-6 text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold mb-2">الجلسة غير موجودة</h2>
          <p className="text-muted-foreground mb-4">
            انتهت صلاحية رابط المشاركة أو تم إيقافه
          </p>
          <Button className="w-full">العودة للرئيسية</Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-50">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-medium text-primary">طمنّي</span>
          </div>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Volume2 className="w-5 h-5 text-primary" />
            )}
          </button>
        </div>
      </header>

      {/* Status Banner */}
      {hasArrived ? (
        <div className="bg-green-500 text-white px-4 py-3 flex items-center justify-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">وصل!</span>
        </div>
      ) : isNearby ? (
        <div className="bg-yellow-500 text-white px-4 py-3 flex items-center justify-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">قريب! أقل من ٥٠٠ متر</span>
        </div>
      ) : (
        <div className="bg-primary text-white px-4 py-3 flex items-center justify-center gap-2">
          <Navigation className="w-5 h-5 animate-pulse" />
          <span className="font-medium">جاري التتبع...</span>
        </div>
      )}

      {/* Map */}
      <div ref={mapRef} className="relative h-[40vh] bg-gradient-to-b from-primary/10 to-primary/5">
        {/* Grid pattern for map simulation */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%">
            <pattern id="viewerGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#viewerGrid)" />
          </svg>
        </div>

        {/* Route line simulation */}
        {session.destination && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <line
              x1="30%"
              y1="60%"
              x2="70%"
              y2="30%"
              stroke="var(--primary)"
              strokeWidth="3"
              strokeDasharray="10,5"
              className="animate-pulse"
            />
          </svg>
        )}

        {/* Current location marker */}
        <div className="absolute bottom-1/3 right-1/4 z-10">
          <div className="w-12 h-12 rounded-full bg-primary/20 animate-ping absolute" />
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
            <Navigation className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Destination marker */}
        {session.destination && (
          <div className="absolute top-1/3 left-1/2 z-10">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-card px-2 py-1 rounded text-xs whitespace-nowrap shadow-md">
              {session.destination.name}
            </span>
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="px-4 -mt-6 relative z-10 space-y-4">
        {/* ETA Card */}
        <Card className="p-4 card-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">الوصول خلال</div>
              <div className="text-3xl font-bold text-primary">
                {session.eta ? `${Math.round(session.eta)} دقيقة` : "غير متاح"}
              </div>
            </div>
            <div className="text-left">
              <div className="text-sm text-muted-foreground">المسافة المتبقية</div>
              <div className="text-xl font-bold">{session.distance.toFixed(1)} كم</div>
            </div>
          </div>
        </Card>

        {/* Sender Info */}
        <Card className="p-4 card-shadow">
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {session.creatorName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-bold text-lg">{session.creatorName}</div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  <Shield className="w-3 h-3 ml-1" />
                  AES-256
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {session.isGhostMode ? "وضع خفي" : "مشاركة كاملة"}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex-1 rounded-xl h-14 text-primary border-primary"
          >
            <Phone className="w-5 h-5 ml-2" />
            اتصال
          </Button>
          <Button
            variant="outline"
            className="flex-1 rounded-xl h-14 text-primary border-primary"
          >
            <MessageCircle className="w-5 h-5 ml-2" />
            رسالة
          </Button>
        </div>

        {/* Trip Details */}
        <Card className="p-4 card-shadow">
          <h3 className="font-bold mb-3">تفاصيل الرحلة</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">بدأت منذ</div>
                <div className="font-medium">٥ دقائق</div>
              </div>
            </div>
            {session.destination && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">الوجهة</div>
                  <div className="font-medium">{session.destination.name}</div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Privacy Notice */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
          <Shield className="w-4 h-4" />
          <span>موقعك في أمان - لن يتم مشاركته مع أي شخص</span>
        </div>
      </div>
    </main>
  );
}
