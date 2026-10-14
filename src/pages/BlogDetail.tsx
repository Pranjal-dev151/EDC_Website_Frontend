import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getBlogBySlug } from '../services/api';
import type { Blog } from '../types';
import styles from './BlogDetail.module.css';

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError('Blog post not found');
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getBlogBySlug(slug, controller.signal)
      .then((b) => {
        setBlog(b);
        document.title = `${b.title} | EDC SIRT`;
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Blog post not found');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [slug]);

  if (loading) return <section className="container section"><p>Loading…</p></section>;
  if (error || !blog) {
    return (
      <section className="container section">
        <p>Blog post not found</p>
        <p><Link to="/blogs">Back to blogs</Link></p>
      </section>
    );
  }

  const paragraphs = (blog.content ?? blog.excerpt ?? '').split('\n\n').map((p) => p.trim()).filter(Boolean);

  return (
    <article className="container section">
      <p className="eyebrow">Blog</p>
      <h1>{blog.title}</h1>
      <p className={styles.meta}>
        Written by {blog.author} · {formatDate(blog.publishedAt)} · {blog.readingMinutes} min read
      </p>
      <img src={blog.image.src} alt={blog.image.alt} className={styles.cover} />
      <div className={styles.body}>
        {paragraphs.map((para, i) => <p key={i}>{para}</p>)}
      </div>
      <div className={styles.actions}>
        <Link to="/blogs" className={styles.back}>← All blogs</Link>
        {blog.linkedin_url && (
          <a href={blog.linkedin_url} target="_blank" rel="noreferrer" className={styles.linkedin}>View on LinkedIn</a>
        )}
      </div>
    </article>
  );
}
