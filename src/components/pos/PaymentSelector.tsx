"use client";

import type { PaymentMethod } from "@prisma/client";
import { cn } from "@/lib/utils";

const methods: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Efectivo" },
  { value: "DEBIT", label: "Débito" },
  { value: "CREDIT", label: "Crédito" },
  { value: "TRANSFER", label: "Transferencia" },
  { value: "MERCADO_PAGO", label: "Mercado Pago" },
];

type Props = {
  value: PaymentMethod;
  onChange: (v: PaymentMethod) => void;
  disabled?: boolean;
  /** default: labels for dark panel (POS). Use "light" on white cards. */
  variant?: "dark" | "light";
};

export function PaymentSelector({ value, onChange, disabled, variant = "dark" }: Props) {
  const isLight = variant === "light";
  return (
    <div>
      <p
        className={cn(
          "text-xs font-semibold uppercase",
          isLight ? "text-slate-600" : "text-slate-300"
        )}
      >
        Medio de pago
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {methods.map((m) => (
          <button
            key={m.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(m.value)}
            className={cn(
              "touch-manipulation rounded-xl px-2 py-3 text-xs font-semibold transition sm:text-sm",
              value === m.value
                ? isLight
                  ? "bg-sky-600 text-white ring-2 ring-sky-300"
                  : "bg-sky-400 text-slate-950 ring-2 ring-white"
                : isLight
                  ? "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                  : "bg-white/10 text-slate-200 hover:bg-white/20"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
