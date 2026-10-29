import mongoose from 'mongoose';
import { HttpError } from '../utils/httpError.js';

export function notFound(_req, _res, next) { next(new HttpError(404, 'The requested API route was not found.')); }

export function errorHandler(error, _req, res, _next) {
  if (res.headersSent) return;
  let status = error.status || 500;
  let message = error.message || 'Something went wrong.';
  let details = error.details;
  if (error instanceof mongoose.Error.CastError) { status = 400; message = 'The supplied ID is invalid.'; }
  if (error instanceof mongoose.Error.ValidationError) { status = 400; message = 'Please check the submitted fields.'; details = Object.fromEntries(Object.entries(error.errors).map(([key, value]) => [key, value.message])); }
  if (error.code === 11000) { status = 409; message = 'That value is already in use.'; }
  if (status >= 500) console.error(error);
  res.status(status).json({ success: false, message: status >= 500 ? 'A server error occurred. Please try again.' : message, ...(details ? { errors: details } : {}) });
}
