import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';
import { isAllowedClientOrigin } from './origin.js';

const cookieName = 'blogsphere_csrf';
const mac = value => createHmac('sha256', env.JWT_SECRET).update(value).digest('hex');
const signatureFor = value => `${value}.${mac(value)}`;

export function issueCsrf(req, res) {
  const token = signatureFor(randomBytes(32).toString('hex'));
  res.cookie(cookieName, token, { httpOnly: false, secure: env.NODE_ENV === 'production', sameSite: env.COOKIE_SAME_SITE, path: '/', maxAge: 24 * 60 * 60 * 1000 });
  res.json({ csrfToken: token });
}

export function requireCsrf(req, _res, next) {
  const origin = req.get('origin');
  if (origin && !isAllowedClientOrigin(origin)) return next(new HttpError(403, 'Request origin is not allowed.'));
  const cookieToken = req.cookies?.[cookieName];
  const headerToken = req.get('x-csrf-token');
  if (!cookieToken || !headerToken || cookieToken !== headerToken) return next(new HttpError(403, 'This request could not be verified. Refresh and try again.'));
  const [nonce, signature] = cookieToken.split('.');
  if (!nonce || !signature || !/^[a-f0-9]{64}$/.test(nonce) || !/^[a-f0-9]{64}$/.test(signature)) return next(new HttpError(403, 'This request could not be verified. Refresh and try again.'));
  const expected = Buffer.from(mac(nonce), 'hex');
  const supplied = Buffer.from(signature, 'hex');
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return next(new HttpError(403, 'This request could not be verified. Refresh and try again.'));
  next();
}
