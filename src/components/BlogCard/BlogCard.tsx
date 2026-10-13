import type { Blog } from '../../types';
import styles from './BlogCard.module.css';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

function getPreview(blog: Blog): string {
  if (import.meta.env.DEV) {
    // Troubleshooting: verify exact API field names (excerpt/content/body/description)
    // eslint-disable-next-line no-console
    console.log('blog object:', blog);
  }
  if (blog.excerpt?.trim()) return blog.excerpt;
  const body = (blog.content ?? '').trim().replace(/\s+/g, ' ');
  if (!body) return '';
  if (body.length <= 150) return body;
  return `${body.slice(0, 150).trimEnd()}...`;
}

export default function BlogCard({ blog, onOpen }: { blog: Blog; onOpen?: (blog: Blog) => void }) {
  return (
    <article className={styles.card}>
      <button
        type="button"
        className={styles.imageButton}
        onClick={() => onOpen?.(blog)}
        aria-label={`Read ${blog.title}`}
      >
        <img src={blog.image.src} srcSet={blog.image.srcSet} sizes={blog.image.sizes} alt={blog.image.alt} width={blog.image.width} height={blog.image.height} loading="lazy" />
      </button>
      <div className={styles.body}>
        <p className="eyebrow">{blog.category} · {formatDate(blog.publishedAt)}</p>
        <h3>{blog.title}</h3>
        <p className={styles.excerpt}>{getPreview(blog)}</p>
        <p className={styles.author}>By {blog.author}</p>
        <button type="button" className={styles.readMore} onClick={() => onOpen?.(blog)}>
          Read More
        </button>
      </div>
    </article>
  );
}
