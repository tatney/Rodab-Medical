import React, { useState, useEffect } from 'react'

export default function EventCarousel({ images, caption, onOpenLightbox }) {
  const list = Array.isArray(images) ? images : []
  const count = list.length
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (count <= 1 || paused) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), 4000)
    return () => clearInterval(timer)
  }, [count, paused])

  if (!count) return null

  const go = (fn) => (e) => {
    e.preventDefault()
    e.stopPropagation()
    fn()
  }

  const arrowStyle = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 2,
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'rgba(0,0,0,0.45)',
    color: '#fff',
    fontSize: 18,
    lineHeight: 1,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  return (
    <div
      className="event-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onDoubleClick={go(() => onOpenLightbox && onOpenLightbox(list[index]))}
      style={{
        position: 'relative',
        margin: '0 16px 16px',
        borderRadius: 16,
        overflow: 'hidden',
        height: 300,
        background: 'var(--border)',
        cursor: 'zoom-in',
      }}
    >
      {list.map((src, i) => (
        <div
          key={i}
          aria-hidden={i !== index}
          style={{ position: 'absolute', inset: 0, opacity: i === index ? 1 : 0, transition: 'opacity 0.5s ease' }}
        >
          <img
            src={src}
            alt={caption || 'Event'}
            loading="lazy"
            title="Double-click to enlarge"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      ))}

      {count > 1 && (
        <>
          <button type="button" aria-label="Previous image" onClick={go(() => setIndex((i) => (i - 1 + count) % count))} style={{ ...arrowStyle, left: 8 }}>
            ‹
          </button>
          <button type="button" aria-label="Next image" onClick={go(() => setIndex((i) => (i + 1) % count))} style={{ ...arrowStyle, right: 8 }}>
            ›
          </button>
          <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, zIndex: 2, display: 'flex', justifyContent: 'center', gap: 6 }}>
            {list.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to image ${i + 1}`}
                onClick={go(() => setIndex(i))}
                style={{
                  width: 8,
                  height: 8,
                  padding: 0,
                  borderRadius: '50%',
                  border: 'none',
                  cursor: 'pointer',
                  background: i === index ? '#fff' : 'rgba(255,255,255,0.55)',
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
