import { ArrowLeft, ArrowRight, Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import BlogCard from '../components/BlogCard';
import BlogGridSkeleton from '../components/BlogGridSkeleton';
import { EmptyState, ErrorMessage } from '../components/Feedback';
import { api, errorMessage } from '../services/api';

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeQuery = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const requestedPage = Math.max(1, Number.parseInt(searchParams.get('page'), 10) || 1);
  const [query, setQuery] = useState(activeQuery);
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({ page: requestedPage, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const latestRequest = useRef(0);

  async function load(page = requestedPage, q = activeQuery, cat = category) {
    const requestId = ++latestRequest.current;
    setLoading(true);
    setError('');
    try {
      const [postResponse, categoryResponse] = await Promise.all([
        api.get('/posts', { params: { page, limit: 9, ...(q ? { q } : {}), ...(cat ? { category: cat } : {}) } }),
        categories.length ? Promise.resolve({ data: { categories } }) : api.get('/posts/categories')
      ]);
      if (requestId !== latestRequest.current) return;
      setPosts(postResponse.data.posts);
      setPagination(postResponse.data.pagination);
      setCategories(categoryResponse.data.categories);
    } catch (requestError) {
      if (requestId === latestRequest.current) setError(errorMessage(requestError));
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }

  useEffect(() => {
    const q = searchParams.get('q')?.trim() || '';
    const cat = searchParams.get('category') || '';
    const page = Math.max(1, Number.parseInt(searchParams.get('page'), 10) || 1);
    setQuery(q);
    load(page, q, cat);
    return () => { latestRequest.current += 1; };
  }, [searchParams.toString()]);

  function submitSearch(event) {
    event.preventDefault();
    const next = new URLSearchParams();
    const q = query.trim();
    if (q) next.set('q', q);
    if (category) next.set('category', category);
    setSearchParams(next);
  }

  function selectCategory(value) {
    const next = new URLSearchParams();
    if (activeQuery) next.set('q', activeQuery);
    if (value) next.set('category', value);
    setSearchParams(next);
  }

  function selectPage(page) {
    const next = new URLSearchParams(searchParams);
    if (page > 1) next.set('page', String(page));
    else next.delete('page');
    setSearchParams(next);
  }

  return <main className="page-shell explore-page"><div className="page-intro"><span className="eyebrow">THE BLOGSPHERE LIBRARY</span><h1>Find your next <em>rabbit hole.</em></h1><p>Thoughtful writing across the topics that make you stop and think.</p></div>
    <div className="explore-controls"><form className="search-form" onSubmit={submitSearch}><Search size={18} aria-hidden="true" /><label className="sr-only" htmlFor="story-search">Search stories</label><input id="story-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search stories, ideas, topics…" /><button className="btn btn-primary" type="submit">Search</button></form><label className="category-select"><SlidersHorizontal size={16} aria-hidden="true" /><span className="sr-only">Filter by category</span><select value={category} onChange={event => selectCategory(event.target.value)}><option value="">All topics</option>{categories.map(item => <option key={item} value={item}>{item}</option>)}</select></label></div>
    <div className="results-label" role="status" aria-live="polite" aria-atomic="true"><span>{activeQuery ? <>Results for <strong>“{activeQuery}”</strong></> : category ? <><strong>{category}</strong> stories</> : 'Recently published'}</span><span>{pagination.total} {pagination.total === 1 ? 'story' : 'stories'}</span></div>
    {(activeQuery || category) && <button className="text-button clear-filters" type="button" onClick={() => { setQuery(''); setSearchParams(new URLSearchParams()); }}><X size={15} />Clear search and filters</button>}
    {error && <ErrorMessage onRetry={() => load(requestedPage, activeQuery, category)}>{error}</ErrorMessage>}
    {loading ? <BlogGridSkeleton count={6} /> : error ? null : posts.length ? <><div className="blog-grid">{posts.map(post => <BlogCard key={post._id} post={post} />)}</div><nav className="pagination" aria-label="Story pages"><button className="btn btn-secondary" disabled={pagination.page <= 1} onClick={() => selectPage(pagination.page - 1)}><ArrowLeft size={15} />Previous</button><span>Page {pagination.page} of {Math.max(pagination.pages, 1)}</span><button className="btn btn-secondary" disabled={pagination.page >= pagination.pages} onClick={() => selectPage(pagination.page + 1)}><span>Next</span><ArrowRight size={15} /></button></nav></> : <EmptyState title="No stories found" icon={Search}>Try a different search or choose another topic.</EmptyState>}
  </main>;
}
