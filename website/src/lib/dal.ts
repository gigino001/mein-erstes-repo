import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { decryptSession, getAdminSessionCookie } from "@/lib/session";

/** Prüft die Admin-Session; leitet zum Login um, falls keine gültige Session vorliegt. */
export const verifyAdminSession = cache(async () => {
  const cookie = await getAdminSessionCookie();
  const session = await decryptSession(cookie);

  if (!session?.admin) {
    redirect("/admin/login");
  }

  return { isAdmin: true as const };
});
