import { ArrowUpRight, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

export default function BlogCard({ post, featured = false }) {
  return <article className={`blog-card ${featured ? 'blog-card-featured' : ''}`}>
    <Link className="card-image-wrap" to={`/posts/${post.slug || post._id}`} aria-label={`Read ${post.title}`}>
      {post.coverImage ? <img src={post.coverImage} alt="" loading="lazy" /> : <div className="cover-placeholder"><span>{post.category?.[0] || 'B'}</span></div>}
      <span className="category-pill">{post.category}</span>
    </Link>
    <div className="card-body">
      <div className="card-meta"><span>{post.author?.name || 'BlogSphere writer'}</span><span className="meta-dot" aria-hidden="true">·</span><time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time></div>
      <h3><Link to={`/posts/${post.slug || post._id}`}>{post.title}</Link></h3>
      <p className="card-excerpt">{post.excerpt}</p>
      <div className="card-foot"><span className="comment-count" aria-label={`${post.commentCount || 0} responses`}><MessageCircle size={15} aria-hidden="true" />{post.commentCount || 0}</span><Link className="read-link" to={`/posts/${post.slug || post._id}`}>Read story <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
    </div>
  </article>;
}
