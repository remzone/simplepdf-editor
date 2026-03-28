// frontend/src/components/ui/badge.tsx
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BadgeProps = {
  className?: string;
  children: ReactNode;
};

export function Badge({ className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/40 bg-white/65 px-2.5 py-1 text-xs font-semibold text-text",
        className
      )}
    >
      {children}
    </span>
  );
}
