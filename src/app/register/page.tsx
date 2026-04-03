"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, User, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("جميع الحقول مطلوبة");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          gender,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "حدث خطأ أثناء التسجيل");
      }

      toast.success("تم إنشاء الحساب بنجاح!");
      router.push("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حدث خطأ أثناء التسجيل");
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
          <h2 className="text-xl font-bold text-center mb-2">أنشئ حسابك الجديد</h2>
          <p className="text-muted-foreground text-sm text-center mb-6">
            أنشئ حسابك للبدء في مشاركة موقعك بأمان
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">الاسم الكامل</Label>
              <div className="relative">
                <Input
                  id="name"
                  type="text"
                  placeholder="أدخل اسمك"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pr-10 h-12 rounded-xl bg-secondary border-0"
                />
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              </div>
            </div>

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

            {/* Gender Selection */}
            <div className="space-y-2">
              <Label>الجنس</Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setGender("male")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all",
                    gender === "male"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-secondary hover:border-primary/50"
                  )}
                >
                  <span className="text-xl">♂</span>
                  <span className="font-medium">ذكر</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGender("female")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all",
                    gender === "female"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-secondary hover:border-primary/50"
                  )}
                >
                  <span className="text-xl">♀</span>
                  <span className="font-medium">أنثى</span>
                </button>
              </div>
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
                "أنشئ حسابك!"
              )}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              لديك حساب بالفعل؟{" "}
              <button
                onClick={() => router.push("/login")}
                className="text-primary font-medium hover:underline"
              >
                تسجيل الدخول
              </button>
            </p>
          </div>
        </Card>

        {/* Trust Badges */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <TrustBadge
            icon={<Shield className="w-5 h-5" />}
            title="تأمين المعلومات"
          />
          <TrustBadge
            icon={<Lock className="w-5 h-5" />}
            title="الخصوصية المطلقة"
          />
          <TrustBadge
            icon={<User className="w-5 h-5" />}
            title="حماية الهوية"
          />
        </div>
      </div>
    </main>
  );
}

function TrustBadge({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-primary/5">
      <div className="text-primary">{icon}</div>
      <span className="text-xs text-center text-muted-foreground">{title}</span>
    </div>
  );
}
