import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Pencil, Send, Trash2, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { api, errorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ErrorMessage } from './Feedback';
import LoadingSpinner from './LoadingSpinner';
import { formatDate } from './BlogCard';

export default function Comments({ postId, postAuthorId }) {
  const { user } = useAuth();
  const location = useLocation();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [editing, setEditing] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [sending, setSending] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const loadSequence = useRef(0);

  async function load() {
    const sequence = ++loadSequence.current;
    setLoading(true);
    setLoadError('');
    try {
      const { data } = await api.get(`/posts/${postId}/comments`);
      if (sequence === loadSequence.current) setComments(data.comments);
    } catch (error) {
      if (sequence === loadSequence.current) setLoadError(errorMessage(error));
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }

  useEffect(() => {
    setComments([]);
    setContent('');
    setEditing(null);
    setActionError('');
    setNotice('');
    load();
    return () => { loadSequence.current += 1; };
  }, [postId]);

  async function addComment(event) {
    event.preventDefault();
    const trimmed = content.trim();
    if (trimmed.length < 2) return;
    setSending(true);
    setActionError('');
    setNotice('');
    try {
      const { data } = await api.post(`/posts/${postId}/comments`, { content: trimmed });
      setComments(list => [...list, data.comment]);
      setContent('');
      setNotice('Your response was posted.');
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setSending(false);
    }
  }

  async function saveEdit(event, id) {
    event.preventDefault();
    const trimmed = editContent.trim();
    if (trimmed.length < 2) return;
    setSavingEdit(true);
    setActionError('');
    setNotice('');
    try {
      const { data } = await api.put(`/comments/${id}`, { content: trimmed });
      setComments(list => list.map(comment => comment._id === id ? data.comment : comment));
      setEditing(null);
      setNotice('Your response was updated.');
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setSavingEdit(false);
    }
  }

  async function removeComment(comment) {
    const authorName = comment.author?.name || 'this reader';
    if (!window.confirm(`Delete the response from ${authorName}?`)) return;
    setDeletingId(comment._id);
    setActionError('');
    setNotice('');
    try {
      await api.delete(`/comments/${comment._id}`);
      setComments(list => list.filter(item => item._id !== comment._id));
      setNotice('The response was deleted.');
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setDeletingId(null);
    }
  }

  return <section className="comments-section" id="comments" aria-labelledby="comments-title">
    <div className="comments-heading"><div><span className="eyebrow">THE CONVERSATION</span><h2 id="comments-title">Thoughts &amp; replies <span aria-label={`${comments.length} responses`} aria-live="polite">{comments.length}</span></h2></div><MessageCircle size={20} aria-hidden="true" /></div>
    {user ? <form className="comment-composer" onSubmit={addComment} aria-busy={sending}><div className="comment-avatar" aria-hidden="true">{user.name?.[0]?.toUpperCase()}</div><div className="composer-content"><label className="sr-only" htmlFor="new-comment">Your response</label><textarea id="new-comment" value={content} onChange={event => setContent(event.target.value)} minLength={2} maxLength={1200} aria-describedby="comment-guidance comment-count" placeholder="Share a thoughtful response…" rows={3} required /><div className="composer-foot"><span id="comment-count">{content.length}/1200 characters</span><button className="btn btn-primary btn-small" type="submit" disabled={sending || content.trim().length < 2}><Send size={14} aria-hidden="true" />{sending ? 'Sending…' : 'Respond'}</button></div><span className="sr-only" id="comment-guidance">Responses must be between 2 and 1,200 characters.</span></div></form> : <div className="login-prompt"><MessageCircle size={18} aria-hidden="true" /><span>Join the conversation. <Link to="/login" state={{ from: { pathname: location.pathname, search: location.search, hash: location.hash } }}>Log in</Link> or <Link to="/register" state={{ from: { pathname: location.pathname, search: location.search, hash: location.hash } }}>create an account</Link> to leave a comment.</span></div>}
    {actionError && <ErrorMessage>{actionError}</ErrorMessage>}
    {notice && <p className="success-feedback" role="status" aria-live="polite">{notice}</p>}
    {loadError && <ErrorMessage onRetry={load}>{loadError}</ErrorMessage>}
    {loading ? <LoadingSpinner label="Loading replies" /> : loadError ? null : comments.length === 0 ? <p className="no-comments">No replies yet. Start the conversation.</p> : <div className="comment-list">{comments.map(comment => {
      const own = user && String(comment.author?._id) === String(user._id);
      const canModerate = user && String(postAuthorId) === String(user._id);
      const authorName = comment.author?.name || 'Reader';
      const edited = new Date(comment.updatedAt).getTime() > new Date(comment.createdAt).getTime();
      return <article className="comment-item" key={comment._id}><div className="comment-avatar" aria-hidden="true">{authorName[0]?.toUpperCase() || 'B'}</div><div className="comment-main"><div className="comment-meta"><strong>{authorName}</strong><time dateTime={comment.createdAt}>{formatDate(comment.createdAt)}</time>{edited && <span className="edited-label">edited</span>}</div>{editing === comment._id ? <form className="comment-edit" onSubmit={event => saveEdit(event, comment._id)}><label className="sr-only" htmlFor={`edit-comment-${comment._id}`}>Edit your response</label><textarea id={`edit-comment-${comment._id}`} value={editContent} onChange={event => setEditContent(event.target.value)} minLength={2} maxLength={1200} aria-describedby={`edit-count-${comment._id}`} rows={3} required /><div><span id={`edit-count-${comment._id}`}>{editContent.length}/1200</span><button className="text-button" type="button" onClick={() => setEditing(null)}><X size={14} />Cancel</button><button className="text-button" type="submit" disabled={savingEdit || editContent.trim().length < 2}>{savingEdit ? 'Saving…' : 'Save changes'}</button></div></form> : <p>{comment.content}</p>}</div><div className="comment-actions">{own && editing !== comment._id && <button type="button" aria-label={`Edit your response from ${formatDate(comment.createdAt)}`} title="Edit response" onClick={() => { setEditing(comment._id); setEditContent(comment.content); setActionError(''); setNotice(''); }}><Pencil size={14} aria-hidden="true" /></button>}{(own || canModerate) && <button type="button" aria-label={`Delete response from ${authorName}`} title={canModerate && !own ? 'Moderate response' : 'Delete response'} disabled={deletingId === comment._id} onClick={() => removeComment(comment)}><Trash2 size={15} aria-hidden="true" /></button>}</div></article>;
    })}</div>}
  </section>;
}
