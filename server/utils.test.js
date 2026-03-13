import { describe, it } from 'node:test'
import assert from 'node:assert'
import { isValidDatum } from './utils.js'

describe('isValidDatum', () => {
  it('akceptuje platné datum YYYY-MM-DD', () => {
    assert.strictEqual(isValidDatum('2025-03-12'), true)
    assert.strictEqual(isValidDatum('2024-01-01'), true)
    assert.strictEqual(isValidDatum('2020-02-29'), true)
  })

  it('odmítne neplatný formát', () => {
    assert.strictEqual(isValidDatum('12.3.2025'), false)
    assert.strictEqual(isValidDatum('2025/03/12'), false)
    assert.strictEqual(isValidDatum('12-03-2025'), false)
    assert.strictEqual(isValidDatum(''), false)
    assert.strictEqual(isValidDatum(null), false)
    assert.strictEqual(isValidDatum(undefined), false)
  })

  it('odmítne nečíselné řetězce', () => {
    assert.strictEqual(isValidDatum('abcd'), false)
    assert.strictEqual(isValidDatum('2025-03-ab'), false)
  })
})
