import jwt from "jsonwebtoken";

export function signJwt(payload, secret, expiresIn) {
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyJwt(token, secret) {
  return jwt.verify(token, secret);
}
