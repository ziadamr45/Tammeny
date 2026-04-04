"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Users,
  Shield,
  Bell,
  PlayCircle,
  Facebook,
  Twitter,
  Instagram,
  AlertTriangle,
  Send,
  Clock,
  Lock,
  Globe,
  CheckCircle,
  Info,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface QuickHelpItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

interface VideoTutorial {
  id: string;
  title: string;
  duration: string;
  description: string;
  youtubeUrl: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: "1",
    question: "كيف أشارك موقعي مع شخص آخر؟",
    answer: "اضغط على زر 'مشاركة' في الصفحة الرئيسية، ثم اختر الشخص من قائمة جهات الاتصال أو أدخل رقم هاتفه. يمكنك تحديد مدة المشاركة (٥ دقائق، ٣٠ دقيقة، ساعة، ساعتين) أو اختيار 'حتى الوصول'. سيتم إرسال رابط آمن للشخص المحدد.",
    category: "المشاركة",
  },
  {
    id: "2",
    question: "كيف أضيف جهات اتصال جديدة؟",
    answer: "اذهب إلى صفحة 'جهات الاتصال' من القائمة السفلية، ثم اضغط على زر '+' في الأعلى. يمكنك إضافة جهة اتصال يدوياً أو استيرادها من دفتر العناوين. حدد صلة القرابة وإعدادات الإشعارات لكل جهة اتصال.",
    category: "جهات الاتصال",
  },
  {
    id: "3",
    question: "ما هي المنطقة الآمنة وكيف أضيفها؟",
    answer: "المنطقة الآمنة هي منطقة جغرافية محددة (مثل المنزل أو العمل) يتم إرسال إشعارات عند الدخول إليها أو الخروج منها. اذهب إلى 'الإعدادات' > 'المناطق الآمنة' > 'إضافة منطقة جديدة'، ثم حدد الموقع على الخريطة ونصف القطر المطلوب.",
    category: "السلامة",
  },
  {
    id: "4",
    question: "كيف يعمل زر الطوارئ؟",
    answer: "عند الضغط على زر الطوارئ (اللون الأحمر)، سيتم إرسال تنبيه فوري مع موقعك الحالي إلى جميع جهات الطوارئ المحددة مسبقاً. يمكنك إضافة جهات طوارئ من صفحة 'جهات الطوارئ' في الإعدادات.",
    category: "الطوارئ",
  },
  {
    id: "5",
    question: "هل موقعي محمي وآمن؟",
    answer: "نعم، نستخدم تشفير AES-256 لحماية جميع البيانات. موقعك لا يتم تخزينه إلا أثناء جلسة المشاركة النشطة ويتم حذفه تلقائياً بعد انتهائها. يمكنك تفعيل 'الوضع الخفي' لإخفاء الموقع الدقيق.",
    category: "الأمان",
  },
  {
    id: "6",
    question: "كيف أوقف مشاركة موقعي؟",
    answer: "يمكنك إيقاف مشاركة الموقع في أي وقت بالضغط على زر 'إيقاف المشاركة' في الصفحة الرئيسية أو في إشعار النشاط الحالي. سيتم إرسال إشعار للأشخاص الذين كنت تشارك معهم.",
    category: "المشاركة",
  },
  {
    id: "7",
    question: "ما هو وضع توفير البطارية؟",
    answer: "وضع توفير البطارية يقلل من استهلاك الطاقة عن طريق تقليل تكرار تحديثات الموقع من كل ثانية إلى كل ٥ ثواني. هذا يوفر ما يصل إلى ٣٠٪ من البطارية مع الحفاظ على دقة كافية للسلامة.",
    category: "الإعدادات",
  },
  {
    id: "8",
    question: "كيف أضيف أفراد العائلة للمجموعة؟",
    answer: "اذهب إلى صفحة 'المجموعات' من القائمة السفلية، اختر المجموعة المطلوبة أو أنشئ مجموعة جديدة، ثم اضغط على 'إضافة عضو'. يمكنك إرسال دعوة عبر رابط أو رقم الهاتف.",
    category: "المجموعات",
  },
  {
    id: "9",
    question: "كيف أحصل على إشعارات عند وصول شخص إلى وجهته؟",
    answer: "عند مشاركة شخص لموقعه معك، ستتلقى إشعارات تلقائية عند وصوله. تأكد من تفعيل الإشعارات في إعدادات الجهاز وإعدادات التطبيق.",
    category: "الإشعارات",
  },
  {
    id: "10",
    question: "هل يمكنني استخدام التطبيق بدون إنترنت؟",
    answer: "التطبيق يتطلب اتصال بالإنترنت لمشاركة الموقع وتلقي التحديثات. ومع ذلك، يتم تخزين بعض البيانات محلياً مثل جهات الاتصال والإعدادات. نعمل على إضافة ميزات العمل بدون اتصال في التحديثات القادمة.",
    category: "عام",
  },
];

const QUICK_HELP_ITEMS: QuickHelpItem[] = [
  {
    icon: <MapPin className="w-5 h-5" />,
    title: "مشاركة الموقع",
    description: "تعلم كيفية مشاركة موقعك",
    color: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "إضافة جهات اتصال",
    description: "إدارة جهات الاتصال والمجموعات",
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "المناطق الآمنة",
    description: "إنشاء مناطق جغرافية آمنة",
    color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  },
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    title: "الطوارئ SOS",
    description: "كيفية استخدام زر الطوارئ",
    color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  },
  {
    icon: <Bell className="w-5 h-5" />,
    title: "الإشعارات",
    description: "إدارة التنبيهات والإشعارات",
    color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  },
  {
    icon: <Lock className="w-5 h-5" />,
    title: "الخصوصية والأمان",
    description: "حماية بياناتك وموقعك",
    color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  },
];

const VIDEO_TUTORIALS: VideoTutorial[] = [
  {
    id: "1",
    title: "البدء مع طمنّي",
    duration: "٣ دقائق",
    description: "تعرف على الميزات الأساسية للتطبيق",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    id: "2",
    title: "مشاركة الموقع بسهولة",
    duration: "٢ دقيقة",
    description: "خطوات مشاركة موقعك مع العائلة",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    id: "3",
    title: "إعداد المناطق الآمنة",
    duration: "٤ دقائق",
    description: "كيفية إنشاء وإدارة المناطق الآمنة",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    id: "4",
    title: "استخدام الطوارئ",
    duration: "١ دقيقة",
    description: "متى وكيف تستخدم زر الطوارئ",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
];

// Map quick help topics to FAQ categories
const QUICK_HELP_FAQ_MAP: Record<string, string[]> = {
  "مشاركة الموقع": ["1", "6"],
  "إضافة جهات اتصال": ["2", "8"],
  "المناطق الآمنة": ["3"],
  "الطوارئ SOS": ["4"],
  "الإشعارات": ["9"],
  "الخصوصية والأمان": ["5"],
};

export default function HelpPage() {
  const router = useRouter();
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const faqRef = useRef<HTMLDivElement>(null);

  const handleContactSubmit = async () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }

    if (!contactForm.email.includes("@")) {
      toast.error("يرجى إدخال بريد إلكتروني صحيح");
      return;
    }

    if (contactForm.message.length < 10) {
      toast.error("الرسالة يجب أن تكون 10 أحرف على الأقل");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/help/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      const data = await response.json();

      if (data.success) {
        setContactForm({ name: "", email: "", message: "" });
        toast.success("تم إرسال رسالتك! سنتواصل معك قريباً");
      } else {
        toast.error(data.error || "فشل إرسال الرسالة");
      }
    } catch {
      toast.error("حدث خطأ أثناء إرسال الرسالة");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmergencyCall = () => {
    // Open phone dialer with emergency number
    window.open('tel:+201221234567', '_self');
    toast.success("جاري فتح تطبيق الهاتف...");
    setShowEmergencyDialog(false);
  };

  const filteredFAQ = FAQ_DATA.filter(
    (item) =>
      item.question.includes(searchQuery) ||
      item.answer.includes(searchQuery) ||
      item.category.includes(searchQuery)
  );

  // Handle quick help topic click - scroll to FAQ and expand relevant items
  const handleQuickHelpClick = (title: string) => {
    const faqIds = QUICK_HELP_FAQ_MAP[title];
    if (faqIds && faqIds.length > 0) {
      // Scroll to FAQ section
      faqRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Expand the first relevant FAQ
      setExpandedFAQ(faqIds[0]);
    }
  };

  // Handle video tutorial click - open YouTube
  const handleVideoClick = (video: VideoTutorial) => {
    window.open(video.youtubeUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-card/95 backdrop-blur-lg border-b border-border z-50">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">المساعدة والدعم</h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Emergency Help Button */}
        <Card className="p-4 card-shadow bg-gradient-to-l from-red-500 to-red-600 text-white border-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-lg">مساعدة طوارئ</div>
              <div className="text-white/80 text-sm">
                اضغط للاتصال بخط الطوارئ
              </div>
            </div>
            <Button
              onClick={() => setShowEmergencyDialog(true)}
              className="bg-white text-red-600 hover:bg-white/90 rounded-xl"
            >
              اتصال
            </Button>
          </div>
        </Card>

        {/* Quick Help Topics */}
        <div>
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            مواضيع المساعدة السريعة
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_HELP_ITEMS.map((item, index) => (
              <Card
                key={index}
                className="p-4 card-shadow hover:shadow-lg transition-all cursor-pointer hover:-translate-y-0.5 border border-transparent hover:border-primary/20"
                onClick={() => handleQuickHelpClick(item.title)}
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", item.color)}>
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{item.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {item.description}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div ref={faqRef}>
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            الأسئلة الشائعة
          </h2>
          
          {/* Search */}
          <div className="relative mb-4">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في الأسئلة..."
              className="bg-secondary border-0 rounded-xl pr-10"
            />
            <HelpCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>

          <Card className="card-shadow overflow-hidden">
            <Accordion type="single" collapsible value={expandedFAQ || ""} onValueChange={setExpandedFAQ} className="w-full">
              {filteredFAQ.map((item) => (
                <AccordionItem key={item.id} value={item.id} className="px-4">
                  <AccordionTrigger className="text-right hover:no-underline">
                    <div className="flex items-start gap-3 text-right">
                      <Badge
                        variant="secondary"
                        className="shrink-0 text-xs"
                      >
                        {item.category}
                      </Badge>
                      <span className="font-medium">{item.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-right pr-2">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </div>

        {/* Video Tutorials */}
        <div>
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-primary" />
            فيديوهات تعليمية
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {VIDEO_TUTORIALS.map((video) => (
              <Card
                key={video.id}
                className="overflow-hidden card-shadow hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => handleVideoClick(video)}
              >
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-teal-600/20 relative flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <PlayCircle className="w-6 h-6 text-primary" />
                  </div>
                  <Badge className="absolute bottom-2 left-2 bg-black/70 text-white text-xs">
                    {video.duration}
                  </Badge>
                </div>
                <div className="p-3">
                  <div className="font-medium text-sm line-clamp-1">{video.title}</div>
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {video.description}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Support Form */}
        <div>
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            تواصل معنا
          </h2>
          <Card className="p-4 card-shadow space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">الاسم</label>
              <Input
                value={contactForm.name}
                onChange={(e) =>
                  setContactForm({ ...contactForm, name: e.target.value })
                }
                placeholder="أدخل اسمك"
                className="bg-secondary border-0 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">البريد الإلكتروني</label>
              <Input
                type="email"
                value={contactForm.email}
                onChange={(e) =>
                  setContactForm({ ...contactForm, email: e.target.value })
                }
                placeholder="example@email.com"
                className="bg-secondary border-0 rounded-xl"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">رسالتك</label>
              <Textarea
                value={contactForm.message}
                onChange={(e) =>
                  setContactForm({ ...contactForm, message: e.target.value })
                }
                placeholder="اكتب رسالتك هنا..."
                className="bg-secondary border-0 rounded-xl min-h-[100px] resize-none"
              />
            </div>
            <Button
              onClick={handleContactSubmit}
              className="w-full h-12 rounded-xl bg-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  إرسال الرسالة
                  <Send className="w-4 h-4 mr-2" />
                </>
              )}
            </Button>
          </Card>
        </div>

        {/* Contact Information */}
        <div>
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            معلومات الاتصال
          </h2>
          <Card className="card-shadow divide-y divide-border">
            <div className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-medium">خط المساعدة</div>
                <div className="text-sm text-muted-foreground" dir="ltr">
                  +20 800 123 4567
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={() => window.open('tel:+208001234567', '_self')}
              >
                اتصال
              </Button>
            </div>
            <div className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-medium">البريد الإلكتروني</div>
                <div className="text-sm text-muted-foreground" dir="ltr">
                  support@tamenny.app
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={() => window.open('mailto:support@tamenny.app', '_self')}
              >
                مراسلة
              </Button>
            </div>
            <div className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-medium">أوقات العمل</div>
                <div className="text-sm text-muted-foreground">
                  السبت - الخميس: ٩ صباحاً - ٩ مساءً
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Social Media */}
        <div>
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            تابعنا
          </h2>
          <Card className="p-4 card-shadow">
            <div className="flex justify-center gap-4">
              <button
                onClick={() => window.open('https://facebook.com/tamennyapp', '_blank', 'noopener,noreferrer')}
                className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center hover:scale-110 transition-transform"
              >
                <Facebook className="w-6 h-6 text-blue-600" />
              </button>
              <button
                onClick={() => window.open('https://twitter.com/tamennyapp', '_blank', 'noopener,noreferrer')}
                className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center hover:scale-110 transition-transform"
              >
                <Twitter className="w-6 h-6 text-sky-500" />
              </button>
              <button
                onClick={() => window.open('https://instagram.com/tamennyapp', '_blank', 'noopener,noreferrer')}
                className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center hover:scale-110 transition-transform"
              >
                <Instagram className="w-6 h-6 text-pink-600" />
              </button>
            </div>
          </Card>
        </div>

        {/* App Info */}
        <Card className="p-4 card-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-bold">طمنّي</div>
                <div className="text-xs text-muted-foreground">
                  الإصدار ١.٠.٠
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="w-3 h-3 ml-1" />
                محدث
              </Badge>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Info className="w-3 h-3" />
            <span>صُنع بـ ❤️ في مصر | جميع الحقوق محفوظة © ٢٠٢٥</span>
          </div>
        </Card>
      </div>

      {/* Emergency Dialog */}
      {showEmergencyDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm p-6 card-shadow-xl text-center animate-in zoom-in duration-200">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">اتصال الطوارئ</h3>
            <p className="text-muted-foreground mb-6">
              هل تريد الاتصال بخط الطوارئ الوطني؟
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowEmergencyDialog(false)}
                className="flex-1 rounded-xl"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleEmergencyCall}
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-700"
              >
                <Phone className="w-4 h-4 ml-2" />
                اتصال
              </Button>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}
