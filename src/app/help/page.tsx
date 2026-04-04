"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronLeft,
  Globe,
  HelpCircle,
  MessageCircle,
  MapPin,
  AlertTriangle,
  Battery,
  Lock,
  Rocket,
  ChevronDown,
  ChevronUp,
  Send,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";

export default function HelpPage() {
  const router = useRouter();
  const { language, setLanguage, t, direction } = useLanguage();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [sending, setSending] = useState(false);

  const faqs = [
    {
      icon: Rocket,
      title: t.help.gettingStarted,
      content: t.help.gettingStartedContent,
    },
    {
      icon: MapPin,
      title: t.help.topics.shareLocation,
      content: t.help.topics.shareLocationContent,
    },
    {
      icon: AlertTriangle,
      title: t.help.topics.emergency,
      content: t.help.topics.emergencyContent,
    },
    {
      icon: Battery,
      title: t.help.topics.batterySaver,
      content: t.help.topics.batterySaverContent,
    },
    {
      icon: Lock,
      title: t.help.topics.privacy,
      content: t.help.topics.privacyContent,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error(language === 'ar' ? "جميع الحقول مطلوبة" : "All fields are required");
      return;
    }

    setSending(true);
    
    try {
      const response = await fetch('/api/help/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(t.help.messageSent);
        setFormData({ name: "", email: "", message: "" });
      } else {
        toast.error(language === 'ar' ? "فشل إرسال الرسالة" : "Failed to send message");
      }
    } catch (error) {
      toast.error(language === 'ar' ? "فشل إرسال الرسالة" : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

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
          
          <h1 className="font-bold text-lg">{t.help.title}</h1>
          
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
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-xl">{t.help.title}</h2>
              <p className="text-sm text-muted-foreground">{t.help.subtitle}</p>
            </div>
          </div>
        </Card>

        {/* FAQ Section */}
        <div>
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            {t.help.faq}
          </h3>
          
          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const Icon = faq.icon;
              const isExpanded = expandedFaq === index;
              
              return (
                <Card
                  key={index}
                  className={cn(
                    "overflow-hidden transition-all cursor-pointer",
                    isExpanded && "ring-2 ring-primary/20"
                  )}
                  onClick={() => setExpandedFaq(isExpanded ? null : index)}
                >
                  <div className="p-4 flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                      isExpanded ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{faq.title}</h4>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  
                  {isExpanded && (
                    <div className="px-4 pb-4">
                      <p className="text-muted-foreground leading-relaxed text-sm">
                        {faq.content}
                      </p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Contact Form */}
        <div>
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            {t.help.contactSupport}
          </h3>
          
          <Card className="p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t.help.name}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={language === 'ar' ? "أدخل اسمك" : "Enter your name"}
                  className="h-12"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">{t.help.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@example.com"
                  className="h-12"
                  dir="ltr"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">{t.help.message}</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={t.help.messagePlaceholder}
                  rows={4}
                  className="resize-none"
                />
              </div>
              
              <Button
                type="submit"
                className="w-full h-12 rounded-xl"
                disabled={sending}
              >
                {sending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className={cn("w-4 h-4", direction === 'rtl' ? 'ml-2' : 'mr-2')} />
                    {t.help.send}
                  </>
                )}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </main>
  );
}
