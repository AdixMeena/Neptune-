import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { AuthContext } from '../App.jsx'
import PatientBottomNav from './PatientBottomNav.jsx'

export default function PatientApprovalGate({ children, showNav = true }) {
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadStatus() {
      if (!user) return
      setError('')
      const { data, error: statusError } = await supabase
        .from('connections')
        .select('status')
        .eq('patient_id', user.id)

      if (!isMounted) return

      if (statusError) {
        setError(statusError.message)
        setStatus('none')
        return
      }

      const statuses = (data || []).map(row => row.status)
      if (statuses.includes('approved')) {
        setStatus('approved')
      } else if (statuses.includes('pending')) {
        setStatus('pending')
      } else {
        setStatus('none')
      }
    }

    loadStatus()

    return () => {
      isMounted = false
    }
  }, [user])

  if (status === 'approved') return children

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f7', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{
          width: '100%', maxWidth: 420,
          background: '#fff', borderRadius: 20,
          padding: 28, border: '1px solid #d2d2d7',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#1d1d1f', marginBottom: 10 }}>
            {status === 'pending' ? 'Waiting for doctor approval' : 'Connect with a doctor'}
          </div>
          <div style={{ fontSize: 14, color: '#6e6e73', lineHeight: 1.5 }}>
            {status === 'pending'
              ? 'Your request was sent. You will see your exercises once a doctor approves the connection.'
              : 'Find a doctor to request access to your recovery plan and feedback.'}
          </div>

          {error && (
            <div style={{
              marginTop: 14, fontSize: 12, color: '#ff3b30',
              background: '#ff3b3010', border: '1px solid #ff3b3030',
              borderRadius: 12, padding: '8px 12px',
            }}>
              {error}
            </div>
          )}

          <button
            onClick={() => navigate('/patient/find-doctor')}
            style={{
              marginTop: 18,
              background: '#0071e3', color: '#fff',
              border: 'none', borderRadius: 12,
              padding: '12px 16px', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', width: '100%',
            }}
          >
            Find a doctor
          </button>
        </div>
      </div>

      {showNav && <PatientBottomNav />}
    </div>
  )
}
