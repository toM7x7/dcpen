import { BrushId, Stroke } from './types';
export interface BrushDefinition {
    id: BrushId;
    label: string;
    description: string;
}
export declare const BRUSH_REGISTRY: readonly BrushDefinition[];
export declare function pruneStrokeRenderCaches(liveKeys: ReadonlySet<string>): void;
export interface RibbonGeometryData {
    positions: Float32Array;
    colors?: Float32Array;
    indices: Uint32Array;
}
export declare function getBrushWidthScale(brushId: BrushId, pressure: number, pointIndex: number, pointCount: number): number;
/** Controller orientationのlocal Xを平筆の横方向として帯メッシュを作る。 */
export declare function buildRibbonGeometry(stroke: Stroke): RibbonGeometryData | null;
export declare const StrokeRenderer: import('react').MemoExoticComponent<({ cacheKey, stroke, count }: {
    cacheKey?: string;
    stroke: Stroke;
    count?: number;
}) => import("react/jsx-runtime").JSX.Element>;
//# sourceMappingURL=brushes.d.ts.map