import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

export async function requireAuth(req, _res, next) {
  try {
    const token = req.cookies?.blogsphere_token;
    if (!token) throw new HttpError(401, 'Please log in to continue.');
    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) throw new HttpError(401, 'Your session is no longer valid. Please log in again.');
    req.user = user;
    next();
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(401, 'Your session expired. Please log in again.'));
  }
}

export async function optionalAuth(req, _res, next) {
  try {
    const token = req.cookies?.blogsphere_token;
    if (token) {
      const payload = jwt.verify(token, env.JWT_SECRET);
      req.user = await User.findById(payload.sub) || undefined;
    }
    next();
  } catch {
    next();
  }
}
