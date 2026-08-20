import Link from "next/link";
import { FileText, ClipboardCheck } from "lucide-react";
import type { PaperWithSubject } from "@/lib/papers/types";
import { Card } from "@/components/ui/Card";

export function PaperCard({ paper }: { paper: PaperWithSubject }) {
  return (
    <Card className="space-y-2">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate">
          {paper.subjects?.name ?? "Subject"} · {paper.year}
        </p>
        <h3 className="font-display text-base font-semibold text-ink">{paper.title}</h3>
        {paper.paper_type && <p className="text-xs text-slate">Paper {paper.paper_number} — {paper.paper_type}</p>}
      </div>

      <div className="flex gap-2 pt-1">
        <Link
          href={`/papers/${paper.id}`}
          className="tap-target flex flex-1 items-center justify-center gap-1.5 rounded-card bg-marker-green px-3 py-2 text-sm font-semibold text-white"
        >
          <FileText size={16} aria-hidden="true" /> View PDF
        </Link>
        {paper.marking_scheme_path && (
          <Link
            href={`/papers/${paper.id}?tab=marking-scheme`}
            className="tap-target flex flex-1 items-center justify-center gap-1.5 rounded-card bg-chalk-dim px-3 py-2 text-sm font-semibold text-ink"
          >
            <ClipboardCheck size={16} aria-hidden="true" /> Marking Scheme
          </Link>
        )}
      </div>
    </Card>
  );
}
