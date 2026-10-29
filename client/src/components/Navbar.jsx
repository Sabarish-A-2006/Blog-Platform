import { BookOpen, ChevronDown, Menu, PenLine, UserRound, X } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../services/api';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const navShellRef = useRef(null);
  const menuButtonRef = useRef(null);
  const profileButtonRef = useRef(null);
  const navigate = useNavigate();
  const close = () => setMenuOpen(false);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key !== 'Escape') return;
      if (menuOpen) menuButtonRef.current?.focus();
      else if (profileOpen) profileButtonRef.current?.focus();
      setMenuOpen(false);
      setProfileOpen(false);
    }
    function handleOutsideClick(event) {
      if (!navShellRef.current?.contains(event.target)) {
        setMenuOpen(false);
        setProfileOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handleOutsideClick);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handleOutsideClick);
    };
  }, [menuOpen, profileOpen]);

  async function handleSignOut() {
    setSignOutError('');
    try {
      await signOut();
      setProfileOpen(false);
      close();
      navigate('/');
    } catch (error) {
      setSignOutError(errorMessage(error));
    }
  }

  return <header className="site-header" ref={navShellRef}>
    <div className="nav-shell">
      <Link to="/" className="brand" onClick={close}><span className="brand-mark"><BookOpen size={19} strokeWidth={2.3} /></span><span>blog<span className="brand-accent">sphere</span></span></Link>
      <nav id="main-navigation" className={`main-nav ${menuOpen ? 'nav-open' : ''}`} aria-label="Main navigation">
        <NavLink to="/explore" onClick={close}>Explore</NavLink>
        {user && <><NavLink to="/dashboard" onClick={close}>Dashboard</NavLink><NavLink to="/my-posts" onClick={close}>My posts</NavLink><NavLink className="mobile-write-link" to="/write" onClick={close}>Write a story</NavLink></>}
        {!user && <NavLink to="/write" onClick={close}>Write a story</NavLink>}
        {!user && <NavLink to="/about" onClick={close}>About</NavLink>}
        <div className="mobile-nav-actions">
          {user ? <><button className="btn btn-quiet" type="button" onClick={handleSignOut}>Log out</button>{signOutError && <span className="nav-action-error" role="alert">{signOutError}</span>}</> : <><Link className="btn btn-quiet" to="/login" onClick={close}>Log in</Link><Link className="btn btn-primary" to="/register" onClick={close}>Get started</Link></>}
        </div>
      </nav>
      <div className="nav-actions">
        {user ? <>
          <Link className="btn btn-primary nav-write" to="/write"><PenLine size={16} />Write a story</Link>
          <div className="profile-menu-wrap">
          <button ref={profileButtonRef} id="account-menu-trigger" className="avatar-button" type="button" aria-label={profileOpen ? 'Close account menu' : 'Open account menu'} aria-controls="profile-menu" aria-expanded={profileOpen} onClick={() => { setProfileOpen(open => !open); setSignOutError(''); }}>{user.name?.[0]?.toUpperCase()}<ChevronDown size={13} /></button>
          {profileOpen && <div className="profile-menu" id="profile-menu"><div className="profile-menu-user"><strong>{user.name}</strong><span>{user.email}</span></div><Link to="/profile" onClick={() => setProfileOpen(false)}><UserRound size={15} /> My profile</Link><button type="button" onClick={handleSignOut}>Log out</button>{signOutError && <p className="nav-action-error" role="alert">{signOutError}</p>}</div>}
          </div>
        </> : <><Link className="nav-login" to="/login">Log in</Link><Link className="btn btn-primary nav-get-started" to="/register">Get started <span>↗</span></Link></>}
      </div>
      <button ref={menuButtonRef} className="mobile-menu-button" type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-controls="main-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(open => !open)}>{menuOpen ? <X /> : <Menu />}</button>
    </div>
  </header>;
}
