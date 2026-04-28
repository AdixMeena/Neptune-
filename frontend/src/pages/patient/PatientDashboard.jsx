import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PatientBottomNav from '../../components/PatientBottomNav.jsx'
import { Card, StatusBadge, ScoreBadge } from '../../components/UI.jsx'
import PatientApprovalGate from '../../components/PatientApprovalGate.jsx'
import { supabase } from '../../lib/supabase.js'
import { AuthContext } from '../../App.jsx'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function PatientDashboard() {
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const [patient, setPatient] = useState(null)
  const [patientExercises, setPatientExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadPatientData() {
      if (!user) return
      setError('')
      setLoading(true)

      const { data: patientRow, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
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
        const { data: assignmentRows, error: assignmentError } = await supabase
          .from('patient_exercises')
          .select('status, exercises (id, name, category, duration, difficulty, instructions, target_angle, joints)')
          .eq('patient_id', patientRow.id)

        if (assignmentError) {
          if (isMounted) {
            setError(assignmentError.message)
          }
        } else {
          assignments = (assignmentRows || []).map(row => ({
            ...row.exercises,
            status: row.status,
          }))
        }
      }

      if (isMounted) {
        setPatient(patientRow)
        setPatientExercises(assignments)
        setLoading(false)
      }
    }

    loadPatientData()

    return () => {
      isMounted = false
    }
  }, [user])

  const progress = Array.isArray(patient?.progress) && patient.progress.length > 0
    ? patient.progress
    : [62, 64, 66, 68, 70, 72, 74]
  const chartData = progress.map((score, i) => ({ day: days[i], score }))
  const pending = patientExercises.filter(e => e.status === 'pending' || e.status === 'overdue')

  return (
    <PatientApprovalGate showNav>
      <div style={{ background: '#f5f5f7', minHeight: '100vh', paddingBottom: 80, fontFamily: '"Inter", sans-serif' }}>
        {/* Header */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 20,
          background: '#ffffff', borderBottom: '1px solid #e5e5ea',
        }}>
          <div style={{
            maxWidth: 1200, margin: '0 auto',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 24px',
          }}>
            <div>
              <div style={{ fontSize: 12, color: '#6e6e73', marginBottom: 4 }}>Good morning,</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#1d1d1f', fontFamily: '"Inter Tight", sans-serif' }}>
                {patient?.name || 'Your profile'}
              </div>
              <div style={{ fontSize: 12, color: '#6e6e73', marginTop: 2 }}>{patient?.condition || 'Recovery plan'}</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ScoreBadge score={patient?.score ?? 0} size={40} />
                <div>
                  <div style={{ fontSize: 12, color: '#6e6e73' }}>Overall score</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f' }}>
                    {(patient?.score ?? 0) >= 75 ? 'Great progress' : (patient?.score ?? 0) >= 50 ? 'Keep going' : 'Needs work'}
                  </div>
                </div>
              </div>
              <div style={{ width: 1, height: 34, background: '#e5e5ea' }} />
              <div>
                <div style={{ fontSize: 12, color: '#6e6e73' }}>Streak</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#34c759' }}>{patient?.streak ?? 0} days 🔥</div>
              </div>
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  navigate('/login')
                }}
                style={{
                  fontSize: 12, color: '#6e6e73',
                  background: 'none', border: '1px solid #d2d2d7',
                  borderRadius: 10, padding: '6px 10px', cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#ff3b30'}
                onMouseLeave={e => e.currentTarget.style.color = '#6e6e73'}
              >
                Log out
              </button>
            </div>
          </div>
        </header>

        <div style={{ padding: '24px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {error && (
            <div style={{
              background: '#ff3b3010', border: '1px solid #ff3b3030',
              borderRadius: 12, padding: '12px 16px',
              fontSize: 13, color: '#ff3b30', lineHeight: 1.5,
            }}>
              {error}
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', color: '#6e6e73', fontSize: 14 }}>
              Loading your plan...
            </div>
          )}

          {/* Today's exercises */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontSize: 19, fontWeight: 600, color: '#1d1d1f', margin: 0 }}>Today's exercises</h2>
              <span style={{ fontSize: 14, color: '#6e6e73' }}>{patientExercises.length} assigned</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {patientExercises.map(ex => (
                <Card key={ex.id} onClick={() => navigate(`/patient/exercise/${ex.id}`)} style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 20, right: 20 }}>
                    <StatusBadge status={ex.status} />
                  </div>

                  <div style={{ paddingRight: 120 }}>
                    <div style={{ fontSize: 19, fontWeight: 600, color: '#1d1d1f', marginBottom: 4 }}>{ex.name}</div>
                    <div style={{ fontSize: 14, color: '#6e6e73', marginBottom: 8 }}>{ex.duration}</div>
                    <div style={{
                      fontSize: 14, color: '#6e6e73',
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      lineHeight: 1.4
                    }}>
                      {ex.instructions}
                    </div>
                  </div>

                  <div style={{
                    marginTop: 16, paddingTop: 12, borderTop: '1px solid #d2d2d7',
                    fontSize: 12, color: '#0071e3', fontWeight: 600
                  }}>
                    Tap to start →
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Progress chart */}
          <section>
            <h2 style={{ fontSize: 19, fontWeight: 600, color: '#1d1d1f', marginBottom: 12 }}>Your progress</h2>
            <Card>
              <div style={{ fontSize: 14, color: '#6e6e73', marginBottom: 16 }}>Score over last 7 days</div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData}>
                  <CartesianGrid stroke="#d2d2d7" strokeDasharray="3 3" strokeOpacity={0.4} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6e6e73' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#6e6e73' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #d2d2d7', borderRadius: 8, fontSize: 12 }}
                  />
                  <Line
                    type="monotone" dataKey="score" stroke="#0071e3" strokeWidth={2}
                    dot={{ fill: '#fff', stroke: '#0071e3', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </section>
        </div>

        <PatientBottomNav />
      </div>
    </PatientApprovalGate>
  )
}
