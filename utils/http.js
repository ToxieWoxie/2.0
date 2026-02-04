export function jsonError(res, status, code, message) {
  return res.status(status).json({ code, message });
}

export function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (obj?.[k] !== undefined) out[k] = obj[k];
  return out;
}
