import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import BlogForm from '../components/BlogForm';
import { ErrorMessage } from '../components/Feedback';
import LoadingSpinner from '../components/LoadingSpinner';
import { api, errorMessage } from '../services/api';

export function CreatePostPage() {
  const navigate = useNavigate();
  async function create(payload) { const { data } = await api.post('/posts', payload); navigate(data.post.published ? `/posts/${data.post.slug}` : '/my-posts'); }
  return <main className="page-shell editor-page"><Link className="back-link" to="/dashboard"><ArrowLeft size={15} />Dashboard</Link><div className="editor-heading"><span className="eyebrow">MAKE SOMETHING THAT MATTERS</span><h1>Write a <em>story.</em></h1><p>A good story can start a conversation, change a perspective, or simply make someone's day.</p></div><BlogForm onSubmit={create} /></main>;
}

export function EditPostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get(`/posts/${id}`).then(({ data }) => setPost(data.post)).catch(e => setError(errorMessage(e))).finally(() => setLoading(false));
  }, [id]);
  async function update(payload) { const { data } = await api.put(`/posts/${id}`, payload); navigate(data.post.published ? `/posts/${data.post.slug}` : '/my-posts'); }
  if (loading) return <main className="page-shell"><LoadingSpinner label="Loading your story" /></main>;
  if (!post) return <main className="page-shell"><ErrorMessage>{error || 'This post could not be found.'}</ErrorMessage><Link to="/my-posts">Return to My Posts</Link></main>;
  return <main className="page-shell editor-page"><Link className="back-link" to="/my-posts"><ArrowLeft size={15} />My posts</Link><div className="editor-heading"><span className="eyebrow">REFINE YOUR WORDS</span><h1>Edit your <em>story.</em></h1></div><BlogForm key={post._id} initialValue={post} onSubmit={update} submitLabel="Save changes" /></main>;
}
