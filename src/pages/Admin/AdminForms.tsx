import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Event, GoogleForm } from '../../types';
import {
  AuthError,
  SUGGESTED_FORM_QUESTIONS,
  createForm,
  deleteForm,
  listEvents,
  listForms,
  updateForm,
} from '../../services/adminApi';
import styles from './Admin.module.css';

interface FormState {
  name: string;
  url: string;
  eventId: string;
  description: string;
  active: boolean;
}

const EMPTY: FormState = { name: '', url: '', eventId: '', description: '', active: true };

export default function AdminForms() {
  const navigate = useNavigate();
  const [forms, setForms] = useState<GoogleForm[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setForms(listForms());
      setEvents(await listEvents());
    } catch (err) {
      if (err instanceof AuthError) {
        navigate('/admin/login', { replace: true });
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to load.');
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

  function openEdit(f: GoogleForm) {
    setEditingId(f.id);
    setForm({ name: f.name, url: f.url, eventId: f.eventId, description: f.description ?? '', active: f.active });
    setFormOpen(true);
  }

  function validate(f: FormState): string | null {
    if (!f.name.trim()) return 'Form name is required.';
    if (!f.url.trim()) return 'Google Form URL is required.';
    try {
      const u = new URL(f.url.trim());
      if (!/^https?:$/.test(u.protocol)) return 'Google Form URL must start with http(s).';
    } catch {
      return 'Google Form URL is not a valid URL.';
    }
    if (!f.eventId) return 'Please choose an event.';
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
      const eventTitle = events.find((ev) => ev.id === form.eventId)?.title ?? '';
      const payload = {
        name: form.name.trim(),
        url: form.url.trim(),
        eventId: form.eventId,
        eventTitle,
        description: form.description.trim(),
        active: form.active,
      };
      if (editingId) updateForm(editingId, payload);
      else createForm(payload);
      setFormOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  function onDelete(f: GoogleForm) {
    if (!window.confirm(`Delete "${f.name}"?`)) return;
    deleteForm(f.id);
    void load();
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <div className={styles.card}>
      <div className={styles.toolbar}>
        <div>
          <h2 className={styles.title}>Google Forms</h2>
          <p className={styles.subtitle}>Attach registration forms to events.</p>
        </div>
        <button type="button" className={styles.button} onClick={openNew}>
          New Form
        </button>
      </div>

      {error && <p role="alert" className={styles.error}>{error}</p>}

      {formOpen && (
        <form className={styles.form} onSubmit={onSave} aria-label="Google form editor">
          <div className={styles.field}>
            <label htmlFor="gform-name">Form Name *</label>
            <input id="gform-name" value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label htmlFor="gform-url">Google Form URL *</label>
            <input id="gform-url" type="url" value={form.url} onChange={(e) => set('url', e.target.value)} placeholder="https://docs.google.com/forms/…" required />
          </div>
          <div className={styles.field}>
            <label htmlFor="gform-event">Event *</label>
            <select id="gform-event" value={form.eventId} onChange={(e) => set('eventId', e.target.value)} required>
              <option value="">Choose an event…</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="gform-desc">Description (optional)</label>
            <textarea id="gform-desc" value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} />
          </div>
          <label className={styles.check} htmlFor="gform-active">
            <input id="gform-active" type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
            Active
          </label>
          <div className={styles.questions} aria-label="Suggested questions">
            <p className={styles.questionsTitle}>Suggested questions for the linked Google Form:</p>
            <ul>
              {SUGGESTED_FORM_QUESTIONS.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </div>
          <div className={styles.actions}>
            <button type="submit" className={styles.button} disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create form'}
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
              <th scope="col">Form Name</th>
              <th scope="col">Event</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {forms.map((f) => (
              <tr key={f.id}>
                <td>{f.name}</td>
                <td>{f.eventTitle}</td>
                <td>{f.active ? 'Active' : 'Inactive'}</td>
                <td>
                  <div className={styles.actions}>
                    <button type="button" className={styles.buttonSecondary} onClick={() => openEdit(f)}>Edit</button>
                    <button type="button" className={styles.buttonSecondary} onClick={() => onDelete(f)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {forms.length === 0 && (
              <tr><td colSpan={4}>No forms yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
