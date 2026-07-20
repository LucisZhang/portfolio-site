import { createHmac } from "node:crypto";
import { isIP } from "node:net";

type HeaderReader = Pick<Headers, "get">;

function validIp(value: string | undefined) {
  const candidate = value?.trim();
  return candidate && isIP(candidate) !== 0 ? candidate : null;
}

function firstValidHop(value: string | null) {
  if (!value) return null;
  for (const hop of value.split(",")) {
    const candidate = validIp(hop);
    if (candidate) return candidate;
  }
  return null;
}

function lastValidHop(value: string | null) {
  if (!value) return null;
  const hops = value.split(",");
  for (let index = hops.length - 1; index >= 0; index -= 1) {
    const candidate = validIp(hops[index]);
    if (candidate) return candidate;
  }
  return null;
}

export function assistantClientIp(headers: HeaderReader) {
  return firstValidHop(headers.get("x-vercel-forwarded-for"))
    ?? validIp(headers.get("x-real-ip") ?? undefined)
    ?? lastValidHop(headers.get("x-forwarded-for"))
    ?? "unknown-client";
}

export function assistantPseudonymousRateLimitKey(clientIp: string, secret: string) {
  const isolatedSecret = secret.trim();
  if (Buffer.byteLength(isolatedSecret, "utf8") < 32) {
    throw new Error("A dedicated server secret of at least 32 bytes is required for the external rate-limit identifier.");
  }
  return `ip-hmac-v2:${createHmac("sha256", isolatedSecret).update(clientIp).digest("hex")}`;
}
