"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { createPaperAction, type CreatePaperState } from "./actions";
import { Button } from "@/components/ui/Button";
import type { Subject } from "@/lib/papers/types";

const initialState: CreatePaperState = { error: null, success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Uploading…" : "Upload paper"}
    </Button>
  );
}

function FilePreview({ file }: { file: File | null }) {
  if (!file) return null;
  const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
  return <p className="mt-1 text-xs text-slate">{file.name} · {sizeMb}MB</p>;
}

export default function UploadPaperForm({ subjects }: { subjects: Subject[] }) {
  const [state, formAction] = useFormState(createPaperAction, initialState);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [msFile, setMsFile] = useState<File | null>(null);
  const [formKey, setFormKey] = useState(0);

  // Reset the (uncontrolled) file inputs after a successful upload by
  // remounting the form — simplest reliable way to clear <input type=file>.
  const success = state.success;

  return (
    <form key={formKey} action={formAction} className="space-y-4">
      {state.error && (
        <p role="alert" className="rounded-card bg-marker-red-soft px-3 py-2 text-sm text-marker-red">
          {state.error}
        </p>
      )}
      {success && (
        <p role="status" className="rounded-card bg-marker-green-soft px-3 py-2 text-sm text-marker-green">
          Paper uploaded.{" "}
          <button type="button" onClick={() => setFormKey((k) => k + 1)} className="underline underline-offset-2">
            Upload another
          </button>
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="subjectId" className="text-sm font-medium text-ink">Subject</label>
          <select id="subjectId" name="subjectId" required
            className="w-full rounded-card border border-ink/15 bg-white px-3 py-2.5 text-sm focus-visible:outline-marker-green">
            <option value="">Select subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="year" className="text-sm font-medium text-ink">Year</label>
          <input id="year" name="year" type="number" min={1990} max={2100} required defaultValue={new Date().getFullYear()}
            className="w-full rounded-card border border-ink/15 px-3 py-2.5 text-sm focus-visible:outline-marker-green" />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="title" className="text-sm font-medium text-ink">Title</label>
        <input id="title" name="title" required placeholder="e.g. Physics Paper 1"
          className="w-full rounded-card border border-ink/15 px-3 py-2.5 text-sm focus-visible:outline-marker-green" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="paperNumber" className="text-sm font-medium text-ink">Paper number</label>
          <input id="paperNumber" name="paperNumber" type="number" min={1} max={20} required defaultValue={1}
            className="w-full rounded-card border border-ink/15 px-3 py-2.5 text-sm focus-visible:outline-marker-green" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="paperType" className="text-sm font-medium text-ink">Paper type</label>
          <input id="paperType" name="paperType" placeholder="Theory, Practical…"
            className="w-full rounded-card border border-ink/15 px-3 py-2.5 text-sm focus-visible:outline-marker-green" />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium text-ink">Description (optional)</label>
        <textarea id="description" name="description" rows={2}
          className="w-full rounded-card border border-ink/15 px-3 py-2.5 text-sm focus-visible:outline-marker-green" />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="pdfFile" className="text-sm font-medium text-ink">Paper PDF</label>
        <input
          id="pdfFile" name="pdfFile" type="file" accept="application/pdf" required
          onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
          className="tap-target w-full rounded-card border border-ink/15 bg-white px-3 py-2.5 text-sm file:mr-3 file:rounded-chip file:border-0 file:bg-chalk-dim file:px-3 file:py-1.5 file:text-sm file:font-medium"
        />
        <FilePreview file={pdfFile} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="markingSchemeFile" className="text-sm font-medium text-ink">Marking scheme (optional)</label>
        <input
          id="markingSchemeFile" name="markingSchemeFile" type="file" accept="application/pdf"
          onChange={(e) => setMsFile(e.target.files?.[0] ?? null)}
          className="tap-target w-full rounded-card border border-ink/15 bg-white px-3 py-2.5 text-sm file:mr-3 file:rounded-chip file:border-0 file:bg-chalk-dim file:px-3 file:py-1.5 file:text-sm file:font-medium"
        />
        <FilePreview file={msFile} />
      </div>

      <p className="text-xs text-slate">PDF files only, up to 25MB each.</p>

      <SubmitButton />
    </form>
  );
}
