import { ArrowLeft, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return <main className="not-found page-shell"><span className="not-found-number">404</span><span className="eyebrow">A LITTLE OFF THE MAP</span><h1>This page wandered<br /><em>somewhere else.</em></h1><p>The link might be old, or the story may have moved. Let's get you back to the good stuff.</p><Link className="btn btn-primary btn-large" to="/"><Compass size={17} />Back to BlogSphere</Link><Link className="text-button" to="/explore"><ArrowLeft size={15} />Explore stories instead</Link></main>;
}
