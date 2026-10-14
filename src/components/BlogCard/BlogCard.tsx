import { Link } from 'react-router-dom';
import type { Blog } from '../../types';
import styles from './BlogCard.module.css';

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function BlogCard({ blog }: { blog: Blog; onOpen?: (blog: Blog) => void }) {
  return (
    <article className={styles.card}>
      <Link to={`/blogs/${blog.slug}`} className={styles.imageLink}>
        <img src={blog.image.src} srcSet={blog.image.srcSet} sizes={blog.image.sizes} alt={blog.image.alt} width={blog.image.width} height={blog.image.height} loading="lazy" />
      </Link>
      <div className={styles.body}>
        <h3>
          <Link to={`/blogs/${blog.slug}`}>{blog.title}</Link>
        </h3>
        <p className={styles.date}>{formatDate(blog.publishedAt)}</p>
        <p className={styles.author}>Written by {blog.author}</p>
        <div className={styles.actions}>
          <Link to={`/blogs/${blog.slug}`} className={styles.viewMore}>View More</Link>
          {blog.linkedin_url && (
            <a href={blog.linkedin_url} target="_blank" rel="noreferrer" className={styles.linkedin}>
              View on LinkedIn
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2.5 9.5 9.5 2.5M3.5 2.5h6v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
