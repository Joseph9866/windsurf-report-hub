import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export const signupSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Please confirm your password" }),
  displayName: z.string().trim().min(2, { message: "Display name must be at least 2 characters" }).max(50, { message: "Display name must be less than 50 characters" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const issueSchema = z.object({
  title: z.string().trim().min(5, { message: "Title must be at least 5 characters" }).max(200, { message: "Title must be less than 200 characters" }),
  description: z.string().trim().min(20, { message: "Description must be at least 20 characters" }).max(5000, { message: "Description must be less than 5000 characters" }),
  category: z.enum(["bug", "feature_request", "performance", "security", "other"], { 
    required_error: "Please select a category" 
  }),
  affected_system: z.string().trim().max(100, { message: "Affected system must be less than 100 characters" }).optional(),
  priority: z.enum(["low", "medium", "high", "critical"], { 
    required_error: "Please select a priority" 
  }),
});

export const feedbackSchema = z.object({
  subject: z.string().trim().min(5, { message: "Subject must be at least 5 characters" }).max(200, { message: "Subject must be less than 200 characters" }),
  feedback_text: z.string().trim().min(10, { message: "Feedback must be at least 10 characters" }).max(5000, { message: "Feedback must be less than 5000 characters" }),
  category: z.string().trim().max(50, { message: "Category must be less than 50 characters" }).optional(),
});

export const issueNoteSchema = z.object({
  note_text: z.string().trim().min(1, { message: "Note cannot be empty" }).max(2000, { message: "Note must be less than 2000 characters" }),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type IssueFormData = z.infer<typeof issueSchema>;
export type FeedbackFormData = z.infer<typeof feedbackSchema>;
export type IssueNoteFormData = z.infer<typeof issueNoteSchema>;