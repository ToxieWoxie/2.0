import { jsonError } from "../utils/http.js";

export function notFound(req, res) {
  return jsonError(res, 404, "not_found", "Route not found.");
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err?.code === 11000) {
    const key = Object.keys(err?.keyPattern || err?.keyValue || {})[0] || "duplicate_key";
    const mappedCode = key === "email" ? "email_taken" : key === "usernameLower" ? "username_taken" : "duplicate_key";
    const mappedMessage =
      mappedCode === "email_taken"
        ? "An account with this email already exists."
        : mappedCode === "username_taken"
          ? "Username is already taken."
          : "Duplicate key.";
    return jsonError(res, 409, mappedCode, mappedMessage);
  }


  const status = typeof err?.status === "number" ? err.status : 500;
  const code = err?.code || (status === 500 ? "server_error" : "request_error");
  const message = err?.message || "Something went wrong.";
  if (status >= 500) console.error(err);
  return res.status(status).json({ code, message });
}
