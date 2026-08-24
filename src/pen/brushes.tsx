import { Line } from '@react-three/drei'
import { memo, useEffect, useMemo } from 'react'
import { BufferAttribute, BufferGeometry, CatmullRomCurve3, Color, DoubleSide, Quaternion, Vector3 } from 'three'
import { DEFAULT_BRUSH, DEFAULT_RIBBON_SIZE, MIN_SEGMENT, RAINBOW, SMOOTH_DIV } from './types'
import type { BrushId, Stroke } from './types'

export interface BrushDefinition {
  id: BrushId
  label: string
  description: string
}

export const BRUSH_REGISTRY: readonly BrushDefinition[] = [
  { id: 'line', label: 'LINE', description: 'DcPen互換の均一な線' },
  { id: 'ribbon', label: 'RIBBON', description: '向きと筆圧で幅が変わる平筆' },
]

const RAINBOW_HUE_STEP = 0.02 * (MIN_SEGMENT / 0.015 / SMOOTH_DIV)
const smoothCache = new Map<string, { count: number; points: [number, number, number][] }>()
const rainbowCache = new Map<string, { count: number; offset: number; colors: [number, number, number][] }>()
const colorScratch = new Color()

function toTuples(pts: readonly number[]): [number, number, number][] {
  const out: [number, number, number][] = []
  for (let index = 0; index + 2 < pts.length; index += 3) {
    const point = [pts[index], pts[index + 1], pts[index + 2]] as [number, number, number]
    if (point.every(Number.isFinite)) out.push(point)
  }
  return out
}

function smoothPoints(key: string, raw: [number, number, number][]): [number, number, number][] {
  if (raw.length < 3) return raw
  const hit = smoothCache.get(key)
  if (hit?.count === raw.length) return hit.points
  const curve = new CatmullRomCurve3(raw.map((point) => new Vector3(...point)), false, 'centripetal')
  const points = curve
    .getPoints((raw.length - 1) * SMOOTH_DIV)
    .map((point) => [point.x, point.y, point.z] as [number, number, number])
  smoothCache.set(key, { count: raw.length, points })
  return points
}

function rainbowColors(key: string, count: number, offset: number): [number, number, number][] {
  const hit = rainbowCache.get(key)
  if (hit?.count === count && hit.offset === offset) return hit.colors
  const colors: [number, number, number][] = []
  for (let index = 0; index < count; index += 1) {
    colorScratch.setHSL(((index + offset) * RAINBOW_HUE_STEP) % 1, 1, 0.6)
    colors.push([colorScratch.r, colorScratch.g, colorScratch.b])
  }
  rainbowCache.set(key, { count, offset, colors })
  return colors
}

export function pruneStrokeRenderCaches(liveKeys: ReadonlySet<string>): void {
  if (smoothCache.size > liveKeys.size * 2 + 16) {
    for (const key of smoothCache.keys()) if (!liveKeys.has(key)) smoothCache.delete(key)
  }
  if (rainbowCache.size > liveKeys.size * 2 + 16) {
    for (const key of rainbowCache.keys()) if (!liveKeys.has(key)) rainbowCache.delete(key)
  }
}

export interface RibbonGeometryData {
  positions: Float32Array
  colors?: Float32Array
  indices: Uint32Array
}

/** Controller orientationのlocal Xを平筆の横方向として帯メッシュを作る。 */
export function buildRibbonGeometry(stroke: Stroke): RibbonGeometryData | null {
  const points = toTuples(stroke.pts)
  if (points.length < 2) return null

  const positions = new Float32Array(points.length * 2 * 3)
  const colors = stroke.color === RAINBOW ? new Float32Array(points.length * 2 * 3) : undefined
  const indices = new Uint32Array((points.length - 1) * 6)
  const quaternion = new Quaternion()
  const side = new Vector3()
  const tangent = new Vector3()
  const up = new Vector3(0, 1, 0)
  const width = Math.max(0.004, Math.min(0.12, stroke.size ?? DEFAULT_RIBBON_SIZE))

  for (let index = 0; index < points.length; index += 1) {
    const point = new Vector3(...points[index])
    const qOffset = index * 4
    const q = stroke.orientations
    if (q && qOffset + 3 < q.length && q.slice(qOffset, qOffset + 4).every(Number.isFinite)) {
      quaternion.set(q[qOffset], q[qOffset + 1], q[qOffset + 2], q[qOffset + 3]).normalize()
      side.set(1, 0, 0).applyQuaternion(quaternion)
    } else {
      const previous = points[Math.max(0, index - 1)]
      const next = points[Math.min(points.length - 1, index + 1)]
      tangent.set(next[0] - previous[0], next[1] - previous[1], next[2] - previous[2]).normalize()
      side.crossVectors(tangent, up)
      if (side.lengthSq() < 1e-5) side.set(1, 0, 0)
    }
    side.normalize()
    const pressure = Math.max(0, Math.min(1, stroke.pressures?.[index] ?? 0.7))
    // 実機で差を読み取りやすいよう、実験版は弱筆圧15%〜強筆圧140%まで誇張する。
    const halfWidth = width * (0.15 + pressure * 1.25) * 0.5
    const left = point.clone().addScaledVector(side, -halfWidth)
    const right = point.clone().addScaledVector(side, halfWidth)
    positions.set([left.x, left.y, left.z, right.x, right.y, right.z], index * 6)

    if (colors) {
      colorScratch.setHSL(((stroke.hueOffset + index) * 0.02) % 1, 1, 0.6)
      colors.set([colorScratch.r, colorScratch.g, colorScratch.b, colorScratch.r, colorScratch.g, colorScratch.b], index * 6)
    }
  }

  for (let index = 0; index < points.length - 1; index += 1) {
    const vertex = index * 2
    indices.set([vertex, vertex + 1, vertex + 2, vertex + 1, vertex + 3, vertex + 2], index * 6)
  }
  return { positions, colors, indices }
}

function LineStroke({ cacheKey, stroke }: { cacheKey: string; stroke: Stroke }) {
  const raw = toTuples(stroke.pts)
  if (raw.length < 2) return null
  const points = smoothPoints(cacheKey, raw)
  if (stroke.color === RAINBOW) {
    return (
      <Line
        points={points}
        vertexColors={rainbowColors(cacheKey, points.length, (stroke.hueOffset ?? 0) * SMOOTH_DIV)}
        color="#ffffff"
        lineWidth={4}
      />
    )
  }
  return <Line points={points} color={stroke.color} lineWidth={4} />
}

function RibbonStroke({ stroke, count }: { stroke: Stroke; count: number }) {
  const data = useMemo(
    () => buildRibbonGeometry(stroke),
    [count, stroke.brushId, stroke.color, stroke.hueOffset, stroke.size, stroke],
  )
  const geometry = useMemo(() => {
    if (!data) return null
    const next = new BufferGeometry()
    next.setAttribute('position', new BufferAttribute(data.positions, 3))
    if (data.colors) next.setAttribute('color', new BufferAttribute(data.colors, 3))
    next.setIndex(new BufferAttribute(data.indices, 1))
    next.computeVertexNormals()
    return next
  }, [data])
  useEffect(() => () => geometry?.dispose(), [geometry])
  if (!geometry) return null
  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color={stroke.color === RAINBOW ? '#ffffff' : stroke.color} vertexColors={Boolean(data?.colors)} side={DoubleSide} toneMapped={false} />
    </mesh>
  )
}

export const StrokeRenderer = memo(
  ({ cacheKey, stroke, count = stroke.pts.length }: { cacheKey?: string; stroke: Stroke; count?: number }) => {
    const key = cacheKey ?? stroke.sid
    return (stroke.brushId ?? DEFAULT_BRUSH) === 'ribbon'
      ? <RibbonStroke stroke={stroke} count={count} />
      : <LineStroke cacheKey={key} stroke={stroke} />
  },
)
