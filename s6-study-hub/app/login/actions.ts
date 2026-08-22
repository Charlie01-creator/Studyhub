"use server";

import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/auth";
import { redirect } from "next/navigation";

export type LoginState = { error: string | null };

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details and try again." };
  }

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch (err) {
    console.error("[loginAction] Supabase client init failed:", err instanceof Error ? err.message : err);
    return { error: "The service is temporarily unavailable. Please try again shortly." };
  }

  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Supabase returns a generic invalid-credentials error for both "wrong
    // password" and "no such user" — kept generic here too, so the login
    // form never confirms or denies whether an email is registered.
    return { error: "Incorrect email or password." };
  }

  // Suspended check: a suspended student can still authenticate (their
  // credentials are valid), but the app must not let them in. This is
  // enforced here, not just in the UI — sign them straight back out so no
  // authenticated session survives the request.
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_suspended")
    .eq("id", data.user.id)
    .single();

  if (profile?.is_suspended) {
    await supabase.auth.signOut();
    return { error: "This account has been suspended. Contact an administrator if you think this is a mistake." };
  }

  redirect("/");
}
