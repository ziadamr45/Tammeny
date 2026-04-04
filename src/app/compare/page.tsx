"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  X,
  MapPin,
  Shield,
  Battery,
  Wifi,
  Users,
  Clock,
  Lock,
  Smartphone,
  Globe,
  Heart,
  Zap,
  ChevronLeft,
  Star,
  Sparkles,
} from "lucide-react";
import { toArabicNumerals } from "@/lib/arabic-numerals";

const comparisonData = [
  {
    feature: "السعر",
    tamenny: "مجاني بالكامل",
    life360: "مجاني محدود + اشتراك شهري",
    googleMaps: "مجاني",
    tamennyIcon: "✅",
    life360Icon: "💰",
    googleMapsIcon: "✅",
  },
  {
    feature: "خصوصية الموقع",
    tamenny: "الموقع محمي بتشفير AES",
    life360: "محدود",
    googleMaps: "جوجل يجمع البيانات",
    tamennyIcon: "🔒",
    life360Icon: "⚠️",
    googleMapsIcon: "❌",
  },
  {
    feature: "دعم اللغة العربية",
    tamenny: "واجهة عربية كاملة + RTL",
    life360: "إنجليزي فقط",
    googleMaps: "محدود",
    tamennyIcon: "✅",
    life360Icon: "❌",
    googleMapsIcon: "⚠️",
  },
  {
    feature: "أرقام عربية",
    tamenny: "جميع الأرقام بالعربي",
    life360: "إنجليزي",
    googleMaps: "إنجليزي",
    tamennyIcon: "✅",
    life360Icon: "❌",
    googleMapsIcon: "❌",
  },
  {
    feature: "وضع توفير البطارية",
    tamenny: "متوفر (يقلل تكرار التحديث)",
    life360: "استهلاك عالي",
    googleMaps: "استهلاك متوسط",
    tamennyIcon: "🔋",
    life360Icon: "❌",
    googleMapsIcon: "⚠️",
  },
  {
    feature: "دعم أوفلاين",
    tamenny: "جزئي — sync عند عودة الإنترنت",
    life360: "يتوقف",
    googleMaps: "يتوقف",
    tamennyIcon: "📶",
    life360Icon: "❌",
    googleMapsIcon: "❌",
  },
  {
    feature: "المناطق الآمنة",
    tamenny: "غير محدود",
    life360: "2 فقط (مجاني)",
    googleMaps: "غير متوفر",
    tamennyIcon: "∞",
    life360Icon: "2",
    googleMapsIcon: "0",
  },
  {
    feature: "زر SOS الطوارئ",
    tamenny: "متوفر + تنبيه فوري",
    life360: "مميزات مدفوعة",
    googleMaps: "غير متوفر",
    tamennyIcon: "🚨",
    life360Icon: "💰",
    googleMapsIcon: "❌",
  },
  {
    feature: "تشفير رابط المشاركة",
    tamenny: "نعم - آمن 100%",
    life360: "محدود",
    googleMaps: "لا",
    tamennyIcon: "🔐",
    life360Icon: "⚠️",
    googleMapsIcon: "❌",
  },
  {
    feature: "أيقونة التطبيق",
    tamenny: "محترم ومحايد",
    life360: "واضح أنه تتبع",
    googleMaps: "أيقونة خرائط",
    tamennyIcon: "😊",
    life360Icon: "👀",
    googleMapsIcon: "🗺️",
  },
  {
    feature: "سرعة التطبيق",
    tamenny: "سريع وخفيف",
    life360: "ثقيل",
    googleMaps: "متوسط",
    tamennyIcon: "⚡",
    life360Icon: "⚠️",
    googleMapsIcon: "⚠️",
  },
  {
    feature: "السوق المصري",
    tamenny: "مصمم خصيصاً",
    life360: "غير مخصص",
    googleMaps: "عالمي",
    tamennyIcon: "🇪🇬",
    life360Icon: "🌍",
    googleMapsIcon: "🌍",
  },
];

const advantages = [
  {
    icon: Shield,
    title: "خصوصية مطلقة",
    description: "بياناتك مشفرة ومحمية - لا نبيعها لأي طرف",
    color: "text-green-500",
  },
  {
    icon: Battery,
    title: "توفير البطارية",
    description: "وضع توفير ذكي يوفر 40% من البطارية",
    color: "text-blue-500",
  },
  {
    icon: Globe,
    title: "واجهة عربية",
    description: "تصميم RTL وأرقام عربية كاملة",
    color: "text-purple-500",
  },
  {
    icon: Heart,
    title: "مجاني للأبد",
    description: "كل المميزات متاحة بدون اشتراكات",
    color: "text-red-500",
  },
  {
    icon: Wifi,
    title: "يعمل أوفلاين",
    description: "لا يتوقف عند ضعف النت",
    color: "text-amber-500",
  },
  {
    icon: Lock,
    title: "تشفير AES-256",
    description: "أعلى مستوى أمان للبيانات",
    color: "text-teal-500",
  },
];

export default function ComparePage() {
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  const displayedData = showAllFeatures
    ? comparisonData
    : comparisonData.slice(0, 6);

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background pb-20">
      {/* Header */}
      <div className="bg-primary text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => window.history.back()}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">لماذا طمنّي؟</h1>
            <p className="text-white/80 text-sm">مقارنة شاملة مع التطبيقات المنافسة</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Hero Section */}
        <Card className="p-6 bg-gradient-to-l from-primary/10 to-teal-dark/5 border-primary/20 overflow-hidden relative">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-teal-light/10 rounded-full blur-2xl" />
          
          <div className="relative z-10 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
              <h2 className="text-2xl font-bold">طمنّي vs المنافسين</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              اكتشف لماذا آلاف المستخدمين اختاروا طمنّي
            </p>
            <div className="flex justify-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                <Star className="w-3 h-3 ml-1" />
                تقييم 4.9
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <Check className="w-3 h-3 ml-1" />
                مجاني بالكامل
              </Badge>
            </div>
          </div>
        </Card>

        {/* Quick Advantages */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {advantages.map((adv, index) => (
            <Card
              key={index}
              className="p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="flex flex-col items-center text-center gap-2">
                <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform ${adv.color}`}>
                  <adv.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm">{adv.title}</h3>
                <p className="text-xs text-muted-foreground">{adv.description}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Comparison Table */}
        <Card className="overflow-hidden">
          <div className="bg-primary/10 p-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              مقارنة تفصيلية
            </h2>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-4 gap-2 p-4 bg-muted/50 border-b font-bold text-sm">
            <div className="text-right">الميزة</div>
            <div className="text-center text-primary">طمنّي</div>
            <div className="text-center text-muted-foreground">Life360</div>
            <div className="text-center text-muted-foreground">Google Maps</div>
          </div>

          {/* Table Body */}
          <div className="divide-y">
            {displayedData.map((row, index) => (
              <div
                key={index}
                className="grid grid-cols-4 gap-2 p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="text-right font-medium text-sm">{row.feature}</div>
                <div className="text-center">
                  <span className="text-lg">{row.tamennyIcon}</span>
                  <p className="text-xs text-primary font-medium mt-1">
                    {row.tamenny}
                  </p>
                </div>
                <div className="text-center">
                  <span className="text-lg">{row.life360Icon}</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {row.life360}
                  </p>
                </div>
                <div className="text-center">
                  <span className="text-lg">{row.googleMapsIcon}</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {row.googleMaps}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Show More Button */}
          {!showAllFeatures && comparisonData.length > 6 && (
            <div className="p-4 text-center border-t">
              <Button
                variant="outline"
                onClick={() => setShowAllFeatures(true)}
                className="rounded-xl"
              >
                عرض كل المميزات ({toArabicNumerals(comparisonData.length.toString())})
              </Button>
            </div>
          )}
        </Card>

        {/* Key Differences */}
        <Card className="p-4">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            الفروقات الأساسية
          </h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500 text-white flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-green-700">طمنّي</h4>
                  <ul className="text-sm text-green-600 mt-2 space-y-1">
                    <li>• مصمم خصيصاً للسوق المصري والعربي</li>
                    <li>• مجاني بالكامل بدون إعلانات مزعجة</li>
                    <li>• خصوصية مطلقة مع تشفير AES-256</li>
                    <li>• يعمل على النت الضعيف والأوفلاين</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-4 bg-red-50 rounded-xl border border-red-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0">
                  <X className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-red-700">Life360</h4>
                  <ul className="text-sm text-red-600 mt-2 space-y-1">
                    <li>• اشتراك شهري للمميزات الأساسية</li>
                    <li>• يستهلك البطارية بسرعة</li>
                    <li>• لا يدعم اللغة العربية</li>
                    <li>• مشاكل خصوصية معروفة</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-700">Google Maps</h4>
                  <ul className="text-sm text-amber-600 mt-2 space-y-1">
                    <li>• مصمم للملاحة وليس لمشاركة الموقع</li>
                    <li>• لا يوجد مناطق آمنة أو SOS</li>
                    <li>• جوجل يجمع ويبيع البيانات</li>
                    <li>• لا يوجد تشفير للروابط</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* CTA Section */}
        <Card className="p-6 bg-gradient-to-l from-primary to-teal-dark text-white overflow-hidden relative">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10 text-center">
            <h3 className="text-xl font-bold mb-2">جاهز تبدأ؟</h3>
            <p className="text-white/80 mb-4">
              انضم لآلاف المستخدمين اللي اختاروا الأمان والخصوصية
            </p>
            <div className="flex flex-col gap-3">
              <Button
                className="bg-white text-primary hover:bg-white/90 rounded-xl h-12"
                onClick={() => window.location.href = "/"}
              >
                ابدأ الآن مجاناً
              </Button>
              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 rounded-xl"
                onClick={() => window.location.href = "/share"}
              >
                جرب مشاركة الموقع
              </Button>
            </div>
          </div>
        </Card>

        {/* Statistics */}
        <Card className="p-4">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            إحصائيات المستخدمين
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{toArabicNumerals("50000")}+</div>
              <div className="text-xs text-muted-foreground">مستخدم نشط</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">{toArabicNumerals("4.9")}</div>
              <div className="text-xs text-muted-foreground">تقييم المتجر</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-500">{toArabicNumerals("1M")}+</div>
              <div className="text-xs text-muted-foreground">رحلة آمنة</div>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
