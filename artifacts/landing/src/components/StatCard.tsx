import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: ReactNode;
  unit?: string;
  icon?: ReactNode;
  accent?: "primary" | "warm" | "leaf" | "chili";
  hint?: string;
  className?: string;
}

const accentMap = {
  primary: "bg-gradient-cool text-primary-foreground",
  warm: "bg-gradient-warm text-accent-foreground",
  leaf: "bg-gradient-leaf text-primary-foreground",
  chili: "bg-chili text-primary-foreground",
};

export function StatCard({ label, value, unit, icon, accent = "primary", hint, className }: StatCardProps) {
  return (
    <div className={cn("rounded-2xl bg-card p-5 shadow-soft transition-smooth hover:shadow-card", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums">
            {value}
            {unit && <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span>}
          </p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {icon && (
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl shadow-soft", accentMap[accent])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
