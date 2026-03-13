import { Outlet, NavLink } from 'react-router-dom'
import './App.css'

export default function Layout() {
  return (
    <div className="layout">
      <header className="header">
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
        </nav>
      </header>
      <Outlet />
      <footer className="footer">
        <p>Zápatí</p>
      </footer>
    </div>
  )
}
