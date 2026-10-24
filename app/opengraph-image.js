import { ImageResponse } from 'next/og';
import { SITE } from '@/lib/site';

/* The picture that shows when a MATTER link is shared on Pinterest,
 * Instagram, iMessage and the rest. Without it a shared link is a bare line
 * of text. Applies to every page that does not set its own. */

export const alt = `${SITE.name}. ${SITE.tagline}.`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: '#f7f5ef', color: '#1f2020',
        }}
      >
        <div style={{ display: 'flex', border: '2px dashed #5c1a1f', padding: '56px 96px', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 120, letterSpacing: 28, fontFamily: 'serif', display: 'flex' }}>MATTER</div>
          <div style={{ width: 360, height: 2, background: '#cfc7b9', margin: '28px 0' }} />
          <div style={{ fontSize: 30, letterSpacing: 8, color: '#5c1a1f', textTransform: 'uppercase', display: 'flex' }}>
            {SITE.tagline}
          </div>
        </div>
      </div>
    ),
    size
  );
}
