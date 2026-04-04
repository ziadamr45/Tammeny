"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, MapPin, Phone, MessageSquare, Bell, Users, Clock, Sparkles, Home, Shield, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { DynamicMap } from "@/components/tamenny/map-component";
import { toArabicNumerals, formatArabicDate, formatArabicTime } from "@/lib/arabic-numerals";

export default function ArrivedSafePage() {
  const router = useRouter();
  const { isAuthenticated, authLoading, user } = useAuth();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [sendSMS, setSendSMS] = useState(true);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [emergencyContactsCount, setEmergencyContactsCount] = useState(0);
  const [arrivedHistory, setArrivedHistory] = useState<Array<{
    id: string;
    latitude: number;
    longitude: number;
    locationName: string | null;
    createdAt: Date;
  }>>([]);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Get current location
  useEffect(() => {
    if (!authChecked) return;
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          // Reverse geocode for location name
          reverseGeocode(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast.error("لم نتمكن من تحديد موقعك");
        },
        { enableHighAccuracy: true }
      );
    }
  }, [authLoading]);

  const authChecked = !authLoading && isAuthenticated;

  // Fetch emergency contacts count and history
  useEffect(() => {
    if (!authChecked) return;
    
    const fetchData = async () => {
      try {
        // Get contacts count
        const contactsRes = await fetch("/api/contacts");
        if (contactsRes.ok) {
          const contactsData = await contactsRes.json();
          const emergency = contactsData.contacts?.filter((c: { isEmergencyContact: boolean }) => c.isEmergencyContact) || [];
          setEmergencyContactsCount(emergency.length);
        }

        // Get history
        const historyRes = await fetch("/api/arrived-safe");
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setArrivedHistory(historyData.history || []);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    fetchData();
  }, [authChecked]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`
      );
      const data = await response.json();
      if (data.display_name) {
        setLocationName(data.display_name.split(",").slice(0, 2).join(", "));
      }
    } catch (error) {
      console.error("Reverse geocode error:", error);
    }
  };

  const handleArrivedSafe = async () => {
    if (!location) {
      toast.error("لم يتم تحديد موقعك بعد");
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmArrivedSafe = async () => {
    setIsLoading(true);
    setShowConfirmDialog(false);

    try {
      const response = await fetch("/api/arrived-safe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: location?.lat,
          longitude: location?.lng,
          locationName,
          sendSMS,
          sendWhatsApp,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        toast.success("تم إبلاغ جهات الاتصال الخاصة بك!");
        
        // Add to local history
        setArrivedHistory(prev => [{
          id: Date.now().toString(),
          latitude: location?.lat || 0,
          longitude: location?.lng || 0,
          locationName,
          createdAt: new Date(),
        }, ...prev]);
      } else {
        toast.error(data.error || "حدث خطأ");
      }
    } catch (error) {
      console.error("Arrived safe error:", error);
      toast.error("حدث خطأ أثناء العملية");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">جاري التحقق...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-primary/5 pb-24">
      {/* Header */}
      <div className="bg-primary text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => router.push("/")}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">وصلت سالم</h1>
            <p className="text-white/80 text-sm">أبلغ أهلك بوصولك بضغطة واحدة</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Success State */}
        {isSuccess ? (
          <Card className="p-8 text-center animate-scale-in">
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-green-600">تم بنجاح!</h2>
              <p className="text-muted-foreground">
                تم إبلاغ {toArabicNumerals(emergencyContactsCount.toString())} جهة اتصال بوصولك
              </p>
              <Badge variant="secondary" className="text-sm">
                <MapPin className="w-4 h-4 ml-1" />
                {locationName || "الموقع الحالي"}
              </Badge>
              <Button
                className="mt-4 bg-primary hover:bg-primary/90"
                onClick={() => router.push("/")}
              >
                العودة للرئيسية
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {/* Map */}
            <Card className="overflow-hidden">
              <div className="h-48 relative">
                {location ? (
                  <DynamicMap
                    center={[location.lat, location.lng]}
                    zoom={15}
                    className="h-full w-full"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-muted">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-muted-foreground">جاري تحديد الموقع...</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">موقعك الحالي</p>
                    <p className="text-sm text-muted-foreground">
                      {locationName || "جاري التحديد..."}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Big Button */}
            <Card className="p-6">
              <button
                onClick={handleArrivedSafe}
                disabled={isLoading || !location}
                className="w-full py-8 px-6 bg-gradient-to-l from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl font-bold text-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-3"
              >
                {isLoading ? (
                  <>
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري الإرسال...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-12 h-12" />
                    <span>وصلت سالم</span>
                    <span className="text-sm font-normal opacity-80">
                      اضغط لإبلاغ جهات الاتصال
                    </span>
                  </>
                )}
              </button>
            </Card>

            {/* Options */}
            <Card className="p-4">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                خيارات الإشعار
              </h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary" />
                    <span>إرسال SMS</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={sendSMS}
                    onChange={(e) => setSendSMS(e.target.checked)}
                    className="w-5 h-5 accent-primary"
                  />
                </label>
                <label className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-green-500" />
                    <span>إرسال واتساب</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={sendWhatsApp}
                    onChange={(e) => setSendWhatsApp(e.target.checked)}
                    className="w-5 h-5 accent-primary"
                  />
                </label>
              </div>
            </Card>

            {/* Emergency Contacts Info */}
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-bold">جهات الاتصال الطارئة</p>
                  <p className="text-sm text-muted-foreground">
                    سيتم إبلاغ {toArabicNumerals(emergencyContactsCount.toString())} جهة اتصال
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mr-auto"
                  onClick={() => router.push("/emergency-contacts")}
                >
                  تعديل
                </Button>
              </div>
            </Card>

            {/* History */}
            {arrivedHistory.length > 0 && (
              <Card className="p-4">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  سجل الوصول
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {arrivedHistory.slice(0, 5).map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 bg-muted rounded-lg"
                    >
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">
                          {item.locationName || "موقع غير محدد"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatArabicDate(new Date(item.createdAt))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}

        {/* Features */}
        <Card className="p-4">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            لماذا وصلت سالم؟
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="text-sm">أمان أسرتك</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-sm">سرعة الإبلاغ</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <Phone className="w-5 h-5 text-purple-500" />
              <span className="text-sm">رسائل SMS</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <MessageSquare className="w-5 h-5 text-green-500" />
              <span className="text-sm">واتساب</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">تأكيد الوصول</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-center text-muted-foreground">
              سيتم إرسال إشعار لـ {toArabicNumerals(emergencyContactsCount.toString())} جهة اتصال
            </p>
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowConfirmDialog(false)}
              >
                إلغاء
              </Button>
              <Button
                className="flex-1 bg-green-500 hover:bg-green-600"
                onClick={confirmArrivedSafe}
              >
                تأكيد
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
