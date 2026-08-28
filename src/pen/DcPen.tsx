import { useCallback, useEffect, useRef, useState } from 'react'
import type { MutableRefObject, ReactNode } from 'react'
import { createPortal, useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { Camera, DoubleSide, Euler, Group, Matrix4, Mesh, Quaternion, Vector3 } from 'three'
import {
  Interactable,
  useInstanceEvent,
  useInstanceState,
  useUsers,
} from '@xrift/world-components'
import { XRGrabProvider, useGrabbable } from 'xrift-grab'
import type { Hand } from 'xrift-grab'
import { desktopHandApprox, handToWorld, handWorldQuaternion } from './math'
import { StrokeStore } from './store'
import { pruneStrokeRenderCaches, StrokeRenderer } from './brushes'
import {
  DEFAULT_BRUSH,
  DEFAULT_RIBBON_SIZE,
  DESKTOP_DRAW_DISTANCE,
  MAX_POINTS_PER_STROKE,
  MIN_SEGMENT,
  PEN_COLORS,
  RAINBOW,
  SEG_BATCH_POINTS,
  getStrokeOwnerId,
  getStrokePenIndex,
  getNextPenToolMode,
  roundMm,
  speedToWidthValue,
} from './types'
import type { BrushId, EndEvent, PenToolMode, SegEvent, Stroke, UndoEvent } from './types'
import {
  QUICK_RING_COLORS,
  QUICK_RING_TOOL_ITEMS,
  initialRackColors,
  normalizePenCount,
  radialPosition,
} from './quickRing'

/**
 * ペンラック — QvPen準拠の空間らくがきペン（アイテム版）。
 * Spinward/toming工房の「航海日誌」(ワールド埋め込み版v18)からの移植。
 * アイテム版の差分＝①同期キーは設置ごとの `syncId`（`xpen:<itemId>`）で名前空間分離
 * ②設置は任意の位置・向きなので、ラック定位置のワールド姿勢は不可視アンカーの実測で取る。
 *
 * 本家QvPen(BOOTH 1555789 / github.com/ureishi/QvPen)の実装を読んで仕様を合わせている:
 * - 鉛筆型の色ペン14本＋虹ペンが空中のラックに並ぶ。各ペンの上=Respawn・下=その色のClear
 * - VR: **左右どちらの手でも**グリップ(握る)で掴む。**片手1本＝両手で2本同時持ち可**。
 *   掴んだ瞬間の相対姿勢のまま手にくっつく（縦持ち・横持ち自由＝VRC Pickup相当）。
 *   グリップを離すとその場の空中に浮いて留まる
 * - 持ち手のトリガーで描く。**トリガー2回（既定0.3秒以内）でクイックリング、無効時は道具を循環**。
 *   消しゴムではペン先が球になり、触れた部分だけ削る**部分消し**
 *   （線は残り部分に分割される。本家に無い独自拡張）
 * - 消しゴム3個: 掴んでトリガーを押しながら線に当てると**その線1本を消す**
 *   （本家ソース実測: 消しゴムはink IDごと消す＝線1本単位。こちらが本家準拠）
 * - 左パネル: Undo(自分の線) / Clear All / All Reset(ぜんぶ片づける)。ボタンはラベル常時表示
 * - デスクトップ: クリックで持つ/戻す・左長押しで描く（キーボードは本体が独占するため使えない）
 * 線はインスタンスが生きている限り残る（ラック自体は「置いた人」の退出で消える＝アイテムの宿命）。
 */

const COLOR_NAMES = [
  '黒',
  '赤',
  'オレンジ',
  '黄',
  '黄緑',
  '緑',
  'エメラルド',
  'シアン',
  '水色',
  '青',
  '紫',
  'マゼンタ',
  'ピンク',
  '白',
  '虹',
]

const getColorName = (color: string): string => {
  const index = PEN_COLORS.indexOf(color)
  return index >= 0 ? (COLOR_NAMES[index] ?? color) : color
}

/** 消しゴム（QvPenは3個） */
const ERASER_COLORS = ['#8e4a5b', '#3f8f6a', '#3f6ba0']

/** グリップで掴める距離（手からペンまで・メートル） */
const GRAB_RADIUS = 0.45
/** 消しゴム(オブジェクト)の有効半径＝線1本単位で消す（QvPenのSphereCollider相当） */
const ERASE_RADIUS = 0.07
/** ペン先消しゴムモードの半径＝**部分消し**（触れた点だけ削って線を分割する） */
const PARTIAL_ERASE_RADIUS = 0.04
/** トリガー/クリックのダブルクリック判定。実機で取りこぼしにくい300msへ拡張。 */
const DOUBLE_CLICK_MS = 300
/** クイックリングの選択距離・滞在時間・自動終了時間 */
const QUICK_RING_HIT_RADIUS = 0.052
const QUICK_RING_DWELL_MS = 1000
const QUICK_RING_TIMEOUT_MS = 6500
const QUICK_RING_TOOL_RADIUS = 0.18
const QUICK_RING_COLOR_RADIUS = 0.225
/**
 * 遅参者向け全量スナップショット書き込みの間引き窓。
 * setPersistedは差分でなく毎回フル値（全ストローク）を全員へ送るため、確定のたびに
 * 送ると盤面が育つほど全参加者が重くなる。現参加者への伝搬は seg/end/undo/clear
 * イベントが担っているので、スナップショットは遅らせてよい
 */
const PERSIST_DEBOUNCE_MS = 3000

/** dev環境の自動テスト用フック。本番では渡されない */
export interface DcPenDebugApi {
  undo: () => void
  clear: () => void
  strokeCount: () => number
  strokeColors: () => string[]
  /** 完成形ストロークの直接投入（サムネイル撮影・自動テストの舞台設営用） */
  inject: (strokes: Stroke[]) => void
}

interface QuickRingRequest {
  penIndex: number
  hand: Hand
  nonce: number
  preview?: boolean
  previewPage?: QuickRingPage
}

type QuickRingPage = 'tools' | 'colors'

interface QuickRingAnchor {
  position: [number, number, number]
  quaternion: [number, number, number, number]
  page: QuickRingPage
  openedAt: number
  preview: boolean
}

export interface DcPenProps {
  /** 設置位置 */
  position?: [number, number, number]
  /** Y回転（ラック正面は+Z） */
  rotationY?: number
  /** 同期キーの名前空間。1ワールド/1インスタンスに複数置くときは変えること */
  syncId?: string
  /** 通常線/RibbonBrushの比較UIを表示する。既定falseで0.1.xの体験を維持 */
  enableBrushControls?: boolean
  /** トリガー2連打で、順送りの代わりにペン中心クイックリングを開く */
  enableQuickRing?: boolean
  /** ラックへ並べる物理ペン本数。1〜15、既定15。色リングは本数に関係なく15色 */
  penCount?: number
  /** ローカル画面確認専用。保持操作なしで1番ペンのリングを開く */
  debugQuickRingPreview?: boolean | 'colors'
  defaultBrush?: BrushId
  defaultRibbonSize?: number
  /** ローカルユーザーが最後に選択/保持した物理ペン番号 */
  onSelectedPenChange?: (penIndex: number) => void
  debugApi?: (api: DcPenDebugApi) => void
}

/** user-left イベントのペイロード形が非公開なので防御的に取り出す */
function extractUserId(d: unknown): string | null {
  if (typeof d === 'string') return d
  if (d && typeof d === 'object') {
    const o = d as Record<string, unknown>
    for (const k of ['id', 'socketId', 'userId']) {
      const v = o[k]
      if (typeof v === 'string') return v
    }
  }
  return null
}

/** 持ち主情報。手も同期し、リモート表示でどちらの手に付けるかを決める */
interface HolderInfo {
  id: string
  hand: Hand
}

/** 旧形式(文字列)や欠損に耐える正規化 */
function normHolder(v: unknown): HolderInfo | null {
  if (!v) return null
  if (typeof v === 'string') return { id: v, hand: 'right' }
  const o = v as { id?: unknown; hand?: unknown }
  if (typeof o.id === 'string') return { id: o.id, hand: o.hand === 'left' ? 'left' : 'right' }
  return null
}

interface ActiveStroke {
  sid: string
  color: string
  count: number
  sent: number
  hueOffset: number
  brushId: BrushId
  size: number
  startedAt: number
  lastSampleAt: number
  minPressure: number
  maxPressure: number
  pressureSource: PressureSource
  lastPressure: number
}

function roundedQuaternion(quaternion: Quaternion): number[] {
  return [quaternion.x, quaternion.y, quaternion.z, quaternion.w].map(
    (value) => Math.round(value * 1000) / 1000,
  )
}

/** 幅変化の入力源。triggerは旧保存・外部利用との型互換のため残す。 */
export type PressureSource = 'trigger' | 'speed'

export interface PressureSample {
  value: number
  source: PressureSource
}

export function resolvePressureSample(source: XRInputSource | null, distance: number, deltaSeconds: number): PressureSample {
  void source
  if (distance <= 0 || deltaSeconds <= 0) return { value: 1, source: 'speed' }
  const speed = distance / deltaSeconds
  // 8cm/s以下は太く、1.2m/s以上は細く。Questの手振れを拾いすぎない範囲に圧縮する。
  return { value: speedToWidthValue(speed), source: 'speed' }
}

export function resolvePressure(source: XRInputSource | null, distance: number, deltaSeconds: number): number {
  return resolvePressureSample(source, distance, deltaSeconds).value
}

function sliceStrokeMeta(stroke: Stroke, start: number, end: number) {
  return {
    brushId: stroke.brushId,
    size: stroke.size,
    orientations: stroke.orientations?.slice(start * 4, end * 4),
    pressures: stroke.pressures?.slice(start, end),
    timestamps: stroke.timestamps?.slice(start, end),
    penIndex: stroke.penIndex,
    ownerUserId: stroke.ownerUserId,
    ownerDisplayName: stroke.ownerDisplayName,
  }
}

function segmentEvent(stroke: Stroke, start: number, end: number): SegEvent {
  return {
    sid: stroke.sid,
    color: stroke.color,
    off: start,
    pts: stroke.pts.slice(start * 3, end * 3),
    hueOffset: stroke.hueOffset,
    ...sliceStrokeMeta(stroke, start, end),
  }
}

/** 空中に置かれたペンの姿勢（instance stateで同期） */
interface PenPose {
  p: [number, number, number]
  q: [number, number, number, number]
}

/** ラック全体で共有する描画入力の状態（手ごと。子スロットは持ち手の分だけ読む） */
type DrawInput = Record<Hand, { down: boolean; seq: number; source: XRInputSource | null }>

interface BrushSettings {
  id: BrushId
  size: number
}

type VisibilityMode = 'all' | 'mine' | 'pen'

interface PressureTelemetry {
  penIndex: number
  value: number
  min: number
  max: number
  source: PressureSource
  active: boolean
}

/** 消しゴムモードは手ごとに独立（両手持ち時に片方だけ消しゴムにできる） */
type EraserModes = Record<Hand, boolean>

// ---- 使い回しの一時オブジェクト ----
const _tipQ = new Quaternion()
const _dir = new Vector3()
const _camPos = new Vector3()
const _penPos = new Vector3()
const _viewOffset = new Vector3()
const _lookM = new Matrix4()
const _erasePt = new Vector3()
const _ringPos = new Vector3()
const _ringItemPos = new Vector3()
const _ringQ = new Quaternion()
const _ringLookM = new Matrix4()
/** ラックに吊られた鉛筆の姿勢（ペン先下向き） */
const HANG_Q = new Quaternion().setFromEuler(new Euler(-Math.PI / 2, 0, 0))

export const DcPen = ({
  position = [0, 0, 0],
  rotationY = 0,
  syncId = 'dcpen',
  enableBrushControls = false,
  enableQuickRing = false,
  penCount = PEN_COLORS.length,
  debugQuickRingPreview = false,
  defaultBrush = DEFAULT_BRUSH,
  defaultRibbonSize = DEFAULT_RIBBON_SIZE,
  onSelectedPenChange,
  debugApi,
}: DcPenProps) => {
  const SYNC_ID = syncId
  const PEN_COUNT = normalizePenCount(penCount)
  const SLOT_COUNT = PEN_COUNT + ERASER_COLORS.length
  const rackInitialColors = initialRackColors(PEN_COUNT)
  const scene = useThree((s) => s.scene)
  const gl = useThree((s) => s.gl)
  const { localUser } = useUsers()
  const localUserId = localUser?.id ?? 'dev-local'

  // ---- 共有ストローク状態 ----
  const storeRef = useRef<StrokeStore | null>(null)
  if (!storeRef.current) storeRef.current = new StrokeStore()
  const store = storeRef.current
  const [, setTick] = useState(0)
  const bump = useCallback(() => setTick((n) => n + 1), [])
  const initialSize = Math.max(0.012, Math.min(0.08, defaultRibbonSize))
  const initialBrush = enableBrushControls ? defaultBrush : 'line'
  const [selectedPenIndex, setSelectedPenIndex] = useState(0)
  const [visibilityMode, setVisibilityMode] = useState<VisibilityMode>('all')
  const [toolModeByPen, setToolModeByPen] = useState<Record<number, PenToolMode>>({})
  const [quickRingRequest, setQuickRingRequest] = useState<QuickRingRequest | null>(null)
  const [pressureTelemetry, setPressureTelemetry] = useState<PressureTelemetry>({
    penIndex: 0, value: 0, min: 0, max: 0, source: 'speed', active: false,
  })
  const [brushSettingsState, setBrushSettingsState] = useInstanceState<BrushSettings[]>(
    `${SYNC_ID}:brush-settings-v1`,
    Array.from({ length: PEN_COUNT }, () => ({ id: initialBrush, size: initialSize })),
  )
  const brushSettingsByPen = useRef<BrushSettings[]>([])
  brushSettingsByPen.current = Array.from({ length: PEN_COUNT }, (_, index) => {
    const candidate = Array.isArray(brushSettingsState) ? brushSettingsState[index] : undefined
    return candidate && (candidate.id === 'line' || candidate.id === 'ribbon' || candidate.id === 'calligraphy')
      ? { id: candidate.id, size: Math.max(0.012, Math.min(0.08, candidate.size || initialSize)) }
      : { id: initialBrush, size: initialSize }
  })
  const selectedBrush = brushSettingsByPen.current[selectedPenIndex] ?? { id: initialBrush, size: initialSize }
  const selectedToolMode = toolModeByPen[selectedPenIndex] ?? selectedBrush.id
  const [penColorsState, setPenColorsState] = useInstanceState<string[]>(
    `${SYNC_ID}:pen-colors-v1`,
    rackInitialColors,
  )
  const penColorsByPen = useRef<string[]>([])
  penColorsByPen.current = Array.from({ length: PEN_COUNT }, (_, index) => {
    const candidate = Array.isArray(penColorsState) ? penColorsState[index] : undefined
    return typeof candidate === 'string' && (candidate === RAINBOW || /^#[0-9a-f]{6}$/i.test(candidate))
      ? candidate
      : (rackInitialColors[index] ?? '#111111')
  })

  const selectPen = useCallback((penIndex: number) => {
    if (penIndex < 0 || penIndex >= PEN_COUNT) return
    setSelectedPenIndex(penIndex)
    onSelectedPenChange?.(penIndex)
  }, [PEN_COUNT, onSelectedPenChange])

  const updateSelectedBrush = useCallback((update: Partial<BrushSettings>) => {
    const current = brushSettingsByPen.current
    const next = current.map((settings, index) => index === selectedPenIndex ? { ...settings, ...update } : settings)
    setBrushSettingsState(next)
    if (update.id) setToolModeByPen((modes) => ({ ...modes, [selectedPenIndex]: update.id as BrushId }))
  }, [selectedPenIndex, setBrushSettingsState])

  const setPenToolMode = useCallback((penIndex: number, mode: PenToolMode) => {
    setToolModeByPen((modes) => ({ ...modes, [penIndex]: mode }))
  }, [])

  const setPenColor = useCallback((penIndex: number, color: string) => {
    if (penIndex < 0 || penIndex >= PEN_COUNT || !QUICK_RING_COLORS.includes(color)) return
    const next = penColorsByPen.current.map((value, index) => index === penIndex ? color : value)
    setPenColorsState(next)
    selectPen(penIndex)
  }, [selectPen, setPenColorsState])

  useEffect(() => onSelectedPenChange?.(0), [onSelectedPenChange])

  const [persisted, setPersisted] = useInstanceState<Stroke[]>(`${SYNC_ID}:strokes`, [])
  useEffect(() => {
    if (Array.isArray(persisted) && persisted.length > 0) {
      store.merge(persisted)
      bump()
    }
  }, [persisted, store, bump])

  const emitSeg = useInstanceEvent<SegEvent>(`${SYNC_ID}:seg`, (d) => {
    store.applySegment(d.sid, d.color, d.off, d.pts, d.hueOffset, d)
    bump()
  })
  const emitEnd = useInstanceEvent<EndEvent>(`${SYNC_ID}:end`, (d) => {
    store.markFinished(d.sid)
    bump()
  })
  const emitUndo = useInstanceEvent<UndoEvent>(`${SYNC_ID}:undo`, (d) => {
    store.remove(d.sid)
    bump()
  })
  const emitClear = useInstanceEvent<Record<string, never>>(`${SYNC_ID}:clear`, () => {
    store.clear()
    bump()
  })

  /**
   * 遅参者向け全量スナップショット。予約式（trailing throttle）＝窓内の連続変更
   * （描き終わり連発・消しゴム掃きの毎フレームヒット等）を1回の書き込みにまとめる
   */
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const persistNow = useCallback(() => {
    if (persistTimer.current !== null) {
      clearTimeout(persistTimer.current)
      persistTimer.current = null
    }
    setPersisted(store.finishedStrokes())
  }, [setPersisted, store])
  const persistFinished = useCallback(() => {
    if (persistTimer.current !== null) return
    persistTimer.current = setTimeout(() => {
      persistTimer.current = null
      setPersisted(store.finishedStrokes())
    }, PERSIST_DEBOUNCE_MS)
  }, [setPersisted, store])
  useEffect(
    () => () => {
      if (persistTimer.current !== null) clearTimeout(persistTimer.current)
    },
    [],
  )
  // 書き込み予約が保留のまま誰かが入室したら即時flush（遅参者に窓の分の線を取りこぼさせない）
  useInstanceEvent<unknown>('user-joined', () => {
    if (persistTimer.current !== null) persistNow()
  })

  // ---- 自分の線のundoスタック（物理ペンごと） ----
  const undoStack = useRef<Record<number, string[]>>({})
  const pushUndoSid = useCallback((sid: string, penIndex: number) => {
    const stack = undoStack.current[penIndex] ?? []
    stack.push(sid)
    undoStack.current[penIndex] = stack
  }, [])
  const doUndo = useCallback(() => {
    const sid = undoStack.current[selectedPenIndex]?.pop()
    if (!sid) return
    store.remove(sid)
    emitUndo({ sid })
    persistFinished()
    bump()
  }, [store, emitUndo, persistFinished, bump, selectedPenIndex])

  const clearAll = useCallback(() => {
    store.clear()
    emitClear({})
    persistNow()
    undoStack.current = {}
    bump()
  }, [store, emitClear, persistNow, bump])

  const clearMine = useCallback(() => {
    for (const stroke of store.all()) {
      if (getStrokeOwnerId(stroke) !== localUserId) continue
      store.remove(stroke.sid)
      emitUndo({ sid: stroke.sid })
    }
    undoStack.current = {}
    persistFinished()
    bump()
  }, [bump, emitUndo, localUserId, persistFinished, store])

  /** 消しゴム/色別Clearが線を消すときの共通処理（自他問わず） */
  const eraseStroke = useCallback(
    (sid: string) => {
      store.remove(sid)
      emitUndo({ sid })
      persistFinished()
      bump()
    },
    [store, emitUndo, persistFinished, bump],
  )

  /** 物理ペン別Clear: そのペンで自分が描いた線だけを消す */
  const clearPenMine = useCallback(
    (penIndex: number) => {
      for (const s of store.all()) {
        if (getStrokePenIndex(s) === penIndex && getStrokeOwnerId(s) === localUserId) {
          store.remove(s.sid)
          emitUndo({ sid: s.sid })
        }
      }
      persistFinished()
      bump()
    },
    [store, emitUndo, persistFinished, bump, localUserId],
  )

  useEffect(() => {
    debugApi?.({
      undo: doUndo,
      clear: clearAll,
      strokeCount: () => store.all().length,
      strokeColors: () => store.all().map((s) => s.color),
      inject: (strokes) => {
        store.merge(strokes)
        bump()
      },
    })
  }, [debugApi, doUndo, clearAll, store, bump])

  // ---- 入力（手ごとに1系統。どのスロットが反応するかは各スロットが判断） ----
  // 注意: キーボードは使えない（プレイヤー移動系がwindowのkeydown/keyupを独占）
  const drawInput = useRef<DrawInput>({
    left: { down: false, seq: 0, source: null },
    right: { down: false, seq: 0, source: null },
  })
  /** 持ち手トリガーのダブルクリックでツール循環（手ごと） */
  const eraserMode = useRef<EraserModes>({ left: false, right: false })
  const heldPenIndexByHand = useRef<Record<Hand, number | null>>({ left: null, right: null })
  const lastPressAt = useRef<Record<Hand, number>>({ left: 0, right: 0 })
  /** その手が今何かを持っているか（xrift-grabのuseGrabbableのonGrabStart/onDropから更新） */
  const anyHeldByHand = useRef<Record<Hand, boolean>>({ left: false, right: false })
  /** 「ぜんぶ片づける」用のputAwayだけを集めた軽量レジストリ（グリップ掴み自体はxrift-grab側が持つ） */
  const putAwayFns = useRef<((() => void) | null)[]>(new Array(SLOT_COUNT).fill(null))

  const applyHeldTool = useCallback((hand: Hand, next: PenToolMode) => {
    const penIndex = heldPenIndexByHand.current[hand]
    if (penIndex === null) return
    eraserMode.current[hand] = next === 'eraser'
    if (next !== 'eraser') {
      const settings = brushSettingsByPen.current
      setBrushSettingsState(settings.map((value, index) =>
        index === penIndex ? { ...value, id: next } : value,
      ))
    }
    setToolModeByPen((modes) => ({ ...modes, [penIndex]: next }))
    selectPen(penIndex)
  }, [selectPen, setBrushSettingsState])

  const cycleHeldTool = useCallback((hand: Hand) => {
    const penIndex = heldPenIndexByHand.current[hand]
    if (penIndex === null) return
    const current: PenToolMode = eraserMode.current[hand]
      ? 'eraser'
      : (brushSettingsByPen.current[penIndex]?.id ?? DEFAULT_BRUSH)
    applyHeldTool(hand, getNextPenToolMode(current))
  }, [applyHeldTool])

  const openHeldQuickRing = useCallback((hand: Hand) => {
    const penIndex = heldPenIndexByHand.current[hand]
    if (penIndex === null) return
    setQuickRingRequest({ penIndex, hand, nonce: performance.now() })
    selectPen(penIndex)
  }, [selectPen])

  useEffect(() => {
    if (!enableQuickRing || !debugQuickRingPreview) return
    setQuickRingRequest({
      penIndex: 0,
      hand: 'right',
      nonce: performance.now(),
      preview: true,
      previewPage: debugQuickRingPreview === 'colors' ? 'colors' : 'tools',
    })
  }, [debugQuickRingPreview, enableQuickRing])

  useEffect(() => {
    const press = (hand: Hand, source: XRInputSource | null = null) => {
      const now = performance.now()
      if (anyHeldByHand.current[hand] && now - lastPressAt.current[hand] < DOUBLE_CLICK_MS) {
        if (enableQuickRing) openHeldQuickRing(hand)
        else cycleHeldTool(hand)
        lastPressAt.current[hand] = 0
      } else {
        lastPressAt.current[hand] = now
      }
      drawInput.current[hand].down = true
      drawInput.current[hand].seq += 1
      drawInput.current[hand].source = source
    }
    const release = (hand: Hand) => {
      drawInput.current[hand].down = false
      drawInput.current[hand].source = null
    }

    // デスクトップのマウスは右手扱い
    const onPointerDown = (e: PointerEvent) => {
      if (e.button === 0) press('right')
    }
    const onPointerUp = (e: PointerEvent) => {
      if (e.button === 0) release('right')
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)

    const handOf = (e: XRInputSourceEvent): Hand | null =>
      e.inputSource.handedness === 'left' ? 'left' : e.inputSource.handedness === 'right' ? 'right' : null

    const onSelectStart = (e: XRInputSourceEvent) => {
      const h = handOf(e)
      if (h) press(h, e.inputSource)
    }
    const onSelectEnd = (e: XRInputSourceEvent) => {
      const h = handOf(e)
      if (h) release(h)
    }

    let boundSession: XRSession | null = null
    const bindSession = () => {
      const session = gl.xr.getSession()
      if (!session || session === boundSession) return
      boundSession = session
      session.addEventListener('selectstart', onSelectStart)
      session.addEventListener('selectend', onSelectEnd)
    }
    const unbindSession = () => {
      if (!boundSession) return
      boundSession.removeEventListener('selectstart', onSelectStart)
      boundSession.removeEventListener('selectend', onSelectEnd)
      boundSession = null
      drawInput.current.left.down = false
      drawInput.current.right.down = false
      drawInput.current.left.source = null
      drawInput.current.right.source = null
    }
    gl.xr.addEventListener('sessionstart', bindSession)
    gl.xr.addEventListener('sessionend', unbindSession)
    bindSession()

    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      gl.xr.removeEventListener('sessionstart', bindSession)
      gl.xr.removeEventListener('sessionend', unbindSession)
      unbindSession()
    }
  }, [cycleHeldTool, enableQuickRing, gl, openHeldQuickRing])

  const putAwayAll = useCallback(() => {
    for (const fn of putAwayFns.current) fn?.()
  }, [])

  // ---- レイアウト（QvPenのラック風・机なし空中固定） ----
  const strokes = store.all()
  const visibleStrokes = strokes.filter((stroke) => {
    if (visibilityMode === 'mine') return getStrokeOwnerId(stroke) === localUserId
    if (visibilityMode === 'pen') return getStrokePenIndex(stroke) === selectedPenIndex
    return true
  })
  pruneStrokeRenderCaches(new Set(strokes.map((s) => `${SYNC_ID}|${s.sid}`)))
  const penX = (i: number) => (i - (PEN_COUNT - 1) / 2) * 0.17
  const eraserX = (i: number) => penX(PEN_COUNT - 1) + 0.32 + i * 0.13

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <XRGrabProvider grabRadius={GRAB_RADIUS}>
        {/* 手元灯（暗いワールドでも見つけられるように） */}
        <pointLight position={[0, 1.9, 0.3]} intensity={1.6} distance={5} color="#ffd49a" />

        {/* 色別ペン（吊り下げ・ペン先下向き） */}
        {penColorsByPen.current.map((c, i) => (
          <PenSlot
            key={`pen-${i}`}
            index={i}
            kind="pen"
            color={c}
            colorName={getColorName(c)}
            slotOffset={[penX(i), 1.05, 0]}
            syncId={SYNC_ID}
            store={store}
            emitSeg={emitSeg}
            emitEnd={emitEnd}
            persistFinished={persistFinished}
            bump={bump}
            drawInput={drawInput}
            anyHeldByHand={anyHeldByHand}
            pushUndoSid={pushUndoSid}
            eraserMode={eraserMode}
            heldPenIndexByHand={heldPenIndexByHand}
            eraseStroke={eraseStroke}
            putAwayFns={putAwayFns}
            brushSettingsByPen={brushSettingsByPen}
            onSelectPen={selectPen}
            onToolModeChange={setPenToolMode}
            onQuickToolSelect={applyHeldTool}
            onColorChange={setPenColor}
            quickRingRequest={enableQuickRing ? quickRingRequest : null}
            onPressureTelemetry={setPressureTelemetry}
          />
        ))}

        {/* 消しゴム（QvPen準拠: 掴んでトリガーで線に触れて消す＝線1本単位） */}
        {ERASER_COLORS.map((c, i) => (
          <PenSlot
            key={c}
            index={PEN_COUNT + i}
            kind="eraser"
            color={c}
            colorName="消しゴム"
            slotOffset={[eraserX(i), 1.15, 0]}
            syncId={SYNC_ID}
            store={store}
            emitSeg={emitSeg}
            emitEnd={emitEnd}
            persistFinished={persistFinished}
            bump={bump}
            drawInput={drawInput}
            anyHeldByHand={anyHeldByHand}
            pushUndoSid={pushUndoSid}
            eraserMode={eraserMode}
            heldPenIndexByHand={heldPenIndexByHand}
            eraseStroke={eraseStroke}
            putAwayFns={putAwayFns}
            brushSettingsByPen={brushSettingsByPen}
            onSelectPen={selectPen}
            onToolModeChange={setPenToolMode}
            onQuickToolSelect={applyHeldTool}
            onColorChange={setPenColor}
            quickRingRequest={null}
            onPressureTelemetry={setPressureTelemetry}
          />
        ))}

        {/* ペンごとのRespawn（上）とClear（下）＝QvPenのラックUI */}
        {penColorsByPen.current.map((c, i) => (
          <group key={`ui-pen-${i}`}>
            <Text
              position={[penX(i), 1.44, 0.025]}
              fontSize={0.04}
              color="#172033"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.003}
              outlineColor="#ffffff"
            >
              {`P${i + 1}`}
            </Text>
            <LabeledButton
              id={`${SYNC_ID}-respawn-${i}`}
              position={[penX(i), 1.62, 0]}
              size={[0.09, 0.07, 0.02]}
              color="#37474f"
              label="戻す"
              fontSize={0.018}
              interactionText={`P${i + 1}（${getColorName(c)}）を片づける`}
              onInteract={() => putAwayFns.current[i]?.()}
            >
              {/* 色バー（どのペンのボタンかを示す・QvPenの色帯） */}
              <mesh position={[0, -0.05, 0]}>
                <boxGeometry args={[0.1, 0.016, 0.02]} />
                <meshStandardMaterial
                  color={c === RAINBOW ? '#ffffff' : c}
                  emissive={c === RAINBOW ? '#ffffff' : c}
                  emissiveIntensity={0.5}
                />
              </mesh>
            </LabeledButton>
            <LabeledButton
              id={`${SYNC_ID}-clearcolor-${i}`}
              position={[penX(i), 0.62, 0]}
              size={[0.09, 0.07, 0.02]}
              color="#4a3b57"
              label="消す"
              fontSize={0.017}
              interactionText={`P${i + 1}で自分が描いた線を消す`}
              onInteract={() => { selectPen(i); clearPenMine(i) }}
            />
          </group>
        ))}

        {/* 左パネル（QvPenの管理UI相当・ラベル常時表示） */}
        <LabeledButton
          id={`${SYNC_ID}-undo`}
          position={[penX(0) - 0.35, 1.45, 0]}
          color="#8a6d00"
          label="Undo"
          interactionText="1本戻す（自分の線）"
          onInteract={doUndo}
        />
        <LabeledButton
          id={`${SYNC_ID}-clear`}
          position={[penX(0) - 0.35, 1.2, 0]}
          color="#8a0015"
          label="Clear Mine"
          fontSize={0.019}
          interactionText="自分が描いた線だけをぜんぶ消す"
          onInteract={clearMine}
        />
        <LabeledButton
          id={`${SYNC_ID}-reset`}
          position={[penX(0) - 0.35, 0.95, 0]}
          color="#1d4f9e"
          label="All Reset"
          fontSize={0.019}
          interactionText="ペンと消しゴムをぜんぶ片づける"
          onInteract={putAwayAll}
        />
        {enableBrushControls ? (
          <group>
            <Text position={[0.15, 1.92, 0.01]} fontSize={0.042} color="#172033" anchorX="center">
              DOUBLE CLICK: LINE &gt; RIBBON &gt; FUDE &gt; ERASE
            </Text>
            <LabeledButton
              id={`${SYNC_ID}-brush-line`}
              position={[-0.48, 1.78, 0]}
              size={[0.24, 0.12, 0.035]}
              color={selectedToolMode === 'line' ? '#0f766e' : '#475569'}
              label="LINE"
              fontSize={0.035}
              interactionText="通常のDcPen線に切り替える"
              onInteract={() => updateSelectedBrush({ id: 'line' })}
            />
            <LabeledButton
              id={`${SYNC_ID}-brush-ribbon`}
              position={[-0.17, 1.78, 0]}
              size={[0.34, 0.12, 0.035]}
              color={selectedToolMode === 'ribbon' ? '#c2410c' : '#475569'}
              label="RIBBON"
              fontSize={0.032}
              interactionText="速度で幅が変わるリボン筆に切り替える"
              onInteract={() => updateSelectedBrush({ id: 'ribbon' })}
            />
            <LabeledButton
              id={`${SYNC_ID}-brush-calligraphy`}
              position={[0.15, 1.78, 0]}
              size={[0.24, 0.12, 0.035]}
              color={selectedToolMode === 'calligraphy' ? '#7c3aed' : '#475569'}
              label="FUDE"
              fontSize={0.03}
              interactionText="入りと抜きのある筆ブラシに切り替える"
              onInteract={() => updateSelectedBrush({ id: 'calligraphy' })}
            />
            <LabeledButton
              id={`${SYNC_ID}-brush-thinner`}
              position={[0.41, 1.78, 0]}
              size={[0.18, 0.12, 0.035]}
              color="#334155"
              label="THIN"
              fontSize={0.027}
              interactionText="ブラシを細くする"
              onInteract={() => updateSelectedBrush({ size: Math.max(0.012, Math.round((selectedBrush.size - 0.006) * 1000) / 1000) })}
            />
            <LabeledButton
              id={`${SYNC_ID}-brush-wider`}
              position={[0.63, 1.78, 0]}
              size={[0.18, 0.12, 0.035]}
              color="#334155"
              label="WIDE"
              fontSize={0.027}
              interactionText="ブラシを太くする"
              onInteract={() => updateSelectedBrush({ size: Math.min(0.08, Math.round((selectedBrush.size + 0.006) * 1000) / 1000) })}
            />
            <Text position={[0.76, 1.78, 0.02]} fontSize={0.029} color="#172033" anchorX="left">
              {`P${selectedPenIndex + 1} ${selectedToolMode.toUpperCase()} ${Math.round(selectedBrush.size * 1000)}mm`}
            </Text>
            <Text position={[-0.72, 2.1, 0.02]} fontSize={0.033} color="#172033" anchorX="left">
              {`WIDTH ${Math.round((pressureTelemetry.penIndex === selectedPenIndex ? pressureTelemetry.value : 0) * 100)}% SPEED`}
            </Text>
            <Text position={[0.05, 2.1, 0.02]} fontSize={0.028} color="#9a3412" anchorX="left">
              {pressureTelemetry.penIndex === selectedPenIndex && !pressureTelemetry.active
                ? `RANGE ${Math.round(pressureTelemetry.min * 100)}-${Math.round(pressureTelemetry.max * 100)}%`
                : 'SLOW = THICK / FAST = THIN'}
            </Text>
            <group position={[-0.7, 2.2, 0.01]}>
              {Array.from({ length: 10 }, (_, meterIndex) => (
                <mesh key={meterIndex} position={[meterIndex * 0.14, 0, 0]}>
                  <boxGeometry args={[0.11, 0.055, 0.025]} />
                  <meshStandardMaterial
                    color={meterIndex < Math.ceil((pressureTelemetry.penIndex === selectedPenIndex ? pressureTelemetry.value : 0) * 10) ? '#f97316' : '#cbd5e1'}
                    emissive={meterIndex < Math.ceil((pressureTelemetry.penIndex === selectedPenIndex ? pressureTelemetry.value : 0) * 10) ? '#f97316' : '#000000'}
                    emissiveIntensity={0.4}
                  />
                </mesh>
              ))}
            </group>
            <LabeledButton id={`${SYNC_ID}-view-all`} position={[-0.42, 2.34, 0]} size={[0.3, 0.1, 0.03]} color={visibilityMode === 'all' ? '#2563eb' : '#64748b'} label="ALL" fontSize={0.028} interactionText="全員の線を表示" onInteract={() => setVisibilityMode('all')} />
            <LabeledButton id={`${SYNC_ID}-view-mine`} position={[-0.06, 2.34, 0]} size={[0.34, 0.1, 0.03]} color={visibilityMode === 'mine' ? '#2563eb' : '#64748b'} label="MINE" fontSize={0.028} interactionText="自分の線だけ表示" onInteract={() => setVisibilityMode('mine')} />
            <LabeledButton id={`${SYNC_ID}-view-pen`} position={[0.33, 2.34, 0]} size={[0.34, 0.1, 0.03]} color={visibilityMode === 'pen' ? '#2563eb' : '#64748b'} label="PEN" fontSize={0.028} interactionText="選択中の物理ペンの線だけ表示" onInteract={() => setVisibilityMode('pen')} />
          </group>
        ) : null}
      </XRGrabProvider>

      {/* ストロークはワールド座標なのでシーン直下に描く（描画時のみスプライン細分） */}
      {createPortal(
        <group>
          {visibleStrokes.map((s) => (
            <StrokeRenderer key={s.sid} cacheKey={`${SYNC_ID}|${s.sid}`} stroke={s} count={s.pts.length} />
          ))}
        </group>,
        scene,
      )}
    </group>
  )
}

interface PenSlotProps {
  index: number
  kind: 'pen' | 'eraser'
  color: string
  colorName: string
  /** ラックローカルの定位置（ペンはペン先の位置） */
  slotOffset: [number, number, number]
  /** 同期キーの名前空間（親から引き継ぐ） */
  syncId: string
  store: StrokeStore
  emitSeg: (d: SegEvent) => void
  emitEnd: (d: EndEvent) => void
  persistFinished: () => void
  bump: () => void
  drawInput: MutableRefObject<DrawInput>
  anyHeldByHand: MutableRefObject<Record<Hand, boolean>>
  pushUndoSid: (sid: string, penIndex: number) => void
  eraserMode: MutableRefObject<EraserModes>
  heldPenIndexByHand: MutableRefObject<Record<Hand, number | null>>
  eraseStroke: (sid: string) => void
  putAwayFns: MutableRefObject<((() => void) | null)[]>
  brushSettingsByPen: MutableRefObject<BrushSettings[]>
  onSelectPen: (penIndex: number) => void
  onToolModeChange: (penIndex: number, mode: PenToolMode) => void
  onQuickToolSelect: (hand: Hand, mode: PenToolMode) => void
  onColorChange: (penIndex: number, color: string) => void
  quickRingRequest: QuickRingRequest | null
  onPressureTelemetry: (telemetry: PressureTelemetry) => void
}

/** ラックの1本＝独立した持ち主を持つペン/消しゴム */
const PenSlot = ({
  index,
  kind,
  color,
  colorName,
  slotOffset,
  syncId,
  store,
  emitSeg,
  emitEnd,
  persistFinished,
  bump,
  drawInput,
  anyHeldByHand,
  pushUndoSid,
  eraserMode,
  heldPenIndexByHand,
  eraseStroke,
  putAwayFns,
  brushSettingsByPen,
  onSelectPen,
  onToolModeChange,
  onQuickToolSelect,
  onColorChange,
  quickRingRequest,
  onPressureTelemetry,
}: PenSlotProps) => {
  const SYNC_ID = syncId
  const { localUser, getMovement, getLocalMovement, getAvatarHeight } = useUsers()
  const scene = useThree((s) => s.scene)

  const myId = localUser?.id ?? 'dev-local'
  const myDisplayName = localUser?.displayName || '名前なしユーザー'
  const myIdRef = useRef(myId)
  myIdRef.current = myId

  const [holderRaw, setHolder] = useInstanceState<HolderInfo | null>(`${SYNC_ID}:holder:${index}`, null)
  const [pose, setPose] = useInstanceState<PenPose | null>(`${SYNC_ID}:pose:${index}`, null)
  const holder = normHolder(holderRaw)
  const iAmHolder = holder !== null && holder.id === myId
  const holderRef = useRef<HolderInfo | null>(null)
  holderRef.current = holder
  const poseRef = useRef<PenPose | null>(null)
  poseRef.current = pose

  const activeRef = useRef<ActiveStroke | null>(null)
  const lastTelemetryAt = useRef(0)
  const seqRef = useRef(0)
  /**
   * このペンで今まで描いた総点数（このクライアントセッション内で単調増加）。
   * 新しいストロークを描き始める瞬間のhueOffsetにする＝虹の色相が前のストロークの
   * 続きから始まる（QvPenは同一TrailRenderer/Gradientを使い回すため自然に継続する。実測確認済み）
   */
  const nextHueOffset = useRef(0)
  const tip = useRef(new Vector3())
  const lastPt = useRef(new Vector3())
  const pressAnchor = useRef(new Vector3())
  const pressAnchorValid = useRef(false)
  const heldRef = useRef<Group>(null)
  const eraserTipRef = useRef<Mesh>(null)
  const holderLostAt = useRef<number | null>(null)
  const pressAtTake = useRef(-1)
  /** ラック定位置の実ワールド姿勢を測る不可視アンカー（設置の位置・向きに追従） */
  const anchorRef = useRef<Group>(null)
  const [quickRingAnchor, setQuickRingAnchor] = useState<QuickRingAnchor | null>(null)
  const quickRingAnchorRef = useRef<QuickRingAnchor | null>(null)
  quickRingAnchorRef.current = quickRingAnchor
  const consumedQuickRingNonce = useRef<number | null>(null)
  const quickRingItemRefs = useRef<(Group | null)[]>([])
  const quickRingBackRef = useRef<Group>(null)
  const [quickRingHover, setQuickRingHover] = useState<string | null>(null)
  const quickRingHoverRef = useRef<string | null>(null)
  const quickRingHoverSince = useRef(0)

  const closeQuickRing = useCallback(() => {
    quickRingAnchorRef.current = null
    setQuickRingAnchor(null)
    quickRingHoverRef.current = null
    setQuickRingHover(null)
    quickRingHoverSince.current = 0
  }, [])

  const openQuickRingAt = useCallback((position: Vector3, camera: Camera, preview: boolean, page: QuickRingPage = 'tools') => {
    camera.getWorldPosition(_camPos)
    _ringLookM.lookAt(_camPos, position, camera.up)
    _ringQ.setFromRotationMatrix(_ringLookM)
    const next: QuickRingAnchor = {
      position: [position.x, position.y, position.z],
      quaternion: [_ringQ.x, _ringQ.y, _ringQ.z, _ringQ.w],
      page,
      openedAt: performance.now(),
      preview,
    }
    quickRingAnchorRef.current = next
    setQuickRingAnchor(next)
    quickRingHoverRef.current = null
    setQuickRingHover(null)
    quickRingHoverSince.current = 0
  }, [])

  // 持ち主が去ったら定位置へ戻す（線は備品として残る＝書き置き）
  useInstanceEvent<unknown>('user-left', (d) => {
    const gone = extractUserId(d)
    if (gone !== null && gone === holderRef.current?.id) {
      setHolder(null)
    }
  })

  const endActiveStroke = useCallback(() => {
    const a = activeRef.current
    if (!a) return
    activeRef.current = null
    const s = store.get(a.sid)
    if (!s || a.count < 2) {
      store.remove(a.sid)
      onPressureTelemetry({
        penIndex: index, value: a.maxPressure, min: a.minPressure, max: a.maxPressure,
        source: a.pressureSource, active: false,
      })
      bump()
      return
    }
    if (a.sent < a.count) {
      emitSeg(segmentEvent(s, a.sent, a.count))
    }
    emitEnd({ sid: a.sid })
    store.markFinished(a.sid)
    pushUndoSid(a.sid, index)
    onPressureTelemetry({
      penIndex: index,
      value: a.maxPressure,
      min: a.minPressure,
      max: a.maxPressure,
      source: a.pressureSource,
      active: false,
    })
    persistFinished()
    bump()
  }, [store, emitSeg, emitEnd, persistFinished, pushUndoSid, bump, index, onPressureTelemetry])

  /** いまの実体のワールド姿勢（ラック上 or 空中）。ラック上はアンカーの実測 */
  const restingWorldPose = useCallback(
    (outP: Vector3, outQ: Quaternion) => {
      const p = poseRef.current
      const a = anchorRef.current
      if (p) {
        outP.set(p.p[0], p.p[1], p.p[2])
        outQ.set(p.q[0], p.q[1], p.q[2], p.q[3])
      } else if (a) {
        a.getWorldPosition(outP)
        a.getWorldQuaternion(outQ)
        if (kind === 'pen') outQ.multiply(HANG_Q)
      } else {
        outP.set(0, 0, 0)
        outQ.identity()
      }
    },
    [kind],
  )

  /** 近接スキャン用の掴みポイント（ペン先寄りの実測位置。姿勢アンカーとは別点） */
  const grabPointWorldPos = useCallback(
    (out: Vector3) => {
      const p = poseRef.current
      const a = anchorRef.current
      if (p) {
        out.set(p.p[0], p.p[1], p.p[2])
      } else if (a) {
        a.getWorldPosition(out)
        if (kind === 'pen') out.y += 0.17
      } else {
        out.set(0, 0, 0)
      }
    },
    [kind],
  )

  // ---- 取る/置く/片づける ----
  /** 今このスロットを持っている自分の手（xrift-grabのonGrabStart/onDropから更新） */
  const myHeldHandRef = useRef<Hand | null>(null)

  /** このスロットを持っている自分の手を外す（消しゴムモードも解除） */
  const clearMyHand = useCallback(() => {
    const hd = myHeldHandRef.current
    if (hd === null) return
    myHeldHandRef.current = null
    anyHeldByHand.current[hd] = false
    eraserMode.current[hd] = false
    heldPenIndexByHand.current[hd] = null
    closeQuickRing()
    if (kind === 'pen') {
      onToolModeChange(index, brushSettingsByPen.current[index]?.id ?? DEFAULT_BRUSH)
    }
  }, [anyHeldByHand, brushSettingsByPen, closeQuickRing, eraserMode, heldPenIndexByHand, index, kind, onToolModeChange])

  const grab = useGrabbable({
    id: `${SYNC_ID}-slot-${index}`,
    isFree: () => holderRef.current === null,
    worldPosition: grabPointWorldPos,
    worldPose: restingWorldPose,
    defaultOffset: {
      position: new Vector3(0, 0, kind === 'pen' ? -0.08 : -0.03),
      quaternion: new Quaternion(),
    },
    onGrabStart: (hand) => {
      if (kind === 'pen') onSelectPen(index)
      setHolder({ id: myIdRef.current, hand })
      myHeldHandRef.current = hand
      anyHeldByHand.current[hand] = true
      eraserMode.current[hand] = false
      heldPenIndexByHand.current[hand] = kind === 'pen' ? index : null
      if (kind === 'pen') {
        onToolModeChange(index, brushSettingsByPen.current[index]?.id ?? DEFAULT_BRUSH)
      }
      // この押下（トリガー/クリック）は取る操作。描画には使わない
      pressAtTake.current = drawInput.current[hand].down ? drawInput.current[hand].seq : -1
    },
    onDrop: (pose) => {
      endActiveStroke()
      if (pose) {
        setPose({
          p: [roundMm(pose.position.x), roundMm(pose.position.y), roundMm(pose.position.z)],
          q: [
            Math.round(pose.quaternion.x * 1000) / 1000,
            Math.round(pose.quaternion.y * 1000) / 1000,
            Math.round(pose.quaternion.z * 1000) / 1000,
            Math.round(pose.quaternion.w * 1000) / 1000,
          ],
        })
      } else {
        setPose(null)
      }
      setHolder(null)
      clearMyHand()
    },
  })

  const returnToRack = useCallback(() => {
    grab.drop(null)
  }, [grab])

  const putAway = useCallback(() => {
    if (holderRef.current === null) setPose(null)
  }, [setPose])

  // 親の「ぜんぶ片づける」用にputAwayだけを登録（グリップ掴み自体はxrift-grab側が持つ）
  useEffect(() => {
    putAwayFns.current[index] = putAway
    return () => {
      putAwayFns.current[index] = null
    }
  }, [index, putAway, putAwayFns])

  /** 消しゴム(オブジェクト)動作: 先端に触れている線を消す（本家準拠で線1本単位） */
  const erasePass = useCallback(() => {
    for (const s of store.all()) {
      if (getStrokeOwnerId(s) !== myIdRef.current) continue
      let hit = false
      for (let i = 0; i + 2 < s.pts.length; i += 3) {
        const x = s.pts[i]
        const y = s.pts[i + 1]
        const z = s.pts[i + 2]
        if (x === undefined || y === undefined || z === undefined) continue
        _erasePt.set(x, y, z)
        if (_erasePt.distanceTo(tip.current) < ERASE_RADIUS) {
          hit = true
          break
        }
      }
      if (hit) eraseStroke(s.sid)
    }
  }, [store, eraseStroke])

  /**
   * ペン先消しゴムモードの部分消し: 球に触れた点だけ削り、線の残り部分を
   * 連続区間ごとに新しいストロークへ分割して全員に再同期する（本家に無い独自拡張）
   */
  const partialErasePass = useCallback(() => {
    for (const s of store.all()) {
      if (getStrokeOwnerId(s) !== myIdRef.current || getStrokePenIndex(s) !== index) continue
      const pts = s.pts
      let touched = false
      const runs: { pts: number[]; start: number }[] = []
      let cur: number[] = []
      let curStart = 0
      for (let i = 0; i + 2 < pts.length; i += 3) {
        const x = pts[i]
        const y = pts[i + 1]
        const z = pts[i + 2]
        if (x === undefined || y === undefined || z === undefined) continue
        _erasePt.set(x, y, z)
        if (_erasePt.distanceTo(tip.current) < PARTIAL_ERASE_RADIUS) {
          touched = true
          if (cur.length >= 6) runs.push({ pts: cur, start: curStart })
          cur = []
        } else {
          if (cur.length === 0) curStart = i / 3
          cur.push(x, y, z)
        }
      }
      if (cur.length >= 6) runs.push({ pts: cur, start: curStart })
      if (!touched) continue
      // 元の線を消し、残り区間を新しい線として配り直す。
      // 虹の色相位相は元ストロークのhueOffset+区間開始位置を引き継ぎ、分割後も続きの色から始まる
      const baseHue = s.hueOffset ?? 0
      eraseStroke(s.sid)
      for (const run of runs) {
        seqRef.current += 1
        const sid = `${myIdRef.current}:${index}:${Date.now().toString(36)}:${seqRef.current}`
        const hueOffset = baseHue + run.start
        const pointCount = run.pts.length / 3
        const meta = sliceStrokeMeta(s, run.start, run.start + pointCount)
        store.applySegment(sid, s.color, 0, run.pts, hueOffset, meta)
        store.markFinished(sid)
        emitSeg({ sid, color: s.color, off: 0, pts: run.pts, hueOffset, ...meta })
        emitEnd({ sid })
      }
      persistFinished()
      bump()
    }
  }, [store, eraseStroke, emitSeg, emitEnd, persistFinished, bump, index])

  // ---- 毎フレーム: 先端計算・点打ち/消しゴム・表示姿勢 ----
  useFrame(({ camera, clock }) => {
    const held = heldRef.current
    const h = holderRef.current

    const pendingRing = quickRingRequest?.penIndex === index ? quickRingRequest : null
    if (
      pendingRing?.preview &&
      consumedQuickRingNonce.current !== pendingRing.nonce
    ) {
      consumedQuickRingNonce.current = pendingRing.nonce
      camera.getWorldPosition(_camPos)
      camera.getWorldDirection(_dir)
      _ringPos.copy(_camPos).addScaledVector(_dir, 1.35)
      openQuickRingAt(_ringPos, camera, true, pendingRing.previewPage ?? 'tools')
    }

    if (h === null) {
      if (held) held.visible = false
      if (activeRef.current) endActiveStroke()
      holderLostAt.current = null
      return
    }

    let hasPose = false
    _penPos.copy(tip.current)
    if (h.id === myIdRef.current) {
        if (grab.getAttachedPose(_penPos, _tipQ)) {
        // 自分のVRの手はxrift-grabがXRFrameのgrip姿勢から直接求める。
        // 掴んだ瞬間の相対姿勢が掛かった状態で返るので「持った向きのまま」手に追従する
        tip.current.copy(_penPos)
        if (held) held.quaternion.copy(_tipQ)
        hasPose = true
      } else {
        const mv = getLocalMovement()
        if (mv.isInVR && mv.vrTracking) {
          hasPose = handToWorld(mv, h.hand, tip.current)
          _penPos.copy(tip.current)
          if (handWorldQuaternion(mv, h.hand, _tipQ) && held) held.quaternion.copy(_tipQ)
        } else {
          // デスクトップ: インクは照準先、持ち物はFPSの構え
          camera.getWorldPosition(_camPos)
          camera.getWorldDirection(_dir)
          tip.current.copy(_camPos).addScaledVector(_dir, DESKTOP_DRAW_DISTANCE)
          _viewOffset.set(0.17, -0.11, -0.4).applyQuaternion(camera.quaternion)
          _penPos.copy(_camPos).add(_viewOffset)
          if (held) {
            _lookM.lookAt(_penPos, tip.current, camera.up)
            held.quaternion.setFromRotationMatrix(_lookM)
            _tipQ.copy(held.quaternion)
          }
          hasPose = true
        }
        if (hasPose && held) grab.reportFallbackPose(_penPos, held.quaternion)
      }
    } else {
      const mv = getMovement(h.id)
      if (mv) {
        holderLostAt.current = null
        if (mv.isInVR && mv.vrTracking) {
          hasPose = handToWorld(mv, h.hand, tip.current)
          _penPos.copy(tip.current)
          if (held && handWorldQuaternion(mv, h.hand, _tipQ)) held.quaternion.copy(_tipQ)
        } else {
          const eye = getAvatarHeight?.(h.id)?.eyeHeight ?? 1.3
          desktopHandApprox(mv, eye, tip.current)
          _penPos.copy(tip.current)
          hasPose = true
        }
      } else {
        // 持ち主の姿が取れない＝退出後の取り残し疑い。5秒で自動返却
        const now = clock.elapsedTime
        if (holderLostAt.current === null) {
          holderLostAt.current = now
        } else if (now - holderLostAt.current > 5) {
          holderLostAt.current = null
          setHolder(null)
        }
      }
    }

    if (held) {
      held.visible = hasPose
      if (hasPose) held.position.copy(_penPos)
    }

    if (
      pendingRing &&
      !pendingRing.preview &&
      pendingRing.hand === h.hand &&
      h.id === myIdRef.current &&
      hasPose &&
      consumedQuickRingNonce.current !== pendingRing.nonce
    ) {
      consumedQuickRingNonce.current = pendingRing.nonce
      endActiveStroke()
      pressAnchorValid.current = false
      pressAtTake.current = drawInput.current[h.hand].seq
      if (quickRingAnchorRef.current) closeQuickRing()
      else openQuickRingAt(tip.current, camera, false)
    }

    const ring = quickRingAnchorRef.current
    if (ring && !ring.preview && h.id === myIdRef.current && hasPose) {
      const now = performance.now()
      if (now - ring.openedAt >= QUICK_RING_TIMEOUT_MS) {
        closeQuickRing()
        return
      }

      let hoverKey: string | null = null
      let hoverIndex: number | null = null
      let nearestDistance = QUICK_RING_HIT_RADIUS
      const itemCount = ring.page === 'tools' ? QUICK_RING_TOOL_ITEMS.length : QUICK_RING_COLORS.length
      for (let itemIndex = 0; itemIndex < itemCount; itemIndex += 1) {
        const item = quickRingItemRefs.current[itemIndex]
        if (!item) continue
        item.getWorldPosition(_ringItemPos)
        const distance = _ringItemPos.distanceTo(tip.current)
        if (distance <= nearestDistance) {
          nearestDistance = distance
          hoverIndex = itemIndex
          hoverKey = `${ring.page}:${itemIndex}`
        }
      }
      if (ring.page === 'colors' && quickRingBackRef.current) {
        quickRingBackRef.current.getWorldPosition(_ringItemPos)
        const distance = _ringItemPos.distanceTo(tip.current)
        if (distance <= nearestDistance) {
          hoverIndex = -1
          hoverKey = 'colors:back'
        }
      }

      if (hoverKey !== quickRingHoverRef.current) {
        quickRingHoverRef.current = hoverKey
        setQuickRingHover(hoverKey)
        quickRingHoverSince.current = now
      } else if (hoverKey !== null && now - quickRingHoverSince.current >= QUICK_RING_DWELL_MS) {
        if (ring.page === 'colors' && hoverIndex === -1) {
          const next = { ...ring, page: 'tools' as const, openedAt: now }
          quickRingAnchorRef.current = next
          setQuickRingAnchor(next)
        } else if (ring.page === 'tools' && hoverIndex !== null) {
          const item = QUICK_RING_TOOL_ITEMS[hoverIndex]
          if (item?.kind === 'colors') {
            const next = { ...ring, page: 'colors' as const, openedAt: now }
            quickRingAnchorRef.current = next
            setQuickRingAnchor(next)
          } else if (item?.kind === 'tool') {
            onQuickToolSelect(h.hand, item.mode)
            closeQuickRing()
          }
        } else if (ring.page === 'colors' && hoverIndex !== null) {
          const nextColor = QUICK_RING_COLORS[hoverIndex]
          if (nextColor) onColorChange(index, nextColor)
          closeQuickRing()
        }
        quickRingHoverRef.current = null
        setQuickRingHover(null)
        quickRingHoverSince.current = now
      }
      return
    }
    // 消しゴムモードの表示（ペン先が球になる・QvPen準拠。手ごとに独立）
    const inEraserMode = kind === 'pen' && eraserMode.current[h.hand]
    const et = eraserTipRef.current
    if (et) et.visible = h.id === myIdRef.current && inEraserMode

    // 自分が操作している間だけ入力を反映（持ち手のトリガーのみ）
    if (h.id !== myIdRef.current || !hasPose) return
    const input = drawInput.current[h.hand]
    const pressing = input.down && input.seq !== pressAtTake.current

    if (kind === 'eraser' || inEraserMode) {
      // トリガーを押しながら線に触れると消える。
      // 消しゴム=線1本単位（本家準拠）/ ペン先消しゴム=部分消し（独自拡張）
      if (activeRef.current) endActiveStroke()
      pressAnchorValid.current = false
      if (pressing) {
        if (kind === 'eraser') erasePass()
        else partialErasePass()
      }
      return
    }

    if (pressing) {
      let a = activeRef.current
      if (!a) {
        // 遅延開始: 押下中に一定距離動いてからストロークを起こす（クリック操作との両立）
        if (!pressAnchorValid.current) {
          pressAnchor.current.copy(tip.current)
          pressAnchorValid.current = true
          return
        }
        if (tip.current.distanceTo(pressAnchor.current) < MIN_SEGMENT * 1.5) return
        seqRef.current += 1
        const startedAt = Math.round(clock.elapsedTime * 1000)
        const settings = brushSettingsByPen.current[index] ?? { id: DEFAULT_BRUSH, size: DEFAULT_RIBBON_SIZE }
        const firstSample = resolvePressureSample(input.source, 0, 0)
        a = {
          sid: `${myIdRef.current}:${index}:${Date.now().toString(36)}:${seqRef.current}`,
          color,
          count: 0,
          sent: 0,
          hueOffset: nextHueOffset.current,
          brushId: settings.id,
          size: settings.size,
          startedAt,
          lastSampleAt: startedAt,
          minPressure: firstSample.value,
          maxPressure: firstSample.value,
          pressureSource: firstSample.source,
          lastPressure: firstSample.value,
        }
        activeRef.current = a
        store.applySegment(
          a.sid,
          a.color,
          0,
          [roundMm(pressAnchor.current.x), roundMm(pressAnchor.current.y), roundMm(pressAnchor.current.z)],
          a.hueOffset,
          {
            brushId: a.brushId,
            size: a.size,
            orientations: roundedQuaternion(_tipQ),
            pressures: [firstSample.value],
            timestamps: [0],
            penIndex: index,
            ownerUserId: myIdRef.current,
            ownerDisplayName: myDisplayName,
          },
        )
        onPressureTelemetry({
          penIndex: index, value: firstSample.value, min: firstSample.value, max: firstSample.value,
          source: firstSample.source, active: true,
        })
        a.count = 1
        nextHueOffset.current += 1
        lastPt.current.copy(pressAnchor.current)
      }
      if (a.count >= MAX_POINTS_PER_STROKE) {
        endActiveStroke()
        return
      }
      const distance = tip.current.distanceTo(lastPt.current)
      if (distance < MIN_SEGMENT) return
      const sampledAt = Math.round(clock.elapsedTime * 1000)
      const pressureSample = resolvePressureSample(input.source, distance, (sampledAt - a.lastSampleAt) / 1000)
      // 打点間速度の揺れをそのまま幅へ出さず、前値を残して筆運びを滑らかにする。
      const pressure = Math.round((a.lastPressure * 0.58 + pressureSample.value * 0.42) * 1000) / 1000
      a.lastPressure = pressure
      a.minPressure = Math.min(a.minPressure, pressure)
      a.maxPressure = Math.max(a.maxPressure, pressure)
      a.pressureSource = pressureSample.source
      lastPt.current.copy(tip.current)
      store.applySegment(
        a.sid,
        a.color,
        a.count,
        [roundMm(tip.current.x), roundMm(tip.current.y), roundMm(tip.current.z)],
        a.hueOffset,
        {
          brushId: a.brushId,
          size: a.size,
          orientations: roundedQuaternion(_tipQ),
          pressures: [pressure],
          timestamps: [sampledAt - a.startedAt],
          penIndex: index,
          ownerUserId: myIdRef.current,
          ownerDisplayName: myDisplayName,
        },
      )
      a.count += 1
      a.lastSampleAt = sampledAt
      if (sampledAt - lastTelemetryAt.current >= 100) {
        lastTelemetryAt.current = sampledAt
        onPressureTelemetry({
          penIndex: index, value: pressure, min: a.minPressure, max: a.maxPressure,
          source: pressureSample.source, active: true,
        })
      }
      nextHueOffset.current += 1
      if (a.count - a.sent >= SEG_BATCH_POINTS) {
        const s = store.get(a.sid)
        if (s) {
          emitSeg(segmentEvent(s, a.sent, a.count))
          a.sent = a.count
        }
      }
      bump()
    } else {
      pressAnchorValid.current = false
      if (activeRef.current) endActiveStroke()
    }
  })

  const inAir = pose !== null
  const onRack = holder === null && !inAir
  const noun = kind === 'pen' ? `P${index + 1}（${colorName}）` : colorName
  const rackText =
    holder === null
      ? inAir
        ? `${noun}をラックに戻す`
        : kind === 'pen'
          ? `${noun}を持つ（VR:グリップ・トリガー2回でLINE/RIBBON/FUDE/消しゴム切替）`
          : `${noun}を持つ（トリガーで線に当てて消す）`
      : iAmHolder
        ? `${noun}をラックに戻す`
        : 'だれかが使用中'

  const onRackInteract = useCallback(() => {
    if (kind === 'pen') onSelectPen(index)
    const h = holderRef.current
    if (h === null) {
      if (poseRef.current) {
        putAway()
      } else {
        grab.grabViaClick()
      }
    } else if (grab.isHeld) {
      returnToRack()
    }
  }, [grab, returnToRack, putAway, index, kind, onSelectPen])

  const ringHand = holder?.hand ?? myHeldHandRef.current ?? 'right'
  const quickRingToolMode: PenToolMode = eraserMode.current[ringHand]
    ? 'eraser'
    : (brushSettingsByPen.current[index]?.id ?? DEFAULT_BRUSH)
  const quickRingHoverLabel = (() => {
    if (!quickRingHover) return quickRingAnchor?.page === 'colors' ? '色を選ぶ' : '道具を選ぶ'
    if (quickRingHover === 'colors:back') return '戻る'
    const itemIndex = Number(quickRingHover.split(':')[1])
    if (!Number.isInteger(itemIndex)) return ''
    if (quickRingAnchor?.page === 'colors') {
      const hoveredColor = QUICK_RING_COLORS[itemIndex]
      return hoveredColor ? getColorName(hoveredColor) : ''
    }
    return QUICK_RING_TOOL_ITEMS[itemIndex]?.label ?? ''
  })()

  return (
    <group position={slotOffset}>
      {/* 定位置のワールド姿勢を測るアンカー（描画なし） */}
      <group ref={anchorRef} />
      <Interactable
        id={`${SYNC_ID}-slot-${index}`}
        onInteract={onRackInteract}
        interactionText={rackText}
        enabled={holder === null || iAmHolder}
      >
        {/* ラック上の実体（誰も持っておらず空中にも無いときだけ見える） */}
        {kind === 'pen' ? (
          <group rotation={[-Math.PI / 2, 0, 0]} visible={onRack}>
            <PencilMesh color={color} penLabel={`P${index + 1}`} />
          </group>
        ) : (
          <group visible={onRack}>
            <EraserMesh color={color} />
          </group>
        )}
        {/* 不可視の当たり（raycast可・描画なし。持ち帰り操作の受け皿でもある） */}
        <mesh position={[0, kind === 'pen' ? 0.17 : 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, kind === 'pen' ? 0.36 : 0.12, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </Interactable>

      {/* 空中に置かれた実体（QvPen準拠: 離した場所・離した向きのまま浮いて留まる） */}
      {holder === null &&
        pose !== null &&
        createPortal(
          <group
            position={[pose.p[0], pose.p[1], pose.p[2]]}
            quaternion={[pose.q[0], pose.q[1], pose.q[2], pose.q[3]]}
          >
            <Interactable
              id={`${SYNC_ID}-slot-air-${index}`}
              onInteract={() => {
                if (kind === 'pen') onSelectPen(index)
                grab.grabViaClick()
              }}
              interactionText={`${noun}を持つ`}
            >
              {kind === 'pen' ? <PencilMesh color={color} penLabel={`P${index + 1}`} /> : <EraserMesh color={color} />}
              <mesh position={[0, 0, kind === 'pen' ? 0.17 : 0]}>
                <sphereGeometry args={[0.08, 8, 8]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              </mesh>
            </Interactable>
          </group>,
          scene,
        )}

      {/* 手元の実体はワールド座標なのでシーン直下に描く */}
      {createPortal(
        <group ref={heldRef} visible={false} name={`${SYNC_ID}-held-${index}`}>
          {kind === 'pen' ? <PencilMesh color={color} penLabel={`P${index + 1}`} /> : <EraserMesh color={color} />}
          {/* 消しゴムモード時にペン先が球になる（QvPen準拠の表示） */}
          {kind === 'pen' && (
            <mesh ref={eraserTipRef} visible={false} position={[0, 0, 0.005]}>
              <sphereGeometry args={[0.02, 12, 12]} />
              <meshStandardMaterial color="#f0f0f0" emissive="#f0f0f0" emissiveIntensity={0.6} />
            </mesh>
          )}
        </group>,
        scene,
      )}

      {quickRingAnchor && kind === 'pen' &&
        createPortal(
          <group
            position={quickRingAnchor.position}
            quaternion={quickRingAnchor.quaternion}
            name={`${SYNC_ID}-quick-ring-${index}`}
          >
            <mesh position={[0, 0, -0.008]}>
              <circleGeometry args={[0.292, 48]} />
              <meshBasicMaterial color="#172033" transparent opacity={0.88} side={DoubleSide} depthTest={false} />
            </mesh>
            <mesh position={[0, 0, -0.006]}>
              <ringGeometry args={[0.272, 0.288, 48]} />
              <meshBasicMaterial color={color === RAINBOW ? '#f8fafc' : color} side={DoubleSide} depthTest={false} />
            </mesh>

            {quickRingAnchor.page === 'tools' ? QUICK_RING_TOOL_ITEMS.map((item, itemIndex) => {
              const hoverKey = `tools:${itemIndex}`
              const selected = item.kind === 'tool' && item.mode === quickRingToolMode
              const hovered = quickRingHover === hoverKey
              return (
                <group
                  key={item.id}
                  ref={(node) => { quickRingItemRefs.current[itemIndex] = node }}
                  position={radialPosition(itemIndex, QUICK_RING_TOOL_ITEMS.length, QUICK_RING_TOOL_RADIUS)}
                  scale={hovered ? 1.18 : 1}
                >
                  <mesh>
                    <circleGeometry args={[0.052, 28]} />
                    <meshBasicMaterial color={item.color} side={DoubleSide} depthTest={false} />
                  </mesh>
                  {(selected || hovered) && (
                    <mesh position={[0, 0, 0.003]}>
                      <ringGeometry args={[0.057, 0.065, 28]} />
                      <meshBasicMaterial color={hovered ? '#facc15' : '#ffffff'} side={DoubleSide} depthTest={false} />
                    </mesh>
                  )}
                  <Text
                    position={[0, 0, 0.006]}
                    fontSize={item.id === 'ribbon' ? 0.019 : 0.025}
                    color={item.id === 'colors' ? '#172033' : '#ffffff'}
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.0015}
                    outlineColor={item.id === 'colors' ? '#ffffff' : '#000000'}
                  >
                    {item.label}
                  </Text>
                </group>
              )
            }) : (
              <>
                {QUICK_RING_COLORS.map((swatchColor, itemIndex) => {
                  const hoverKey = `colors:${itemIndex}`
                  const selected = swatchColor === color
                  const hovered = quickRingHover === hoverKey
                  return (
                    <group
                      key={`${swatchColor}-${itemIndex}`}
                      ref={(node) => { quickRingItemRefs.current[itemIndex] = node }}
                      position={radialPosition(itemIndex, QUICK_RING_COLORS.length, QUICK_RING_COLOR_RADIUS)}
                      scale={hovered ? 1.2 : 1}
                    >
                      <mesh>
                        <circleGeometry args={[0.035, 24]} />
                        <meshBasicMaterial
                          color={swatchColor === RAINBOW ? '#ffffff' : swatchColor}
                          side={DoubleSide}
                          depthTest={false}
                        />
                      </mesh>
                      <mesh position={[0, 0, 0.003]}>
                        <ringGeometry args={[0.039, 0.045, 24]} />
                        <meshBasicMaterial
                          color={hovered ? '#facc15' : selected ? '#ffffff' : '#64748b'}
                          side={DoubleSide}
                          depthTest={false}
                        />
                      </mesh>
                      {swatchColor === RAINBOW && (
                        <Text position={[0, 0, 0.006]} fontSize={0.018} color="#172033" anchorX="center" anchorY="middle">
                          虹
                        </Text>
                      )}
                    </group>
                  )
                })}
                <group ref={quickRingBackRef}>
                  <mesh>
                    <circleGeometry args={[0.046, 24]} />
                    <meshBasicMaterial color="#475569" side={DoubleSide} depthTest={false} />
                  </mesh>
                  <Text position={[0, 0, 0.006]} fontSize={0.021} color="#ffffff" anchorX="center" anchorY="middle">
                    戻る
                  </Text>
                </group>
              </>
            )}

            <Text
              position={[0, -0.338, 0.008]}
              fontSize={0.032}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.002}
              outlineColor="#000000"
            >
              {quickRingHoverLabel}
            </Text>
            <Text
              position={[0, 0.263, 0.008]}
              fontSize={0.018}
              color="#cbd5e1"
              anchorX="center"
              anchorY="middle"
            >
              ペン先を近づけて選択
            </Text>
          </group>,
          scene,
        )}
    </group>
  )
}

/** 虹ペンの軸の縞 */
const RAINBOW_STRIPES = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa']

/**
 * 鉛筆の造形（QvPenの見た目準拠）。原点がペン先、+Z方向へ軸が伸びる。
 * ラック表示時は rotation.x=-90° で吊るす（ペン先下向き）
 */
const PencilMesh = ({ color, penLabel }: { color: string; penLabel: string }) => {
  const lead = color === RAINBOW ? '#ffffff' : color
  return (
    <group>
      {/* 芯（発光） */}
      <mesh position={[0, 0, 0.007]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.0045, 0.015, 8]} />
        <meshStandardMaterial color={lead} emissive={lead} emissiveIntensity={1.8} />
      </mesh>
      {/* 木の削り部（六角錐） */}
      <mesh position={[0, 0, 0.031]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.013, 0.034, 6]} />
        <meshStandardMaterial color="#d8bb90" roughness={0.85} />
      </mesh>
      {/* 六角軸 */}
      {color === RAINBOW ? (
        RAINBOW_STRIPES.map((c, i) => (
          <mesh key={c} position={[0, 0, 0.048 + 0.048 * i + 0.024]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.048, 6]} />
            <meshStandardMaterial color={c} roughness={0.6} />
          </mesh>
        ))
      ) : (
        <mesh position={[0, 0, 0.192]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.288, 6]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      )}
      {/* 色を変えても失われない物理ペンID。軸の両面に表示して受け渡し時も判別する。 */}
      <mesh position={[0, 0.0135, 0.286]}>
        <boxGeometry args={[0.031, 0.003, 0.054]} />
        <meshStandardMaterial color="#ffffff" roughness={0.7} />
      </mesh>
      <Text
        position={[0, 0.0155, 0.286]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={penLabel.length > 2 ? 0.013 : 0.016}
        color="#172033"
        anchorX="center"
        anchorY="middle"
      >
        {penLabel}
      </Text>
      <mesh position={[0, -0.0135, 0.286]}>
        <boxGeometry args={[0.031, 0.003, 0.054]} />
        <meshStandardMaterial color="#ffffff" roughness={0.7} />
      </mesh>
      <Text
        position={[0, -0.0155, 0.286]}
        rotation={[Math.PI / 2, 0, 0]}
        fontSize={penLabel.length > 2 ? 0.013 : 0.016}
        color="#172033"
        anchorX="center"
        anchorY="middle"
      >
        {penLabel}
      </Text>
    </group>
  )
}

/** 消しゴムの造形（六角の塊・原点中心） */
const EraserMesh = ({ color }: { color: string }) => (
  <mesh rotation={[Math.PI / 2, 0, 0]}>
    <cylinderGeometry args={[0.05, 0.05, 0.07, 6]} />
    <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
  </mesh>
)

/** ラベル常時表示のボタン（VRはホバー文言が見えないため） */
const LabeledButton = ({
  id,
  position,
  size = [0.12, 0.08, 0.03],
  color,
  label,
  labelColor = '#ffffff',
  fontSize = 0.022,
  interactionText,
  onInteract,
  children,
}: {
  id: string
  position: [number, number, number]
  size?: [number, number, number]
  color: string
  label: string
  labelColor?: string
  fontSize?: number
  interactionText: string
  onInteract: () => void
  children?: ReactNode
}) => (
  <Interactable id={id} onInteract={onInteract} interactionText={interactionText}>
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} />
      </mesh>
      <Text
        position={[0, 0, size[2] / 2 + 0.002]}
        fontSize={fontSize}
        color={labelColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={fontSize * 0.08}
        outlineColor="#000000"
      >
        {label}
      </Text>
      {children}
    </group>
  </Interactable>
)
