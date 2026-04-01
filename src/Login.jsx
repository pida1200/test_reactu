import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getUsername, setUsername } from './auth.js'
import './App.css'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsernameInput] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    const existing = getUsername()
    if (existing) {
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }, [location.state, navigate])

  const handleSubmit = (e) => {
    e.preventDefault()
    const v = username.trim()
    if (!v) {
      setError('Zadej user name.')
      return
    }
    setError(null)
    setUsername(v)
    const from = location.state?.from?.pathname || '/'
    navigate(from, { replace: true })
  }

  return (
    <main className="main login-page">
      <div className="main-content">
        <h2 className="page-title">Přihlášení</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-label" htmlFor="username">
            User name
          </label>
          <input
            id="username"
            className="login-input"
            value={username}
            onChange={(e) => setUsernameInput(e.target.value)}
            autoComplete="nickname"
            inputMode="text"
            placeholder="např. zdenek"
            autoFocus
          />
          {error && <p className="error">{error}</p>}
          <div className="login-actions">
            <button type="submit" className="btn-primary">
              Přihlásit
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

