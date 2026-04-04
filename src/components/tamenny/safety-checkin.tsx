"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Heart,
  Shield,
  CheckCircle,
  AlertTriangle,
  Bell,
  Clock,
  Phone,
  Send,
  RefreshCw,
  Zap,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SafetyCheckInProps {
  isActive?: boolean;
  checkInInterval?: number; // in minutes
  onSafetyConfirm?: () => void;
  onEmergencyTrigger?: () => void;
  emergencyContacts?: { name: string; phone: string }[];
}

interface SafetyStatus {
  lastCheckIn: Date | null;
  nextCheckIn: Date | null;
  missedCheckIns: number;
  status: "safe" | "pending" | "alert" | "emergency";
}

export function SafetyCheckIn({
  isActive = true,
  checkInInterval = 5,
  onSafetyConfirm,
  onEmergencyTrigger,
  emergencyContacts = [
    { name: "أحمد", phone: "+201234567890" },
    { name: "سارة", phone: "+201234567891" },
  ],
}: SafetyCheckInProps) {
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);
  const [safetyStatus, setSafetyStatus] = useState<SafetyStatus>({
    lastCheckIn: null,
    nextCheckIn: null,
    missedCheckIns: 0,
    status: "safe",
  });
  const [countdown, setCountdown] = useState(0);
  const [progress, setProgress] = useState(100);
  const [isConfirming, setIsConfirming] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize safety check-in timer
  useEffect(() => {
    if (!isActive) return;

    const now = new Date();
    const nextCheck = new Date(now.getTime() + checkInInterval * 60 * 1000);
    
    setSafetyStatus((prev) => ({
      ...prev,
      nextCheckIn: nextCheck,
      status: "safe",
    }));

    // Set up countdown
    countdownRef.current = setInterval(() => {
      setSafetyStatus((prev) => {
        if (!prev.nextCheckIn) return prev;
        
        const remaining = Math.max(0, prev.nextCheckIn.getTime() - Date.now());
        const remainingMinutes = Math.ceil(remaining / 60000);
        
        if (remaining === 0 && prev.status === "safe") {
          // Time to check in
          setShowCheckInModal(true);
          return {
            ...prev,
            status: "pending",
          };
        }
        
        return prev;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [isActive, checkInInterval]);

  // Handle missed check-ins
  useEffect(() => {
    if (safetyStatus.status !== "pending") return;

    // Give user 2 minutes to respond
    let timeout = 120;
    setCountdown(timeout);

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Missed check-in
          setSafetyStatus((s) => ({
            ...s,
            missedCheckIns: s.missedCheckIns + 1,
            status: "alert",
          }));
          
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [safetyStatus.status]);

  // Handle alert status (missed check-ins)
  useEffect(() => {
    if (safetyStatus.status !== "alert") return;

    // If missed 2 check-ins, trigger emergency
    if (safetyStatus.missedCheckIns >= 2) {
      setShowEmergencyConfirm(true);
    } else {
      toast.warning("فقدان التأكيد!", {
        description: "يرجى تأكيد أنك بخير",
        duration: 10000,
      });
      setShowCheckInModal(true);
    }
  }, [safetyStatus.status, safetyStatus.missedCheckIns]);

  const handleConfirmSafety = async () => {
    setIsConfirming(true);
    
    try {
      // Get user's current location if available
      let locationData = { latitude: 0, longitude: 0, locationName: 'تحقق أمان' };
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 5000,
            });
          });
          locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            locationName: 'تحقق أمان',
          };
        } catch {
          // Location not available, use default
        }
      }

      // Call the real API to save check-in
      const response = await fetch('/api/safety-checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'فشل في حفظ تحقق الأمان');
      }

      const now = new Date();
      const nextCheck = new Date(now.getTime() + checkInInterval * 60 * 1000);
      
      setSafetyStatus({
        lastCheckIn: now,
        nextCheckIn: nextCheck,
        missedCheckIns: 0,
        status: "safe",
      });
      
      setShowCheckInModal(false);
      
      toast.success("تم تأكيد الأمان!", {
        icon: <CheckCircle className="w-4 h-4 text-green-500" />,
      });
      
      onSafetyConfirm?.();
    } catch (error) {
      console.error('Error confirming safety:', error);
      toast.error("فشل في حفظ تحقق الأمان");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleEmergency = () => {
    setShowEmergencyConfirm(false);
    setSafetyStatus((prev) => ({ ...prev, status: "emergency" }));
    
    toast.error("تم إرسال تنبيه الطوارئ!", {
      duration: 10000,
    });
    
    // Vibrate
    if ("vibrate" in navigator) {
      navigator.vibrate([500, 100, 500, 100, 500]);
    }
    
    onEmergencyTrigger?.();
  };

  const getStatusColor = () => {
    switch (safetyStatus.status) {
      case "safe": return "text-green-600 bg-green-100";
      case "pending": return "text-yellow-600 bg-yellow-100";
      case "alert": return "text-orange-600 bg-orange-100";
      case "emergency": return "text-red-600 bg-red-100";
      default: return "text-green-600 bg-green-100";
    }
  };

  const getStatusLabel = () => {
    switch (safetyStatus.status) {
      case "safe": return "آمن";
      case "pending": return "في انتظار التأكيد";
      case "alert": return "تنبيه";
      case "emergency": return "طوارئ";
      default: return "آمن";
    }
  };

  return (
    <>
      {/* Safety Status Card */}
      <Card className={cn(
        "p-4 card-shadow transition-all overflow-hidden relative",
        safetyStatus.status === "alert" && "border-2 border-orange-500 animate-pulse",
        safetyStatus.status === "emergency" && "border-2 border-red-500"
      )}>
        {/* Animated background for alert status */}
        {safetyStatus.status === "alert" && (
          <div className="absolute inset-0 bg-orange-50/50" />
        )}
        
        <div className="flex items-center gap-4 relative z-10">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
            getStatusColor()
          )}>
            {safetyStatus.status === "safe" ? (
              <Heart className="w-6 h-6" />
            ) : safetyStatus.status === "pending" ? (
              <Clock className="w-6 h-6 animate-pulse" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold">حالة الأمان</span>
              <Badge className={cn("text-xs", getStatusColor())}>
                {getStatusLabel()}
              </Badge>
            </div>
            
            {safetyStatus.nextCheckIn && safetyStatus.status === "safe" && (
              <div className="text-sm text-muted-foreground mt-1">
                التأكيد القادم: {safetyStatus.nextCheckIn.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
              </div>
            )}
            
            {safetyStatus.status === "pending" && countdown > 0 && (
              <div className="text-sm text-yellow-600 mt-1">
                الوقت المتبقي: {countdown} ثانية
              </div>
            )}
          </div>
          
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl hover:shadow-md transition-all"
            onClick={() => setShowCheckInModal(true)}
          >
            <CheckCircle className="w-4 h-4 ml-1" />
            تأكيد
          </Button>
        </div>
        
        {/* Progress bar for safe status */}
        {safetyStatus.status === "safe" && safetyStatus.nextCheckIn && (
          <div className="mt-4 relative z-10">
            <Progress 
              value={Math.max(0, 100 - (safetyStatus.nextCheckIn.getTime() - Date.now()) / (checkInInterval * 60000) * 100)} 
              className="h-2"
            />
          </div>
        )}
        
        {/* Missed check-ins indicator */}
        {safetyStatus.missedCheckIns > 0 && (
          <div className="mt-2 flex items-center gap-2 text-sm text-orange-600 relative z-10">
            <AlertTriangle className="w-4 h-4" />
            <span>{safetyStatus.missedCheckIns} تأكيدات فائتة</span>
          </div>
        )}
      </Card>

      {/* Check-in Modal */}
      <Dialog open={showCheckInModal} onOpenChange={setShowCheckInModal}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">تأكيد الأمان</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <div className="relative w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="w-10 h-10 text-primary" />
                </div>
              </div>
            </div>
            
            <p className="text-center text-muted-foreground">
              {safetyStatus.status === "alert" 
                ? "لم يتم تأكيد أمانك! يرجى التأكيد الآن."
                : "هل أنت بخير؟ يرجى تأكيد أنك بأمان."
              }
            </p>
            
            {safetyStatus.status === "pending" && countdown > 0 && (
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{countdown}</div>
                <div className="text-sm text-muted-foreground">ثانية متبقية</div>
              </div>
            )}
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl hover:bg-muted transition-colors"
                onClick={() => setShowCheckInModal(false)}
              >
                لاحقاً
              </Button>
              <Button
                className="flex-1 rounded-xl bg-primary hover:shadow-lg transition-all"
                onClick={handleConfirmSafety}
                disabled={isConfirming}
              >
                {isConfirming ? (
                  <>
                    <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                    جاري...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 ml-2" />
                    أنا بخير
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Emergency Confirm Modal */}
      <Dialog open={showEmergencyConfirm} onOpenChange={setShowEmergencyConfirm}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-destructive">تنبيه الطوارئ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-destructive/20 animate-ping" />
                <div className="relative w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-destructive" />
                </div>
              </div>
            </div>
            
            <p className="text-center text-muted-foreground">
              لم يتم تأكيد أمانك مرتين. سيتم إرسال تنبيه طوارئ إلى جهات اتصالك.
            </p>
            
            <div className="flex items-center justify-center gap-2 p-3 bg-muted/50 rounded-xl">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-sm">{emergencyContacts.length} جهة اتصال</span>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl hover:bg-muted transition-colors"
                onClick={() => {
                  setShowEmergencyConfirm(false);
                  handleConfirmSafety();
                }}
              >
                <CheckCircle className="w-4 h-4 ml-2" />
                أنا بخير
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl hover:shadow-lg transition-all"
                onClick={handleEmergency}
              >
                <Phone className="w-4 h-4 ml-2" />
                طوارئ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Compact Safety Widget for displaying in other components
export function SafetyWidget({ 
  isActive = true, 
  onCheckIn 
}: { 
  isActive?: boolean; 
  onCheckIn?: () => void 
}) {
  const [status, setStatus] = useState<"safe" | "pending">("safe");
  const [lastCheckIn, setLastCheckIn] = useState<Date | null>(null);

  const handleCheckIn = () => {
    setLastCheckIn(new Date());
    setStatus("safe");
    onCheckIn?.();
  };

  return (
    <button
      onClick={handleCheckIn}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-full transition-all hover:shadow-md",
        status === "safe" 
          ? "bg-green-100 text-green-700 hover:bg-green-200" 
          : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
      )}
    >
      <div className={cn(
        "w-2 h-2 rounded-full",
        status === "safe" ? "bg-green-500" : "bg-yellow-500 animate-pulse"
      )} />
      <span className="text-sm font-medium">أنا بخير</span>
      <Heart className="w-4 h-4" />
    </button>
  );
}

// Safety Check-in Banner for displaying at the top of pages
export function SafetyBanner({
  isActive = true,
  checkInInterval = 5,
  onSafetyConfirm,
}: {
  isActive?: boolean;
  checkInInterval?: number;
  onSafetyConfirm?: () => void;
}) {
  const [showBanner, setShowBanner] = useState(false);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (!isActive) return;

    // Show banner after interval (simulated with 30 seconds for demo)
    const timer = setTimeout(() => {
      setShowBanner(true);
    }, checkInInterval * 60 * 1000);

    return () => clearTimeout(timer);
  }, [isActive, checkInInterval]);

  useEffect(() => {
    if (!showBanner) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showBanner]);

  const handleConfirm = () => {
    setShowBanner(false);
    setCountdown(30);
    onSafetyConfirm?.();
    toast.success("تم تأكيد الأمان!");
  };

  if (!showBanner) return null;

  return (
    <div className="bg-gradient-to-l from-yellow-500 to-orange-500 text-white px-4 py-3 animate-in slide-in-from-top duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Heart className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="font-medium">تأكيد الأمان</div>
            <div className="text-sm text-white/80">هل أنت بخير؟</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-lg font-bold">{countdown}</div>
            <div className="text-xs text-white/70">ثانية</div>
          </div>
          <Button
            size="sm"
            className="bg-white text-orange-600 hover:bg-white/90 rounded-xl"
            onClick={handleConfirm}
          >
            <CheckCircle className="w-4 h-4 ml-1" />
            أنا بخير
          </Button>
        </div>
      </div>
    </div>
  );
}
