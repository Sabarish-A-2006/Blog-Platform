import { ArrowLeft, ArrowUpRight, Clock3, MessageCircle, Share2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Comments from '../components/Comments';
import { ErrorMessage } from '../components/Feedback';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate } from '../components/BlogCard';
import { api, errorMessage } from '../services/api';

export default function PostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  async function load() {
    setLoading(true); setError('');
    try { const { data } = await api.get(`/posts/slug/${encodeURIComponent(slug)}`); setPost(data.post); }
    catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [slug]);
  if (loading) return <main className="page-shell"><LoadingSpinner label="Opening story" /></main>;
  if (error || !post) return <main className="page-shell"><ErrorMessage onRetry={load}>{error || 'This story could not be found.'}</ErrorMessage><Link className="text-button back-link" to="/explore"><ArrowLeft size={16} />Back to explore</Link></main>;

  const share = async () => {
    setShareMessage('');
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, url: window.location.href });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
        setShareMessage('Story link copied.');
      } else {
        setShareMessage('Copy this page address to share the story.');
      }
    } catch (shareError) {
      if (shareError.name !== 'AbortError') setShareMessage('Sharing is unavailable. Copy this page address to share the story.');
    }
  };
  const readMinutes = Math.max(1, Math.ceil(post.content.trim().split(/\s+/).length / 220));

  return <main className="post-page page-shell"><Link className="back-link" to="/explore"><ArrowLeft size={15} />All stories</Link><article className="post-article"><div className="post-kicker"><span className="category-pill static-pill">{post.category}</span><time className="post-date" dateTime={post.createdAt}>{formatDate(post.createdAt)}</time></div><h1>{post.title}</h1><p className="post-deck">{post.excerpt}</p><div className="post-author-row"><Link to={`/authors/${post.author?._id}`} className="author-avatar" aria-label={`View ${post.author?.name || 'writer'}'s profile`}>{post.author?.name?.[0]?.toUpperCase() || 'B'}</Link><div className="author-details"><Link to={`/authors/${post.author?._id}`}><strong>{post.author?.name}</strong></Link></div><span className="post-row-divider" /><span className="post-read-time"><Clock3 size={15} aria-hidden="true" />{readMinutes} min read</span><button className="share-button" type="button" onClick={share}><Share2 size={15} aria-hidden="true" /><span>Share</span></button>{shareMessage && <span className="share-feedback" role="status" aria-live="polite">{shareMessage}</span>}</div>{post.coverImage && <figure className="post-cover"><img src={post.coverImage} alt="" /></figure>}<div className="post-content">{post.content.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>{post.tags?.length > 0 && <div className="post-tags" aria-label="Story tags">{post.tags.map(tag => <span key={tag}>#{tag}</span>)}</div>}<div className="post-endnote"><span>Enjoyed the read?</span><a href="#comments">Leave a thought <ArrowUpRight size={15} /></a></div></article><Comments postId={post._id} postAuthorId={post.author?._id} /></main>;
}
