import { createClient } from "@/lib/supabase/server";
import { Countdown } from "@/components/ui/Countdown";
import { Card } from "@/components/ui/Card";
import { PaperCard } from "@/components/papers/PaperCard";
import Link from "next/link";
import { BookOpen, TrendingUp, Clock } from "lucide-react";
import { listPopularPapers, listRecentlyViewedPapers, listSubjects } from "@/lib/papers/queries";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: exam } = await supabase
    .from("exam_configuration")
    .select("label, exam_date, is_confirmed")
    .eq("is_active", true)
    .maybeSingle();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <h1 className="text-2xl font-semibold text-ink">S6 Study Hub</h1>
        <p className="mt-2 text-sm text-slate">
          Past papers, practice, discussions and a revision plan — built for UACE 2026.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/login" className="rounded-card bg-marker-green px-4 py-2.5 text-sm font-semibold text-white">
            Log in
          </Link>
          <Link href="/register" className="rounded-card bg-chalk-dim px-4 py-2.5 text-sm font-semibold text-ink">
            Create account
          </Link>
        </div>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_suspended")
    .eq("id", user.id)
    .single();

  if (profile?.is_suspended) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <h1 className="text-xl font-semibold text-marker-red">Account suspended</h1>
        <p className="mt-2 text-sm text-slate">
          This account has been suspended. Contact an administrator if you think this is a mistake.
        </p>
      </div>
    );
  }

  // Load independently so one failure (e.g. an empty popular-papers RPC on
  // a brand new project) doesn't blank the whole dashboard.
  const [recentlyViewed, popular, subjects, weeklyViewCount] = await Promise.all([
    listRecentlyViewedPapers(3).catch(() => []),
    listPopularPapers(3).catch(() => []),
    listSubjects().catch(() => []),
    supabase
      .from("paper_views")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("viewed_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .then(({ count }) => count ?? 0),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-5">
      <Countdown examDateISO={exam?.exam_date ?? null} examLabel={exam?.label ?? "UACE"} isConfirmed={exam?.is_confirmed ?? false} />

      <section aria-labelledby="activity-heading">
        <h2 id="activity-heading" className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate">
          Revision activity
        </h2>
        <Card className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-marker-green-soft text-marker-green">
            <Clock size={18} aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">
              {weeklyViewCount} paper{weeklyViewCount === 1 ? "" : "s"} viewed this week
            </p>
            <p className="text-xs text-slate">Keep the streak going.</p>
          </div>
        </Card>
      </section>

      <section aria-labelledby="recent-heading">
        <div className="mb-2 flex items-center justify-between">
          <h2 id="recent-heading" className="text-sm font-semibold uppercase tracking-wide text-slate">
            Continue studying
          </h2>
          <Link href="/papers" className="text-xs font-medium text-marker-green underline underline-offset-2">
            See all
          </Link>
        </div>
        {recentlyViewed.length === 0 ? (
          <Card className="text-center text-sm text-slate">
            No papers viewed yet.{" "}
            <Link href="/papers" className="font-medium text-marker-green underline underline-offset-2">
              Browse past papers
            </Link>
          </Card>
        ) : (
          <ul className="space-y-3">
            {recentlyViewed.map((paper) => (
              <li key={paper.id}><PaperCard paper={paper} /></li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="popular-heading">
        <h2 id="popular-heading" className="mb-2 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-slate">
          <TrendingUp size={14} aria-hidden="true" /> Popular papers
        </h2>
        {popular.length === 0 ? (
          <Card className="text-center text-sm text-slate">Not enough activity yet to show trends.</Card>
        ) : (
          <ul className="space-y-3">
            {popular.map((paper) => (
              <li key={paper.id}><PaperCard paper={paper} /></li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="subjects-heading">
        <h2 id="subjects-heading" className="mb-2 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-slate">
          <BookOpen size={14} aria-hidden="true" /> Subjects
        </h2>
        {subjects.length === 0 ? (
          <Card className="text-center text-sm text-slate">No subjects available yet.</Card>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {subjects.map((s) => (
              <Link
                key={s.id}
                href={`/papers?subject=${s.id}`}
                className="tap-target rounded-card border border-ink/10 bg-white px-3 py-2.5 text-sm font-medium text-ink hover:border-marker-green/40"
              >
                {s.name}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
