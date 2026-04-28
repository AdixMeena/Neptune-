import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './LandingPage.css'

export default function LandingPage() {
  const navigate = useNavigate()
  const rootRef = useRef(null)

  useEffect(() => {
    document.body.classList.add('landing-body')
    return () => document.body.classList.remove('landing-body')
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return () => {}

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    }, { threshold: 0.12 })

    root.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el))

    const stats = [
      { el: 'stat1', target: 34, suffix: '%' },
      { el: 'stat2', target: 50, suffix: '+' },
      { el: 'stat3', target: 80, suffix: 'ms' },
      { el: 'stat4', target: 10, suffix: 'x' },
    ]

    const statObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        const stat = stats.find(s => s.el === entry.target.id)
        if (!stat || entry.target.dataset.counted) return
        entry.target.dataset.counted = '1'

        const duration = 1800
        const startTime = performance.now()

        function tick(now) {
          const elapsed = now - startTime
          const progress = Math.min(elapsed / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          const current = Math.round(eased * stat.target)
          entry.target.innerHTML = `${current}<span>${stat.suffix}</span>`
          if (progress < 1) requestAnimationFrame(tick)
        }

        requestAnimationFrame(tick)
        statObserver.unobserve(entry.target)
      })
    }, { threshold: 0.5 })

    stats.forEach(s => {
      const el = root.querySelector(`#${s.el}`)
      if (el) statObserver.observe(el)
    })

    const nav = root.querySelector('nav')
    const onScroll = () => {
      if (!nav) return
      if (window.scrollY > 60) {
        nav.style.background = 'rgba(255,255,255,0.95)'
        nav.style.boxShadow = '0 1px 12px rgba(0,0,0,0.08)'
      } else {
        nav.style.background = 'rgba(255,255,255,0.82)'
        nav.style.boxShadow = 'none'
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    const scoreEl = root.querySelector('.score-live')
    const scores = [78, 82, 85, 84, 87, 83, 88]
    let si = 0
    const scoreInterval = setInterval(() => {
      if (!scoreEl) return
      si = (si + 1) % scores.length
      const score = scores[si]
      scoreEl.innerHTML = `<span class="score-live-lbl">Score</span>${score}`
      scoreEl.style.color = score >= 80 ? '#34c759' : '#ff9f0a'
    }, 2000)

    return () => {
      revealObserver.disconnect()
      statObserver.disconnect()
      window.removeEventListener('scroll', onScroll)
      clearInterval(scoreInterval)
    }
  }, [])

  return (
    <div className="landing" ref={rootRef}>
      <nav>
        <div className="nav-logo">Phoenix-AI</div>
        <ul className="nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#how">How it works</a></li>
          <li><a href="#roles">For you</a></li>
        </ul>
        <div className="nav-right">
          <button className="nav-login" onClick={() => navigate('/login')}>Log in</button>
          <button className="nav-cta" onClick={() => navigate('/login')}>Get started</button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-glow"></div>
        <div className="hero-rings">
          <div className="ring ring-1"><div className="ring-dot"></div></div>
          <div className="ring ring-2"></div>
          <div className="ring ring-3"></div>
        </div>

        <div className="hero-eyebrow">
          <div className="eyebrow-dot"></div>
          AI-powered physiotherapy - now live
        </div>

        <h1 className="hero-title">
          Rehabilitation,<br />
          <em>reimagined</em> with<br />
          <span>AI precision</span>
        </h1>

        <p className="hero-sub">
          Phoenix-AI uses real-time pose detection to guide patients through exercises with millimeter precision, giving doctors live data and patients the confidence to heal.
        </p>

        <div className="hero-actions">
          <button className="btn-primary" onClick={() => navigate('/login')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Start for free
          </button>
          <button className="btn-outline" onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}>
            See how it works
          </button>
        </div>

        <div className="hero-visual reveal">
          <div className="dashboard-mock">
            <div className="dash-top-bar">
              <div className="dot dot-r"></div>
              <div className="dot dot-y"></div>
              <div className="dot dot-g"></div>
            </div>
            <div className="dash-body">
              <div className="dash-sidebar">
                <div className="dash-logo">Phoenix-AI</div>
                <div className="dash-nav-item active">
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0071e3', flexShrink: 0 }}></div>
                  Patients
                </div>
                <div className="dash-nav-item"><div className="dash-nav-dot"></div> Exercises</div>
                <div className="dash-nav-item"><div className="dash-nav-dot"></div> Analytics</div>
                <div className="dash-nav-item"><div className="dash-nav-dot"></div> Messages</div>
              </div>
              <div className="dash-content">
                <div className="dash-stat-row">
                  <div className="dash-stat">
                    <div className="dash-stat-val">5</div>
                    <div className="dash-stat-lbl">Patients</div>
                    <div className="dash-stat-trend">Up active today</div>
                  </div>
                  <div className="dash-stat">
                    <div className="dash-stat-val" style={{ color: '#34c759' }}>82</div>
                    <div className="dash-stat-lbl">Avg score</div>
                    <div className="dash-stat-trend">Up 4 pts</div>
                  </div>
                  <div className="dash-stat">
                    <div className="dash-stat-val">3</div>
                    <div className="dash-stat-lbl">Sessions today</div>
                  </div>
                </div>
                <div className="dash-cards-row">
                  <div className="dash-card" style={{ flex: 1.4 }}>
                    <div className="dash-card-title">Arjun Mehta</div>
                    <div className="dash-card-sub">ACL Reconstruction | 7 day streak</div>
                    <div className="score-badge" style={{ background: '#34c759' }}>82</div>
                    <div className="sparkline">
                      <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <polyline points="0,35 20,28 40,30 60,18 80,12 100,8 120,4" stroke="#0071e3" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="120" cy="4" r="3" fill="#fff" stroke="#0071e3" strokeWidth="1.5" />
                      </svg>
                    </div>
                  </div>
                  <div className="dash-card">
                    <div className="dash-card-title">Priya Sharma</div>
                    <div className="dash-card-sub">Rotator Cuff</div>
                    <div className="score-badge" style={{ background: '#ff9f0a', top: 12, right: 12, fontSize: 11 }}>64</div>
                  </div>
                  <div className="skeleton-card">
                    <div className="scan-line"></div>
                    <svg className="phone-skeleton-svg" viewBox="0 0 80 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <line x1="40" y1="24" x2="40" y2="60" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
                      <line x1="40" y1="38" x2="22" y2="52" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
                      <line x1="40" y1="38" x2="58" y2="52" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
                      <line x1="22" y1="52" x2="16" y2="68" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
                      <line x1="58" y1="52" x2="64" y2="68" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
                      <line x1="40" y1="60" x2="32" y2="80" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
                      <line x1="40" y1="60" x2="48" y2="80" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
                      <line x1="32" y1="80" x2="30" y2="100" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
                      <line x1="48" y1="80" x2="50" y2="100" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
                      <circle cx="40" cy="16" r="4" fill="#34c759" />
                      <circle cx="40" cy="38" r="3.5" fill="#34c759" />
                      <circle cx="22" cy="52" r="3" fill="#34c759" />
                      <circle cx="58" cy="52" r="3" fill="#34c759" />
                      <circle cx="32" cy="80" r="3" fill="#34c759" />
                      <circle cx="48" cy="80" r="3" fill="#34c759" />
                      <circle cx="16" cy="68" r="3" fill="#ff3b30" />
                      <circle cx="64" cy="68" r="3" fill="#ff9f0a" />
                      <circle cx="30" cy="100" r="3" fill="#34c759" />
                      <circle cx="50" cy="100" r="3" fill="#34c759" />
                    </svg>
                    <div className="score-live">
                      <span className="score-live-lbl">Score</span>
                      84
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="stats-band">
        <div className="stat-item reveal">
          <div className="stat-num" id="stat1">0<span>%</span></div>
          <div className="stat-desc">Average recovery score improvement after 4 weeks</div>
        </div>
        <div className="stat-item reveal reveal-delay-1">
          <div className="stat-num" id="stat2">0<span>+</span></div>
          <div className="stat-desc">Exercises with AI joint angle detection</div>
        </div>
        <div className="stat-item reveal reveal-delay-2">
          <div className="stat-num" id="stat3">0<span>ms</span></div>
          <div className="stat-desc">Real-time pose feedback latency</div>
        </div>
        <div className="stat-item reveal reveal-delay-3">
          <div className="stat-num" id="stat4">0<span>x</span></div>
          <div className="stat-desc">More data per session vs traditional physiotherapy</div>
        </div>
      </div>

      <section className="features-section" id="features">
        <div className="features-header">
          <div className="section-eyebrow reveal">Everything you need</div>
          <h2 className="section-title reveal reveal-delay-1">Built for real recovery,<br />not just metrics</h2>
          <p className="section-sub reveal reveal-delay-2">Every feature is designed around one goal: helping patients heal faster and giving doctors the tools to make it happen.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card big reveal">
            <div className="feature-icon blue">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M6 20v-2a6 6 0 0 1 12 0v2" />
                <path d="M2 12h2M20 12h2M12 2v2M12 20v2" />
              </svg>
            </div>
            <div className="feature-title">Real-time AI pose detection</div>
            <div className="feature-desc">Powered by MediaPipe, Phoenix-AI tracks 33 body landmarks at 30 fps. Each joint is scored individually, giving patients instant feedback on form without needing a doctor in the room.</div>
            <div className="feature-visual">
              <div className="joint-row">
                <div className="joint-name">Left knee</div>
                <div className="joint-bar-bg"><div className="joint-bar-fill" style={{ width: '91%', background: '#28a745' }}></div></div>
                <div className="joint-score-lbl" style={{ color: '#28a745' }}>91</div>
              </div>
              <div className="joint-row">
                <div className="joint-name">Right knee</div>
                <div className="joint-bar-bg"><div className="joint-bar-fill" style={{ width: '88%', background: '#28a745' }}></div></div>
                <div className="joint-score-lbl" style={{ color: '#28a745' }}>88</div>
              </div>
              <div className="joint-row">
                <div className="joint-name">Hip alignment</div>
                <div className="joint-bar-bg"><div className="joint-bar-fill" style={{ width: '72%', background: '#e08a00' }}></div></div>
                <div className="joint-score-lbl" style={{ color: '#e08a00' }}>72</div>
              </div>
              <div className="joint-row">
                <div className="joint-name">Core posture</div>
                <div className="joint-bar-bg"><div className="joint-bar-fill" style={{ width: '65%', background: '#e08a00' }}></div></div>
                <div className="joint-score-lbl" style={{ color: '#e08a00' }}>65</div>
              </div>
            </div>
          </div>

          <div className="feature-card reveal reveal-delay-1">
            <div className="feature-icon green">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#28a745" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div className="feature-title">Session score and history</div>
            <div className="feature-desc">Every session is scored 0 to 100 and saved. Doctors and patients both see the trend over time, turning vague improvement into hard data.</div>
          </div>

          <div className="feature-card reveal">
            <div className="feature-icon amber">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e08a00" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="feature-title">Doctor-patient management</div>
            <div className="feature-desc">Doctors assign exercises, monitor compliance, and send targeted feedback, all from a single clean dashboard.</div>
          </div>

          <div className="feature-card reveal reveal-delay-1">
            <div className="feature-icon teal">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00a3c4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="feature-title">Real-time doctor feedback</div>
            <div className="feature-desc">Doctors send annotated feedback directly to patients after reviewing session data. Patients see unread messages instantly.</div>
          </div>

          <div className="feature-card reveal">
            <div className="feature-icon purple">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a044ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <div className="feature-title">Structured exercise library</div>
            <div className="feature-desc">A growing library of physiotherapy exercises with video demos, joint targets, and difficulty levels, ready to assign in seconds.</div>
          </div>

          <div className="feature-card reveal reveal-delay-1">
            <div className="feature-icon red">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d93025" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div className="feature-title">Progress streaks and adherence</div>
            <div className="feature-desc">Patients build daily streaks. Doctors see at-a-glance who is falling behind and who is crushing their recovery goals.</div>
          </div>
        </div>
      </section>

      <section className="how-section" id="how">
        <div className="how-inner">
          <div>
            <div className="section-eyebrow reveal">How it works</div>
            <h2 className="section-title reveal reveal-delay-1">Three steps.<br />Endless recovery.</h2>
            <div className="how-steps">
              <div className="how-step reveal reveal-delay-2">
                <div className="how-step-num">1</div>
                <div className="how-step-body">
                  <div className="how-step-title">Doctor assigns the program</div>
                  <div className="how-step-desc">From the dashboard, your physiotherapist selects exercises, sets targets, and writes personalized instructions for your exact condition.</div>
                </div>
              </div>
              <div className="how-step reveal reveal-delay-3">
                <div className="how-step-num">2</div>
                <div className="how-step-body">
                  <div className="how-step-title">Patient starts the session</div>
                  <div className="how-step-desc">Open your phone camera. Phoenix-AI's AI overlays a live skeleton on your body, scoring each joint angle in real time and coaching your form.</div>
                </div>
              </div>
              <div className="how-step reveal reveal-delay-4">
                <div className="how-step-num">3</div>
                <div className="how-step-body">
                  <div className="how-step-title">Data flows back to your doctor</div>
                  <div className="how-step-desc">Session scores, rep counts, joint performance, and trends are automatically saved, giving your doctor a complete picture between appointments.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="reveal reveal-delay-2">
            <div className="phone-mock">
              <div className="phone-frame">
                <div className="phone-notch"></div>
                <div className="phone-screen">
                  <div className="phone-cam-view">
                    <div className="scan-line"></div>
                    <svg className="phone-skeleton-svg" viewBox="0 0 100 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <line x1="50" y1="35" x2="50" y2="95" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
                      <line x1="50" y1="60" x2="28" y2="78" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
                      <line x1="50" y1="60" x2="72" y2="78" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
                      <line x1="28" y1="78" x2="20" y2="105" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
                      <line x1="72" y1="78" x2="80" y2="105" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
                      <line x1="50" y1="95" x2="40" y2="135" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
                      <line x1="50" y1="95" x2="60" y2="135" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
                      <line x1="40" y1="135" x2="38" y2="170" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
                      <line x1="60" y1="135" x2="62" y2="170" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
                      <circle cx="50" cy="22" r="7" fill="#34c759" />
                      <circle cx="50" cy="60" r="5" fill="#34c759" />
                      <circle cx="28" cy="78" r="4.5" fill="#34c759" />
                      <circle cx="72" cy="78" r="4.5" fill="#34c759" />
                      <circle cx="20" cy="105" r="4" fill="#ff3b30" style={{ filter: 'drop-shadow(0 0 4px #ff3b30)' }} />
                      <circle cx="80" cy="105" r="4" fill="#34c759" />
                      <circle cx="40" cy="135" r="4" fill="#34c759" />
                      <circle cx="60" cy="135" r="4" fill="#34c759" />
                      <circle cx="38" cy="170" r="4" fill="#34c759" />
                      <circle cx="62" cy="170" r="4" fill="#ff9f0a" />
                    </svg>
                    <div className="phone-top-bar">
                      <span style={{ color: '#fff', fontWeight: 600, fontSize: 9 }}>Knee flexion stretch</span>
                      <span style={{ color: '#6e6e73', fontSize: 9 }}>01:24</span>
                    </div>
                    <div className="phone-score-card">
                      <span style={{ fontSize: 8, color: '#6e6e73', display: 'block' }}>Score</span>
                      <div className="phone-score-num">84</div>
                    </div>
                  </div>

                  <div className="phone-bottom-section">
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Today's exercises</div>
                    <div className="phone-ex-card">
                      <span className="phone-status status-green">Done</span>
                      <div className="phone-ex-title">Knee flexion stretch</div>
                      <div className="phone-ex-sub">3 sets x 12 reps</div>
                    </div>
                    <div className="phone-ex-card">
                      <span className="phone-status status-amber">Pending</span>
                      <div className="phone-ex-title">Straight leg raise</div>
                      <div className="phone-ex-sub">3 sets x 10 reps</div>
                    </div>
                    <div className="phone-ex-card">
                      <div className="phone-ex-title">Terminal knee ext.</div>
                      <div className="phone-ex-sub">2 sets x 15 reps</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="roles-section" id="roles">
        <div className="section-eyebrow reveal" style={{ textAlign: 'center' }}>Built for both sides</div>
        <h2 className="section-title reveal reveal-delay-1" style={{ textAlign: 'center', margin: '0 auto 0' }}>One app.<br />Two powerful dashboards.</h2>

        <div className="roles-grid">
          <div className="role-card doctor-card reveal">
            <div className="role-tag">For physiotherapists</div>
            <div className="role-title">Command your patients' recovery</div>
            <div className="role-desc">A desktop-optimized dashboard built for clinical precision. See all your patients at a glance, drill into session data, and assign exercises in seconds.</div>
            <ul className="role-features">
              <li>
                <div className="check-icon">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#28a745" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                Live score tracking across all patients
              </li>
              <li>
                <div className="check-icon">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#28a745" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                7-day progress charts per patient
              </li>
              <li>
                <div className="check-icon">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#28a745" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                Assign exercises from the full library
              </li>
              <li>
                <div className="check-icon">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#28a745" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                Send direct annotated feedback
              </li>
              <li>
                <div className="check-icon">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#28a745" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                Compliance alerts and streak monitoring
              </li>
            </ul>
          </div>

          <div className="role-card patient-card reveal reveal-delay-2">
            <div className="role-tag">For patients</div>
            <div className="role-title">Heal with confidence, every day</div>
            <div className="role-desc">A mobile-first experience that guides you through exercises with AI coaching, so you never have to wonder if you're doing it right.</div>
            <ul className="role-features">
              <li>
                <div className="check-icon">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#28a745" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                AI camera session with live skeleton overlay
              </li>
              <li>
                <div className="check-icon">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#28a745" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                Per-joint score breakdown after every session
              </li>
              <li>
                <div className="check-icon">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#28a745" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                Personalized exercise program from your doctor
              </li>
              <li>
                <div className="check-icon">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#28a745" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                Daily streak and long-term progress chart
              </li>
              <li>
                <div className="check-icon">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#28a745" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                Read feedback from your physiotherapist
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-glow"></div>
        <h2 className="cta-title reveal">
          Your recovery starts<br />here.
        </h2>
        <p className="cta-sub reveal reveal-delay-1">Join Phoenix-AI, free to start, no hardware needed.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }} className="reveal reveal-delay-2">
          <button className="btn-primary" onClick={() => navigate('/login')} style={{ fontSize: 16, padding: '16px 32px' }}>
            Get started free
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#adadb2', marginTop: 20 }} className="reveal reveal-delay-3">
          Works in your browser | No app download | No credit card
        </p>
      </section>

      <footer>
        <div>
          <div className="footer-logo">Phoenix-AI</div>
          <div className="footer-copy" style={{ marginTop: 6 }}>© 2025 Phoenix-AI. Rehabilitation, reimagined.</div>
        </div>
        <div className="footer-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Contact</a>
        </div>
      </footer>
    </div>
  )
}
