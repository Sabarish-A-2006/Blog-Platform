import { CircleAlert } from 'lucide-react';

export function ErrorMessage({ children, onRetry }) {
  return <div className="feedback error-feedback" role="alert"><CircleAlert size={18} /><span>{children}</span>{onRetry && <button className="text-button" onClick={onRetry}>Try again</button>}</div>;
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return <div className="empty-state">{Icon && <span className="empty-icon"><Icon size={22} /></span>}<h3>{title}</h3><p>{children}</p>{action}</div>;
}
