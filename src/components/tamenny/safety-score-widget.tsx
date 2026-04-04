"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Shield,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Award,
  ChevronLeft,
  Info,
} from "lucide-react";
import {
  toArabicNumerals,
  formatArabicPercentage,
} from "@/lib/arabic-numerals";
import Link from "next/link";

interface SafetyScoreWidgetProps {
  score?: number;
  showTips?: boolean;
  variant?: "full" | "compact";
  className?: string;
}

// Tips for improving safety score
const safetyTips = [
  {
    id: 1,
    title: "شارك موقعك بانتظام",
    description: "مشاركة الموقع تزيد من درجة الأمان",
    icon: "📍",
  },
  {
    id: 2,
    title: "أضف جهات اتصال الطوارئ",
    description: "جهات الاتصال تساعد في حالات الطوارئ",
    icon: "👥",
  },
  {
    id: 3,
    title: "حدد مناطق آمنة",
    description: "المناطق الآمنة توفر تنبيهات فورية",
    icon: "🛡️",
  },
  {
    id: 4,
    title: "أكمل ملفك الشخصي",
    description: "الملف الكامل يحسن تجربتك",
    icon: "✨",
  },
  {
    id: 5,
    title: "استخدم ميزة الوصول الآمن",
    description: "إعلام الأصدقاء بوصولك بأمان",
    icon: "✅",
  },
];

export function SafetyScoreWidget({
  score = 0,
  showTips = true,
  variant = "full",
  className,
}: SafetyScoreWidgetProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showTipsDialog, setShowTipsDialog] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // Animate score on mount
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = score / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  // Rotate tips
  useEffect(() => {
    if (!showTips) return;
    const timer = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % safetyTips.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [showTips]);

  // Calculate score color and label
  const getScoreInfo = (s: number) => {
    if (s >= 90) return { color: "text-green-500", bg: "bg-green-500", label: "ممتاز", ring: "stroke-green-500" };
    if (s >= 75) return { color: "text-emerald-500", bg: "bg-emerald-500", label: "جيد جداً", ring: "stroke-emerald-500" };
    if (s >= 60) return { color: "text-blue-500", bg: "bg-blue-500", label: "جيد", ring: "stroke-blue-500" };
    if (s >= 40) return { color: "text-amber-500", bg: "bg-amber-500", label: "متوسط", ring: "stroke-amber-500" };
    return { color: "text-red-500", bg: "bg-red-500", label: "يحتاج تحسين", ring: "stroke-red-500" };
  };

  const scoreInfo = getScoreInfo(score);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // Compact variant
  if (variant === "compact") {
    return (
      <Card className={cn("p-3 flex items-center gap-3 card-shadow", className)}>
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/30"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference * 0.8}
              strokeDashoffset={strokeDashoffset * 0.8}
              className={cn(scoreInfo.ring, "transition-all duration-1000 ease-out")}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn("text-sm font-bold", scoreInfo.color)}>
              {toArabicNumerals(animatedScore)}
            </span>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Shield className={cn("w-4 h-4", scoreInfo.color)} />
            <span className="text-sm font-medium">درجة الأمان</span>
          </div>
          <span className={cn("text-xs", scoreInfo.color)}>{scoreInfo.label}</span>
        </div>
        <Link href="/achievements">
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
      </Card>
    );
  }

  // Full variant
  return (
    <Card className={cn("p-4 card-shadow overflow-hidden relative", className)}>
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full -translate-x-16 -translate-y-16" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-bold">درجة الأمان</h3>
              <p className="text-xs text-muted-foreground">مستوى حمايتك</p>
            </div>
          </div>
          <Link href="/achievements">
            <Button variant="ghost" size="sm" className="gap-1 text-primary">
              الإنجازات
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Score Circle */}
        <div className="flex justify-center mb-4">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="text-muted/20"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={cn(
                  scoreInfo.ring,
                  "transition-all duration-1000 ease-out animate-score-pulse"
                )}
              />
            </svg>
            
            {/* Score display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-3xl font-bold", scoreInfo.color)}>
                {toArabicNumerals(animatedScore)}
              </span>
              <span className={cn("text-sm font-medium", scoreInfo.color)}>
                {scoreInfo.label}
              </span>
            </div>

            {/* Pulse ring for high scores */}
            {score >= 90 && (
              <div className="absolute inset-0 rounded-full animate-ping opacity-20">
                <div className={cn("w-full h-full rounded-full", scoreInfo.bg)} />
              </div>
            )}
          </div>
        </div>

        {/* Score breakdown */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold text-primary">{toArabicNumerals(12)}</div>
            <div className="text-xs text-muted-foreground">رحلة آمنة</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold text-green-500">{toArabicNumerals(5)}</div>
            <div className="text-xs text-muted-foreground">إنجاز</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold text-amber-500">{toArabicNumerals(3)}</div>
            <div className="text-xs text-muted-foreground">منطقة آمنة</div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">التقدم للمرحلة التالية</span>
            <span className="text-xs font-medium">{formatArabicPercentage(score)}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-1000", scoreInfo.bg)}
              style={{ width: `${animatedScore}%` }}
            />
          </div>
        </div>

        {/* Tips section */}
        {showTips && (
          <div className="bg-muted/30 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium">نصيحة لتحسين درجتك</span>
              <Button
                variant="ghost"
                size="sm"
                className="mr-auto h-6 w-6 p-0"
                onClick={() => setShowTipsDialog(true)}
              >
                <Info className="w-4 h-4" />
              </Button>
            </div>
            <div
              key={currentTipIndex}
              className="animate-slide-up"
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">{safetyTips[currentTipIndex].icon}</span>
                <div>
                  <p className="text-sm font-medium">{safetyTips[currentTipIndex].title}</p>
                  <p className="text-xs text-muted-foreground">
                    {safetyTips[currentTipIndex].description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Achievement badge preview */}
        {score >= 75 && (
          <div className="mt-4 flex items-center justify-center gap-2 animate-fade-in">
            <Award className={cn("w-5 h-5", scoreInfo.color)} />
            <span className={cn("text-sm font-medium", scoreInfo.color)}>
              حصلت على شارة "مسافر آمن"
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

// Mini badge version for inline use
export function SafetyScoreBadge({ score = 0 }: { score?: number }) {
  const getScoreColor = (s: number) => {
    if (s >= 90) return "bg-green-500";
    if (s >= 75) return "bg-emerald-500";
    if (s >= 60) return "bg-blue-500";
    if (s >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted">
      <Shield className="w-3 h-3 text-primary" />
      <span className="text-xs font-bold">{toArabicNumerals(score)}</span>
      <div className={cn("w-2 h-2 rounded-full", getScoreColor(score))} />
    </div>
  );
}

// Progress component for detailed breakdown
export function SafetyScoreProgress({
  label,
  value,
  max = 100,
  icon,
  color = "primary",
}: {
  label: string;
  value: number;
  max?: number;
  icon?: React.ReactNode;
  color?: string;
}) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm">{label}</span>
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          {toArabicNumerals(value)} / {toArabicNumerals(max)}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            color === "primary" && "bg-primary",
            color === "green" && "bg-green-500",
            color === "blue" && "bg-blue-500",
            color === "amber" && "bg-amber-500",
            color === "red" && "bg-red-500"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default SafetyScoreWidget;
