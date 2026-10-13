import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getToken } from '../../services/adminApi';
import AdminBlogs from './AdminBlogs';
import AdminEvents from './AdminEvents';
import AdminForms from './AdminForms';
import styles from './Admin.module.css';

type Tab = 'blogs' | 'events' | 'forms';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'blogs', label: '📝 Blogs' },
  { id: 'events', label: '📅 Events' },
  { id: 'forms', label: '📋 Google Forms' },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('blogs');
  if (!getToken()) return <Navigate to="/admin/login" replace />;

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Welcome, Admin</h1>
      <p className={styles.subtitle}>Edit the Website</p>
      <div className={styles.tabs} role="tablist" aria-label="Admin sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={styles.tab}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === 'blogs' && <AdminBlogs />}
        {tab === 'events' && <AdminEvents />}
        {tab === 'forms' && <AdminForms />}
      </div>
    </div>
  );
}
