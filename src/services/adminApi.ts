import type { Blog, Event } from '../types';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000';
const TOKEN_KEY = 'edc_admin_token';

export class AuthError extends Error {
  constructor(message = 'Not authenticated') {
    super(message);
    this.name = 'AuthError';
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const res = await fetch(`${API_URL.replace(/\/$/, '')}${path}`, { ...init, headers });
  if (res.status === 401) {
    clearToken();
    throw new AuthError('Session expired. Please log in again.');
  }
  return res;
}

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `Request failed: ${res.status}`;
    try {
      const body = (await res.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      /* keep default */
    }
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export interface AdminMe {
  id: number;
  email: string;
  name: string;
}

export async function loginAdmin(email: string, password: string): Promise<{ access_token: string }> {
  const res = await fetch(`${API_URL.replace(/\/$/, '')}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await readJson<{ access_token: string }>(res);
  setToken(data.access_token);
  return data;
}

export async function getMe(): Promise<AdminMe> {
  const res = await authFetch('/api/admin/me');
  return readJson<AdminMe>(res);
}

export async function listBlogs(): Promise<Blog[]> {
  const res = await authFetch('/api/admin/blogs');
  return readJson<Blog[]>(res);
}

export async function createBlog(payload: Record<string, unknown>): Promise<Blog> {
  const res = await authFetch('/api/admin/blogs', { method: 'POST', body: JSON.stringify(payload) });
  return readJson<Blog>(res);
}

export async function updateBlog(id: string, payload: Record<string, unknown>): Promise<Blog> {
  const numericId = id.replace(/^blog-/, '');
  const res = await authFetch(`/api/admin/blogs/${numericId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return readJson<Blog>(res);
}

export async function deleteBlog(id: string): Promise<void> {
  const numericId = id.replace(/^blog-/, '');
  const res = await authFetch(`/api/admin/blogs/${numericId}`, { method: 'DELETE' });
  await readJson<void>(res);
}

export async function listEvents(): Promise<Event[]> {
  const res = await authFetch('/api/admin/events');
  return readJson<Event[]>(res);
}

export async function createEvent(payload: Record<string, unknown>): Promise<Event> {
  const res = await authFetch('/api/admin/events', { method: 'POST', body: JSON.stringify(payload) });
  return readJson<Event>(res);
}

export async function updateEvent(id: string, payload: Record<string, unknown>): Promise<Event> {
  const numericId = id.replace(/^event-/, '');
  const res = await authFetch(`/api/admin/events/${numericId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return readJson<Event>(res);
}

export async function deleteEvent(id: string): Promise<void> {
  const numericId = id.replace(/^event-/, '');
  const res = await authFetch(`/api/admin/events/${numericId}`, { method: 'DELETE' });
  await readJson<void>(res);
}

// --- Client-side extras: fields the backend schema ignores (blog content,
// secondary images, event registration links) persist in localStorage. ---
import type { ContentImage, GoogleForm } from '../types';

const BLOG_EXTRAS_KEY = 'edc_blog_extras';
const EVENT_EXTRAS_KEY = 'edc_event_extras';
const FORMS_KEY = 'edc_admin_forms';

export interface BlogExtras {
  content?: string;
  linkedin_url?: string;
  secondaryImages?: ContentImage[];
}

export interface EventExtras {
  registrationLink?: string;
  featured?: boolean;
  status?: string;
}

function readStore<T>(key: string): Record<string, T> {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, T>;
  } catch {
    return {};
  }
}

function writeStore<T>(key: string, store: Record<string, T>): void {
  localStorage.setItem(key, JSON.stringify(store));
}

export function getBlogExtras(id: string): BlogExtras {
  return readStore<BlogExtras>(BLOG_EXTRAS_KEY)[id] ?? {};
}

export function setBlogExtras(id: string, extras: BlogExtras): void {
  const store = readStore<BlogExtras>(BLOG_EXTRAS_KEY);
  store[id] = extras;
  writeStore(BLOG_EXTRAS_KEY, store);
}

export function clearBlogExtras(id: string): void {
  const store = readStore<BlogExtras>(BLOG_EXTRAS_KEY);
  delete store[id];
  writeStore(BLOG_EXTRAS_KEY, store);
}

export function getEventExtras(id: string): EventExtras {
  return readStore<EventExtras>(EVENT_EXTRAS_KEY)[id] ?? {};
}

export function setEventExtras(id: string, extras: EventExtras): void {
  const store = readStore<EventExtras>(EVENT_EXTRAS_KEY);
  store[id] = extras;
  writeStore(EVENT_EXTRAS_KEY, store);
}

export function clearEventExtras(id: string): void {
  const store = readStore<EventExtras>(EVENT_EXTRAS_KEY);
  delete store[id];
  writeStore(EVENT_EXTRAS_KEY, store);
}

// --- Google Forms: local CRUD (no backend endpoint yet). ---
export function listForms(): GoogleForm[] {
  try {
    const raw = JSON.parse(localStorage.getItem(FORMS_KEY) ?? '[]') as GoogleForm[];
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function createForm(payload: Omit<GoogleForm, 'id' | 'createdAt'>): GoogleForm {
  const forms = listForms();
  const form: GoogleForm = {
    ...payload,
    id: `form-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(FORMS_KEY, JSON.stringify([form, ...forms]));
  return form;
}

export function updateForm(id: string, payload: Omit<GoogleForm, 'id' | 'createdAt'>): GoogleForm | null {
  const forms = listForms();
  const next = forms.map((f) => (f.id === id ? { ...f, ...payload } : f));
  localStorage.setItem(FORMS_KEY, JSON.stringify(next));
  return next.find((f) => f.id === id) ?? null;
}

export function deleteForm(id: string): void {
  localStorage.setItem(FORMS_KEY, JSON.stringify(listForms().filter((f) => f.id !== id)));
}

export const SUGGESTED_FORM_QUESTIONS = [
  'Name',
  'Email',
  'Phone',
  'College / Year',
  'Motivation',
  'Startup Idea',
  'Skills',
];
