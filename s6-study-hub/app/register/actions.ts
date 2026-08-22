"use server";

import { createClient } from "@/lib/supabase/server";
import { registerSchema, type RegisterInput } from "@/lib/validation/auth";
import { redirect } from "next/navigation";

export type RegisterState = {
  error: string | null;
  needsEmailConfirmation: boolean;
};

const initialState: RegisterState = { error: null, needsEmailConfirmation: false };

/**
 * Creates the auth user with ALL onboarding data (school, combination,
 * subjects) attached as signUp metadata, instead of writing to `profiles`
 * from this action directly.
 *
 * Why: when email confirmation is enabled (Supabase's default), signUp()
 * returns `session: null` — there is no authenticated request yet, so an
 * immediate `.from('profiles').update(...)` would be silently blocked by
 * RLS (or fail outright). Putting the onboarding data in
 * `raw_user_meta_data` and letting the `handle_new_user` trigger
 * (SECURITY DEFINER) populate the profile row works correctly regardless
 * of whether email confirmation is on or off — see
 * supabase/migrations/0005_stabilization.sql.
 */
export async function registerAction(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const raw: RegisterInput = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    schoolId: formData.get("schoolId") ? String(formData.get("schoolId")) : undefined,
    schoolName: formData.get("schoolName") ? String(formData.get("schoolName")) : undefined,
    levelYear: "S6",
    subjectCombinationId: String(formData.get("subjectCombinationId") ?? ""),
    subjectIds: formData.getAll("subjectIds").map(String),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again.", needsEmailConfirmation: false };
  }
  const data = parsed.data;

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch (err) {
    console.error("[registerAction] Supabase client init failed:", err instanceof Error ? err.message : err);
    return { error: "The service is temporarily unavailable. Please try again shortly.", needsEmailConfirmation: false };
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.name,
        school_id: data.schoolId ?? null,
        school_name_freetext: data.schoolId ? null : data.schoolName ?? null,
        subject_combination_id: data.subjectCombinationId,
        subject_ids: data.subjectIds,
      },
    },
  });

  if (signUpError) {
    return { error: signUpError.message || "Could not create account. Try again.", needsEmailConfirmation: false };
  }

  // Duplicate email (already confirmed): Supabase returns a user object with
  // an empty `identities` array and no error — this is intentional, to
  // avoid leaking which emails are registered. We show the SAME generic
  // "check your email" message we'd show a genuine new signup, rather than
  // "this email is taken", so the response doesn't reveal account existence.
  const looksLikeExistingAccount = signUpData.user && signUpData.user.identities?.length === 0;

  if (looksLikeExistingAccount) {
    return { error: null, needsEmailConfirmation: true };
  }

  // Email confirmation is required (the default) — no session yet.
  if (!signUpData.session) {
    return { error: null, needsEmailConfirmation: true };
  }

  // Email confirmation is disabled for this project — session exists
  // immediately, profile row already populated by the trigger.
  redirect("/");
}
