import { z } from "zod";

export const projectParamsSchema = z.object({
  projectId: z.coerce.number().int().positive(),
});

export const projectMemberParamsSchema = projectParamsSchema.extend({
  userId: z.coerce.number().int().positive(),
});

export const addProjectMemberSchema = z.object({
  email: z.email().trim().toLowerCase(),
});

export const updateProjectMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]),
});
