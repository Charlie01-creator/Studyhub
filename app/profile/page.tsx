import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOutAction } from "./actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const metadata = { title: "Profile — S6 Study Hub" };

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, level_year, school_id, school_name_freetext")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-6">
      <h1 className="text-xl font-semibold text-ink">Profile</h1>

      <Card className="space-y-2 text-sm">
        <p><span className="text-slate">Name:</span> {profile?.full_name ?? "—"}</p>
        <p><span className="text-slate">Email:</span> {user.email}</p>
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
