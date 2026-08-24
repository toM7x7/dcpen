import { BrushId, Stroke } from './types';
/** dev環境の自動テスト用フック。本番では渡されない */
export interface DcPenDebugApi {
    undo: () => void;
    clear: () => void;
    strokeCount: () => number;
    strokeColors: () => string[];
    /** 完成形ストロークの直接投入（サムネイル撮影・自動テストの舞台設営用） */
    inject: (strokes: Stroke[]) => void;
}
export interface DcPenProps {
    /** 設置位置 */
    position?: [number, number, number];
    /** Y回転（ラック正面は+Z） */
    rotationY?: number;
    /** 同期キーの名前空間。1ワールド/1インスタンスに複数置くときは変えること */
    syncId?: string;
    /** 通常線/RibbonBrushの比較UIを表示する。既定falseで0.1.xの体験を維持 */
    enableBrushControls?: boolean;
    defaultBrush?: BrushId;
    defaultRibbonSize?: number;
    /** ローカルユーザーが最後に選択/保持した物理ペン番号 */
    onSelectedPenChange?: (penIndex: number) => void;
    debugApi?: (api: DcPenDebugApi) => void;
}
/** 幅変化の入力源。triggerは旧保存・外部利用との型互換のため残す。 */
export type PressureSource = 'trigger' | 'speed';
export interface PressureSample {
    value: number;
    source: PressureSource;
}
export declare function resolvePressureSample(source: XRInputSource | null, distance: number, deltaSeconds: number): PressureSample;
export declare function resolvePressure(source: XRInputSource | null, distance: number, deltaSeconds: number): number;
export declare const DcPen: ({ position, rotationY, syncId, enableBrushControls, defaultBrush, defaultRibbonSize, onSelectedPenChange, debugApi, }: DcPenProps) => import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=DcPen.d.ts.map