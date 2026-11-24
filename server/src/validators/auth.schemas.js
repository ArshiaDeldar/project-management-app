import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name cannot exceed 80 characters"),

  email: z.email().trim().toLowerCase(),

  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(128, "Password cannot exceed 128 characters"),
});

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),

  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password cannot exceed 128 characters"),
});
