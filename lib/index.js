import { jsx as i, jsxs as P, Fragment as Pt } from "react/jsx-runtime";
import { useRef as m, useCallback as S, useEffect as Me, useMemo as Ln, createContext as Rt, useState as Pe, useContext as xt, memo as Tt } from "react";
import { useThree as Sn, useFrame as gt, createPortal as Tn } from "@react-three/fiber";
import { Line as Fn, Text as ee } from "@react-three/drei";
import { Vector3 as L, Quaternion as ne, Matrix4 as sn, Euler as yt, Color as zt, BufferGeometry as At, BufferAttribute as En, DoubleSide as Ce, CatmullRomCurve3 as Et } from "three";
import { useUsers as It, useInstanceState as mn, useInstanceEvent as tn, Interactable as Dn } from "@xrift/world-components";
const Qn = new sn(), Vn = new sn(), Xn = new sn(), Kn = new sn(), $t = new L();
function St(e, n, t, o) {
  const l = e.xr;
  if (!l.isPresenting) return !1;
  const I = l.getSession();
  if (!I) return !1;
  const u = l.getFrame(), y = l.getReferenceSpace();
  if (!u || !y) return !1;
  const D = u.getViewerPose(y);
  if (!D) return !1;
  let v = null;
  for (const A of I.inputSources)
    if (A.handedness === n && (A.gripSpace || A.targetRaySpace)) {
      v = A;
      break;
    }
  if (!v) return !1;
  const w = v.gripSpace ?? v.targetRaySpace, a = u.getPose(w, y);
  if (!a) return !1;
  Qn.fromArray(Array.from(D.transform.matrix)), Vn.fromArray(Array.from(a.transform.matrix));
  const h = l.getCamera().matrixWorld;
  return Xn.copy(h).multiply(Qn.invert()), Kn.copy(Xn).multiply(Vn), Kn.decompose(t, o, $t), !0;
}
const bt = Rt(null);
function Ot() {
  const e = xt(bt);
  if (!e) throw new Error("xrift-grab: useGrabbable must be used within <XRGrabProvider>");
  return e;
}
const Yn = ["left", "right"], $n = new L(), jn = new ne(), Zn = new L();
function Nt({ grabRadius: e = 0.45, children: n }) {
  const t = Sn((a) => a.gl), o = m(/* @__PURE__ */ new Map()), l = m({ left: null, right: null }), I = m(/* @__PURE__ */ new Set()), u = S((a, h) => {
    o.current.set(a, h);
  }, []), y = S((a) => {
    o.current.delete(a);
    for (const h of Yn)
      l.current[h]?.id === a && (l.current[h] = null);
  }, []), D = S(
    (a, h, A, R, O) => {
      const $ = o.current.get(a);
      if (!$ || !$.isFree()) return;
      const z = l.current[h];
      z && z.id !== a && o.current.get(z.id)?.endHold(), l.current[h] = { id: a, viaGrip: A }, $.beginHold(h, A, R, O);
    },
    []
  ), v = S((a, h) => {
    const A = o.current.get(a);
    for (const R of Yn)
      l.current[R]?.id === a && (l.current[R] = null);
    A?.endHold(h);
  }, []);
  Me(() => {
    const a = (z) => z.inputSource.handedness === "left" ? "left" : z.inputSource.handedness === "right" ? "right" : null, h = (z) => {
      const q = a(z);
      if (!q) return;
      const H = l.current[q];
      H === null ? I.current.add(q) : H.viaGrip = !0;
    }, A = (z) => {
      const q = a(z);
      if (!q) return;
      const H = l.current[q];
      H !== null && H.viaGrip && v(H.id);
    };
    let R = null;
    const O = () => {
      const z = t.xr.getSession();
      !z || z === R || (R = z, z.addEventListener("squeezestart", h), z.addEventListener("squeezeend", A));
    }, $ = () => {
      R && (R.removeEventListener("squeezestart", h), R.removeEventListener("squeezeend", A), R = null, I.current.clear());
    };
    return t.xr.addEventListener("sessionstart", O), t.xr.addEventListener("sessionend", $), O(), () => {
      t.xr.removeEventListener("sessionstart", O), t.xr.removeEventListener("sessionend", $), $();
    };
  }, [t, v]), gt(() => {
    if (I.current.size !== 0) {
      for (const a of I.current) {
        if (!St(t, a, $n, jn)) continue;
        let h = null, A = e;
        for (const [R, O] of o.current) {
          if (!O.isFree()) continue;
          O.worldPosition(Zn);
          const $ = Zn.distanceTo($n);
          $ < A && (A = $, h = R);
        }
        h && D(h, a, !0, $n, jn);
      }
      I.current.clear();
    }
  });
  const w = Ln(
    () => ({ grabRadius: e, register: u, unregister: y, requestGrab: D, requestDrop: v }),
    [e, u, y, D, v]
  );
  return /* @__PURE__ */ i(bt.Provider, { value: w, children: n });
}
const Jn = new L(), et = new ne(), On = new ne(), nt = new L(), Nn = new ne(), _t = new ne();
function qt(e) {
  const n = Ot(), t = Sn((E) => E.gl), { id: o } = e, l = m(e);
  l.current = e;
  const [I, u] = Pe(!1), [y, D] = Pe(null), v = m(null), w = m(new L()), a = m(new ne()), h = m(new L()), A = m(new ne()), R = S(() => {
    const E = l.current.isFree;
    return E ? E() : v.current === null;
  }, []), O = S((E) => {
    const x = l.current.worldPosition;
    x ? x(E) : l.current.worldPose(E, _t);
  }, []), $ = S(
    (E, x, X, te) => {
      if (x && X && te)
        l.current.worldPose(Jn, et), On.copy(te).invert(), a.current.copy(On).multiply(et), w.current.copy(Jn).sub(X).applyQuaternion(On);
      else {
        const N = l.current.defaultOffset;
        N ? (w.current.copy(N.position), a.current.copy(N.quaternion)) : (w.current.set(0, 0, 0), a.current.identity());
      }
      v.current = E, u(!0), D(E), l.current.onGrabStart?.(E, x);
    },
    []
  ), z = S((E) => {
    v.current !== null && (v.current = null, u(!1), D(null), E === null ? l.current.onDrop?.(null) : E ? l.current.onDrop?.(E) : l.current.onDrop?.({ position: h.current.clone(), quaternion: A.current.clone() }));
  }, []);
  Me(() => {
    const E = {
      isFree: R,
      worldPosition: O,
      beginHold: $,
      endHold: z
    };
    return n.register(o, E), () => n.unregister(o);
  }, [n, o, R, O, $, z]);
  const q = S(
    (E, x) => {
      const X = v.current;
      return X === null || !St(t, X, nt, Nn) ? !1 : (x.copy(Nn).multiply(a.current), E.copy(w.current).applyQuaternion(Nn).add(nt), h.current.copy(E), A.current.copy(x), !0);
    },
    [t]
  ), H = S((E, x) => {
    v.current !== null && (h.current.copy(E), A.current.copy(x));
  }, []), M = S(
    (E = "right") => {
      n.requestGrab(o, E, !1);
    },
    [n, o]
  );
  return { isHeld: I, heldHand: y, getAttachedPose: q, reportFallbackPose: H, grabViaClick: M, drop: z };
}
const Bn = new L(0, 1, 0), tt = new ne(), rt = new yt();
function ot(e, n, t) {
  const o = e.vrTracking;
  if (!o) return !1;
  const l = n === "right" ? o.rightHand.position : o.leftHand.position;
  return t.set(l.x, l.y, l.z), t.applyAxisAngle(Bn, e.rotation.yaw), t.x += e.position.x, t.y += e.position.y, t.z += e.position.z, !0;
}
function st(e, n, t) {
  const o = e.vrTracking;
  if (!o) return !1;
  const l = n === "right" ? o.rightHand.rotation : o.leftHand.rotation;
  return t.setFromAxisAngle(Bn, e.rotation.yaw), rt.set(l.x, l.y, l.z, "XYZ"), tt.setFromEuler(rt), t.multiply(tt), !0;
}
function Ct(e, n, t) {
  t.set(0.15, 0, -0.35), t.applyAxisAngle(Bn, e.rotation.yaw), t.x += e.position.x, t.y += e.position.y + n * 0.55, t.z += e.position.z;
}
const Un = 0.01, Wn = 4, Lt = 2e3, Dt = 2e4, Ut = 4, Gt = 1.2, Le = "line", kn = 0.035, le = "rainbow", on = [
  "#111111",
  "#e53935",
  "#fb8c00",
  "#fdd835",
  "#9ccc65",
  "#43a047",
  "#26a69a",
  "#26c6da",
  "#42a5f5",
  "#1f4fd8",
  "#8e24aa",
  "#d500f9",
  "#f06292",
  "#ffffff",
  le
];
function Te(e) {
  return Math.round(e * 1e3) / 1e3;
}
function Ht(e) {
  if (!Number.isFinite(e) || e <= 0.08) return 1;
  const n = Math.max(0, Math.min(1, (e - 0.08) / 1.12));
  return Math.round((1 - n * 0.82) * 1e3) / 1e3;
}
function Bt(e) {
  return e === "line" ? "ribbon" : e === "ribbon" ? "calligraphy" : e === "calligraphy" ? "eraser" : "line";
}
function Gn(e) {
  if (Number.isSafeInteger(e.penIndex) && e.penIndex >= 0) return e.penIndex;
  const n = e.sid.split(":")[1], t = Number(n);
  return Number.isSafeInteger(t) && t >= 0 ? t : null;
}
function gn(e) {
  return e.ownerUserId ? e.ownerUserId : e.sid.split(":")[0] || null;
}
class Wt {
  strokes = /* @__PURE__ */ new Map();
  /** 描画完了したストロークのsid（到着順） */
  finishedOrder = [];
  finished = /* @__PURE__ */ new Set();
  /** 変更通知用の世代カウンタ（Reactの再描画トリガ） */
  version = 0;
  get(n) {
    return this.strokes.get(n);
  }
  all() {
    return [...this.strokes.values()];
  }
  finishedStrokes() {
    return this.finishedOrder.map((n) => this.strokes.get(n)).filter((n) => n !== void 0);
  }
  /** 増分書き込み（自エコー・重複到着に冪等）。旧lineイベントも受理する */
  applySegment(n, t, o, l, I = 0, u = {}) {
    let y = this.strokes.get(n);
    y || (y = {
      sid: n,
      color: t,
      pts: [],
      hueOffset: I,
      brushId: u.brushId,
      size: u.size,
      orientations: u.orientations ? [] : void 0,
      pressures: u.pressures ? [] : void 0,
      timestamps: u.timestamps ? [] : void 0,
      penIndex: u.penIndex,
      ownerUserId: u.ownerUserId,
      ownerDisplayName: u.ownerDisplayName
    }, this.strokes.set(n, y)), u.brushId !== void 0 && (y.brushId = u.brushId), u.size !== void 0 && (y.size = u.size), u.penIndex !== void 0 && (y.penIndex = u.penIndex), u.ownerUserId !== void 0 && (y.ownerUserId = u.ownerUserId), u.ownerDisplayName !== void 0 && (y.ownerDisplayName = u.ownerDisplayName);
    const D = o * 3;
    for (let v = 0; v < l.length; v++)
      y.pts[D + v] = l[v];
    _n(y, "orientations", o * 4, u.orientations), _n(y, "pressures", o, u.pressures), _n(y, "timestamps", o, u.timestamps), this.version++;
  }
  markFinished(n) {
    this.finished.has(n) || this.strokes.has(n) && (this.finished.add(n), this.finishedOrder.push(n), this.trim(), this.version++);
  }
  /** 完成形ストロークの一括投入（late join時のinstance stateマージ） */
  merge(n) {
    let t = !1;
    for (const o of n)
      this.strokes.has(o.sid) || (this.strokes.set(o.sid, {
        sid: o.sid,
        color: o.color,
        pts: [...o.pts],
        hueOffset: o.hueOffset ?? 0,
        brushId: o.brushId,
        size: o.size,
        orientations: o.orientations ? [...o.orientations] : void 0,
        pressures: o.pressures ? [...o.pressures] : void 0,
        timestamps: o.timestamps ? [...o.timestamps] : void 0,
        penIndex: o.penIndex,
        ownerUserId: o.ownerUserId,
        ownerDisplayName: o.ownerDisplayName
      }), this.finished.add(o.sid), this.finishedOrder.push(o.sid), t = !0);
    t && (this.trim(), this.version++);
  }
  remove(n) {
    this.strokes.delete(n) && (this.finished.delete(n), this.finishedOrder = this.finishedOrder.filter((t) => t !== n), this.version++);
  }
  clear() {
    this.strokes.size !== 0 && (this.strokes.clear(), this.finished.clear(), this.finishedOrder = [], this.version++);
  }
  /** 合計点数が予算を超えたら古い完成ストロークから捨てる */
  trim() {
    let n = 0;
    for (const t of this.strokes.values()) n += t.pts.length / 3;
    for (; n > Dt && this.finishedOrder.length > 0; ) {
      const t = this.finishedOrder[0], o = this.strokes.get(t);
      n -= o ? o.pts.length / 3 : 0, this.remove(t);
    }
  }
}
function _n(e, n, t, o) {
  if (!o) return;
  const l = e[n] ?? [];
  for (let I = 0; I < o.length; I += 1) l[t + I] = o[I];
  e[n] = l;
}
const vr = [
  { id: "line", label: "LINE", description: "DcPen互換の均一な線" },
  { id: "ribbon", label: "RIBBON", description: "向きと描画速度で幅が変わる平筆" },
  { id: "calligraphy", label: "FUDE", description: "速度と筆先方向で強弱・入り抜きを作る筆" }
], kt = 0.02 * (Un / 0.015 / Wn), yn = /* @__PURE__ */ new Map(), In = /* @__PURE__ */ new Map(), he = new zt();
function vt(e) {
  const n = [];
  for (let t = 0; t + 2 < e.length; t += 3) {
    const o = [e[t], e[t + 1], e[t + 2]];
    o.every(Number.isFinite) && n.push(o);
  }
  return n;
}
function Ft(e, n) {
  if (n.length < 3) return n;
  const t = yn.get(e);
  if (t?.count === n.length) return t.points;
  const l = new Et(n.map((I) => new L(...I)), !1, "centripetal").getPoints((n.length - 1) * Wn).map((I) => [I.x, I.y, I.z]);
  return yn.set(e, { count: n.length, points: l }), l;
}
function Qt(e, n, t) {
  const o = In.get(e);
  if (o?.count === n && o.offset === t) return o.colors;
  const l = [];
  for (let I = 0; I < n; I += 1)
    he.setHSL((I + t) * kt % 1, 1, 0.6), l.push([he.r, he.g, he.b]);
  return In.set(e, { count: n, offset: t, colors: l }), l;
}
function Vt(e) {
  if (yn.size > e.size * 2 + 16)
    for (const n of yn.keys()) e.has(n) || yn.delete(n);
  if (In.size > e.size * 2 + 16)
    for (const n of In.keys()) e.has(n) || In.delete(n);
}
function Xt(e, n, t, o) {
  const l = Math.max(0, Math.min(1, n));
  if (e !== "calligraphy") return 0.18 + l * 1.27;
  const I = Math.min(1, (t + 1) / 4), u = Math.min(1, Math.max(1, o - t) / 5), y = Math.max(0.06, Math.min(I, u));
  return (0.08 + l * 1.62) * y;
}
function Kt(e) {
  const n = vt(e.pts);
  if (n.length < 2) return null;
  const t = new Float32Array(n.length * 2 * 3), o = e.color === le ? new Float32Array(n.length * 2 * 3) : void 0, l = new Uint32Array((n.length - 1) * 6), I = new ne(), u = new L(), y = new L(), D = new L(0, 1, 0), v = Math.max(4e-3, Math.min(0.12, e.size ?? kn));
  for (let w = 0; w < n.length; w += 1) {
    const a = new L(...n[w]), h = n[Math.max(0, w - 1)], A = n[Math.min(n.length - 1, w + 1)];
    y.set(A[0] - h[0], A[1] - h[1], A[2] - h[2]).normalize();
    const R = w * 4, O = e.orientations;
    O && R + 3 < O.length && O.slice(R, R + 4).every(Number.isFinite) ? (I.set(O[R], O[R + 1], O[R + 2], O[R + 3]).normalize(), u.set(1, 0, 0).applyQuaternion(I), u.addScaledVector(y, -u.dot(y)), u.lengthSq() < 1e-5 && (u.set(0, 1, 0).applyQuaternion(I), u.addScaledVector(y, -u.dot(y)))) : u.copy(D).addScaledVector(y, -D.dot(y)), u.lengthSq() < 1e-5 && u.set(1, 0, 0), u.normalize();
    const $ = Math.max(0, Math.min(1, e.pressures?.[w] ?? 0.7)), z = v * Xt(
      e.brushId ?? Le,
      $,
      w,
      n.length
    ) * 0.5, q = a.clone().addScaledVector(u, -z), H = a.clone().addScaledVector(u, z);
    t.set([q.x, q.y, q.z, H.x, H.y, H.z], w * 6), o && (he.setHSL((e.hueOffset + w) * 0.02 % 1, 1, 0.6), o.set([he.r, he.g, he.b, he.r, he.g, he.b], w * 6));
  }
  for (let w = 0; w < n.length - 1; w += 1) {
    const a = w * 2;
    l.set([a, a + 1, a + 2, a + 1, a + 3, a + 2], w * 6);
  }
  return { positions: t, colors: o, indices: l };
}
function Yt({ cacheKey: e, stroke: n }) {
  const t = vt(n.pts);
  if (t.length < 2) return null;
  const o = Ft(e, t);
  return n.color === le ? /* @__PURE__ */ i(
    Fn,
    {
      points: o,
      vertexColors: Qt(e, o.length, (n.hueOffset ?? 0) * Wn),
      color: "#ffffff",
      lineWidth: 4
    }
  ) : /* @__PURE__ */ i(Fn, { points: o, color: n.color, lineWidth: 4 });
}
function jt({ stroke: e, count: n }) {
  const t = Ln(
    () => Kt(e),
    [n, e.brushId, e.color, e.hueOffset, e.size, e]
  ), o = Ln(() => {
    if (!t) return null;
    const l = new At();
    return l.setAttribute("position", new En(t.positions, 3)), t.colors && l.setAttribute("color", new En(t.colors, 3)), l.setIndex(new En(t.indices, 1)), l.computeVertexNormals(), l;
  }, [t]);
  return Me(() => () => o?.dispose(), [o]), o ? /* @__PURE__ */ i("mesh", { geometry: o, children: /* @__PURE__ */ i("meshBasicMaterial", { color: e.color === le ? "#ffffff" : e.color, vertexColors: !!t?.colors, side: Ce, toneMapped: !1 }) }) : null;
}
const Zt = Tt(
  ({ cacheKey: e, stroke: n, count: t = n.pts.length }) => {
    const o = e ?? n.sid, l = n.brushId ?? Le;
    return l === "ribbon" || l === "calligraphy" ? /* @__PURE__ */ i(jt, { stroke: n, count: t }) : /* @__PURE__ */ i(Yt, { cacheKey: o, stroke: n });
  }
), pn = [
  { id: "line", label: "線", kind: "tool", mode: "line", color: "#0f766e" },
  { id: "ribbon", label: "リボン", kind: "tool", mode: "ribbon", color: "#c2410c" },
  { id: "calligraphy", label: "筆", kind: "tool", mode: "calligraphy", color: "#7c3aed" },
  { id: "eraser", label: "消す", kind: "tool", mode: "eraser", color: "#64748b" },
  { id: "colors", label: "色", kind: "colors", color: "#f8fafc" }
], rn = on;
function wt(e) {
  return Number.isFinite(e) ? Math.max(1, Math.min(on.length, Math.floor(e))) : on.length;
}
function Jt(e) {
  return on.slice(0, wt(e));
}
function it(e, n, t) {
  if (n <= 0) return [0, 0, 0];
  const o = Math.PI / 2 - e / n * Math.PI * 2;
  return [Math.cos(o) * t, Math.sin(o) * t, 0];
}
const er = [
  "黒",
  "赤",
  "オレンジ",
  "黄",
  "黄緑",
  "緑",
  "エメラルド",
  "シアン",
  "水色",
  "青",
  "紫",
  "マゼンタ",
  "ピンク",
  "白",
  "虹"
], Hn = (e) => {
  const n = on.indexOf(e);
  return n >= 0 ? er[n] ?? e : e;
}, ct = ["#8e4a5b", "#3f8f6a", "#3f6ba0"], nr = 0.45, tr = 0.07, rr = 0.04, or = 300, sr = 0.052, ir = 1e3, cr = 6500, lr = 0.18, ur = 0.225, ar = 3e3;
function fr(e) {
  if (typeof e == "string") return e;
  if (e && typeof e == "object") {
    const n = e;
    for (const t of ["id", "socketId", "userId"]) {
      const o = n[t];
      if (typeof o == "string") return o;
    }
  }
  return null;
}
function dr(e) {
  if (!e) return null;
  if (typeof e == "string") return { id: e, hand: "right" };
  const n = e;
  return typeof n.id == "string" ? { id: n.id, hand: n.hand === "left" ? "left" : "right" } : null;
}
function lt(e) {
  return [e.x, e.y, e.z, e.w].map(
    (n) => Math.round(n * 1e3) / 1e3
  );
}
function ut(e, n, t) {
  if (n <= 0 || t <= 0) return { value: 1, source: "speed" };
  const o = n / t;
  return { value: Ht(o), source: "speed" };
}
function Mt(e, n, t) {
  return {
    brushId: e.brushId,
    size: e.size,
    orientations: e.orientations?.slice(n * 4, t * 4),
    pressures: e.pressures?.slice(n, t),
    timestamps: e.timestamps?.slice(n, t),
    penIndex: e.penIndex,
    ownerUserId: e.ownerUserId,
    ownerDisplayName: e.ownerDisplayName
  };
}
function at(e, n, t) {
  return {
    sid: e.sid,
    color: e.color,
    off: n,
    pts: e.pts.slice(n * 3, t * 3),
    hueOffset: e.hueOffset,
    ...Mt(e, n, t)
  };
}
const ze = new ne(), Pn = new L(), Ve = new L(), we = new L(), ft = new L(), dt = new sn(), Rn = new L(), pt = new L(), xn = new L(), hn = new ne(), ht = new sn(), pr = new ne().setFromEuler(new yt(-Math.PI / 2, 0, 0)), wr = ({
  position: e = [0, 0, 0],
  rotationY: n = 0,
  syncId: t = "dcpen",
  enableBrushControls: o = !1,
  enableQuickRing: l = !1,
  penCount: I = on.length,
  debugQuickRingPreview: u = !1,
  defaultBrush: y = Le,
  defaultRibbonSize: D = kn,
  onSelectedPenChange: v,
  debugApi: w
}) => {
  const a = t, h = wt(I), A = h + ct.length, R = Jt(h), O = Sn((s) => s.scene), $ = Sn((s) => s.gl), { localUser: z } = It(), q = z?.id ?? "dev-local", H = m(null);
  H.current || (H.current = new Wt());
  const M = H.current, [, E] = Pe(0), x = S(() => E((s) => s + 1), []), X = Math.max(0.012, Math.min(0.08, D)), te = o ? y : "line", [N, bn] = Pe(0), [De, cn] = Pe("all"), [zn, Ue] = Pe({}), [ln, un] = Pe(null), [C, vn] = Pe({
    penIndex: 0,
    value: 0,
    min: 0,
    max: 0,
    source: "speed",
    active: !1
  }), [Ge, F] = mn(
    `${a}:brush-settings-v1`,
    Array.from({ length: h }, () => ({ id: te, size: X }))
  ), re = m([]);
  re.current = Array.from({ length: h }, (s, f) => {
    const b = Array.isArray(Ge) ? Ge[f] : void 0;
    return b && (b.id === "line" || b.id === "ribbon" || b.id === "calligraphy") ? { id: b.id, size: Math.max(0.012, Math.min(0.08, b.size || X)) } : { id: te, size: X };
  });
  const K = re.current[N] ?? { id: te, size: X }, He = zn[N] ?? K.id, [Re, Be] = mn(
    `${a}:pen-colors-v1`,
    R
  ), oe = m([]);
  oe.current = Array.from({ length: h }, (s, f) => {
    const b = Array.isArray(Re) ? Re[f] : void 0;
    return typeof b == "string" && (b === le || /^#[0-9a-f]{6}$/i.test(b)) ? b : R[f] ?? "#111111";
  });
  const se = S((s) => {
    s < 0 || s >= h || (bn(s), v?.(s));
  }, [h, v]), me = S((s) => {
    const b = re.current.map((Q, fe) => fe === N ? { ...Q, ...s } : Q);
    F(b), s.id && Ue((Q) => ({ ...Q, [N]: s.id }));
  }, [N, F]), Xe = S((s, f) => {
    Ue((b) => ({ ...b, [s]: f }));
  }, []), _ = S((s, f) => {
    if (s < 0 || s >= h || !rn.includes(f)) return;
    const b = oe.current.map((Q, fe) => fe === s ? f : Q);
    Be(b), se(s);
  }, [se, Be]);
  Me(() => v?.(0), [v]);
  const [Ae, ue] = mn(`${a}:strokes`, []);
  Me(() => {
    Array.isArray(Ae) && Ae.length > 0 && (M.merge(Ae), x());
  }, [Ae, M, x]);
  const Ee = tn(`${a}:seg`, (s) => {
    M.applySegment(s.sid, s.color, s.off, s.pts, s.hueOffset, s), x();
  }), an = tn(`${a}:end`, (s) => {
    M.markFinished(s.sid), x();
  }), ae = tn(`${a}:undo`, (s) => {
    M.remove(s.sid), x();
  }), xe = tn(`${a}:clear`, () => {
    M.clear(), x();
  }), Y = m(null), We = S(() => {
    Y.current !== null && (clearTimeout(Y.current), Y.current = null), ue(M.finishedStrokes());
  }, [ue, M]), B = S(() => {
    Y.current === null && (Y.current = setTimeout(() => {
      Y.current = null, ue(M.finishedStrokes());
    }, ar));
  }, [ue, M]);
  Me(
    () => () => {
      Y.current !== null && clearTimeout(Y.current);
    },
    []
  ), tn("user-joined", () => {
    Y.current !== null && We();
  });
  const ge = m({}), ye = S((s, f) => {
    const b = ge.current[f] ?? [];
    b.push(s), ge.current[f] = b;
  }, []), $e = S(() => {
    const s = ge.current[N]?.pop();
    s && (M.remove(s), ae({ sid: s }), B(), x());
  }, [M, ae, B, x, N]), Ke = S(() => {
    M.clear(), xe({}), We(), ge.current = {}, x();
  }, [M, xe, We, x]), fn = S(() => {
    for (const s of M.all())
      gn(s) === q && (M.remove(s.sid), ae({ sid: s.sid }));
    ge.current = {}, B(), x();
  }, [x, ae, q, B, M]), Oe = S(
    (s) => {
      M.remove(s), ae({ sid: s }), B(), x();
    },
    [M, ae, B, x]
  ), Ye = S(
    (s) => {
      for (const f of M.all())
        Gn(f) === s && gn(f) === q && (M.remove(f.sid), ae({ sid: f.sid }));
      B(), x();
    },
    [M, ae, B, x, q]
  );
  Me(() => {
    w?.({
      undo: $e,
      clear: Ke,
      strokeCount: () => M.all().length,
      strokeColors: () => M.all().map((s) => s.color),
      inject: (s) => {
        M.merge(s), x();
      }
    });
  }, [w, $e, Ke, M, x]);
  const W = m({
    left: { down: !1, seq: 0, source: null },
    right: { down: !1, seq: 0, source: null }
  }), Ie = m({ left: !1, right: !1 }), ie = m({ left: null, right: null }), je = m({ left: 0, right: 0 }), Se = m({ left: !1, right: !1 }), Ze = m(new Array(A).fill(null)), Je = S((s, f) => {
    const b = ie.current[s];
    if (b !== null) {
      if (Ie.current[s] = f === "eraser", f !== "eraser") {
        const Q = re.current;
        F(Q.map(
          (fe, nn) => nn === b ? { ...fe, id: f } : fe
        ));
      }
      Ue((Q) => ({ ...Q, [b]: f })), se(b);
    }
  }, [se, F]), ke = S((s) => {
    const f = ie.current[s];
    if (f === null) return;
    const b = Ie.current[s] ? "eraser" : re.current[f]?.id ?? Le;
    Je(s, Bt(b));
  }, [Je]), wn = S((s) => {
    const f = ie.current[s];
    f !== null && (un({ penIndex: f, hand: s, nonce: performance.now() }), se(f));
  }, [se]);
  Me(() => {
    !l || !u || un({
      penIndex: 0,
      hand: "right",
      nonce: performance.now(),
      preview: !0,
      previewPage: u === "colors" ? "colors" : "tools"
    });
  }, [u, l]), Me(() => {
    const s = (c, g = null) => {
      const T = performance.now();
      Se.current[c] && T - je.current[c] < or ? (l ? wn(c) : ke(c), je.current[c] = 0) : je.current[c] = T, W.current[c].down = !0, W.current[c].seq += 1, W.current[c].source = g;
    }, f = (c) => {
      W.current[c].down = !1, W.current[c].source = null;
    }, b = (c) => {
      c.button === 0 && s("right");
    }, Q = (c) => {
      c.button === 0 && f("right");
    };
    window.addEventListener("pointerdown", b), window.addEventListener("pointerup", Q);
    const fe = (c) => c.inputSource.handedness === "left" ? "left" : c.inputSource.handedness === "right" ? "right" : null, nn = (c) => {
      const g = fe(c);
      g && s(g, c.inputSource);
    }, Mn = (c) => {
      const g = fe(c);
      g && f(g);
    };
    let Ne = null;
    const r = () => {
      const c = $.xr.getSession();
      !c || c === Ne || (Ne = c, c.addEventListener("selectstart", nn), c.addEventListener("selectend", Mn));
    }, p = () => {
      Ne && (Ne.removeEventListener("selectstart", nn), Ne.removeEventListener("selectend", Mn), Ne = null, W.current.left.down = !1, W.current.right.down = !1, W.current.left.source = null, W.current.right.source = null);
    };
    return $.xr.addEventListener("sessionstart", r), $.xr.addEventListener("sessionend", p), r(), () => {
      window.removeEventListener("pointerdown", b), window.removeEventListener("pointerup", Q), $.xr.removeEventListener("sessionstart", r), $.xr.removeEventListener("sessionend", p), p();
    };
  }, [ke, l, $, wn]);
  const be = S(() => {
    for (const s of Ze.current) s?.();
  }, []), dn = M.all(), en = dn.filter((s) => De === "mine" ? gn(s) === q : De === "pen" ? Gn(s) === N : !0);
  Vt(new Set(dn.map((s) => `${a}|${s.sid}`)));
  const ve = (s) => (s - (h - 1) / 2) * 0.17, An = (s) => ve(h - 1) + 0.32 + s * 0.13;
  return /* @__PURE__ */ P("group", { position: e, rotation: [0, n, 0], children: [
    /* @__PURE__ */ P(Nt, { grabRadius: nr, children: [
      /* @__PURE__ */ i("pointLight", { position: [0, 1.9, 0.3], intensity: 1.6, distance: 5, color: "#ffd49a" }),
      oe.current.map((s, f) => /* @__PURE__ */ i(
        mt,
        {
          index: f,
          kind: "pen",
          color: s,
          colorName: Hn(s),
          slotOffset: [ve(f), 1.05, 0],
          syncId: a,
          store: M,
          emitSeg: Ee,
          emitEnd: an,
          persistFinished: B,
          bump: x,
          drawInput: W,
          anyHeldByHand: Se,
          pushUndoSid: ye,
          eraserMode: Ie,
          heldPenIndexByHand: ie,
          eraseStroke: Oe,
          putAwayFns: Ze,
          brushSettingsByPen: re,
          onSelectPen: se,
          onToolModeChange: Xe,
          onQuickToolSelect: Je,
          onColorChange: _,
          quickRingRequest: l ? ln : null,
          onPressureTelemetry: vn
        },
        `pen-${f}`
      )),
      ct.map((s, f) => /* @__PURE__ */ i(
        mt,
        {
          index: h + f,
          kind: "eraser",
          color: s,
          colorName: "消しゴム",
          slotOffset: [An(f), 1.15, 0],
          syncId: a,
          store: M,
          emitSeg: Ee,
          emitEnd: an,
          persistFinished: B,
          bump: x,
          drawInput: W,
          anyHeldByHand: Se,
          pushUndoSid: ye,
          eraserMode: Ie,
          heldPenIndexByHand: ie,
          eraseStroke: Oe,
          putAwayFns: Ze,
          brushSettingsByPen: re,
          onSelectPen: se,
          onToolModeChange: Xe,
          onQuickToolSelect: Je,
          onColorChange: _,
          quickRingRequest: null,
          onPressureTelemetry: vn
        },
        s
      )),
      oe.current.map((s, f) => /* @__PURE__ */ P("group", { children: [
        /* @__PURE__ */ i(
          ee,
          {
            position: [ve(f), 1.44, 0.025],
            fontSize: 0.04,
            color: "#172033",
            anchorX: "center",
            anchorY: "middle",
            outlineWidth: 3e-3,
            outlineColor: "#ffffff",
            children: `P${f + 1}`
          }
        ),
        /* @__PURE__ */ i(
          J,
          {
            id: `${a}-respawn-${f}`,
            position: [ve(f), 1.62, 0],
            size: [0.09, 0.07, 0.02],
            color: "#37474f",
            label: "戻す",
            fontSize: 0.018,
            interactionText: `P${f + 1}（${Hn(s)}）を片づける`,
            onInteract: () => Ze.current[f]?.(),
            children: /* @__PURE__ */ P("mesh", { position: [0, -0.05, 0], children: [
              /* @__PURE__ */ i("boxGeometry", { args: [0.1, 0.016, 0.02] }),
              /* @__PURE__ */ i(
                "meshStandardMaterial",
                {
                  color: s === le ? "#ffffff" : s,
                  emissive: s === le ? "#ffffff" : s,
                  emissiveIntensity: 0.5
                }
              )
            ] })
          }
        ),
        /* @__PURE__ */ i(
          J,
          {
            id: `${a}-clearcolor-${f}`,
            position: [ve(f), 0.62, 0],
            size: [0.09, 0.07, 0.02],
            color: "#4a3b57",
            label: "消す",
            fontSize: 0.017,
            interactionText: `P${f + 1}で自分が描いた線を消す`,
            onInteract: () => {
              se(f), Ye(f);
            }
          }
        )
      ] }, `ui-pen-${f}`)),
      /* @__PURE__ */ i(
        J,
        {
          id: `${a}-undo`,
          position: [ve(0) - 0.35, 1.45, 0],
          color: "#8a6d00",
          label: "Undo",
          interactionText: "1本戻す（自分の線）",
          onInteract: $e
        }
      ),
      /* @__PURE__ */ i(
        J,
        {
          id: `${a}-clear`,
          position: [ve(0) - 0.35, 1.2, 0],
          color: "#8a0015",
          label: "Clear Mine",
          fontSize: 0.019,
          interactionText: "自分が描いた線だけをぜんぶ消す",
          onInteract: fn
        }
      ),
      /* @__PURE__ */ i(
        J,
        {
          id: `${a}-reset`,
          position: [ve(0) - 0.35, 0.95, 0],
          color: "#1d4f9e",
          label: "All Reset",
          fontSize: 0.019,
          interactionText: "ペンと消しゴムをぜんぶ片づける",
          onInteract: be
        }
      ),
      o ? /* @__PURE__ */ P("group", { children: [
        /* @__PURE__ */ i(ee, { position: [0.15, 1.92, 0.01], fontSize: 0.042, color: "#172033", anchorX: "center", children: "DOUBLE CLICK: LINE > RIBBON > FUDE > ERASE" }),
        /* @__PURE__ */ i(
          J,
          {
            id: `${a}-brush-line`,
            position: [-0.48, 1.78, 0],
            size: [0.24, 0.12, 0.035],
            color: He === "line" ? "#0f766e" : "#475569",
            label: "LINE",
            fontSize: 0.035,
            interactionText: "通常のDcPen線に切り替える",
            onInteract: () => me({ id: "line" })
          }
        ),
        /* @__PURE__ */ i(
          J,
          {
            id: `${a}-brush-ribbon`,
            position: [-0.17, 1.78, 0],
            size: [0.34, 0.12, 0.035],
            color: He === "ribbon" ? "#c2410c" : "#475569",
            label: "RIBBON",
            fontSize: 0.032,
            interactionText: "速度で幅が変わるリボン筆に切り替える",
            onInteract: () => me({ id: "ribbon" })
          }
        ),
        /* @__PURE__ */ i(
          J,
          {
            id: `${a}-brush-calligraphy`,
            position: [0.15, 1.78, 0],
            size: [0.24, 0.12, 0.035],
            color: He === "calligraphy" ? "#7c3aed" : "#475569",
            label: "FUDE",
            fontSize: 0.03,
            interactionText: "入りと抜きのある筆ブラシに切り替える",
            onInteract: () => me({ id: "calligraphy" })
          }
        ),
        /* @__PURE__ */ i(
          J,
          {
            id: `${a}-brush-thinner`,
            position: [0.41, 1.78, 0],
            size: [0.18, 0.12, 0.035],
            color: "#334155",
            label: "THIN",
            fontSize: 0.027,
            interactionText: "ブラシを細くする",
            onInteract: () => me({ size: Math.max(0.012, Math.round((K.size - 6e-3) * 1e3) / 1e3) })
          }
        ),
        /* @__PURE__ */ i(
          J,
          {
            id: `${a}-brush-wider`,
            position: [0.63, 1.78, 0],
            size: [0.18, 0.12, 0.035],
            color: "#334155",
            label: "WIDE",
            fontSize: 0.027,
            interactionText: "ブラシを太くする",
            onInteract: () => me({ size: Math.min(0.08, Math.round((K.size + 6e-3) * 1e3) / 1e3) })
          }
        ),
        /* @__PURE__ */ i(ee, { position: [0.76, 1.78, 0.02], fontSize: 0.029, color: "#172033", anchorX: "left", children: `P${N + 1} ${He.toUpperCase()} ${Math.round(K.size * 1e3)}mm` }),
        /* @__PURE__ */ i(ee, { position: [-0.72, 2.1, 0.02], fontSize: 0.033, color: "#172033", anchorX: "left", children: `WIDTH ${Math.round((C.penIndex === N ? C.value : 0) * 100)}% SPEED` }),
        /* @__PURE__ */ i(ee, { position: [0.05, 2.1, 0.02], fontSize: 0.028, color: "#9a3412", anchorX: "left", children: C.penIndex === N && !C.active ? `RANGE ${Math.round(C.min * 100)}-${Math.round(C.max * 100)}%` : "SLOW = THICK / FAST = THIN" }),
        /* @__PURE__ */ i("group", { position: [-0.7, 2.2, 0.01], children: Array.from({ length: 10 }, (s, f) => /* @__PURE__ */ P("mesh", { position: [f * 0.14, 0, 0], children: [
          /* @__PURE__ */ i("boxGeometry", { args: [0.11, 0.055, 0.025] }),
          /* @__PURE__ */ i(
            "meshStandardMaterial",
            {
              color: f < Math.ceil((C.penIndex === N ? C.value : 0) * 10) ? "#f97316" : "#cbd5e1",
              emissive: f < Math.ceil((C.penIndex === N ? C.value : 0) * 10) ? "#f97316" : "#000000",
              emissiveIntensity: 0.4
            }
          )
        ] }, f)) }),
        /* @__PURE__ */ i(J, { id: `${a}-view-all`, position: [-0.42, 2.34, 0], size: [0.3, 0.1, 0.03], color: De === "all" ? "#2563eb" : "#64748b", label: "ALL", fontSize: 0.028, interactionText: "全員の線を表示", onInteract: () => cn("all") }),
        /* @__PURE__ */ i(J, { id: `${a}-view-mine`, position: [-0.06, 2.34, 0], size: [0.34, 0.1, 0.03], color: De === "mine" ? "#2563eb" : "#64748b", label: "MINE", fontSize: 0.028, interactionText: "自分の線だけ表示", onInteract: () => cn("mine") }),
        /* @__PURE__ */ i(J, { id: `${a}-view-pen`, position: [0.33, 2.34, 0], size: [0.34, 0.1, 0.03], color: De === "pen" ? "#2563eb" : "#64748b", label: "PEN", fontSize: 0.028, interactionText: "選択中の物理ペンの線だけ表示", onInteract: () => cn("pen") })
      ] }) : null
    ] }),
    Tn(
      /* @__PURE__ */ i("group", { children: en.map((s) => /* @__PURE__ */ i(Zt, { cacheKey: `${a}|${s.sid}`, stroke: s, count: s.pts.length }, s.sid)) }),
      O
    )
  ] });
}, mt = ({
  index: e,
  kind: n,
  color: t,
  colorName: o,
  slotOffset: l,
  syncId: I,
  store: u,
  emitSeg: y,
  emitEnd: D,
  persistFinished: v,
  bump: w,
  drawInput: a,
  anyHeldByHand: h,
  pushUndoSid: A,
  eraserMode: R,
  heldPenIndexByHand: O,
  eraseStroke: $,
  putAwayFns: z,
  brushSettingsByPen: q,
  onSelectPen: H,
  onToolModeChange: M,
  onQuickToolSelect: E,
  onColorChange: x,
  quickRingRequest: X,
  onPressureTelemetry: te
}) => {
  const N = I, { localUser: bn, getMovement: De, getLocalMovement: cn, getAvatarHeight: zn } = It(), Ue = Sn((r) => r.scene), ln = bn?.id ?? "dev-local", un = bn?.displayName || "名前なしユーザー", C = m(ln);
  C.current = ln;
  const [vn, Ge] = mn(`${N}:holder:${e}`, null), [F, re] = mn(`${N}:pose:${e}`, null), K = dr(vn), He = K !== null && K.id === ln, Re = m(null);
  Re.current = K;
  const Be = m(null);
  Be.current = F;
  const oe = m(null), se = m(0), me = m(0), Xe = m(0), _ = m(new L()), Ae = m(new L()), ue = m(new L()), Ee = m(!1), an = m(null), ae = m(null), xe = m(null), Y = m(-1), We = m(null), [B, ge] = Pe(null), ye = m(null);
  ye.current = B;
  const $e = m(null), Ke = m([]), fn = m(null), [Oe, Ye] = Pe(null), W = m(null), Ie = m(0), ie = S(() => {
    ye.current = null, ge(null), W.current = null, Ye(null), Ie.current = 0;
  }, []), je = S((r, p, c, g = "tools") => {
    p.getWorldPosition(Ve), ht.lookAt(Ve, r, p.up), hn.setFromRotationMatrix(ht);
    const T = {
      position: [r.x, r.y, r.z],
      quaternion: [hn.x, hn.y, hn.z, hn.w],
      page: g,
      openedAt: performance.now(),
      preview: c
    };
    ye.current = T, ge(T), W.current = null, Ye(null), Ie.current = 0;
  }, []);
  tn("user-left", (r) => {
    const p = fr(r);
    p !== null && p === Re.current?.id && Ge(null);
  });
  const Se = S(() => {
    const r = oe.current;
    if (!r) return;
    oe.current = null;
    const p = u.get(r.sid);
    if (!p || r.count < 2) {
      u.remove(r.sid), te({
        penIndex: e,
        value: r.maxPressure,
        min: r.minPressure,
        max: r.maxPressure,
        source: r.pressureSource,
        active: !1
      }), w();
      return;
    }
    r.sent < r.count && y(at(p, r.sent, r.count)), D({ sid: r.sid }), u.markFinished(r.sid), A(r.sid, e), te({
      penIndex: e,
      value: r.maxPressure,
      min: r.minPressure,
      max: r.maxPressure,
      source: r.pressureSource,
      active: !1
    }), v(), w();
  }, [u, y, D, v, A, w, e, te]), Ze = S(
    (r, p) => {
      const c = Be.current, g = We.current;
      c ? (r.set(c.p[0], c.p[1], c.p[2]), p.set(c.q[0], c.q[1], c.q[2], c.q[3])) : g ? (g.getWorldPosition(r), g.getWorldQuaternion(p), n === "pen" && p.multiply(pr)) : (r.set(0, 0, 0), p.identity());
    },
    [n]
  ), Je = S(
    (r) => {
      const p = Be.current, c = We.current;
      p ? r.set(p.p[0], p.p[1], p.p[2]) : c ? (c.getWorldPosition(r), n === "pen" && (r.y += 0.17)) : r.set(0, 0, 0);
    },
    [n]
  ), ke = m(null), wn = S(() => {
    const r = ke.current;
    r !== null && (ke.current = null, h.current[r] = !1, R.current[r] = !1, O.current[r] = null, ie(), n === "pen" && M(e, q.current[e]?.id ?? Le));
  }, [h, q, ie, R, O, e, n, M]), be = qt({
    id: `${N}-slot-${e}`,
    isFree: () => Re.current === null,
    worldPosition: Je,
    worldPose: Ze,
    defaultOffset: {
      position: new L(0, 0, n === "pen" ? -0.08 : -0.03),
      quaternion: new ne()
    },
    onGrabStart: (r) => {
      n === "pen" && H(e), Ge({ id: C.current, hand: r }), ke.current = r, h.current[r] = !0, R.current[r] = !1, O.current[r] = n === "pen" ? e : null, n === "pen" && M(e, q.current[e]?.id ?? Le), Y.current = a.current[r].down ? a.current[r].seq : -1;
    },
    onDrop: (r) => {
      Se(), re(r ? {
        p: [Te(r.position.x), Te(r.position.y), Te(r.position.z)],
        q: [
          Math.round(r.quaternion.x * 1e3) / 1e3,
          Math.round(r.quaternion.y * 1e3) / 1e3,
          Math.round(r.quaternion.z * 1e3) / 1e3,
          Math.round(r.quaternion.w * 1e3) / 1e3
        ]
      } : null), Ge(null), wn();
    }
  }), dn = S(() => {
    be.drop(null);
  }, [be]), en = S(() => {
    Re.current === null && re(null);
  }, [re]);
  Me(() => (z.current[e] = en, () => {
    z.current[e] = null;
  }), [e, en, z]);
  const ve = S(() => {
    for (const r of u.all()) {
      if (gn(r) !== C.current) continue;
      let p = !1;
      for (let c = 0; c + 2 < r.pts.length; c += 3) {
        const g = r.pts[c], T = r.pts[c + 1], U = r.pts[c + 2];
        if (!(g === void 0 || T === void 0 || U === void 0) && (Rn.set(g, T, U), Rn.distanceTo(_.current) < tr)) {
          p = !0;
          break;
        }
      }
      p && $(r.sid);
    }
  }, [u, $]), An = S(() => {
    for (const r of u.all()) {
      if (gn(r) !== C.current || Gn(r) !== e) continue;
      const p = r.pts;
      let c = !1;
      const g = [];
      let T = [], U = 0;
      for (let k = 0; k + 2 < p.length; k += 3) {
        const de = p[k], pe = p[k + 1], _e = p[k + 2];
        de === void 0 || pe === void 0 || _e === void 0 || (Rn.set(de, pe, _e), Rn.distanceTo(_.current) < rr ? (c = !0, T.length >= 6 && g.push({ pts: T, start: U }), T = []) : (T.length === 0 && (U = k / 3), T.push(de, pe, _e)));
      }
      if (T.length >= 6 && g.push({ pts: T, start: U }), !c) continue;
      const j = r.hueOffset ?? 0;
      $(r.sid);
      for (const k of g) {
        me.current += 1;
        const de = `${C.current}:${e}:${Date.now().toString(36)}:${me.current}`, pe = j + k.start, _e = k.pts.length / 3, d = Mt(r, k.start, k.start + _e);
        u.applySegment(de, r.color, 0, k.pts, pe, d), u.markFinished(de), y({ sid: de, color: r.color, off: 0, pts: k.pts, hueOffset: pe, ...d }), D({ sid: de });
      }
      v(), w();
    }
  }, [u, $, y, D, v, w, e]);
  gt(({ camera: r, clock: p }) => {
    const c = an.current, g = Re.current, T = X?.penIndex === e ? X : null;
    if (T?.preview && $e.current !== T.nonce && ($e.current = T.nonce, r.getWorldPosition(Ve), r.getWorldDirection(Pn), pt.copy(Ve).addScaledVector(Pn, 1.35), je(pt, r, !0, T.previewPage ?? "tools")), g === null) {
      c && (c.visible = !1), oe.current && Se(), xe.current = null;
      return;
    }
    let U = !1;
    if (we.copy(_.current), g.id === C.current)
      if (be.getAttachedPose(we, ze))
        _.current.copy(we), c && c.quaternion.copy(ze), U = !0;
      else {
        const d = cn();
        d.isInVR && d.vrTracking ? (U = ot(d, g.hand, _.current), we.copy(_.current), st(d, g.hand, ze) && c && c.quaternion.copy(ze)) : (r.getWorldPosition(Ve), r.getWorldDirection(Pn), _.current.copy(Ve).addScaledVector(Pn, Gt), ft.set(0.17, -0.11, -0.4).applyQuaternion(r.quaternion), we.copy(Ve).add(ft), c && (dt.lookAt(we, _.current, r.up), c.quaternion.setFromRotationMatrix(dt), ze.copy(c.quaternion)), U = !0), U && c && be.reportFallbackPose(we, c.quaternion);
      }
    else {
      const d = De(g.id);
      if (d)
        if (xe.current = null, d.isInVR && d.vrTracking)
          U = ot(d, g.hand, _.current), we.copy(_.current), c && st(d, g.hand, ze) && c.quaternion.copy(ze);
        else {
          const V = zn?.(g.id)?.eyeHeight ?? 1.3;
          Ct(d, V, _.current), we.copy(_.current), U = !0;
        }
      else {
        const V = p.elapsedTime;
        xe.current === null ? xe.current = V : V - xe.current > 5 && (xe.current = null, Ge(null));
      }
    }
    c && (c.visible = U, U && c.position.copy(we)), T && !T.preview && T.hand === g.hand && g.id === C.current && U && $e.current !== T.nonce && ($e.current = T.nonce, Se(), Ee.current = !1, Y.current = a.current[g.hand].seq, ye.current ? ie() : je(_.current, r, !1));
    const j = ye.current;
    if (j && !j.preview && g.id === C.current && U) {
      const d = performance.now();
      if (d - j.openedAt >= cr) {
        ie();
        return;
      }
      let V = null, Z = null, Fe = sr;
      const Qe = j.page === "tools" ? pn.length : rn.length;
      for (let G = 0; G < Qe; G += 1) {
        const qe = Ke.current[G];
        if (!qe) continue;
        qe.getWorldPosition(xn);
        const ce = xn.distanceTo(_.current);
        ce <= Fe && (Fe = ce, Z = G, V = `${j.page}:${G}`);
      }
      if (j.page === "colors" && fn.current && (fn.current.getWorldPosition(xn), xn.distanceTo(_.current) <= Fe && (Z = -1, V = "colors:back")), V !== W.current)
        W.current = V, Ye(V), Ie.current = d;
      else if (V !== null && d - Ie.current >= ir) {
        if (j.page === "colors" && Z === -1) {
          const G = { ...j, page: "tools", openedAt: d };
          ye.current = G, ge(G);
        } else if (j.page === "tools" && Z !== null) {
          const G = pn[Z];
          if (G?.kind === "colors") {
            const qe = { ...j, page: "colors", openedAt: d };
            ye.current = qe, ge(qe);
          } else G?.kind === "tool" && (E(g.hand, G.mode), ie());
        } else if (j.page === "colors" && Z !== null) {
          const G = rn[Z];
          G && x(e, G), ie();
        }
        W.current = null, Ye(null), Ie.current = d;
      }
      return;
    }
    const k = n === "pen" && R.current[g.hand], de = ae.current;
    if (de && (de.visible = g.id === C.current && k), g.id !== C.current || !U) return;
    const pe = a.current[g.hand], _e = pe.down && pe.seq !== Y.current;
    if (n === "eraser" || k) {
      oe.current && Se(), Ee.current = !1, _e && (n === "eraser" ? ve() : An());
      return;
    }
    if (_e) {
      let d = oe.current;
      if (!d) {
        if (!Ee.current) {
          ue.current.copy(_.current), Ee.current = !0;
          return;
        }
        if (_.current.distanceTo(ue.current) < Un * 1.5) return;
        me.current += 1;
        const G = Math.round(p.elapsedTime * 1e3), qe = q.current[e] ?? { id: Le, size: kn }, ce = ut(pe.source, 0, 0);
        d = {
          sid: `${C.current}:${e}:${Date.now().toString(36)}:${me.current}`,
          color: t,
          count: 0,
          sent: 0,
          hueOffset: Xe.current,
          brushId: qe.id,
          size: qe.size,
          startedAt: G,
          lastSampleAt: G,
          minPressure: ce.value,
          maxPressure: ce.value,
          pressureSource: ce.source,
          lastPressure: ce.value
        }, oe.current = d, u.applySegment(
          d.sid,
          d.color,
          0,
          [Te(ue.current.x), Te(ue.current.y), Te(ue.current.z)],
          d.hueOffset,
          {
            brushId: d.brushId,
            size: d.size,
            orientations: lt(ze),
            pressures: [ce.value],
            timestamps: [0],
            penIndex: e,
            ownerUserId: C.current,
            ownerDisplayName: un
          }
        ), te({
          penIndex: e,
          value: ce.value,
          min: ce.value,
          max: ce.value,
          source: ce.source,
          active: !0
        }), d.count = 1, Xe.current += 1, Ae.current.copy(ue.current);
      }
      if (d.count >= Lt) {
        Se();
        return;
      }
      const V = _.current.distanceTo(Ae.current);
      if (V < Un) return;
      const Z = Math.round(p.elapsedTime * 1e3), Fe = ut(pe.source, V, (Z - d.lastSampleAt) / 1e3), Qe = Math.round((d.lastPressure * 0.58 + Fe.value * 0.42) * 1e3) / 1e3;
      if (d.lastPressure = Qe, d.minPressure = Math.min(d.minPressure, Qe), d.maxPressure = Math.max(d.maxPressure, Qe), d.pressureSource = Fe.source, Ae.current.copy(_.current), u.applySegment(
        d.sid,
        d.color,
        d.count,
        [Te(_.current.x), Te(_.current.y), Te(_.current.z)],
        d.hueOffset,
        {
          brushId: d.brushId,
          size: d.size,
          orientations: lt(ze),
          pressures: [Qe],
          timestamps: [Z - d.startedAt],
          penIndex: e,
          ownerUserId: C.current,
          ownerDisplayName: un
        }
      ), d.count += 1, d.lastSampleAt = Z, Z - se.current >= 100 && (se.current = Z, te({
        penIndex: e,
        value: Qe,
        min: d.minPressure,
        max: d.maxPressure,
        source: Fe.source,
        active: !0
      })), Xe.current += 1, d.count - d.sent >= Ut) {
        const G = u.get(d.sid);
        G && (y(at(G, d.sent, d.count)), d.sent = d.count);
      }
      w();
    } else
      Ee.current = !1, oe.current && Se();
  });
  const s = F !== null, f = K === null && !s, b = n === "pen" ? `P${e + 1}（${o}）` : o, Q = K === null ? s ? `${b}をラックに戻す` : n === "pen" ? `${b}を持つ（VR:グリップ・トリガー2回でLINE/RIBBON/FUDE/消しゴム切替）` : `${b}を持つ（トリガーで線に当てて消す）` : He ? `${b}をラックに戻す` : "だれかが使用中", fe = S(() => {
    n === "pen" && H(e), Re.current === null ? Be.current ? en() : be.grabViaClick() : be.isHeld && dn();
  }, [be, dn, en, e, n, H]), nn = K?.hand ?? ke.current ?? "right", Mn = R.current[nn] ? "eraser" : q.current[e]?.id ?? Le, Ne = (() => {
    if (!Oe) return B?.page === "colors" ? "色を選ぶ" : "道具を選ぶ";
    if (Oe === "colors:back") return "戻る";
    const r = Number(Oe.split(":")[1]);
    if (!Number.isInteger(r)) return "";
    if (B?.page === "colors") {
      const p = rn[r];
      return p ? Hn(p) : "";
    }
    return pn[r]?.label ?? "";
  })();
  return /* @__PURE__ */ P("group", { position: l, children: [
    /* @__PURE__ */ i("group", { ref: We }),
    /* @__PURE__ */ P(
      Dn,
      {
        id: `${N}-slot-${e}`,
        onInteract: fe,
        interactionText: Q,
        enabled: K === null || He,
        children: [
          n === "pen" ? /* @__PURE__ */ i("group", { rotation: [-Math.PI / 2, 0, 0], visible: f, children: /* @__PURE__ */ i(qn, { color: t, penLabel: `P${e + 1}` }) }) : /* @__PURE__ */ i("group", { visible: f, children: /* @__PURE__ */ i(Cn, { color: t }) }),
          /* @__PURE__ */ P("mesh", { position: [0, n === "pen" ? 0.17 : 0, 0], children: [
            /* @__PURE__ */ i("cylinderGeometry", { args: [0.06, 0.06, n === "pen" ? 0.36 : 0.12, 8] }),
            /* @__PURE__ */ i("meshBasicMaterial", { transparent: !0, opacity: 0, depthWrite: !1 })
          ] })
        ]
      }
    ),
    K === null && F !== null && Tn(
      /* @__PURE__ */ i(
        "group",
        {
          position: [F.p[0], F.p[1], F.p[2]],
          quaternion: [F.q[0], F.q[1], F.q[2], F.q[3]],
          children: /* @__PURE__ */ P(
            Dn,
            {
              id: `${N}-slot-air-${e}`,
              onInteract: () => {
                n === "pen" && H(e), be.grabViaClick();
              },
              interactionText: `${b}を持つ`,
              children: [
                n === "pen" ? /* @__PURE__ */ i(qn, { color: t, penLabel: `P${e + 1}` }) : /* @__PURE__ */ i(Cn, { color: t }),
                /* @__PURE__ */ P("mesh", { position: [0, 0, n === "pen" ? 0.17 : 0], children: [
                  /* @__PURE__ */ i("sphereGeometry", { args: [0.08, 8, 8] }),
                  /* @__PURE__ */ i("meshBasicMaterial", { transparent: !0, opacity: 0, depthWrite: !1 })
                ] })
              ]
            }
          )
        }
      ),
      Ue
    ),
    Tn(
      /* @__PURE__ */ P("group", { ref: an, visible: !1, name: `${N}-held-${e}`, children: [
        n === "pen" ? /* @__PURE__ */ i(qn, { color: t, penLabel: `P${e + 1}` }) : /* @__PURE__ */ i(Cn, { color: t }),
        n === "pen" && /* @__PURE__ */ P("mesh", { ref: ae, visible: !1, position: [0, 0, 5e-3], children: [
          /* @__PURE__ */ i("sphereGeometry", { args: [0.02, 12, 12] }),
          /* @__PURE__ */ i("meshStandardMaterial", { color: "#f0f0f0", emissive: "#f0f0f0", emissiveIntensity: 0.6 })
        ] })
      ] }),
      Ue
    ),
    B && n === "pen" && Tn(
      /* @__PURE__ */ P(
        "group",
        {
          position: B.position,
          quaternion: B.quaternion,
          name: `${N}-quick-ring-${e}`,
          children: [
            /* @__PURE__ */ P("mesh", { position: [0, 0, -8e-3], children: [
              /* @__PURE__ */ i("circleGeometry", { args: [0.292, 48] }),
              /* @__PURE__ */ i("meshBasicMaterial", { color: "#172033", transparent: !0, opacity: 0.88, side: Ce, depthTest: !1 })
            ] }),
            /* @__PURE__ */ P("mesh", { position: [0, 0, -6e-3], children: [
              /* @__PURE__ */ i("ringGeometry", { args: [0.272, 0.288, 48] }),
              /* @__PURE__ */ i("meshBasicMaterial", { color: t === le ? "#f8fafc" : t, side: Ce, depthTest: !1 })
            ] }),
            B.page === "tools" ? pn.map((r, p) => {
              const c = `tools:${p}`, g = r.kind === "tool" && r.mode === Mn, T = Oe === c;
              return /* @__PURE__ */ P(
                "group",
                {
                  ref: (U) => {
                    Ke.current[p] = U;
                  },
                  position: it(p, pn.length, lr),
                  scale: T ? 1.18 : 1,
                  children: [
                    /* @__PURE__ */ P("mesh", { children: [
                      /* @__PURE__ */ i("circleGeometry", { args: [0.052, 28] }),
                      /* @__PURE__ */ i("meshBasicMaterial", { color: r.color, side: Ce, depthTest: !1 })
                    ] }),
                    (g || T) && /* @__PURE__ */ P("mesh", { position: [0, 0, 3e-3], children: [
                      /* @__PURE__ */ i("ringGeometry", { args: [0.057, 0.065, 28] }),
                      /* @__PURE__ */ i("meshBasicMaterial", { color: T ? "#facc15" : "#ffffff", side: Ce, depthTest: !1 })
                    ] }),
                    /* @__PURE__ */ i(
                      ee,
                      {
                        position: [0, 0, 6e-3],
                        fontSize: r.id === "ribbon" ? 0.019 : 0.025,
                        color: r.id === "colors" ? "#172033" : "#ffffff",
                        anchorX: "center",
                        anchorY: "middle",
                        outlineWidth: 15e-4,
                        outlineColor: r.id === "colors" ? "#ffffff" : "#000000",
                        children: r.label
                      }
                    )
                  ]
                },
                r.id
              );
            }) : /* @__PURE__ */ P(Pt, { children: [
              rn.map((r, p) => {
                const c = `colors:${p}`, g = r === t, T = Oe === c;
                return /* @__PURE__ */ P(
                  "group",
                  {
                    ref: (U) => {
                      Ke.current[p] = U;
                    },
                    position: it(p, rn.length, ur),
                    scale: T ? 1.2 : 1,
                    children: [
                      /* @__PURE__ */ P("mesh", { children: [
                        /* @__PURE__ */ i("circleGeometry", { args: [0.035, 24] }),
                        /* @__PURE__ */ i(
                          "meshBasicMaterial",
                          {
                            color: r === le ? "#ffffff" : r,
                            side: Ce,
                            depthTest: !1
                          }
                        )
                      ] }),
                      /* @__PURE__ */ P("mesh", { position: [0, 0, 3e-3], children: [
                        /* @__PURE__ */ i("ringGeometry", { args: [0.039, 0.045, 24] }),
                        /* @__PURE__ */ i(
                          "meshBasicMaterial",
                          {
                            color: T ? "#facc15" : g ? "#ffffff" : "#64748b",
                            side: Ce,
                            depthTest: !1
                          }
                        )
                      ] }),
                      r === le && /* @__PURE__ */ i(ee, { position: [0, 0, 6e-3], fontSize: 0.018, color: "#172033", anchorX: "center", anchorY: "middle", children: "虹" })
                    ]
                  },
                  `${r}-${p}`
                );
              }),
              /* @__PURE__ */ P("group", { ref: fn, children: [
                /* @__PURE__ */ P("mesh", { children: [
                  /* @__PURE__ */ i("circleGeometry", { args: [0.046, 24] }),
                  /* @__PURE__ */ i("meshBasicMaterial", { color: "#475569", side: Ce, depthTest: !1 })
                ] }),
                /* @__PURE__ */ i(ee, { position: [0, 0, 6e-3], fontSize: 0.021, color: "#ffffff", anchorX: "center", anchorY: "middle", children: "戻る" })
              ] })
            ] }),
            /* @__PURE__ */ i(
              ee,
              {
                position: [0, -0.338, 8e-3],
                fontSize: 0.032,
                color: "#ffffff",
                anchorX: "center",
                anchorY: "middle",
                outlineWidth: 2e-3,
                outlineColor: "#000000",
                children: Ne
              }
            ),
            /* @__PURE__ */ i(
              ee,
              {
                position: [0, 0.263, 8e-3],
                fontSize: 0.018,
                color: "#cbd5e1",
                anchorX: "center",
                anchorY: "middle",
                children: "ペン先を近づけて選択"
              }
            )
          ]
        }
      ),
      Ue
    )
  ] });
}, hr = ["#e53935", "#fb8c00", "#fdd835", "#43a047", "#1e88e5", "#8e24aa"], qn = ({ color: e, penLabel: n }) => {
  const t = e === le ? "#ffffff" : e;
  return /* @__PURE__ */ P("group", { children: [
    /* @__PURE__ */ P("mesh", { position: [0, 0, 7e-3], rotation: [-Math.PI / 2, 0, 0], children: [
      /* @__PURE__ */ i("coneGeometry", { args: [45e-4, 0.015, 8] }),
      /* @__PURE__ */ i("meshStandardMaterial", { color: t, emissive: t, emissiveIntensity: 1.8 })
    ] }),
    /* @__PURE__ */ P("mesh", { position: [0, 0, 0.031], rotation: [-Math.PI / 2, 0, 0], children: [
      /* @__PURE__ */ i("coneGeometry", { args: [0.013, 0.034, 6] }),
      /* @__PURE__ */ i("meshStandardMaterial", { color: "#d8bb90", roughness: 0.85 })
    ] }),
    e === le ? hr.map((o, l) => /* @__PURE__ */ P("mesh", { position: [0, 0, 0.048 + 0.048 * l + 0.024], rotation: [Math.PI / 2, 0, 0], children: [
      /* @__PURE__ */ i("cylinderGeometry", { args: [0.012, 0.012, 0.048, 6] }),
      /* @__PURE__ */ i("meshStandardMaterial", { color: o, roughness: 0.6 })
    ] }, o)) : /* @__PURE__ */ P("mesh", { position: [0, 0, 0.192], rotation: [Math.PI / 2, 0, 0], children: [
      /* @__PURE__ */ i("cylinderGeometry", { args: [0.012, 0.012, 0.288, 6] }),
      /* @__PURE__ */ i("meshStandardMaterial", { color: e, roughness: 0.6 })
    ] }),
    /* @__PURE__ */ P("mesh", { position: [0, 0.0135, 0.286], children: [
      /* @__PURE__ */ i("boxGeometry", { args: [0.031, 3e-3, 0.054] }),
      /* @__PURE__ */ i("meshStandardMaterial", { color: "#ffffff", roughness: 0.7 })
    ] }),
    /* @__PURE__ */ i(
      ee,
      {
        position: [0, 0.0155, 0.286],
        rotation: [-Math.PI / 2, 0, 0],
        fontSize: n.length > 2 ? 0.013 : 0.016,
        color: "#172033",
        anchorX: "center",
        anchorY: "middle",
        children: n
      }
    ),
    /* @__PURE__ */ P("mesh", { position: [0, -0.0135, 0.286], children: [
      /* @__PURE__ */ i("boxGeometry", { args: [0.031, 3e-3, 0.054] }),
      /* @__PURE__ */ i("meshStandardMaterial", { color: "#ffffff", roughness: 0.7 })
    ] }),
    /* @__PURE__ */ i(
      ee,
      {
        position: [0, -0.0155, 0.286],
        rotation: [Math.PI / 2, 0, 0],
        fontSize: n.length > 2 ? 0.013 : 0.016,
        color: "#172033",
        anchorX: "center",
        anchorY: "middle",
        children: n
      }
    )
  ] });
}, Cn = ({ color: e }) => /* @__PURE__ */ P("mesh", { rotation: [Math.PI / 2, 0, 0], children: [
  /* @__PURE__ */ i("cylinderGeometry", { args: [0.05, 0.05, 0.07, 6] }),
  /* @__PURE__ */ i("meshStandardMaterial", { color: e, roughness: 0.5, metalness: 0.1 })
] }), J = ({
  id: e,
  position: n,
  size: t = [0.12, 0.08, 0.03],
  color: o,
  label: l,
  labelColor: I = "#ffffff",
  fontSize: u = 0.022,
  interactionText: y,
  onInteract: D,
  children: v
}) => /* @__PURE__ */ i(Dn, { id: e, onInteract: D, interactionText: y, children: /* @__PURE__ */ P("group", { position: n, children: [
  /* @__PURE__ */ P("mesh", { castShadow: !0, children: [
    /* @__PURE__ */ i("boxGeometry", { args: t }),
    /* @__PURE__ */ i("meshStandardMaterial", { color: o, emissive: o, emissiveIntensity: 0.35 })
  ] }),
  /* @__PURE__ */ i(
    ee,
    {
      position: [0, 0, t[2] / 2 + 2e-3],
      fontSize: u,
      color: I,
      anchorX: "center",
      anchorY: "middle",
      outlineWidth: u * 0.08,
      outlineColor: "#000000",
      children: l
    }
  ),
  v
] }) });
export {
  vr as BRUSH_REGISTRY,
  Le as DEFAULT_BRUSH,
  kn as DEFAULT_RIBBON_SIZE,
  wr as DcPen,
  on as PEN_COLORS,
  le as RAINBOW,
  Zt as StrokeRenderer,
  Kt as buildRibbonGeometry,
  Bt as getNextPenToolMode,
  gn as getStrokeOwnerId,
  Gn as getStrokePenIndex,
  Ht as speedToWidthValue
};
