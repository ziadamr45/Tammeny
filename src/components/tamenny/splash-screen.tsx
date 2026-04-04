"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SplashScreenProps {
  onComplete?: () => void;
  duration?: number; // in milliseconds
}

export function SplashScreen({ onComplete, duration = 2500 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Start fade out animation before completing
    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, duration - 500);

    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, duration);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center",
        "bg-gradient-to-b from-[#F5F7F9] to-[#E8F4F4] dark:from-[#0B1F2A] dark:to-[#0D2D3A]",
        "transition-opacity duration-500",
        isFadingOut ? "opacity-0" : "opacity-100"
      )}
    >
      {/* Animated Logo Container */}
      <div className="flex flex-col items-center gap-6">
        {/* Logo Icon with Pulse Animation */}
        <div className="relative">
          {/* Ripple Effects */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: "2s" }} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-28 h-28 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.3s" }} />
          </div>
          
          {/* Main Logo Icon */}
          <div className="relative z-10 animate-bounce" style={{ animationDuration: "2s", animationTimingFunction: "ease-in-out" }}>
            <svg
              width="100"
              height="100"
              viewBox="0 0 512 512"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-2xl"
            >
              <defs>
                <linearGradient id="splashPinGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#4FD1C5" />
                  <stop offset="1" stopColor="#2CB1BC" />
                </linearGradient>
                <linearGradient id="splashHeartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#FFE066" />
                  <stop offset="1" stopColor="#FFD166" />
                </linearGradient>
              </defs>

              {/* Background */}
              <rect width="512" height="512" rx="100" fill="#F5F7F9" />

              {/* Waves */}
              <path d="M160 95 Q256 50 352 95" stroke="#F4B942" strokeWidth="10" fill="none" strokeLinecap="round" />
              <path d="M190 130 Q256 95 322 130" stroke="#F4B942" strokeWidth="7" fill="none" strokeLinecap="round" />

              {/* Pin */}
              <path d="M256 130 C365 130 410 235 256 400 C102 235 147 130 256 130Z" fill="url(#splashPinGrad)" />

              {/* Shield */}
              <path d="M256 175 L330 210 L315 305 L256 355 L197 305 L182 210Z" fill="#2CB1BC" />

              {/* Heart */}
              <path
                d="M256 295 C225 260 190 260 190 295 C190 330 256 365 256 365 C256 365 322 330 322 295 C322 260 287 260 256 295Z"
                fill="url(#splashHeartGrad)"
              />

              {/* Hand */}
              <path
                d="M195 325 Q240 280 305 335 Q260 375 215 350Z"
                fill="#2CB1BC"
                opacity="0.8"
              />

              {/* Lock */}
              <rect x="200" y="195" width="36" height="32" rx="8" fill="#F4B942" />
              <path
                d="M210 195 L210 180 C210 170 226 170 226 180 L226 195"
                stroke="#F4B942"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
              />
              <circle cx="218" cy="208" r="5" fill="#2CB1BC" />

              {/* Ripple */}
              <ellipse cx="256" cy="410" rx="80" ry="16" fill="#4FD1C5" opacity="0.25" />
            </svg>
          </div>
        </div>

        {/* App Name with Fade In Animation */}
        <div className="flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: "0.3s", animationFillMode: "both" }}>
          <h1
            className="text-4xl font-bold tracking-wide"
            style={{
              color: "#0F766E",
              fontFamily: "'Noto Sans Arabic', 'Cairo', sans-serif",
              letterSpacing: "0.02em",
            }}
          >
            طمنّي
          </h1>
          
          {/* Tagline with Fade In Animation */}
          <p 
            className="text-base text-muted-foreground animate-in fade-in duration-700"
            style={{ animationDelay: "0.6s", animationFillMode: "both" }}
          >
            أمانك بضغطة زر
          </p>
        </div>

        {/* Loading Indicator */}
        <div 
          className="mt-8 flex gap-1.5 animate-in fade-in duration-500"
          style={{ animationDelay: "0.9s", animationFillMode: "both" }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-primary"
              style={{
                animation: "bounce 1.4s ease-in-out infinite",
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;
