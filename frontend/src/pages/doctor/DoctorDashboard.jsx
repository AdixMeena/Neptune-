import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DoctorHeader from '../../components/DoctorHeader.jsx'
import { Card, ScoreBadge } from '../../components/UI.jsx'
import { supabase } from '../../lib/supabase.js'
import { AuthContext } from '../../App.jsx'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'

function MiniChart({ data }) {
  const d = data.map((v, i) => ({ v }))
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={d}>
        <Line type="monotone" dataKey="v" stroke="#0071e3" strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

function StatCard({ label, value, sub }) {
  return (
    <Card style={{ flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: 12, color: '#6e6e73', fontWeight: 400, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 600, color: '#1d1d1f', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#34c759', marginTop: 6 }}>{sub}</div>}
    </Card>
  )
}

export default function DoctorDashboard() {
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const [search, setSearch] = useState('')
  const [focused, setFocused] = useState(false)
  const [patients, setPatients] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let isMounted = true

    async function loadDoctorData() {
      if (!user) return
      setError('')
      setLoading(true)

      const { data: connectionRows, error: connectionError } = await supabase
        .from('connections')
        .select('id, patient_id, status, created_at')
        .eq('doctor_id', user.id)

      if (connectionError) {
        if (isMounted) {
          setError(connectionError.message)
          setLoading(false)
        }
        return
      }

      const pendingConnections = (connectionRows || []).filter(row => row.status === 'pending')
      const approvedConnections = (connectionRows || []).filter(row => row.status === 'approved')

      const pendingIds = pendingConnections.map(row => row.patient_id)
      const approvedIds = approvedConnections.map(row => row.patient_id)

      let profileMap = new Map()
      const profileIds = Array.from(new Set([...pendingIds, ...approvedIds]))
      if (profileIds.length > 0) {
        const { data: profileRows, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, specialization, role')
          .in('id', profileIds)

        if (profileError) {
          if (isMounted) {
            setError(profileError.message)
            setLoading(false)
          }
          return
        }

        profileMap = new Map((profileRows || []).map(row => [row.id, row]))
      }

      let patientRows = []
      if (approvedIds.length > 0) {
        const { data: rows, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .in('user_id', approvedIds)

        if (patientError) {
          if (isMounted) {
            setError(patientError.message)
            setLoading(false)
          }
          return
        }

        patientRows = rows || []
      }

      const patientMap = new Map(patientRows.map(row => [row.user_id, row]))

      const normalizedPatients = approvedIds.map(patientId => {
        const row = patientMap.get(patientId)
        const profile = profileMap.get(patientId)
        const progress = Array.isArray(row?.progress) && row.progress.length > 0
          ? row.progress
          : [62, 64, 66, 68, 70, 72, 74]

        return {
          id: patientId,
          patientRowId: row?.id,
          name: row?.name || profile?.name || 'Unknown patient',
          condition: row?.condition || 'Recovery plan',
          score: row?.score ?? 0,
          streak: row?.streak ?? 0,
          progress,
          lastSession: row?.created_at
            ? new Date(row.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
            : 'No sessions yet',
        }
      })

      const normalizedRequests = pendingConnections.map(row => {
        const profile = profileMap.get(row.patient_id)
        return {
          id: row.id,
          patientId: row.patient_id,
          name: profile?.name || 'Unknown patient',
          requestedAt: row.created_at,
        }
      })

      if (isMounted) {
        setPatients(normalizedPatients)
        setRequests(normalizedRequests)
        setLoading(false)
      }
    }

    loadDoctorData()

    return () => {
      isMounted = false
    }
  }, [user, refreshKey])

  async function updateRequest(connectionId, status) {
    setError('')
    const { error: updateError } = await supabase
      .from('connections')
      .update({ status })
      .eq('id', connectionId)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setRefreshKey(k => k + 1)
  }

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.condition.toLowerCase().includes(search.toLowerCase())
  )

  const avgScore = patients.length > 0
    ? Math.round(patients.reduce((a, b) => a + b.score, 0) / patients.length)
    : 0
  const sessionToday = 3

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f7' }}>
      <DoctorHeader />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 48px', minHeight: '100vh' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 600, color: '#1d1d1f', fontFamily: '"Inter Tight", sans-serif', margin: 0 }}>
            Patient overview
          </h1>
          <p style={{ fontSize: 17, color: '#6e6e73', marginTop: 8 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 40, flexWrap: 'wrap' }}>
          <StatCard label="Total patients" value={patients.length} sub="+1 this month" />
          <StatCard label="Average score" value={avgScore} sub="↑ 4 pts this week" />
          <StatCard label="Sessions today" value={sessionToday} />
          <StatCard label="Alerts" value={patients.filter(p => p.score < 50).length} sub="Needs attention" />
        </div>

        {/* Requests */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1d1d1f', margin: 0 }}>Requests</h2>
            <span style={{ fontSize: 13, color: '#6e6e73' }}>{requests.length} pending</span>
          </div>

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
              Loading requests...
            </div>
          )}

          {!loading && requests.length === 0 && (
            <Card style={{ color: '#6e6e73', fontSize: 14 }}>No pending requests.</Card>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {requests.map(req => (
              <Card key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f' }}>{req.name}</div>
                  <div style={{ fontSize: 12, color: '#6e6e73', marginTop: 4 }}>
                    Requested {req.requestedAt ? new Date(req.requestedAt).toLocaleString() : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => updateRequest(req.id, 'approved')}
                    style={{
                      background: '#34c759', color: '#fff', border: 'none',
                      borderRadius: 10, padding: '8px 12px', fontSize: 12, fontWeight: 600,
                    }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateRequest(req.id, 'rejected')}
                    style={{
                      background: '#ff3b30', color: '#fff', border: 'none',
                      borderRadius: 10, padding: '8px 12px', fontSize: 12, fontWeight: 600,
                    }}
                  >
                    Reject
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Search */}
        <div style={{ marginBottom: 20 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search patients or conditions..."
            style={{
              width: '100%', maxWidth: 420,
              background: '#fff', border: `1px solid ${focused ? '#0071e3' : '#d2d2d7'}`,
              borderRadius: 12, padding: '10px 16px',
              fontSize: 14, color: '#1d1d1f', outline: 'none',
              transition: 'border-color 0.15s',
            }}
          />
        </div>

        {/* Patient grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          <AddPatientCard onClick={() => navigate('/doctor/add-patient')} />
          {filtered.map(patient => (
            <PatientCard key={patient.id} patient={patient} onClick={() => navigate(`/doctor/patient/${patient.id}`)} />
          ))}
        </div>
      </main>
    </div>
  )
}

function AddPatientCard({ onClick }) {
  return (
    <Card onClick={onClick} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: 190, borderStyle: 'dashed', borderColor: '#c7c7cc',
      background: '#fafafa',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 46, height: 46, borderRadius: '50%',
          background: '#0071e3', color: '#fff',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, fontWeight: 600, marginBottom: 10,
        }}>
          +
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f' }}>Add patient</div>
        <div style={{ fontSize: 12, color: '#6e6e73', marginTop: 4 }}>Create a new profile</div>
      </div>
    </Card>
  )
}

function PatientCard({ patient, onClick }) {
  return (
    <Card onClick={onClick} style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: 20, right: 20 }}>
        <ScoreBadge score={patient.score} />
      </div>

      <div style={{ paddingRight: 60 }}>
        <div style={{ fontSize: 19, fontWeight: 600, color: '#1d1d1f', marginBottom: 4 }}>
          {patient.name}
        </div>
        <div style={{ fontSize: 14, color: '#6e6e73', marginBottom: 16 }}>
          {patient.condition}
        </div>
      </div>

      <MiniChart data={patient.progress} />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px solid #d2d2d7' }}>
        <div>
          <div style={{ fontSize: 12, color: '#86868b' }}>Last session</div>
          <div style={{ fontSize: 12, color: '#1d1d1f', fontWeight: 600, marginTop: 2 }}>{patient.lastSession}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: '#86868b' }}>Streak</div>
          <div style={{ fontSize: 12, color: patient.streak > 0 ? '#34c759' : '#ff3b30', fontWeight: 600, marginTop: 2 }}>
            {patient.streak > 0 ? `${patient.streak} days` : 'None'}
          </div>
        </div>
      </div>
    </Card>
  )
}
