import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DropzoneField from '../../components/DropzoneField/DropzoneField';
import type { Blog, ContentImage } from '../../types';
import {
  AuthError,
  clearBlogExtras,
  createBlog,
  deleteBlog,
  getBlogExtras,
  listBlogs,
  setBlogExtras,
  updateBlog,
} from '../../services/adminApi';
import styles from './Admin.module.css';

interface BlogForm {
  title: string;
  author: string;
  excerpt: string;
  published_at: string;
  category: string;
  content: string;
  linkedin_url: string;
  primaryImage: string[];
  slug: string;
  image_alt: string;
  featured: boolean;
  published: boolean;
  secondaryImages: string[];
}

const EMPTY: BlogForm = {
  title: '',
  author: '',
  excerpt: '',
  published_at: '',
  category: '',
  content: '',
  linkedin_url: '',
  primaryImage: [],
  slug: '',
  image_alt: '',
  featured: false,
  published: true,
  secondaryImages: [],
};

function toImage(src: string, alt: string): ContentImage {
  return { src, alt, width: 800, height: 520, srcSet: src, sizes: '(min-width: 1024px) 33vw, 100vw' };
}

function withExtras(blogs: Blog[]): Blog[] {
  return blogs.map((b) => {
    const extras = getBlogExtras(b.id);
    return {
      ...b,
      content: extras.content,
      linkedin_url: extras.linkedin_url ?? b.linkedin_url,
      secondaryImages: extras.secondaryImages,
      image: extras && b.image.src ? b.image : b.image,
    };
  });
}

export default function AdminBlogs() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [status, setStatus] = useState('Loading…');
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BlogForm>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setStatus('Loading…');
    setError(null);
    try {
      setBlogs(withExtras(await listBlogs()));
      setStatus('');
    } catch (err) {
      if (err instanceof AuthError) {
        navigate('/admin/login', { replace: true });
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to load blogs.');
      setStatus('');
    }
  }, [navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  function openNew() {
    setEditingId(null);
    setForm(EMPTY);
    setFormOpen(true);
  }

  function openEdit(blog: Blog) {
    const extras = getBlogExtras(blog.id);
    setEditingId(blog.id);
    setForm({
      title: blog.title,
      author: blog.author,
      excerpt: blog.excerpt,
      published_at: blog.publishedAt ? blog.publishedAt.slice(0, 16) : '',
      category: blog.category,
      content: extras.content ?? '',
      linkedin_url: extras.linkedin_url ?? blog.linkedin_url ?? '',
      primaryImage: blog.image.src ? [blog.image.src] : [],
      slug: blog.slug,
      image_alt: blog.image.alt,
      featured: blog.featured,
      published: true,
      secondaryImages: (extras.secondaryImages ?? []).map((i) => i.src),
    });
    setFormOpen(true);
  }

  function validate(f: BlogForm): string | null {
    if (!f.title.trim()) return 'Title is required.';
    if (!f.author.trim()) return 'Author is required.';
    if (!f.published_at) return 'Publish date is required.';
    if (!f.category.trim()) return 'Category is required.';
    if (!f.content.trim()) return 'Blog content is required.';
    if (f.primaryImage.length === 0) return 'Primary image is required.';
    return null;
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    const problem = validate(form);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        excerpt: form.excerpt,
        content: form.content,
        linkedin_url: form.linkedin_url.trim() || null,
        author: form.author.trim(),
        category: form.category.trim(),
        published_at: new Date(form.published_at).toISOString(),
        featured: form.featured,
        published: form.published,
        image_url: form.primaryImage[0],
        image_alt: form.image_alt,
      };
      const extras = {
        content: form.content,
        linkedin_url: form.linkedin_url.trim() || undefined,
        secondaryImages: form.secondaryImages.map((src) => toImage(src, form.title)),
      };
      if (editingId) {
        await updateBlog(editingId, payload);
        setBlogExtras(editingId, extras);
      } else {
        const created = await createBlog(payload);
        setBlogExtras(created.id, extras);
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      if (err instanceof AuthError) {
        navigate('/admin/login', { replace: true });
        return;
      }
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(blog: Blog) {
    if (!window.confirm(`Delete "${blog.title}"?`)) return;
    try {
      await deleteBlog(blog.id);
      clearBlogExtras(blog.id);
      await load();
    } catch (err) {
      if (err instanceof AuthError) {
        navigate('/admin/login', { replace: true });
        return;
      }
      setError(err instanceof Error ? err.message : 'Delete failed.');
    }
  }

  function set<K extends keyof BlogForm>(key: K, value: BlogForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <div className={styles.card}>
      <div className={styles.toolbar}>
        <div>
          <h2 className={styles.title}>Blogs</h2>
          <p className={styles.subtitle}>Create, edit, and delete blog posts.</p>
        </div>
        <button type="button" className={styles.button} onClick={openNew}>
          New Blog
        </button>
      </div>

      {error && <p role="alert" className={styles.error}>{error}</p>}
      {status && <p role="status" className={styles.status}>{status}</p>}

      {formOpen && (
        <form className={styles.form} onSubmit={onSave} aria-label="Blog form">
          <div className={styles.field}>
            <label htmlFor="blog-title">Title *</label>
            <input id="blog-title" value={form.title} onChange={(e) => set('title', e.target.value)} required />
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="blog-author">Author *</label>
              <input id="blog-author" value={form.author} onChange={(e) => set('author', e.target.value)} required />
            </div>
            <div className={styles.field}>
              <label htmlFor="blog-category">Category *</label>
              <input id="blog-category" value={form.category} onChange={(e) => set('category', e.target.value)} required />
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="blog-excerpt">Preview Content (optional)</label>
            <textarea id="blog-excerpt" value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} rows={3} placeholder="Shown on the card. Leave empty to auto-preview from Blog Content." />
          </div>
          <div className={styles.field}>
            <label htmlFor="blog-date">Publish Date *</label>
            <input id="blog-date" type="datetime-local" value={form.published_at} onChange={(e) => set('published_at', e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label htmlFor="blog-content">Full content</label>
            <textarea id="blog-content" name="content" value={form.content} onChange={(e) => set('content', e.target.value)} rows={12} required />
            <small className={styles.status}>Separate paragraphs with a blank line.</small>
          </div>
          <div className={styles.field}>
            <label htmlFor="blog-linkedin">LinkedIn post URL</label>
            <input id="blog-linkedin" name="linkedin_url" type="url" value={form.linkedin_url} onChange={(e) => set('linkedin_url', e.target.value)} placeholder="https://www.linkedin.com/posts/…" />
            <small className={styles.status}>Optional. Shown as &lsquo;View on LinkedIn&rsquo;.</small>
          </div>
          <DropzoneField id="blog-primary" label="Primary Image *" value={form.primaryImage} onChange={(v) => set('primaryImage', v)} hint="One image — shown on the card and at the top of the article." />
          <div className={styles.field}>
            <label htmlFor="blog-slug">Slug (optional)</label>
            <input id="blog-slug" value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="auto from title" />
          </div>
          <div className={styles.field}>
            <label htmlFor="blog-alt">Image Alt (optional)</label>
            <input id="blog-alt" value={form.image_alt} onChange={(e) => set('image_alt', e.target.value)} />
          </div>
          <DropzoneField id="blog-secondary" label="Secondary Images (optional)" multiple value={form.secondaryImages} onChange={(v) => set('secondaryImages', v)} hint="Shown in the article gallery." />
          <div className={styles.row}>
            <label className={styles.check} htmlFor="blog-featured">
              <input id="blog-featured" type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
              Featured
            </label>
            <label className={styles.check} htmlFor="blog-published">
              <input id="blog-published" type="checkbox" checked={form.published} onChange={(e) => set('published', e.target.checked)} />
              Published
            </label>
          </div>
          <div className={styles.actions}>
            <button type="submit" className={styles.button} disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create blog'}
            </button>
            <button type="button" className={styles.buttonSecondary} onClick={() => setFormOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Date</th>
              <th scope="col">Category</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {blogs.map((b) => (
              <tr key={b.id}>
                <td>{b.title}</td>
                <td>{new Date(b.publishedAt).toLocaleDateString()}</td>
                <td>{b.category}</td>
                <td>
                  <div className={styles.actions}>
                    <button type="button" className={styles.buttonSecondary} onClick={() => openEdit(b)}>Edit</button>
                    <button type="button" className={styles.buttonSecondary} onClick={() => void onDelete(b)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {blogs.length === 0 && !status && (
              <tr><td colSpan={4}>No blogs yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
