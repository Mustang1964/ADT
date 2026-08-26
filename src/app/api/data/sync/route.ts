import { NextRequest, NextResponse } from 'next/server';
import { getCloudData, saveCloudTasks, saveCloudBaseBalance } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';
import { AUTH_COOKIE_NAME } from '@/lib/constants';

// GET: fetch synchronized cloud data (tasks and baseBalance)
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = token ? await verifySessionToken(token) : null;

    if (!session || !session.isLoggedIn) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const data = await getCloudData();

    // If guest, sanitize and do NOT return financials!
    if (session.role === 'guest') {
      const sanitizedTasks = data.tasks.map((task) => ({
        ...task,
        financials: {
          income: 0,
          expense: 0,
          currency: 'RUB',
        },
      }));

      return NextResponse.json({
        success: true,
        role: 'guest',
        tasks: sanitizedTasks,
        baseBalance: 0,
      });
    }

    return NextResponse.json({
      success: true,
      role: 'admin',
      tasks: data.tasks,
      baseBalance: data.baseBalance,
    });
  } catch (error) {
    console.error('Error fetching sync data:', error);
    return NextResponse.json({ error: 'Ошибка получения данных' }, { status: 500 });
  }
}

// POST: save tasks or baseBalance to cloud
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = token ? await verifySessionToken(token) : null;

    if (!session || !session.isLoggedIn) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    if (session.role === 'guest') {
      return NextResponse.json(
        { error: 'В гостевом режиме сохранение недоступно' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { tasks, baseBalance } = body;

    if (Array.isArray(tasks)) {
      await saveCloudTasks(tasks);
    }

    if (typeof baseBalance === 'number') {
      await saveCloudBaseBalance(baseBalance);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving sync data:', error);
    return NextResponse.json({ error: 'Ошибка сохранения данных' }, { status: 500 });
  }
}
