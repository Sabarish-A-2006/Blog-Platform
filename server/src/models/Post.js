import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 4, maxlength: 140 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  excerpt: { type: String, required: true, trim: true, minlength: 10, maxlength: 240 },
  content: { type: String, required: true, trim: true, minlength: 40, maxlength: 50000 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category: { type: String, required: true, trim: true, maxlength: 40, index: true },
  tags: { type: [String], default: [], validate: value => value.length <= 8 },
  coverImage: { type: String, default: '', maxlength: 2048 },
  published: { type: Boolean, default: true, index: true }
}, { timestamps: true });

postSchema.index({ published: 1, createdAt: -1 });
postSchema.index({ title: 'text', content: 'text' });
export const Post = mongoose.model('Post', postSchema);
