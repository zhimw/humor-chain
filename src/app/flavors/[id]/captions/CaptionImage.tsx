'use client';

import { useState } from 'react';

interface Props {
  src: string;
  alt?: string;
  height?: number;
  style?: React.CSSProperties;
}

export default function CaptionImage({ src, alt = 'Caption source', height = 180, style }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        style={{
          width: '100%',
          height,
          background: 'var(--surface-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          opacity: 0.35,
          ...style,
        }}
      >
        🖼️
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      style={{
        width: '100%',
        height,
        objectFit: 'cover',
        display: 'block',
        ...style,
      }}
    />
  );
}
