import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Spacze — Web Apps & AI Systems for Startups and Growing Businesses';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#020202',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Grid background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        {/* Green glow */}
        <div
          style={{
            position: 'absolute',
            bottom: -100,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'rgba(0,214,125,0.08)',
            filter: 'blur(80px)',
          }}
        />

        {/* Blue glow */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            left: -100,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'rgba(59,130,246,0.08)',
            filter: 'blur(80px)',
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 48,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #00D67D, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 22,
              color: '#000',
            }}
          >
            S
          </div>
          <span style={{ color: '#ffffff', fontWeight: 700, fontSize: 24 }}>Spacze</span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.1,
            marginBottom: 24,
            maxWidth: 800,
          }}
        >
          Web Apps &amp; AI Systems that{' '}
          <span style={{ color: '#00D67D' }}>get you more customers.</span>
        </div>

        {/* Sub */}
        <div
          style={{
            fontSize: 22,
            color: '#94a3b8',
            maxWidth: 700,
            lineHeight: 1.5,
            marginBottom: 48,
          }}
        >
          For startups, e-commerce brands, and growing businesses across Africa and beyond.
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 12 }}>
          {['Real Estate', 'Logistics', 'E-Commerce', 'SaaS', 'AI Automation'].map(tag => (
            <div
              key={tag}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#94a3b8',
                fontSize: 14,
                fontFamily: 'monospace',
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
