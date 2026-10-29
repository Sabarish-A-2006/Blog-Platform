import { useState } from 'react';
import { Eye, EyeOff, Image, Save } from 'lucide-react';
import { ErrorMessage } from './Feedback';

const empty = { title: '', excerpt: '', content: '', category: '', tags: '', coverImage: '', published: true };
const fieldIdByName = { title: 'story-title', excerpt: 'story-excerpt', content: 'story-content', category: 'story-category', tags: 'story-tags', coverImage: 'story-cover-url' };

function focusFirstInvalidField(errors) {
  const firstField = Object.keys(errors)[0];
  const fieldId = fieldIdByName[firstField];
  if (fieldId) requestAnimationFrame(() => document.getElementById(fieldId)?.focus());
}

export default function BlogForm({ initialValue, onSubmit, submitLabel }) {
  const [form, setForm] = useState(() => initialValue ? { ...initialValue, tags: (initialValue.tags || []).join(', ') } : empty);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [coverImageFailed, setCoverImageFailed] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  function update(event) {
    const { name, value, checked, type } = event.target;
    setForm(current => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    setFieldErrors(current => ({ ...current, [name]: undefined }));
    if (name === 'coverImage') setCoverImageFailed(false);
  }

  async function submit(event) {
    event.preventDefault();
    if (preview) {
      setError('Return to editing mode before saving your story.');
      return;
    }
    setSaving(true);
    setError('');
    setFieldErrors({});
    const tags = form.tags.split(',').map(tag => tag.trim()).filter(Boolean);
    if (tags.length > 8) {
      const tagError = { tags: ['Use no more than 8 tags.'] };
      setFieldErrors(tagError);
      focusFirstInvalidField(tagError);
      setSaving(false);
      return;
    }
    const payload = { ...form, tags };
    try {
      await onSubmit(payload);
    } catch (submitError) {
      setError(submitError?.response?.data?.message || 'Your story could not be saved. Please try again.');
      const errors = submitError?.response?.data?.errors || {};
      setFieldErrors(errors);
      focusFirstInvalidField(errors);
    } finally {
      setSaving(false);
    }
  }

  const words = form.content.trim() ? form.content.trim().split(/\s+/).length : 0;
  const readingMinutes = Math.ceil(words / 220);
  const actionLabel = submitLabel || (form.published ? 'Publish story' : 'Save draft');

  return <form className="blog-form" onSubmit={submit} aria-busy={saving}>
    {error && <ErrorMessage>{error}</ErrorMessage>}
    <div className="form-row"><label className="field-label" htmlFor="story-title">Story title<input id="story-title" name="title" value={form.title} onChange={update} minLength={4} maxLength={140} aria-invalid={Boolean(fieldErrors.title)} aria-describedby="story-title-help" placeholder="Give your story a title" required /><small id="story-title-help">{fieldErrors.title?.[0] || `${form.title.length}/140 characters`}</small></label></div>
    <label className="field-label" htmlFor="story-excerpt">Short introduction<textarea id="story-excerpt" name="excerpt" value={form.excerpt} onChange={update} minLength={10} maxLength={240} rows={2} aria-invalid={Boolean(fieldErrors.excerpt)} aria-describedby="story-excerpt-help" placeholder="A sentence that invites readers in…" required /><small id="story-excerpt-help">{fieldErrors.excerpt?.[0] || `${form.excerpt.length}/240 characters`}</small></label>
    <div className="story-field-header"><label className="field-label" htmlFor="story-content">Your story</label><button className="text-button preview-toggle" type="button" aria-pressed={preview} onClick={() => setPreview(value => !value)}>{preview ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}{preview ? 'Edit story' : 'Preview story'}</button></div>
    {preview ? <article className="story-preview" aria-label="Story preview"><h2>{form.title || 'Untitled story'}</h2>{form.excerpt && <p className="story-preview-excerpt">{form.excerpt}</p>}{form.content.trim() ? form.content.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>) : <p className="story-preview-empty">Your story preview will appear here as you write.</p>}</article> : <textarea className="story-editor" id="story-content" name="content" value={form.content} onChange={update} minLength={40} maxLength={50000} rows={15} aria-invalid={Boolean(fieldErrors.content)} aria-describedby="story-content-help story-content-count" placeholder="Start writing your story here…" required />}
    <div className="story-content-meta"><small id="story-content-help">{fieldErrors.content?.[0] || 'Plain text is supported. Separate paragraphs with a blank line.'}</small><span id="story-content-count">{words} {words === 1 ? 'word' : 'words'}{words > 0 ? ` · about ${readingMinutes} min read` : ''}</span></div>
    <div className="form-grid-two"><label className="field-label" htmlFor="story-category">Category<input id="story-category" name="category" value={form.category} onChange={update} minLength={2} maxLength={40} aria-invalid={Boolean(fieldErrors.category)} aria-describedby="story-category-help" placeholder="e.g. Design, Culture" required /><small id="story-category-help">{fieldErrors.category?.[0] || 'Choose a clear topic for this story.'}</small></label><label className="field-label" htmlFor="story-tags">Tags<input id="story-tags" name="tags" value={form.tags} onChange={update} maxLength={256} aria-invalid={Boolean(fieldErrors.tags)} aria-describedby="story-tags-help" placeholder="Separate tags with commas" /><small id="story-tags-help">{fieldErrors.tags?.[0] || 'Add up to 8 tags, separated by commas.'}</small></label></div>
    <label className="field-label cover-url-label" htmlFor="story-cover-url"><span><Image size={16} aria-hidden="true" />Cover image URL</span><input id="story-cover-url" name="coverImage" type="url" value={form.coverImage} onChange={update} aria-invalid={Boolean(fieldErrors.coverImage) || coverImageFailed} aria-describedby="story-cover-help" placeholder="https://example.com/image.jpg" /><small id="story-cover-help">{fieldErrors.coverImage?.[0] || (coverImageFailed ? 'This image could not be loaded. Check the link or choose another image.' : 'Use a secure HTTPS image link. Images are optional.')}</small></label>
    {form.coverImage && !coverImageFailed && <div className="image-preview"><img src={form.coverImage} alt="" onError={() => setCoverImageFailed(true)} /></div>}
    <div className="form-actions"><label className="publish-toggle"><input type="checkbox" name="published" checked={form.published} onChange={update} /><span className="toggle-track" aria-hidden="true" /><span>{form.published ? 'Publish now' : 'Save as draft'}</span></label><button className="btn btn-primary" type="submit" disabled={saving}><Save size={16} aria-hidden="true" />{saving ? 'Saving…' : actionLabel}</button></div>
  </form>;
}
