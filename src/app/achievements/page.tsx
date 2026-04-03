"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Trophy,
  Medal,
  Crown,
  Star,
  Shield,
  Users,
  Clock,
  MapPin,
  Share2,
  Heart,
  Zap,
  Target,
  Award,
  CheckCircle,
  Lock,
  Sparkles,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { BottomNav, Header } from "@/components/tamenny/bottom-nav";
import { SafetyScoreWidget } from "@/components/tamenny/safety-score-widget";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  toArabicNumerals,
  formatArabicPercentage,
} from "@/lib/arabic-numerals";

// Achievement types
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: "safety" | "social" | "activity" | "special";
  level: number;
  maxLevel: number;
  progress: number;
  total: number;
  unlocked: boolean;
  unlockedAt?: string;
  reward: string;
  color: string;
}

// All achievements data
const achievementsData: Achievement[] = [
  // Safety Achievements
  {
    id: "safe-traveler",
    title: "المسافر الآمن",
    description: "أكمل رحلات بدون أي تنبيهات أمان",
    icon: <Shield className="w-6 h-6" />,
    category: "safety",
    level: 1,
    maxLevel: 3,
    progress: 8,
    total: 10,
    unlocked: false,
    reward: "+15 نقطة أمان",
    color: "emerald",
  },
  {
    id: "quick-responder",
    title: "المستجيب السريع",
    description: "استجب لتنبيهات الطوارئ خلال دقيقة واحدة",
    icon: <Zap className="w-6 h-6" />,
    category: "safety",
    level: 1,
    maxLevel: 3,
    progress: 5,
    total: 5,
    unlocked: true,
    unlockedAt: "2024-01-15",
    reward: "+20 نقطة أمان",
    color: "amber",
  },
  {
    id: "zone-master",
    title: "خبير المناطق",
    description: "أنشئ 5 مناطق آمنة",
    icon: <MapPin className="w-6 h-6" />,
    category: "safety",
    level: 2,
    maxLevel: 3,
    progress: 5,
    total: 5,
    unlocked: true,
    unlockedAt: "2024-01-10",
    reward: "+25 نقطة أمان",
    color: "blue",
  },
  {
    id: "check-in-champion",
    title: "بطل التحقق",
    description: "أكمل 50 تحقق أمان",
    icon: <CheckCircle className="w-6 h-6" />,
    category: "safety",
    level: 1,
    maxLevel: 3,
    progress: 35,
    total: 50,
    unlocked: false,
    reward: "+30 نقطة أمان",
    color: "green",
  },
  // Social Achievements
  {
    id: "trusted-friend",
    title: "الصديق الموثوق",
    description: "أضف 10 جهات اتصال موثوقة",
    icon: <Users className="w-6 h-6" />,
    category: "social",
    level: 1,
    maxLevel: 3,
    progress: 7,
    total: 10,
    unlocked: false,
    reward: "+15 نقطة أمان",
    color: "purple",
  },
  {
    id: "family-guardian",
    title: "حامي العائلة",
    description: "أضف 5 أفراد من العائلة",
    icon: <Heart className="w-6 h-6" />,
    category: "social",
    level: 2,
    maxLevel: 3,
    progress: 5,
    total: 5,
    unlocked: true,
    unlockedAt: "2024-01-08",
    reward: "+20 نقطة أمان",
    color: "rose",
  },
  {
    id: "sharing-star",
    title: "نجم المشاركة",
    description: "شارك موقعك 100 مرة",
    icon: <Share2 className="w-6 h-6" />,
    category: "social",
    level: 1,
    maxLevel: 3,
    progress: 67,
    total: 100,
    unlocked: false,
    reward: "+25 نقطة أمان",
    color: "cyan",
  },
  // Activity Achievements
  {
    id: "early-bird",
    title: "الطائر المبكر",
    description: "شارك موقعك في الصباح الباكر 30 مرة",
    icon: <Clock className="w-6 h-6" />,
    category: "activity",
    level: 1,
    maxLevel: 3,
    progress: 18,
    total: 30,
    unlocked: false,
    reward: "+10 نقطة أمان",
    color: "orange",
  },
  {
    id: "distance-walker",
    title: "المسافر النشط",
    description: "قطع 500 كيلومتر",
    icon: <Target className="w-6 h-6" />,
    category: "activity",
    level: 2,
    maxLevel: 3,
    progress: 500,
    total: 500,
    unlocked: true,
    unlockedAt: "2024-01-20",
    reward: "+35 نقطة أمان",
    color: "teal",
  },
  {
    id: "consistent-user",
    title: "المستخدم المنتظم",
    description: "استخدم التطبيق 30 يوماً متتالياً",
    icon: <Medal className="w-6 h-6" />,
    category: "activity",
    level: 1,
    maxLevel: 3,
    progress: 15,
    total: 30,
    unlocked: false,
    reward: "+40 نقطة أمان",
    color: "indigo",
  },
  // Special Achievements
  {
    id: "first-share",
    title: "أول مشاركة",
    description: "شارك موقعك لأول مرة",
    icon: <Star className="w-6 h-6" />,
    category: "special",
    level: 1,
    maxLevel: 1,
    progress: 1,
    total: 1,
    unlocked: true,
    unlockedAt: "2024-01-01",
    reward: "+5 نقاط أمان",
    color: "yellow",
  },
  {
    id: "explorer",
    title: "المستكشف",
    description: "زِر 10 أماكن مختلفة",
    icon: <MapPin className="w-6 h-6" />,
    category: "special",
    level: 1,
    maxLevel: 3,
    progress: 10,
    total: 10,
    unlocked: true,
    unlockedAt: "2024-01-12",
    reward: "+15 نقطة أمان",
    color: "lime",
  },
];

// Category translations
const categoryLabels: Record<string, string> = {
  safety: "إنجازات الأمان",
  social: "إنجازات التواصل",
  activity: "إنجازات النشاط",
  special: "إنجازات خاصة",
};

// Level badge component
function LevelBadge({ level, maxLevel }: { level: number; maxLevel: number }) {
  const colors: Record<number, string> = {
    1: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    2: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
    3: "bg-amber-300 text-amber-800 dark:bg-amber-600 dark:text-amber-100",
  };

  const stars = Array(maxLevel)
    .fill(0)
    .map((_, i) => (
      <Star
        key={i}
        className={cn(
          "w-3 h-3",
          i < level ? "fill-current" : "text-muted-foreground/30"
        )}
      />
    ));

  return (
    <div
      className={cn(
        "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
        colors[level] || colors[1]
      )}
    >
      {stars}
    </div>
  );
}

// Achievement card component
function AchievementCard({
  achievement,
  onClick,
}: {
  achievement: Achievement;
  onClick: () => void;
}) {
  const colorMap: Record<string, string> = {
    emerald: "from-emerald-500 to-emerald-600",
    amber: "from-amber-500 to-amber-600",
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    rose: "from-rose-500 to-rose-600",
    cyan: "from-cyan-500 to-cyan-600",
    orange: "from-orange-500 to-orange-600",
    teal: "from-teal-500 to-teal-600",
    indigo: "from-indigo-500 to-indigo-600",
    yellow: "from-yellow-500 to-yellow-600",
    lime: "from-lime-500 to-lime-600",
  };

  const progressPercentage = Math.min(
    (achievement.progress / achievement.total) * 100,
    100
  );

  return (
    <Card
      className={cn(
        "p-4 cursor-pointer transition-all duration-300 card-shadow-hover",
        achievement.unlocked
          ? "border-primary/30 bg-gradient-to-l from-primary/5 to-transparent"
          : "opacity-75"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon container */}
        <div
          className={cn(
            "w-14 h-14 rounded-xl flex items-center justify-center shrink-0",
            achievement.unlocked
              ? `bg-gradient-to-br ${colorMap[achievement.color] || "from-primary to-teal-light"} text-white animate-badge-shine`
              : "bg-muted text-muted-foreground"
          )}
        >
          {achievement.unlocked ? (
            achievement.icon
          ) : (
            <Lock className="w-6 h-6" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold truncate">{achievement.title}</h4>
            {achievement.unlocked && (
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {achievement.description}
          </p>

          {/* Progress */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {toArabicNumerals(achievement.progress)} / {toArabicNumerals(achievement.total)}
              </span>
              <LevelBadge level={achievement.level} maxLevel={achievement.maxLevel} />
            </div>
            <Progress
              value={progressPercentage}
              className={cn(
                "h-2",
                achievement.unlocked && "[&>div]:bg-gradient-to-l [&>div]:from-primary [&>div]:to-teal-light"
              )}
            />
          </div>

          {/* Reward badge */}
          {achievement.unlocked && (
            <div className="mt-2 flex items-center gap-1 text-xs text-primary">
              <Trophy className="w-3 h-3" />
              <span>{achievement.reward}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// Achievement detail dialog
function AchievementDialog({
  achievement,
  open,
  onOpenChange,
}: {
  achievement: Achievement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!achievement) return null;

  const progressPercentage = Math.min(
    (achievement.progress / achievement.total) * 100,
    100
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            تفاصيل الإنجاز
          </DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-4">
          {/* Achievement icon */}
          <div
            className={cn(
              "w-24 h-24 mx-auto rounded-2xl flex items-center justify-center",
              achievement.unlocked
                ? "bg-gradient-to-br from-primary to-teal-light text-white animate-badge-shine"
                : "bg-muted text-muted-foreground"
            )}
          >
            <div className="scale-150">{achievement.icon}</div>
          </div>

          {/* Title and level */}
          <div>
            <h3 className="text-xl font-bold">{achievement.title}</h3>
            <div className="flex items-center justify-center gap-2 mt-2">
              <LevelBadge level={achievement.level} maxLevel={achievement.maxLevel} />
              {achievement.unlocked && (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle className="w-3 h-3" />
                  مكتمل
                </Badge>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-muted-foreground">{achievement.description}</p>

          {/* Progress */}
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">التقدم</span>
              <span className="text-sm font-bold text-primary">
                {formatArabicPercentage(progressPercentage)}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{toArabicNumerals(achievement.progress)}</span>
              <span>{toArabicNumerals(achievement.total)}</span>
            </div>
          </div>

          {/* Reward */}
          <div className="flex items-center justify-center gap-2 p-3 bg-primary/10 rounded-xl">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="font-bold text-primary">{achievement.reward}</span>
          </div>

          {/* Unlock date */}
          {achievement.unlocked && achievement.unlockedAt && (
            <p className="text-xs text-muted-foreground">
              تم الفتح في{" "}
              {new Date(achievement.unlockedAt).toLocaleDateString("ar-EG")}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Confetti animation component
function ConfettiCelebration({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 0.5}s`,
            backgroundColor: [
              "#0D7377",
              "#14A3A8",
              "#FFD700",
              "#FF6B6B",
              "#4ECDC4",
            ][Math.floor(Math.random() * 5)],
          }}
        />
      ))}
    </div>
  );
}

export default function AchievementsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [selectedAchievement, setSelectedAchievement] =
    useState<Achievement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [achievements] = useState<Achievement[]>(achievementsData);
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Show confetti on first visit
  useEffect(() => {
    const hasSeenAchievements = localStorage.getItem("hasSeenAchievements");
    if (!hasSeenAchievements && achievements.some((a) => a.unlocked)) {
      setShowConfetti(true);
      localStorage.setItem("hasSeenAchievements", "true");
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [achievements]);

  // Calculate stats
  const totalUnlocked = achievements.filter((a) => a.unlocked).length;
  const totalAchievements = achievements.length;
  const totalPoints = achievements
    .filter((a) => a.unlocked)
    .reduce((sum, a) => {
      const points = parseInt(a.reward.replace(/[^0-9]/g, ""));
      return sum + (isNaN(points) ? 0 : points);
    }, 0);
  const safetyScore = Math.min(100, Math.floor(totalUnlocked * 8 + totalPoints / 2));

  // Filter achievements
  const filteredAchievements = achievements.filter((a) => {
    if (filter === "unlocked") return a.unlocked;
    if (filter === "locked") return !a.unlocked;
    return true;
  });

  // Group by category
  const groupedAchievements = filteredAchievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  // Handle achievement click
  const handleAchievementClick = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setDialogOpen(true);
  };

  // Auth Loading
  if (authLoading) {
    return (
      <main className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </main>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      <Header />

      {/* Confetti celebration */}
      <ConfettiCelebration show={showConfetti} />

      <div className="pt-16 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-500" />
              الإنجازات والشارات
            </h1>
            <p className="text-sm text-muted-foreground">
              اجمع الشارات واحصل على مكافآت
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            لوحة التحكم
          </Button>
        </div>

        {/* Safety Score Widget */}
        <SafetyScoreWidget score={safetyScore} showTips={false} />

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center card-shadow">
            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Medal className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {toArabicNumerals(totalUnlocked)}
            </div>
            <div className="text-xs text-muted-foreground">مكتمل</div>
          </Card>

          <Card className="p-3 text-center card-shadow">
            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {toArabicNumerals(totalAchievements - totalUnlocked)}
            </div>
            <div className="text-xs text-muted-foreground">متبقي</div>
          </Card>

          <Card className="p-3 text-center card-shadow">
            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-primary/10 flex items-center justify-center">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <div className="text-2xl font-bold text-primary">
              {toArabicNumerals(totalPoints)}
            </div>
            <div className="text-xs text-muted-foreground">نقطة</div>
          </Card>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(["all", "unlocked", "locked"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="flex-1"
            >
              {f === "all" && "الكل"}
              {f === "unlocked" && "المكتملة"}
              {f === "locked" && "المتبقية"}
            </Button>
          ))}
        </div>

        {/* Achievements by category */}
        <ScrollArea className="h-[calc(100vh-400px)]">
          <div className="space-y-6 pr-2">
            {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-5 h-5 text-primary" />
                  <h3 className="font-bold">{categoryLabels[category]}</h3>
                  <Badge variant="secondary" className="mr-auto">
                    {toArabicNumerals(
                      categoryAchievements.filter((a) => a.unlocked).length
                    )}
                    /
                    {toArabicNumerals(categoryAchievements.length)}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {categoryAchievements.map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      onClick={() => handleAchievementClick(achievement)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Motivation card */}
        <Card className="p-4 card-shadow bg-gradient-to-l from-primary/10 to-teal-dark/5 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold">استمر في التقدم!</h4>
              <p className="text-sm text-muted-foreground">
                أكمل {toArabicNumerals(totalAchievements - totalUnlocked)} إنجازات
                للحصول على شارة "البطل"
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Achievement detail dialog */}
      <AchievementDialog
        achievement={selectedAchievement}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <BottomNav />
    </main>
  );
}
