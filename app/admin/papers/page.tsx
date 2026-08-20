import { requireAdmin } from "@/lib/auth/requireAdmin";
import { listPapers, listSubjects } from "@/lib/papers/queries";
import UploadPaperForm from "./UploadPaperForm";
import { DeletePaperButton } from "./DeletePaperButton";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

export const metadata = { title: "Manage Papers — S6 Study Hub Admin" };

export default async function AdminPapersPage() {
  await requireAdmin(); // redirects non-admins before any data loads

  const [papers, subjects] = await Promise.all([listPapers({}), listSubjects()]);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Manage Papers</h1>
        <p className="text-sm text-slate">Upload past papers and marking schemes.</p>
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">Upload new paper</h2>
        {subjects.length === 0 ? (
          <p className="text-sm text-slate">
            No subjects exist yet — add subjects to the catalogue before uploading papers.
          </p>
        ) : (
          <UploadPaperForm subjects={subjects} />
        )}
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">
          All papers ({papers.length})
        </h2>
        {papers.length === 0 ? (
          <p className="text-sm text-slate">No papers uploaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {papers.map((paper) => (
              <li key={paper.id}>
                <Card className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{paper.title}</p>
                    <p className="text-xs text-slate">
                      {paper.subjects?.name ?? "—"} · {paper.year} · Paper {paper.paper_number}
                      {paper.marking_scheme_path ? " · has marking scheme" : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link href={`/papers/${paper.id}`} className="text-xs font-medium text-marker-green underline underline-offset-2">
                      Preview
                    </Link>
                    <DeletePaperButton paperId={paper.id} paperTitle={paper.title} />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
