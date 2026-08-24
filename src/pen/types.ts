/**
 * ペンのストローク＝色付き折れ線1本。
 * pts は [x0, y0, z0, x1, y1, z1, ...] のフラット配列（ワールド座標・メートル）
 */
export type BrushId = 'line' | 'ribbon'

/** ブラシ実装へ渡す共通の1打点。通信時は帯域を抑えるため各要素をフラット配列で保持する。 */
export interface StrokePoint {
  position: [number, number, number]
  orientation: [number, number, number, number]
  pressure: number
  timestamp: number
}

export interface Stroke {
  sid: string
  color: string
  pts: number[]
  /**
   * 虹ペンの色相位相オフセット（元の点単位）。部分消しで線が分割されても、
   * 残り区間が「切られる前の続き」の色から始まるようにするための基準点。
   * 新規に描き始めたストロークは常に0
   */
  hueOffset: number
  /** 省略された旧データは line として扱う */
  brushId?: BrushId
  /** RibbonBrushの基準幅（メートル） */
  size?: number
  /** 点ごとの姿勢 [x,y,z,w, ...] */
  orientations?: number[]
  /** 点ごとの筆圧 0..1 */
  pressures?: number[]
  /** ストローク開始からの経過ms */
  timestamps?: number[]
  /** 物理ペンスロット。旧データはsidから復元する */
  penIndex?: number
  /** ストロークを描いたユーザー。ペンを受け渡しても作者は線ごとに残る */
  ownerUserId?: string
  ownerDisplayName?: string
}

/** 描画中ストロークの増分同期イベント。off は点単位（floatではない）の書き込み開始位置 */
export interface SegEvent {
  sid: string
  color: string
  off: number
  pts: number[]
  /** 新規ストローク作成時（off===0）のみ意味を持つ。省略時は0 */
  hueOffset?: number
  brushId?: BrushId
  size?: number
  orientations?: number[]
  pressures?: number[]
  timestamps?: number[]
  penIndex?: number
  ownerUserId?: string
  ownerDisplayName?: string
}

export interface EndEvent {
  sid: string
}

export interface UndoEvent {
  sid: string
}

/**
 * これ以上手が動いたら点を打つ（メートル）。
 * 本家QvPenはTrailRenderer minVertexDistance=2µm＝実質毎フレーム打点の力技で滑らかさを
 * 出している（プレハブ実測）。こちらは10mm間隔＋描画側Catmull-Rom補間(SMOOTH_DIV)で
 * 同等の見た目を同期帯域ほぼ据え置きで得る方針。
 */
export const MIN_SEGMENT = 0.01
/** 描画側スプライン補間の分割数（同期点1区間あたりの描画セグメント数） */
export const SMOOTH_DIV = 4
/** 1ストロークの最大点数 */
export const MAX_POINTS_PER_STROKE = 2000
/** インスタンス全体で保持する合計点数の予算（超えたら古いストロークから捨てる） */
export const MAX_TOTAL_POINTS = 20000
/** 増分同期のバッチ点数 */
export const SEG_BATCH_POINTS = 4
/** デスクトップモードの描画距離（カメラ前方・メートル） */
export const DESKTOP_DRAW_DISTANCE = 1.2

export const DEFAULT_BRUSH: BrushId = 'line'
export const DEFAULT_RIBBON_SIZE = 0.035

/** 虹ペンの色識別子（線を虹色グラデーションで描く） */
export const RAINBOW = 'rainbow'

/** QvPen準拠の15本（14色＋虹） */
export const PEN_COLORS: readonly string[] = [
  '#111111',
  '#e53935',
  '#fb8c00',
  '#fdd835',
  '#9ccc65',
  '#43a047',
  '#26a69a',
  '#26c6da',
  '#42a5f5',
  '#1f4fd8',
  '#8e24aa',
  '#d500f9',
  '#f06292',
  '#ffffff',
  RAINBOW,
]

/** 座標をmm精度に丸める（同期ペイロード削減） */
export function roundMm(v: number): number {
  return Math.round(v * 1000) / 1000
}

export function getStrokePenIndex(stroke: Pick<Stroke, 'sid' | 'penIndex'>): number | null {
  if (Number.isSafeInteger(stroke.penIndex) && (stroke.penIndex as number) >= 0) return stroke.penIndex as number
  const token = stroke.sid.split(':')[1]
  const parsed = Number(token)
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null
}

export function getStrokeOwnerId(stroke: Pick<Stroke, 'sid' | 'ownerUserId'>): string | null {
  if (stroke.ownerUserId) return stroke.ownerUserId
  const owner = stroke.sid.split(':')[0]
  return owner || null
}
