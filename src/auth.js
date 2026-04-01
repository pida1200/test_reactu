const STORAGE_KEY = 'username'
const EVENT_NAME = 'auth:changed'

export function getUsername() {
  const v = localStorage.getItem(STORAGE_KEY)
  return v?.trim() ? v.trim() : null
}

export function setUsername(username) {
  const v = String(username ?? '').trim()
  if (!v) {
    localStorage.removeItem(STORAGE_KEY)
  } else {
    localStorage.setItem(STORAGE_KEY, v)
  }
  window.dispatchEvent(new Event(EVENT_NAME))
}

export function clearUsername() {
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event(EVENT_NAME))
}

export function subscribeAuthChange(handler) {
  const onAuthChanged = () => handler()
  const onStorage = (e) => {
    if (e.key === STORAGE_KEY) handler()
  }
  window.addEventListener(EVENT_NAME, onAuthChanged)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(EVENT_NAME, onAuthChanged)
    window.removeEventListener('storage', onStorage)
  }
}

