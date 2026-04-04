"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, Shield, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { LogoInline } from "@/components/tamenny/logo";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
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

    if (!agreedToTerms) {
      toast.error("يجب الموافقة على شروط الاستخدام وسياسة الخصوصية");
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
    <main className="min-h-screen bg-[#F8F9FA] dark:bg-background flex flex-col items-center py-8 px-4">
      {/* Logo Section */}
      <div className="flex flex-col items-center mb-6">
        <LogoInline size="lg" showText />
      </div>

      {/* Form Card */}
      <Card className="w-full max-w-md p-6 shadow-lg border-0 bg-white dark:bg-card rounded-2xl">
        {/* Title */}
        <h1 className="text-2xl font-bold text-center mb-2 text-foreground">انشئ حسابك الجديد</h1>
        <p className="text-muted-foreground text-sm text-center mb-6 leading-relaxed">
          ابدأ رحلتك معنا في تجربة أمان وخصوصية فريدة
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold text-foreground">الاسم</Label>
            <div className="relative">
              <Input
                id="name"
                type="text"
                placeholder="أدخل اسمك الكامل"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="pr-12 h-14 rounded-xl bg-[#E9ECEF] dark:bg-secondary border-0 text-base placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/50"
              />
              <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            </div>
          </div>

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

          {/* Gender Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">الجنس</Label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setGender("male")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 h-14 rounded-xl transition-all font-medium",
                  gender === "male"
                    ? "bg-primary text-white shadow-md"
                    : "bg-[#E9ECEF] dark:bg-secondary text-foreground hover:bg-[#DEE2E6]"
                )}
              >
                <span className="text-xl">♂</span>
                <span>ذكر</span>
              </button>
              <button
                type="button"
                onClick={() => setGender("female")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 h-14 rounded-xl transition-all font-medium",
                  gender === "female"
                    ? "bg-primary text-white shadow-md"
                    : "bg-[#E9ECEF] dark:bg-secondary text-foreground hover:bg-[#DEE2E6]"
                )}
              >
                <span className="text-xl">♀</span>
                <span>أنثى</span>
              </button>
            </div>
          </div>

          {/* Terms Agreement Checkbox */}
          <div className="flex items-start gap-3 py-1">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              className="mt-0.5 h-5 w-5 rounded data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
              أوافق على{" "}
              <Link href="/terms" className="text-primary font-medium hover:underline">
                شروط الاستخدام
              </Link>
              {" "}و{" "}
              <Link href="/privacy" className="text-primary font-medium hover:underline">
                سياسة الخصوصية
              </Link>
              {" "}لـ طمنّي
            </label>
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
                أنشئ حساب!
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

        {/* Login Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-14 text-lg font-semibold rounded-xl border-2 border-primary text-primary hover:bg-primary/5"
          onClick={() => router.push("/login")}
        >
          تسجيل الدخول
        </Button>

        {/* Terms Text */}
        <p className="text-center text-xs text-muted-foreground mt-6 leading-relaxed">
          من خلال إنشاء حسابك، فإنك توافق على شروط الاستخدام وسياسة الخصوصية لـ طمنّي
        </p>
      </Card>

      {/* Bottom Features */}
      <div className="flex justify-center gap-8 mt-8 w-full max-w-md">
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground font-medium">أمان مضمون</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground font-medium">خصوصية محمية</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <LockKeyhole className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground font-medium">بيانات آمنة</span>
        </div>
      </div>
    </main>
  );
}
