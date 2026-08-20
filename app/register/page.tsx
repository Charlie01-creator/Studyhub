import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import RegisterForm from "./RegisterForm";

export const metadata = { title: "Create your account — S6 Study Hub" };

export default async function RegisterPage() {
  const supabase = await createClient();

  const [{ data: combinations }, { data: subjects }, { data: schools }] = await Promise.all([
    supabase.from("subject_combinations").select("id, code, display_name").order("code"),
    supabase.from("subjects").select("id, name, category").order("name"),
    supabase.from("schools").select("id, name, district").order("name").limit(200),
  ]);

  return (
    <div className="mx-auto max-w-md px-5 py-10">
      <h1 className="text-2xl font-semibold text-ink">Create your account</h1>
      <p className="mt-1 text-sm text-slate">
        Set up your S6 profile — subjects, school and combination help us tailor your revision plan.
      </p>

      <div className="mt-6">
        <RegisterForm
          combinations={combinations ?? []}
          subjects={subjects ?? []}
          schools={schools ?? []}
        />
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
