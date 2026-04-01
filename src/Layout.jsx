import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import pkg from '../package.json'
import './App.css'
import { clearUsername, getUsername, subscribeAuthChange } from './auth.js'

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState(() => getUsername())

  useEffect(() => {
    return subscribeAuthChange(() => setUsername(getUsername()))
  }, [])

  useEffect(() => {
    if (!username) {
      navigate('/login', { replace: true, state: { from: location } })
    }
  }, [location, navigate, username])

  const userLabel = useMemo(() => username || '', [username])

  return (
    <div className="layout">
      <header className="header">
        <div className="header-left">
          <h1 className="header-title">Moje první aplikace v Reactu</h1>
          <nav className="nav">
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
              Přehled
            </NavLink>
            <NavLink to="/parametrizace" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Parametrizace akcií
            </NavLink>
            <NavLink to="/graf" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Graf akcií
            </NavLink>
            <NavLink to="/log" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Log
            </NavLink>
            <NavLink to="/demo" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Demo komponenty
            </NavLink>
          </nav>
        </div>
        <div className="header-right">
          {userLabel && (
            <div className="header-user">
              <span className="header-user-label">User:</span> <span className="header-user-name">{userLabel}</span>
            </div>
          )}
          <button type="button" className="btn-logout" onClick={() => clearUsername()}>
            Odhlásit
          </button>
        </div>
      </header>
      <Outlet />
      <footer className="footer">
        <p>
          Zápatí – verze {pkg.version}
        </p>
      </footer>
    </div>
  )
}
