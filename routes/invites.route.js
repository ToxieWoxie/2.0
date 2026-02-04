import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { acceptInvite } from "../controllers/invites.controller.js";

const router = express.Router();

router.post("/accept", requireAuth, acceptInvite);

export default router;
