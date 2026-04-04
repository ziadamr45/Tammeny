import type { Metadata, Viewport } from "next";
import { Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "طمنّي - Tamenny",
  description: "تتبع الموقع في الوقت الحقيقي بأمان وخصوصية تامة",
  keywords: ["تتبع", "موقع", "أمان", "خصوصية", "مشاركة", "GPS"],
  authors: [{ name: "طمنّي" }],
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-512.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "طمنّي",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "طمنّي - Tamenny",
    description: "تتبع الموقع في الوقت الحقيقي بأمان وخصوصية تامة",
    type: "website",
    locale: "ar_EG",
  },
  twitter: {
    card: "summary_large_image",
    title: "طمنّي - Tamenny",
    description: "تتبع الموقع في الوقت الحقيقي بأمان وخصوصية تامة",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0D7377",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body
        className={`${notoSansArabic.variable} font-sans antialiased bg-background text-foreground min-h-screen`}
        style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
