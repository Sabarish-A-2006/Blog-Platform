import { env } from '../config/env.js';

export function isAllowedClientOrigin(origin) {
  if (origin === env.CLIENT_URL) return true;
  if (env.NODE_ENV === 'production') return false;
  try {
    const url = new URL(origin);
    const port = Number(url.port);
    return url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname) && port >= 5173 && port <= 5199;
  } catch {
    return false;
  }
}
