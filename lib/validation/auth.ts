import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

// Registration also captures onboarding data up front (spec section 9) so
// a student never lands in a half-configured account.
export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Password must include a letter")
    .regex(/[0-9]/, "Password must include a number"),
  schoolId: z.string().uuid("Select your school").optional(),
  schoolName: z.string().trim().optional(), // fallback if school isn't in catalogue yet
  levelYear: z.literal("S6"),
  subjectCombinationId: z.string().uuid("Select your subject combination"),
  subjectIds: z.array(z.string().uuid()).min(1, "Select at least one subject"),
}).refine((data) => data.schoolId || (data.schoolName && data.schoolName.length > 1), {
  message: "Select your school, or type it if it's not listed",
  path: ["schoolName"],
});
export type RegisterInput = z.infer<typeof registerSchema>;
