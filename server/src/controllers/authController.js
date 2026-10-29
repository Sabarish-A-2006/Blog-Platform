import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { loginSchema, parse, registerSchema } from '../utils/validation.js';

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.COOKIE_SAME_SITE,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000
};

function setSession(res, user) {
  const token = jwt.sign({ sub: user.id }, env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('blogsphere_token', token, cookieOptions);
}

export const register = asyncHandler(async (req, res) => {
  const result = parse(registerSchema, req.body);
  if (result.error) throw new HttpError(400, 'Please check the submitted fields.', result.error);
  const { name, email, password } = result.data;
  if (await User.exists({ email })) throw new HttpError(409, 'An account with this email already exists.');
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash });
  setSession(res, user);
  res.status(201).json({ success: true, user });
});

export const login = asyncHandler(async (req, res) => {
  const result = parse(loginSchema, req.body);
  if (result.error) throw new HttpError(400, 'Please enter a valid email and password.', result.error);
  const { email, password } = result.data;
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new HttpError(401, 'Email or password is incorrect.');
  setSession(res, user);
  res.json({ success: true, user });
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie('blogsphere_token', { ...cookieOptions, maxAge: undefined });
  res.json({ success: true, message: 'You are signed out.' });
});

export const currentUser = asyncHandler(async (req, res) => {
  if (!req.cookies?.blogsphere_token) return res.json({ success: true, user: null });
  // A stale token should not prevent the app shell from loading; /me is a state check.
  try {
    const payload = jwt.verify(req.cookies.blogsphere_token, env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    return res.json({ success: true, user: user || null });
  } catch {
    res.clearCookie('blogsphere_token', { ...cookieOptions, maxAge: undefined });
    return res.json({ success: true, user: null });
  }
});
