// In-memory rate limiter with sliding window for brute-force protection
interface RateLimitRecord {
  count: number;
  firstAttempt: number;
  lockoutUntil: number;
}

const attempts = new Map<string, RateLimitRecord>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes lockout after max failures

export function checkRateLimit(ip: string): { allowed: boolean; remainingSeconds?: number; message?: string } {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record) {
    return { allowed: true };
  }

  // Check if locked out
  if (record.lockoutUntil > now) {
    const remainingSeconds = Math.ceil((record.lockoutUntil - now) / 1000);
    return {
      allowed: false,
      remainingSeconds,
      message: `Слишком много неверных попыток. Повторите через ${remainingSeconds} сек.`,
    };
  }

  // Reset if window expired
  if (now - record.firstAttempt > WINDOW_MS) {
    attempts.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedAttempt(ip: string): { locked: boolean; remainingSeconds?: number } {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record) {
    attempts.set(ip, {
      count: 1,
      firstAttempt: now,
      lockoutUntil: 0,
    });
    return { locked: false };
  }

  record.count += 1;

  if (record.count >= MAX_ATTEMPTS) {
    record.lockoutUntil = now + LOCKOUT_MS;
    const remainingSeconds = Math.ceil(LOCKOUT_MS / 1000);
    return { locked: true, remainingSeconds };
  }

  return { locked: false };
}

export function resetRateLimit(ip: string): void {
  attempts.delete(ip);
}
