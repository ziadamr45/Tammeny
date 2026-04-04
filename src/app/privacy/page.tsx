"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Shield,
  Lock,
  MapPin,
  Database,
  Eye,
  Share2,
  Users,
  Cookie,
  Baby,
  Globe,
  Mail,
  Clock,
  CheckCircle,
  AlertTriangle,
  Key,
  Fingerprint,
  FileText,
  RefreshCw,
  UserCheck,
  Building,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatArabicDate } from "@/lib/arabic-numerals";

interface PrivacySection {
  id: string;
  icon: React.ReactNode;
  title: string;
  content: string[];
  highlight?: string;
  color: string;
}

const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    id: "introduction",
    icon: <Shield className="w-5 h-5" />,
    title: "مقدمة",
    content: [
      "نحن في طمنّي نلتزم بحماية خصوصيتك وضمان أمان بياناتك الشخصية. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية معلوماتك.",
      "باستخدامك لتطبيق طمنّي، فإنك توافق على الممارسات الموضحة في هذه السياسة. نحن نحترم خصوصيتك ونعمل على حمايتها.",
      "تطبيق طمنّي مصمم ليكون أداة سلامة ومشاركة موقع جغرافي، والخصوصية هي أساس كل ما نقوم به.",
    ],
    color: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
  },
  {
    id: "collect",
    icon: <Database className="w-5 h-5" />,
    title: "المعلومات التي نجمعها",
    content: [
      "بيانات الحساب: الاسم، رقم الهاتف، البريد الإلكتروني (اختياري)، الصورة الشخصية.",
      "بيانات الموقع: إحداثيات GPS الدقيقة أثناء جلسات المشاركة النشطة فقط.",
      "بيانات الجهاز: نوع الجهاز، نظام التشغيل، إصدار التطبيق لأغراض التحسين والدعم.",
      "بيانات الاستخدام: إحصائيات استخدام الميزات لتحسين تجربة المستخدم.",
      "جهات الاتصال: الأسماء وأرقام الهواتف التي تضيفها يدوياً (مخزنة محلياً وبشكل مشفر).",
    ],
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    id: "usage",
    icon: <Eye className="w-5 h-5" />,
    title: "كيف نستخدم معلوماتك",
    content: [
      "توفير خدمة مشاركة الموقع الجغرافي في الوقت الحقيقي مع الأشخاص المصرح لهم.",
      "إرسال إشعارات الوصول والتنبيهات الأمنية عند الاقتراب من المناطق الآمنة.",
      "توفير خدمة الطوارئ وإبلاغ جهات الاتصال المحددة في حالات الطوارئ.",
      "تحسين أداء التطبيق وتطوير ميزات جديدة بناءً على أنماط الاستخدام.",
      "التواصل معك بخصوص تحديثات التطبيق أو مشاكل الحساب.",
      "ضمان أمان حسابك والكشف عن أي نشاط مشبوه.",
    ],
    color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  },
  {
    id: "location",
    icon: <MapPin className="w-5 h-5" />,
    title: "التعامل مع بيانات الموقع",
    content: [
      "يتم جمع بيانات الموقع فقط أثناء جلسات المشاركة النشطة التي تبدأها أنت يدوياً.",
      "لا نتتبع موقعك في الخلفية أو عندما لا تكون جلسة المشاركة نشطة.",
      "تُحذف بيانات الموقع تلقائياً بعد انتهاء جلسة المشاركة (من ٥ دقائق إلى ساعتين حسب اختيارك).",
      "يمكنك إيقاف مشاركة الموقع في أي وقت بالضغط على زر 'إيقاف المشاركة'.",
      "لا يتم مشاركة موقعك مع أي طرف ثالث دون موافقتك الصريحة.",
    ],
    highlight: "بيانات الموقع لا تُخزن على خوادمنا بشكل دائم",
    color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  },
  {
    id: "sharing",
    icon: <Share2 className="w-5 h-5" />,
    title: "مشاركة البيانات",
    content: [
      "لا نبيع أو نؤجر أو نشارك بياناتك الشخصية مع أي طرف ثالث لأغراض تسويقية.",
      "يتم مشاركة موقعك فقط مع الأشخاص الذين تختارهم أنت وللمدة التي تحددها.",
      "قد نشارك بيانات مجهولة المصدر مع شركاء التحليل لتحسين الخدمة.",
      "في حالات الطوارئ القانونية، قد نضطر لمشاركة البيانات مع السلطات المختصة وفقاً للقانون.",
      "نستخدم مزودي خدمات موثوقين (استضافة، خرائط) يلتزمون بمعايير الخصوصية العالية.",
    ],
    color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  },
  {
    id: "security",
    icon: <Lock className="w-5 h-5" />,
    title: "أمن البيانات",
    content: [
      "نستخدم تشفير AES-256 لحماية جميع البيانات المنقولة والمخزنة، وهو نفس مستوى التشفير المستخدم في البنوك.",
      "جميع الاتصالات بين التطبيق والخوادم محمية ببروتوكول TLS 1.3.",
      "نستخدم مصادقة JWT مع رموز انتهاء صلاحية قصيرة لحماية حسابك.",
      "بيانات الموقع مشفرة بطريقة لا يمكن فك تشفيرها إلا من قبل المستلم المصرح له.",
      "نجري اختبارات أمنية دورية ونراجع ممارساتنا باستمرار.",
      "خوادمنا موجودة في مراكز بيانات آمنة مع حماية مادية ومعايير ISO 27001.",
    ],
    highlight: "تشفير AES-256 على مستوى البنوك",
    color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  },
  {
    id: "rights",
    icon: <UserCheck className="w-5 h-5" />,
    title: "حقوقك",
    content: [
      "حق الوصول: يمكنك طلب نسخة من جميع بياناتك الشخصية المخزنة.",
      "حق التعديل: يمكنك تحديث أو تصحيح بياناتك في أي وقت من إعدادات الحساب.",
      "حق الحذف: يمكنك طلب حذف جميع بياناتك بشكل كامل ودائم.",
      "حق الاعتراض: يمكنك الاعتراض على معالجة بياناتك لأغراض معينة.",
      "حق نقل البيانات: يمكنك طلب تصدير بياناتك بصيغة قابلة للقراءة آلياً.",
      "حق سحب الموافقة: يمكنك سحب موافقتك على معالجة البيانات في أي وقت.",
    ],
    color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
  {
    id: "cookies",
    icon: <Cookie className="w-5 h-5" />,
    title: "ملفات تعريف الارتباط والتتبع",
    content: [
      "نستخدم ملفات تعريف الارتباط الأساسية فقط لعمل التطبيق (تذكر تسجيل الدخول، التفضيلات).",
      "لا نستخدم ملفات تعريف ارتباط للإعلانات أو التتبع عبر المواقع.",
      "يمكنك حذف ملفات تعريف الارتباط من إعدادات متصفحك، لكن قد يؤثر ذلك على بعض وظائف التطبيق.",
      "نستخدم Firebase Analytics مجهول المصدر لجمع إحصائيات الاستخدام.",
    ],
    color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  },
  {
    id: "children",
    icon: <Baby className="w-5 h-5" />,
    title: "خصوصية الأطفال",
    content: [
      "التطبيق مخصص لمن هم فوق ١٣ عاماً. لا نجمع عمداً بيانات من أطفال تحت هذا السن.",
      "إذا اكتشفنا أننا جمعنا بيانات من طفل دون ١٣ عاماً، سنحذفها فوراً.",
      "ننصح الآباء بمراقبة استخدام أطفالهم للتطبيقات وإرشادهم حول الخصوصية الرقمية.",
      "يمكن للآباء طلب حذف حسابات أطفالهم عن طريق التواصل معنا.",
    ],
    color: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
  },
  {
    id: "international",
    icon: <Globe className="w-5 h-5" />,
    title: "نقل البيانات الدولي",
    content: [
      "قد يتم نقل بياناتك ومعالجتها خارج بلد إقامتك، بما في ذلك خوادمنا الرئيسية.",
      "نلتزم بالقوانين المعمول بها لحماية البيانات، بما في ذلك اللائحة الأوروبية (GDPR).",
      "نتخذ جميع التدابير اللازمة لضمان حماية بياناتك عند نقلها دولياً.",
      "خوادمنا موجودة في مناطق ذات تشريعات حماية بيانات قوية.",
    ],
    color: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
  },
];

export default function PrivacyPage() {
  const router = useRouter();
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [lastUpdated] = useState(new Date("2025-04-01"));

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      
      if (scrollPercent > 90) {
        setHasScrolledToBottom(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
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
          <h1 className="font-bold text-lg">سياسة الخصوصية</h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="flex gap-4 px-4 py-6">
        {/* Side Navigation - Desktop */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-20">
            <Card className="p-4 card-shadow">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                محتويات الصفحة
              </h3>
              <nav className="space-y-2 max-h-[60vh] overflow-y-auto">
                {PRIVACY_SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={cn(
                      "w-full text-right text-sm py-2 px-3 rounded-lg transition-colors",
                      activeSection === section.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted text-muted-foreground"
                    )}
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            </Card>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Introduction Card */}
          <Card className="p-6 card-shadow bg-gradient-to-l from-primary/5 to-teal-600/5 border-primary/10">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-xl mb-2">سياسة الخصوصية لطمنّي</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  خصوصيتك مهمة جداً لنا. توضح هذه السياسة كيفية جمع واستخدام وحماية بياناتك
                  الشخصية عند استخدام تطبيق طمنّي.
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    آخر تحديث: {formatArabicDate(lastUpdated)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Key className="w-4 h-4" />
                    تشفير AES-256
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Key Highlights */}
          <Card className="p-4 card-shadow border-2 border-primary/20">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-primary">
              <Fingerprint className="w-4 h-4" />
              نقاط مهمة
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 rounded-xl bg-primary/5">
                <Lock className="w-6 h-6 mx-auto text-primary mb-2" />
                <div className="text-xs font-medium">تشفير قوي</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                <CheckCircle className="w-6 h-6 mx-auto text-green-600 dark:text-green-400 mb-2" />
                <div className="text-xs font-medium">لا بيع للبيانات</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <MapPin className="w-6 h-6 mx-auto text-blue-600 dark:text-blue-400 mb-2" />
                <div className="text-xs font-medium">موقع مؤقت</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                <Users className="w-6 h-6 mx-auto text-purple-600 dark:text-purple-400 mb-2" />
                <div className="text-xs font-medium">تحكم كامل</div>
              </div>
            </div>
          </Card>

          {/* Sections */}
          {PRIVACY_SECTIONS.map((section, index) => (
            <Card
              key={section.id}
              id={section.id}
              className="p-6 card-shadow hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", section.color)}>
                  {section.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs">
                      {index + 1}
                    </Badge>
                    <h3 className="font-bold text-lg">{section.title}</h3>
                  </div>
                </div>
              </div>
              
              {section.highlight && (
                <div className="mb-4 p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-sm text-primary font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {section.highlight}
                  </p>
                </div>
              )}
              
              <div className="space-y-3 pr-4">
                {section.content.map((paragraph, pIndex) => (
                  <p key={pIndex} className="text-muted-foreground text-sm leading-relaxed flex gap-2">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-1" />
                    {paragraph}
                  </p>
                ))}
              </div>
            </Card>
          ))}

          {/* Contact Section */}
          <Card className="p-6 card-shadow">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              للتواصل بخصوص الخصوصية
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">مسؤول الخصوصية</div>
                  <div className="font-medium" dir="ltr">privacy@tamenny.app</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">العنوان</div>
                  <div className="font-medium">القاهرة، مصر</div>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              سنرد على استفساراتك المتعلقة بالخصوصية خلال ٣٠ يوماً كحد أقصى.
            </p>
          </Card>

          {/* Updates Section */}
          <Card className="p-6 card-shadow bg-gradient-to-l from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <RefreshCw className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">تحديثات السياسة</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  قد نقوم بتحديث سياسة الخصوصية من وقت لآخر. سيتم إشعارك بأي تغييرات جوهرية
                  عبر التطبيق أو البريد الإلكتروني. ننصحك بمراجعة هذه السياسة بشكل دوري.
                </p>
              </div>
            </div>
          </Card>

          {/* Back Button */}
          <div className="flex justify-center">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="px-8 h-12 rounded-xl"
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة للصفحة السابقة
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
