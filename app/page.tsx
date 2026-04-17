'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';

interface Person {
  id: string;
  name: string;
  photo_url: string | null;
  count: number;
  created_at: string;
}

function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');
}

export default function Home() {
  const [people, setPeople]       = useState<Person[]>([]);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName]           = useState('');
  const [nameError, setNameError] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [busyIds, setBusyIds]     = useState<Set<string>>(new Set());
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── FETCH ──
  const fetchPeople = useCallback(async () => {
    const res = await fetch('/api/people');
    if (res.ok) setPeople(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPeople();
    const interval = setInterval(fetchPeople, 4000);
    return () => clearInterval(interval);
  }, [fetchPeople]);

  const total = people.reduce((s, p) => s + p.count, 0);

  // ── TOAST ──
  function showToast(msg: string) {
    setToast(msg);
    setToastVisible(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2400);
  }

  // ── ADJUST COUNT ──
  async function adjust(person: Person, delta: number) {
    if (busyIds.has(person.id)) return;
    setBusyIds(prev => new Set(prev).add(person.id));

    // Optimistic update
    setPeople(prev =>
      prev.map(p => p.id === person.id
        ? { ...p, count: Math.max(0, p.count + delta) }
        : p
      )
    );

    await fetch(`/api/people/${person.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta }),
    });

    if (delta > 0) showToast(`${person.name} owes another sub! 🥖`);

    setBusyIds(prev => { const s = new Set(prev); s.delete(person.id); return s; });
    // Sync to get authoritative value
    fetchPeople();
  }

  // ── DELETE ──
  async function deletePerson(person: Person) {
    if (!confirm(`Remove ${person.name} from the wall of shame?`)) return;
    setPeople(prev => prev.filter(p => p.id !== person.id));
    await fetch(`/api/people/${person.id}`, { method: 'DELETE' });
  }

  // ── MODAL ──
  function openModal() {
    setName('');
    setNameError(false);
    setPhotoDataUrl(null);
    setModalOpen(true);
    setTimeout(() => nameInputRef.current?.focus(), 60);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPhotoDataUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function savePerson() {
    if (!name.trim()) {
      setNameError(true);
      nameInputRef.current?.focus();
      setTimeout(() => setNameError(false), 800);
      return;
    }
    setSaving(true);
    const res = await fetch('/api/people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), photoDataUrl }),
    });
    if (res.ok) {
      const person: Person = await res.json();
      setPeople(prev => [...prev, person]);
      setModalOpen(false);
      showToast(`${person.name} added to the wall of shame 😈`);
    }
    setSaving(false);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'Enter' && modalOpen) savePerson();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <>
      <header>
        <div className="header-brand">
          <div className="logo-mark">🥖</div>
          <div className="brand-text">
            <h1>Sub Debt Tracker</h1>
            <p>Post AI slop? You owe the squad a Crave Sub.</p>
          </div>
        </div>
        <div className="total-pill">
          🥪 Total owed: <span className="total-num">{total}</span>
        </div>
      </header>

      <div className="hero-strip">
        <em>Rules:</em> post AI slop or fake news = owe the squad a sub from Crave Subs
      </div>

      <div className="toolbar">
        <div className="toolbar-label">Wall of Shame</div>
        <button className="btn-primary" onClick={openModal}>+ Add Person</button>
      </div>

      <div className="grid">
        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : people.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🥖</div>
            <h3>No one owes yet</h3>
            <p>Add someone to start tracking their sub debt.</p>
          </div>
        ) : (
          people.map(person => (
            <div className="card" key={person.id}>
              <button className="btn-delete" onClick={() => deletePerson(person)} title="Remove">✕</button>
              <div className="card-photo-wrap">
                {person.photo_url
                  ? <Image src={person.photo_url} alt={person.name} width={400} height={400} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                  : <div className="card-initials">{initials(person.name)}</div>
                }
              </div>
              <div className="card-body">
                <div className="card-name">{person.name}</div>
                <div className="card-debt-label">Subs owed to the squad</div>
                <div className="card-count-row">
                  <button
                    className="btn-minus"
                    onClick={() => adjust(person, -1)}
                    disabled={busyIds.has(person.id) || person.count === 0}
                  >−</button>
                  <div className="count-num">{person.count}</div>
                  <button
                    className="btn-plus"
                    onClick={() => adjust(person, +1)}
                    disabled={busyIds.has(person.id)}
                  >＋</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <div
        className={`modal-overlay${modalOpen ? ' open' : ''}`}
        onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
      >
        <div className="modal">
          <div className="modal-header">
            <span style={{ fontSize: '1.6rem' }}>🥪</span>
            <h2>Add to the wall</h2>
          </div>

          <div className="field">
            <label htmlFor="name-input">Name</label>
            <input
              id="name-input"
              type="text"
              ref={nameInputRef}
              value={name}
              onChange={e => setName(e.target.value)}
              className={nameError ? 'error' : ''}
              placeholder="e.g. Chad"
              maxLength={30}
            />
          </div>

          <div className="field">
            <label>Photo <span style={{ color: '#aaa', fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
            <div className="photo-upload-area" onClick={() => fileInputRef.current?.click()}>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />
              {photoDataUrl
                ? <img src={photoDataUrl} alt="Preview" className="photo-preview-img visible" />
                : null
              }
              <div style={{ display: photoDataUrl ? 'none' : 'block' }}>
                <div className="upload-icon">📷</div>
                <div className="upload-hint">Click to upload a photo</div>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button className="btn-cancel" onClick={closeModal}>Cancel</button>
            <button className="btn-primary" onClick={savePerson} disabled={saving}>
              {saving ? 'Saving…' : 'Add to Wall of Shame'}
            </button>
          </div>
        </div>
      </div>

      <div className={`toast${toastVisible ? ' show' : ''}`}>{toast}</div>
    </>
  );
}
