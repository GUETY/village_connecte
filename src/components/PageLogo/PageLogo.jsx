import React from 'react';
import './pageLogo.css';
import defaultLogo from '../../assets/voisinage.jpeg';

export default function PageLogo({ src = defaultLogo, alt = 'Logo', size = 60 }) {
  return (
    <div className="vc-page-logo" style={{ width: size, height: size }}>
      <img
        src={src}
        alt={alt}
        onError={(e) => {
          try {
            if (!e.currentTarget.src.includes('vite.svg')) e.currentTarget.src = '/vite.svg';
          } catch (err) {
            /* ignore */
          }
        }}
        style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 6, backgroundColor: 'transparent' }}
      />
    </div>
  );
}
