export type Paper = {
  id: string;
  subject_id: string;
  title: string;
  year: number;
  paper_number: number;
  paper_type: string | null;
  description: string | null;
  pdf_path: string;
  marking_scheme_path: string | null;
  uploaded_by: string | null;
  created_at: string;
};

export type PaperWithSubject = Paper & {
  subjects: { id: string; name: string; code: string | null } | null;
};

export type Subject = {
  id: string;
  name: string;
  code: string | null;
  category: string | null;
};

export type PaperFilters = {
  search?: string;
  subjectId?: string;
  year?: number;
  paperNumber?: number;
};
