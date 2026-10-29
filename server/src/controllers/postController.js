import mongoose from 'mongoose';
import { Post } from '../models/Post.js';
import { Comment } from '../models/Comment.js';
import { User } from '../models/User.js';
import { HttpError } from '../utils/httpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parse, postSchema } from '../utils/validation.js';
import { slugify } from '../utils/slug.js';

const authorFields = 'name profileImage';
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function uniqueSlug(title, exceptId) {
  const base = slugify(title);
  let slug = base;
  let index = 2;
  while (await Post.exists({ slug, ...(exceptId ? { _id: { $ne: exceptId } } : {}) })) slug = `${base}-${index++}`;
  return slug;
}

async function attachCommentCounts(posts) {
  if (!posts.length) return [];
  const ids = posts.map(post => post._id);
  const counts = await Comment.aggregate([{ $match: { post: { $in: ids } } }, { $group: { _id: '$post', count: { $sum: 1 } } }]);
  const countMap = new Map(counts.map(row => [String(row._id), row.count]));
  return posts.map(post => ({ ...post.toJSON(), commentCount: countMap.get(String(post._id)) || 0 }));
}

export const listPosts = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(24, Math.max(1, Number.parseInt(req.query.limit, 10) || 9));
  const filter = { published: true };
  const query = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
  const category = typeof req.query.category === 'string' ? req.query.category.trim().slice(0, 40) : '';
  if (category) filter.category = category;
  if (query) {
    const pattern = new RegExp(escapeRegex(query), 'i');
    filter.$or = [{ title: pattern }, { excerpt: pattern }, { content: pattern }];
  }
  const [posts, total] = await Promise.all([
    Post.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('author', authorFields),
    Post.countDocuments(filter)
  ]);
  res.json({ success: true, posts: await attachCommentCounts(posts), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const getPost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).populate('author', authorFields);
  if (!post) throw new HttpError(404, 'This post could not be found.');
  const authorId = post.author?._id || post.author;
  const isOwner = req.user && String(authorId) === String(req.user._id);
  if (!post.published && !isOwner) throw new HttpError(404, 'This post could not be found.');
  const commentCount = await Comment.countDocuments({ post: post._id });
  res.json({ success: true, post: { ...post.toJSON(), commentCount } });
});

export const getPostBySlug = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug, published: true }).populate('author', authorFields);
  if (!post) throw new HttpError(404, 'This post could not be found.');
  const commentCount = await Comment.countDocuments({ post: post._id });
  res.json({ success: true, post: { ...post.toJSON(), commentCount } });
});

export const listMyPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find({ author: req.user._id }).sort({ updatedAt: -1 }).populate('author', authorFields);
  res.json({ success: true, posts: await attachCommentCounts(posts) });
});

export const createPost = asyncHandler(async (req, res) => {
  const result = parse(postSchema, req.body);
  if (result.error) throw new HttpError(400, 'Please check the submitted fields.', result.error);
  const post = await Post.create({ ...result.data, slug: await uniqueSlug(result.data.title), author: req.user._id });
  await post.populate('author', authorFields);
  res.status(201).json({ success: true, post: { ...post.toJSON(), commentCount: 0 } });
});

export const updatePost = asyncHandler(async (req, res) => {
  const result = parse(postSchema, req.body);
  if (result.error) throw new HttpError(400, 'Please check the submitted fields.', result.error);
  const post = await Post.findById(req.params.id);
  if (!post) throw new HttpError(404, 'This post could not be found.');
  if (String(post.author) !== String(req.user._id)) throw new HttpError(403, 'You can only edit your own posts.');
  Object.assign(post, result.data, { slug: await uniqueSlug(result.data.title, post._id) });
  await post.save();
  await post.populate('author', authorFields);
  res.json({ success: true, post: { ...post.toJSON(), commentCount: await Comment.countDocuments({ post: post._id }) } });
});

export const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw new HttpError(404, 'This post could not be found.');
  if (String(post.author) !== String(req.user._id)) throw new HttpError(403, 'You can only delete your own posts.');
  await Post.deleteOne({ _id: post._id });
  await Comment.deleteMany({ post: post._id });
  res.json({ success: true, message: 'Post and its comments were deleted.' });
});

export const listCategories = asyncHandler(async (_req, res) => {
  const categories = await Post.distinct('category', { published: true });
  res.json({ success: true, categories: categories.sort((a, b) => a.localeCompare(b)) });
});

export const listAuthorPosts = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(400, 'The supplied ID is invalid.');
  if (!await User.exists({ _id: req.params.id })) throw new HttpError(404, 'This author could not be found.');
  const posts = await Post.find({ author: req.params.id, published: true }).sort({ createdAt: -1 }).populate('author', authorFields);
  res.json({ success: true, posts: await attachCommentCounts(posts) });
});

export const authorProfile = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(400, 'The supplied ID is invalid.');
  const user = await User.findById(req.params.id).select('name profileImage createdAt');
  if (!user) throw new HttpError(404, 'This author could not be found.');
  res.json({ success: true, user });
});

export const dashboard = asyncHandler(async (req, res) => {
  const posts = await Post.find({ author: req.user._id }).sort({ updatedAt: -1 }).limit(5).populate('author', authorFields);
  const postIds = await Post.find({ author: req.user._id }).distinct('_id');
  const [postCount, commentCount] = await Promise.all([
    Post.countDocuments({ author: req.user._id, published: true }),
    Comment.countDocuments({ post: { $in: postIds } })
  ]);
  res.json({ success: true, stats: { publishedPosts: postCount, commentsReceived: commentCount }, recentPosts: await attachCommentCounts(posts) });
});
