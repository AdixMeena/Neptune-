import React, { useContext, useEffect, useState } from 'react'
import PatientBottomNav from '../../components/PatientBottomNav.jsx'
import PatientApprovalGate from '../../components/PatientApprovalGate.jsx'
import { supabase } from '../../lib/supabase.js'
import { AuthContext } from '../../App.jsx'

export default function PatientFeedback() {
  const { user } = useContext(AuthContext)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadMessages() {
      if (!user) return
      setError('')
      setLoading(true)

      const { data, error: fetchError } = await supabase
        .from('feedback')
        .select('id, doctor_id, message, is_read, created_at')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false })

      if (!isMounted) return

      if (fetchError) {
        setError(fetchError.message)
        setLoading(false)
        return
      }

      const formatted = (data || []).map(row => ({
        id: row.id,
        from: 'Doctor',
        message: row.message,
        time: new Date(row.created_at).toLocaleString(),
        unread: !row.is_read,
      }))

      setMessages(formatted)
      setLoading(false)
    }

    loadMessages()

    return () => {
      isMounted = false
    }
  }, [user])

  return (
    <PatientApprovalGate showNav>
      <div style={{ background: '#f5f5f7', minHeight: '100vh', paddingBottom: 80, fontFamily: '"Inter", sans-serif' }}>
        {/* Header */}
        <div style={{ background: '#fff', padding: '56px 24px 20px', borderBottom: '1px solid #d2d2d7' }}>
          <h1 style={{ fontSize: 32, fontWeight: 600, color: '#1d1d1f', fontFamily: '"Inter Tight", sans-serif', margin: 0 }}>
            Feedback
          </h1>
          <p style={{ fontSize: 17, color: '#6e6e73', marginTop: 6 }}>Messages from your physiotherapist</p>
        </div>

        <div style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
          {error && (
            <div style={{
              background: '#ff3b3010', border: '1px solid #ff3b3030',
              borderRadius: 12, padding: '12px 16px',
              fontSize: 13, color: '#ff3b30', lineHeight: 1.5,
              marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#6e6e73', fontSize: 17 }}>
              Loading messages...
            </div>
          )}

          {!loading && messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#6e6e73', fontSize: 17 }}>
              No messages yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {messages.map(msg => (
                <div key={msg.id} style={{
                  borderLeft: msg.unread ? '3px solid #0071e3' : '3px solid transparent',
                  paddingLeft: msg.unread ? 12 : 0,
                }}>
                  <div style={{
                    background: '#f5f5f7',
                    borderRadius: '12px 12px 12px 0px',
                    padding: '16px 18px',
                  }}>
                    <div style={{ fontSize: 12, color: '#0071e3', fontWeight: 600, marginBottom: 8 }}>
                      {msg.from}
                    </div>
                    <p style={{
                      fontSize: 17, color: '#1d1d1f',
                      lineHeight: 1.47, letterSpacing: '-0.374px',
                      margin: 0,
                    }}>
                      {msg.message}
                    </p>
                    <div style={{ fontSize: 12, color: '#6e6e73', marginTop: 10 }}>
                      {msg.time}
                      {msg.unread && (
                        <span style={{
                          marginLeft: 8, fontSize: 11, color: '#0071e3', fontWeight: 600,
                          background: '#0071e315', borderRadius: 980, padding: '2px 8px',
                        }}>New</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <PatientBottomNav />
      </div>
    </PatientApprovalGate>
  )
}
