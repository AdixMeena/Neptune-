import React, { useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AuthContext } from '../App.jsx'
import { supabase } from '../lib/supabase.js'

const navItems = [
  { label: 'Patients',   path: '/doctor' },
  { label: 'Exercises',  path: '/doctor/exercises' },
  { label: 'Analytics',  path: '/doctor/analytics' },
  { label: 'Messages',   path: '/doctor/messages' },
]

function NavIcon({ name }) {
  const icons = {
    'Patients': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    'Exercises': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
        <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
      </svg>
    ),
    'Analytics': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
      </svg>
    ),
    'Messages': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  }
  return icons[name] || null
}

export default function DoctorSidebar() {
  const navigate     = useNavigate()
  const location     = useLocation()
  const { user }     = useContext(AuthContext)

  // Read name / specialization from Supabase user_metadata
  const doctorName      = user?.user_metadata?.name           || 'Dr. Rajesh Kumar'
  const specialization  = user?.user_metadata?.specialization || 'Physiotherapist'

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/', { replace: true })
  }

  return (
    <aside style={{
      width: 240, minHeight: '100vh',
      background: '#000000',
      display: 'flex', flexDirection: 'column',
      flexShrink: 0, position: 'fixed', top: 0, left: 0, bottom: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '32px 24px 24px' }}>
        <div style={{ fontSize: 19, fontWeight: 600, color: '#fff', fontFamily: '"Inter Tight", sans-serif', letterSpacing: '-0.2px' }}>
          Phoenix-AI
        </div>
        <div style={{ fontSize: 12, color: '#6e6e73', marginTop: 4 }}>Rehabilitation, reimagined</div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0 12px' }}>
        {navItems.map(item => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/doctor' && location.pathname.startsWith(item.path))
          return (
            <button key={item.label} onClick={() => navigate(item.path)} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              width: '100%', padding: '10px 12px',
              background: 'none', border: 'none',
              borderRadius: 10,
              color: isActive ? '#fff' : '#6e6e73',
              fontSize: 14, fontWeight: isActive ? 600 : 400,
              cursor: 'pointer', position: 'relative',
              textAlign: 'left', marginBottom: 2,
              transition: 'color 0.15s',
            }}>
              {isActive && (
                <div style={{
                  position: 'absolute', left: 0, top: '20%', bottom: '20%',
                  width: 2, background: '#0071e3', borderRadius: 2,
                }} />
              )}
              <span style={{ opacity: isActive ? 1 : 0.7 }}>
                <NavIcon name={item.label} />
              </span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Doctor info + sign out */}
      <div style={{ padding: '20px 24px', borderTop: '1px solid #2a2a2a' }}>
        <button
          type="button"
          onClick={() => navigate('/doctor/profile')}
          style={{
            display: 'block', width: '100%', textAlign: 'left',
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>{doctorName}</div>
          <div style={{ fontSize: 12, color: '#6e6e73', marginTop: 2 }}>{specialization}</div>
        </button>
        <button
          onClick={handleSignOut}
          style={{
            marginTop: 12, fontSize: 12, color: '#6e6e73',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#ff3b30'}
          onMouseLeave={e => e.currentTarget.style.color = '#6e6e73'}
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
