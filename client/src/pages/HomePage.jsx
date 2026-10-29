import { ArrowRight, ArrowUpRight, Feather, PenLine, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import BlogCard from '../components/BlogCard';
import BlogGridSkeleton from '../components/BlogGridSkeleton';
import { EmptyState, ErrorMessage } from '../components/Feedback';
import { api, errorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  async function load() {
    setLoading(true); setError('');
    try { const { data } = await api.get('/posts', { params: { limit: 6 } }); setPosts(data.posts); }
    catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  return <main>
    <section className="hero-section"><div className="hero-content"><div className="hero-kicker"><Sparkles size={14} /> A HOME FOR GOOD IDEAS</div><h1>Every story<br /><span>starts somewhere.</span></h1><p className="hero-copy">BlogSphere is a place to share what you know, explore what you don't, and find a little inspiration along the way.</p><div className="hero-actions"><Link className="btn btn-primary btn-large" to="/explore">Explore stories <ArrowRight size={17} /></Link>{user ? <Link className="btn btn-secondary btn-large" to="/write"><PenLine size={16} />Write your story</Link> : <Link className="btn btn-secondary btn-large" to="/register"><Feather size={16} />Start writing</Link>}</div><div className="hero-note"><span className="note-avatars"><i>A</i><i>M</i><i>J</i></span><span>A growing community of curious minds</span></div></div><div className="hero-art"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="hero-note-card"><span className="hero-note-icon"><Feather size={18} /></span><div><strong>Ideas travel further</strong><span>when we share them.</span></div><ArrowUpRight size={17} className="hero-card-arrow" /></div><div className="hero-stamp">WRITE<br />YOUR<br />WORLD</div><div className="hero-scribble">✳</div><div className="hero-side-label">A place for the curious</div></div><div className="hero-bottomline"><span>READ WIDELY. WRITE HONESTLY.</span><span>SCROLL TO EXPLORE ↓</span></div></section>
    <section className="section latest-section"><div className="section-heading"><div><span className="eyebrow">FRESH FROM THE COMMUNITY</span><h2>Stories to stay <em>curious.</em></h2></div><Link className="section-link" to="/explore">See all stories <ArrowRight size={16} /></Link></div>
      {error && <ErrorMessage onRetry={load}>{error}</ErrorMessage>}
      {loading ? <BlogGridSkeleton featuredFirst /> : error ? null : posts.length ? <div className="blog-grid">{posts.map((post, index) => <BlogCard key={post._id} post={post} featured={index === 0} />)}</div> : <EmptyState title="The first stories are waiting" icon={Feather}>Once someone publishes a story, it will appear here.</EmptyState>}
      <div className="join-banner"><div><span className="eyebrow">YOUR NEXT CHAPTER</span><h2>Got something on<br />your mind?</h2><p>Put it into words. Someone out there is waiting to read it.</p></div><Link className="btn btn-primary btn-large" to={user ? '/write' : '/register'}>{user ? 'Write a story' : 'Join BlogSphere'}<ArrowUpRight size={17} /></Link><div className="banner-mark">✳</div></div>
    </section>
  </main>;
}
