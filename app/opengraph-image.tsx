import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';

export const runtime = 'nodejs';
export const alt = 'Crave Debt Tracker';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  const logoData = readFileSync(join(process.cwd(), 'public/crave-logo.png'));
  const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#39b5ff',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Dot halftone pattern */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }}
        >
          <defs>
            <pattern id="dots" x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="1.5" fill="#000" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* Yellow header bar */}
        <div style={{
          background: '#f3da03',
          borderBottom: '5px solid #111',
          padding: '0 60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '110px',
          flexShrink: 0,
          boxShadow: '0 4px 0 #111',
        }}>
          <img src={logoBase64} height={80} style={{ objectFit: 'contain' }} />
          <div style={{
            fontSize: '42px',
            fontWeight: 900,
            color: '#111',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            display: 'flex',
          }}>
            CRAVE DEBT TRACKER
          </div>
        </div>

        {/* Main content area */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '40px',
          padding: '40px 60px',
        }}>
          {/* Mock cards */}
          {[
            { initials: 'CM', count: 4 },
            { initials: 'AB', count: 2 },
            { initials: 'ZK', count: 7 },
          ].map((card, i) => (
            <div key={i} style={{
              background: '#fff',
              border: '3px solid #111',
              borderRadius: '8px',
              boxShadow: '5px 5px 0 #111',
              display: 'flex',
              flexDirection: 'column',
              width: '220px',
              overflow: 'hidden',
            }}>
              {/* red top bar */}
              <div style={{ height: '8px', background: '#ec1922', borderBottom: '3px solid #111', display: 'flex' }} />
              {/* avatar */}
              <div style={{
                background: '#39b5ff',
                height: '140px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '3px solid #111',
                fontSize: '60px',
                fontWeight: 900,
                color: '#fff',
              }}>
                {card.initials}
              </div>
              {/* body */}
              <div style={{
                padding: '12px 14px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                background: '#fff',
              }}>
                <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '2px', color: '#111', textTransform: 'uppercase', display: 'flex' }}>
                  FRIEND {i + 1}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '52px', fontWeight: 900, color: '#ec1922', lineHeight: 1, display: 'flex' }}>{card.count}</div>
                  <div style={{
                    background: '#ec1922',
                    color: '#fff',
                    border: '3px solid #111',
                    borderRadius: '50%',
                    width: '44px',
                    height: '44px',
                    fontSize: '22px',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '3px 3px 0 #111',
                  }}>＋</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Red bottom strip */}
        <div style={{
          background: '#ec1922',
          borderTop: '4px solid #111',
          padding: '14px 60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          flexShrink: 0,
        }}>
          <span style={{ color: '#f3da03', fontWeight: 900, fontSize: '22px', letterSpacing: '3px', textTransform: 'uppercase', display: 'flex' }}>
            RULES:
          </span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '22px', letterSpacing: '2px', textTransform: 'uppercase', display: 'flex' }}>
            POST AI SLOP OR FAKE NEWS = OWE THIRD A SUB
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
