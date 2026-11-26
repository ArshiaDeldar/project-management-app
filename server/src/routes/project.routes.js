import { Router } from "express";
import {
  createProject,
  getProjects,
} from "../controllers/project.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  getProjectMembers,
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
} from "../controllers/project-member.controller.js";

const router = Router();

router.post("/", requireAuth, createProject);
router.get("/", requireAuth, getProjects);
router.get("/:projectId/members", requireAuth, getProjectMembers);

router.post("/:projectId/members", requireAuth, addProjectMember);

router.patch(
  "/:projectId/members/:userId",
  requireAuth,
  updateProjectMemberRole,
);

router.delete("/:projectId/members/:userId", requireAuth, removeProjectMember);

export default router;
