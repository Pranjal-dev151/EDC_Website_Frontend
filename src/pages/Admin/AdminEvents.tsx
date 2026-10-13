import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Event } from '../../types';
import {
  AuthError,
  clearEventExtras,
  createEvent,
  deleteEvent,
  getEventExtras,
  listEvents,
  setEventExtras,
  updateEvent,
} from '../../services/adminApi';
import styles from './Admin.module.css';

interface EventForm {
  title: string;
  starts_at: string;
  location: string;
  summary: string;
  image_url: string;
  registration_link: string;
  featured: boolean;
  status: string;
  published: boolean;
}

const EMPTY: EventForm = {
  title: '',
  starts_at: '',
  location: '',
  summary: '',
  image_url: '',
  registration_link: '',
  featured: false,
  status: 'Upcoming',
  published: true,
};

function displayStatus(ev: Event): string {
  const extras = getEventExtras(ev.id);
  if (extras.status) return extras.status;
  if (new Date(ev.startsAt).getTime() < Date.now()) return 'Past';
  return 'Upcoming';
}

export default function AdminEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [status, setStatus] = useState('Loading…');
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventForm>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setStatus('Loading…');
    setError(null);
    try {
      setEvents(await listEvents());
      setStatus('');
    } catch (err) {
      if (err instanceof AuthError) {
        navigate('/admin/login', { replace: true });
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to load events.');
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

  function openEdit(ev: Event) {
    const extras = getEventExtras(ev.id);
    setEditingId(ev.id);
    setForm({
      title: ev.title,
      starts_at: ev.startsAt ? ev.startsAt.slice(0, 16) : '',
      location: ev.location,
      summary: ev.summary,
      image_url: ev.image.src,
      registration_link: extras.registrationLink ?? '',
      featured: extras.featured ?? false,
      status: extras.status ?? displayStatus(ev),
      published: true,
    });
    setFormOpen(true);
  }

  function validate(f: EventForm): string | null {
    if (!f.title.trim()) return 'Title is required.';
    if (!f.starts_at) return 'Date/time is required.';
    if (!f.location.trim()) return 'Location is required.';
    if (!f.summary.trim()) return 'Short description is required.';
    if (!f.image_url.trim()) return 'Image URL is required.';
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
        summary: form.summary,
        location: form.location.trim(),
        starts_at: new Date(form.starts_at).toISOString(),
        published: form.published,
        image_url: form.image_url.trim(),
        image_alt: form.title.trim(),
      };
      const extras = {
        registrationLink: form.registration_link.trim(),
        featured: form.featured,
        status: form.status,
      };
      if (editingId) {
        await updateEvent(editingId, payload);
        setEventExtras(editingId, extras);
      } else {
        const created = await createEvent(payload);
        setEventExtras(created.id, extras);
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

  async function onDelete(ev: Event) {
    if (!window.confirm(`Delete "${ev.title}"?`)) return;
    try {
      await deleteEvent(ev.id);
      clearEventExtras(ev.id);
      await load();
    } catch (err) {
      if (err instanceof AuthError) {
        navigate('/admin/login', { replace: true });
        return;
      }
      setError(err instanceof Error ? err.message : 'Delete failed.');
    }
  }

  function set<K extends keyof EventForm>(key: K, value: EventForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <div className={styles.card}>
      <div className={styles.toolbar}>
        <div>
          <h2 className={styles.title}>Events</h2>
          <p className={styles.subtitle}>Create, edit, and delete events.</p>
        </div>
        <button type="button" className={styles.button} onClick={openNew}>
          New Event
        </button>
      </div>

      {error && <p role="alert" className={styles.error}>{error}</p>}
      {status && <p role="status" className={styles.status}>{status}</p>}

      {formOpen && (
        <form className={styles.form} onSubmit={onSave} aria-label="Event form">
          <div className={styles.field}>
            <label htmlFor="event-title">Title *</label>
            <input id="event-title" value={form.title} onChange={(e) => set('title', e.target.value)} required />
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="event-starts">Date/Time *</label>
              <input id="event-starts" type="datetime-local" value={form.starts_at} onChange={(e) => set('starts_at', e.target.value)} required />
            </div>
            <div className={styles.field}>
              <label htmlFor="event-location">Location *</label>
              <input id="event-location" value={form.location} onChange={(e) => set('location', e.target.value)} required />
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="event-summary">Short Description *</label>
            <textarea id="event-summary" value={form.summary} onChange={(e) => set('summary', e.target.value)} rows={3} required />
          </div>
          <div className={styles.field}>
            <label htmlFor="event-image-url">Image URL *</label>
            <input id="event-image-url" value={form.image_url} onChange={(e) => set('image_url', e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label htmlFor="event-reg">Registration Link (optional)</label>
            <input id="event-reg" type="url" value={form.registration_link} onChange={(e) => set('registration_link', e.target.value)} placeholder="https://…" />
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="event-status">Status (optional)</label>
              <select id="event-status" value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Past">Past</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <label className={styles.check} htmlFor="event-featured">
              <input id="event-featured" type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
              Featured
            </label>
          </div>
          <div className={styles.actions}>
            <button type="submit" className={styles.button} disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create event'}
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
              <th scope="col">Location</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev.id}>
                <td>{ev.title}</td>
                <td>{new Date(ev.startsAt).toLocaleDateString()}</td>
                <td>{ev.location}</td>
                <td>{displayStatus(ev)}</td>
                <td>
                  <div className={styles.actions}>
                    <button type="button" className={styles.buttonSecondary} onClick={() => openEdit(ev)}>Edit</button>
                    <button type="button" className={styles.buttonSecondary} onClick={() => void onDelete(ev)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {events.length === 0 && !status && (
              <tr><td colSpan={5}>No events yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
