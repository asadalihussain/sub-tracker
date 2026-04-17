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
          background: '#0f1923',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background accent lines */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '6px',
          background: 'linear-gradient(to right, #ec1922, #39b5ff)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: '6px',
          background: 'linear-gradient(to right, #39b5ff, #ec1922)',
          display: 'flex',
        }} />

        {/* Glow circle behind logo */}
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(57,181,255,0.12) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -60%)',
          display: 'flex',
        }} />

        {/* Logo */}
        <img
          src={logoBase64}
          width={340}
          height={160}
          style={{ objectFit: 'contain', marginBottom: '28px' }}
        />

        {/* Title */}
        <div style={{
          fontSize: '72px',
          fontWeight: 900,
          color: '#39b5ff',
          letterSpacing: '4px',
          textTransform: 'uppercase',
          lineHeight: 1,
          marginBottom: '18px',
          display: 'flex',
        }}>
          CRAVE DEBT TRACKER
        </div>

        {/* Rule strip */}
        <div style={{
          background: '#ec1922',
          color: '#fff',
          padding: '12px 40px',
          fontSize: '24px',
          fontWeight: 700,
          letterSpacing: '3px',
          textTransform: 'uppercase',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span style={{ color: '#f3da03' }}>RULES:</span>
          POST AI SLOP OR FAKE NEWS = OWE THIRD A SUB
        </div>
      </div>
    ),
    { ...size }
  );
}
