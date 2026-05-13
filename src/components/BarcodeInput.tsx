"use client";

import { useEffect, useRef, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

type Props = {
  onScan: (code: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

/**
 * HID keyboard wedge scanner: rapid key events ending with Enter.
 * Server never sees raw keystrokes — only the submitted code after Enter.
 */
export function BarcodeInput({ onScan, disabled, placeholder, className }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, [disabled]);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const raw = ref.current?.value ?? "";
    const code = raw.trim();
    if (!code) return;
    onScan(code);
    if (ref.current) ref.current.value = "";
    requestAnimationFrame(() => ref.current?.focus());
  }

  return (
    <input
      ref={ref}
      disabled={disabled}
      onKeyDown={handleKeyDown}
      autoComplete="off"
      spellCheck={false}
      placeholder={placeholder ?? "Escaneá el código de barras y presioná Enter"}
      className={cn(
        "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm tracking-wide text-slate-900 shadow-inner outline-none ring-sky-500/30 focus:border-sky-500 focus:ring-4",
        className
      )}
    />
  );
}
