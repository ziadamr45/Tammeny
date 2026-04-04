"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Globe, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";

export default function TermsPage() {
  const router = useRouter();
  const { language, setLanguage, t, direction } = useLanguage();

  const sections = [
    {
      title: language === 'ar' ? t.terms.sections.usage : "Acceptable Use",
      content: language === 'ar' ? t.terms.sections.usageContent : "The app may only be used for legitimate purposes. It is prohibited to use the app for any illegal or harmful purposes."
    },
    {
      title: language === 'ar' ? t.terms.sections.privacy : "Privacy",
      content: language === 'ar' ? t.terms.sections.privacyContent : "We respect your privacy and are committed to protecting your personal data. Please refer to the Privacy Policy for details."
    },
    {
      title: language === 'ar' ? t.terms.sections.ip : "Intellectual Property",
      content: language === 'ar' ? t.terms.sections.ipContent : "All intellectual property rights related to the app are reserved by the Tamenny team."
    },
    {
      title: language === 'ar' ? t.terms.sections.trademarks : "Trademarks",
      content: language === 'ar' ? t.terms.sections.trademarksContent : "The trademarks and logos used in the app are the exclusive property of Tamenny and are protected by law."
    },
    {
      title: language === 'ar' ? t.terms.sections.limitation : "Limitation of Liability",
      content: language === 'ar' ? t.terms.sections.limitationContent : "The Tamenny team is not liable for any damages resulting from the use of the app."
    },
    {
      title: language === 'ar' ? t.terms.sections.changes : "Changes",
      content: language === 'ar' ? t.terms.sections.changesContent : "The Tamenny team reserves the right to modify these terms at any time."
    },
    {
      title: language === 'ar' ? t.terms.sections.contact : "Contact",
      content: language === 'ar' ? t.terms.sections.contactContent : "All legal correspondence must be in Arabic and sent to Tamenny's registered address."
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
          
          <h1 className="font-bold text-lg">{language === 'ar' ? "شروط الاستخدام" : "Terms of Service"}</h1>
          
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
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-xl">{t.terms.title}</h2>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? "آخر تحديث: يناير 2025" : "Last updated: January 2025"}
              </p>
            </div>
          </div>
        </Card>

        {/* Introduction */}
        <Card className="p-5">
          <p className="text-muted-foreground leading-relaxed">{t.terms.intro}</p>
        </Card>

        <Card className="p-5">
          <p className="text-muted-foreground leading-relaxed">{t.terms.acceptTerms}</p>
        </Card>

        <Card className="p-5">
          <p className="text-muted-foreground leading-relaxed">{t.terms.appDescription}</p>
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
