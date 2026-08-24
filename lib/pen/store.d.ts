import { SegEvent, Stroke } from './types';
/**
 * インスタンス内の全ストロークを保持するストア。
 * イベントは自分にもエコーされ得る・順序も保証されない前提で、
 * off（点単位オフセット）による冪等な書き込みだけを許す。
 */
export declare class StrokeStore {
    private strokes;
    /** 描画完了したストロークのsid（到着順） */
    private finishedOrder;
    private finished;
    /** 変更通知用の世代カウンタ（Reactの再描画トリガ） */
    version: number;
    get(sid: string): Stroke | undefined;
    all(): Stroke[];
    finishedStrokes(): Stroke[];
    /** 増分書き込み（自エコー・重複到着に冪等）。旧lineイベントも受理する */
    applySegment(sid: string, color: string, off: number, pts: number[], hueOffset?: number, meta?: Pick<SegEvent, 'brushId' | 'size' | 'orientations' | 'pressures' | 'timestamps' | 'penIndex' | 'ownerUserId' | 'ownerDisplayName'>): void;
    markFinished(sid: string): void;
    /** 完成形ストロークの一括投入（late join時のinstance stateマージ） */
    merge(strokes: Stroke[]): void;
    remove(sid: string): void;
    clear(): void;
    /** 合計点数が予算を超えたら古い完成ストロークから捨てる */
    private trim;
}
/** Vector3的な点をmm丸めでフラット配列に積む */
export declare function pushPoint(pts: number[], x: number, y: number, z: number): void;
//# sourceMappingURL=store.d.ts.map