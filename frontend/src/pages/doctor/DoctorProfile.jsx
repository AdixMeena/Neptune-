import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DoctorHeader from '../../components/DoctorHeader.jsx'
import DoctorBottomNav from '../../components/DoctorBottomNav.jsx'
import { Card, Input } from '../../components/UI.jsx'
import { supabase } from '../../lib/supabase.js'
import { AuthContext } from '../../App.jsx'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

// ── Helpers ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 80 }) {
  const initials = name.replace('Dr. ', '').split(' ').map(n => n[0]).join('').slice(0, 2)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #1d1d1f 0%, #0071e3 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.28, fontWeight: 600, color: '#fff',
      flexShrink: 0, fontFamily: '"Inter Tight", sans-serif',
      letterSpacing: '-0.5px',
    }}>{initials}</div>
  )
}

function StatCard({ label, value, sub, color = '#1d1d1f' }) {
  return (
    <Card style={{ flex: 1 }}>
      <div style={{ fontSize: 12, color: '#6e6e73', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 600, color, fontFamily: '"Inter Tight", sans-serif', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#34c759', marginTop: 6 }}>{sub}</div>}
    </Card>
  )
}

function InfoRow({ label, value, mono = false }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 0', borderBottom: '1px solid #f5f5f7',
    }}>
      <span style={{ fontSize: 14, color: '#6e6e73' }}>{label}</span>
      <span style={{
        fontSize: 14, fontWeight: 600, color: mono ? '#6e6e73' : '#1d1d1f',
        fontFamily: mono ? 'monospace' : 'inherit',
        background: mono ? '#f5f5f7' : 'none',
        padding: mono ? '2px 8px' : 0,
        borderRadius: mono ? 6 : 0,
      }}>{value}</span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DoctorProfile() {
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [tab, setTab] = useState('overview')
  const [profile, setProfile] = useState(null)
  const [patients, setPatients] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadProfile() {
      if (!user) return
      setError('')
      setLoading(true)

      const { data: profileRow, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, specialization, created_at')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        if (isMounted) {
          setError(profileError.message)
          setLoading(false)
        }
        return
      }

      const { data: patientRows, error: patientError } = await supabase
        .from('patients')
        .select('id, user_id, name, condition, score')
        .eq('doctor_id', user.id)

      if (patientError) {
        if (isMounted) {
          setError(patientError.message)
          setLoading(false)
        }
        return
      }

      let sessionRows = []
      const patientIds = (patientRows || []).map(row => row.user_id).filter(Boolean)
      if (patientIds.length > 0) {
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select('id, patient_id, score, created_at')
          .in('patient_id', patientIds)

        if (sessionsError) {
          if (isMounted) {
            setError(sessionsError.message)
            setLoading(false)
          }
          return
        }

        sessionRows = sessionsData || []
      }

      if (isMounted) {
        setProfile(profileRow || null)
        setPatients(patientRows || [])
        setSessions(sessionRows)
        setName(profileRow?.name || user?.user_metadata?.name || '')
        setSpecialization(profileRow?.specialization || user?.user_metadata?.specialization || '')
        setLoading(false)
      }
    }

    loadProfile()

    return () => {
      isMounted = false
    }
  }, [user])

  async function handleSave() {
    if (!user) return
    const trimmedName = name.trim() || 'Doctor'
    const trimmedSpec = specialization.trim() || null

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ name: trimmedName, specialization: trimmedSpec })
      .eq('id', user.id)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setProfile(prev => ({
      ...(prev || {}),
      name: trimmedName,
      specialization: trimmedSpec,
    }))
    setEditing(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/', { replace: true })
  }

  const doctorName = name || profile?.name || user?.user_metadata?.name || 'Doctor'
  const doctorSpecialization = specialization || profile?.specialization || user?.user_metadata?.specialization || 'Specialist'
  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : 'Not set'

  const totalPatients = patients.length
  const avgPatientScore = totalPatients > 0
    ? Math.round(patients.reduce((sum, p) => sum + (p.score ?? 0), 0) / totalPatients)
    : 0

  const now = new Date()
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const activeSessions = sessions.filter(s => new Date(s.created_at) >= dayAgo).length
  const sessionsThisMonth = sessions.filter(s => new Date(s.created_at) >= monthStart).length

  const monthBuckets = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      sessions: 0,
    }
  })
  const monthMap = new Map(monthBuckets.map(b => [b.key, b]))
  sessions.forEach(s => {
    const d = new Date(s.created_at)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const bucket = monthMap.get(key)
    if (bucket) bucket.sessions += 1
  })

  const scoreBands = [
    { label: '80–100', min: 80, max: 100, color: '#34c759' },
    { label: '65–80', min: 65, max: 79, color: '#ff9f0a' },
    { label: '50–65', min: 50, max: 64, color: '#ff9f0a' },
    { label: '0–50', min: 0, max: 49, color: '#ff3b30' },
  ]
  const scoreDist = scoreBands.map(band => ({
    ...band,
    count: patients.filter(p => {
      const score = p.score ?? 0
      return score >= band.min && score <= band.max
    }).length,
  }))

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f7', fontFamily: '"Inter", sans-serif', paddingBottom: 88 }}>
      <DoctorHeader />

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px 48px' }}>

        {/* ── Page header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 600, color: '#1d1d1f', fontFamily: '"Inter Tight", sans-serif', margin: 0 }}>
              My profile
            </h1>
            <p style={{ fontSize: 17, color: '#6e6e73', marginTop: 6 }}>Manage your account and view practice analytics</p>
          </div>
          {!editing
            ? <button onClick={() => setEditing(true)} style={{
                background: '#fff', border: '1px solid #d2d2d7', borderRadius: 980,
                padding: '10px 20px', fontSize: 14, fontWeight: 600, color: '#1d1d1f',
                cursor: 'pointer',
              }}>Edit profile</button>
            : <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setEditing(false)} style={{
                  background: '#fff', border: '1px solid #d2d2d7', borderRadius: 980,
                  padding: '10px 20px', fontSize: 14, fontWeight: 600, color: '#6e6e73', cursor: 'pointer',
                }}>Cancel</button>
                <button onClick={handleSave} style={{
                  background: '#0071e3', border: 'none', borderRadius: 980,
                  padding: '10px 20px', fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer',
                }}>Save changes</button>
              </div>
          }
        </div>

        {/* ── Identity card ── */}
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
          <div style={{ textAlign: 'center', color: '#6e6e73', fontSize: 14, padding: '12px 0' }}>
            Loading profile...
          </div>
        )}

        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <Avatar name={doctorName} size={80} />
            <div style={{ flex: 1, minWidth: 200 }}>
              {editing
                ? <input value={name} onChange={e => setName(e.target.value)} style={{
                    fontSize: 24, fontWeight: 600, color: '#1d1d1f',
                    border: '1px solid #0071e3', borderRadius: 10,
                    padding: '6px 12px', outline: 'none', width: '100%',
                    fontFamily: '"Inter Tight", sans-serif', marginBottom: 6,
                  }} />
                : <div style={{ fontSize: 24, fontWeight: 600, color: '#1d1d1f', fontFamily: '"Inter Tight", sans-serif', marginBottom: 4 }}>{doctorName}</div>
              }
              <div style={{ fontSize: 15, color: '#6e6e73', marginBottom: 4 }}>{doctorSpecialization}</div>
              <div style={{ fontSize: 13, color: '#86868b' }}>{user?.email || 'Email not available'}</div>
            </div>

            {/* Quick stats inline */}
            <div style={{ display: 'flex', gap: 32, paddingLeft: 24, borderLeft: '1px solid #f5f5f7' }}>
              {[
                { val: totalPatients,   lbl: 'Patients' },
                { val: avgPatientScore, lbl: 'Avg score' },
                { val: activeSessions,  lbl: 'Active' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 600, color: '#1d1d1f', fontFamily: '"Inter Tight", sans-serif' }}>{s.val}</div>
                  <div style={{ fontSize: 12, color: '#6e6e73', marginTop: 3 }}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* ── Tabs ── */}
        <div style={{ borderBottom: '1px solid #d2d2d7', display: 'flex', marginBottom: 24 }}>
          {['overview', 'analytics', 'patients', 'settings'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: 'none', border: 'none',
              borderBottom: tab === t ? '2px solid #0071e3' : '2px solid transparent',
              padding: '10px 20px', marginBottom: -1,
              fontSize: 14, fontWeight: 600,
              color: tab === t ? '#1d1d1f' : '#6e6e73',
              cursor: 'pointer', transition: 'color 0.15s',
              textTransform: 'capitalize',
            }}>{t}</button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Stat row */}
            <div style={{ display: 'flex', gap: 12 }}>
              <StatCard label="Active sessions today"  value={activeSessions} />
              <StatCard label="Sessions this month"    value={sessionsThisMonth} />
              <StatCard label="Avg patient score"      value={avgPatientScore}      color="#34c759" />
            </div>

            {/* Professional info */}
            <Card>
              <div style={{ fontSize: 17, fontWeight: 600, color: '#1d1d1f', marginBottom: 16 }}>Professional details</div>
              {editing
                ? <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <Input label="Specialization" value={specialization} onChange={e => setSpecialization(e.target.value)} />
                  </div>
                : <>
                    <InfoRow label="Email" value={user?.email || 'Not set'} />
                    <InfoRow label="Specialization" value={doctorSpecialization || 'Not set'} />
                    <InfoRow label="Member since" value={joinedDate} />
                  </>
              }
            </Card>

            {/* Verification badge */}
            <Card style={{ background: '#f0f8ff', borderColor: 'rgba(0,113,227,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: '#0071e315',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="M9 12l2 2 4-4"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>Verified practitioner</div>
                  <div style={{ fontSize: 12, color: '#6e6e73', marginTop: 2 }}>Your license has been verified. Patients can trust your profile.</div>
                </div>
                <div style={{
                  marginLeft: 'auto', fontSize: 12, fontWeight: 600,
                  color: '#0071e3', background: '#0071e315',
                  borderRadius: 980, padding: '4px 12px',
                }}>Active</div>
              </div>
            </Card>
          </div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {tab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Sessions chart */}
            <Card>
              <div style={{ fontSize: 17, fontWeight: 600, color: '#1d1d1f', marginBottom: 4 }}>Sessions per month</div>
              <div style={{ fontSize: 13, color: '#6e6e73', marginBottom: 20 }}>Past 6 months</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={monthBuckets} barSize={28}>
                  <CartesianGrid stroke="#f5f5f7" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6e6e73' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#6e6e73' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #d2d2d7', borderRadius: 10, fontSize: 12 }}
                    cursor={{ fill: '#f5f5f7' }}
                  />
                  <Bar dataKey="sessions" fill="#0071e3" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Score distribution */}
            <Card>
              <div style={{ fontSize: 17, fontWeight: 600, color: '#1d1d1f', marginBottom: 4 }}>Patient score distribution</div>
              <div style={{ fontSize: 13, color: '#6e6e73', marginBottom: 20 }}>Current patient scores</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {scoreDist.map(d => (
                  <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 12, color: '#6e6e73', width: 52, flexShrink: 0 }}>{d.label}</div>
                    <div style={{ flex: 1, height: 8, background: '#f5f5f7', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 4, background: d.color,
                        width: `${totalPatients ? (d.count / totalPatients) * 100 : 0}%`,
                        transition: 'width 0.8s ease',
                      }} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1d1d1f', width: 20, textAlign: 'right' }}>{d.count}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ── PATIENTS TAB ── */}
        {tab === 'patients' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {patients.length === 0 && (
              <Card style={{ color: '#6e6e73', fontSize: 14 }}>No patients yet.</Card>
            )}
            {patients.map(p => (
              <Card key={p.user_id || p.id} onClick={() => p.user_id && navigate(`/doctor/patient/${p.user_id}`)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {/* Avatar */}
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #f5f5f7, #d2d2d7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 600, color: '#6e6e73',
                    fontFamily: '"Inter Tight", sans-serif',
                  }}>
                    {(p.name || 'Patient').split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#1d1d1f' }}>{p.name || 'Patient'}</div>
                    <div style={{ fontSize: 12, color: '#6e6e73', marginTop: 2 }}>{p.condition || 'Recovery plan'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: p.score >= 75 ? '#34c75920' : p.score >= 50 ? '#ff9f0a20' : '#ff3b3020',
                      color: p.score >= 75 ? '#34c759' : p.score >= 50 ? '#ff9f0a' : '#ff3b30',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 600,
                    }}>{p.score ?? 0}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d2d2d7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Notifications */}
            <Card>
              <div style={{ fontSize: 17, fontWeight: 600, color: '#1d1d1f', marginBottom: 16 }}>Notifications</div>
              {[
                { label: 'Patient session completed', sub: 'Get notified when a patient finishes a session', on: true  },
                { label: 'Low score alert',           sub: 'Alert when a patient scores below 50',           on: true  },
                { label: 'New connection request',    sub: 'When a patient requests to connect with you',    on: true  },
                { label: 'Weekly summary',            sub: 'Weekly email digest of patient progress',        on: false },
              ].map((n, i) => (
                <ToggleRow key={i} label={n.label} sub={n.sub} defaultOn={n.on} />
              ))}
            </Card>

            {/* Danger zone */}
            <Card style={{ borderColor: '#ff3b3015' }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: '#1d1d1f', marginBottom: 4 }}>Account</div>
              <div style={{ fontSize: 13, color: '#6e6e73', marginBottom: 16 }}>Manage your account settings</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={handleSignOut} style={{
                  background: '#f5f5f7', border: '1px solid #d2d2d7', borderRadius: 12,
                  padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#1d1d1f',
                  cursor: 'pointer', textAlign: 'left', width: '100%'
                }}>Sign out</button>
                <button style={{
                  background: '#fff0f0', border: '1px solid #ff3b3030', borderRadius: 12,
                  padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#ff3b30',
                  cursor: 'pointer', textAlign: 'left', width: '100%'
                }}>Delete account</button>
              </div>
            </Card>
          </div>
        )}
      </main>
      <DoctorBottomNav />
    </div>
  )
}

// ── Toggle component (used in settings) ──────────────────────────────────────
function ToggleRow({ label, sub, defaultOn }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, padding: '12px 0', borderBottom: '1px solid #f5f5f7',
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>{label}</div>
        <div style={{ fontSize: 12, color: '#6e6e73', marginTop: 2 }}>{sub}</div>
      </div>
      <button onClick={() => setOn(v => !v)} style={{
        width: 44, height: 26, borderRadius: 13,
        background: on ? '#0071e3' : '#d2d2d7',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s', flexShrink: 0,
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: '50%', background: '#fff',
          position: 'absolute', top: 3,
          left: on ? 21 : 3,
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  )
}
