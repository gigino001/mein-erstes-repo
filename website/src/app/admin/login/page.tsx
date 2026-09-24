"use client";

import { useActionState } from "react";
import { login } from "@/app/admin/actions";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <form action={formAction} className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold tracking-[0.14em] uppercase text-ocean">
            Admin
          </span>
          <h1 className="font-poster uppercase text-4xl">Login</h1>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-semibold">
            Passwort
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoFocus
            className="border border-sky-mist rounded-xl px-4 py-3"
          />
        </div>
        {state && !state.ok && <p className="text-sm text-coral font-semibold">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="font-poster uppercase text-lg text-white bg-ocean rounded-full px-8 py-4 disabled:opacity-40 transition"
        >
          {pending ? "Prüfe…" : "Anmelden"}
        </button>
      </form>
    </div>
  );
}
