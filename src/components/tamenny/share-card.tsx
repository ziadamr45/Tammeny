"use client";

import { MapPin, Navigation, Clock, Shield, Eye, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  isPrimary?: boolean;
}

export function StatusCard({ icon, label, value, isPrimary }: StatusCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-3 rounded-xl min-w-[80px]",
        isPrimary
          ? "bg-primary text-primary-foreground"
          : "bg-card card-shadow"
      )}
    >
      <div className={cn("mb-1", isPrimary ? "text-primary-foreground" : "text-primary")}>
        {icon}
      </div>
      <span className={cn("text-xs", isPrimary ? "text-primary-foreground/80" : "text-muted-foreground")}>
        {label}
      </span>
      <span className={cn("font-bold text-sm", isPrimary ? "text-primary-foreground" : "text-foreground")}>
        {value}
      </span>
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
}

export function ActionButton({
  icon,
  label,
  onClick,
  variant = "primary",
  className,
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 active:scale-95",
        variant === "primary" && "bg-primary text-primary-foreground hover:bg-teal-dark",
        variant === "secondary" && "bg-secondary text-foreground hover:bg-muted",
        variant === "outline" && "border-2 border-primary text-primary hover:bg-primary/10",
        className
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

interface ShareOptionProps {
  duration: number;
  label: string;
  description: string;
  selected?: boolean;
  onClick?: () => void;
}

export function ShareOption({
  duration,
  label,
  description,
  selected,
  onClick,
}: ShareOptionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200",
        selected
          ? "border-primary bg-primary/10"
          : "border-border bg-card hover:border-primary/50"
      )}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center",
          selected ? "bg-primary text-primary-foreground" : "bg-secondary"
        )}
      >
        <Clock className="w-5 h-5" />
      </div>
      <div className="flex-1 text-right">
        <div className="font-bold">{label}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
    </button>
  );
}

export function DestinationCard() {
  return (
    <div className="bg-card rounded-2xl card-shadow p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <MapPin className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="font-medium">أضف وجهة</div>
          <div className="text-sm text-muted-foreground">اختر وجهتك على الخريطة</div>
        </div>
        <Plus className="w-5 h-5 text-primary" />
      </div>
      
      <div className="flex gap-3">
        <ActionButton
          icon={<MapPin className="w-4 h-4" />}
          label="اختر على الخريطة"
          variant="outline"
          className="flex-1 text-sm px-4"
        />
        <ActionButton
          icon={<Navigation className="w-4 h-4" />}
          label="تتبع الآن"
          variant="primary"
          className="flex-1 text-sm px-4"
        />
      </div>
    </div>
  );
}
