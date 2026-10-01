import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const SHARE_TOKEN_LIFETIME_MS = 15 * 60 * 1000;

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createResultShareToken(secret: string) {
  const expiresAt = Date.now() + SHARE_TOKEN_LIFETIME_MS;
  const nonce = randomBytes(16).toString("base64url");
  const payload = `${expiresAt}.${nonce}`;

  return `${payload}.${sign(payload, secret)}`;
}

export function verifyResultShareToken(token: string, secret: string) {
  const [expiresAtValue, nonce, signature, ...rest] = token.split(".");

  if (!expiresAtValue || !nonce || !signature || rest.length > 0) {
    return false;
  }

  const expiresAt = Number(expiresAtValue);

  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return false;
  }

  const payload = `${expiresAtValue}.${nonce}`;
  const expectedSignature = sign(payload, secret);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  return (
    signatureBuffer.length === expectedBuffer.length &&
    timingSafeEqual(signatureBuffer, expectedBuffer)
  );
}
