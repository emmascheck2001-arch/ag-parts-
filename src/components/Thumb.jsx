import React from 'react'

// Image placeholder. If image_url is set it renders the photo; otherwise a
// tinted block with an icon. Swap real photo URLs into the data later.
export default function Thumb({ src, tint = 'var(--surface-2)', icon = '🔧', size = 56, radius = 10 }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      background: `linear-gradient(135deg, ${tint}, var(--surface-2))`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, border: '1px solid var(--border)',
    }}>
      {icon}
    </div>
  )
}
