"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Mail, Lock, Eye, EyeOff, ArrowLeft, Zap, HeadphonesIcon } from "lucide-react";
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
    <main className="min-h-screen bg-[#F8F9FA] dark:bg-background flex flex-col">
      {/* Logo Section */}
      <div className="flex flex-col items-center pt-12 pb-6">
        <LogoInline size="lg" showText />
      </div>

      {/* Form Card */}
      <div className="flex-1 px-4 pb-8">
        <Card className="p-6 shadow-sm border-0 bg-white dark:bg-card">
          <h2 className="text-xl font-bold text-center mb-2">تسجيل الدخول</h2>
          <p className="text-muted-foreground text-sm text-center mb-6">
            سجل دخولك للوصول إلى حسابك
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold text-sm">البريد الإلكتروني</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pr-10 h-12 rounded-lg bg-[#E9ECEF] dark:bg-secondary border-0 focus:ring-2 focus:ring-primary"
                  dir="ltr"
                />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="font-bold text-sm">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pr-10 pl-10 h-12 rounded-lg bg-[#E9ECEF] dark:bg-secondary border-0 focus:ring-2 focus:ring-primary"
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
              className="w-full h-12 text-base font-bold rounded-xl mt-6 bg-primary hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  تسجيل الدخول
                  <ArrowLeft className="w-4 h-4 mr-2" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-muted-foreground text-sm">أو</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Register Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base rounded-xl border-primary text-primary hover:bg-primary/5"
            onClick={() => router.push("/register")}
          >
            إنشاء حساب جديد
          </Button>

          {/* Terms Text */}
          <p className="text-center text-xs text-muted-foreground mt-6 leading-relaxed">
            من خلال تسجيل دخولك، فإنك توافق على{" "}
            <Link href="/terms" className="text-primary font-medium hover:underline">
              شروط الخدمة
            </Link>
            {" "}و{" "}
            <Link href="/privacy" className="text-primary font-medium hover:underline">
              سياسة الخصوصية
            </Link>
            {" "}الخاصة بـ طمنّي
          </p>
        </Card>

        {/* App Features */}
        <div className="flex justify-center gap-6 mt-8">
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">تسجيل سريع</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">حماية البيانات</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <HeadphonesIcon className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">دعم العملاء</span>
          </div>
        </div>
      </div>
    </main>
  );
}
