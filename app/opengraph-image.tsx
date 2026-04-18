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
      <div style={{
        width: '1200px',
        height: '630px',
        background: '#39b5ff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'sans-serif',
      }}>
        {/* Dot pattern */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }}>
          <defs>
            <pattern id="dots" x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="1.5" fill="#000" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* Yellow header bar at top */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          background: '#f3da03',
          borderBottom: '5px solid #111',
          height: '12px',
          display: 'flex',
        }} />

        {/* Logo */}
        <img src={logoBase64} height={200} style={{ objectFit: 'contain', marginBottom: '24px', filter: 'drop-shadow(4px 4px 0 rgba(0,0,0,0.25))' }} />

        {/* Title */}
        <div style={{
          background: '#f3da03',
          border: '4px solid #111',
          borderRadius: '8px',
          padding: '14px 48px',
          boxShadow: '6px 6px 0 #111',
          fontSize: '56px',
          fontWeight: 900,
          color: '#111',
          letterSpacing: '4px',
          textTransform: 'uppercase',
          marginBottom: '32px',
          display: 'flex',
        }}>
          CRAVE DEBT TRACKER
        </div>

        {/* Rules strip */}
        <div style={{
          background: '#ec1922',
          border: '4px solid #111',
          borderRadius: '6px',
          padding: '14px 40px',
          boxShadow: '5px 5px 0 #111',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{ color: '#f3da03', fontWeight: 900, fontSize: '26px', letterSpacing: '2px', textTransform: 'uppercase', display: 'flex' }}>
            RULES:
          </span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '24px', letterSpacing: '2px', textTransform: 'uppercase', display: 'flex' }}>
            POST AI SLOP OR FAKE NEWS = OWE THIRD A SUB
          </span>
        </div>

        {/* Bottom bar */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          background: '#111',
          height: '10px',
          display: 'flex',
        }} />
      </div>
    ),
    { ...size }
  );
}
