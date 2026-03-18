"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-2xl border border-black/10 bg-white/95 px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/20 dark:bg-black/55",
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

