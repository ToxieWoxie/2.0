import { verifyJwt } from "../utils/jwt.js";
import { jsonError } from "../utils/http.js";

export function requireAuth(req, res, next) {
  const token =
    req.cookies?.token ||
    req.cookies?.auth_token ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : undefined);

  if (!token) return jsonError(res, 401, "unauthorized", "Not authenticated.");

  try {
    req.auth = verifyJwt(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return jsonError(res, 401, "unauthorized", "Invalid or expired session.");
  }
}
