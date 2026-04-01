import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Layout from './Layout.jsx'
import App from './App.jsx'
import Parametrizace from './Parametrizace.jsx'
import GrafAkcji from './GrafAkcji.jsx'
import Log from './Log.jsx'
import DemoKomponenty from './DemoKomponenty.jsx'
import Login from './Login.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<App />} />
          <Route path="parametrizace" element={<Parametrizace />} />
          <Route path="graf" element={<GrafAkcji />} />
          <Route path="log" element={<Log />} />
          <Route path="demo" element={<DemoKomponenty />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
