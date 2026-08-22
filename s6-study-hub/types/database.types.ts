/**
 * Hand-written types for the Phase 1 schema. Once the Supabase project is
 * live, replace this file with the generated version:
 *
 *   npx supabase gen types typescript --project-id <id> > types/database.types.ts
 *
 * Keeping it hand-written for now so the app compiles before that project
 * exists.
 */

export type UserRole = "student" | "moderator" | "teacher" | "admin";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: UserRole;
          school_id: string | null;
          school_name_freetext: string | null;
          level_year: string;
          subject_combination_id: string | null;
          is_suspended: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      schools: {
        Row: {
          id: string;
          name: string;
          district: string | null;
          is_verified: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["schools"]["Row"]> & { name: string };
        Update: Partial<Database["public"]["Tables"]["schools"]["Row"]>;
      };
      subjects: {
        Row: {
          id: string;
          name: string;
          code: string | null;
          category: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["subjects"]["Row"]> & { name: string };
        Update: Partial<Database["public"]["Tables"]["subjects"]["Row"]>;
      };
      subject_combinations: {
        Row: {
          id: string;
          code: string;
          display_name: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["subject_combinations"]["Row"]> & {
          code: string;
          display_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["subject_combinations"]["Row"]>;
      };
      exam_configuration: {
        Row: {
          id: string;
          label: string;
          exam_date: string | null;
          is_confirmed: boolean;
          is_active: boolean;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["exam_configuration"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["exam_configuration"]["Row"]>;
      };
      papers: {
        Row: {
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
        Insert: Partial<Database["public"]["Tables"]["papers"]["Row"]> & {
          subject_id: string;
          title: string;
          year: number;
          pdf_path: string;
        };
        Update: Partial<Database["public"]["Tables"]["papers"]["Row"]>;
      };
      paper_views: {
        Row: {
          id: string;
          user_id: string;
          paper_id: string;
          viewed_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["paper_views"]["Row"]> & {
          user_id: string;
          paper_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["paper_views"]["Row"]>;
      };
    };
    Functions: {
      get_popular_papers: {
        Args: { result_limit?: number };
        Returns: { paper_id: string; view_count: number }[];
      };
    };
  };
}
