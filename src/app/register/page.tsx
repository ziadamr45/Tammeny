"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft, Shield, Database, RefreshCw, HeadphonesIcon, Globe } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { LogoInline } from "@/components/tamenny/logo";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";

export default function RegisterPage() {
  const router = useRouter();
  const { language, setLanguage, t, direction } = useLanguage();
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
      toast.error(t.register.errors.allFieldsRequired);
      return;
    }

    if (formData.password.length < 6) {
      toast.error(t.register.errors.passwordMinLength);
      return;
    }

    if (!agreedToTerms) {
      toast.error(t.register.errors.mustAgreeTerms);
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
        throw new Error(data.error || t.register.errors.registrationFailed);
      }

      toast.success(t.register.errors.accountCreated);
      router.push("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.register.errors.registrationFailed);
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
            <span className="text-sm">{t.register.customerService}</span>
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
        <h1 className="text-2xl font-bold text-center mb-2 text-foreground">{t.register.title}</h1>
        <p className="text-muted-foreground text-sm text-center mb-6 leading-relaxed">
          {t.register.subtitle}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold text-foreground">{t.register.name}</Label>
            <div className="relative">
              <Input
                id="name"
                type="text"
                placeholder={t.register.namePlaceholder}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={cn(
                  "h-14 rounded-xl bg-[#E9ECEF] dark:bg-secondary border-0 text-base placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/50",
                  direction === 'rtl' ? 'pr-12' : 'pl-12'
                )}
              />
              <User className={cn(
                "absolute top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground",
                direction === 'rtl' ? 'right-4' : 'left-4'
              )} />
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-foreground">{t.register.email}</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder={t.register.emailPlaceholder}
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
            <Label htmlFor="password" className="text-sm font-semibold text-foreground">{t.register.password}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={t.register.passwordPlaceholder}
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

          {/* Gender Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">{t.register.gender}</Label>
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
                <span>{t.register.male}</span>
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
                <span>{t.register.female}</span>
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
              {t.register.agreeTerms}{" "}
              <Link href="/terms" className="text-primary font-medium hover:underline">
                {t.register.termsOfService}
              </Link>
              {" "}{t.register.and}{" "}
              <Link href="/privacy" className="text-primary font-medium hover:underline">
                {t.register.privacyPolicy}
              </Link>
              {" "}{t.register.forApp}
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
                {t.register.createButton}
                <ArrowLeft className={cn("w-5 h-5", direction === 'rtl' ? 'mr-2' : 'ml-2 rotate-180')} />
              </>
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-muted-foreground text-sm font-medium">{t.register.or}</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Login Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-14 text-lg font-semibold rounded-xl border-2 border-primary text-primary hover:bg-primary/5"
          onClick={() => router.push("/login")}
        >
          {t.register.login}
        </Button>

        {/* Terms Text */}
        <p className="text-center text-xs text-muted-foreground mt-6 leading-relaxed">
          {t.register.termsText}{" "}
          <Link href="/terms" className="text-primary font-medium hover:underline">
            {t.register.termsOfService}
          </Link>
          {" "}{t.register.and}{" "}
          <Link href="/privacy" className="text-primary font-medium hover:underline">
            {t.register.privacyPolicy}
          </Link>
          {" "}{t.register.forApp}
        </p>
      </Card>

      {/* Bottom Features */}
      <div className="flex justify-center gap-8 mt-8 w-full max-w-md">
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground font-medium">{t.register.features.secureConnection}</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Database className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground font-medium">{t.register.features.dataProtection}</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground font-medium">{t.register.features.instantSync}</span>
        </div>
      </div>
    </main>
  );
}
