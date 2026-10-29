import { z } from 'zod';

const safeImageUrl = z.string().trim().max(2048).refine(value => !value || /^https:\/\//i.test(value), 'Image URL must use HTTPS.');
const tagSchema = z.string().trim().min(1).max(24).transform(value => value.toLowerCase());

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  password: z.string().min(8).max(128),
  passwordConfirmation: z.string().min(1)
}).refine(value => value.password === value.passwordConfirmation, { path: ['passwordConfirmation'], message: 'Passwords do not match.' });

export const loginSchema = z.object({ email: z.string().trim().email().max(254).transform(value => value.toLowerCase()), password: z.string().min(1).max(128) });
export const postSchema = z.object({
  title: z.string().trim().min(4).max(140),
  excerpt: z.string().trim().min(10).max(240),
  content: z.string().trim().min(40).max(50000),
  category: z.string().trim().min(2).max(40),
  tags: z.array(tagSchema).max(8).default([]),
  coverImage: safeImageUrl.default(''),
  published: z.boolean().default(true)
});
export const commentSchema = z.object({ content: z.string().trim().min(2).max(1200) });

export function parse(schema, data) {
  const result = schema.safeParse(data);
  return result.success ? { data: result.data } : { error: result.error.flatten().fieldErrors };
}
