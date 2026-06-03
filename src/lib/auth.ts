import { createHmac, timingSafeEqual } from 'crypto';

const SECRET = process.env.SESSION_SECRET ?? 'dev-only-secret-set-SESSION_SECRET-in-production';

/** Deterministic token derived from the profile UUID and a server secret. */
export function generateToken(userId: string): string {
  return createHmac('sha256', SECRET).update(userId).digest('hex');
}

/** Constant-time comparison — prevents timing-based token enumeration. */
export function verifyToken(userId: string, token: string): boolean {
  try {
    const expected = Buffer.from(generateToken(userId), 'hex');
    const provided  = Buffer.from(token, 'hex');
    if (expected.length !== provided.length) return false;
    return timingSafeEqual(expected, provided);
  } catch {
    return false;
  }
}

/** Read and verify the session token from request headers. */
export function authoriseRequest(
  req: Request,
  userId: string,
): boolean {
  const token = req.headers.get('x-session-token') ?? '';
  return verifyToken(userId, token);
}
