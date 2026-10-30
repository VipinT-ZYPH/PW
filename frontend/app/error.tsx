'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('EventMind page error', error)
  }, [error])

  return (
    <main style={{ maxWidth: 560, margin: '12vh auto', padding: 24, textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h1>Something went wrong</h1>
      <p>We could not load this workspace. Try again, or return when the service is available.</p>
      <button type="button" onClick={() => reset()} style={{ padding: '10px 16px', border: 0, borderRadius: 7, background: '#5146a8', color: '#fff', cursor: 'pointer' }}>
        Try again
      </button>
    </main>
  )
}
