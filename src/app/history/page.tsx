"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  MapPin,
  Navigation,
  Clock,
  Calendar,
  ChevronLeft,
  Share2,
  Trash2,
  Download,
  Filter,
  TrendingUp,
  Route,
  Car,
  Footprints,
  Bike,
  CheckCircle,
  XCircle,
  Timer,
  Zap,
  BarChart3,
} from "lucide-react";
import { BottomNav, Header } from "@/components/tamenny/bottom-nav";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Mock session history
const SESSION_HISTORY = [
  {
    id: "1",
    destination: "المكتب",
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    endTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
    distance: 5.2,
    duration: 32,
    status: "completed",
    sharedWith: ["أحمد", "محمد"],
    transportMode: "car",
  },
  {
    id: "2",
    destination: "منزل الأهل",
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() - 23 * 60 * 60 * 1000),
    distance: 12.5,
    duration: 45,
    status: "completed",
    sharedWith: ["سارة"],
    transportMode: "car",
  },
  {
    id: "3",
    destination: "الجامعة",
    startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 35 * 60 * 1000),
    distance: 8.7,
    duration: 35,
    status: "completed",
    sharedWith: ["مجموعة العائلة"],
    transportMode: "walking",
  },
  {
    id: "4",
    destination: "المطار",
    startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endTime: null,
    distance: 25.3,
    duration: 55,
    status: "cancelled",
    sharedWith: ["أحمد"],
    transportMode: "car",
  },
  {
    id: "5",
    destination: "النادي",
    startTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000),
    distance: 3.2,
    duration: 20,
    status: "completed",
    sharedWith: ["محمد", "خالد"],
    transportMode: "bike",
  },
];

type FilterType = "all" | "completed" | "cancelled";
type TimeFilter = "week" | "month" | "all";

export default function HistoryPage() {
  const [selectedSession, setSelectedSession] = useState<typeof SESSION_HISTORY[0] | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");

  const filteredSessions = SESSION_HISTORY.filter((session) => {
    if (filter === "all") return true;
    return session.status === filter;
  }).filter((session) => {
    const now = new Date();
    const sessionDate = new Date(session.startTime);
    if (timeFilter === "week") {
      return (now.getTime() - sessionDate.getTime()) < 7 * 24 * 60 * 60 * 1000;
    }
    if (timeFilter === "month") {
      return (now.getTime() - sessionDate.getTime()) < 30 * 24 * 60 * 60 * 1000;
    }
    return true;
  });

  // Stats
  const totalDistance = SESSION_HISTORY.filter(s => s.status === "completed").reduce((acc, s) => acc + s.distance, 0);
  const totalTrips = SESSION_HISTORY.filter(s => s.status === "completed").length;
  const totalTime = SESSION_HISTORY.filter(s => s.status === "completed").reduce((acc, s) => acc + s.duration, 0);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ar-EG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleShare = (session: typeof SESSION_HISTORY[0]) => {
    toast.success("تم نسخ تفاصيل الرحلة!");
  };

  const handleDelete = (session: typeof SESSION_HISTORY[0]) => {
    toast.success("تم حذف الرحلة من السجل");
    setSelectedSession(null);
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
          <h1 className="text-xl font-bold">سجل الرحلات</h1>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            تصدير
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center card-shadow">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Route className="w-5 h-5 text-primary" />
            </div>
            <div className="text-2xl font-bold text-primary">{totalTrips}</div>
            <div className="text-xs text-muted-foreground">رحلة</div>
          </Card>
          <Card className="p-4 text-center card-shadow">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-2">
              <MapPin className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{totalDistance.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">كم</div>
          </Card>
          <Card className="p-4 text-center card-shadow">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-2">
              <Timer className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{Math.round(totalTime / 60)}</div>
            <div className="text-xs text-muted-foreground">ساعة</div>
          </Card>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Time filter */}
          <div className="flex gap-2">
            {[
              { value: "week", label: "هذا الأسبوع" },
              { value: "month", label: "هذا الشهر" },
              { value: "all", label: "الكل" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTimeFilter(opt.value as TimeFilter)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm transition-all border-2",
                  timeFilter === opt.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex gap-2">
            {[
              { value: "all", label: "الكل", icon: BarChart3 },
              { value: "completed", label: "مكتملة", icon: CheckCircle },
              { value: "cancelled", label: "ملغاة", icon: XCircle },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value as FilterType)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-2 border-2",
                  filter === opt.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                <opt.icon className="w-4 h-4" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Session List */}
        <div className="space-y-3">
          {filteredSessions.length === 0 ? (
            <Card className="p-8 text-center card-shadow">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Route className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">لا توجد رحلات في هذه الفترة</p>
            </Card>
          ) : (
            filteredSessions.map((session) => (
              <Card
                key={session.id}
                className="p-4 card-shadow cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5 border border-transparent hover:border-primary/20"
                onClick={() => setSelectedSession(session)}
              >
                <div className="flex items-start gap-3">
                  {/* Status Icon */}
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                    session.status === "completed"
                      ? "bg-green-100"
                      : "bg-red-100"
                  )}>
                    {session.status === "completed" ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{session.destination}</span>
                      <Badge variant="secondary" className="shrink-0 gap-1">
                        {getTransportIcon(session.transportMode)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(session.startTime)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1 text-sm">
                        <MapPin className="w-3 h-3 text-primary" />
                        <span className="font-medium">{session.distance} كم</span>
                      </span>
                      <span className="flex items-center gap-1 text-sm">
                        <Clock className="w-3 h-3 text-blue-600" />
                        <span className="font-medium">{session.duration} دقيقة</span>
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronLeft className="w-5 h-5 text-muted-foreground shrink-0" />
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Weekly Summary */}
        <Card className="p-4 card-shadow bg-gradient-to-l from-primary/10 to-teal-dark/5 border-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">ملخص الأسبوع</h3>
              <p className="text-xs text-muted-foreground">تحسن بنسبة ١٥٪ عن الأسبوع الماضي</p>
            </div>
          </div>
          
          {/* Progress bars */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>المسافة المقطوعة</span>
                <span className="font-medium">٤٥ كم</span>
              </div>
              <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '75%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>الوقت المستغرق</span>
                <span className="font-medium">٣ ساعات</span>
              </div>
              <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '60%' }} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <BottomNav />

      {/* Session Detail Modal */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">تفاصيل الرحلة</DialogTitle>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4 py-4">
              {/* Destination */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg">{selectedSession.destination}</h3>
                <Badge
                  variant="secondary"
                  className={cn(
                    "mt-2",
                    selectedSession.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  )}
                >
                  {selectedSession.status === "completed" ? "مكتملة" : "ملغاة"}
                </Badge>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-muted/50 rounded-xl">
                  <MapPin className="w-5 h-5 text-primary mx-auto mb-1" />
                  <div className="font-bold">{selectedSession.distance}</div>
                  <div className="text-xs text-muted-foreground">كم</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-xl">
                  <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <div className="font-bold">{selectedSession.duration}</div>
                  <div className="text-xs text-muted-foreground">دقيقة</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-xl">
                  {getTransportIcon(selectedSession.transportMode)}
                  <div className="font-bold mt-1">
                    {selectedSession.transportMode === "car" ? "سيارة" : selectedSession.transportMode === "walking" ? "مشي" : "دراجة"}
                  </div>
                  <div className="text-xs text-muted-foreground">النوع</div>
                </div>
              </div>

              {/* Time info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                  <span className="text-muted-foreground">وقت البدء</span>
                  <span className="font-medium">{formatTime(new Date(selectedSession.startTime))}</span>
                </div>
                {selectedSession.endTime && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                    <span className="text-muted-foreground">وقت الوصول</span>
                    <span className="font-medium">{formatTime(new Date(selectedSession.endTime))}</span>
                  </div>
                )}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                  <span className="text-muted-foreground">التاريخ</span>
                  <span className="font-medium">{formatDate(new Date(selectedSession.startTime))}</span>
                </div>
              </div>

              {/* Shared with */}
              <div className="p-3 bg-muted/50 rounded-xl">
                <span className="text-sm text-muted-foreground">تمت المشاركة مع:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedSession.sharedWith.map((person) => (
                    <Badge key={person} variant="secondary" className="gap-1">
                      {person}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => handleDelete(selectedSession)}
                >
                  <Trash2 className="w-4 h-4 ml-2" />
                  حذف
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-primary"
                  onClick={() => handleShare(selectedSession)}
                >
                  <Share2 className="w-4 h-4 ml-2" />
                  مشاركة
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
