import { aboutContent } from '../data/aboutContent';
import { blogs } from '../data/blogs';
import { contacts } from '../data/contacts';
import { events } from '../data/events';
import { footerData } from '../data/footerData';
import { gallery } from '../data/gallery';
import { initiatives } from '../data/initiatives';
import { headerContent, siteSettings } from '../data/siteSettings';
import { socials } from '../data/socials';
import { team } from '../data/team';
import { getBlogExtras } from './adminApi';
import type {
  AboutContent,
  Blog,
  ContactPerson,
  Event,
  FooterData,
  GalleryItem,
  HeaderContent,
  Initiative,
  SiteSettings,
  SocialLink,
  TeamMember,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

async function fetchJson<T>(path: string, signal: AbortSignal, fallback: T): Promise<T> {
  if (!API_URL) return fallback;
  try {
    const res = await fetch(`${API_URL.replace(/\/$/, '')}${path}`, { signal });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    const data = (await res.json()) as T;
    return data;
  } catch (err) {
    if (signal.aborted) throw err;
    // Fallback to local mock data if remote unavailable.
    return fallback;
  }
}

export async function getHeaderContent(signal?: AbortSignal): Promise<HeaderContent> {
  const s = signal ?? new AbortController().signal;
  return fetchJson('/header', s, headerContent);
}

export async function getSiteSettings(signal?: AbortSignal): Promise<SiteSettings> {
  const s = signal ?? new AbortController().signal;
  return fetchJson('/settings', s, siteSettings);
}

export async function getAboutContent(signal?: AbortSignal): Promise<AboutContent> {
  const s = signal ?? new AbortController().signal;
  return fetchJson('/about', s, aboutContent);
}

export async function getInitiatives(signal?: AbortSignal): Promise<Initiative[]> {
  const s = signal ?? new AbortController().signal;
  return fetchJson('/initiatives', s, initiatives);
}

export async function getEvents(signal?: AbortSignal): Promise<Event[]> {
  if (!API_URL) return events;
  const s = signal ?? new AbortController().signal;
  try {
    const res = await fetch(`${API_URL.replace(/\/$/, '')}/api/events`, { signal: s });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return (await res.json()) as Event[];
  } catch (err) {
    if (s.aborted) throw err;
    return events;
  }
}

function withBlogExtras(list: Blog[]): Blog[] {
  // Admin-saved full content + gallery live in local extras (backend BlogOut
  // has no content field yet) — merge them so cards/modals can render them.
  return list.map((b) => {
    const extras = getBlogExtras(b.id);
    return {
      ...b,
      excerpt: b.excerpt ?? '',
      content: extras.content ?? b.content,
      linkedin_url: extras.linkedin_url ?? b.linkedin_url,
      secondaryImages: extras.secondaryImages ?? b.secondaryImages,
    };
  });
}

export async function getBlogs(signal?: AbortSignal): Promise<Blog[]> {
  if (!API_URL) return withBlogExtras(blogs);
  const s = signal ?? new AbortController().signal;
  try {
    const res = await fetch(`${API_URL.replace(/\/$/, '')}/api/blogs`, { signal: s });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return withBlogExtras((await res.json()) as Blog[]);
  } catch (err) {
    if (s.aborted) throw err;
    return withBlogExtras(blogs);
  }
}

export async function getGallery(signal?: AbortSignal): Promise<GalleryItem[]> {
  const s = signal ?? new AbortController().signal;
  return fetchJson('/gallery', s, gallery);
}

export async function getTeam(signal?: AbortSignal): Promise<TeamMember[]> {
  const s = signal ?? new AbortController().signal;
  return fetchJson('/team', s, team);
}

export async function getContacts(signal?: AbortSignal): Promise<ContactPerson[]> {
  const s = signal ?? new AbortController().signal;
  return fetchJson('/contacts', s, contacts);
}

export async function getSocials(signal?: AbortSignal): Promise<SocialLink[]> {
  const s = signal ?? new AbortController().signal;
  return fetchJson('/socials', s, socials);
}

export async function getFooterData(signal?: AbortSignal): Promise<FooterData> {
  const s = signal ?? new AbortController().signal;
  return fetchJson('/footer', s, footerData);
}

// Public header content uses the local source during the scaffold phases.
// Remote content transport is introduced with the content sections, not auth forms.
export async function getHeaderContentLegacy(): Promise<HeaderContent> {
  return headerContent;
}

export async function getBlogBySlug(slug: string, signal?: AbortSignal): Promise<Blog> {
  const s = signal ?? new AbortController().signal;
  if (!API_URL) {
    const match = withBlogExtras(blogs).find((b) => b.slug === slug);
    if (!match) throw new Error('Blog not found');
    return match;
  }
  const res = await fetch(`${API_URL.replace(/\/$/, '')}/api/blogs/${slug}`, { signal: s });
  if (!res.ok) throw new Error(res.status === 404 ? 'Blog not found' : 'Failed to load blog');
  const blog = (await res.json()) as Blog;
  const extras = getBlogExtras(blog.id);
  return {
    ...blog,
    content: extras.content ?? blog.content,
    linkedin_url: extras.linkedin_url ?? blog.linkedin_url,
    secondaryImages: extras.secondaryImages ?? blog.secondaryImages,
  };
}
