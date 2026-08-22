import { safeSupabase } from "@/lib/supabase/safe";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOutAction } from "./actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AlertTriangle } from "lucide-react";

export const metadata = { title: "Profile — S6 Study Hub" };

export default async function ProfilePage() {
  const result = await safeSupabase(async (supabase) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role, level_year, school_id, school_name_freetext")
      .eq("id", user.id)
      .single();

    return { email: user.email, profile };
  });

  if (result.error) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <AlertTriangle size={28} className="mx-auto text-marker-red" aria-hidden="true" />
        <h1 className="mt-3 text-lg font-semibold text-ink">Temporarily unavailable</h1>
        <p className="mt-2 text-sm text-slate">We&apos;re having trouble reaching the server. Please try again shortly.</p>
      </div>
    );
  }

  if (!result.data) redirect("/login");
  const { email, profile } = result.data;

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-6">
      <h1 className="text-xl font-semibold text-ink">Profile</h1>

      <Card className="space-y-2 text-sm">
        <p><span className="text-slate">Name:</span> {profile?.full_name ?? "—"}</p>
        <p><span className="text-slate">Email:</span> {email}</p>
        <p><span className="text-slate">Level:</span> {profile?.level_year ?? "S6"}</p>
        <p><span className="text-slate">Role:</span> {profile?.role ?? "student"}</p>
      </Card>

      {profile?.role === "admin" && (
        <Link
          href="/admin/papers"
          className="tap-target block rounded-card bg-marker-amber-soft px-4 py-3 text-center text-sm font-semibold text-[#8A5A00]"
        >
          Manage Papers (Admin)
        </Link>
      )}

      <form action={signOutAction}>
        <Button type="submit" variant="secondary" className="w-full">
          Log out
        </Button>
      </form>
    </div>
  );
}
