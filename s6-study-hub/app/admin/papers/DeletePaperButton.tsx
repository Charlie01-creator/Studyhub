"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deletePaperAction } from "./actions";

export function DeletePaperButton({ paperId, paperTitle }: { paperId: string; paperTitle: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate">Delete &quot;{paperTitle}&quot;?</span>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await deletePaperAction(paperId);
              if (result.error) {
                setError(result.error);
                setConfirming(false);
              }
            })
          }
          className="tap-target rounded-chip bg-marker-red px-2.5 py-1 text-xs font-semibold text-white"
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : "Confirm"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="tap-target rounded-chip bg-chalk-dim px-2.5 py-1 text-xs font-semibold text-ink"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Delete ${paperTitle}`}
        className="tap-target flex items-center gap-1 rounded-chip px-2.5 py-1 text-xs font-semibold text-marker-red hover:bg-marker-red-soft"
      >
        <Trash2 size={14} aria-hidden="true" /> Delete
      </button>
      {error && <p className="mt-1 text-xs text-marker-red">{error}</p>}
    </div>
  );
}
