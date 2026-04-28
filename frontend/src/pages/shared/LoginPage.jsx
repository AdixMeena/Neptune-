import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, BtnPrimary } from '../../components/UI.jsx'
import { supabase } from '../../lib/supabase.js'
import { AuthContext } from '../../App.jsx'

export default function LoginPage() {
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)

  const [isSignUp, setIsSignUp]     = useState(false)
  const [role, setRole]             = useState('doctor')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [name, setName]             = useState('')
  const [specialization, setSpec]   = useState('Physiotherapist')
  
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [message, setMessage]       = useState('')

  async function handleAuth(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    if (isSignUp) {
      // ── SIGN UP ──
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            role,
            name: name.trim(),
            specialization: role === 'doctor' ? specialization : null,
          }
        }
      })
      setLoading(false)
      if (authError) {
        setError(authError.message)
      } else {
        if (data.session) {
          setMessage('Account created and logged in!')
        } else {
          setMessage('Check your email for the confirmation link!')
        }
      }
    } else {
      // ── LOGIN ──
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      setLoading(false)

      if (authError) {
        setError(authError.message)
        return
      }

      // Check role
      const userRole = data.user?.user_metadata?.role
      if (userRole && userRole !== role) {
        setError(`This account is registered as a ${userRole}. Please switch the toggle.`)
        await supabase.auth.signOut()
        return
      }
    }
  }

  async function handleGoogleLogin() {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      }
    })
    if (error) setError(error.message)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#000',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: '"Inter", sans-serif',
    }}>
      {/* Wordmark */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{
          fontSize: 56, fontWeight: 600, color: '#fff',
          fontFamily: '"Inter Tight", sans-serif',
          letterSpacing: '-0.28px', lineHeight: 1.07,
          margin: 0,
        }}>Phoenix-AI</h1>
        <p style={{ fontSize: 17, color: '#6e6e73', marginTop: 12, letterSpacing: '-0.374px' }}>
          Rehabilitation, reimagined
        </p>
      </div>

      {/* Auth card */}
      <div style={{
        background: '#fff', borderRadius: 24,
        padding: 40, width: '100%', maxWidth: 420,
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
      }}>
        <h2 style={{
          fontSize: 24, fontWeight: 600, color: '#1d1d1f',
          marginBottom: 24, fontFamily: '"Inter Tight", sans-serif',
        }}>
          {isSignUp ? 'Create account' : 'Sign in'}
        </h2>

        {/* Role toggle */}
        <div style={{
          display: 'flex', background: '#f5f5f7',
          borderRadius: 12, padding: 4, marginBottom: 24,
        }}>
          {['doctor', 'patient'].map(r => (
            <button key={r} onClick={() => { setRole(r); setError('') }} style={{
              flex: 1, padding: '10px 0', borderRadius: 10,
              background: role === r ? '#fff' : 'transparent',
              border: role === r ? '1px solid #d2d2d7' : '1px solid transparent',
              boxShadow: role === r ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              fontSize: 14, fontWeight: 600,
              color: role === r ? '#1d1d1f' : '#6e6e73',
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
              {r === 'doctor' ? 'Doctor' : 'Patient'}
            </button>
          ))}
        </div>

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {isSignUp && (
            <>
              <Input
                label="Full name"
                placeholder="John Doe"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
              {role === 'doctor' && (
                <Input
                  label="Specialization"
                  placeholder="Physiotherapist"
                  value={specialization}
                  onChange={e => setSpec(e.target.value)}
                  required
                />
              )}
            </>
          )}
          
          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          {error && (
            <div style={{
              background: '#ff3b3010', border: '1px solid #ff3b3030',
              borderRadius: 12, padding: '12px 16px',
              fontSize: 13, color: '#ff3b30', lineHeight: 1.5,
            }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{
              background: '#34c75910', border: '1px solid #34c75930',
              borderRadius: 12, padding: '12px 16px',
              fontSize: 13, color: '#34c759', lineHeight: 1.5,
            }}>
              {message}
            </div>
          )}

          <div style={{ marginTop: 8 }}>
            <BtnPrimary
              fullWidth
              style={{
                fontSize: 15, padding: '16px 24px',
                opacity: loading ? 0.6 : 1,
                pointerEvents: loading ? 'none' : 'auto',
                borderRadius: 12,
              }}
            >
              {loading
                ? (isSignUp ? 'Creating account...' : 'Signing in...')
                : (isSignUp ? 'Create account' : `Sign in to ${role === 'doctor' ? 'Doctor' : 'Patient'} Portal`)}
            </BtnPrimary>
          </div>
        </form>

        <div style={{
          display: 'flex', alignItems: 'center', margin: '24px 0',
          color: '#d2d2d7', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1
        }}>
          <div style={{ flex: 1, height: 1, background: '#f5f5f7' }} />
          <span style={{ padding: '0 12px' }}>or</span>
          <div style={{ flex: 1, height: 1, background: '#f5f5f7' }} />
        </div>

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          style={{
            width: '100%', padding: '14px 24px', borderRadius: 12,
            background: '#fff', border: '1px solid #d2d2d7',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            fontSize: 15, fontWeight: 500, color: '#1d1d1f',
            cursor: 'pointer', transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f5f5f7'}
          onMouseLeave={e => e.currentTarget.style.background = '#fff'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p style={{ fontSize: 14, color: '#1d1d1f', textAlign: 'center', marginTop: 24 }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage('') }}
            style={{
              background: 'none', border: 'none', color: '#0071e3',
              fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: 14,
            }}
          >
            {isSignUp ? 'Sign in' : 'Create one now'}
          </button>
        </p>
      </div>

      <p style={{ fontSize: 12, color: '#6e6e73', marginTop: 32 }}>
        Powered by AI pose detection
      </p>
    </div>
  )
}

