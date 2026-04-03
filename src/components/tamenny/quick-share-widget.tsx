"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Share2,
  MapPin,
  Clock,
  Check,
  X,
  Navigation,
  Home,
  Briefcase,
  Heart,
  Building2,
  Loader2,
  Copy,
  ExternalLink,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  toArabicNumerals,
  formatArabicDuration,
  formatArabicTimeFromMinutes,
} from "@/lib/arabic-numerals";

// Types
interface QuickShareWidgetProps {
  onShareStart?: (duration: number, destination?: Destination) => void;
  onShareEnd?: () => void;
  isSharing?: boolean;
  currentDuration?: number;
  className?: string;
}

interface Destination {
  id: string;
  name: string;
  address: string;
  icon: React.ReactNode;
  distance: string;
  duration: string;
}

// Preset durations
const PRESET_DURATIONS = [
  { value: 5, label: "٥ دقائق", description: "مشاركة سريعة" },
  { value: 30, label: "٣٠ دقيقة", description: "رحلة قصيرة" },
  { value: 60, label: "ساعة", description: "رحلة متوسطة" },
];

// Preset destinations
const PRESET_DESTINATIONS: Destination[] = [
  {
    id: "home",
    name: "المنزل",
    address: "شارع الملك فيصل",
    icon: <Home className="w-5 h-5" />,
    distance: "٣.٥ كم",
    duration: "١٠ دقائق",
  },
  {
    id: "work",
    name: "العمل",
    address: "وسط البلد",
    icon: <Briefcase className="w-5 h-5" />,
    distance: "٥.٢ كم",
    duration: "١٥ دقيقة",
  },
  {
    id: "family",
    name: "منزل الأهل",
    address: "مصر الجديدة",
    icon: <Heart className="w-5 h-5" />,
    distance: "٨ كم",
    duration: "٢٥ دقيقة",
  },
  {
    id: "other",
    name: "مكان آخر",
    address: "اختر من الخريطة",
    icon: <MapPin className="w-5 h-5" />,
    distance: "--",
    duration: "--",
  },
];

export function QuickShareWidget({
  onShareStart,
  onShareEnd,
  isSharing = false,
  currentDuration = 0,
  className,
}: QuickShareWidgetProps) {
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [remainingTime, setRemainingTime] = useState(currentDuration * 60);

  // Countdown timer when sharing
  useEffect(() => {
    if (!isSharing || currentDuration <= 0) return;

    setRemainingTime(currentDuration * 60);

    const interval = setInterval(() => {
      setRemainingTime((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isSharing, currentDuration]);

  // Handle quick share with preset duration
  const handleQuickShare = (duration: number) => {
    setSelectedDuration(duration);
    setShowDestinationModal(true);
  };

  // Handle destination selection
  const handleSelectDestination = (destination: Destination) => {
    setSelectedDestination(destination);
    setShowDestinationModal(false);
    generateAndShare();
  };

  // Generate share link and share
  const generateAndShare = async () => {
    setIsGeneratingLink(true);
    setShowShareModal(true);

    try {
      // Simulate generating share link
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const link = `${window.location.origin}/share/quick-${Date.now()}`;
      setShareLink(link);

      // Call onShareStart callback
      if (onShareStart && selectedDuration) {
        onShareStart(selectedDuration, selectedDestination || undefined);
      }

      // Try to use Web Share API
      if (navigator.share) {
        try {
          await navigator.share({
            title: "طمنّي - مشاركة الموقع",
            text: `أنا مشارك موقعي معاك لمدة ${formatArabicDuration(selectedDuration || 5, "minutes")}
تابعني لحظة بلحظة من هنا 👇
${link}`,
            url: link,
          });
          toast.success("تمت المشاركة بنجاح!");
        } catch {
          // User cancelled
        }
      }
    } catch {
      toast.error("حدث خطأ أثناء إنشاء رابط المشاركة");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // Copy link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success("تم نسخ الرابط!");
    } catch {
      toast.error("فشل نسخ الرابط");
    }
  };

  // Stop sharing
  const handleStopSharing = () => {
    setShowShareModal(false);
    setSelectedDuration(null);
    setSelectedDestination(null);
    setShareLink("");
    onShareEnd?.();
    toast.success("تم إيقاف المشاركة");
  };

  // Format remaining time
  const formatRemainingTime = () => {
    if (remainingTime <= 0) return "انتهى";
    return formatArabicTimeFromMinutes(Math.ceil(remainingTime / 60));
  };

  // If currently sharing, show status
  if (isSharing) {
    return (
      <Card
        className={cn(
          "p-4 bg-gradient-to-l from-primary/10 to-teal-50 border-primary/20",
          className
        )}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-30" />
            <Share2 className="w-6 h-6 text-white relative z-10" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-primary flex items-center gap-2">
              جاري المشاركة
              <Badge className="bg-green-100 text-green-700 gap-1 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                مباشر
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              الوقت المتبقي: {formatRemainingTime()}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleStopSharing}
            className="rounded-xl border-red-300 text-red-600 hover:bg-red-50 hover:border-red-500"
          >
            <X className="w-4 h-4 ml-1" />
            إيقاف
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className={cn("p-4", className)}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            <span className="font-bold">مشاركة سريعة</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary"
            onClick={() => setShowDestinationModal(true)}
          >
            <MapPin className="w-4 h-4 ml-1" />
            وجهة
          </Button>
        </div>

        {/* Preset duration buttons */}
        <div className="grid grid-cols-3 gap-2">
          {PRESET_DURATIONS.map((duration) => (
            <button
              key={duration.value}
              onClick={() => handleQuickShare(duration.value)}
              className={cn(
                "p-3 rounded-xl border-2 transition-all text-center",
                "hover:border-primary hover:bg-primary/5 hover:shadow-md",
                "active:scale-95 active:bg-primary/10"
              )}
            >
              <Clock className="w-5 h-5 mx-auto text-primary mb-1" />
              <div className="font-bold text-sm">{duration.label}</div>
              <div className="text-xs text-muted-foreground">{duration.description}</div>
            </button>
          ))}
        </div>

        {/* Selected destination indicator */}
        {selectedDestination && (
          <div className="mt-3 p-3 bg-primary/5 rounded-xl border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                {selectedDestination.icon}
              </div>
              <div className="flex-1">
                <div className="font-medium">{selectedDestination.name}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>{selectedDestination.distance}</span>
                  <span>•</span>
                  <span>{selectedDestination.duration}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setSelectedDestination(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Share button */}
        <Button
          onClick={generateAndShare}
          className="w-full mt-3 rounded-xl bg-primary hover:bg-teal-700 text-white gap-2"
          disabled={isGeneratingLink}
        >
          {isGeneratingLink ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري الإنشاء...
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              مشاركة الآن
            </>
          )}
        </Button>
      </Card>

      {/* Destination Selection Modal */}
      <Dialog open={showDestinationModal} onOpenChange={setShowDestinationModal}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-lg">اختر وجهة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground text-center">
              حدد وجهتك لتتبع رحلتك وإعلام جهات الاتصال
            </p>

            <div className="space-y-2">
              {PRESET_DESTINATIONS.map((destination) => (
                <button
                  key={destination.id}
                  onClick={() => handleSelectDestination(destination)}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-right transition-all",
                    "hover:border-primary hover:bg-primary/5",
                    selectedDestination?.id === destination.id
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      {destination.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {destination.name}
                        {selectedDestination?.id === destination.id && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {destination.address}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                        <span>{destination.distance}</span>
                        <span>•</span>
                        <span>{destination.duration}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => setShowDestinationModal(false)}
            >
              إلغاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Link Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-lg">مشاركة الموقع</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isGeneratingLink ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">جاري إنشاء رابط المشاركة...</p>
              </div>
            ) : (
              <>
                {/* Share info */}
                <div className="p-4 bg-primary/5 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-primary">تم إنشاء الرابط</div>
                      <div className="text-sm text-muted-foreground">
                        مدة المشاركة: {formatArabicDuration(selectedDuration || 5, "minutes")}
                      </div>
                    </div>
                  </div>

                  {selectedDestination && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>الوجهة: {selectedDestination.name}</span>
                    </div>
                  )}
                </div>

                {/* Share link */}
                <div className="p-3 bg-muted rounded-xl">
                  <div className="text-xs text-muted-foreground mb-1">رابط المشاركة</div>
                  <div className="text-sm font-mono break-all">{shareLink}</div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="rounded-xl gap-2"
                    onClick={handleCopyLink}
                  >
                    <Copy className="w-4 h-4" />
                    نسخ الرابط
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl gap-2"
                    onClick={() => window.open(shareLink, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4" />
                    فتح الرابط
                  </Button>
                </div>

                {/* Stop sharing */}
                <Button
                  variant="destructive"
                  className="w-full rounded-xl"
                  onClick={handleStopSharing}
                >
                  <X className="w-4 h-4 ml-2" />
                  إيقاف المشاركة
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Compact version for inline use
export function QuickShareCompact({
  onShareStart,
  className,
}: {
  onShareStart?: (duration: number) => void;
  className?: string;
}) {
  const [showDurations, setShowDurations] = useState(false);

  return (
    <div className={cn("relative", className)}>
      <Button
        onClick={() => setShowDurations(!showDurations)}
        className="rounded-xl bg-primary hover:bg-teal-700 text-white gap-2"
      >
        <Share2 className="w-4 h-4" />
        مشاركة سريعة
      </Button>

      {showDurations && (
        <Card className="absolute top-full mt-2 right-0 z-50 p-2 min-w-[180px] animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            {PRESET_DURATIONS.map((duration) => (
              <button
                key={duration.value}
                onClick={() => {
                  onShareStart?.(duration.value);
                  setShowDurations(false);
                }}
                className="w-full p-2 rounded-lg text-right hover:bg-primary/5 transition-colors flex items-center gap-2"
              >
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm">{duration.label}</span>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
