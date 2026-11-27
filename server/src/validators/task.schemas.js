import { z } from "zod";

const positiveId = z.coerce.number().int().positive();

export const projectTaskParamsSchema = z.object({
  projectId: positiveId,
});

export const taskParamsSchema = projectTaskParamsSchema.extend({
  taskId: positiveId,
});

// Creating a task
export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Task title is required")
    .max(150, "Task title cannot exceed 150 characters"),

  description: z
    .string()
    .trim()
    .max(3000, "Description cannot exceed 3000 characters")
    .nullable()
    .optional(),

  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),

  dueDate: z.coerce.date().nullable().optional(),

  assignedToId: positiveId.nullable().optional(),
});

// Updating a task
export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(150).optional(),

    description: z.string().trim().max(3000).nullable().optional(),

    status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),

    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),

    dueDate: z.coerce.date().nullable().optional(),

    assignedToId: positiveId.nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
