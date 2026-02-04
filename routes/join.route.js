import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { joinByViewerCode } from "../controllers/join.controller.js";

const router = express.Router();

router.post("/", requireAuth, joinByViewerCode);

export default router;
