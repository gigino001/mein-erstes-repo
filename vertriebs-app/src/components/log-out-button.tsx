"use client";

import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/(app)/actions";

export function LogOutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-red-600 dark:text-slate-400"
      >
        <LogOut size={13} />
        Abmelden
      </button>
    </form>
  );
}
