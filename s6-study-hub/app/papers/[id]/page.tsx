import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { safeSupabase } from "@/lib/supabase/safe";
import { getPaper, getSignedPdfUrl, recordPaperView } from "@/lib/papers/queries";
import { PdfViewer } from "@/components/papers/PdfViewer";
import { clsx } from "clsx";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const paper = await getPaper(id).catch(() => null);
  return { title: paper ? `${paper.title} — S6 Study Hub` : "Paper — S6 Study Hub" };
}

export default async function PaperDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const authCheck = await safeSupabase(async (supabase) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  });

  if (authCheck.error) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <AlertTriangle size={28} className="mx-auto text-marker-red" aria-hidden="true" />
        <h1 className="mt-3 text-lg font-semibold text-ink">Temporarily unavailable</h1>
        <p className="mt-2 text-sm text-slate">We&apos;re having trouble reaching the server. Please try again shortly.</p>
      </div>
    );
  }
  if (!authCheck.data) redirect("/login");

  const { id } = await params;
  const { tab } = await searchParams;
  const activeTab = tab === "marking-scheme" ? "marking-scheme" : "paper";

  let paper: Awaited<ReturnType<typeof getPaper>> = null;
  try {
    paper = await getPaper(id);
  } catch {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <AlertTriangle size={28} className="mx-auto text-marker-red" aria-hidden="true" />
        <h1 className="mt-3 text-lg font-semibold text-ink">Couldn&apos;t load this paper</h1>
        <p className="mt-2 text-sm text-slate">Please try again shortly.</p>
      </div>
    );
  }
  if (!paper) notFound();

  const targetPath = activeTab === "marking-scheme" ? paper.marking_scheme_path : paper.pdf_path;

  // If someone deep-links ?tab=marking-scheme on a paper that doesn't have
  // one, fall back to the paper itself rather than showing a dead end.
  const resolvedPath = targetPath ?? paper.pdf_path;
  const resolvedTab = targetPath ? activeTab : "paper";

  let signedUrl: string | null = null;
  let urlError: string | null = null;
  try {
    signedUrl = await getSignedPdfUrl(resolvedPath);
  } catch (err) {
    urlError = err instanceof Error ? err.message : "Could not load this document.";
  }

  // Record the view once per page load, only for the primary paper (not
  // every marking-scheme tab switch) — best-effort, never blocks render.
  if (resolvedTab === "paper") {
    void recordPaperView(paper.id);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-5">
      <Link href="/papers" className="inline-flex items-center gap-1 text-sm font-medium text-slate">
        <ArrowLeft size={16} aria-hidden="true" /> Back to papers
      </Link>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate">
          {paper.subjects?.name ?? "Subject"} · {paper.year}
        </p>
        <h1 className="font-display text-lg font-semibold text-ink">{paper.title}</h1>
        {paper.description && <p className="mt-1 text-sm text-slate">{paper.description}</p>}
      </div>

      {paper.marking_scheme_path && (
        <div role="tablist" aria-label="Document" className="flex gap-2 rounded-card bg-chalk-dim p-1">
          <Link
            href={`/papers/${paper.id}`}
            role="tab"
            aria-selected={resolvedTab === "paper"}
            className={clsx(
              "tap-target flex-1 rounded-card px-3 py-2 text-center text-sm font-medium",
              resolvedTab === "paper" ? "bg-white text-ink shadow-sm" : "text-slate"
            )}
          >
            Paper
          </Link>
          <Link
            href={`/papers/${paper.id}?tab=marking-scheme`}
            role="tab"
            aria-selected={resolvedTab === "marking-scheme"}
            className={clsx(
              "tap-target flex-1 rounded-card px-3 py-2 text-center text-sm font-medium",
              resolvedTab === "marking-scheme" ? "bg-white text-ink shadow-sm" : "text-slate"
            )}
          >
            Marking Scheme
          </Link>
        </div>
      )}

      {urlError && (
        <div role="alert" className="rounded-card bg-marker-red-soft px-4 py-3 text-sm text-marker-red">
          {urlError}
        </div>
      )}

      {signedUrl && (
        <PdfViewer url={signedUrl} title={resolvedTab === "marking-scheme" ? `${paper.title} — Marking Scheme` : paper.title} />
      )}
    </div>
  );
}
