import React, { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DoctorHeader from '../../components/DoctorHeader.jsx'
import DoctorBottomNav from '../../components/DoctorBottomNav.jsx'
import { Card, BtnPrimary, BtnOutline } from '../../components/UI.jsx'
import { supabase } from '../../lib/supabase.js'
import { AuthContext } from '../../App.jsx'

export default function DoctorAssignExercise() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const [patient, setPatient] = useState(null)
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [filterCat, setFilterCat] = useState('All')
  const [assigned, setAssigned] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadData() {
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

      const { data: profileRow, error: profileError } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('id', id)
        .maybeSingle()

      if (profileError) {
        if (isMounted) {
          setError(profileError.message)
          setLoading(false)
        }
        return
      }

      const { data: patientRow, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', id)
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

      let ensuredPatient = patientRow
      if (!patientRow) {
        const { data: createdRow, error: createError } = await supabase
          .from('patients')
          .insert({
            user_id: id,
            doctor_id: user.id,
            name: profileRow?.name || 'New patient',
            condition: 'Recovery plan',
            age: null,
            score: 0,
            streak: 0,
            progress: [],
          })
          .select('*')
          .maybeSingle()

        if (createError) {
          if (isMounted) {
            setError(createError.message)
            setLoading(false)
          }
          return
        }

        ensuredPatient = createdRow
      }

      const { data: exerciseRows, error: exerciseError } = await supabase
        .from('exercises')
        .select('*')
        .order('name', { ascending: true })

      if (exerciseError) {
        if (isMounted) {
          setError(exerciseError.message)
          setLoading(false)
        }
        return
      }

      if (isMounted) {
        setPatient(ensuredPatient)
        setExercises(exerciseRows || [])
        setLoading(false)
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [user, id])

  const categories = ['All', ...new Set(exercises.map(e => e.category))]
  const filtered = filterCat === 'All' ? exercises : exercises.filter(e => e.category === filterCat)

  function toggle(exId) {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(exId) ? n.delete(exId) : n.add(exId)
      return n
    })
  }

  function handleAssign() {
    if (!patient?.id || selected.size === 0) return
    setAssigned(true)

    const rows = Array.from(selected).map(exerciseId => ({
      patient_id: patient.id,
      exercise_id: exerciseId,
      status: 'pending',
    }))

    supabase
      .from('patient_exercises')
      .upsert(rows, { onConflict: 'patient_id,exercise_id' })
      .then(({ error: insertError }) => {
        if (insertError) {
          setError(insertError.message)
          setAssigned(false)
          return
        }
        setTimeout(() => navigate(`/doctor/patient/${id}`), 800)
      })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f7', paddingBottom: 88 }}>
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

        {loading && (
          <div style={{ textAlign: 'center', color: '#6e6e73', fontSize: 14, padding: '12px 0' }}>
            Loading exercises...
          </div>
        )}

        <button onClick={() => navigate(`/doctor/patient/${id}`)} style={{
          background: 'none', border: 'none', color: '#0071e3',
          fontSize: 14, cursor: 'pointer', marginBottom: 24, padding: 0,
        }}>
          ← Back to {patient?.name}
        </button>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 600, color: '#1d1d1f', fontFamily: '"Inter Tight", sans-serif', margin: 0 }}>
            Assign exercises
          </h1>
          <p style={{ fontSize: 17, color: '#6e6e73', marginTop: 8 }}>
            Select exercises for {patient?.name}'s rehabilitation program
          </p>
        </div>

        {/* Category filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)} style={{
              background: filterCat === cat ? '#0071e3' : '#fff',
              color: filterCat === cat ? '#fff' : '#1d1d1f',
              border: `1px solid ${filterCat === cat ? '#0071e3' : '#d2d2d7'}`,
              borderRadius: 980, padding: '6px 16px',
              fontSize: 14, fontWeight: filterCat === cat ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>{cat}</button>
          ))}
        </div>

        {/* Exercise list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
          {filtered.map(ex => {
            const isSelected = selected.has(ex.id)
            return (
              <div key={ex.id} onClick={() => toggle(ex.id)} style={{
                background: isSelected ? '#0071e308' : '#fff',
                border: `1px solid ${isSelected ? '#0071e3' : '#d2d2d7'}`,
                borderRadius: 18, padding: 20, cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                {/* Checkbox */}
                <div style={{
                  width: 22, height: 22, borderRadius: 6,
                  border: `2px solid ${isSelected ? '#0071e3' : '#d2d2d7'}`,
                  background: isSelected ? '#0071e3' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all 0.15s',
                }}>
                  {isSelected && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <div style={{ fontSize: 19, fontWeight: 600, color: '#1d1d1f' }}>{ex.name}</div>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: '#6e6e73',
                      background: '#f5f5f7', borderRadius: 980, padding: '2px 10px',
                    }}>{ex.category}</span>
                  </div>
                  <div style={{ fontSize: 14, color: '#6e6e73' }}>{ex.duration} · {ex.difficulty}</div>
                  <div style={{ fontSize: 14, color: '#86868b', marginTop: 4, lineHeight: 1.4 }}>
                    {ex.instructions.slice(0, 100)}...
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Sticky bottom bar */}
        <div style={{
          position: 'sticky', bottom: 0,
          background: '#f5f5f7', paddingTop: 16, paddingBottom: 24,
          borderTop: '1px solid #d2d2d7', marginTop: 8,
          display: 'flex', gap: 12, alignItems: 'center',
        }}>
          <BtnOutline onClick={() => navigate(`/doctor/patient/${id}`)}>Cancel</BtnOutline>
          <BtnPrimary
            onClick={handleAssign}
            style={{ opacity: selected.size === 0 || assigned ? 0.4 : 1 }}
          >
            {assigned ? 'Assigning…' : `Assign ${selected.size > 0 ? selected.size : ''} exercise${selected.size !== 1 ? 's' : ''}`}
          </BtnPrimary>
          {selected.size > 0 && (
            <span style={{ fontSize: 14, color: '#6e6e73' }}>
              {selected.size} selected
            </span>
          )}
        </div>
      </main>
      <DoctorBottomNav />
    </div>
  )
}
