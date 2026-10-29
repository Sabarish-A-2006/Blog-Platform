import { Comment } from '../models/Comment.js';
import { Post } from '../models/Post.js';
import { HttpError } from '../utils/httpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { commentSchema, parse } from '../utils/validation.js';

const commentFields = 'content createdAt updatedAt author post';

async function findReadablePost(id, user) {
  const post = await Post.findById(id);
  if (!post) throw new HttpError(404, 'This post could not be found.');
  if (!post.published && (!user || String(post.author) !== String(user._id))) throw new HttpError(404, 'This post could not be found.');
  return post;
}

export const listComments = asyncHandler(async (req, res) => {
  const post = await findReadablePost(req.params.id, req.user);
  const comments = await Comment.find({ post: post._id }).sort({ createdAt: 1 }).populate('author', 'name profileImage');
  res.json({ success: true, comments, total: comments.length });
});

export const createComment = asyncHandler(async (req, res) => {
  const post = await findReadablePost(req.params.id, req.user);
  const result = parse(commentSchema, req.body);
  if (result.error) throw new HttpError(400, 'Please check your comment.', result.error);
  const comment = await Comment.create({ ...result.data, post: post._id, author: req.user._id });
  await comment.populate('author', 'name profileImage');
  res.status(201).json({ success: true, comment, total: await Comment.countDocuments({ post: post._id }) });
});

export const updateComment = asyncHandler(async (req, res) => {
  const result = parse(commentSchema, req.body);
  if (result.error) throw new HttpError(400, 'Please check your comment.', result.error);
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new HttpError(404, 'This comment could not be found.');
  if (String(comment.author) !== String(req.user._id)) throw new HttpError(403, 'You can only edit your own comments.');
  comment.content = result.data.content;
  await comment.save();
  await comment.populate('author', 'name profileImage');
  res.json({ success: true, comment });
});

export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id).populate('post', 'author');
  if (!comment) throw new HttpError(404, 'This comment could not be found.');
  const isAuthor = String(comment.author) === String(req.user._id);
  const isPostOwner = comment.post && String(comment.post.author) === String(req.user._id);
  if (!isAuthor && !isPostOwner) throw new HttpError(403, 'You can only delete your own comments or moderate comments on your posts.');
  const postId = comment.post?._id || comment.post;
  await comment.deleteOne();
  res.json({ success: true, total: await Comment.countDocuments({ post: postId }) });
});
