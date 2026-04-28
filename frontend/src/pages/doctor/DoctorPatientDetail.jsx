import React, { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DoctorHeader from '../../components/DoctorHeader.jsx'
import { Card, ScoreBadge, StatusBadge, BtnPrimary, BtnSecondary } from '../../components/UI.jsx'
import { supabase } from '../../lib/supabase.js'
import { AuthContext } from '../../App.jsx'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function DoctorPatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const [patient, setPatient] = useState(null)
  const [patientExercises, setPatientExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('overview')
  const [note, setNote] = useState('')
  const [noteFocused, setNoteFocused] = useState(false)
  const [sending, setSending] = useState(false)
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadPatient() {
      if (!user) return
      setError('')
      setLoading(true)

      const { data: connectionRows, error: connectionError } = await supabase
        .from('connections')
        .select('status')
        .eq('doctor_id', user.id)
        .eq('patient_id', id)
        .eq('status', 'approved')

      if (connectionError) {
        if (isMounted) {
          setError(connectionError.message)
          setLoading(false)
        }
        return
      }

      if (!connectionRows || connectionRows.length === 0) {
        if (isMounted) {
          setError('No approved connection for this patient.')
          setLoading(false)
        }
        return
      }

      const { data: patientRow, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', id)
        .maybeSingle()

      if (patientError) {
        if (isMounted) {
          setError(patientError.message)
          setLoading(false)
        }
        return
      }

      let assignments = []
      if (patientRow?.id) {
        const { data: assignmentRows } = await supabase
          .from('patient_exercises')
          .select('status, exercises (id, name, category, duration, difficulty)')
          .eq('patient_id', patientRow.id)

        assignments = (assignmentRows || []).map(row => ({
          ...row.exercises,
          status: row.status,
        }))
      }

      if (isMounted) {
        setPatient(patientRow)
        setPatientExercises(assignments)
        setLoading(false)
      }
    }

    loadPatient()

    return () => {
      isMounted = false
    }
  }, [user, id])

  if (loading) return <div style={{ padding: 24, color: '#6e6e73' }}>Loading patient...</div>
  if (error) return <div style={{ padding: 24, color: '#ff3b30' }}>{error}</div>
  if (!patient) return <div>Patient not found</div>

  const progress = Array.isArray(patient.progress) && patient.progress.length > 0
    ? patient.progress
    : [62, 64, 66, 68, 70, 72, 74]
  const chartData = progress.map((score, i) => ({ day: days[i], score }))

  async function handleRemovePatient() {
    if (!user) return
    const ok = window.confirm('Remove this patient from your list?')
    if (!ok) return

    setRemoving(true)
    setError('')

    const { error: updateError } = await supabase
      .from('patients')
      .update({ doctor_id: null })
      .eq('user_id', id)

    if (updateError) {
      setError(updateError.message)
      setRemoving(false)
      return
    }

    const { error: deleteError } = await supabase
      .from('connections')
      .delete()
      .eq('doctor_id', user.id)
      .eq('patient_id', id)

    if (deleteError) {
      setError(deleteError.message)
      setRemoving(false)
      return
    }

    navigate('/doctor')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f7' }}>
      <DoctorHeader />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 48px' }}>
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
        {/* Back + Header */}
        <button onClick={() => navigate('/doctor')} style={{
          background: 'none', border: 'none', color: '#0071e3',
          fontSize: 14, cursor: 'pointer', marginBottom: 24, padding: 0,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          ← Back to patients
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 600, color: '#1d1d1f', fontFamily: '"Inter Tight", sans-serif', margin: 0 }}>
              {patient.name}
            </h1>
            <p style={{ fontSize: 17, color: '#6e6e73', marginTop: 6 }}>{patient.condition} · Age {patient.age}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <ScoreBadge score={patient.score} size={56} />
            <BtnPrimary onClick={() => navigate(`/doctor/assign/${id}`)}>
              Assign exercise
            </BtnPrimary>
            <button
              onClick={handleRemovePatient}
              disabled={removing}
              style={{
                background: '#fff', color: '#ff3b30', border: '1px solid #ff3b3030',
                borderRadius: 10, padding: '10px 14px', fontSize: 12, fontWeight: 600,
                cursor: removing ? 'default' : 'pointer', opacity: removing ? 0.6 : 1,
              }}
            >
              {removing ? 'Removing...' : 'Remove'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid #d2d2d7', display: 'flex', gap: 0, marginBottom: 32 }}>
          {['overview', 'exercises', 'notes'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: 'none', border: 'none',
              borderBottom: tab === t ? '2px solid #0071e3' : '2px solid transparent',
              padding: '10px 20px',
              fontSize: 14, fontWeight: 600,
              color: tab === t ? '#1d1d1f' : '#6e6e73',
              cursor: 'pointer', marginBottom: -1,
              transition: 'color 0.15s',
              textTransform: 'capitalize',
            }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Progress chart */}
            <Card style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 19, fontWeight: 600, color: '#1d1d1f', marginBottom: 4 }}>Score progression</div>
              <div style={{ fontSize: 14, color: '#6e6e73', marginBottom: 20 }}>Past 7 days</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid stroke="#d2d2d7" strokeDasharray="3 3" strokeOpacity={0.5} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6e6e73' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#6e6e73' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #d2d2d7', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#1d1d1f', fontWeight: 600 }}
                  />
                  <Line
                    type="monotone" dataKey="score" stroke="#0071e3" strokeWidth={2}
                    dot={{ fill: '#fff', stroke: '#0071e3', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <div style={{ fontSize: 14, color: '#6e6e73', marginBottom: 8 }}>Current streak</div>
              <div style={{ fontSize: 32, fontWeight: 600, color: '#1d1d1f' }}>{patient.streak} days</div>
              <div style={{ fontSize: 12, color: patient.streak > 0 ? '#34c759' : '#ff3b30', marginTop: 4 }}>
                {patient.streak > 0 ? 'On track' : 'Streak broken'}
              </div>
            </Card>

            <Card>
              <div style={{ fontSize: 14, color: '#6e6e73', marginBottom: 8 }}>Exercises assigned</div>
              <div style={{ fontSize: 32, fontWeight: 600, color: '#1d1d1f' }}>{patientExercises.length}</div>
              <div style={{ fontSize: 12, color: '#6e6e73', marginTop: 4 }}>Active program</div>
            </Card>

            <Card style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 19, fontWeight: 600, color: '#1d1d1f', marginBottom: 12 }}>Doctor notes</div>
              <p style={{ fontSize: 17, color: '#1d1d1f', lineHeight: 1.47, letterSpacing: '-0.374px' }}>
                {patient.notes || 'No notes yet.'}
              </p>
            </Card>
          </div>
        )}

        {tab === 'exercises' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {patientExercises.map(ex => (
              <Card key={ex.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <div style={{ fontSize: 19, fontWeight: 600, color: '#1d1d1f' }}>{ex.name}</div>
                    <StatusBadge status={ex.status} />
                  </div>
                  <div style={{ fontSize: 14, color: '#6e6e73' }}>{ex.category} · {ex.duration} · {ex.difficulty}</div>
                </div>
                <BtnDestructiveSmall>Remove</BtnDestructiveSmall>
              </Card>
            ))}
            <div style={{ marginTop: 8 }}>
              <BtnPrimary onClick={() => navigate(`/doctor/assign/${id}`)}>
                + Assign new exercise
              </BtnPrimary>
            </div>
          </div>
        )}

        {tab === 'notes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card>
              <div style={{ fontSize: 19, fontWeight: 600, color: '#1d1d1f', marginBottom: 16 }}>Send feedback to patient</div>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                onFocus={() => setNoteFocused(true)}
                onBlur={() => setNoteFocused(false)}
                placeholder="Write a message or feedback for your patient..."
                rows={5}
                style={{
                  width: '100%', background: '#fff',
                  border: `1px solid ${noteFocused ? '#0071e3' : '#86868b'}`,
                  borderRadius: 12, padding: '12px 16px',
                  fontSize: 17, color: '#1d1d1f',
                  resize: 'vertical', outline: 'none',
                  transition: 'border-color 0.15s',
                  fontFamily: '"Inter", sans-serif',
                  lineHeight: 1.47,
                }}
              />
              <div style={{ marginTop: 12 }}>
                <BtnPrimary
                  onClick={() => {
                    if (!note.trim() || !user) return
                    setSending(true)
                    supabase
                      .from('feedback')
                      .insert({
                        patient_id: id,
                        doctor_id: user.id,
                        message: note.trim(),
                      })
                      .then(({ error: insertError }) => {
                        if (insertError) {
                          setError(insertError.message)
                          setSending(false)
                          return
                        }
                        setNote('')
                        setSending(false)
                      })
                  }}
                  style={{ opacity: sending ? 0.6 : 1 }}
                >
                  {sending ? 'Sending…' : 'Send feedback'}
                </BtnPrimary>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}

function BtnDestructiveSmall({ children, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: '#ff3b3015', color: '#ff3b30',
      borderRadius: 980, padding: '6px 14px',
      fontSize: 12, fontWeight: 600, border: '1px solid #ff3b3030',
      cursor: 'pointer',
    }}>{children}</button>
  )
}
