"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  FileText,
  CheckCircle,
  AlertCircle,
  Shield,
  MapPin,
  Users,
  Lock,
  Scale,
  RefreshCw,
  Mail,
  Clock,
  Globe,
  Handshake,
  Gavel,
  AlertTriangle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatArabicDate } from "@/lib/arabic-numerals";

interface TermsSection {
  id: string;
  icon: React.ReactNode;
  title: string;
  content: string[];
  color: string;
}

const TERMS_SECTIONS: TermsSection[] = [
  {
    id: "introduction",
    icon: <FileText className="w-5 h-5" />,
    title: "مقدمة وقبول الشروط",
    content: [
      "مرحباً بك في تطبيق طمنّي! يرجى قراءة هذه الشروط والأحكام بعناية قبل استخدام التطبيق.",
      "باستخدامك لتطبيق طمنّي، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى عدم استخدام التطبيق.",
      "يعتبر تطبيق طمنّي منصة لمشاركة الموقع الجغرافي في الوقت الحقيقي لأغراض السلامة والراحة، ويستخدم بشكل أساسي في مصر والدول العربية.",
    ],
    color: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
  },
  {
    id: "responsibilities",
    icon: <Users className="w-5 h-5" />,
    title: "مسؤوليات المستخدم",
    content: [
      "يلتزم المستخدم باستخدام التطبيق بشكل مسؤول وأخلاقي، وعدم استخدامه لأغراض غير قانونية أو ضارة.",
      "يجب على المستخدم الحفاظ على سرية حسابه وعدم مشاركته مع الآخرين، والمسؤولية عن جميع الأنشطة التي تتم من خلال حسابه.",
      "يتعهد المستخدم بعدم مشاركة موقع الآخرين دون موافقتهم الصريحة، واحترام خصوصية الآخرين.",
      "يجب على المستخدم تقديم معلومات صحيحة ودقيقة عند التسجيل في التطبيق، وتحديثها عند الحاجة.",
      "يتحمل المستخدم كامل المسؤولية عن استخدام ميزة الطوارئ، ويجب استخدامها فقط في حالات الطوارئ الحقيقية.",
    ],
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    id: "privacy",
    icon: <Lock className="w-5 h-5" />,
    title: "الخصوصية وجمع البيانات",
    content: [
      "نلتزم بحماية خصوصية المستخدمين وعدم مشاركة بياناتهم الشخصية مع أطراف ثالثة دون موافقة صريحة.",
      "يتم جمع بيانات الموقع الجغرافي فقط أثناء جلسات المشاركة النشطة، ويتم حذفها تلقائياً بعد انتهاء الجلسة.",
      "نستخدم تشفير AES-256 لحماية جميع البيانات المنقولة والمخزنة، مع ضمان أقصى درجات الأمان.",
      "يمكن للمستخدم طلب حذف جميع بياناته الشخصية في أي وقت من خلال التواصل مع فريق الدعم.",
    ],
    color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  },
  {
    id: "location",
    icon: <MapPin className="w-5 h-5" />,
    title: "شروط مشاركة الموقع",
    content: [
      "تعتبر مشاركة الموقع ميزة اختيارية تتطلب موافقة صريحة من المستخدم قبل تفعيلها.",
      "يمكن للمستخدم التحكم الكامل في مدة المشاركة والأشخاص المصرح لهم بمشاهدة موقعه.",
      "يحق للمستخدم إيقاف مشاركة الموقع في أي وقت، وسيتم إشعار الأشخاص المعنيين فوراً.",
      "لا نتحمل مسؤولية دقة الموقع في حالة ضعف إشارة GPS أو انقطاع الاتصال بالإنترنت.",
      "يتم إنشاء روابط مشاركة مؤقتة وآمنة تنتهي صلاحيتها تلقائياً بعد انتهاء مدة المشاركة.",
    ],
    color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  },
  {
    id: "limitations",
    icon: <AlertCircle className="w-5 h-5" />,
    title: "حدود الخدمة",
    content: [
      "يعمل التطبيق بشكل أفضل مع اتصال إنترنت مستقر، وقد تتأثر بعض الميزات في حالة ضعف الاتصال.",
      "تعتمد دقة الموقع على دقة GPS في جهاز المستخدم، وقد تختلف الدقة حسب الموقع الجغرافي.",
      "لا نضمن عمل التطبيق بشكل متواصل دون انقطاع، ونحتفظ بالحق في إجراء صيانة دورية.",
      "قد تتأثر بعض الميزات بالظروف الجوية أو التضاريس أو العوامل البيئية الأخرى.",
      "نحتفظ بالحق في تعليق أو إنهاء حساب أي مستخدم يخالف هذه الشروط والأحكام.",
    ],
    color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  },
  {
    id: "intellectual",
    icon: <Globe className="w-5 h-5" />,
    title: "الملكية الفكرية",
    content: [
      "جميع حقوق الملكية الفكرية المتعلقة بالتطبيق (بما في ذلك التصميمات والشعارات والأكواد) محفوظة لفريق طمنّي.",
      "يُمنع منعاً باتاً نسخ أو تعديل أو توزيع أي جزء من التطبيق دون إذن كتابي مسبق.",
      "العلامات التجارية والشعارات المستخدمة في التطبيق هي ملك حصري لطمنّي ومحمية بموجب القانون.",
      "يُسمح للمستخدمين باستخدام التطبيق للأغراض الشخصية فقط، ولا يُسمح بالاستخدام التجاري دون ترخيص.",
    ],
    color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
  {
    id: "disclaimer",
    icon: <AlertTriangle className="w-5 h-5" />,
    title: "إخلاء المسؤولية",
    content: [
      "يتم توفير التطبيق 'كما هو' دون أي ضمانات صريحة أو ضمنية، ونحن نسعى لتقديم أفضل خدمة ممكنة.",
      "لا نتحمل مسؤولية أي أضرار مباشرة أو غير مباشرة ناتجة عن استخدام التطبيق أو عدم القدرة على استخدامه.",
      "لا نتحمل مسؤولية تصرفات المستخدمين أو استخدامهم للتطبيق بطرق غير لائقة.",
      "في حالة الطوارئ الحقيقية، يجب على المستخدم الاتصال برقم الطوارئ المحلي (١٢٢ في مصر) أولاً.",
      "لا يغني التطبيق عن خدمات الطوارئ الرسمية، بل هو أداة مساعدة للتواصل مع الأهل والأصدقاء.",
    ],
    color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  },
  {
    id: "changes",
    icon: <RefreshCw className="w-5 h-5" />,
    title: "التغييرات على الشروط",
    content: [
      "نحتفظ بالحق في تعديل هذه الشروط والأحكام في أي وقت، وسيتم إشعار المستخدمين بالتغييرات الجوهرية.",
      "استمرار استخدام التطبيق بعد نشر التغييرات يعني موافقة المستخدم على الشروط المحدثة.",
      "سنقوم بنشر تاريخ آخر تحديث في أعلى هذه الصفحة لتمكين المستخدمين من متابعة التغييرات.",
      "في حالة وجود تغييرات جوهرية، سنطلب من المستخدم الموافقة على الشروط الجديدة قبل الاستمرار في استخدام التطبيق.",
    ],
    color: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
  },
  {
    id: "governing",
    icon: <Scale className="w-5 h-5" />,
    title: "القانون الحاكم",
    content: [
      "تخضع هذه الشروط والأحكام وتُفسر وفقاً لقوانين جمهورية مصر العربية.",
      "في حالة وجود نزاع، يتم اللجوء أولاً إلى الحل الودي، ثم إلى المحاكم المصرية المختصة.",
      "جميع المراسلات القانونية يجب أن تكون مكتوبة باللغة العربية وترسل إلى العنوان المسجل لطمنّي.",
    ],
    color: "bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400",
  },
];

export default function TermsPage() {
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

  const handleAccept = () => {
    toast.success("تم قبول شروط الاستخدام بنجاح!");
    router.push("/");
  };

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
          <h1 className="font-bold text-lg">شروط الاستخدام</h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="flex gap-4 px-4 py-6">
        {/* Side Navigation - Desktop */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-20">
            <Card className="p-4 card-shadow">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <Gavel className="w-4 h-4 text-primary" />
                محتويات الصفحة
              </h3>
              <nav className="space-y-2">
                {TERMS_SECTIONS.map((section) => (
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
                <FileText className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-xl mb-2">شروط وأحكام استخدام طمنّي</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  يرجى قراءة هذه الشروط بعناية قبل استخدام تطبيق طمنّي. باستخدامك للتطبيق،
                  فإنك توافق على الالتزام بهذه الشروط.
                </p>
                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    آخر تحديث: {formatArabicDate(lastUpdated)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Handshake className="w-4 h-4" />
                    النسخة ١.٠
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Sections */}
          {TERMS_SECTIONS.map((section, index) => (
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
              للتواصل والاستفسارات
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">البريد الإلكتروني</div>
                  <div className="font-medium" dir="ltr">legal@tamenny.app</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">الموقع الإلكتروني</div>
                  <div className="font-medium" dir="ltr">www.tamenny.app</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Accept Section */}
          <Card className="p-6 card-shadow bg-gradient-to-l from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border-green-200 dark:border-green-800">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                <Shield className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">هل توافق على شروط الاستخدام؟</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  بالضغط على زر "أوافق"، فإنك تقر بأنك قرأت وفهمت جميع الشروط والأحكام
                  وأنت موافق على الالتزام بها.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleAccept}
                    className="flex-1 h-12 rounded-xl bg-green-600 hover:bg-green-700"
                    disabled={!hasScrolledToBottom}
                  >
                    <CheckCircle className="w-5 h-5 ml-2" />
                    أوافق على الشروط
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="flex-1 h-12 rounded-xl"
                  >
                    لا أوافق
                  </Button>
                </div>
                {!hasScrolledToBottom && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 flex items-center gap-1">
                    <Info className="w-4 h-4" />
                    يرجى قراءة جميع الشروط حتى النهاية للمتابعة
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
