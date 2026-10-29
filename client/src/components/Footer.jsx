import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return <footer className="site-footer"><div className="footer-main"><div><Link to="/" className="brand"><span className="brand-mark"><BookOpen size={18} /></span><span>blog<span className="brand-accent">sphere</span></span></Link><p>A little corner of the internet for ideas that matter.</p></div><div className="footer-links"><div><strong>Discover</strong><Link to="/explore">Explore stories</Link><Link to="/register">Join the community</Link></div><div><strong>Write</strong><Link to="/write">Start a story</Link><Link to="/about">About BlogSphere</Link></div></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} BlogSphere. Made for curious minds.</span><span>Read widely. Write honestly.</span></div></footer>;
}
