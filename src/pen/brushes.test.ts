import { describe, expect, it } from 'vitest'
import { buildRibbonGeometry, getBrushWidthScale } from './brushes'
import { StrokeStore } from './store'
import type { Stroke } from './types'

const ribbon: Stroke = {
  sid: 'u:0:abc:1',
  color: '#e53935',
  pts: [0, 0, 0, 1, 0, 0],
  hueOffset: 0,
  brushId: 'ribbon',
  size: 0.04,
  orientations: [0, 0, 0, 1, 0, 0, 0, 1],
  pressures: [0, 1],
  timestamps: [0, 16],
}

describe('RibbonBrush', () => {
  it('creates two vertices per point and widens with pressure', () => {
    const geometry = buildRibbonGeometry(ribbon)
    expect(geometry?.positions).toHaveLength(12)
    expect(geometry?.indices).toHaveLength(6)

    const widthAt = (offset: number) => Math.hypot(
      (geometry?.positions[offset + 3] ?? 0) - (geometry?.positions[offset] ?? 0),
      (geometry?.positions[offset + 4] ?? 0) - (geometry?.positions[offset + 1] ?? 0),
      (geometry?.positions[offset + 5] ?? 0) - (geometry?.positions[offset + 2] ?? 0),
    )
    const firstWidth = widthAt(0)
    const secondWidth = widthAt(6)
    expect(firstWidth).toBeCloseTo(0.0072, 4)
    expect(secondWidth).toBeCloseTo(0.058, 4)
  })

  it('tapers a calligraphy stroke at both ends while retaining a broad middle', () => {
    const scales = Array.from({ length: 9 }, (_, index) =>
      getBrushWidthScale('calligraphy', 1, index, 9),
    )
    expect(scales[0]).toBeLessThan(scales[4])
    expect(scales[8]).toBeLessThan(scales[4])
    expect(scales[4]).toBeCloseTo(1.7, 4)
  })

  it('merges old line events and brush metadata without changing the old contract', () => {
    const store = new StrokeStore()
    store.applySegment('old', '#111111', 0, [0, 0, 0, 1, 0, 0])
    expect(store.get('old')).toMatchObject({ brushId: undefined, pts: [0, 0, 0, 1, 0, 0] })

    store.applySegment(ribbon.sid, ribbon.color, 0, ribbon.pts, 0, ribbon)
    expect(store.get(ribbon.sid)).toMatchObject({
      brushId: 'ribbon',
      size: 0.04,
      pressures: [0, 1],
      timestamps: [0, 16],
    })
  })

  it('retains the physical pen and stroke author while merging segments', () => {
    const store = new StrokeStore()
    store.applySegment(ribbon.sid, ribbon.color, 0, ribbon.pts.slice(0, 3), 0, {
      penIndex: 2,
      ownerUserId: 'u',
      ownerDisplayName: 'User U',
    })
    store.applySegment(ribbon.sid, ribbon.color, 1, ribbon.pts.slice(3), 1, {
      penIndex: 2,
      ownerUserId: 'u',
      ownerDisplayName: 'User U',
    })

    expect(store.get(ribbon.sid)).toMatchObject({
      penIndex: 2,
      ownerUserId: 'u',
      ownerDisplayName: 'User U',
      pts: ribbon.pts,
    })
  })
})
