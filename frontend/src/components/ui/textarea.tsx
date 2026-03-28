// frontend/src/components/ui/textarea.tsx
import * as React from "react";

import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[100px] w-full rounded-xl border border-white/40 bg-white/65 px-3 py-2 text-sm text-text outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-accent/40",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
