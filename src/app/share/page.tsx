"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Share2,
  Clock,
  MapPin,
  Navigation,
  Shield,
  Eye,
  Lock,
  Copy,
  Check,
  Users,
  Plus,
  X,
} from "lucide-react";
import { BottomNav, Header } from "@/components/tamenny/bottom-nav";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DURATION_OPTIONS = [
  { value: 5, label: "٥ دقائق", description: "مشاركة سريعة" },
  { value: 30, label: "٣٠ دقيقة", description: "رحلة قصيرة" },
  { value: 60, label: "ساعة واحدة", description: "رحلة متوسطة" },
  { value: 120, label: "ساعتين", description: "رحلة طويلة" },
  { value: -1, label: "حتى الوصول", description: "تتبع مستمر" },
];

export default function SharePage() {
  const [selectedDuration, setSelectedDuration] = useState(5);
  const [destination, setDestination] = useState("");
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [isRestricted, setIsRestricted] = useState(false);
  const [allowedEmails, setAllowedEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get current location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Use mock location
          setLocation({ lat: 30.0444, lng: 31.2357 });
        }
      );
    }
  }, []);

  const handleAddEmail = () => {
    if (newEmail && !allowedEmails.includes(newEmail)) {
      setAllowedEmails([...allowedEmails, newEmail]);
      setNewEmail("");
    }
  };

  const handleRemoveEmail = (email: string) => {
    setAllowedEmails(allowedEmails.filter((e) => e !== email));
  };

  const handleShare = async () => {
    if (!location) {
      toast.error("لم يتم تحديد موقعك بعد");
      return;
    }

    // Generate a mock share link
    const mockEncryptedId = btoa(`session-${Date.now()}`);
    const link = `${window.location.origin}/share/${mockEncryptedId}`;
    setShareLink(link);
    setShowSuccessModal(true);
  };

  const handleCopyLink = async () => {
    const durationText = selectedDuration === -1 
      ? "حتى الوصول" 
      : selectedDuration >= 60 
        ? `${selectedDuration / 60} ساعة` 
        : `${selectedDuration} دقيقة`;

    const shareMessage = `أنا مشارك موقعي معاك لمدة ${durationText} ⏱️
تابعني لحظة بلحظة من هنا 👇
${shareLink}
ولو الرابط فتح عندك متأخر، حمّل التطبيق عشان تشوفني مباشر 📍`;

    await navigator.clipboard.writeText(shareMessage);
    setCopied(true);
    toast.success("تم نسخ الرسالة!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareNative = async () => {
    const durationText = selectedDuration === -1 
      ? "حتى الوصول" 
      : selectedDuration >= 60 
        ? `${selectedDuration / 60} ساعة` 
        : `${selectedDuration} دقيقة`;

    const shareMessage = `أنا مشارك موقعي معاك لمدة ${durationText} ⏱️
تابعني لحظة بلحظة من هنا 👇
${shareLink}
ولو الرابط فتح عندك متأخر، حمّل التطبيق عشان تشوفني مباشر 📍`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "طمنّي - مشاركة الموقع",
          text: shareMessage,
          url: shareLink,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <main className="min-h-screen bg-background pb-20">
      <Header />

      <div className="pt-16 px-4 space-y-6">
        <h1 className="text-xl font-bold">شارك موقعك</h1>

        {/* Duration Selection */}
        <Card className="p-4 card-shadow">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            مدة المشاركة
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedDuration(option.value)}
                className={cn(
                  "p-3 rounded-xl border-2 text-right transition-all",
                  selectedDuration === option.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-muted-foreground">
                  {option.description}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Destination */}
        <Card className="p-4 card-shadow">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            الوجهة (اختياري)
          </h3>
          <Input
            placeholder="ابحث عن وجهة..."
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="bg-secondary border-0 rounded-xl"
          />
          {destination && (
            <div className="mt-3 p-3 bg-primary/10 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-primary" />
                <span className="text-sm">{destination}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDestination("")}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </Card>

        {/* Privacy Options */}
        <Card className="p-4 card-shadow">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            خيارات الخصوصية
          </h3>

          {/* Ghost Mode */}
          <div
            className={cn(
              "p-3 rounded-xl border-2 mb-2 cursor-pointer transition-all",
              isGhostMode
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            )}
            onClick={() => setIsGhostMode(!isGhostMode)}
          >
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <div className="font-medium">الوضع الخفي</div>
                <div className="text-xs text-muted-foreground">
                  إظهار منطقة تقريبية بدلاً من الموقع الدقيق
                </div>
              </div>
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                  isGhostMode ? "border-primary bg-primary" : "border-border"
                )}
              >
                {isGhostMode && <Check className="w-3 h-3 text-white" />}
              </div>
            </div>
          </div>

          {/* Restricted Access */}
          <div
            className={cn(
              "p-3 rounded-xl border-2 cursor-pointer transition-all",
              isRestricted
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            )}
            onClick={() => setIsRestricted(!isRestricted)}
          >
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <div className="font-medium">مشاركة خاصة</div>
                <div className="text-xs text-muted-foreground">
                  فقط الأشخاص المحددون يمكنهم رؤية موقعك
                </div>
              </div>
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                  isRestricted ? "border-primary bg-primary" : "border-border"
                )}
              >
                {isRestricted && <Check className="w-3 h-3 text-white" />}
              </div>
            </div>
          </div>

          {/* Allowed Emails */}
          {isRestricted && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="أضف بريد إلكتروني..."
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="bg-secondary border-0 rounded-xl"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleAddEmail}
                  className="shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {allowedEmails.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {allowedEmails.map((email) => (
                    <div
                      key={email}
                      className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                    >
                      {email}
                      <button onClick={() => handleRemoveEmail(email)}>
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Share Button */}
        <Button
          onClick={handleShare}
          className="w-full h-14 text-lg rounded-xl bg-primary"
        >
          <Share2 className="w-5 h-5 ml-2" />
          شارك موقعك دلوقتي
        </Button>
      </div>

      <BottomNav />

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-lg">
              تم إنشاء رابط المشاركة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-10 h-10 text-green-500" />
              </div>
            </div>

            <div className="bg-secondary rounded-xl p-3">
              <p className="text-sm text-muted-foreground text-center break-all">
                {shareLink}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="flex-1 rounded-xl"
              >
                {copied ? (
                  <Check className="w-4 h-4 ml-2" />
                ) : (
                  <Copy className="w-4 h-4 ml-2" />
                )}
                {copied ? "تم النسخ" : "نسخ الرسالة"}
              </Button>
              <Button
                onClick={handleShareNative}
                className="flex-1 rounded-xl bg-primary"
              >
                <Share2 className="w-4 h-4 ml-2" />
                مشاركة
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              الرابط صالح لمدة{" "}
              {selectedDuration === -1
                ? "٢٤ ساعة أو حتى الوصول"
                : selectedDuration >= 60
                ? `${selectedDuration / 60} ساعة`
                : `${selectedDuration} دقيقة`}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
