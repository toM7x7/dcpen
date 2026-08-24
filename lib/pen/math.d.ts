import { Quaternion, Vector3 } from 'three';
import { PlayerMovement } from '@xrift/world-components';
/**
 * VRトラッキングの手（アバター基準相対座標）をワールド座標へ変換する。
 * アバター根＝ position + rotY(yaw)。yaw はラジアン
 * （world-components の PhysicsPlayer が avatarGroup.rotation.set(0, yaw, 0) している規約に一致）
 */
export declare function handToWorld(mv: PlayerMovement, hand: 'left' | 'right', out: Vector3): boolean;
/** アバターのyawをワールド回転クォータニオンにする */
export declare function yawQuaternion(mv: PlayerMovement, out: Quaternion): Quaternion;
/**
 * VRの手の回転（アバター基準オイラー）をワールド回転にする。
 * ペンの向き表示用（描画位置には影響しない）
 */
export declare function handWorldQuaternion(mv: PlayerMovement, hand: 'left' | 'right', out: Quaternion): boolean;
/**
 * デスクトップ勢（vrTracking無し）のペン表示位置＝目の高さ弱・体の前方。
 * リモートユーザーの手元表現に使う
 */
export declare function desktopHandApprox(mv: PlayerMovement, eyeHeight: number, out: Vector3): void;
//# sourceMappingURL=math.d.ts.map