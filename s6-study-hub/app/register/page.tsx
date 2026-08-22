import Link from "next/link";
import { safeSupabase } from "@/lib/supabase/safe";
import RegisterForm from "./RegisterForm";
import { AlertTriangle } from "lucide-react";

export const metadata = { title: "Create your account — S6 Study Hub" };

export default async function RegisterPage() {
  const catalogue = await safeSupabase(async (supabase) => {
    const [{ data: combinations }, { data: subjects }, { data: schools }] = await Promise.all([
      supabase.from("subject_combinations").select("id, code, display_name").order("code"),
      supabase.from("subjects").select("id, name, category").order("name"),
      supabase.from("schools").select("id, name, district").order("name").limit(200),
    ]);
    return { combinations: combinations ?? [], subjects: subjects ?? [], schools: schools ?? [] };
  });

  if (catalogue.error) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <AlertTriangle size={28} className="mx-auto text-marker-red" aria-hidden="true" />
        <h1 className="mt-3 text-lg font-semibold text-ink">Temporarily unavailable</h1>
        <p className="mt-2 text-sm text-slate">
          We&apos;re having trouble reaching the server. Please try again shortly.
        </p>
      </div>
    );
  }

  const { combinations, subjects, schools } = catalogue.data!;

  return (
    <div className="mx-auto max-w-md px-5 py-10">
      <h1 className="text-2xl font-semibold text-ink">Create your account</h1>
      <p className="mt-1 text-sm text-slate">
        Set up your S6 profile — subjects, school and combination help us tailor your revision plan.
      </p>

      <div className="mt-6">
        <RegisterForm combinations={combinations} subjects={subjects} schools={schools} />
      </div>

      <p className="mt-6 text-center text-sm text-slate">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-marker-green underline underline-offset-2">
          Log in
        </Link>
      </p>
    </div>
  );
}
