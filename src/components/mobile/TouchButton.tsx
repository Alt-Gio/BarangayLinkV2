import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TouchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export function TouchButton({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  ...props
}: TouchButtonProps) {
  const baseClasses = "touch-manipulation active:scale-95 transition-all duration-150 rounded-lg font-medium flex items-center justify-center gap-2";
  
  const variantClasses = {
    primary: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg active:shadow-md",
    secondary: "bg-gray-700 hover:bg-gray-600 text-white shadow-md active:shadow-sm",
    ghost: "bg-transparent hover:bg-white/10 text-gray-300",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-lg active:shadow-md",
  };

  const sizeClasses = {
    sm: "min-h-[36px] px-3 text-sm",
    md: "min-h-[44px] px-4 text-base",
    lg: "min-h-[52px] px-6 text-lg",
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
