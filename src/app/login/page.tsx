"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Shield, Database, RefreshCw, HeadphonesIcon } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { LogoInline } from "@/components/tamenny/logo";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error("جميع الحقول مطلوبة");
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "حدث خطأ أثناء تسجيل الدخول");
      }

      toast.success("مرحباً بك!");
      router.push("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8F9FA] dark:bg-background flex flex-col items-center py-8 px-4">
      {/* Customer Service Button - Top Right */}
      <div className="w-full max-w-md flex justify-start mb-4">
        <Link href="/help">
          <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-primary">
            <HeadphonesIcon className="w-5 h-5" />
            <span className="text-sm">خدمة العملاء</span>
          </Button>
        </Link>
      </div>

      {/* Logo Section */}
      <div className="flex flex-col items-center mb-6">
        <LogoInline size="lg" showText />
      </div>

      {/* Form Card */}
      <Card className="w-full max-w-md p-6 shadow-lg border-0 bg-white dark:bg-card rounded-2xl">
        {/* Title */}
        <h1 className="text-2xl font-bold text-center mb-2 text-foreground">تسجيل الدخول</h1>
        <p className="text-muted-foreground text-sm text-center mb-6 leading-relaxed">
          سجل دخولك للوصول إلى حسابك والاستمتاع بجميع المميزات
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-foreground">البريد الإلكتروني</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pr-12 h-14 rounded-xl bg-[#E9ECEF] dark:bg-secondary border-0 text-base placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/50"
                dir="ltr"
              />
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold text-foreground">كلمة المرور</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pr-12 pl-12 h-14 rounded-xl bg-[#E9ECEF] dark:bg-secondary border-0 text-base placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/50"
              />
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="text-left">
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:underline font-medium"
            >
              نسيت كلمة المرور؟
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-14 text-lg font-bold rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all"
            disabled={loading}
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                تسجيل الدخول
                <ArrowLeft className="w-5 h-5 mr-2" />
              </>
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-muted-foreground text-sm font-medium">أو</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Register Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-14 text-lg font-semibold rounded-xl border-2 border-primary text-primary hover:bg-primary/5"
          onClick={() => router.push("/register")}
        >
          إنشاء حساب جديد
        </Button>

        {/* Terms Text */}
        <p className="text-center text-xs text-muted-foreground mt-6 leading-relaxed">
          من خلال تسجيل دخولك، فإنك توافق على{" "}
          <Link href="/terms" className="text-primary font-medium hover:underline">
            شروط الاستخدام
          </Link>
          {" "}و{" "}
          <Link href="/privacy" className="text-primary font-medium hover:underline">
            سياسة الخصوصية
          </Link>
          {" "}لـ طمنّي
        </p>
      </Card>

      {/* Bottom Features */}
      <div className="flex justify-center gap-8 mt-8 w-full max-w-md">
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground font-medium">اتصال آمن</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Database className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground font-medium">حماية بيانات</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground font-medium">تزامن فوري</span>
        </div>
      </div>
    </main>
  );
}
