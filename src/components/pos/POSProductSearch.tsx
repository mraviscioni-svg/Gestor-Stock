"use client";

import type { ProductDTO } from "@/types";
import { Loader2, Search } from "lucide-react";
import { useState } from "react";

type Props = {
  onPick: (p: ProductDTO) => void;
};

export function POSProductSearch({ onPick }: Props) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(false);

  async function search() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/products?${params}`, { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    setResults(res.ok ? (data.data as ProductDTO[]) ?? [] : []);
    setLoading(false);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase text-slate-500">Buscar producto</p>
      <div className="mt-2 flex gap-2">
        <input
          className="min-h-[48px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-base outline-none ring-sky-500/30 focus:border-sky-500 focus:ring-4"
          placeholder="Nombre o código…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void search()}
        />
        <button
          type="button"
          onClick={() => void search()}
          className="touch-manipulation inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl bg-slate-900 text-white"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
        </button>
      </div>
      {results.length > 0 ? (
        <ul className="mt-3 max-h-56 space-y-1 overflow-y-auto">
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                disabled={!p.active || p.stock <= 0}
                onClick={() => onPick(p)}
                className="flex w-full touch-manipulation items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-left text-sm hover:border-sky-200 hover:bg-sky-50 disabled:opacity-40"
              >
                <span className="font-medium text-slate-900">{p.name}</span>
                <span className="text-xs text-slate-500">Stock {p.stock}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
