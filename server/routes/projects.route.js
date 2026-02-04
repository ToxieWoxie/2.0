// FILE: server/routes/projects.route.js
import express from "express";
import { requireAuth } from "../middleware/auth.js";
import multer from "multer";
import path from "path";
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
  uploadMedia,
  publishProject,
} from "../controllers/projects.controller.js";

const router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads"),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || "") || "";
      const safeExt = ext.length <= 12 ? ext : "";
      cb(null, `${Date.now()}_${Math.random().toString(16).slice(2)}${safeExt}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
});

router.get("/", requireAuth, listProjects);
router.post("/", requireAuth, createProject);

router.get("/:id", requireAuth, getProject);
router.put("/:id", requireAuth, updateProject);
router.delete("/:id", requireAuth, deleteProject);

router.post("/:id/share", requireAuth, shareProject);
router.get("/:id/my-role", requireAuth, myRole);

router.post("/:id/publish", requireAuth, publishProject);

router.post("/:id/media", requireAuth, upload.single("file"), uploadMedia);

router.post("/:id/invites/editor", requireAuth, createEditorInvite);

router.get("/:id/submissions", requireAuth, listSubmissions);
router.post("/:id/submissions", requireAuth, createSubmission);

export default router;
