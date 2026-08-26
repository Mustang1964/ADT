import { Redis } from '@upstash/redis';
import { TaskItem } from '@/types';

// Connect to Upstash Redis or Vercel KV via environment variables
// Supports:
// 1. UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN
// 2. KV_REST_API_URL & KV_REST_API_TOKEN (Vercel KV)
function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (url && token) {
    try {
      return new Redis({ url, token });
    } catch (e) {
      console.error('Failed to initialize Redis client', e);
      return null;
    }
  }
  return null;
}

const REDIS_TASKS_KEY = 'adt_cloud_tasks_data';
const REDIS_BALANCE_KEY = 'adt_cloud_base_balance';

// In-memory fallback if Redis is not configured yet
let memoryTasks: TaskItem[] = [];
let memoryBaseBalance: number = 0;

export async function getCloudData(): Promise<{ tasks: TaskItem[]; baseBalance: number }> {
  const redis = getRedisClient();

  if (redis) {
    try {
      const [tasks, baseBalance] = await Promise.all([
        redis.get<TaskItem[]>(REDIS_TASKS_KEY),
        redis.get<number>(REDIS_BALANCE_KEY),
      ]);

      return {
        tasks: Array.isArray(tasks) ? tasks : [],
        baseBalance: typeof baseBalance === 'number' ? baseBalance : 0,
      };
    } catch (e) {
      console.error('Error reading from Cloud Redis:', e);
    }
  }

  return {
    tasks: memoryTasks,
    baseBalance: memoryBaseBalance,
  };
}

export async function saveCloudTasks(tasks: TaskItem[]): Promise<boolean> {
  memoryTasks = tasks;
  const redis = getRedisClient();

  if (redis) {
    try {
      await redis.set(REDIS_TASKS_KEY, tasks);
      return true;
    } catch (e) {
      console.error('Error saving tasks to Cloud Redis:', e);
      return false;
    }
  }
  return true;
}

export async function saveCloudBaseBalance(baseBalance: number): Promise<boolean> {
  memoryBaseBalance = baseBalance;
  const redis = getRedisClient();

  if (redis) {
    try {
      await redis.set(REDIS_BALANCE_KEY, baseBalance);
      return true;
    } catch (e) {
      console.error('Error saving base balance to Cloud Redis:', e);
      return false;
    }
  }
  return true;
}
