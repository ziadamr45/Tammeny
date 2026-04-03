"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, LineChart, Line } from "recharts";
import {
  MapPin,
  Clock,
  Shield,
  TrendingUp,
  Download,
  Share2,
  Users,
  Zap,
  Target,
  Route,
  Trophy,
  Medal,
  Crown,
  Sparkles,
  BarChart3,
  Activity,
  Timer,
  CheckCircle,
  AlertTriangle,
  Home,
  Building2,
  GraduationCap,
  ShoppingBag,
  Heart,
  Footprints,
  Car,
  Bike,
  Eye,
} from "lucide-react";
import { BottomNav, Header } from "@/components/tamenny/bottom-nav";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

// Weekly activity data
const weeklyData = [
  { day: "السبت", trips: 3, distance: 12.5 },
  { day: "الأحد", trips: 5, distance: 18.2 },
  { day: "الاثنين", trips: 2, distance: 8.7 },
  { day: "الثلاثاء", trips: 4, distance: 15.3 },
  { day: "الأربعاء", trips: 6, distance: 22.1 },
  { day: "الخميس", trips: 3, distance: 11.8 },
  { day: "الجمعة", trips: 1, distance: 4.2 },
];

// Monthly activity data
const monthlyData = [
  { week: "الأسبوع 1", trips: 18, distance: 78 },
  { week: "الأسبوع 2", trips: 22, distance: 95 },
  { week: "الأسبوع 3", trips: 15, distance: 62 },
  { week: "الأسبوع 4", trips: 20, distance: 88 },
];

// Most visited places
const mostVisitedPlaces = [
  { id: "1", name: "المكتب", visits: 45, icon: Building2, color: "bg-blue-100 text-blue-600" },
  { id: "2", name: "المنزل", visits: 42, icon: Home, color: "bg-green-100 text-green-600" },
  { id: "3", name: "الجامعة", visits: 28, icon: GraduationCap, color: "bg-purple-100 text-purple-600" },
  { id: "4", name: "المول", visits: 15, icon: ShoppingBag, color: "bg-orange-100 text-orange-600" },
  { id: "5", name: "منزل الأهل", visits: 12, icon: Heart, color: "bg-pink-100 text-pink-600" },
];

// Recent activities
const recentActivities = [
  {
    id: "1",
    type: "trip",
    title: "رحلة إلى المكتب",
    time: "منذ ساعتين",
    distance: "5.2 كم",
    duration: "32 دقيقة",
    status: "completed",
    transportMode: "car",
  },
  {
    id: "2",
    type: "sharing",
    title: "مشاركة مع أحمد",
    time: "منذ 4 ساعات",
    duration: "15 دقيقة",
    status: "completed",
  },
  {
    id: "3",
    type: "trip",
    title: "رحلة إلى الجامعة",
    time: "أمس",
    distance: "8.7 كم",
    duration: "35 دقيقة",
    status: "completed",
    transportMode: "walking",
  },
  {
    id: "4",
    type: "alert",
    title: "تنبيه أمان",
    time: "منذ يومين",
    description: "تم تجاوز المنطقة الآمنة",
    status: "resolved",
  },
  {
    id: "5",
    type: "trip",
    title: "رحلة إلى النادي",
    time: "منذ 3 أيام",
    distance: "3.2 كم",
    duration: "20 دقيقة",
    status: "completed",
    transportMode: "bike",
  },
];

// Safety achievements/badges
const achievements = [
  {
    id: "1",
    title: "راكب آمن",
    description: "أكمل 50 رحلة بأمان",
    icon: Shield,
    progress: 100,
    unlocked: true,
    color: "bg-primary",
  },
  {
    id: "2",
    title: "مستكشف",
    description: "زرت 10 أماكن مختلفة",
    icon: MapPin,
    progress: 80,
    unlocked: false,
    color: "bg-blue-500",
  },
  {
    id: "3",
    title: "مشارك نشط",
    description: "شارك موقعك 100 مرة",
    icon: Share2,
    progress: 65,
    unlocked: false,
    color: "bg-purple-500",
  },
  {
    id: "4",
    title: "صديق البيئة",
    description: "استخدم وسائل نقل صديقة للبيئة",
    icon: Sparkles,
    progress: 45,
    unlocked: false,
    color: "bg-green-500",
  },
  {
    id: "5",
    title: "ملك الطرق",
    description: "قطع 500 كم",
    icon: Crown,
    progress: 31,
    unlocked: false,
    color: "bg-yellow-500",
  },
];

// Chart config
const chartConfig = {
  trips: {
    label: "الرحلات",
    color: "#0D7377",
  },
  distance: {
    label: "المسافة",
    color: "#14B8A6",
  },
};

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<"week" | "month">("week");

  // Stats
  const totalTrips = 156;
  const totalDistance = 842.5;
  const totalTime = 2840; // minutes
  const safetyScore = 95;

  const handleExport = () => {
    toast.success("جاري تصدير التقرير...");
  };

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case "car": return <Car className="w-4 h-4" />;
      case "walking": return <Footprints className="w-4 h-4" />;
      case "bike": return <Bike className="w-4 h-4" />;
      default: return <Car className="w-4 h-4" />;
    }
  };

  return (
    <main className="min-h-screen bg-background pb-20">
      <Header />

      <div className="pt-16 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">لوحة التحليلات</h1>
            <p className="text-sm text-muted-foreground">إحصائيات وأنشطة الرحلات</p>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            تصدير
          </Button>
        </div>

        {/* Stats Overview Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 card-shadow bg-gradient-to-br from-primary to-teal-dark text-white overflow-hidden relative">
            <div className="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full -translate-x-8 -translate-y-8" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Route className="w-5 h-5" />
                <span className="text-sm text-white/80">إجمالي الرحلات</span>
              </div>
              <div className="text-3xl font-bold">{totalTrips}</div>
              <div className="flex items-center gap-1 mt-1 text-sm text-white/80">
                <TrendingUp className="w-3 h-3" />
                <span>+12% هذا الأسبوع</span>
              </div>
            </div>
          </Card>

          <Card className="p-4 card-shadow bg-gradient-to-br from-green-500 to-green-600 text-white overflow-hidden relative">
            <div className="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full -translate-x-8 -translate-y-8" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5" />
                <span className="text-sm text-white/80">إجمالي المسافة</span>
              </div>
              <div className="text-3xl font-bold">{totalDistance.toFixed(1)}</div>
              <div className="text-sm text-white/80 mt-1">كيلومتر</div>
            </div>
          </Card>

          <Card className="p-4 card-shadow bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative">
            <div className="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full -translate-x-8 -translate-y-8" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Timer className="w-5 h-5" />
                <span className="text-sm text-white/80">إجمالي الوقت</span>
              </div>
              <div className="text-3xl font-bold">{Math.round(totalTime / 60)}</div>
              <div className="text-sm text-white/80 mt-1">ساعة</div>
            </div>
          </Card>

          <Card className="p-4 card-shadow bg-gradient-to-br from-amber-500 to-amber-600 text-white overflow-hidden relative">
            <div className="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full -translate-x-8 -translate-y-8" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5" />
                <span className="text-sm text-white/80">نقاط الأمان</span>
              </div>
              <div className="text-3xl font-bold">{safetyScore}</div>
              <div className="text-sm text-white/80 mt-1">من 100</div>
            </div>
          </Card>
        </div>

        {/* Activity Chart */}
        <Card className="p-4 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              نشاط الرحلات
            </h3>
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              <button
                onClick={() => setTimeRange("week")}
                className={cn(
                  "px-3 py-1 rounded-md text-sm transition-all",
                  timeRange === "week"
                    ? "bg-primary text-white"
                    : "hover:bg-muted-foreground/10"
                )}
              >
                أسبوعي
              </button>
              <button
                onClick={() => setTimeRange("month")}
                className={cn(
                  "px-3 py-1 rounded-md text-sm transition-all",
                  timeRange === "month"
                    ? "bg-primary text-white"
                    : "hover:bg-muted-foreground/10"
                )}
              >
                شهري
              </button>
            </div>
          </div>

          <ChartContainer config={chartConfig} className="h-[200px]">
            {timeRange === "week" ? (
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="trips"
                  fill="#0D7377"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            ) : (
              <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="week"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="trips"
                  stroke="#0D7377"
                  strokeWidth={3}
                  dot={{ fill: "#0D7377", r: 4 }}
                />
              </LineChart>
            )}
          </ChartContainer>

          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-sm text-muted-foreground">الرحلات</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-teal-light" />
              <span className="text-sm text-muted-foreground">المسافة (كم)</span>
            </div>
          </div>
        </Card>

        {/* Trip Comparison */}
        <Card className="p-4 card-shadow">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            مقارنة الرحلات
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-primary/10 rounded-xl text-center">
              <div className="text-2xl font-bold text-primary">24</div>
              <div className="text-sm text-muted-foreground">هذا الأسبوع</div>
              <div className="flex items-center justify-center gap-1 mt-2 text-green-600 text-sm">
                <TrendingUp className="w-3 h-3" />
                <span>+26%</span>
              </div>
            </div>
            <div className="p-4 bg-muted/50 rounded-xl text-center">
              <div className="text-2xl font-bold">19</div>
              <div className="text-sm text-muted-foreground">الأسبوع الماضي</div>
            </div>
          </div>

          {/* Visual comparison bar */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-sm w-24">هذا الأسبوع</span>
              <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-l from-primary to-teal-light rounded-full"
                  style={{ width: '80%' }}
                />
              </div>
              <span className="text-sm font-medium">24</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm w-24">الأسبوع الماضي</span>
              <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-400 rounded-full"
                  style={{ width: '63%' }}
                />
              </div>
              <span className="text-sm font-medium">19</span>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-4 card-shadow">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            إجراءات سريعة
          </h3>
          <div className="grid grid-cols-4 gap-3">
            <Link href="/share" className="flex flex-col items-center gap-2 p-3 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors">
              <Share2 className="w-6 h-6 text-primary" />
              <span className="text-xs">مشاركة</span>
            </Link>
            <Link href="/contacts" className="flex flex-col items-center gap-2 p-3 rounded-xl bg-blue-100 hover:bg-blue-200 transition-colors">
              <Users className="w-6 h-6 text-blue-600" />
              <span className="text-xs">جهات الاتصال</span>
            </Link>
            <Link href="/history" className="flex flex-col items-center gap-2 p-3 rounded-xl bg-green-100 hover:bg-green-200 transition-colors">
              <Clock className="w-6 h-6 text-green-600" />
              <span className="text-xs">السجل</span>
            </Link>
            <Link href="/safe-zones" className="flex flex-col items-center gap-2 p-3 rounded-xl bg-purple-100 hover:bg-purple-200 transition-colors">
              <Shield className="w-6 h-6 text-purple-600" />
              <span className="text-xs">مناطق آمنة</span>
            </Link>
          </div>
        </Card>

        {/* Most Visited Places */}
        <Card className="p-4 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              الأماكن الأكثر زيارة
            </h3>
          </div>
          <div className="space-y-3">
            {mostVisitedPlaces.map((place, index) => (
              <div
                key={place.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", place.color)}>
                  <place.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{place.name}</div>
                  <div className="text-sm text-muted-foreground">{place.visits} زيارة</div>
                </div>
                <div className="flex items-center gap-1">
                  {index < 3 && (
                    <Medal className={cn(
                      "w-5 h-5",
                      index === 0 ? "text-yellow-500" : index === 1 ? "text-gray-400" : "text-amber-600"
                    )} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Safety Achievements */}
        <Card className="p-4 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              إنجازات الأمان
            </h3>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              1/5 مكتملة
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={cn(
                  "p-3 rounded-xl border-2 transition-all",
                  achievement.unlocked
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    achievement.unlocked ? achievement.color : "bg-muted"
                  )}>
                    <achievement.icon className={cn(
                      "w-6 h-6",
                      achievement.unlocked ? "text-white" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{achievement.title}</span>
                      {achievement.unlocked && (
                        <CheckCircle className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{achievement.description}</div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">التقدم</span>
                        <span className="font-medium">{achievement.progress}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            achievement.unlocked ? "bg-primary" : "bg-gray-400"
                          )}
                          style={{ width: `${achievement.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="p-4 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              آخر الأنشطة
            </h3>
            <Link href="/history" className="text-sm text-primary hover:underline">
              عرض الكل
            </Link>
          </div>
          <ScrollArea className="h-[300px] -mx-4 px-4">
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  {/* Activity Icon */}
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    activity.type === "trip"
                      ? "bg-primary/10"
                      : activity.type === "sharing"
                      ? "bg-blue-100"
                      : "bg-amber-100"
                  )}>
                    {activity.type === "trip" && getTransportIcon(activity.transportMode || "car")}
                    {activity.type === "sharing" && <Eye className="w-5 h-5 text-blue-600" />}
                    {activity.type === "alert" && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                  </div>

                  {/* Activity Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{activity.title}</span>
                      {activity.status === "completed" && (
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{activity.time}</div>
                    {activity.type === "trip" && (
                      <div className="flex items-center gap-4 mt-1">
                        {activity.distance && (
                          <span className="flex items-center gap-1 text-xs">
                            <MapPin className="w-3 h-3 text-primary" />
                            {activity.distance}
                          </span>
                        )}
                        {activity.duration && (
                          <span className="flex items-center gap-1 text-xs">
                            <Clock className="w-3 h-3 text-blue-600" />
                            {activity.duration}
                          </span>
                        )}
                      </div>
                    )}
                    {activity.type === "alert" && activity.description && (
                      <div className="text-sm text-amber-600 mt-1">{activity.description}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Weekly Summary Card */}
        <Card className="p-4 card-shadow bg-gradient-to-l from-primary/10 to-teal-dark/5 border-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold">ملخص الأسبوع</h3>
              <p className="text-sm text-muted-foreground">أداء ممتاز! استمر بهذا المستوى</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 bg-white/50 rounded-xl">
              <div className="text-2xl font-bold text-primary">24</div>
              <div className="text-xs text-muted-foreground">رحلة</div>
            </div>
            <div className="text-center p-3 bg-white/50 rounded-xl">
              <div className="text-2xl font-bold text-green-600">92</div>
              <div className="text-xs text-muted-foreground">كم</div>
            </div>
            <div className="text-center p-3 bg-white/50 rounded-xl">
              <div className="text-2xl font-bold text-blue-600">4.5</div>
              <div className="text-xs text-muted-foreground">ساعة</div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>هدف الرحلات الأسبوعي</span>
                <span className="font-medium">24/30</span>
              </div>
              <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-l from-primary to-teal-light rounded-full" style={{ width: '80%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>هدف المسافة الأسبوعي</span>
                <span className="font-medium">92/100 كم</span>
              </div>
              <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '92%' }} />
              </div>
            </div>
          </div>
        </Card>

        {/* Export Report Button */}
        <Button
          onClick={handleExport}
          className="w-full h-12 rounded-xl bg-gradient-to-l from-primary to-teal-dark hover:opacity-90 transition-opacity"
        >
          <Download className="w-5 h-5 ml-2" />
          تصدير التقرير الكامل
        </Button>
      </div>

      <BottomNav />
    </main>
  );
}
