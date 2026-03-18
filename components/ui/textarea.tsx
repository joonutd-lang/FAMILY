"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full resize-none rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/20 dark:bg-black/55",
        className,
      )}
      {...props}
    />
  );
}

