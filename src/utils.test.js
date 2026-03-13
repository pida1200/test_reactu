import { describe, it, expect } from 'vitest'
import { isNetworkError, parseZmena } from './utils.js'

describe('isNetworkError', () => {
  it('vrátí true pro typické síťové chyby', () => {
    expect(isNetworkError('Failed to fetch')).toBe(true)
    expect(isNetworkError('failed to fetch')).toBe(true)
    expect(isNetworkError('Load failed')).toBe(true)
    expect(isNetworkError('NetworkError')).toBe(true)
    expect(isNetworkError('Connection refused')).toBe(true)
    expect(isNetworkError('net::ERR_CONNECTION_REFUSED')).toBe(true)
  })

  it('vrátí false pro jiné chyby', () => {
    expect(isNetworkError('404 Not Found')).toBe(false)
    expect(isNetworkError('Chyba validace')).toBe(false)
    expect(isNetworkError('')).toBe(false)
  })

  it('vrátí false pro neplatný vstup', () => {
    expect(isNetworkError(null)).toBe(false)
    expect(isNetworkError(undefined)).toBe(false)
    expect(isNetworkError(123)).toBe(false)
  })
})

describe('parseZmena', () => {
  it('parsuje kladnou a zápornou změnu', () => {
    expect(parseZmena('+1,2 %')).toBe(1.2)
    expect(parseZmena('-1,3 %')).toBe(-1.3)
    expect(parseZmena('+0.5 %')).toBe(0.5)
  })

  it('vrátí null pro prázdné nebo pomlčku', () => {
    expect(parseZmena('')).toBe(null)
    expect(parseZmena('—')).toBe(null)
    expect(parseZmena(null)).toBe(null)
  })

  it('bere první číslo z řetězce', () => {
    expect(parseZmena('+10,5 %')).toBe(10.5)
    expect(parseZmena('-2.1%')).toBe(-2.1)
  })
})
