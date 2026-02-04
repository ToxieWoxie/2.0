import { Project } from "../models/project.model.js";
import { jsonError } from "../utils/http.js";

export async function joinByViewerCode(req, res) {
  const userId = req.auth.sub;
  const { viewerCode } = req.body || {};
  if (!viewerCode) return jsonError(res, 400, "bad_request", "viewerCode is required.");

  const project = await Project.findOne({ viewerCode: String(viewerCode) });
  if (!project) return jsonError(res, 404, "not_found", "Invalid viewer code.");

  const already = project.members.some((m) => String(m.user) === String(userId));
  if (!already) project.members.push({ user: userId, role: "viewer" });

  await project.save();
  return res.json({ projectId: String(project._id) });
}
