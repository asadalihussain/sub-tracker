'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface Vote {
  id: string;
  person_id: string;
  person_name: string;
  photo_url: string | null;
  yes_count: number;
  no_count: number;
  status: 'pending' | 'approved' | 'rejected';
}

function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');
}

export default function VotePage({ params }: { params: { id: string } }) {
  const [vote, setVote]       = useState<Vote | null>(null);
  const [loading, setLoading] = useState(true);
  const [casting, setCasting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const storageKey = `voted-${params.id}`;

  useEffect(() => {
    setHasVoted(!!localStorage.getItem(storageKey));
    fetch(`/api/votes/${params.id}`)
      .then(r => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then(data => { if (data) setVote(data); })
      .finally(() => setLoading(false));
  }, [params.id, storageKey]);

  async function cast(v: 'yes' | 'no') {
    if (hasVoted || casting || vote?.status !== 'pending') return;
    setCasting(true);
    const res = await fetch(`/api/votes/${params.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vote: v }),
    });
    const data = await res.json();
    if (res.ok) {
      setVote(data);
      localStorage.setItem(storageKey, '1');
      setHasVoted(true);
    }
    setCasting(false);
  }

  const net = vote ? vote.yes_count - vote.no_count : 0;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#39b5ff',
      backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)',
      backgroundSize: '18px 18px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'Oswald', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=Inter:wght@400;600&display=swap" rel="stylesheet" />

      {/* Logo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/crave-logo.png" alt="Crave Subs" style={{ height: '70px', objectFit: 'contain', marginBottom: '24px', filter: 'drop-shadow(2px 2px 0 rgba(0,0,0,0.2))' }} />

      <div style={{
        background: '#fff',
        border: '3px solid #111',
        borderRadius: '10px',
        boxShadow: '8px 8px 0 #111',
        padding: '36px 32px',
        maxWidth: '420px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        textAlign: 'center',
      }}>
        {loading && (
          <p style={{ color: '#888', fontFamily: 'Inter', fontSize: '1rem' }}>Loading…</p>
        )}

        {notFound && (
          <>
            <div style={{ fontSize: '3rem' }}>❌</div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Vote not found</h2>
          </>
        )}

        {vote && (
          <>
            {/* Person photo */}
            <div style={{
              width: '110px', height: '110px',
              borderRadius: '50%',
              border: '3px solid #111',
              boxShadow: '4px 4px 0 #111',
              overflow: 'hidden',
              background: '#39b5ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {vote.photo_url
                ? <Image src={vote.photo_url} alt={vote.person_name} width={110} height={110} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                : <span style={{ fontFamily: 'Oswald', fontSize: '2.5rem', fontWeight: 700, color: '#fff' }}>{initials(vote.person_name)}</span>
              }
            </div>

            {/* Question */}
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: '#888', fontFamily: 'Inter', marginBottom: '6px' }}>
                should
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#111', lineHeight: 1 }}>
                {vote.person_name}
              </h2>
              <div style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: '#111', marginTop: '6px', fontFamily: 'Inter' }}>
                owe a Crave Sub?
              </div>
            </div>

            {/* Vote bar */}
            <div style={{
              background: '#f5f5f5',
              border: '3px solid #111',
              borderRadius: '8px',
              padding: '14px 20px',
              width: '100%',
              boxShadow: '3px 3px 0 #111',
            }}>
              <div style={{ fontSize: '0.7rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#888', fontFamily: 'Inter', marginBottom: '8px' }}>
                Votes needed: 3
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {[-3,-2,-1,0,1,2,3].map(n => (
                  <div key={n} style={{
                    width: n === 0 ? '3px' : '28px',
                    height: n === 0 ? '36px' : '28px',
                    borderRadius: n === 0 ? '2px' : '4px',
                    background: n === 0 ? '#111' :
                      net >= n && n > 0 ? '#f3da03' :
                      net <= n && n < 0 ? '#ec1922' :
                      '#ddd',
                    border: n === 0 ? 'none' : '2px solid #111',
                    transition: 'background 0.2s',
                  }} />
                ))}
              </div>
              <div style={{ marginTop: '10px', fontSize: '1.2rem', fontWeight: 700, color: net > 0 ? '#c8a800' : net < 0 ? '#ec1922' : '#666' }}>
                {net > 0 ? `+${net}` : net} / 3
              </div>
            </div>

            {/* Status / Buttons */}
            {vote.status === 'approved' && (
              <div style={{
                background: '#f3da03', border: '3px solid #111', borderRadius: '8px',
                padding: '14px 24px', boxShadow: '4px 4px 0 #111',
                fontSize: '1.2rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
              }}>
                🥖 Sub confirmed! +1 owed
              </div>
            )}

            {vote.status === 'rejected' && (
              <div style={{
                background: '#ec1922', color: '#fff', border: '3px solid #111', borderRadius: '8px',
                padding: '14px 24px', boxShadow: '4px 4px 0 #111',
                fontSize: '1.2rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
              }}>
                ❌ Nah, they&apos;re good
              </div>
            )}

            {vote.status === 'pending' && (
              <>
                {hasVoted ? (
                  <p style={{ fontFamily: 'Inter', color: '#666', fontSize: '0.95rem' }}>
                    You&apos;ve already voted. Waiting on others…
                  </p>
                ) : (
                  <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
                    <button
                      onClick={() => cast('yes')}
                      disabled={casting}
                      style={{
                        flex: 1, background: '#f3da03', color: '#111',
                        border: '3px solid #111', borderRadius: '8px',
                        padding: '14px', fontSize: '1.8rem',
                        cursor: 'pointer', boxShadow: '4px 4px 0 #111',
                        transition: 'transform 0.1s, box-shadow 0.1s',
                        fontFamily: 'Oswald',
                      }}
                      onMouseEnter={e => { (e.currentTarget.style.transform = 'translate(-2px,-2px)'); (e.currentTarget.style.boxShadow = '6px 6px 0 #111'); }}
                      onMouseLeave={e => { (e.currentTarget.style.transform = ''); (e.currentTarget.style.boxShadow = '4px 4px 0 #111'); }}
                    >
                      👍
                      <div style={{ fontSize: '0.75rem', marginTop: '4px', letterSpacing: '1px', textTransform: 'uppercase' }}>Yeah</div>
                    </button>
                    <button
                      onClick={() => cast('no')}
                      disabled={casting}
                      style={{
                        flex: 1, background: '#ec1922', color: '#fff',
                        border: '3px solid #111', borderRadius: '8px',
                        padding: '14px', fontSize: '1.8rem',
                        cursor: 'pointer', boxShadow: '4px 4px 0 #111',
                        transition: 'transform 0.1s, box-shadow 0.1s',
                        fontFamily: 'Oswald',
                      }}
                      onMouseEnter={e => { (e.currentTarget.style.transform = 'translate(-2px,-2px)'); (e.currentTarget.style.boxShadow = '6px 6px 0 #111'); }}
                      onMouseLeave={e => { (e.currentTarget.style.transform = ''); (e.currentTarget.style.boxShadow = '4px 4px 0 #111'); }}
                    >
                      👎
                      <div style={{ fontSize: '0.75rem', marginTop: '4px', letterSpacing: '1px', textTransform: 'uppercase' }}>Nah</div>
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <p style={{ marginTop: '20px', color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem', fontFamily: 'Inter', letterSpacing: '1px', textTransform: 'uppercase' }}>
        Crave Debt Tracker
      </p>
    </div>
  );
}
