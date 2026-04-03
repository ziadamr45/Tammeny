"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Bell,
  Moon,
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
} from "lucide-react";
import { BottomNav, Header } from "@/components/tamenny/bottom-nav";
import { toast } from "sonner";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [ghostMode, setGhostMode] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState(true);

  const handleLogout = () => {
    toast.success("تم تسجيل الخروج بنجاح");
  };

  return (
    <main className="min-h-screen bg-background pb-20">
      <Header />

      <div className="pt-16 px-4 space-y-6">
        {/* User Profile Card */}
        <Card className="p-4 card-shadow">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                أ
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="font-bold text-lg">أحمد محمد</h2>
              <p className="text-sm text-muted-foreground">ahmed@example.com</p>
              <Badge className="mt-1 bg-primary/10 text-primary">
                <Lock className="w-3 h-3 ml-1" />
                AES-256 مشفّر
              </Badge>
            </div>
            <Button variant="ghost" size="icon">
              <User className="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 card-shadow hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-medium text-sm">أضف أماناً!</div>
                <div className="text-xs text-muted-foreground">10 أصدقاء</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 card-shadow hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-medium text-sm">أضف خصوصية!</div>
                <div className="text-xs text-muted-foreground">وضع خفي</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Settings Sections */}
        <Card className="card-shadow divide-y divide-border">
          <h3 className="font-bold p-4">إعدادات الخصوصية</h3>

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
          
          <SettingsToggle
            icon={<Moon className="w-5 h-5" />}
            title="الوضع الليلي"
            description="تغيير مظهر التطبيق"
            checked={darkMode}
            onChange={setDarkMode}
          />
          
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
          className="w-full h-12 text-destructive border-destructive/50 hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 ml-2" />
          تسجيل الخروج
        </Button>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pb-4">
          <p>طمنّي © 2024</p>
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
