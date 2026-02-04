import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  register,
  login,
  logout,
  me,
  updateProfile,
  avatarUpload,
  uploadAvatar
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// Optional auth for /me (frontend expects { user: null } when not logged in)
router.get("/me", (req, res, next) => {
  const token = req.cookies?.token || req.cookies?.auth_token;
  if (!token) return res.json({ user: null });
  return requireAuth(req, res, next);
}, me);

router.patch("/profile", requireAuth, updateProfile);
router.post("/avatar", requireAuth, avatarUpload.single("avatar"), uploadAvatar);

export default router;
