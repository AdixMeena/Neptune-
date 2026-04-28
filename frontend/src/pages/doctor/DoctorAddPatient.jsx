import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DoctorHeader from '../../components/DoctorHeader.jsx'
import DoctorBottomNav from '../../components/DoctorBottomNav.jsx'
import { Card, BtnPrimary, BtnOutline, Input } from '../../components/UI.jsx'
import { supabase } from '../../lib/supabase.js'
import { AuthContext } from '../../App.jsx'

export default function DoctorAddPatient() {
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const [patients, setPatients] = useState([])
  const [connections, setConnections] = useState({})
  const [selectedId, setSelectedId] = useState('')
  const [name, setName] = useState('')
  const [condition, setCondition] = useState('')
  const [age, setAge] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadPatients() {
      if (!user) return
      setLoading(true)
      setError('')

      const { data: profileRows, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, specialization, role')
        .eq('role', 'patient')
        .order('name', { ascending: true })

      if (profileError) {
        if (isMounted) {
          setError(profileError.message)
          setLoading(false)
        }
        return
      }

      const { data: connectionRows, error: connectionError } = await supabase
        .from('connections')
        .select('patient_id, status')
        .eq('doctor_id', user.id)

      if (connectionError) {
        if (isMounted) {
          setError(connectionError.message)
          setLoading(false)
        }
        return
      }

      const statusMap = {}
      ;(connectionRows || []).forEach(row => {
        statusMap[row.patient_id] = row.status
      })

      if (isMounted) {
        setPatients(profileRows || [])
        setConnections(statusMap)
        setLoading(false)
      }
    }

    loadPatients()

    return () => {
      isMounted = false
    }
  }, [user])

  async function handleSave(e) {
    e.preventDefault()
    if (!selectedId || !user) {
      setError('Select a patient to connect.')
      return
    }

    setSaving(true)
    setError('')

    const profile = patients.find(p => p.id === selectedId)
    const trimmedName = name.trim() || profile?.name || 'New patient'
    const trimmedCondition = condition.trim() || 'Recovery plan'
    const parsedAge = age ? Number(age) : null

    const { data: existingRow, error: existingError } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', selectedId)
      .maybeSingle()

    if (existingError) {
      setError(existingError.message)
      setSaving(false)
      return
    }

    if (existingRow?.id) {
      const { error: updateError } = await supabase
        .from('patients')
        .update({
          doctor_id: user.id,
          name: trimmedName,
          condition: trimmedCondition,
          age: parsedAge,
        })
        .eq('id', existingRow.id)

      if (updateError) {
        setError(updateError.message)
        setSaving(false)
        return
      }
    } else {
      const { error: insertError } = await supabase
        .from('patients')
        .insert({
          user_id: selectedId,
          doctor_id: user.id,
          name: trimmedName,
          condition: trimmedCondition,
          age: parsedAge,
          score: 0,
          streak: 0,
          progress: [],
        })

      if (insertError) {
        setError(insertError.message)
        setSaving(false)
        return
      }
    }

    const { error: connectionError } = await supabase
      .from('connections')
      .upsert({ patient_id: selectedId, doctor_id: user.id, status: 'approved' }, { onConflict: 'patient_id,doctor_id' })

    if (connectionError) {
      setError(connectionError.message)
      setSaving(false)
      return
    }

    navigate('/doctor')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f7', paddingBottom: 88 }}>
      <DoctorHeader />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 48px' }}>
        <button onClick={() => navigate('/doctor')} style={{
          background: 'none', border: 'none', color: '#0071e3',
          fontSize: 14, cursor: 'pointer', marginBottom: 24, padding: 0,
        }}>
          ← Back to patients
        </button>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 32, fontWeight: 600, color: '#1d1d1f', fontFamily: '"Inter Tight", sans-serif', margin: 0 }}>
            Add patient
          </h1>
          <p style={{ fontSize: 16, color: '#6e6e73', marginTop: 8 }}>
            Connect an existing patient account to your dashboard and create their plan.
          </p>
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

        <Card>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 14, color: '#6e6e73', fontWeight: 400 }}>Select patient</label>
              <select
                value={selectedId}
                onChange={(e) => {
                  setSelectedId(e.target.value)
                  const match = patients.find(p => p.id === e.target.value)
                  if (match && !name.trim()) setName(match.name || '')
                }}
                style={{
                  marginTop: 6, width: '100%',
                  background: '#fff', border: '1px solid #d2d2d7',
                  borderRadius: 12, padding: '12px 16px',
                  fontSize: 16, color: '#1d1d1f',
                }}
              >
                <option value="">Choose a patient</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {connections[p.id] === 'approved' ? ' (connected)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Patient name"
              placeholder="Jane Doe"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <Input
              label="Condition"
              placeholder="ACL Reconstruction Recovery"
              value={condition}
              onChange={e => setCondition(e.target.value)}
            />
            <Input
              label="Age"
              type="number"
              placeholder="32"
              value={age}
              onChange={e => setAge(e.target.value)}
            />

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <BtnOutline onClick={() => navigate('/doctor')}>Cancel</BtnOutline>
              <BtnPrimary
                style={{ opacity: saving ? 0.6 : 1 }}
                onClick={handleSave}
              >
                {saving ? 'Saving...' : 'Add patient'}
              </BtnPrimary>
            </div>
          </form>

          {loading && (
            <div style={{ marginTop: 12, fontSize: 13, color: '#6e6e73' }}>Loading patient list...</div>
          )}
        </Card>
      </main>
      <DoctorBottomNav />
    </div>
  )
}
