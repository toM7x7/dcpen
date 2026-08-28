import { describe, expect, it } from 'vitest'
import {
  QUICK_RING_COLORS,
  QUICK_RING_TOOL_ITEMS,
  initialRackColors,
  nearestQuickRingItem,
  normalizePenCount,
  radialPosition,
} from './quickRing'

describe('quick ring layout', () => {
  it('places the first item at twelve oclock and distributes every tool', () => {
    expect(radialPosition(0, 4, 0.2)).toEqual([expect.closeTo(0), 0.2, 0])
    const positions = QUICK_RING_TOOL_ITEMS.map((_, index) =>
      radialPosition(index, QUICK_RING_TOOL_ITEMS.length, 0.18),
    )
    expect(new Set(positions.map(([x, y]) => `${x.toFixed(3)}:${y.toFixed(3)}`))).toHaveLength(5)
  })

  it('keeps every existing DcPen color available', () => {
    expect(QUICK_RING_COLORS).toHaveLength(15)
    expect(QUICK_RING_COLORS[QUICK_RING_COLORS.length - 1]).toBe('rainbow')
  })

  it('can show ten identifiable pens without reducing the color palette', () => {
    expect(normalizePenCount(10)).toBe(10)
    expect(initialRackColors(10)).toHaveLength(10)
    expect(QUICK_RING_COLORS).toHaveLength(15)
  })

  it('keeps an invalid rack count inside the supported range', () => {
    expect(normalizePenCount(0)).toBe(1)
    expect(normalizePenCount(99)).toBe(15)
    expect(normalizePenCount(Number.NaN)).toBe(15)
  })

  it('selects only a nearby item', () => {
    const positions = [[0.1, 0, 0], [-0.1, 0, 0]] as const
    expect(nearestQuickRingItem([0.09, 0, 0], positions, 0.04)).toBe(0)
    expect(nearestQuickRingItem([0, 0.2, 0], positions, 0.04)).toBeNull()
  })
})
