import { describe, expect, it } from 'vitest'
import { getStrokeOwnerId, getStrokePenIndex, type Stroke } from './types'

describe('stroke ownership helpers', () => {
  it('prefers explicit pen and owner metadata', () => {
    const stroke = {
      sid: 'legacy:1:abc:0', color: '#fff', pts: [], hueOffset: 0,
      penIndex: 3, ownerUserId: 'current',
    } satisfies Stroke
    expect(getStrokePenIndex(stroke)).toBe(3)
    expect(getStrokeOwnerId(stroke)).toBe('current')
  })

  it('falls back to the legacy sid contract', () => {
    const stroke = {
      sid: 'legacy-user:4:abc:0', color: '#fff', pts: [], hueOffset: 0,
    } satisfies Stroke
    expect(getStrokePenIndex(stroke)).toBe(4)
    expect(getStrokeOwnerId(stroke)).toBe('legacy-user')
  })
})
