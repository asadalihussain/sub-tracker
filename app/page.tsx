'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';

function checkAnswer(raw: string): boolean {
  const s = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  const accepted = [
    'third', '3rd',
    'third street', '3rd street',
    'third st', '3rd st',
    'thirdstreet', '3rdstreet',
    'third st.', '3rd st.',
  ];
  return accepted.includes(s);
}

function Gate({ onPass }: { onPass: () => void }) {
  const [answer, setAnswer] = useState('');
  const [shake, setShake]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function submit() {
    if (checkAnswer(answer)) {
      onPass();
    } else {
      setShake(true);
      setAnswer('');
      setTimeout(() => setShake(false), 600);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  return (
    <div className="gate-overlay">
      <div className={`gate-card${shake ? ' gate-shake' : ''}`}>
        <div className="gate-emoji">🥖</div>
        <h2 className="gate-title">Members Only</h2>
        <p className="gate-question">What&apos;s your favorite street?</p>
        <input
          ref={inputRef}
          className="gate-input"
          type="text"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Type your answer..."
          maxLength={40}
          autoComplete="off"
        />
        <button className="gate-btn" onClick={submit}>Enter</button>
      </div>
    </div>
  );
}

interface Person {
  id: string;
  name: string;
  photo_url: string | null;
  count: number;
  created_at: string;
}

interface PendingVote {
  id: string;
  person_id: string;
  yes_count: number;
  no_count: number;
}

function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');
}

export default function Home() {
  const [unlocked, setUnlocked]     = useState<boolean | null>(null);
  const [people, setPeople]         = useState<Person[]>([]);
  const [pendingVotes, setPendingVotes] = useState<PendingVote[]>([]);
  const [loading, setLoading]       = useState(true);
  const [modalOpen, setModalOpen]   = useState(false);
  const [shareVote, setShareVote]   = useState<{ id: string; name: string } | null>(null);
  const [copied, setCopied]         = useState(false);
  const [name, setName]             = useState('');
  const [nameError, setNameError]   = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [busyIds, setBusyIds]       = useState<Set<string>>(new Set());
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());
  const toastTimer    = useRef<ReturnType<typeof setTimeout>>();
  const nameInputRef  = useRef<HTMLInputElement>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const photoTargetId = useRef<string | null>(null);

  // ── GATE ──
  useEffect(() => {
    setUnlocked(localStorage.getItem('crave-access') === '1');
  }, []);

  function handlePass() {
    localStorage.setItem('crave-access', '1');
    setUnlocked(true);
  }

  // ── FETCH ──
  const fetchAll = useCallback(async () => {
    const [peopleRes, votesRes] = await Promise.all([
      fetch('/api/people'),
      fetch('/api/votes'),
    ]);
    if (peopleRes.ok) setPeople(await peopleRes.json());
    if (votesRes.ok)  setPendingVotes(await votesRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 4000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const total = people.reduce((s, p) => s + p.count, 0);

  function pendingFor(personId: string) {
    return pendingVotes.filter(v => v.person_id === personId);
  }

  // ── TOAST ──
  function showToast(msg: string) {
    setToast(msg);
    setToastVisible(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2800);
  }

  // ── CREATE VOTE ──
  async function createVote(person: Person) {
    // If pending vote already exists, just show its share link
    const existing = pendingVotes.find(v => v.person_id === person.id);
    if (existing) {
      setShareVote({ id: existing.id, name: person.name });
      setCopied(false);
      return;
    }

    if (busyIds.has(person.id)) return;
    setBusyIds(prev => new Set(prev).add(person.id));
    const res = await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personId: person.id }),
    });
    if (res.ok) {
      const vote = await res.json();
      setShareVote({ id: vote.id, name: person.name });
      setCopied(false);
      fetchAll();
    }
    setBusyIds(prev => { const s = new Set(prev); s.delete(person.id); return s; });
  }

  // ── RESET ──
  async function resetAll() {
    if (!confirm('Reset ALL sub counts to 0? This cannot be undone.')) return;
    await fetch('/api/reset', { method: 'POST' });
    fetchAll();
    showToast('All counts reset to 0 🔄');
  }

  // ── PHOTO UPDATE ──
  function triggerPhotoUpload(personId: string) {
    photoTargetId.current = personId;
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
      photoInputRef.current.click();
    }
  }

  async function onPhotoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const id = photoTargetId.current;
    if (!file || !id) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const dataUrl = ev.target?.result as string;
      setUploadingIds(prev => new Set(prev).add(id));
      const res = await fetch(`/api/people/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoDataUrl: dataUrl }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPeople(prev => prev.map(p => p.id === id ? { ...p, photo_url: updated.photo_url } : p));
        showToast('Photo updated! 📸');
      }
      setUploadingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    };
    reader.readAsDataURL(file);
  }

  // ── ADD PERSON MODAL ──
  function openModal() {
    setName(''); setNameError(false); setPhotoDataUrl(null);
    setModalOpen(true);
    setTimeout(() => nameInputRef.current?.focus(), 60);
  }

  function closeModal() { if (saving) return; setModalOpen(false); }

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
      if (e.key === 'Escape') { closeModal(); setShareVote(null); }
      if (e.key === 'Enter' && modalOpen) savePerson();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function copyShareLink() {
    if (!shareVote) return;
    const url = `${window.location.origin}/vote/${shareVote.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (unlocked === null) return null;
  if (!unlocked) return <Gate onPass={handlePass} />;

  return (
    <>
      <header>
        <div className="header-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/crave-logo.png" alt="Crave Subs" className="logo-mark" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
          <div className="brand-text">
            <h1>Crave Debt Tracker</h1>
          </div>
        </div>
        <div className="total-pill">
          🥪 Total owed: <span className="total-num">{total}</span>
        </div>
      </header>

      <div className="hero-strip">
        <em>Rules:</em> post AI slop or fake news = owe third a sub
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
          people.map(person => {
            const pending = pendingFor(person.id);
            return (
              <div className="card" key={person.id}>
                <div
                  className="card-photo-wrap card-photo-clickable"
                  onClick={() => triggerPhotoUpload(person.id)}
                  title="Click to update photo"
                >
                  {uploadingIds.has(person.id)
                    ? <div className="photo-uploading"><div className="spinner" /></div>
                    : person.photo_url
                      ? <Image src={person.photo_url} alt={person.name} width={400} height={400} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                      : <div className="card-initials">{initials(person.name)}</div>
                  }
                  <div className="photo-overlay">📷</div>
                </div>
                <div className="card-body">
                  <div className="card-name">{person.name}</div>
                  <div className="card-debt-label">Subs owed</div>
                  <div className="card-count-row">
                    <div className="count-num">{person.count}</div>
                    <button
                      className="btn-plus"
                      onClick={() => createVote(person)}
                      disabled={busyIds.has(person.id)}
                      title="Start a vote to add a sub"
                    >＋</button>
                  </div>
                  {pending.length > 0 && (
                    <div className="pending-badge">
                      🗳️ {pending.length} vote{pending.length > 1 ? 's' : ''} pending
                      {pending.map(v => {
                        const net = v.yes_count - v.no_count;
                        return (
                          <span key={v.id} className="pending-net" title="Current net votes">
                            {net >= 0 ? '+' : ''}{net}/3
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Share modal */}
      {shareVote && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setShareVote(null); }}>
          <div className="modal">
            <div className="modal-header">
              <span style={{ fontSize: '1.6rem' }}>🗳️</span>
              <h2>Vote created!</h2>
            </div>
            <p style={{ fontFamily: 'Inter', fontSize: '0.95rem', color: '#444', lineHeight: 1.5 }}>
              Share this link in the group chat. 3 thumbs up = sub confirmed. 3 thumbs down = no sub.
            </p>
            <div className="share-link-box">
              {typeof window !== 'undefined' ? `${window.location.origin}/vote/${shareVote.id}` : ''}
            </div>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={copyShareLink}>
              {copied ? '✓ Copied!' : '📋 Copy Link'}
            </button>
            <button className="btn-cancel" style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }} onClick={() => setShareVote(null)}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* Add person modal */}
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
              {photoDataUrl ? <img src={photoDataUrl} alt="Preview" className="photo-preview-img visible" /> : null}
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

      <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPhotoFileChange} />
    </>
  );
}
