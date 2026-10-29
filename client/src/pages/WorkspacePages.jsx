import { ArrowRight, BarChart3, CalendarDays, FileText, MessageCircle, PenLine, Plus, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import BlogCard, { formatDate } from '../components/BlogCard';
import { EmptyState, ErrorMessage } from '../components/Feedback';
import LoadingSpinner from '../components/LoadingSpinner';
import { api, errorMessage } from '../services/api';

function PostRow({ post, onDelete, deleting = false }) {
  return <article className="post-row"><div className="post-row-thumb">{post.coverImage ? <img src={post.coverImage} alt="" /> : <span aria-hidden="true">{post.category?.[0]}</span>}</div><div className="post-row-main"><div className="post-row-meta"><span className={`status-pill ${post.published ? 'status-published' : 'status-draft'}`}>{post.published ? 'Published' : 'Draft'}</span><time dateTime={post.updatedAt || post.createdAt}>{formatDate(post.updatedAt || post.createdAt)}</time></div><h3>{post.published ? <Link to={`/posts/${post.slug}`}>{post.title}</Link> : post.title}</h3><p>{post.excerpt}</p><div className="post-row-count"><MessageCircle size={14} aria-hidden="true" />{post.commentCount || 0} responses</div></div><div className="post-row-actions"><Link className="btn btn-secondary btn-small" to={`/edit/${post._id}`}>Edit</Link><button className="icon-button danger-icon" type="button" aria-label={`Delete ${post.title}`} disabled={deleting} aria-busy={deleting} onClick={() => onDelete(post)}><Trash2 size={17} aria-hidden="true" /></button></div></article>;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null); const [error, setError] = useState(''); const [actionError, setActionError] = useState(''); const [deletingId, setDeletingId] = useState(null); const [loading, setLoading] = useState(true);
  async function load() { setLoading(true); setError(''); setActionError(''); try { const { data } = await api.get('/users/me/dashboard'); setDashboard(data); } catch (e) { setError(errorMessage(e)); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);
  async function remove(post) {
    if (!window.confirm(`Delete “${post.title}” and all its comments?`)) return;
    setDeletingId(post._id); setActionError('');
    try { await api.delete(`/posts/${post._id}`); setDashboard(value => ({ ...value, recentPosts: value.recentPosts.filter(item => item._id !== post._id), stats: { publishedPosts: Math.max(0, value.stats.publishedPosts - Number(post.published)), commentsReceived: Math.max(0, value.stats.commentsReceived - (post.commentCount || 0)) } })); }
    catch (e) { setActionError(errorMessage(e)); }
    finally { setDeletingId(null); }
  }
  return <main className="page-shell dashboard-page"><div className="dashboard-welcome"><div><span className="eyebrow">YOUR CREATOR SPACE</span><h1>Good morning, <em>{user?.name?.split(' ')[0]}.</em></h1><p>Every great story starts with a blank page. What will yours be?</p></div><Link className="btn btn-primary btn-large" to="/write"><PenLine size={16} />Write a story</Link></div>{error && <ErrorMessage onRetry={load}>{error}</ErrorMessage>}{actionError && <ErrorMessage>{actionError}</ErrorMessage>}{loading ? <LoadingSpinner label="Loading your dashboard" /> : dashboard && <><div className="stats-grid"><div className="stat-card"><span className="stat-icon"><FileText size={18} /></span><span className="stat-label">Published stories</span><strong>{dashboard.stats.publishedPosts}</strong><span className="stat-caption">out in the world</span></div><div className="stat-card"><span className="stat-icon stat-icon-green"><MessageCircle size={18} /></span><span className="stat-label">Reader responses</span><strong>{dashboard.stats.commentsReceived}</strong><span className="stat-caption">across your stories</span></div><div className="stat-card stat-card-action"><span className="stat-icon stat-icon-yellow"><BarChart3 size={18} /></span><span className="stat-label">Your next move</span><strong>Keep going.</strong><Link to="/write">Share a new idea <ArrowRight size={14} /></Link></div></div><section className="workspace-section"><div className="workspace-section-heading"><div><span className="eyebrow">A QUICK LOOK</span><h2>Recently updated</h2></div><Link className="section-link" to="/my-posts">All my stories <ArrowRight size={15} /></Link></div>{dashboard.recentPosts.length ? <div className="post-rows">{dashboard.recentPosts.map(post => <PostRow key={post._id} post={post} onDelete={remove} deleting={deletingId === post._id} />)}</div> : <EmptyState title="Your first story is waiting" icon={PenLine}>Share something you care about. It can be an idea, a lesson, or a small moment.</EmptyState>}</section></>}</main>;
}

export function MyPostsPage() {
  const [posts, setPosts] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [actionError, setActionError] = useState(''); const [deletingId, setDeletingId] = useState(null);
  async function load() { setLoading(true); setError(''); setActionError(''); try { const { data } = await api.get('/posts/mine'); setPosts(data.posts); } catch (e) { setError(errorMessage(e)); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);
  async function remove(post) { if (!window.confirm(`Delete “${post.title}” and all its comments?`)) return; setDeletingId(post._id); setActionError(''); try { await api.delete(`/posts/${post._id}`); setPosts(current => current.filter(item => item._id !== post._id)); } catch (e) { setActionError(errorMessage(e)); } finally { setDeletingId(null); } }
  return <main className="page-shell my-posts-page"><div className="dashboard-welcome"><div><span className="eyebrow">YOUR WORDS, ALL IN ONE PLACE</span><h1>My <em>stories.</em></h1><p>Manage your published stories and drafts.</p></div><Link className="btn btn-primary btn-large" to="/write"><Plus size={17} />New story</Link></div>{error && <ErrorMessage onRetry={load}>{error}</ErrorMessage>}{actionError && <ErrorMessage>{actionError}</ErrorMessage>}{loading ? <LoadingSpinner label="Loading your stories" /> : error ? null : posts.length ? <div className="post-rows">{posts.map(post => <PostRow key={post._id} post={post} onDelete={remove} deleting={deletingId === post._id} />)}</div> : <EmptyState title="Nothing here just yet" icon={FileText}>Start with a story idea, a hard-won lesson, or something you can't stop thinking about.<Link className="btn btn-primary" to="/write"><PenLine size={15} />Write your first story</Link></EmptyState>}</main>;
}

export function ProfilePage() {
  const { user } = useAuth(); const [posts, setPosts] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { if (!user?._id) return; api.get(`/users/${user._id}/posts`).then(({ data }) => setPosts(data.posts)).catch(e => setError(errorMessage(e))).finally(() => setLoading(false)); }, [user?._id]);
  return <main className="page-shell profile-page"><section className="profile-hero"><div className="profile-large-avatar">{user?.name?.[0]?.toUpperCase()}</div><div><span className="eyebrow">A BLOGSPHERE WRITER</span><h1>{user?.name}</h1><p><span>{user?.email}</span><span className="profile-separator">·</span><span>{posts.length} {posts.length === 1 ? 'published story' : 'published stories'}</span></p></div><Link className="btn btn-secondary" to="/my-posts">Manage stories</Link></section><div className="workspace-section-heading"><div><span className="eyebrow">FROM THIS WRITER</span><h2>Published stories</h2></div></div>{error && <ErrorMessage>{error}</ErrorMessage>}{loading ? <LoadingSpinner label="Loading your profile" /> : error ? null : posts.length ? <div className="blog-grid">{posts.map(post => <BlogCard key={post._id} post={post} />)}</div> : <EmptyState title="Your published stories will live here" icon={PenLine}>When you publish your first story, readers will find it on your profile.</EmptyState>}</main>;
}

export function AuthorPage() {
  const { id } = useParams(); const [profile, setProfile] = useState(null); const [posts, setPosts] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { Promise.all([api.get(`/users/${id}`), api.get(`/users/${id}/posts`)]).then(([profileResponse, postsResponse]) => { setProfile(profileResponse.data.user); setPosts(postsResponse.data.posts); }).catch(e => setError(errorMessage(e))).finally(() => setLoading(false)); }, [id]);
  if (loading) return <main className="page-shell"><LoadingSpinner label="Loading writer profile" /></main>;
  if (error || !profile) return <main className="page-shell"><ErrorMessage>{error || 'Writer not found.'}</ErrorMessage></main>;
  return <main className="page-shell profile-page"><section className="profile-hero"><div className="profile-large-avatar">{profile.name[0]?.toUpperCase()}</div><div><span className="eyebrow">BLOGSPHERE WRITER</span><h1>{profile.name}</h1><p><CalendarDays size={15} />Writing here since {formatDate(profile.createdAt)}</p></div></section><div className="workspace-section-heading"><div><span className="eyebrow">FROM THIS WRITER</span><h2>Published stories</h2></div></div>{posts.length ? <div className="blog-grid">{posts.map(post => <BlogCard key={post._id} post={post} />)}</div> : <EmptyState title="No published stories yet" icon={FileText}>Check back later for new writing from {profile.name}.</EmptyState>}</main>;
}

export function AboutPage() {
  return <main className="about-page page-shell"><span className="eyebrow">WHY BLOGSPHERE EXISTS</span><h1>Good ideas deserve<br />a place to <em>land.</em></h1><p>BlogSphere is a simple home for curious people to write, read, and meet each other through ideas. No noise. No gatekeeping. Just thoughtful stories and the conversations that follow.</p><div className="about-values"><div><strong>01</strong><h2>Write with heart.</h2><p>Share what you've learned, noticed, built, or wondered about.</p></div><div><strong>02</strong><h2>Read with curiosity.</h2><p>Find a new perspective in the words of someone you might never meet.</p></div><div><strong>03</strong><h2>Respond with care.</h2><p>Thoughtful conversations make every story a little bigger.</p></div></div><Link className="btn btn-primary btn-large" to="/explore">Explore stories <ArrowRight size={16} /></Link></main>;
}
