import React from 'react'

// --- BUTTONS ---
export function BtnPrimary({ children, onClick, fullWidth, style }) {
  return (
    <button onClick={onClick} style={{
      background: '#0071e3', color: '#fff',
      borderRadius: 980, padding: '12px 24px',
      fontSize: 14, fontWeight: 600, border: 'none',
      width: fullWidth ? '100%' : 'auto',
      cursor: 'pointer', transition: 'transform 0.1s, opacity 0.15s',
      ...style
    }}
    onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
    >{children}</button>
  )
}

export function BtnSecondary({ children, onClick, fullWidth, style }) {
  return (
    <button onClick={onClick} style={{
      background: '#1d1d1f', color: '#fff',
      borderRadius: 980, padding: '12px 24px',
      fontSize: 14, fontWeight: 600, border: 'none',
      width: fullWidth ? '100%' : 'auto',
      cursor: 'pointer', ...style
    }}
    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
    >{children}</button>
  )
}

export function BtnOutline({ children, onClick, fullWidth, style }) {
  return (
    <button onClick={onClick} style={{
      background: 'transparent', color: '#1d1d1f',
      borderRadius: 980, padding: '12px 24px',
      fontSize: 14, fontWeight: 600,
      border: '1px solid #1d1d1f',
      width: fullWidth ? '100%' : 'auto',
      cursor: 'pointer', ...style
    }}
    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
    >{children}</button>
  )
}

export function BtnDestructive({ children, onClick, style }) {
  return (
    <button onClick={onClick} style={{
      background: '#ff3b30', color: '#fff',
      borderRadius: 980, padding: '12px 24px',
      fontSize: 14, fontWeight: 600, border: 'none',
      cursor: 'pointer', ...style
    }}
    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
    >{children}</button>
  )
}

// --- SCORE BADGE ---
export function ScoreBadge({ score, size = 48 }) {
  const bg = score >= 75 ? '#34c759' : score >= 50 ? '#ff9f0a' : '#ff3b30'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 14, fontWeight: 600, flexShrink: 0
    }}>{score}</div>
  )
}

// --- STATUS BADGE ---
export function StatusBadge({ status }) {
  const map = {
    completed: { color: '#34c759', label: 'Completed today' },
    pending: { color: '#ff9f0a', label: 'Pending' },
    overdue: { color: '#ff3b30', label: 'Overdue' },
  }
  const s = map[status] || map.pending
  return (
    <span style={{
      background: s.color + '26',
      color: s.color,
      borderRadius: 980, padding: '4px 12px',
      fontSize: 12, fontWeight: 600,
      whiteSpace: 'nowrap'
    }}>{s.label}</span>
  )
}

// --- CARD ---
export function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: '#fff',
      borderRadius: 18,
      border: '1px solid #d2d2d7',
      padding: 20,
      cursor: onClick ? 'pointer' : 'default',
      transition: onClick ? 'opacity 0.15s' : undefined,
      ...style
    }}
    onMouseEnter={e => onClick && (e.currentTarget.style.opacity = '0.85')}
    onMouseLeave={e => onClick && (e.currentTarget.style.opacity = '1')}
    >{children}</div>
  )
}

// --- INPUT ---
export function Input({ label, type = 'text', placeholder, value, onChange, style }) {
  const [focused, setFocused] = React.useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && <label style={{ fontSize: 14, color: '#6e6e73', fontWeight: 400 }}>{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          background: '#fff',
          border: `1px solid ${focused ? '#0071e3' : '#86868b'}`,
          borderRadius: 12, padding: '12px 16px',
          fontSize: 17, color: '#1d1d1f',
          width: '100%', outline: 'none',
          transition: 'border-color 0.15s',
        }}
      />
    </div>
  )
}
