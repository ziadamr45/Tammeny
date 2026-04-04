"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, User, Mail, Lock, Eye, EyeOff, ArrowLeft, Check, X, HeadphonesIcon, FileText, Scale } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { LogoInline } from "@/components/tamenny/logo";
import Link from "next/link";

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

  // Password strength calculation
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const getPasswordStrengthLabel = () => {
    if (formData.password.length === 0) return "";
    if (passwordStrength <= 1) return "ضعيفة";
    if (passwordStrength <= 2) return "متوسطة";
    if (passwordStrength <= 3) return "جيدة";
    return "قوية";
  };

  const getPasswordStrengthColor = () => {
    if (formData.password.length === 0) return "bg-muted";
    if (passwordStrength <= 1) return "bg-red-500";
    if (passwordStrength <= 2) return "bg-yellow-500";
    if (passwordStrength <= 3) return "bg-blue-500";
    return "bg-green-500";
  };

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
    <main className="min-h-screen bg-[#F8F9FA] dark:bg-background flex flex-col">
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
      <div className="flex flex-col items-center pt-4 pb-6">
        <LogoInline size="lg" showText />
      </div>

      {/* Form Card */}
      <div className="flex-1 px-4 pb-8">
        <Card className="p-6 shadow-sm border-0 bg-white dark:bg-card">
          <h2 className="text-xl font-bold text-center mb-2">أنشئ حسابك الجديد</h2>
          <p className="text-muted-foreground text-sm text-center mb-6">
            انضم إلى آلاف المستخدمين الذين يثقون في طمنّي
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="font-bold text-sm">الاسم الكامل</Label>
              <div className="relative">
                <Input
                  id="name"
                  type="text"
                  placeholder="أدخل اسمك الكامل"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pr-10 h-12 rounded-lg bg-[#E9ECEF] dark:bg-secondary border-0 focus:ring-2 focus:ring-primary"
                />
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              </div>
            </div>

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
              
              {/* Password Strength Indicator */}
              {formData.password.length > 0 && (
                <div className="space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">قوة كلمة المرور</span>
                    <span className={cn(
                      "text-xs font-medium",
                      passwordStrength <= 1 ? "text-red-500" :
                      passwordStrength <= 2 ? "text-yellow-500" :
                      passwordStrength <= 3 ? "text-blue-500" : "text-green-500"
                    )}>
                      {getPasswordStrengthLabel()}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-all",
                          passwordStrength >= level ? getPasswordStrengthColor() : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Gender Selection */}
            <div className="space-y-2">
              <Label className="font-bold text-sm">الجنس</Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setGender("male")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 p-3 rounded-lg transition-all",
                    gender === "male"
                      ? "bg-primary text-white"
                      : "bg-[#E9ECEF] dark:bg-secondary text-foreground hover:bg-[#DEE2E6]"
                  )}
                >
                  <span>♂</span>
                  <span className="font-medium">ذكر</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGender("female")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 p-3 rounded-lg transition-all",
                    gender === "female"
                      ? "bg-primary text-white"
                      : "bg-[#E9ECEF] dark:bg-secondary text-foreground hover:bg-[#DEE2E6]"
                  )}
                >
                  <span>♀</span>
                  <span className="font-medium">أنثى</span>
                </button>
              </div>
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
                  أنشئ حساب!
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

          {/* Login Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base rounded-xl border-primary text-primary hover:bg-primary/5"
            onClick={() => router.push("/login")}
          >
            تسجيل الدخول
          </Button>

          {/* Terms Text */}
          <p className="text-center text-xs text-muted-foreground mt-6 leading-relaxed">
            من خلال إنشاء حسابك، فإنك توافق على{" "}
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

        {/* Bottom Icons */}
        <div className="flex justify-center gap-8 mt-8">
          <Link href="/help" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#E9ECEF] dark:bg-secondary flex items-center justify-center">
              <HeadphonesIcon className="w-5 h-5" />
            </div>
            <span className="text-xs">خدمة العملاء</span>
          </Link>
          <Link href="/privacy" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#E9ECEF] dark:bg-secondary flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-xs">سياسة الخصوصية</span>
          </Link>
          <Link href="/terms" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#E9ECEF] dark:bg-secondary flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs">الشروط</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
