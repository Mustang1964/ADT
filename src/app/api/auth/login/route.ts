import { NextRequest, NextResponse } from 'next/server';
import { signSessionToken, validateCredentials } from '@/lib/auth';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '@/lib/rate-limit';
import { AUTH_COOKIE_NAME } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    // Check rate limit
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: rateCheck.message },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { password, isGuest } = body;

    // Validate credentials
    const validation = validateCredentials(password, Boolean(isGuest));

    if (!validation.valid || !validation.role) {
      const failInfo = recordFailedAttempt(ip);
      const errorMsg = failInfo.locked
        ? `Превышен лимит попыток. Доступ временно заблокирован на ${failInfo.remainingSeconds} сек.`
        : validation.error || 'Неверный пароль';

      return NextResponse.json(
        {
          success: false,
          error: errorMsg,
          locked: failInfo.locked,
        },
        { status: 401 }
      );
    }

    // Success: reset rate limit attempts
    resetRateLimit(ip);

    // Create signed JWT
    const token = await signSessionToken(validation.role);

    const response = NextResponse.json({
      success: true,
      role: validation.role,
      message: validation.role === 'admin' ? 'Вход выполнен как Личный' : 'Вход выполнен в Гостевом режиме',
    });

    // Set secure HTTP-only Cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера авторизации' },
      { status: 500 }
    );
  }
}
