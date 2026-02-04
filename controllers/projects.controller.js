// FILE: server/controllers/projects.controller.js

import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

import { Project } from "../models/project.model.js";
import { Submission } from "../models/submission.model.js";
import { User } from "../models/user.model.js";
import { jsonError, pick } from "../utils/http.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mediaStorage = multer.diskStorage({
  destination: path.join(__dirname, "..", "uploads"),
  filename: (req, file, cb) => {
    const safe = String(file.originalname || "upload").replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  },
});

export const projectMediaUpload = multer({
  storage: mediaStorage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

function toProjectDto(project, userId) {
  const role = project.roleFor(userId) || "none";
  return {
    id: String(project._id),
    title: String(project.title ?? ""),
    description: String(project.description ?? ""),
    includeAssessment: Boolean(project.includeAssessment),
    recordUserEnabled: Boolean(project.recordUserEnabled),
    questions: Array.isArray(project.questions) ? project.questions : [],
    ownerId: String(project.owner),
    role,
    published: Boolean(project.published),
    publishedAt: project.publishedAt ? new Date(project.publishedAt).toISOString() : null,
    viewerCode: project.viewerCode ? String(project.viewerCode) : "",
    createdAt: project.createdAt ? new Date(project.createdAt).getTime() : 0,
    updatedAt: project.updatedAt ? new Date(project.updatedAt).getTime() : 0,
  };
}

function toSubmissionDto(submission) {
  const payload = submission.payload ?? {};
  const answers = payload?.answers && typeof payload.answers === "object" ? payload.answers : payload;

  return {
    id: String(submission._id),
    projectId: String(submission.project),
    userId: String(submission.createdBy),
    createdAt: submission.createdAt
      ? new Date(submission.createdAt).toISOString()
      : new Date().toISOString(),
    answers,
    username: payload?.recordedUsername ? String(payload.recordedUsername) : null,
    recordUserConsent: Boolean(payload?.recordUserConsent ?? false),
  };
}

async function loadProject(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return { error: jsonError(res, 400, "bad_request", "Invalid project id.") };
  }
  const project = await Project.findById(id);
  if (!project) {
    return { error: jsonError(res, 404, "not_found", "Project not found.") };
  }
  return { project };
}

function roleRank(role) {
  if (role === "owner") return 3;
  if (role === "editor") return 2;
  if (role === "viewer") return 1;
  return 0;
}

function requireProjectRole(project, userId, minRole) {
  const role = project.roleFor(userId);
  if (!role) return { ok: false, role: null };
  return { ok: roleRank(role) >= roleRank(minRole), role };
}

export async function listProjects(req, res) {
  const userId = req.auth.sub;
  const projects = await Project.find({ "members.user": userId }).sort({ updatedAt: -1 });

  return res.json({
    projects: projects.map((p) => ({
      id: String(p._id),
      title: String(p.title ?? ""),
      updatedAt: p.updatedAt ? new Date(p.updatedAt).getTime() : 0,
      role: p.roleFor(userId) || "viewer",
    })),
  });
}

export async function createProject(req, res) {
  const userId = req.auth.sub;
  const { title, description = "", includeAssessment = false, recordUserEnabled = false, questions = [] } = req.body || {};
  if (!title) return jsonError(res, 400, "bad_request", "Title is required.");

  const project = await Project.create({
    title,
    description,
    includeAssessment: Boolean(includeAssessment),
    recordUserEnabled: Boolean(recordUserEnabled),
    questions: Array.isArray(questions) ? questions : [],
    owner: userId,
    members: [{ user: userId, role: "owner" }],
  });

  return res.status(201).json({ project: toProjectDto(project, userId) });
}

export async function getProject(req, res) {
  const userId = req.auth.sub;
  const { project, error } = await loadProject(req, res);
  if (error) return;

  const role = project.roleFor(userId);
  if (!role) return jsonError(res, 403, "forbidden", "You do not have access to this project.");

  return res.json({ project: toProjectDto(project, userId) });
}

export async function updateProject(req, res) {
  const userId = req.auth.sub;
  const { project, error } = await loadProject(req, res);
  if (error) return;

  const perm = requireProjectRole(project, userId, "editor");
  if (!perm.ok) return jsonError(res, 403, "forbidden", "Insufficient permissions.");

  const updates = pick(req.body || {}, ["title", "description", "includeAssessment", "recordUserEnabled", "questions"]);
  Object.assign(project, updates);
  await project.save();

  return res.json({ project: toProjectDto(project, userId) });
}

export async function deleteProject(req, res) {
  const userId = req.auth.sub;
  const { project, error } = await loadProject(req, res);
  if (error) return;

  const perm = requireProjectRole(project, userId, "owner");
  if (!perm.ok) return jsonError(res, 403, "forbidden", "Only the owner can delete this project.");

  await Submission.deleteMany({ project: project._id });
  await project.deleteOne();

  return res.json({ ok: true });
}

export async function shareProject(req, res) {
  const userId = req.auth.sub;
  const { project, error } = await loadProject(req, res);
  if (error) return;

  const perm = requireProjectRole(project, userId, "editor");
  if (!perm.ok) return jsonError(res, 403, "forbidden", "Insufficient permissions.");

  if (!project.viewerCode) project.viewerCode = nanoid(10);
  await project.save();

  return res.json({ viewerCode: String(project.viewerCode) });
}

export async function myRole(req, res) {
  const userId = req.auth.sub;
  const { project, error } = await loadProject(req, res);
  if (error) return;

  const role = project.roleFor(userId);
  return res.json({ role: role || "none" });
}

export async function createEditorInvite(req, res) {
  const userId = req.auth.sub;
  const { project, error } = await loadProject(req, res);
  if (error) return;

  const perm = requireProjectRole(project, userId, "owner");
  if (!perm.ok) return jsonError(res, 403, "forbidden", "Only the owner can invite editors.");

  const token = nanoid(24);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  project.invites.push({ token, role: "editor", expiresAt });
  await project.save();

  return res.json({ token });
}

export async function listSubmissions(req, res) {
  const userId = req.auth.sub;
  const { project, error } = await loadProject(req, res);
  if (error) return;

  const role = project.roleFor(userId);
  if (!role) return jsonError(res, 403, "forbidden", "No access to submissions.");

  const submissions = await Submission.find({ project: project._id }).sort({ createdAt: -1 });
  return res.json({ submissions: submissions.map(toSubmissionDto) });
}

export async function createSubmission(req, res) {
  const userId = req.auth.sub;
  const { project, error } = await loadProject(req, res);
  if (error) return;

  const perm = requireProjectRole(project, userId, "viewer");
  if (!perm.ok) return jsonError(res, 403, "forbidden", "No access to submit.");

  const payload = req.body || {};

  if (project.recordUserEnabled) {
    const consent = Boolean(payload?.recordUserConsent);
    if (!consent) return jsonError(res, 400, "consent_required", "Consent is required to submit this quiz.");

    const u = await User.findById(userId);
    if (!u) return jsonError(res, 401, "unauthorized", "Not authenticated.");

    payload.recordUserConsent = true;
    payload.recordedUsername = String(u.username ?? "").trim();
    payload.recordedUsernameLower = String(u.username ?? "").toLowerCase().trim();
  }

  const submission = await Submission.create({ project: project._id, createdBy: userId, payload });
  return res.status(201).json({ submission: toSubmissionDto(submission) });
}

export async function publishProject(req, res) {
  const userId = req.auth.sub;
  const { project, error } = await loadProject(req, res);
  if (error) return;

  const perm = requireProjectRole(project, userId, "editor");
  if (!perm.ok) return jsonError(res, 403, "forbidden", "Insufficient permissions.");

  project.published = true;
  project.publishedAt = new Date();
  await project.save();

  return res.json({ project: toProjectDto(project, userId) });
}


export async function uploadProjectMedia(req, res) {
  const userId = req.auth.sub;
  const { project, error } = await loadProject(req, res);
  if (error) return;

  const perm = requireProjectRole(project, userId, "editor");
  if (!perm.ok) return jsonError(res, 403, "forbidden", "Insufficient permissions.");
  if (!req.file) return jsonError(res, 400, "bad_request", "No file uploaded.");

  const url = `/uploads/${req.file.filename}`;
  return res.status(201).json({ url });
}
