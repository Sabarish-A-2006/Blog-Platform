import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/blogsphere'),
  JWT_SECRET: z.string().min(32).default('development-only-secret-change-before-deploy-123456'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax')
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid server environment:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
if (env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || /development-only|replace-with/i.test(env.JWT_SECRET))) {
  throw new Error('Set a unique JWT_SECRET before running in production.');
}
