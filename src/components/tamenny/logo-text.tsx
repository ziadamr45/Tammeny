"use client";

import { cn } from "@/lib/utils";

interface LogoTextProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showTagline?: boolean;
}

const sizeMap = {
  xs: { text: "text-base", tagline: "text-[8px]" },
  sm: { text: "text-xl", tagline: "text-[10px]" },
  md: { text: "text-2xl", tagline: "text-xs" },
  lg: { text: "text-3xl", tagline: "text-sm" },
  xl: { text: "text-4xl", tagline: "text-base" },
};

/**
 * LogoText - Displays "طمنّي" text with proper styling
 * Uses a modern Arabic font style with the shadda on ن
 */
export function LogoText({ size = "md", className, showTagline = false }: LogoTextProps) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* كلمة طمنّي مع الشدة على النون */}
      <span 
        className={cn(
          "font-bold tracking-wide",
          sizeMap[size].text
        )}
        style={{
          color: "#0F766E", // teal-700
          fontFamily: "'Noto Sans Arabic', 'Cairo', sans-serif",
          letterSpacing: "0.02em",
        }}
      >
        طمنّي
      </span>
      {showTagline && (
        <span 
          className={cn(
            "text-muted-foreground mt-1",
            sizeMap[size].tagline
          )}
        >
          أمانك بضغطة زر
        </span>
      )}
    </div>
  );
}

/**
 * LogoTextInline - Inline version for use in sentences and headers
 */
export function LogoTextInline({ 
  size = "md", 
  className 
}: Omit<LogoTextProps, "showTagline">) {
  return (
    <span 
      className={cn(
        "font-bold inline-block",
        sizeMap[size].text,
        className
      )}
      style={{
        color: "#0F766E", // teal-700
        fontFamily: "'Noto Sans Arabic', 'Cairo', sans-serif",
        letterSpacing: "0.02em",
      }}
    >
      طمنّي
    </span>
  );
}

export default LogoText;
