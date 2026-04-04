"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Shield, Database, RefreshCw, HeadphonesIcon, Globe } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { LogoInline } from "@/components/tamenny/logo";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const { language, setLanguage, t, direction } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error(language === 'ar' ? "جميع الحقول مطلوبة" : "All fields are required");
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
        throw new Error(data.error || (language === 'ar' ? "حدث خطأ أثناء تسجيل الدخول" : "Login error"));
      }

      toast.success(language === 'ar' ? "مرحباً بك!" : "Welcome!");
      router.push("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (language === 'ar' ? "حدث خطأ أثناء تسجيل الدخول" : "Login error"));
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  return (
    <main className="min-h-screen bg-[#F8F9FA] dark:bg-background flex flex-col items-center py-8 px-4">
      {/* Language Toggle & Customer Service - Top */}
      <div className="w-full max-w-md flex justify-between mb-4">
        <Link href="/help">
          <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-primary">
            <HeadphonesIcon className="w-5 h-5" />
            <span className="text-sm">{t.login.customerService}</span>
          </Button>
        </Link>
        
        <Button
          variant="ghost"
          onClick={toggleLanguage}
          className="gap-2 text-muted-foreground hover:text-primary"
        >
          <Globe className="w-5 h-5" />
          <span className="text-sm">{language === 'ar' ? 'EN' : 'عربي'}</span>
        </Button>
      </div>

      {/* Logo Section */}
      <div className="flex flex-col items-center mb-6">
        <LogoInline size="lg" showText />
      </div>

      {/* Form Card */}
      <Card className="w-full max-w-md p-6 shadow-lg border-0 bg-white dark:bg-card rounded-2xl">
        {/* Title */}
        <h1 className="text-2xl font-bold text-center mb-2 text-foreground">{t.login.title}</h1>
        <p className="text-muted-foreground text-sm text-center mb-6 leading-relaxed">
          {t.login.subtitle}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-foreground">{t.login.email}</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder={t.login.emailPlaceholder}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={cn(
                  "h-14 rounded-xl bg-[#E9ECEF] dark:bg-secondary border-0 text-base placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/50",
                  direction === 'rtl' ? 'pr-12' : 'pl-12'
                )}
                dir="ltr"
              />
              <Mail className={cn(
                "absolute top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground",
                direction === 'rtl' ? 'right-4' : 'left-4'
              )} />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold text-foreground">{t.login.password}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={t.login.passwordPlaceholder}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={cn(
                  "h-14 rounded-xl bg-[#E9ECEF] dark:bg-secondary border-0 text-base placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/50",
                  direction === 'rtl' ? 'pr-12 pl-12' : 'pl-12 pr-12'
                )}
              />
              <Lock className={cn(
                "absolute top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground",
                direction === 'rtl' ? 'right-4' : 'left-4'
              )} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors",
                  direction === 'rtl' ? 'left-4' : 'right-4'
                )}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className={cn("text-", direction === 'rtl' ? 'left' : 'right')}>
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:underline font-medium"
            >
              {t.login.forgotPassword}
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
                {t.login.loginButton}
                <ArrowLeft className={cn("w-5 h-5", direction === 'rtl' ? 'mr-2' : 'ml-2 rotate-180')} />
              </>
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-muted-foreground text-sm font-medium">{t.login.or}</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Register Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-14 text-lg font-semibold rounded-xl border-2 border-primary text-primary hover:bg-primary/5"
          onClick={() => router.push("/register")}
        >
          {t.login.createAccount}
        </Button>

        {/* Terms Text */}
        <p className="text-center text-xs text-muted-foreground mt-6 leading-relaxed">
          {t.login.termsText}{" "}
          <Link href="/terms" className="text-primary font-medium hover:underline">
            {t.login.termsOfService}
          </Link>
          {" "}{t.login.and}{" "}
          <Link href="/privacy" className="text-primary font-medium hover:underline">
            {t.login.privacyPolicy}
          </Link>
          {" "}{t.login.forApp}
        </p>
      </Card>

      {/* Bottom Features */}
      <div className="flex justify-center gap-8 mt-8 w-full max-w-md">
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground font-medium">{t.login.features.secureConnection}</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Database className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground font-medium">{t.login.features.dataProtection}</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground font-medium">{t.login.features.instantSync}</span>
        </div>
      </div>
    </main>
  );
}
