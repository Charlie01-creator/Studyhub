import { cn } from "@/lib/utils/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "tap-target inline-flex items-center justify-center rounded-card px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-marker-green text-white hover:bg-marker-green/90",
        variant === "secondary" && "bg-chalk-dim text-ink hover:bg-ink/10",
        variant === "ghost" && "text-ink hover:bg-chalk-dim",
        className
      )}
      {...props}
    />
  );
}
