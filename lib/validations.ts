import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const workspaceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  description: z.string().max(500).optional(),
});

export const projectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().max(1000).optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED"]).default("ACTIVE"),
  color: z.string().default("#6366f1"),
  budget: z.number().positive().optional().nullable(),
  targetDate: z.string().optional().nullable(),
});

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(5000).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]).default("TODO"),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  dueDate: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  projectId: z.string(),
  tags: z.string().optional().nullable(),
});

export const taskUpdateSchema = taskSchema.partial().extend({
  id: z.string(),
});

export const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(2000),
  taskId: z.string(),
});

export const subtaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  taskId: z.string(),
});

export const memberInviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
  workspaceId: z.string(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type WorkspaceInput = z.infer<typeof workspaceSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type SubtaskInput = z.infer<typeof subtaskSchema>;
export type MemberInviteInput = z.infer<typeof memberInviteSchema>;
