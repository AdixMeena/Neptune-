import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PatientApprovalGate from '../../components/PatientApprovalGate.jsx'
import { supabase } from '../../lib/supabase.js'

const POSE_CONNECTIONS = [
  [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 12], [11, 23], [12, 24],
  [23, 24], [23, 25], [25, 27], [24, 26], [26, 28],
  [27, 29], [28, 30], [29, 31], [30, 32],
]

export default function PatientCameraSession() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [exerciseName, setExerciseName] = useState('Exercise')
  const [feedback, setFeedback] = useState('Initializing...')
  const [landmarks, setLandmarks] = useState([])

  useEffect(() => {
    let isMounted = true

    async function loadExercise() {
      const { data } = await supabase
        .from('exercises')
        .select('name')
        .eq('id', Number(id))
        .maybeSingle()

      if (isMounted && data?.name) {
        setExerciseName(data.name)
      }
    }

    loadExercise()

    return () => {
      isMounted = false
    }
  }, [id])

  const [reps, setReps] = useState(0)
  const [score, setScore] = useState(0)
  const [timer, setTimer] = useState(0)
  const videoRef = useRef(null)
  const overlayRef = useRef(null)
  const captureRef = useRef(null)
  const wsRef = useRef(null)
  const sendTimerRef = useRef(null)
  const sessionIdRef = useRef(`${Date.now()}`)

  useEffect(() => {
    const t = setInterval(() => setTimer(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    let isMounted = true

    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
        if (!isMounted) return
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch (err) {
        setFeedback('Camera access denied')
      }
    }

    initCamera()

    return () => {
      isMounted = false
      const stream = videoRef.current?.srcObject
      if (stream?.getTracks) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    const wsBase = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'
    const wsUrl = `${wsBase}/ws/session/${sessionIdRef.current}?exercise_id=${id}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (Array.isArray(data.landmarks)) setLandmarks(data.landmarks)
        if (typeof data.session_score === 'number') setScore(data.session_score)
        if (data.rep_counted) setReps(r => r + 1)
        if (data.feedback) setFeedback(data.feedback)
      } catch (err) {
        setFeedback('Tracking error')
      }
    }

    ws.onclose = () => {
      setFeedback('Connection closed')
    }

    ws.onerror = () => {
      setFeedback('WebSocket error')
    }

    return () => {
      ws.close()
    }
  }, [id])

  useEffect(() => {
    const capture = () => {
      const video = videoRef.current
      const canvas = captureRef.current
      const ws = wsRef.current

      if (!video || !canvas || !ws || ws.readyState !== WebSocket.OPEN) return
      if (video.videoWidth === 0 || video.videoHeight === 0) return

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
      }

      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
      const base64 = dataUrl.split(',')[1]
      ws.send(JSON.stringify({ frame: base64 }))
    }

    sendTimerRef.current = setInterval(capture, 250)
    return () => clearInterval(sendTimerRef.current)
  }, [])

  useEffect(() => {
    const canvas = overlayRef.current
    const video = videoRef.current
    if (!canvas || !video) return

    const ctx = canvas.getContext('2d')
    const width = video.videoWidth || canvas.width
    const height = video.videoHeight || canvas.height

    canvas.width = width
    canvas.height = height

    ctx.clearRect(0, 0, width, height)

    if (!landmarks.length) return

    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.lineWidth = 2

    POSE_CONNECTIONS.forEach(([a, b]) => {
      const p1 = landmarks[a]
      const p2 = landmarks[b]
      if (!p1 || !p2) return
      ctx.beginPath()
      ctx.moveTo(p1.x * width, p1.y * height)
      ctx.lineTo(p2.x * width, p2.y * height)
      ctx.stroke()
    })

    landmarks.forEach(point => {
      const x = point.x * width
      const y = point.y * height
      ctx.beginPath()
      ctx.fillStyle = '#34c759'
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fill()
    })
  }, [landmarks])

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  function handleStop() {
    if (wsRef.current) wsRef.current.close()
    navigate('/patient/score', { state: { exerciseId: id, reps, score: Math.round(score), duration: timer } })
  }

  return (
    <PatientApprovalGate showNav={false}>
      <div style={{
        position: 'fixed', inset: 0,
        background: '#000', overflow: 'hidden',
        fontFamily: '"Inter", sans-serif',
      }}>
      <video
        ref={videoRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        playsInline
        muted
      />
      <canvas
        ref={overlayRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />
      <canvas ref={captureRef} style={{ display: 'none' }} />

      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        background: 'rgba(0,0,0,0.70)',
        padding: '48px 20px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>
          {exerciseName}
        </div>
        <div style={{ fontSize: 17, color: '#fff', fontWeight: 600, textAlign: 'center', flex: 1, padding: '0 16px' }}>
          {feedback}
        </div>
        <div style={{ fontSize: 14, color: '#6e6e73', minWidth: 50, textAlign: 'right' }}>
          {fmt(timer)}
        </div>
      </div>

      {/* Right floating score card */}
      <div style={{
        position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
        background: 'rgba(39,39,41,0.88)', borderRadius: 12,
        padding: '14px 12px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        minWidth: 70,
      }}>
        <div style={{ fontSize: 12, color: '#6e6e73' }}>Score</div>
        <div style={{
          fontSize: 32, fontWeight: 600,
          color: score >= 75 ? '#34c759' : score >= 50 ? '#ff9f0a' : '#ff3b30',
        }}>
          {Math.round(score)}
        </div>
        {/* Vertical progress bar */}
        <div style={{ width: 3, height: 80, background: 'rgba(255,255,255,0.1)', borderRadius: 2, position: 'relative' }}>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: `${score}%`, background: '#0071e3', borderRadius: 2,
            transition: 'height 0.5s ease',
          }} />
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'rgba(0,0,0,0.70)',
        padding: '20px 32px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Reps */}
        <div>
          <div style={{ fontSize: 12, color: '#6e6e73' }}>Reps</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: '#fff' }}>{reps}</div>
        </div>

        {/* Camera flip */}
        <button style={{
          width: 44, height: 44, borderRadius: '50%',
          background: '#272729', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </button>

        {/* Stop */}
        <button onClick={handleStop} style={{
          width: 56, height: 56, borderRadius: '50%',
          background: '#ff3b30', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.93)'}
        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ width: 16, height: 16, background: '#fff', borderRadius: 3 }} />
        </button>
      </div>
      </div>
    </PatientApprovalGate>
  )
}
