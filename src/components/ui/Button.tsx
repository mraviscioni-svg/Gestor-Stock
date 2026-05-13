import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
};

export function Button({ className, variant = "primary", ...props }: Props) {
  const styles =
    variant === "primary"
      ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800"
      : variant === "outline"
        ? "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
        : "text-slate-700 hover:bg-slate-100";
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        styles,
        className
      )}
      {...props}
    />
  );
}
