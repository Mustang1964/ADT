import { SignJWT, jwtVerify } from 'jose';
import { AUTH_COOKIE_NAME, DEFAULT_GUEST_PASSWORD, DEFAULT_MAIN_PASSWORD } from './constants';
import { UserRole } from '@/types';

const SECRET_KEY_STRING =
  process.env.SESSION_SECRET ||
  'adt_super_secret_session_encryption_key_2026_vercel_production_998877';

const SECRET_KEY = new TextEncoder().encode(SECRET_KEY_STRING);

export interface TokenPayload {
  role: UserRole;
  isLoggedIn: boolean;
  issuedAt: number;
}

/**
 * Signs a secure JWT token for a session
 */
export async function signSessionToken(role: UserRole): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60 * 24 * 30; // 30 days session

  return new SignJWT({ role, isLoggedIn: true, issuedAt: iat })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .setIssuer('adt-app')
    .setAudience('adt-user')
    .sign(SECRET_KEY);
}

/**
 * Verifies a JWT session token
 */
export async function verifySessionToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      issuer: 'adt-app',
      audience: 'adt-user',
    });

    if (payload && (payload.role === 'admin' || payload.role === 'guest')) {
      return {
        role: payload.role as UserRole,
        isLoggedIn: true,
        issuedAt: (payload.issuedAt as number) || Math.floor(Date.now() / 1000),
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Validates password and role input without revealing password in errors
 */
export function validateCredentials(
  passwordInput: string,
  isGuestCheckbox: boolean
): { valid: boolean; role?: UserRole; error?: string } {
  const mainPassword = process.env.MAIN_PASSWORD || DEFAULT_MAIN_PASSWORD;
  const guestPassword = process.env.GUEST_PASSWORD || DEFAULT_GUEST_PASSWORD;

  const trimmed = (passwordInput || '').trim();

  if (!trimmed) {
    return { valid: false, error: 'Пожалуйста, введите пароль доступа' };
  }

  if (isGuestCheckbox) {
    if (trimmed === guestPassword) {
      return { valid: true, role: 'guest' };
    } else {
      return {
        valid: false,
        error: 'Неверный пароль для гостевого режима доступа',
      };
    }
  } else {
    if (trimmed === mainPassword) {
      return { valid: true, role: 'admin' };
    } else {
      return {
        valid: false,
        error: 'Неверный пароль для личного кабинета',
      };
    }
  }
}
