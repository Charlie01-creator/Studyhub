"use server";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const MAX_FILE_BYTES = 25 * 1024 * 1024; // matches the bucket's file_size_limit

const createPaperSchema = z.object({
  subjectId: z.string().uuid("Select a subject"),
  title: z.string().trim().min(3, "Title is required"),
  year: z.coerce.number().int().min(1990).max(2100),
  paperNumber: z.coerce.number().int().min(1).max(20),
  paperType: z.string().trim().optional(),
  description: z.string().trim().optional(),
});

export type CreatePaperState = { error: string | null; success: boolean };

function validateFile(file: File | null, fieldLabel: string, required: boolean): string | null {
  if (!file || file.size === 0) {
    return required ? `${fieldLabel} is required.` : null;
  }
  if (file.type !== "application/pdf") return `${fieldLabel} must be a PDF file.`;
  if (file.size > MAX_FILE_BYTES) return `${fieldLabel} must be under 25MB.`;
  return null;
}

export async function createPaperAction(
  _prevState: CreatePaperState,
  formData: FormData
): Promise<CreatePaperState> {
  const { user, supabase } = await requireAdmin();

  const parsed = createPaperSchema.safeParse({
    subjectId: formData.get("subjectId"),
    title: formData.get("title"),
    year: formData.get("year"),
    paperNumber: formData.get("paperNumber"),
    paperType: formData.get("paperType") || undefined,
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again.", success: false };
  }

  const pdfFile = formData.get("pdfFile") as File | null;
  const markingSchemeFile = formData.get("markingSchemeFile") as File | null;

  const pdfError = validateFile(pdfFile, "Paper PDF", true);
  if (pdfError) return { error: pdfError, success: false };

  const msError = validateFile(markingSchemeFile, "Marking scheme", false);
  if (msError) return { error: msError, success: false };

  const data = parsed.data;
  const stamp = Date.now();
  const pdfPath = `${data.subjectId}/${data.year}-p${data.paperNumber}-${stamp}.pdf`;

  const { error: pdfUploadError } = await supabase.storage.from("papers").upload(pdfPath, pdfFile!, {
    contentType: "application/pdf",
    upsert: false,
  });
  if (pdfUploadError) {
    return { error: `Failed to upload paper PDF: ${pdfUploadError.message}`, success: false };
  }

  let markingSchemePath: string | null = null;
  if (markingSchemeFile && markingSchemeFile.size > 0) {
    markingSchemePath = `${data.subjectId}/${data.year}-p${data.paperNumber}-ms-${stamp}.pdf`;
    const { error: msUploadError } = await supabase.storage
      .from("papers")
      .upload(markingSchemePath, markingSchemeFile, { contentType: "application/pdf", upsert: false });

    if (msUploadError) {
      // Roll back the paper PDF so we don't leave an orphaned file with no DB row.
      await supabase.storage.from("papers").remove([pdfPath]);
      return { error: `Failed to upload marking scheme: ${msUploadError.message}`, success: false };
    }
  }

  const { error: insertError } = await supabase.from("papers").insert({
    subject_id: data.subjectId,
    title: data.title,
    year: data.year,
    paper_number: data.paperNumber,
    paper_type: data.paperType ?? null,
    description: data.description ?? null,
    pdf_path: pdfPath,
    marking_scheme_path: markingSchemePath,
    uploaded_by: user.id,
  });

  if (insertError) {
    // Roll back both uploaded files if the row insert fails.
    const toRemove = markingSchemePath ? [pdfPath, markingSchemePath] : [pdfPath];
    await supabase.storage.from("papers").remove(toRemove);
    return { error: `Failed to save paper: ${insertError.message}`, success: false };
  }

  revalidatePath("/admin/papers");
  revalidatePath("/papers");
  return { error: null, success: true };
}

export async function deletePaperAction(paperId: string) {
  const { supabase } = await requireAdmin();

  const { data: paper, error: fetchError } = await supabase
    .from("papers")
    .select("pdf_path, marking_scheme_path")
    .eq("id", paperId)
    .single();

  if (fetchError || !paper) {
    return { error: "Paper not found." };
  }

  const { error: deleteError } = await supabase.from("papers").delete().eq("id", paperId);
  if (deleteError) {
    return { error: `Failed to delete paper: ${deleteError.message}` };
  }

  const paths = [paper.pdf_path, paper.marking_scheme_path].filter((p): p is string => Boolean(p));
  if (paths.length > 0) {
    // Best-effort cleanup — the DB row (and RLS-governed access to it) is
    // already gone, which is what matters for security; an orphaned
    // storage object is a cleanup nuisance, not an access-control issue.
    const { error: storageError } = await supabase.storage.from("papers").remove(paths);
    if (storageError) console.error("Failed to remove storage objects:", storageError.message);
  }

  revalidatePath("/admin/papers");
  revalidatePath("/papers");
  return { error: null };
}
