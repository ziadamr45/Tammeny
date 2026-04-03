"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRight,
  Bell,
  BellRing,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Heart,
  Navigation,
  Shield,
  Settings,
  Trash2,
  Check,
  Eye,
  Volume2,
  VolumeX,
  Smartphone,
  Mail,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

interface Notification {
  id: string;
  type: "arrival" | "proximity" | "safety" | "share" | "emergency";
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: React.ReactNode;
  color: string;
}

const NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "arrival",
    title: "وصل أحمد",
    message: "وصل أحمد إلى المكتب بأمان",
    time: "منذ ٥ دقائق",
    read: false,
    icon: <CheckCircle className="w-5 h-5" />,
    color: "bg-green-100 text-green-600",
  },
  {
    id: "2",
    type: "proximity",
    title: "قريب من الهدف",
    message: "سارة على بعد ٥٠٠ متر من الوجهة",
    time: "منذ ١٥ دقيقة",
    read: false,
    icon: <Navigation className="w-5 h-5" />,
    color: "bg-yellow-100 text-yellow-600",
  },
  {
    id: "3",
    type: "share",
    title: "مشاركة جديدة",
    message: "محمد بدأ مشاركة موقعه معك",
    time: "منذ ساعة",
    read: true,
    icon: <MapPin className="w-5 h-5" />,
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: "4",
    type: "safety",
    title: "تأكيد الأمان",
    message: "تم تأكيد وصول العائلة بسلام",
    time: "منذ ٣ ساعات",
    read: true,
    icon: <Heart className="w-5 h-5" />,
    color: "bg-pink-100 text-pink-600",
  },
  {
    id: "5",
    type: "emergency",
    title: "تنبيه طوارئ",
    message: "تم إرسال تنبيه طوارئ من أحمد",
    time: "أمس",
    read: true,
    icon: <AlertTriangle className="w-5 h-5" />,
    color: "bg-red-100 text-red-600",
  },
];

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [settings, setSettings] = useState({
    arrivals: true,
    proximity: true,
    safety: true,
    sounds: true,
    vibration: true,
    push: true,
    email: false,
    sms: false,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("تم تحديد جميع الإشعارات كمقروءة");
  };

  const handleClearAll = () => {
    setNotifications([]);
    toast.success("تم مسح جميع الإشعارات");
  };

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    toast.success(value ? "تم التفعيل" : "تم الإيقاف");
  };

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-card/95 backdrop-blur-lg border-b border-border z-50">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">الإشعارات</h1>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-sm text-primary font-medium"
            >
              تحديد الكل كمقروء
            </button>
          )}
          {unreadCount === 0 && notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-sm text-destructive font-medium"
            >
              مسح الكل
            </button>
          )}
        </div>
      </header>

      <div className="px-4 py-4">
        {/* Auth Loading State */}
        {authLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        )}

        {/* Content - only show when authenticated */}
        {!authLoading && isAuthenticated && (
          <Tabs defaultValue="notifications" className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-4">
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="w-4 h-4" />
                الإشعارات
                {unreadCount > 0 && (
                  <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
                    {unreadCount}
                  </Badge>
                )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              الإعدادات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-4">
            {notifications.length === 0 ? (
              <Card className="p-8 text-center card-shadow">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <Bell className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-bold text-lg mb-2">لا توجد إشعارات</h3>
                <p className="text-muted-foreground text-sm">
                  ستظهر الإشعارات هنا عندما يحدث شيء جديد
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={cn(
                      "p-4 card-shadow cursor-pointer hover:shadow-lg transition-all",
                      !notification.read && "border-r-4 border-r-primary"
                    )}
                    onClick={() => {
                      setNotifications((prev) =>
                        prev.map((n) =>
                          n.id === notification.id ? { ...n, read: true } : n
                        )
                      );
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          notification.color
                        )}
                      >
                        {notification.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{notification.title}</h4>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {notification.message}
                        </p>
                        <span className="text-xs text-muted-foreground mt-1 block">
                          {notification.time}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            {/* Notification Types */}
            <Card className="p-4 card-shadow">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <BellRing className="w-5 h-5 text-primary" />
                أنواع الإشعارات
              </h3>
              <div className="space-y-4">
                <NotificationSetting
                  icon={<CheckCircle className="w-5 h-5 text-green-600" />}
                  title="تنبيهات الوصول"
                  description="عند وصول جهة اتصال للوجهة"
                  checked={settings.arrivals}
                  onChange={(val) => handleSettingChange("arrivals", val)}
                />
                <NotificationSetting
                  icon={<Navigation className="w-5 h-5 text-yellow-600" />}
                  title="تنبيهات القرب"
                  description="عند الاقتراب من الوجهة (٥٠٠ متر)"
                  checked={settings.proximity}
                  onChange={(val) => handleSettingChange("proximity", val)}
                />
                <NotificationSetting
                  icon={<Heart className="w-5 h-5 text-pink-600" />}
                  title="تأكيد الأمان"
                  description="طلب تأكيد الحالة أثناء الرحلة"
                  checked={settings.safety}
                  onChange={(val) => handleSettingChange("safety", val)}
                />
              </div>
            </Card>

            {/* Alert Settings */}
            <Card className="p-4 card-shadow">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-primary" />
                إعدادات التنبيه
              </h3>
              <div className="space-y-4">
                <NotificationSetting
                  icon={<Volume2 className="w-5 h-5 text-blue-600" />}
                  title="الأصوات"
                  description="تشغيل صوت عند الاستلام"
                  checked={settings.sounds}
                  onChange={(val) => handleSettingChange("sounds", val)}
                />
                <NotificationSetting
                  icon={<Smartphone className="w-5 h-5 text-purple-600" />}
                  title="الاهتزاز"
                  description="اهتزاز الجهاز عند التنبيه"
                  checked={settings.vibration}
                  onChange={(val) => handleSettingChange("vibration", val)}
                />
              </div>
            </Card>

            {/* Delivery Methods */}
            <Card className="p-4 card-shadow">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                طرق الإرسال
              </h3>
              <div className="space-y-4">
                <NotificationSetting
                  icon={<Bell className="w-5 h-5 text-primary" />}
                  title="الإشعارات الفورية"
                  description="دفع الإشعارات للتطبيق"
                  checked={settings.push}
                  onChange={(val) => handleSettingChange("push", val)}
                />
                <NotificationSetting
                  icon={<Mail className="w-5 h-5 text-orange-600" />}
                  title="البريد الإلكتروني"
                  description="إرسال ملخص يومي بالإشعارات"
                  checked={settings.email}
                  onChange={(val) => handleSettingChange("email", val)}
                />
                <NotificationSetting
                  icon={<MessageCircle className="w-5 h-5 text-green-600" />}
                  title="الرسائل النصية"
                  description="إرسال تنبيهات الطوارئ عبر SMS"
                  checked={settings.sms}
                  onChange={(val) => handleSettingChange("sms", val)}
                />
              </div>
            </Card>

            {/* Quiet Hours */}
            <Card className="p-4 card-shadow">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                ساعات الهدوء
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                لن يتم إرسال إشعارات غير عاجلة خلال هذه الفترة
              </p>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground">من</label>
                  <div className="text-xl font-bold mt-1">١٠:٠٠ م</div>
                </div>
                <div className="w-px bg-border" />
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground">إلى</label>
                  <div className="text-xl font-bold mt-1">٧:٠٠ ص</div>
                </div>
                <Button variant="outline" className="self-end rounded-xl">
                  تعديل
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
        )}
      </div>
    </main>
  );
}

function NotificationSetting({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
