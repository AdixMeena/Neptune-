import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { sessionScoreData } from '../../data.js'

function AnimatedNumber({ target, duration = 1800 }) {
  const [current, setCurrent] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const frame = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }, [target, duration])
  return <>{current}</>
}

export default function PatientScoreScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const score = location.state?.score || sessionScoreData.total
  const reps = location.state?.reps || 10
  const duration = location.state?.duration || 180

  const joints = sessionScoreData.joints

  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const message = score >= 80 ? 'Excellent session' : score >= 60 ? 'Good effort' : 'Keep practicing'

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
      fontFamily: '"Inter", sans-serif',
      overflowY: 'auto',
    }}>
      {/* Score */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, justifyContent: 'center' }}>
          <div style={{ fontSize: 80, fontWeight: 600, color: '#fff', fontFamily: '"Inter Tight", sans-serif', lineHeight: 1 }}>
            <AnimatedNumber target={score} />
          </div>
          <div style={{ fontSize: 32, color: '#6e6e73', fontWeight: 400 }}>/ 100</div>
        </div>
        <div style={{ fontSize: 24, fontWeight: 600, color: '#fff', marginTop: 16 }}>{message}</div>

        {/* Session stats */}
        <div style={{ display: 'flex', gap: 32, marginTop: 24, justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#6e6e73' }}>Reps completed</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#fff', marginTop: 2 }}>{reps}</div>
          </div>
          <div style={{ width: 1, background: '#2a2a2a' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#6e6e73' }}>Duration</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#fff', marginTop: 2 }}>{fmt(duration)}</div>
          </div>
        </div>
      </div>

      {/* Joint breakdown */}
      <div style={{
        width: '100%', maxWidth: 380,
        background: '#111', borderRadius: 18,
        padding: 24, marginBottom: 40,
      }}>
        <div style={{ fontSize: 14, color: '#6e6e73', marginBottom: 16, fontWeight: 600 }}>Joint analysis</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
          {joints.map(joint => (
            <div key={joint.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {joint.status === 'good' ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="8" fill="#34c75920"/>
                  <path d="M5 8l2.5 2.5L11 5.5" stroke="#34c759" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="8" fill="#ff9f0a20"/>
                  <path d="M8 5v3.5M8 10.5v.5" stroke="#ff9f0a" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              )}
              <div>
                <div style={{ fontSize: 14, color: '#6e6e73' }}>{joint.name}</div>
                <div style={{ fontSize: 12, color: joint.status === 'good' ? '#34c759' : '#ff9f0a', fontWeight: 600 }}>
                  {joint.score}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Done button */}
      <button
        onClick={() => navigate('/patient')}
        style={{
          width: '100%', maxWidth: 380,
          background: '#fff', color: '#1d1d1f',
          border: 'none', borderRadius: 980,
          padding: '16px 24px', fontSize: 17, fontWeight: 600,
          cursor: 'pointer', transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        Done
      </button>
    </div>
  )
}
