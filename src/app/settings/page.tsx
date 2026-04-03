"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
  MapPin,
  Smartphone,
  Globe,
  HelpCircle,
  Info,
  History,
  Palette,
  Settings,
  AlertTriangle,
} from "lucide-react";
import { BottomNav, Header } from "@/components/tamenny/bottom-nav";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [ghostMode, setGhostMode] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState(true);
  const { theme, setTheme } = useTheme();

  const handleLogout = () => {
    toast.success("تم تسجيل الخروج بنجاح");
  };

  const handleThemeChange = (isDark: boolean) => {
    setTheme(isDark ? "dark" : "light");
    toast.success(isDark ? "تم تفعيل الوضع الليلي" : "تم تفعيل الوضع النهاري");
  };

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
                  أ
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="font-bold text-lg">أحمد محمد</h2>
                <p className="text-sm text-muted-foreground">ahmed@example.com</p>
                <Badge className="mt-1 bg-primary/10 text-primary gap-1">
                  <Lock className="w-3 h-3" />
                  AES-256 مشفّر
                </Badge>
              </div>
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </div>
          </Card>
        </Link>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/emergency-contacts">
            <Card className="p-4 card-shadow hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer border border-transparent hover:border-red-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">جهات الطوارئ</div>
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
                  <div className="font-medium text-sm">سجل الرحلات</div>
                  <div className="text-xs text-muted-foreground">عرض التاريخ</div>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/notifications">
            <Card className="p-4 card-shadow hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer border border-transparent hover:border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">الإشعارات</div>
                  <div className="text-xs text-muted-foreground">المركز</div>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/contacts">
            <Card className="p-4 card-shadow hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer border border-transparent hover:border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-sm">جهات الاتصال</div>
                  <div className="text-xs text-muted-foreground">إدارة</div>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Settings Sections */}
        <Card className="card-shadow divide-y divide-border">
          <h3 className="font-bold p-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            إعدادات الخصوصية
          </h3>

          <SettingsItem
            icon={<Shield className="w-5 h-5" />}
            title="الحماية والخصوصية"
            description="إدارة إعدادات الأمان"
            onClick={() => toast.info("قريباً")}
          />
          
          <SettingsToggle
            icon={<Bell className="w-5 h-5" />}
            title="الإشعارات"
            description="تلقي تنبيهات الوصول والقرب"
            checked={notifications}
            onChange={setNotifications}
          />
          
          {/* Dark Mode Toggle */}
          <div className="flex items-center gap-4 p-4">
            <div className="text-primary">
              <Moon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-medium">الوضع الليلي</div>
              <div className="text-sm text-muted-foreground">
                تغيير مظهر التطبيق
              </div>
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
                  "w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center dark:translate-x-6",
                )}
              >
                <Sun className="w-3 h-3 text-yellow-500 dark:hidden" />
                <Moon className="w-3 h-3 text-primary hidden dark:block" />
              </div>
            </button>
          </div>
          
          <SettingsToggle
            icon={<Eye className="w-5 h-5" />}
            title="الوضع الخفي"
            description="إخفاء الموقع الدقيق"
            checked={ghostMode}
            onChange={setGhostMode}
          />
          
          <SettingsToggle
            icon={<MapPin className="w-5 h-5" />}
            title="دقة الموقع العالية"
            description="استخدام GPS عالي الدقة"
            checked={locationAccuracy}
            onChange={setLocationAccuracy}
          />
        </Card>

        {/* More Settings */}
        <Card className="card-shadow divide-y divide-border">
          <h3 className="font-bold p-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            إعدادات أخرى
          </h3>

          <SettingsItem
            icon={<Smartphone className="w-5 h-5" />}
            title="إعدادات الجهاز"
            description="إدارة الأجهزة المرتبطة"
            onClick={() => toast.info("قريباً")}
          />
          
          <SettingsItem
            icon={<Globe className="w-5 h-5" />}
            title="اللغة"
            description="العربية"
            onClick={() => toast.info("قريباً")}
          />
          
          <SettingsItem
            icon={<HelpCircle className="w-5 h-5" />}
            title="المساعدة"
            description="الأسئلة الشائعة والدعم"
            onClick={() => toast.info("قريباً")}
          />
          
          <SettingsItem
            icon={<Info className="w-5 h-5" />}
            title="حول التطبيق"
            description="الإصدار 1.0.0"
            onClick={() => toast.info("طمنّي v1.0.0")}
          />
        </Card>

        {/* Logout Button */}
        <Button
          variant="outline"
          className="w-full h-12 text-destructive border-destructive/50 hover:bg-destructive/10 rounded-xl"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 ml-2" />
          تسجيل الخروج
        </Button>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pb-4">
          <p>طمنّي © 2025</p>
          <p className="mt-1">صُنع بـ ❤️ في مصر</p>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}

function SettingsItem({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
}) {
  return (
    <div
      className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onClick}
    >
      <div className="text-primary">{icon}</div>
      <div className="flex-1">
        <div className="font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      <ChevronLeft className="w-5 h-5 text-muted-foreground" />
    </div>
  );
}

function SettingsToggle({
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
    <div className="flex items-center gap-4 p-4">
      <div className="text-primary">{icon}</div>
      <div className="flex-1">
        <div className="font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
