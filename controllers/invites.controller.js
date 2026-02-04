import { Project } from "../models/project.model.js";
import { jsonError } from "../utils/http.js";

export async function acceptInvite(req, res) {
  const userId = req.auth.sub;
  const { token } = req.body || {};
  if (!token) return jsonError(res, 400, "bad_request", "Invite token is required.");

  const project = await Project.findOne({ "invites.token": token });
  if (!project) return jsonError(res, 404, "not_found", "Invite not found.");

  const invite = project.invites.find((i) => i.token === token);
  if (!invite) return jsonError(res, 404, "not_found", "Invite not found.");
  if (invite.expiresAt.getTime() < Date.now()) return jsonError(res, 410, "expired", "Invite has expired.");

  const already = project.members.some((m) => String(m.user) === String(userId));
  if (!already) project.members.push({ user: userId, role: invite.role });

  project.invites = project.invites.filter((i) => i.token !== token);
  await project.save();

  return res.json({ projectId: String(project._id) });
}
