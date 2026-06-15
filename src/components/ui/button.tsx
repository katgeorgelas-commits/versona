import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "accent" | "outline" | "ghost" | "subtle" | "destructive";
type Size = "sm" | "md" | "lg" | "icon";

// Pill buttons. Single accent. Borders/fills only — no shadows, no transforms.
const variants: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  accent: "bg-accent text-white hover:bg-accent-hover",
  outline:
    "border-1.5 border-accent bg-transparent text-accent hover:bg-accent hover:text-white",
  ghost: "bg-transparent text-ink-2 hover:bg-bg-muted hover:text-ink-1",
  subtle: "bg-bg-muted text-ink-1 hover:bg-line",
  destructive: "bg-error text-white hover:opacity-90",
};

const sizes: Record<Size, string> = {
  sm: "h-7 px-3.5 text-xs",
  md: "h-9 px-4 text-[13px]",
  lg: "h-11 px-6 text-sm",
  icon: "h-9 w-9",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full font-semibold tracking-[0.01em] transition-colors duration-[140ms] disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
