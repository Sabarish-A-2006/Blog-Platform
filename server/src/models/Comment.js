import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  content: { type: String, required: true, trim: true, minlength: 2, maxlength: 1200 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true }
}, { timestamps: true });

commentSchema.index({ post: 1, createdAt: 1 });
export const Comment = mongoose.model('Comment', commentSchema);
