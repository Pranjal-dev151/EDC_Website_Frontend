import { useEffect } from 'react';
import type { Blog } from '../../types';
import styles from './BlogModal.module.css';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

export default function BlogModal({ blog, onClose }: { blog: Blog | null; onClose: () => void }) {
  useEffect(() => {
    if (!blog) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [blog, onClose]);

  if (!blog) return null;
  const gallery = blog.secondaryImages ?? [];

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={blog.title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.window}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close article">
          ×
        </button>
        <p className="eyebrow">{blog.category} · {formatDate(blog.publishedAt)}</p>
        <h2 className={styles.title}>{blog.title}</h2>
        <p className={styles.author}>By {blog.author}</p>
        <img
          className={styles.hero}
          src={blog.image.src}
          srcSet={blog.image.srcSet}
          sizes={blog.image.sizes}
          alt={blog.image.alt}
          width={blog.image.width}
          height={blog.image.height}
        />
        <div className={styles.content}>
          {(blog.content || blog.excerpt).split(/\n{2,}/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
        {gallery.length > 0 && (
          <div className={styles.gallery} aria-label="Article gallery">
            {gallery.map((img, i) => (
              <img key={i} src={img.src} alt={img.alt || `Gallery image ${i + 1}`} loading="lazy" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
