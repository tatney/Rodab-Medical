import React from 'react'
import { Link } from 'react-router-dom'
import colors from '../utils/colors'

export default function NotFoundPage() {
  return (
    <main
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 40,
      }}
    >
      <div>
        <h1
          aria-hidden="true"
          style={{
            fontSize: 'clamp(3rem, 15vw, 7.5rem)',
            fontWeight: 900,
            color: colors.gray200,
            margin: 0,
            lineHeight: 1,
          }}
        >
          404
        </h1>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: colors.gray900,
            marginTop: 16,
            marginBottom: 12,
          }}
        >
          Page Not Found
        </h2>
        <p
          style={{
            fontSize: 16,
            color: colors.gray500,
            maxWidth: 400,
            margin: '0 auto 32px',
          }}
        >
          The page you're looking for doesn't exist or has been moved. Please check the URL or navigate back.
        </p>
        <Link
          to="/"
          style={{
            display: 'inline-block',
            padding: '14px 32px',
            backgroundColor: colors.primary,
            color: colors.white,
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Back to Home
        </Link>
      </div>
    </main>
  )
}
