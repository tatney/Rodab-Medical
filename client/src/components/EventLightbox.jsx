import React, { useEffect } from 'react'

export default function EventLightbox({ image, caption, onClose }) {
  useEffect(() => {
    if (!image) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [image, onClose])

  if (!image) return null

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={caption || 'Event image'}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'zoom-out',
        padding: 24,
      }}
    >
      <figure style={{ maxWidth: 'min(92vw, 1100px)', margin: 0, textAlign: 'center' }}>
        {caption && (
          <figcaption
            style={{
              color: '#fff',
              fontSize: 18,
              fontWeight: 600,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              marginBottom: 16,
            }}
          >
            {caption}
          </figcaption>
        )}
        <img
          src={image}
          alt={caption || 'Event image'}
          style={{ maxWidth: '100%', maxHeight: '78vh', objectFit: 'contain', display: 'block', margin: '0 auto', borderRadius: 8 }}
        />
      </figure>
    </div>
  )
}
