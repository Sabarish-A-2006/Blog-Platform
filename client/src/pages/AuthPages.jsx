import { ArrowLeft, ArrowRight, BookOpen, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../services/api';

function AuthFrame({ mode, children }) {
  return <main className="auth-layout"><a className="skip-link" href="#main-content">Skip to content</a><section className="auth-form-side"><Link to="/" className="brand auth-brand"><span className="brand-mark"><BookOpen size={19} /></span><span>blog<span className="brand-accent">sphere</span></span></Link><div className="auth-content">{children}</div><div className="auth-footnote">© {new Date().getFullYear()} BlogSphere · A home for good ideas</div></section><aside className="auth-visual" aria-hidden="true"><div className="auth-visual-top"><span>WORDS CONNECT US</span><span>✳</span></div><div className="auth-quote-mark">“</div><blockquote>{mode === 'login' ? 'Somewhere, someone is waiting for the words only you can write.' : 'The world is wide enough for every voice. Add yours to the conversation.'}</blockquote><div className="auth-visual-bottom"><span>WRITE WHAT MOVES YOU.</span><span>READ WHAT OPENS YOU.</span></div><div className="auth-orbit" /></aside></main>;
}

function PasswordField({ value, onChange, name = 'password', label = 'Password', autoComplete = 'current-password', minLength = 8 }) {
  const [visible, setVisible] = useState(false);
  return <label className="field-label">{label}<span className="password-input-wrap"><LockKeyhole size={16} aria-hidden="true" /><input id={name} name={name} type={visible ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} minLength={minLength} required /><button type="button" aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} aria-controls={name} onClick={() => setVisible(item => !item)}>{visible ? <EyeOff size={16} /> : <Eye size={16} />}</button></span>{autoComplete === 'new-password' && name === 'password' && <small>Use at least 8 characters.</small>}</label>;
}

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate(); const location = useLocation();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(event) { event.preventDefault(); setBusy(true); setError(''); try { await signIn({ email, password }); navigate(location.state?.from || '/dashboard', { replace: true }); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); } }
  return <AuthFrame mode="login"><Link className="back-link" to="/"><ArrowLeft size={15} />Back home</Link><span className="eyebrow auth-eyebrow">WELCOME BACK</span><h1>Good to have<br />you <em>here.</em></h1><p className="auth-intro">Pick up where your curiosity left off.</p>{error && <div className="auth-error" id="auth-error" role="alert" aria-live="assertive">{error}</div>}<form className="auth-form" onSubmit={submit} aria-busy={busy}><label className="field-label">Email address<span className="icon-input-wrap"><Mail size={16} aria-hidden="true" /><input id="login-email" name="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required /></span></label><PasswordField value={password} onChange={e => setPassword(e.target.value)} /><button className="btn btn-primary btn-large auth-submit" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}<ArrowRight size={17} /></button></form><p className="auth-switch">New to BlogSphere? <Link to="/register">Create an account</Link></p></AuthFrame>;
}

export function RegisterPage() {
  const { register } = useAuth(); const navigate = useNavigate(); const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '', passwordConfirmation: '' }); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const update = event => setForm(value => ({ ...value, [event.target.name]: event.target.value }));
  async function submit(event) {
    event.preventDefault();
    setError('');
    if (form.password !== form.passwordConfirmation) { setError('Passwords do not match.'); return; }
    setBusy(true);
    try { await register(form); navigate(location.state?.from || '/dashboard', { replace: true }); }
    catch (e) { const errors = e?.response?.data?.errors; setError(errors ? Object.values(errors).flat()[0] : errorMessage(e)); }
    finally { setBusy(false); }
  }
  return <AuthFrame mode="register"><Link className="back-link" to="/"><ArrowLeft size={15} />Back home</Link><span className="eyebrow auth-eyebrow">MAKE YOURSELF AT HOME</span><h1>Come on <em>in.</em></h1><p className="auth-intro">Join a community of people sharing what they know.</p>{error && <div className="auth-error" id="auth-error" role="alert" aria-live="assertive">{error}</div>}<form className="auth-form" onSubmit={submit} aria-busy={busy}><label className="field-label">Your name<span className="icon-input-wrap"><UserRound size={16} aria-hidden="true" /><input id="register-name" name="name" value={form.name} onChange={update} placeholder="What should we call you?" autoComplete="name" minLength={2} maxLength={60} required /></span></label><label className="field-label">Email address<span className="icon-input-wrap"><Mail size={16} aria-hidden="true" /><input id="register-email" type="email" name="email" value={form.email} onChange={update} placeholder="you@example.com" autoComplete="email" required /></span></label><PasswordField name="password" label="Password" value={form.password} onChange={update} autoComplete="new-password" /><PasswordField name="passwordConfirmation" label="Confirm password" value={form.passwordConfirmation} onChange={update} autoComplete="new-password" minLength={8} /><button className="btn btn-primary btn-large auth-submit" type="submit" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}<ArrowRight size={17} /></button><p className="terms-note">By joining, you agree to be thoughtful and kind in the comments.</p></form><p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p></AuthFrame>;
}
