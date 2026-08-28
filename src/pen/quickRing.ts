import { PEN_COLORS } from './types'
import type { PenToolMode } from './types'

export type QuickRingToolItem =
  | { id: PenToolMode; label: string; kind: 'tool'; mode: PenToolMode; color: string }
  | { id: 'colors'; label: string; kind: 'colors'; color: string }

export const QUICK_RING_TOOL_ITEMS: readonly QuickRingToolItem[] = [
  { id: 'line', label: '線', kind: 'tool', mode: 'line', color: '#0f766e' },
  { id: 'ribbon', label: 'リボン', kind: 'tool', mode: 'ribbon', color: '#c2410c' },
  { id: 'calligraphy', label: '筆', kind: 'tool', mode: 'calligraphy', color: '#7c3aed' },
  { id: 'eraser', label: '消す', kind: 'tool', mode: 'eraser', color: '#64748b' },
  { id: 'colors', label: '色', kind: 'colors', color: '#f8fafc' },
]

export const QUICK_RING_COLORS: readonly string[] = PEN_COLORS

/** ラックへ実際に並べる本数を1〜既存色数へ収める。色リング側は常に全色を維持する。 */
export function normalizePenCount(penCount: number): number {
  if (!Number.isFinite(penCount)) return PEN_COLORS.length
  return Math.max(1, Math.min(PEN_COLORS.length, Math.floor(penCount)))
}

/** ラックの初期色。ペン本数を減らしてもクイックリングの色数には影響しない。 */
export function initialRackColors(penCount: number): string[] {
  return PEN_COLORS.slice(0, normalizePenCount(penCount))
}

/** XY平面上の放射状配置。12時方向から時計回りに並べる。 */
export function radialPosition(
  index: number,
  count: number,
  radius: number,
): [number, number, number] {
  if (count <= 0) return [0, 0, 0]
  const angle = Math.PI / 2 - (index / count) * Math.PI * 2
  return [Math.cos(angle) * radius, Math.sin(angle) * radius, 0]
}

/** ペン先が選択半径へ入った項目を返す。重なった場合は最短を採用する。 */
export function nearestQuickRingItem(
  point: readonly [number, number, number],
  positions: readonly (readonly [number, number, number])[],
  hitRadius: number,
): number | null {
  let nearest: number | null = null
  let nearestDistanceSq = hitRadius * hitRadius
  for (let index = 0; index < positions.length; index += 1) {
    const position = positions[index]
    if (!position) continue
    const dx = point[0] - position[0]
    const dy = point[1] - position[1]
    const dz = point[2] - position[2]
    const distanceSq = dx * dx + dy * dy + dz * dz
    if (distanceSq <= nearestDistanceSq) {
      nearest = index
      nearestDistanceSq = distanceSq
    }
  }
  return nearest
}
