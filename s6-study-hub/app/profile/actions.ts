"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signOutAction() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    // Even if Supabase is unreachable, still send the user to /login —
    // there's nothing more we can do server-side, and blocking them here
    // would trap them on a broken page.
    console.error("[signOutAction] Supabase call failed:", err instanceof Error ? err.message : err);
  }
  redirect("/login");
}
