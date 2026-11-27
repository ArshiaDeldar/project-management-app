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
import {
  createTask,
  getProjectTasks,
  updateTask,
  deleteTask,
} from "../controllers/task.controller.js";

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

router.post("/:projectId/tasks", requireAuth, createTask);

router.get("/:projectId/tasks", requireAuth, getProjectTasks);

router.patch("/:projectId/tasks/:taskId", requireAuth, updateTask);

router.delete("/:projectId/tasks/:taskId", requireAuth, deleteTask);

export default router;
