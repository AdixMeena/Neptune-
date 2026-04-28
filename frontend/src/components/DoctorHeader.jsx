import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../App.jsx'
import { supabase } from '../lib/supabase.js'

export default function DoctorHeader() {
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)

  const doctorName = user?.user_metadata?.name || 'Dr. Rajesh Kumar'
  const specialization = user?.user_metadata?.specialization || 'Physiotherapist'

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/', { replace: true })
  }

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 20,
      background: '#ffffff',
      borderBottom: '1px solid #e5e5ea',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px',
      }}>
        <button
          onClick={() => navigate('/doctor')}
          style={{
            background: 'none', border: 'none', padding: 0,
            color: '#1d1d1f', cursor: 'pointer', textAlign: 'left',
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 600, fontFamily: '"Inter Tight", sans-serif' }}>
            Phoenix-AI
          </div>
          <div style={{ fontSize: 12, color: '#6e6e73', marginTop: 2 }}>
            Doctor workspace
          </div>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, color: '#1d1d1f', fontWeight: 600 }}>{doctorName}</div>
            <div style={{ fontSize: 12, color: '#6e6e73', marginTop: 2 }}>{specialization}</div>
          </div>
          <button
            onClick={handleSignOut}
            style={{
              fontSize: 12, color: '#6e6e73',
              background: 'none', border: '1px solid #d2d2d7',
              borderRadius: 10, padding: '6px 10px',
              cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#ff3b30'}
            onMouseLeave={e => e.currentTarget.style.color = '#6e6e73'}
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
