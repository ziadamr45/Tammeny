"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  MapPin,
  Users,
  Bell,
  ArrowLeft,
  ArrowRight,
  Check,
  Navigation,
  Heart,
  Lock,
  Smartphone,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingSlide {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  features?: string[];
}

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 1,
    title: "مرحباً بك في طمنّي",
    description: "تطبيق مشاركة الموقع الآمن للعائلة والأصدقاء. ابقَ على اتصال دائم مع من تحب وتأكد من وصولهم بسلام.",
    icon: <Heart className="w-16 h-16" />,
    color: "from-primary to-teal-600",
    features: [
      "مشاركة الموقع في الوقت الحقيقي",
      "إشعارات الوصول والسلامة",
      "تشفير كامل للبيانات",
    ],
  },
  {
    id: 2,
    title: "شارك موقعك بسهولة",
    description: "شارك موقعك مع من تثق بهم بنقرة واحدة. اختر المدة المناسبة أو شارك حتى الوصول للوجهة.",
    icon: <MapPin className="w-16 h-16" />,
    color: "from-teal-500 to-cyan-600",
    features: [
      "مشاركة فورية مع جهات الاتصال",
      "تحديد مدة المشاركة",
      "رابط آمن ومشفر",
    ],
  },
  {
    id: 3,
    title: "حماية لأحبائك",
    description: "أنشئ مناطق آمنة واحصل على تنبيهات عند دخول أو خروج أفراد عائلتك منها.",
    icon: <Shield className="w-16 h-16" />,
    color: "from-green-500 to-emerald-600",
    features: [
      "مناطق آمنة مخصصة",
      "تنبيهات الدخول والخروج",
      "زر طوارئ SOS",
    ],
  },
  {
    id: 4,
    title: "خصوصيتك أولوية",
    description: "بياناتك وموقعك محمية بتشفير AES-256. أنت تتحكم في من يرى موقعك ومتى.",
    icon: <Lock className="w-16 h-16" />,
    color: "from-purple-500 to-violet-600",
    features: [
      "تشفير على مستوى البنوك",
      "التحكم الكامل في الخصوصية",
      "الوضع الخفي متاح",
    ],
  },
  {
    id: 5,
    title: "كل شيء جاهز!",
    description: "أنت الآن مستعد للبدء. شارك موقعك مع من تحب وتمتع براحة البال.",
    icon: <Check className="w-16 h-16" />,
    color: "from-primary to-teal-600",
    features: [
      "سهل الاستخدام",
      "يعمل في الخلفية",
      "توفير البطارية",
    ],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");

  const totalSlides = ONBOARDING_SLIDES.length;
  const slide = ONBOARDING_SLIDES[currentSlide];

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setDirection("next");
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide(currentSlide + 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setDirection("prev");
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide(currentSlide - 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const handleSkip = () => {
    router.push("/");
  };

  const handleGetStarted = () => {
    // Save that onboarding is complete
    localStorage.setItem("tamenny_onboarding_complete", "true");
    router.push("/");
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        handlePrev(); // RTL: right arrow goes to previous
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        handleNext(); // RTL: left arrow goes to next
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex flex-col">
      {/* Skip Button */}
      {currentSlide < totalSlides - 1 && (
        <div className="fixed top-4 left-4 z-50">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground"
          >
            تخطي
            <ArrowLeft className="w-4 h-4 mr-1" />
          </Button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        {/* Slide Content */}
        <div
          className={cn(
            "transition-all duration-300 ease-out",
            isAnimating
              ? direction === "next"
                ? "opacity-0 translate-x-8"
                : "opacity-0 -translate-x-8"
              : "opacity-100 translate-x-0"
          )}
        >
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div
              className={cn(
                "w-32 h-32 rounded-3xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg",
                slide.color
              )}
            >
              {slide.icon}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center mb-4">
            {slide.title}
          </h1>

          {/* Description */}
          <p className="text-center text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
            {slide.description}
          </p>

          {/* Features */}
          {slide.features && (
            <div className="space-y-3 max-w-sm mx-auto">
              {slide.features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-card rounded-xl card-shadow"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="px-6 pb-8">
        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {ONBOARDING_SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > currentSlide ? "next" : "prev");
                setIsAnimating(true);
                setTimeout(() => {
                  setCurrentSlide(index);
                  setIsAnimating(false);
                }, 150);
              }}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentSlide
                  ? "w-8 bg-primary"
                  : "w-2 bg-muted hover:bg-muted-foreground/30"
              )}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          {currentSlide > 0 && (
            <Button
              variant="outline"
              onClick={handlePrev}
              className="flex-1 h-12 rounded-xl"
              disabled={isAnimating}
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              السابق
            </Button>
          )}

          {currentSlide < totalSlides - 1 ? (
            <Button
              onClick={handleNext}
              className="flex-1 h-12 rounded-xl bg-primary"
              disabled={isAnimating}
            >
              التالي
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          ) : (
            <Button
              onClick={handleGetStarted}
              className="flex-1 h-12 rounded-xl bg-primary"
              disabled={isAnimating}
            >
              ابدأ الآن
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          )}
        </div>

        {/* Quick Stats on Last Slide */}
        {currentSlide === totalSlides - 1 && (
          <div className="mt-8 grid grid-cols-3 gap-3">
            <Card className="p-3 text-center card-shadow">
              <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mx-auto mb-2">
                <Smartphone className="w-5 h-5 text-teal-600" />
              </div>
              <div className="text-xs text-muted-foreground">سهل الاستخدام</div>
            </Card>
            <Card className="p-3 text-center card-shadow">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-2">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-xs text-muted-foreground">سريع وخفيف</div>
            </Card>
            <Card className="p-3 text-center card-shadow">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-2">
                <Lock className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-xs text-muted-foreground">آمن ومشفر</div>
            </Card>
          </div>
        )}
      </div>

      {/* Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        {/* Top Right Circle */}
        <div
          className={cn(
            "absolute -top-32 -right-32 w-64 h-64 rounded-full opacity-10 transition-all duration-500",
            `bg-gradient-to-br ${slide.color}`
          )}
        />
        {/* Bottom Left Circle */}
        <div
          className={cn(
            "absolute -bottom-32 -left-32 w-64 h-64 rounded-full opacity-10 transition-all duration-500",
            `bg-gradient-to-br ${slide.color}`
          )}
        />
      </div>
    </main>
  );
}
