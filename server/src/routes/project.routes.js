import { Router } from "express";
import {
  createProject,
  getProjects,
} from "../controllers/project.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.post("/", requireAuth, createProject);
router.get("/", requireAuth, getProjects);

export default router;
