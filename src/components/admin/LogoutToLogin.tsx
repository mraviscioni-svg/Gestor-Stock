"use client";

export function LogoutToLogin() {
  async function go() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }
  return (
    <button
      type="button"
      onClick={() => void go()}
      className="mt-8 w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
    >
      Salir
    </button>
  );
}
