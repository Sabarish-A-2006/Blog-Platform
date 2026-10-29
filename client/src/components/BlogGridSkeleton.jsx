export default function BlogGridSkeleton({ count = 6, featuredFirst = false }) {
  return <div className="blog-grid skeleton-grid" role="status" aria-label="Loading stories" aria-busy="true"><span className="sr-only">Loading stories</span>
    {Array.from({ length: count }, (_, index) => <article className={`skeleton-card ${featuredFirst && index === 0 ? 'skeleton-featured' : ''}`} key={index}>
      <div className="skeleton-image" />
      <div className="skeleton-copy"><span className="skeleton-line skeleton-short" /><span className="skeleton-line skeleton-title" /><span className="skeleton-line" /><span className="skeleton-line skeleton-medium" /></div>
    </article>)}
  </div>;
}
