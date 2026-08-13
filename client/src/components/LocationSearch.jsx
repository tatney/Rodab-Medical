import React, { useState, useEffect, useRef } from 'react'
import { searchPlaces } from '../utils/geolocation'

/**
 * Searchable location input backed by OpenStreetMap Nominatim.
 * Auto-detected GPS location is the default; the user can search and pick
 * an alternative dispatch location instead. Props:
 *   value, onChange(e)            - input value + text change handler
 *   onPick({ label, lat, lng })   - fires when a search result is selected
 *   placeholder, name, id, style  - passed through to the input
 */
export default function LocationSearch({ value, onChange, onPick, placeholder, name, id, style, near }) {
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(-1)
  const debounceRef = useRef(null)
  const seqRef = useRef(0)
  const boxRef = useRef(null)

  useEffect(() => {
    const onClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const runSearch = (query) => {
    clearTimeout(debounceRef.current)
    const q = String(query || '').trim()
    if (q.length < 3) {
      setResults([])
      setOpen(false)
      setSearching(false)
      return
    }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      const seq = ++seqRef.current
      const res = await searchPlaces(q, { near })
      if (seq === seqRef.current) {
        setResults(res)
        setOpen(true)
        setSearching(false)
      }
    }, 400)
  }

  const handleChange = (e) => {
    onChange(e)
    runSearch(e.target.value)
    setSelectedIdx(-1)
  }

  const handlePick = (item) => {
    setOpen(false)
    setResults([])
    setSelectedIdx(-1)
    if (onPick) onPick(item)
  }

  const handleKeyDown = (e) => {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && selectedIdx >= 0) {
      e.preventDefault()
      handlePick(results[selectedIdx])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={boxRef} style={{ flex: 1, position: 'relative', minWidth: 0 }}>
      <input
        type="text"
        id={id}
        name={name}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        required
        style={style}
      />
      {searching && (
        <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.15)', borderTopColor: '#1e40af', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
        </div>
      )}
      {open && results.length > 0 && (
        <ul
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 2000,
            margin: 0,
            padding: '4px 0',
            listStyle: 'none',
            maxHeight: 240,
            overflowY: 'auto',
            backgroundColor: '#ffffff',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}
        >
          {results.map((item, idx) => (
            <li
              key={item.id}
              role="option"
              aria-selected={idx === selectedIdx}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handlePick(item)}
              onMouseEnter={() => setSelectedIdx(idx)}
              style={{
                padding: '10px 12px',
                fontSize: 13,
                color: '#374151',
                cursor: 'pointer',
                backgroundColor: idx === selectedIdx ? '#eef2ff' : '#ffffff',
              }}
            >
              <span role="img" aria-hidden="true" style={{ marginRight: 8 }}>📍</span>
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
