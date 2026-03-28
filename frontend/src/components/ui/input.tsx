// frontend/src/components/ui/input.tsx
import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-xl border border-white/40 bg-white/65 px-3 py-2 text-sm text-text outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-accent/40",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
