import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
  status?: string;
}

function Badge({ className, variant = 'default', status, ...props }: BadgeProps) {
  let customStyle = "";
  
  if (status) {
    const s = status.toLowerCase();
    if (s === 'lead') {
      customStyle = "bg-[rgba(142,142,147,0.1)] text-[var(--status-lead)] border-[rgba(142,142,147,0.2)]";
    } else if (s === 'verified') {
      customStyle = "bg-[rgba(255,69,0,0.1)] text-[var(--status-verified)] border-[rgba(255,69,0,0.2)]";
    } else if (s === 'searching') {
      customStyle = "bg-[rgba(255,149,0,0.1)] text-[var(--status-searching)] border-[rgba(255,149,0,0.2)]";
    } else if (s === 'matched') {
      customStyle = "bg-[rgba(0,199,190,0.1)] text-[var(--status-matched)] border-[rgba(0,199,190,0.2)]";
    } else if (s === 'meeting scheduled') {
      customStyle = "bg-[rgba(50,173,230,0.1)] text-[var(--status-meeting)] border-[rgba(50,173,230,0.2)]";
    } else if (s === 'engaged') {
      customStyle = "bg-[rgba(175,82,222,0.1)] text-[var(--status-engaged)] border-[rgba(175,82,222,0.2)]";
    } else if (s === 'married') {
      customStyle = "bg-[rgba(52,199,89,0.1)] text-[var(--status-married)] border-[rgba(52,199,89,0.2)]";
    } else if (s === 'inactive') {
      customStyle = "bg-[rgba(199,199,204,0.1)] text-[var(--status-inactive)] border-[rgba(199,199,204,0.2)]";
    } else {
      customStyle = "bg-[rgba(255,69,0,0.1)] text-[var(--status-verified)] border-[rgba(255,69,0,0.2)]";
    }
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none uppercase tracking-wider text-[10px]",
        status ? customStyle : {
          'bg-primary text-white border-transparent': variant === 'default',
          'bg-surface-secondary text-text-primary border-transparent': variant === 'secondary',
          'bg-red-50/15 text-red-500 border-red-200': variant === 'destructive',
          'text-text-primary border-border-custom': variant === 'outline',
          'bg-[rgba(52,199,89,0.1)] text-[var(--status-married)] border-[rgba(52,199,89,0.2)]': variant === 'success',
          'bg-[rgba(255,149,0,0.1)] text-[var(--status-searching)] border-[rgba(255,149,0,0.2)]': variant === 'warning',
          'bg-[rgba(50,173,230,0.1)] text-[var(--status-meeting)] border-[rgba(50,173,230,0.2)]': variant === 'info',
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
export type { BadgeProps as BadgeElementProps };
