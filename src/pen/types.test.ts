import { describe, expect, it } from 'vitest'
import { getNextPenToolMode, getStrokeOwnerId, getStrokePenIndex, speedToWidthValue, type Stroke } from './types'

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

describe('speed width mapping', () => {
  it('makes slow strokes broad and fast strokes narrow with stable clamps', () => {
    expect(speedToWidthValue(0)).toBe(1)
    expect(speedToWidthValue(0.08)).toBe(1)
    expect(speedToWidthValue(0.64)).toBeCloseTo(0.59, 2)
    expect(speedToWidthValue(1.2)).toBe(0.18)
    expect(speedToWidthValue(5)).toBe(0.18)
  })
})

describe('pen tool cycle', () => {
  it('cycles line, ribbon, fude, eraser, and back to line', () => {
    expect(getNextPenToolMode('line')).toBe('ribbon')
    expect(getNextPenToolMode('ribbon')).toBe('calligraphy')
    expect(getNextPenToolMode('calligraphy')).toBe('eraser')
    expect(getNextPenToolMode('eraser')).toBe('line')
  })
})
