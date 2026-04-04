"use client";

import { useTheme } from "next-themes";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { container: "w-8 h-8", text: "text-lg" },
  md: { container: "w-12 h-12", text: "text-xl" },
  lg: { container: "w-16 h-16", text: "text-2xl" },
  xl: { container: "w-24 h-24", text: "text-3xl" },
};

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className={cn(
        "relative rounded-2xl overflow-hidden shadow-lg",
        sizeMap[size].container
      )}>
        <Image
          src={isDark ? "/logo-dark.svg" : "/logo-light.svg"}
          alt="طمنّي - Tamenny"
          fill
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <div className="flex flex-col items-center">
          <h1 className={cn("font-bold text-primary", sizeMap[size].text)}>
            طمنّي
          </h1>
          <p className="text-muted-foreground text-xs">أمانك بضغطة زر</p>
        </div>
      )}
    </div>
  );
}

export function LogoIcon({ size = "md", className }: Omit<LogoProps, "showText">) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className={cn(
      "relative rounded-xl overflow-hidden",
      sizeMap[size].container,
      className
    )}>
      <Image
        src={isDark ? "/logo-dark.svg" : "/logo-light.svg"}
        alt="طمنّي"
        fill
        className="object-contain"
        priority
      />
    </div>
  );
}

// Inline SVG Logo for faster loading (no image request)
export function LogoInline({ size = "md", showText = true, className }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  
  const sizeValue = size === "sm" ? 32 : size === "md" ? 48 : size === "lg" ? 64 : 96;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div 
        className={cn(
          "relative rounded-xl overflow-hidden shadow-lg",
          sizeMap[size].container
        )}
        style={{ width: sizeValue, height: sizeValue }}
      >
        <svg
          width={sizeValue}
          height={sizeValue}
          viewBox="0 0 512 512"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id={`pinGrad-${isDark ? 'dark' : 'light'}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isDark ? "#0F4C5C" : "#4FD1C5"}/>
              <stop offset="100%" stopColor={isDark ? "#0B3A47" : "#2CB1BC"}/>
            </linearGradient>
            <linearGradient id={`heartGrad-${isDark ? 'dark' : 'light'}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isDark ? "#FFD166" : "#FFE066"}/>
              <stop offset="100%" stopColor={isDark ? "#F4B942" : "#FFD166"}/>
            </linearGradient>
          </defs>
          
          {/* Background */}
          <rect width="512" height="512" rx="80" fill={isDark ? "#0B1F2A" : "#F5F7F9"}/>
          
          {/* Waves */}
          <path d="M160 95 Q256 50 352 95" stroke="#F4B942" strokeWidth="10" fill="none" strokeLinecap="round"/>
          <path d="M190 130 Q256 95 322 130" stroke="#F4B942" strokeWidth="7" fill="none" strokeLinecap="round"/>
          
          {/* Pin */}
          <path d="M256 130 C365 130 410 235 256 400 C102 235 147 130 256 130Z" fill={`url(#pinGrad-${isDark ? 'dark' : 'light'})`}/>
          
          {/* Shield */}
          <path d="M256 175 L330 210 L315 305 L256 355 L197 305 L182 210Z" fill={isDark ? "#1E7F8C" : "#2CB1BC"}/>
          
          {/* Heart */}
          <path d="M256 295 C225 260 190 260 190 295 C190 330 256 365 256 365 C256 365 322 330 322 295 C322 260 287 260 256 295Z" fill={`url(#heartGrad-${isDark ? 'dark' : 'light'})`}/>
          
          {/* Hand */}
          <path d="M195 325 Q240 280 305 335 Q260 375 215 350Z" fill={isDark ? "#1E7F8C" : "#2CB1BC"} opacity="0.8"/>
          
          {/* Lock */}
          <rect x="200" y="195" width="36" height="32" rx="8" fill="#F4B942"/>
          <path d="M210 195 L210 180 C210 170 226 170 226 180 L226 195" stroke="#F4B942" strokeWidth="6" fill="none" strokeLinecap="round"/>
          <circle cx="218" cy="208" r="5" fill={isDark ? "#0B3A47" : "#2CB1BC"}/>
          
          {/* Ripple */}
          <ellipse cx="256" cy="410" rx="80" ry="16" fill={isDark ? "#0F4C5C" : "#4FD1C5"} opacity="0.25"/>
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col items-center">
          <h1 className={cn("font-bold text-primary", sizeMap[size].text)}>
            طمنّي
          </h1>
          <p className="text-muted-foreground text-xs">أمانك بضغطة زر</p>
        </div>
      )}
    </div>
  );
}

// Simple inline icon for headers
export function LogoIconInline({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 512 512"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="pinGradIcon" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? "#0F4C5C" : "#4FD1C5"}/>
            <stop offset="100%" stopColor={isDark ? "#0B3A47" : "#2CB1BC"}/>
          </linearGradient>
        </defs>
        
        {/* Background circle */}
        <rect width="512" height="512" rx="128" fill={isDark ? "#0B1F2A" : "#F5F7F9"}/>
        
        {/* Pin */}
        <path d="M256 130 C365 130 410 235 256 400 C102 235 147 130 256 130Z" fill="url(#pinGradIcon)"/>
        
        {/* Heart */}
        <path d="M256 295 C225 260 190 260 190 295 C190 330 256 365 256 365 C256 365 322 330 322 295 C322 260 287 260 256 295Z" fill="#FFD166"/>
        
        {/* Lock */}
        <rect x="200" y="195" width="36" height="32" rx="8" fill="#F4B942"/>
      </svg>
      <span className="font-bold text-lg text-primary">طمنّي</span>
    </div>
  );
}

export default Logo;
