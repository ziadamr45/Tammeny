"use client";

import { Map, Eye, Users, MessageCircle, Settings, Wifi, WifiOff, Crosshair, Battery, BatteryLow } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { LogoIconInline } from "./logo";

const navItems = [
  { href: "/", icon: Map, label: "الخريطة" },
  { href: "/share", icon: Eye, label: "مشاركة" },
  { href: "/contacts", icon: Users, label: "جهات الاتصال" },
  { href: "/chat", icon: MessageCircle, label: "الرسائل" },
  { href: "/settings", icon: Settings, label: "الإعدادات" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-bottom z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 transition-transform",
                  isActive && "scale-110"
                )}
              />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Header() {
  const [isOnline, setIsOnline] = useState(true);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    // Set initial state after hydration (deferred to avoid cascading renders)
    const timer = setTimeout(() => {
      setIsOnline(navigator.onLine);
    }, 0);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get GPS accuracy
  useEffect(() => {
    if (!navigator.geolocation) return;
    
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setGpsAccuracy(position.coords.accuracy);
      },
      () => {
        setGpsAccuracy(null);
      },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Get battery level
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as Navigator & { getBattery: () => Promise<{ level: number }> }).getBattery().then((battery) => {
        setBatteryLevel(battery.level * 100);
      });
    }
  }, []);

  // Get GPS quality text and color
  const getGPSQuality = () => {
    if (gpsAccuracy === null) return { text: "غير متاح", color: "text-muted-foreground", quality: "unknown" };
    if (gpsAccuracy < 10) return { text: "ممتاز", color: "text-green-500", quality: "excellent" };
    if (gpsAccuracy < 30) return { text: "جيد", color: "text-yellow-500", quality: "good" };
    return { text: "ضعيف", color: "text-red-500", quality: "poor" };
  };

  const gpsQuality = getGPSQuality();

  return (
    <header className="fixed top-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-b border-border z-50">
      <div className="flex items-center justify-between px-4 h-14 max-w-md mx-auto">
        <LogoIconInline />
        
        {/* Network Quality Indicators */}
        <div className="flex items-center gap-3">
          {/* GPS Quality */}
          <div className="flex items-center gap-1.5" title={`GPS: ${gpsQuality.text}`}>
            <Crosshair className={cn("w-4 h-4", gpsQuality.color)} />
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center gap-1.5" title={isOnline ? "متصل بالإنترنت" : "غير متصل"}>
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500 animate-pulse" />
            )}
          </div>
          
          {/* Battery Level */}
          {batteryLevel !== null && (
            <div className="flex items-center gap-1" title={`البطارية: ${Math.round(batteryLevel)}%`}>
              {batteryLevel < 20 ? (
                <BatteryLow className="w-4 h-4 text-red-500" />
              ) : (
                <Battery className={cn(
                  "w-4 h-4",
                  batteryLevel < 50 ? "text-yellow-500" : "text-green-500"
                )} />
              )}
              <span className="text-xs text-muted-foreground">
                {Math.round(batteryLevel)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
