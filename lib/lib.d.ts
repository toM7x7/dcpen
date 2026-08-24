/**
 * dcpen — QvPen風の空間らくがきペン（XRiftワールド部品）
 *
 * ワールド作者向けエントリ。XRiftワールドの任意の場所に:
 *   import { DcPen } from 'xrift-dcpen'
 *   <DcPen position={[0, 0, -3]} rotationY={Math.PI / 4} />
 */
export { DcPen } from './pen/DcPen';
export type { DcPenProps, DcPenDebugApi } from './pen/DcPen';
export { BRUSH_REGISTRY, StrokeRenderer, buildRibbonGeometry } from './pen/brushes';
export { DEFAULT_BRUSH, DEFAULT_RIBBON_SIZE, PEN_COLORS, RAINBOW } from './pen/types';
export type { BrushDefinition, RibbonGeometryData } from './pen/brushes';
export type { BrushId, Stroke, StrokePoint } from './pen/types';
//# sourceMappingURL=lib.d.ts.map