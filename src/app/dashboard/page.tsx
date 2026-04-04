"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Loader2,
} from "lucide-react";
import { BottomNav, Header } from "@/components/tamenny/bottom-nav";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import {
  toArabicNumerals,
  formatArabicDistance,
  formatArabicDuration,
} from "@/lib/arabic-numerals";

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

interface Trip {
  id: string;
  startTime: string;
  endTime: string | null;
  distance: number;
  startLat: number | null;
  startLng: number | null;
  endLat: number | null;
  endLng: number | null;
  destination: string | null;
  status: string;
}

interface DashboardStats {
  totalTrips: number;
  totalDistance: number;
  totalTime: number;
  avgSpeed: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [timeRange, setTimeRange] = useState<"week" | "month">("week");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalTrips: 0,
    totalDistance: 0,
    totalTime: 0,
    avgSpeed: 0,
  });
  const [weeklyData, setWeeklyData] = useState<{ day: string; trips: number; distance: number }[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ week: string; trips: number; distance: number }[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch dashboard data
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch trips data
        const response = await fetch('/api/trips?time=month');
        const data = await response.json();
        
        if (data.success) {
          setTrips(data.trips || []);
          setStats({
            totalTrips: data.stats.totalTrips || 0,
            totalDistance: data.stats.totalDistance || 0,
            totalTime: data.stats.totalTime || 0,
            avgSpeed: data.stats.avgSpeed || 0,
          });

          // Generate weekly data from trips
          const days = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
          const weekData = days.map(day => ({
            day,
            trips: 0,
            distance: 0,
          }));
          
          // Group trips by day
          data.trips.forEach((trip: { startTime: string; distance: number }) => {
            const date = new Date(trip.startTime);
            const dayIndex = date.getDay();
            const arabicDayIndex = (dayIndex + 6) % 7; // Convert to Arabic week (Saturday = 0)
            weekData[arabicDayIndex].trips += 1;
            weekData[arabicDayIndex].distance += trip.distance;
          });
          
          setWeeklyData(weekData);

          // Generate monthly data by grouping trips into weeks
          const now = new Date();
          const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
          const monthData = [
            { week: 'الأسبوع 1', start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: now, trips: 0, distance: 0 },
            { week: 'الأسبوع 2', start: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), end: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), trips: 0, distance: 0 },
            { week: 'الأسبوع 3', start: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000), end: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), trips: 0, distance: 0 },
            { week: 'الأسبوع 4', start: fourWeeksAgo, end: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000), trips: 0, distance: 0 },
          ];

          data.trips.forEach((trip: { startTime: string; distance: number }) => {
            const tripDate = new Date(trip.startTime);
            for (let i = 0; i < monthData.length; i++) {
              if (tripDate >= monthData[i].start && tripDate < monthData[i].end) {
                monthData[i].trips += 1;
                monthData[i].distance += trip.distance;
                break;
              }
            }
          });

          setMonthlyData(monthData.map(w => ({ week: w.week, trips: w.trips, distance: w.distance })));
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated]);

  const handleExport = () => {
    if (trips.length === 0) {
      toast.error("لا توجد رحلات لتصديرها");
      return;
    }

    // Generate CSV content
    const headers = ['التاريخ', 'المسافة (كم)', 'الوجهة', 'الحالة', 'المدة (دقيقة)'];
    const rows = trips.map(trip => {
      const startTime = new Date(trip.startTime);
      const endTime = trip.endTime ? new Date(trip.endTime) : null;
      const duration = endTime 
        ? Math.round((endTime.getTime() - startTime.getTime()) / 60000)
        : 0;
      return [
        startTime.toLocaleDateString('ar-EG'),
        trip.distance.toFixed(2),
        trip.destination || '—',
        trip.status === 'completed' ? 'مكتملة' : 'نشطة',
        duration.toString()
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tamenny-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("تم تصدير التقرير بنجاح");
  };

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case "car": return <Car className="w-4 h-4" />;
      case "walking": return <Footprints className="w-4 h-4" />;
      case "bike": return <Bike className="w-4 h-4" />;
      default: return <Car className="w-4 h-4" />;
    }
  };

  // Calculate safety score (based on completed trips)
  const safetyScore = stats.totalTrips > 0 ? Math.min(100, stats.totalTrips * 2) : 0;

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

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-muted-foreground mt-2">جاري تحميل الإحصائيات...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && stats.totalTrips === 0 && (
          <Card className="p-8 text-center card-shadow">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Route className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-2">لا توجد رحلات بعد</h3>
            <p className="text-muted-foreground mb-4">
              ابدأ مشاركة موقعك لترى إحصائياتك هنا
            </p>
            <Button onClick={() => router.push('/')} className="gap-2">
              <Share2 className="w-4 h-4" />
              ابدأ الآن
            </Button>
          </Card>
        )}

        {/* Stats Overview Cards */}
        {!loading && stats.totalTrips > 0 && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 card-shadow bg-gradient-to-br from-primary to-teal-dark text-white overflow-hidden relative">
                <div className="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full -translate-x-8 -translate-y-8" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Route className="w-5 h-5" />
                    <span className="text-sm text-white/80">إجمالي الرحلات</span>
                  </div>
                  <div className="text-3xl font-bold">{toArabicNumerals(stats.totalTrips)}</div>
                </div>
              </Card>

              <Card className="p-4 card-shadow bg-gradient-to-br from-green-500 to-green-600 text-white overflow-hidden relative">
                <div className="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full -translate-x-8 -translate-y-8" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5" />
                    <span className="text-sm text-white/80">إجمالي المسافة</span>
                  </div>
                  <div className="text-3xl font-bold">{formatArabicDistance(stats.totalDistance, "km")}</div>
                </div>
              </Card>

              <Card className="p-4 card-shadow bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative">
                <div className="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full -translate-x-8 -translate-y-8" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Timer className="w-5 h-5" />
                    <span className="text-sm text-white/80">إجمالي الوقت</span>
                  </div>
                  <div className="text-3xl font-bold">{formatArabicDuration(stats.totalTime, "hours")}</div>
                </div>
              </Card>

              <Card className="p-4 card-shadow bg-gradient-to-br from-amber-500 to-amber-600 text-white overflow-hidden relative">
                <div className="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full -translate-x-8 -translate-y-8" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5" />
                    <span className="text-sm text-white/80">نقاط الأمان</span>
                  </div>
                  <div className="text-3xl font-bold">{toArabicNumerals(safetyScore)}</div>
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
          </>
        )}

        {/* Quick Actions */}
        <Card className="p-4 card-shadow">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            إجراءات سريعة
          </h3>
          <div className="grid grid-cols-4 gap-3">
            <Link href="/" className="flex flex-col items-center gap-2 p-3 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors">
              <Share2 className="w-6 h-6 text-primary" />
              <span className="text-xs">مشاركة</span>
            </Link>
            <Link href="/contacts" className="flex flex-col items-center gap-2 p-3 rounded-xl bg-blue-100 hover:bg-blue-200 transition-colors dark:bg-blue-900/30">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span className="text-xs">جهات الاتصال</span>
            </Link>
            <Link href="/history" className="flex flex-col items-center gap-2 p-3 rounded-xl bg-green-100 hover:bg-green-200 transition-colors dark:bg-green-900/30">
              <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
              <span className="text-xs">السجل</span>
            </Link>
            <Link href="/safe-zones" className="flex flex-col items-center gap-2 p-3 rounded-xl bg-purple-100 hover:bg-purple-200 transition-colors dark:bg-purple-900/30">
              <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <span className="text-xs">مناطق آمنة</span>
            </Link>
          </div>
        </Card>

        {/* Weekly Summary Card */}
        {!loading && stats.totalTrips > 0 && (
          <Card className="p-4 card-shadow bg-gradient-to-l from-primary/10 to-teal-dark/5 border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">ملخص نشاطك</h3>
                <p className="text-sm text-muted-foreground">
                  {stats.totalTrips > 0 ? "استمر في هذا المستوى الرائع!" : "ابدأ مشاركة موقعك اليوم"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-xl">
                <div className="text-2xl font-bold text-primary">{toArabicNumerals(stats.totalTrips)}</div>
                <div className="text-xs text-muted-foreground">رحلة</div>
              </div>
              <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-xl">
                <div className="text-2xl font-bold text-green-600">{formatArabicDistance(stats.totalDistance, "km")}</div>
                <div className="text-xs text-muted-foreground">مسافة</div>
              </div>
              <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-xl">
                <div className="text-2xl font-bold text-blue-600">{formatArabicDuration(stats.totalTime, "hours")}</div>
                <div className="text-xs text-muted-foreground">وقت</div>
              </div>
            </div>
          </Card>
        )}

        {/* Tips Card */}
        <Card className="p-4 card-shadow bg-gradient-to-l from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-800 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-blue-800 dark:text-blue-300">نصائح للسلامة</h3>
              <ul className="text-sm text-blue-700 dark:text-blue-400 mt-2 space-y-1">
                <li>• شارك موقعك دائماً عند السفر لمكان جديد</li>
                <li>• أضف جهات اتصال الطوارئ للوصول السريع</li>
                <li>• حدد مناطق آمنة للحصول على تنبيهات</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Export Report Button */}
        {!loading && stats.totalTrips > 0 && (
          <Button
            onClick={handleExport}
            className="w-full h-12 rounded-xl bg-gradient-to-l from-primary to-teal-dark hover:opacity-90 transition-opacity"
          >
            <Download className="w-5 h-5 ml-2" />
            تصدير التقرير الكامل
          </Button>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
