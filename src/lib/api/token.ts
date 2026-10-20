export const SESSION_COOKIE = "estate_session";

/** Payload `exp` only. The API verifies the signature. */
export function jwtExp(token: string): number | null {
  const segment = token.split(".")[1];
  if (!segment) return null;
  try {
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json: unknown = JSON.parse(atob(padded));
    if (!json || typeof json !== "object" || !("exp" in json)) return null;
    const exp = (json as { exp: unknown }).exp;
    return typeof exp === "number" && Number.isFinite(exp) ? exp : null;
  } catch {
    return null;
  }
}

export function jwtExpired(token: string, nowSeconds = Math.floor(Date.now() / 1000)): boolean {
  const exp = jwtExp(token);
  if (exp === null) return true;
  return exp <= nowSeconds;
}

export function sessionMaxAge(token: string, nowSeconds = Math.floor(Date.now() / 1000)): number | null {
  const exp = jwtExp(token);
  if (exp === null) return null;
  const seconds = exp - nowSeconds;
  return seconds > 0 ? seconds : null;
}
