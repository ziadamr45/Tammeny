"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

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
    <main className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex flex-col">
      {/* Header */}
      <div className="p-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Logo Section */}
      <div className="flex flex-col items-center pt-8 pb-6">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-3 shadow-lg">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-primary">طمنّي</h1>
        <p className="text-muted-foreground text-sm mt-1">أمان.. وثقة</p>
      </div>

      {/* Form Card */}
      <div className="flex-1 px-4 pb-8">
        <Card className="p-6 card-shadow">
          <h2 className="text-xl font-bold text-center mb-2">تسجيل الدخول</h2>
          <p className="text-muted-foreground text-sm text-center mb-6">
            سجل دخولك للوصول إلى حسابك
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pr-10 h-12 rounded-xl bg-secondary border-0"
                  dir="ltr"
                />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pr-10 pl-10 h-12 rounded-xl bg-secondary border-0"
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
              <button
                type="button"
                onClick={() => toast.info("قريباً")}
                className="text-sm text-primary hover:underline"
              >
                نسيت كلمة المرور؟
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 text-lg rounded-xl mt-6"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "تسجيل الدخول"
              )}
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              ليس لديك حساب؟{" "}
              <button
                onClick={() => router.push("/register")}
                className="text-primary font-medium hover:underline"
              >
                أنشئ حسابك
              </button>
            </p>
          </div>
        </Card>

        {/* Security Info */}
        <div className="mt-6 p-4 rounded-xl bg-primary/5 flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary shrink-0" />
          <div>
            <p className="font-medium text-sm">مشفر بالكامل</p>
            <p className="text-xs text-muted-foreground">
              بياناتك محمية بتشفير AES-256
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
