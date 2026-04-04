"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useTheme } from "next-themes";
import {
  Shield,
  Bell,
  Moon,
  Sun,
  Lock,
  User,
  ChevronLeft,
  LogOut,
  ShieldCheck,
  Eye,
  EyeOff,
  MapPin,
  Smartphone,
  Globe,
  HelpCircle,
  Info,
  History,
  Settings,
  AlertTriangle,
  Battery,
  BatteryLow,
  Zap,
  BatteryCharging,
  Gauge,
  Clock,
  RefreshCw,
  Loader2,
  BarChart3,
  Check,
} from "lucide-react";
import { BottomNav, Header } from "@/components/tamenny/bottom-nav";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/contexts/language-context";
import type { Language } from "@/lib/i18n";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const { language, setLanguage, t, direction } = useLanguage();
  const [notifications, setNotifications] = useState(true);
  const [ghostMode, setGhostMode] = useState(false);
  const [stealthMode, setStealthMode] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState(true);

  // Load stealth mode from user settings
  useEffect(() => {
    if (user?.id) {
      const fetchUserSettings = async () => {
        try {
          const response = await fetch('/api/auth/me');
          const data = await response.json();
          if (data.success && data.user) {
            setStealthMode(data.user.stealthMode || false);
            setNotifications(data.user.notificationsEnabled ?? true);
          }
        } catch (error) {
          console.error('Error fetching user settings:', error);
        }
      };
      fetchUserSettings();
    }
  }, [user?.id]);

  // Handle stealth mode toggle
  const handleStealthModeToggle = async (enabled: boolean) => {
    setStealthMode(enabled);
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stealthMode: enabled }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(language === 'ar' 
          ? (enabled ? "تم تفعيل وضع الصمت" : "تم إيقاف وضع الصمت")
          : (enabled ? "Stealth mode enabled" : "Stealth mode disabled"));
      } else {
        setStealthMode(!enabled);
        toast.error(language === 'ar' ? "فشل في تحديث الإعدادات" : "Failed to update settings");
      }
    } catch (error) {
      setStealthMode(!enabled);
      toast.error(language === 'ar' ? "فشل في تحديث الإعدادات" : "Failed to update settings");
    }
  };

  // Handle notifications toggle
  const handleNotificationsToggle = async (enabled: boolean) => {
    setNotifications(enabled);
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationsEnabled: enabled }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(language === 'ar'
          ? (enabled ? "تم تفعيل الإشعارات" : "تم إيقاف الإشعارات")
          : (enabled ? "Notifications enabled" : "Notifications disabled"));
      } else {
        setNotifications(!enabled);
      }
    } catch (error) {
      setNotifications(!enabled);
    }
  };

  const { theme, setTheme } = useTheme();
  
  // Battery saver state
  const [batterySaverEnabled, setBatterySaverEnabled] = useState(false);
  const [autoEnableLowBattery, setAutoEnableLowBattery] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Calculate estimated savings based on settings
  const calculatedSavings = useMemo(() => {
    let savings = 30;
    if (locationAccuracy) savings -= 5;
    if (notifications) savings -= 2;
    return Math.max(15, savings);
  }, [locationAccuracy, notifications]);

  // Get battery level
  useEffect(() => {
    const getBattery = async () => {
      try {
        if ('getBattery' in navigator) {
          const battery = await (navigator as Navigator & { getBattery: () => Promise<{ level: number }> }).getBattery();
          setBatteryLevel(Math.round(battery.level * 100));
        }
      } catch {
        setBatteryLevel(null);
      }
    };
    getBattery();
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success(language === 'ar' ? "تم تسجيل الخروج بنجاح" : "Logged out successfully");
    router.push("/login");
  };

  const handleThemeChange = async (isDark: boolean) => {
    setTheme(isDark ? "dark" : "light");
    
    // Save to database
    try {
      await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ darkMode: isDark }),
      });
    } catch (error) {
      console.log('Could not save theme preference');
    }
    
    toast.success(language === 'ar'
      ? (isDark ? "تم تفعيل الوضع الداكن" : "تم تفعيل الوضع الفاتح")
      : (isDark ? "Dark mode enabled" : "Light mode enabled"));
  };

  const handleBatterySaverToggle = async (enabled: boolean) => {
    setBatterySaverEnabled(enabled);
    
    // Save to database
    try {
      await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batterySaver: enabled }),
      });
    } catch (error) {
      console.log('Could not save battery saver preference');
    }
    
    if (enabled) {
      toast.success(language === 'ar' ? "تم تفعيل وضع توفير البطارية" : "Battery saver enabled");
    } else {
      toast.info(language === 'ar' ? "تم إيقاف وضع توفير البطارية" : "Battery saver disabled");
    }
  };

  const handleLanguageChange = async (lang: Language) => {
    await setLanguage(lang);
    toast.success(lang === 'ar' ? "تم تغيير اللغة" : "Language changed");
  };

  // Auth Loading State
  if (authLoading) {
    return (
      <main className="min-h-screen bg-background pb-20">
        <Header />
        <div className="pt-16 px-4 flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">{t.common.loading}</p>
        </div>
      </main>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      <Header />

      <div className="pt-16 px-4 space-y-6">
        {/* User Profile Card */}
        <Link href="/profile">
          <Card className="p-4 card-shadow hover:shadow-lg transition-all cursor-pointer hover:-translate-y-0.5 border border-transparent hover:border-primary/20">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 border-2 border-primary/20">
                <AvatarFallback className="bg-gradient-to-br from-primary to-teal-dark text-primary-foreground text-xl">
                  {user?.name?.[0] || (language === 'ar' ? "أ" : "U")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="font-bold text-lg">{user?.name || (language === 'ar' ? "المستخدم" : "User")}</h2>
                <p className="text-sm text-muted-foreground">{user?.email || ""}</p>
                <Badge className="mt-1 bg-primary/10 text-primary gap-1">
                  <Lock className="w-3 h-3" />
                  {language === 'ar' ? "AES-256 مشفّر" : "AES-256 Encrypted"}
                </Badge>
              </div>
              <ChevronLeft className={cn("w-5 h-5 text-muted-foreground", direction === 'ltr' && "rotate-180")} />
            </div>
          </Card>
        </Link>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/emergency-contacts">
            <Card className="p-4 card-shadow hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer border border-transparent hover:border-red-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">{language === 'ar' ? "جهات الطوارئ" : "Emergency"}</div>
                  <div className="text-xs text-muted-foreground">SOS</div>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/history">
            <Card className="p-4 card-shadow hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer border border-transparent hover:border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <History className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="font-medium text-sm">{t.history.title}</div>
                  <div className="text-xs text-muted-foreground">{language === 'ar' ? "عرض التاريخ" : "View history"}</div>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/notifications">
            <Card className="p-4 card-shadow hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer border border-transparent hover:border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">{t.settings.notifications}</div>
                  <div className="text-xs text-muted-foreground">{language === 'ar' ? "المركز" : "Center"}</div>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/safe-zones">
            <Card className="p-4 card-shadow hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer border border-transparent hover:border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="font-medium text-sm">{t.settings.safeZones}</div>
                  <div className="text-xs text-muted-foreground">{language === 'ar' ? "إدارة" : "Manage"}</div>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Language & Theme Card */}
        <Card className="card-shadow divide-y divide-border">
          <h3 className="font-bold p-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            {language === 'ar' ? "المظهر واللغة" : "Appearance & Language"}
          </h3>

          {/* Language Selector */}
          <div className="p-4">
            <div className="flex items-center gap-4 mb-3">
              <div className="text-primary"><Globe className="w-5 h-5" /></div>
              <div className="flex-1">
                <div className="font-medium">{t.settings.language}</div>
                <div className="text-sm text-muted-foreground">
                  {language === 'ar' ? "اختر لغة التطبيق" : "Choose app language"}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleLanguageChange('ar')}
                className={cn(
                  "flex-1 p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2",
                  language === 'ar'
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                {language === 'ar' && <Check className="w-4 h-4" />}
                <span className="font-medium">العربية</span>
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={cn(
                  "flex-1 p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2",
                  language === 'en'
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                {language === 'en' && <Check className="w-4 h-4" />}
                <span className="font-medium">English</span>
              </button>
            </div>
          </div>

          {/* Dark Mode Toggle */}
          <div className="flex items-center gap-4 p-4">
            <div className="text-primary">
              <Moon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-medium">{t.settings.darkMode}</div>
              <div className="text-sm text-muted-foreground">{t.settings.darkModeDesc}</div>
            </div>
            <button
              onClick={() => handleThemeChange(theme !== "dark")}
              className={cn(
                "w-14 h-8 rounded-full p-1 transition-all duration-300",
                theme === "dark" ? "bg-primary" : "bg-muted"
              )}
            >
              <div
                className={cn(
                  "w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center",
                  direction === 'rtl' 
                    ? (theme === "dark" ? "translate-x-[-100%]" : "")
                    : (theme === "dark" ? "translate-x-6" : "")
                )}
              >
                <Sun className="w-3 h-3 text-yellow-500 dark:hidden" />
                <Moon className="w-3 h-3 text-primary hidden dark:block" />
              </div>
            </button>
          </div>
        </Card>

        {/* Battery Saver Section */}
        <Card className="card-shadow overflow-hidden">
          <div className={cn(
            "p-4 transition-colors",
            batterySaverEnabled ? "bg-green-50 dark:bg-green-900/20" : "bg-gradient-to-l from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20"
          )}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  batterySaverEnabled
                    ? "bg-green-200 dark:bg-green-800"
                    : "bg-amber-200 dark:bg-amber-800"
                )}>
                  {batterySaverEnabled ? (
                    <BatteryCharging className="w-6 h-6 text-green-600 dark:text-green-300" />
                  ) : (
                    <Battery className="w-6 h-6 text-amber-600 dark:text-amber-300" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold">{t.settings.batterySaver}</h3>
                  <p className="text-sm text-muted-foreground">
                    {batterySaverEnabled 
                      ? (language === 'ar' ? "نشط - تقليل استهلاك GPS" : "Active - Reducing GPS usage")
                      : (language === 'ar' ? "يوفر حتى 30% من البطارية" : "Save up to 30% battery")}
                  </p>
                </div>
              </div>
              <Switch
                checked={batterySaverEnabled}
                onCheckedChange={handleBatterySaverToggle}
              />
            </div>

            {batteryLevel !== null && (
              <div className="mb-3 p-3 rounded-lg bg-white/50 dark:bg-black/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{language === 'ar' ? "مستوى البطارية" : "Battery Level"}</span>
                  <span className={cn(
                    "text-sm font-bold",
                    batteryLevel < 20 ? "text-red-500" : batteryLevel < 50 ? "text-yellow-500" : "text-green-500"
                  )}>
                    {batteryLevel}%
                  </span>
                </div>
                <Progress
                  value={batteryLevel}
                  className={cn(
                    "h-2",
                    batteryLevel < 20 ? "[&>div]:bg-red-500" : batteryLevel < 50 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500"
                  )}
                />
              </div>
            )}

            {batterySaverEnabled && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-green-100/50 dark:bg-green-800/30">
                <Zap className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-300">
                  {language === 'ar' 
                    ? `التوفير المتوقع: ~${calculatedSavings}% من البطارية`
                    : `Estimated savings: ~${calculatedSavings}% battery`}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Privacy Settings */}
        <Card className="card-shadow divide-y divide-border">
          <h3 className="font-bold p-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            {language === 'ar' ? "إعدادات الخصوصية" : "Privacy Settings"}
          </h3>
          
          <div className="flex items-center gap-4 p-4">
            <div className="text-primary"><Bell className="w-5 h-5" /></div>
            <div className="flex-1">
              <div className="font-medium">{t.settings.notifications}</div>
              <div className="text-sm text-muted-foreground">
                {language === 'ar' ? "تلقي تنبيهات الوصول والقرب" : "Receive arrival and proximity alerts"}
              </div>
            </div>
            <Switch checked={notifications} onCheckedChange={handleNotificationsToggle} />
          </div>
          
          {/* Stealth Mode Toggle */}
          <div className="flex items-center gap-4 p-4">
            <div className={cn("transition-colors", stealthMode ? "text-purple-500" : "text-primary")}>
              {stealthMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <div className="font-medium flex items-center gap-2">
                {t.settings.stealthMode}
                {stealthMode && (
                  <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-xs">
                    {language === 'ar' ? "نشط" : "Active"}
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">{t.settings.stealthModeDesc}</div>
            </div>
            <Switch checked={stealthMode} onCheckedChange={handleStealthModeToggle} />
          </div>
        </Card>

        {/* More Settings */}
        <Card className="card-shadow divide-y divide-border">
          <h3 className="font-bold p-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            {t.settings.about}
          </h3>

          <Link href="/help">
            <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="text-primary"><HelpCircle className="w-5 h-5" /></div>
              <div className="flex-1">
                <div className="font-medium">{t.settings.help}</div>
                <div className="text-sm text-muted-foreground">{t.settings.faq}</div>
              </div>
              <ChevronLeft className={cn("w-5 h-5 text-muted-foreground", direction === 'ltr' && "rotate-180")} />
            </div>
          </Link>

          <Link href="/terms">
            <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="text-primary"><Shield className="w-5 h-5" /></div>
              <div className="flex-1">
                <div className="font-medium">{t.settings.termsOfService}</div>
              </div>
              <ChevronLeft className={cn("w-5 h-5 text-muted-foreground", direction === 'ltr' && "rotate-180")} />
            </div>
          </Link>

          <Link href="/privacy">
            <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="text-primary"><Lock className="w-5 h-5" /></div>
              <div className="flex-1">
                <div className="font-medium">{t.settings.privacyPolicy}</div>
              </div>
              <ChevronLeft className={cn("w-5 h-5 text-muted-foreground", direction === 'ltr' && "rotate-180")} />
            </div>
          </Link>

          <Link href="/compare">
            <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="text-primary"><BarChart3 className="w-5 h-5" /></div>
              <div className="flex-1">
                <div className="font-medium">{t.settings.whyTamenny}</div>
                <div className="text-sm text-muted-foreground">
                  {language === 'ar' ? "مقارنة مع التطبيقات الأخرى" : "Compare with other apps"}
                </div>
              </div>
              <ChevronLeft className={cn("w-5 h-5 text-muted-foreground", direction === 'ltr' && "rotate-180")} />
            </div>
          </Link>

          <div
            className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => toast.info("Tamenny v1.0.0")}
          >
            <div className="text-primary"><Info className="w-5 h-5" /></div>
            <div className="flex-1">
              <div className="font-medium">{language === 'ar' ? "حول التطبيق" : "About App"}</div>
              <div className="text-sm text-muted-foreground">{t.settings.version} 1.0.0</div>
            </div>
          </div>
        </Card>

        {/* Logout Button */}
        <Button
          variant="outline"
          className="w-full h-12 text-destructive border-destructive/50 hover:bg-destructive/10 rounded-xl"
          onClick={handleLogout}
        >
          <LogOut className={cn("w-5 h-5", direction === 'rtl' ? 'ml-2' : 'mr-2')} />
          {t.settings.logout}
        </Button>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pb-4">
          <p>{t.settings.copyright}</p>
          <p className="mt-1">{language === 'ar' ? "صُنع بـ ❤️ في مصر" : "Made with ❤️ in Egypt"}</p>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}

// Import Palette icon
import { Palette } from "lucide-react";
