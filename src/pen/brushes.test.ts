import { describe, expect, it } from 'vitest'
import { buildRibbonGeometry } from './brushes'
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

    const firstWidth = Math.abs((geometry?.positions[3] ?? 0) - (geometry?.positions[0] ?? 0))
    const secondWidth = Math.abs((geometry?.positions[9] ?? 0) - (geometry?.positions[6] ?? 0))
    expect(firstWidth).toBeCloseTo(0.01, 4)
    expect(secondWidth).toBeCloseTo(0.04, 4)
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
})
