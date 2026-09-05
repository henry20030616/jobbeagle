import { ImageResponse } from 'next/og';

export const alt = 'JobBeagle — Job Fit Snapshot and Interview Strategy Guide';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background: 'linear-gradient(135deg, #020617 0%, #1e1b4b 55%, #312e81 100%)',
          color: 'white',
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 4, color: '#a5b4fc', fontWeight: 700 }}>
          JOBBEAGLE
        </div>
        <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.1, marginTop: 16 }}>
          Know if the job is worth it
        </div>
        <div style={{ fontSize: 32, color: '#cbd5e1', marginTop: 28 }}>
          Job Fit Snapshot · Interview Strategy Guide
        </div>
      </div>
    ),
    { ...size },
  );
}
