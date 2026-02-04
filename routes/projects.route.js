// FILE: server/routes/projects.route.js
import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  shareProject,
  myRole,
  createEditorInvite,
  listSubmissions,
  createSubmission,
  publishProject,
  uploadProjectMedia,
  projectMediaUpload,
} from "../controllers/projects.controller.js";

const router = express.Router();

router.get("/", requireAuth, listProjects);
router.post("/", requireAuth, createProject);

router.get("/:id", requireAuth, getProject);
router.put("/:id", requireAuth, updateProject);
router.post("/:id/media", requireAuth, projectMediaUpload.single("file"), uploadProjectMedia);
router.delete("/:id", requireAuth, deleteProject);

router.post("/:id/share", requireAuth, shareProject);
router.get("/:id/my-role", requireAuth, myRole);

router.post("/:id/publish", requireAuth, publishProject);

router.post("/:id/invites/editor", requireAuth, createEditorInvite);

router.get("/:id/submissions", requireAuth, listSubmissions);
router.post("/:id/submissions", requireAuth, createSubmission);

export default router;
