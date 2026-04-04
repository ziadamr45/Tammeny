"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Globe, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";

export default function PrivacyPage() {
  const router = useRouter();
  const { language, setLanguage, t, direction } = useLanguage();

  const sections = [
    {
      title: language === 'ar' ? t.privacy.sections.dataCollection : "Data We Collect",
      content: language === 'ar' ? t.privacy.sections.dataCollectionContent : "We only collect the data necessary to operate the app, such as your geographic location when sharing."
    },
    {
      title: language === 'ar' ? t.privacy.sections.dataUsage : "How We Use Your Data",
      content: language === 'ar' ? t.privacy.sections.dataUsageContent : "We use your data to provide sharing and tracking services and improve the user experience."
    },
    {
      title: language === 'ar' ? t.privacy.sections.dataProtection : "Data Protection",
      content: language === 'ar' ? t.privacy.sections.dataProtectionContent : "We use the latest encryption and protection technologies to keep your data secure."
    },
    {
      title: language === 'ar' ? t.privacy.sections.dataSharing : "Data Sharing",
      content: language === 'ar' ? t.privacy.sections.dataSharingContent : "We do not share your data with third parties except with your consent or as required by law."
    },
    {
      title: language === 'ar' ? t.privacy.sections.dataRetention : "Data Retention",
      content: language === 'ar' ? t.privacy.sections.dataRetentionContent : "We retain your data as long as your account is active or as needed to provide services."
    },
    {
      title: language === 'ar' ? t.privacy.sections.userRights : "Your Rights",
      content: language === 'ar' ? t.privacy.sections.userRightsContent : "You have the right to access, correct, and delete your data at any time."
    },
    {
      title: language === 'ar' ? t.privacy.sections.cookies : "Cookies",
      content: language === 'ar' ? t.privacy.sections.cookiesContent : "We use cookies to improve the user experience."
    },
    {
      title: language === 'ar' ? t.privacy.sections.changes : "Policy Changes",
      content: language === 'ar' ? t.privacy.sections.changesContent : "We may update this policy from time to time."
    },
    {
      title: language === 'ar' ? t.privacy.sections.contact : "Contact Us",
      content: language === 'ar' ? t.privacy.sections.contactContent : "For any inquiries, you can contact us through the help page."
    },
  ];

  return (
    <main className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b px-4 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ChevronLeft className={cn("w-5 h-5", direction === 'ltr' && "rotate-180")} />
            {language === 'ar' ? "رجوع" : "Back"}
          </Button>
          
          <h1 className="font-bold text-lg">{language === 'ar' ? "سياسة الخصوصية" : "Privacy Policy"}</h1>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="gap-1"
          >
            <Globe className="w-4 h-4" />
            {language === 'ar' ? 'EN' : 'عربي'}
          </Button>
        </div>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Header Card */}
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-teal-light/5 border-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-xl">{t.privacy.title}</h2>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? "آخر تحديث: يناير 2025" : "Last updated: January 2025"}
              </p>
            </div>
          </div>
        </Card>

        {/* Introduction */}
        <Card className="p-5">
          <p className="text-muted-foreground leading-relaxed">{t.privacy.intro}</p>
        </Card>

        <Card className="p-5">
          <p className="text-muted-foreground leading-relaxed">{t.privacy.acceptPolicy}</p>
        </Card>

        <Card className="p-5">
          <p className="text-muted-foreground leading-relaxed">{t.privacy.appPurpose}</p>
        </Card>

        {/* Sections */}
        {sections.map((section, index) => (
          <Card key={index} className="p-5">
            <h3 className="font-bold text-lg mb-3 text-primary">{section.title}</h3>
            <p className="text-muted-foreground leading-relaxed">{section.content}</p>
          </Card>
        ))}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-4">
          <p>{language === 'ar' ? "للاستفسارات، تواصل معنا عبر" : "For inquiries, contact us at"}{" "}
            <Link href="/help" className="text-primary hover:underline">
              {language === 'ar' ? "صفحة المساعدة" : "Help page"}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
