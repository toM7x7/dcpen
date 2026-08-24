import { jsx as l, jsxs as U } from "react/jsx-runtime";
import { useRef as S, useCallback as x, useEffect as pe, useMemo as ut, createContext as Yt, useState as Te, useContext as Kt, memo as kt } from "react";
import { useThree as Fe, useFrame as Bt, createPortal as at } from "@react-three/fiber";
import { Line as bt, Text as Ce } from "@react-three/drei";
import { Vector3 as L, Quaternion as k, Matrix4 as We, Euler as Gt, Color as Zt, BufferGeometry as Jt, BufferAttribute as et, DoubleSide as en, CatmullRomCurve3 as tn } from "three";
import { useUsers as Ft, useInstanceState as ke, useInstanceEvent as Oe, Interactable as ft } from "@xrift/world-components";
const vt = new We(), St = new We(), It = new We(), xt = new We(), nn = new L();
function Wt(e, t, n, r) {
  const c = e.xr;
  if (!c.isPresenting) return !1;
  const y = c.getSession();
  if (!y) return !1;
  const i = c.getFrame(), h = c.getReferenceSpace();
  if (!i || !h) return !1;
  const d = i.getViewerPose(h);
  if (!d) return !1;
  let P = null;
  for (const A of y.inputSources)
    if (A.handedness === t && (A.gripSpace || A.targetRaySpace)) {
      P = A;
      break;
    }
  if (!P) return !1;
  const w = P.gripSpace ?? P.targetRaySpace, p = i.getPose(w, h);
  if (!p) return !1;
  vt.fromArray(Array.from(d.transform.matrix)), St.fromArray(Array.from(p.transform.matrix));
  const b = c.getCamera().matrixWorld;
  return It.copy(b).multiply(vt.invert()), xt.copy(It).multiply(St), xt.decompose(n, r, nn), !0;
}
const Vt = Yt(null);
function rn() {
  const e = Kt(Vt);
  if (!e) throw new Error("xrift-grab: useGrabbable must be used within <XRGrabProvider>");
  return e;
}
const Mt = ["left", "right"], tt = new L(), Pt = new k(), zt = new L();
function sn({ grabRadius: e = 0.45, children: t }) {
  const n = Fe((p) => p.gl), r = S(/* @__PURE__ */ new Map()), c = S({ left: null, right: null }), y = S(/* @__PURE__ */ new Set()), i = x((p, b) => {
    r.current.set(p, b);
  }, []), h = x((p) => {
    r.current.delete(p);
    for (const b of Mt)
      c.current[b]?.id === p && (c.current[b] = null);
  }, []), d = x(
    (p, b, A, u, $) => {
      const g = r.current.get(p);
      if (!g || !g.isFree()) return;
      const z = c.current[b];
      z && z.id !== p && r.current.get(z.id)?.endHold(), c.current[b] = { id: p, viaGrip: A }, g.beginHold(b, A, u, $);
    },
    []
  ), P = x((p, b) => {
    const A = r.current.get(p);
    for (const u of Mt)
      c.current[u]?.id === p && (c.current[u] = null);
    A?.endHold(b);
  }, []);
  pe(() => {
    const p = (z) => z.inputSource.handedness === "left" ? "left" : z.inputSource.handedness === "right" ? "right" : null, b = (z) => {
      const D = p(z);
      if (!D) return;
      const T = c.current[D];
      T === null ? y.current.add(D) : T.viaGrip = !0;
    }, A = (z) => {
      const D = p(z);
      if (!D) return;
      const T = c.current[D];
      T !== null && T.viaGrip && P(T.id);
    };
    let u = null;
    const $ = () => {
      const z = n.xr.getSession();
      !z || z === u || (u = z, z.addEventListener("squeezestart", b), z.addEventListener("squeezeend", A));
    }, g = () => {
      u && (u.removeEventListener("squeezestart", b), u.removeEventListener("squeezeend", A), u = null, y.current.clear());
    };
    return n.xr.addEventListener("sessionstart", $), n.xr.addEventListener("sessionend", g), $(), () => {
      n.xr.removeEventListener("sessionstart", $), n.xr.removeEventListener("sessionend", g), g();
    };
  }, [n, P]), Bt(() => {
    if (y.current.size !== 0) {
      for (const p of y.current) {
        if (!Wt(n, p, tt, Pt)) continue;
        let b = null, A = e;
        for (const [u, $] of r.current) {
          if (!$.isFree()) continue;
          $.worldPosition(zt);
          const g = zt.distanceTo(tt);
          g < A && (A = g, b = u);
        }
        b && d(b, p, !0, tt, Pt);
      }
      y.current.clear();
    }
  });
  const w = ut(
    () => ({ grabRadius: e, register: i, unregister: h, requestGrab: d, requestDrop: P }),
    [e, i, h, d, P]
  );
  return /* @__PURE__ */ l(Vt.Provider, { value: w, children: t });
}
const Tt = new L(), At = new k(), nt = new k(), Et = new L(), rt = new k(), on = new k();
function cn(e) {
  const t = rn(), n = Fe((v) => v.gl), { id: r } = e, c = S(e);
  c.current = e;
  const [y, i] = Te(!1), [h, d] = Te(null), P = S(null), w = S(new L()), p = S(new k()), b = S(new L()), A = S(new k()), u = x(() => {
    const v = c.current.isFree;
    return v ? v() : P.current === null;
  }, []), $ = x((v) => {
    const _ = c.current.worldPosition;
    _ ? _(v) : c.current.worldPose(v, on);
  }, []), g = x(
    (v, _, ee, he) => {
      if (_ && ee && he)
        c.current.worldPose(Tt, At), nt.copy(he).invert(), p.current.copy(nt).multiply(At), w.current.copy(Tt).sub(ee).applyQuaternion(nt);
      else {
        const C = c.current.defaultOffset;
        C ? (w.current.copy(C.position), p.current.copy(C.quaternion)) : (w.current.set(0, 0, 0), p.current.identity());
      }
      P.current = v, i(!0), d(v), c.current.onGrabStart?.(v, _);
    },
    []
  ), z = x((v) => {
    P.current !== null && (P.current = null, i(!1), d(null), v === null ? c.current.onDrop?.(null) : v ? c.current.onDrop?.(v) : c.current.onDrop?.({ position: b.current.clone(), quaternion: A.current.clone() }));
  }, []);
  pe(() => {
    const v = {
      isFree: u,
      worldPosition: $,
      beginHold: g,
      endHold: z
    };
    return t.register(r, v), () => t.unregister(r);
  }, [t, r, u, $, g, z]);
  const D = x(
    (v, _) => {
      const ee = P.current;
      return ee === null || !Wt(n, ee, Et, rt) ? !1 : (_.copy(rt).multiply(p.current), v.copy(w.current).applyQuaternion(rt).add(Et), b.current.copy(v), A.current.copy(_), !0);
    },
    [n]
  ), T = x((v, _) => {
    P.current !== null && (b.current.copy(v), A.current.copy(_));
  }, []), be = x(
    (v = "right") => {
      t.requestGrab(r, v, !1);
    },
    [t, r]
  );
  return { isHeld: y, heldHand: h, getAttachedPose: D, reportFallbackPose: T, grabViaClick: be, drop: z };
}
const mt = new L(0, 1, 0), Rt = new k(), Ot = new Gt();
function $t(e, t, n) {
  const r = e.vrTracking;
  if (!r) return !1;
  const c = t === "right" ? r.rightHand.position : r.leftHand.position;
  return n.set(c.x, c.y, c.z), n.applyAxisAngle(mt, e.rotation.yaw), n.x += e.position.x, n.y += e.position.y, n.z += e.position.z, !0;
}
function Nt(e, t, n) {
  const r = e.vrTracking;
  if (!r) return !1;
  const c = t === "right" ? r.rightHand.rotation : r.leftHand.rotation;
  return n.setFromAxisAngle(mt, e.rotation.yaw), Ot.set(c.x, c.y, c.z, "XYZ"), Rt.setFromEuler(Ot), n.multiply(Rt), !0;
}
function ln(e, t, n) {
  n.set(0.15, 0, -0.35), n.applyAxisAngle(mt, e.rotation.yaw), n.x += e.position.x, n.y += e.position.y + t * 0.55, n.z += e.position.z;
}
const dt = 0.01, gt = 4, un = 2e3, an = 2e4, fn = 4, dn = 1.2, Ae = "line", yt = 0.035, we = "rainbow", pt = [
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
  we
];
function fe(e) {
  return Math.round(e * 1e3) / 1e3;
}
function pn(e) {
  if (!Number.isFinite(e) || e <= 0.08) return 1;
  const t = Math.max(0, Math.min(1, (e - 0.08) / 1.12));
  return Math.round((1 - t * 0.82) * 1e3) / 1e3;
}
function hn(e) {
  return e === "line" ? "ribbon" : e === "ribbon" ? "calligraphy" : e === "calligraphy" ? "eraser" : "line";
}
function ht(e) {
  if (Number.isSafeInteger(e.penIndex) && e.penIndex >= 0) return e.penIndex;
  const t = e.sid.split(":")[1], n = Number(t);
  return Number.isSafeInteger(n) && n >= 0 ? n : null;
}
function He(e) {
  return e.ownerUserId ? e.ownerUserId : e.sid.split(":")[0] || null;
}
class mn {
  strokes = /* @__PURE__ */ new Map();
  /** 描画完了したストロークのsid（到着順） */
  finishedOrder = [];
  finished = /* @__PURE__ */ new Set();
  /** 変更通知用の世代カウンタ（Reactの再描画トリガ） */
  version = 0;
  get(t) {
    return this.strokes.get(t);
  }
  all() {
    return [...this.strokes.values()];
  }
  finishedStrokes() {
    return this.finishedOrder.map((t) => this.strokes.get(t)).filter((t) => t !== void 0);
  }
  /** 増分書き込み（自エコー・重複到着に冪等）。旧lineイベントも受理する */
  applySegment(t, n, r, c, y = 0, i = {}) {
    let h = this.strokes.get(t);
    h || (h = {
      sid: t,
      color: n,
      pts: [],
      hueOffset: y,
      brushId: i.brushId,
      size: i.size,
      orientations: i.orientations ? [] : void 0,
      pressures: i.pressures ? [] : void 0,
      timestamps: i.timestamps ? [] : void 0,
      penIndex: i.penIndex,
      ownerUserId: i.ownerUserId,
      ownerDisplayName: i.ownerDisplayName
    }, this.strokes.set(t, h)), i.brushId !== void 0 && (h.brushId = i.brushId), i.size !== void 0 && (h.size = i.size), i.penIndex !== void 0 && (h.penIndex = i.penIndex), i.ownerUserId !== void 0 && (h.ownerUserId = i.ownerUserId), i.ownerDisplayName !== void 0 && (h.ownerDisplayName = i.ownerDisplayName);
    const d = r * 3;
    for (let P = 0; P < c.length; P++)
      h.pts[d + P] = c[P];
    st(h, "orientations", r * 4, i.orientations), st(h, "pressures", r, i.pressures), st(h, "timestamps", r, i.timestamps), this.version++;
  }
  markFinished(t) {
    this.finished.has(t) || this.strokes.has(t) && (this.finished.add(t), this.finishedOrder.push(t), this.trim(), this.version++);
  }
  /** 完成形ストロークの一括投入（late join時のinstance stateマージ） */
  merge(t) {
    let n = !1;
    for (const r of t)
      this.strokes.has(r.sid) || (this.strokes.set(r.sid, {
        sid: r.sid,
        color: r.color,
        pts: [...r.pts],
        hueOffset: r.hueOffset ?? 0,
        brushId: r.brushId,
        size: r.size,
        orientations: r.orientations ? [...r.orientations] : void 0,
        pressures: r.pressures ? [...r.pressures] : void 0,
        timestamps: r.timestamps ? [...r.timestamps] : void 0,
        penIndex: r.penIndex,
        ownerUserId: r.ownerUserId,
        ownerDisplayName: r.ownerDisplayName
      }), this.finished.add(r.sid), this.finishedOrder.push(r.sid), n = !0);
    n && (this.trim(), this.version++);
  }
  remove(t) {
    this.strokes.delete(t) && (this.finished.delete(t), this.finishedOrder = this.finishedOrder.filter((n) => n !== t), this.version++);
  }
  clear() {
    this.strokes.size !== 0 && (this.strokes.clear(), this.finished.clear(), this.finishedOrder = [], this.version++);
  }
  /** 合計点数が予算を超えたら古い完成ストロークから捨てる */
  trim() {
    let t = 0;
    for (const n of this.strokes.values()) t += n.pts.length / 3;
    for (; t > an && this.finishedOrder.length > 0; ) {
      const n = this.finishedOrder[0], r = this.strokes.get(n);
      t -= r ? r.pts.length / 3 : 0, this.remove(n);
    }
  }
}
function st(e, t, n, r) {
  if (!r) return;
  const c = e[t] ?? [];
  for (let y = 0; y < r.length; y += 1) c[n + y] = r[y];
  e[t] = c;
}
const Bn = [
  { id: "line", label: "LINE", description: "DcPen互換の均一な線" },
  { id: "ribbon", label: "RIBBON", description: "向きと描画速度で幅が変わる平筆" },
  { id: "calligraphy", label: "FUDE", description: "速度と筆先方向で強弱・入り抜きを作る筆" }
], gn = 0.02 * (dt / 0.015 / gt), Be = /* @__PURE__ */ new Map(), Ge = /* @__PURE__ */ new Map(), J = new Zt();
function Xt(e) {
  const t = [];
  for (let n = 0; n + 2 < e.length; n += 3) {
    const r = [e[n], e[n + 1], e[n + 2]];
    r.every(Number.isFinite) && t.push(r);
  }
  return t;
}
function yn(e, t) {
  if (t.length < 3) return t;
  const n = Be.get(e);
  if (n?.count === t.length) return n.points;
  const c = new tn(t.map((y) => new L(...y)), !1, "centripetal").getPoints((t.length - 1) * gt).map((y) => [y.x, y.y, y.z]);
  return Be.set(e, { count: t.length, points: c }), c;
}
function wn(e, t, n) {
  const r = Ge.get(e);
  if (r?.count === t && r.offset === n) return r.colors;
  const c = [];
  for (let y = 0; y < t; y += 1)
    J.setHSL((y + n) * gn % 1, 1, 0.6), c.push([J.r, J.g, J.b]);
  return Ge.set(e, { count: t, offset: n, colors: c }), c;
}
function bn(e) {
  if (Be.size > e.size * 2 + 16)
    for (const t of Be.keys()) e.has(t) || Be.delete(t);
  if (Ge.size > e.size * 2 + 16)
    for (const t of Ge.keys()) e.has(t) || Ge.delete(t);
}
function vn(e, t, n, r) {
  const c = Math.max(0, Math.min(1, t));
  if (e !== "calligraphy") return 0.18 + c * 1.27;
  const y = Math.min(1, (n + 1) / 4), i = Math.min(1, Math.max(1, r - n) / 5), h = Math.max(0.06, Math.min(y, i));
  return (0.08 + c * 1.62) * h;
}
function Sn(e) {
  const t = Xt(e.pts);
  if (t.length < 2) return null;
  const n = new Float32Array(t.length * 2 * 3), r = e.color === we ? new Float32Array(t.length * 2 * 3) : void 0, c = new Uint32Array((t.length - 1) * 6), y = new k(), i = new L(), h = new L(), d = new L(0, 1, 0), P = Math.max(4e-3, Math.min(0.12, e.size ?? yt));
  for (let w = 0; w < t.length; w += 1) {
    const p = new L(...t[w]), b = t[Math.max(0, w - 1)], A = t[Math.min(t.length - 1, w + 1)];
    h.set(A[0] - b[0], A[1] - b[1], A[2] - b[2]).normalize();
    const u = w * 4, $ = e.orientations;
    $ && u + 3 < $.length && $.slice(u, u + 4).every(Number.isFinite) ? (y.set($[u], $[u + 1], $[u + 2], $[u + 3]).normalize(), i.set(1, 0, 0).applyQuaternion(y), i.addScaledVector(h, -i.dot(h)), i.lengthSq() < 1e-5 && (i.set(0, 1, 0).applyQuaternion(y), i.addScaledVector(h, -i.dot(h)))) : i.copy(d).addScaledVector(h, -d.dot(h)), i.lengthSq() < 1e-5 && i.set(1, 0, 0), i.normalize();
    const g = Math.max(0, Math.min(1, e.pressures?.[w] ?? 0.7)), z = P * vn(
      e.brushId ?? Ae,
      g,
      w,
      t.length
    ) * 0.5, D = p.clone().addScaledVector(i, -z), T = p.clone().addScaledVector(i, z);
    n.set([D.x, D.y, D.z, T.x, T.y, T.z], w * 6), r && (J.setHSL((e.hueOffset + w) * 0.02 % 1, 1, 0.6), r.set([J.r, J.g, J.b, J.r, J.g, J.b], w * 6));
  }
  for (let w = 0; w < t.length - 1; w += 1) {
    const p = w * 2;
    c.set([p, p + 1, p + 2, p + 1, p + 3, p + 2], w * 6);
  }
  return { positions: n, colors: r, indices: c };
}
function In({ cacheKey: e, stroke: t }) {
  const n = Xt(t.pts);
  if (n.length < 2) return null;
  const r = yn(e, n);
  return t.color === we ? /* @__PURE__ */ l(
    bt,
    {
      points: r,
      vertexColors: wn(e, r.length, (t.hueOffset ?? 0) * gt),
      color: "#ffffff",
      lineWidth: 4
    }
  ) : /* @__PURE__ */ l(bt, { points: r, color: t.color, lineWidth: 4 });
}
function xn({ stroke: e, count: t }) {
  const n = ut(
    () => Sn(e),
    [t, e.brushId, e.color, e.hueOffset, e.size, e]
  ), r = ut(() => {
    if (!n) return null;
    const c = new Jt();
    return c.setAttribute("position", new et(n.positions, 3)), n.colors && c.setAttribute("color", new et(n.colors, 3)), c.setIndex(new et(n.indices, 1)), c.computeVertexNormals(), c;
  }, [n]);
  return pe(() => () => r?.dispose(), [r]), r ? /* @__PURE__ */ l("mesh", { geometry: r, children: /* @__PURE__ */ l("meshBasicMaterial", { color: e.color === we ? "#ffffff" : e.color, vertexColors: !!n?.colors, side: en, toneMapped: !1 }) }) : null;
}
const Mn = kt(
  ({ cacheKey: e, stroke: t, count: n = t.pts.length }) => {
    const r = e ?? t.sid, c = t.brushId ?? Ae;
    return c === "ribbon" || c === "calligraphy" ? /* @__PURE__ */ l(xn, { stroke: t, count: n }) : /* @__PURE__ */ l(In, { cacheKey: r, stroke: t });
  }
), ot = [
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
], Qt = ["#8e4a5b", "#3f8f6a", "#3f6ba0"], Pn = 0.45, zn = 0.07, Tn = 0.04, An = 200, En = 3e3;
function Rn(e) {
  if (typeof e == "string") return e;
  if (e && typeof e == "object") {
    const t = e;
    for (const n of ["id", "socketId", "userId"]) {
      const r = t[n];
      if (typeof r == "string") return r;
    }
  }
  return null;
}
function On(e) {
  if (!e) return null;
  if (typeof e == "string") return { id: e, hand: "right" };
  const t = e;
  return typeof t.id == "string" ? { id: t.id, hand: t.hand === "left" ? "left" : "right" } : null;
}
function Lt(e) {
  return [e.x, e.y, e.z, e.w].map(
    (t) => Math.round(t * 1e3) / 1e3
  );
}
function Dt(e, t, n) {
  if (t <= 0 || n <= 0) return { value: 1, source: "speed" };
  const r = t / n;
  return { value: pn(r), source: "speed" };
}
function jt(e, t, n) {
  return {
    brushId: e.brushId,
    size: e.size,
    orientations: e.orientations?.slice(t * 4, n * 4),
    pressures: e.pressures?.slice(t, n),
    timestamps: e.timestamps?.slice(t, n),
    penIndex: e.penIndex,
    ownerUserId: e.ownerUserId,
    ownerDisplayName: e.ownerDisplayName
  };
}
function _t(e, t, n) {
  return {
    sid: e.sid,
    color: e.color,
    off: t,
    pts: e.pts.slice(t * 3, n * 3),
    hueOffset: e.hueOffset,
    ...jt(e, t, n)
  };
}
const de = new k(), Ut = new L(), it = new L(), se = new L(), qt = new L(), Ct = new We(), Ke = new L(), $n = new k().setFromEuler(new Gt(-Math.PI / 2, 0, 0)), ze = pt.length, Nn = ze + Qt.length, Gn = ({
  position: e = [0, 0, 0],
  rotationY: t = 0,
  syncId: n = "dcpen",
  enableBrushControls: r = !1,
  defaultBrush: c = Ae,
  defaultRibbonSize: y = yt,
  onSelectedPenChange: i,
  debugApi: h
}) => {
  const d = n, P = Fe((s) => s.scene), w = Fe((s) => s.gl), { localUser: p } = Ft(), b = p?.id ?? "dev-local", A = S(null);
  A.current || (A.current = new mn());
  const u = A.current, [, $] = Te(0), g = x(() => $((s) => s + 1), []), z = Math.max(0.012, Math.min(0.08, y)), D = r ? c : "line", [T, be] = Te(0), [v, _] = Te("all"), [ee, he] = Te({}), [C, Ve] = Te({
    penIndex: 0,
    value: 0,
    min: 0,
    max: 0,
    source: "speed",
    active: !1
  }), [$e, me] = ke(
    `${d}:brush-settings-v1`,
    Array.from({ length: ze }, () => ({ id: D, size: z }))
  ), te = S([]);
  te.current = Array.from({ length: ze }, (s, f) => {
    const q = Array.isArray($e) ? $e[f] : void 0;
    return q && (q.id === "line" || q.id === "ribbon" || q.id === "calligraphy") ? { id: q.id, size: Math.max(0.012, Math.min(0.08, q.size || z)) } : { id: D, size: z };
  });
  const H = te.current[T] ?? { id: D, size: z }, Ee = ee[T] ?? H.id, ne = x((s) => {
    s < 0 || s >= ze || (be(s), i?.(s));
  }, [i]), B = x((s) => {
    const q = te.current.map((V, o) => o === T ? { ...V, ...s } : V);
    me(q), s.id && he((V) => ({ ...V, [T]: s.id }));
  }, [T, me]), ve = x((s, f) => {
    he((q) => ({ ...q, [s]: f }));
  }, []);
  pe(() => i?.(0), [i]);
  const [K, Se] = ke(`${d}:strokes`, []);
  pe(() => {
    Array.isArray(K) && K.length > 0 && (u.merge(K), g());
  }, [K, u, g]);
  const oe = Oe(`${d}:seg`, (s) => {
    u.applySegment(s.sid, s.color, s.off, s.pts, s.hueOffset, s), g();
  }), Ie = Oe(`${d}:end`, (s) => {
    u.markFinished(s.sid), g();
  }), G = Oe(`${d}:undo`, (s) => {
    u.remove(s.sid), g();
  }), Ne = Oe(`${d}:clear`, () => {
    u.clear(), g();
  }), W = S(null), xe = x(() => {
    W.current !== null && (clearTimeout(W.current), W.current = null), Se(u.finishedStrokes());
  }, [Se, u]), E = x(() => {
    W.current === null && (W.current = setTimeout(() => {
      W.current = null, Se(u.finishedStrokes());
    }, En));
  }, [Se, u]);
  pe(
    () => () => {
      W.current !== null && clearTimeout(W.current);
    },
    []
  ), Oe("user-joined", () => {
    W.current !== null && xe();
  });
  const ie = S({}), ce = x((s, f) => {
    const q = ie.current[f] ?? [];
    q.push(s), ie.current[f] = q;
  }, []), ge = x(() => {
    const s = ie.current[T]?.pop();
    s && (u.remove(s), G({ sid: s }), E(), g());
  }, [u, G, E, g, T]), Le = x(() => {
    u.clear(), Ne({}), xe(), ie.current = {}, g();
  }, [u, Ne, xe, g]), Xe = x(() => {
    for (const s of u.all())
      He(s) === b && (u.remove(s.sid), G({ sid: s.sid }));
    ie.current = {}, E(), g();
  }, [g, G, b, E, u]), le = x(
    (s) => {
      u.remove(s), G({ sid: s }), E(), g();
    },
    [u, G, E, g]
  ), Qe = x(
    (s) => {
      for (const f of u.all())
        ht(f) === s && He(f) === b && (u.remove(f.sid), G({ sid: f.sid }));
      E(), g();
    },
    [u, G, E, g, b]
  );
  pe(() => {
    h?.({
      undo: ge,
      clear: Le,
      strokeCount: () => u.all().length,
      strokeColors: () => u.all().map((s) => s.color),
      inject: (s) => {
        u.merge(s), g();
      }
    });
  }, [h, ge, Le, u, g]);
  const F = S({
    left: { down: !1, seq: 0, source: null },
    right: { down: !1, seq: 0, source: null }
  }), re = S({ left: !1, right: !1 }), De = S({ left: null, right: null }), _e = S({ left: 0, right: 0 }), Me = S({ left: !1, right: !1 }), Re = S(new Array(Nn).fill(null)), Z = x((s) => {
    const f = De.current[s];
    if (f === null) return;
    const q = re.current[s] ? "eraser" : te.current[f]?.id ?? Ae, V = hn(q);
    if (re.current[s] = V === "eraser", V !== "eraser") {
      const o = te.current;
      me(o.map(
        (M, m) => m === f ? { ...M, id: V } : M
      ));
    }
    he((o) => ({ ...o, [f]: V })), ne(f);
  }, [ne, me]);
  pe(() => {
    const s = (I, O = null) => {
      const X = performance.now();
      Me.current[I] && X - _e.current[I] < An ? (Z(I), _e.current[I] = 0) : _e.current[I] = X, F.current[I].down = !0, F.current[I].seq += 1, F.current[I].source = O;
    }, f = (I) => {
      F.current[I].down = !1, F.current[I].source = null;
    }, q = (I) => {
      I.button === 0 && s("right");
    }, V = (I) => {
      I.button === 0 && f("right");
    };
    window.addEventListener("pointerdown", q), window.addEventListener("pointerup", V);
    const o = (I) => I.inputSource.handedness === "left" ? "left" : I.inputSource.handedness === "right" ? "right" : null, M = (I) => {
      const O = o(I);
      O && s(O, I.inputSource);
    }, m = (I) => {
      const O = o(I);
      O && f(O);
    };
    let R = null;
    const N = () => {
      const I = w.xr.getSession();
      !I || I === R || (R = I, I.addEventListener("selectstart", M), I.addEventListener("selectend", m));
    }, Q = () => {
      R && (R.removeEventListener("selectstart", M), R.removeEventListener("selectend", m), R = null, F.current.left.down = !1, F.current.right.down = !1, F.current.left.source = null, F.current.right.source = null);
    };
    return w.xr.addEventListener("sessionstart", N), w.xr.addEventListener("sessionend", Q), N(), () => {
      window.removeEventListener("pointerdown", q), window.removeEventListener("pointerup", V), w.xr.removeEventListener("sessionstart", N), w.xr.removeEventListener("sessionend", Q), Q();
    };
  }, [Z, w]);
  const je = x(() => {
    for (const s of Re.current) s?.();
  }, []), Pe = u.all(), Ze = Pe.filter((s) => v === "mine" ? He(s) === b : v === "pen" ? ht(s) === T : !0);
  bn(new Set(Pe.map((s) => `${d}|${s.sid}`)));
  const ue = (s) => (s - (ze - 1) / 2) * 0.17, Ye = (s) => ue(ze - 1) + 0.32 + s * 0.13;
  return /* @__PURE__ */ U("group", { position: e, rotation: [0, t, 0], children: [
    /* @__PURE__ */ U(sn, { grabRadius: Pn, children: [
      /* @__PURE__ */ l("pointLight", { position: [0, 1.9, 0.3], intensity: 1.6, distance: 5, color: "#ffd49a" }),
      pt.map((s, f) => /* @__PURE__ */ l(
        Ht,
        {
          index: f,
          kind: "pen",
          color: s,
          colorName: ot[f] ?? s,
          slotOffset: [ue(f), 1.05, 0],
          syncId: d,
          store: u,
          emitSeg: oe,
          emitEnd: Ie,
          persistFinished: E,
          bump: g,
          drawInput: F,
          anyHeldByHand: Me,
          pushUndoSid: ce,
          eraserMode: re,
          heldPenIndexByHand: De,
          eraseStroke: le,
          putAwayFns: Re,
          brushSettingsByPen: te,
          onSelectPen: ne,
          onToolModeChange: ve,
          onPressureTelemetry: Ve
        },
        s
      )),
      Qt.map((s, f) => /* @__PURE__ */ l(
        Ht,
        {
          index: ze + f,
          kind: "eraser",
          color: s,
          colorName: "消しゴム",
          slotOffset: [Ye(f), 1.15, 0],
          syncId: d,
          store: u,
          emitSeg: oe,
          emitEnd: Ie,
          persistFinished: E,
          bump: g,
          drawInput: F,
          anyHeldByHand: Me,
          pushUndoSid: ce,
          eraserMode: re,
          heldPenIndexByHand: De,
          eraseStroke: le,
          putAwayFns: Re,
          brushSettingsByPen: te,
          onSelectPen: ne,
          onToolModeChange: ve,
          onPressureTelemetry: Ve
        },
        s
      )),
      pt.map((s, f) => /* @__PURE__ */ U("group", { children: [
        /* @__PURE__ */ l(
          Y,
          {
            id: `${d}-respawn-${f}`,
            position: [ue(f), 1.62, 0],
            size: [0.09, 0.07, 0.02],
            color: "#37474f",
            label: "Respawn",
            fontSize: 0.015,
            interactionText: `${ot[f]}のペンを片づける`,
            onInteract: () => Re.current[f]?.(),
            children: /* @__PURE__ */ U("mesh", { position: [0, -0.05, 0], children: [
              /* @__PURE__ */ l("boxGeometry", { args: [0.1, 0.016, 0.02] }),
              /* @__PURE__ */ l(
                "meshStandardMaterial",
                {
                  color: s === we ? "#ffffff" : s,
                  emissive: s === we ? "#ffffff" : s,
                  emissiveIntensity: 0.5
                }
              )
            ] })
          }
        ),
        /* @__PURE__ */ l(
          Y,
          {
            id: `${d}-clearcolor-${f}`,
            position: [ue(f), 0.62, 0],
            size: [0.09, 0.07, 0.02],
            color: "#4a3b57",
            label: "Clear",
            fontSize: 0.017,
            interactionText: `${ot[f]}のペンで自分が描いた線を消す`,
            onInteract: () => {
              ne(f), Qe(f);
            }
          }
        )
      ] }, `ui-${s}`)),
      /* @__PURE__ */ l(
        Y,
        {
          id: `${d}-undo`,
          position: [ue(0) - 0.35, 1.45, 0],
          color: "#8a6d00",
          label: "Undo",
          interactionText: "1本戻す（自分の線）",
          onInteract: ge
        }
      ),
      /* @__PURE__ */ l(
        Y,
        {
          id: `${d}-clear`,
          position: [ue(0) - 0.35, 1.2, 0],
          color: "#8a0015",
          label: "Clear Mine",
          fontSize: 0.019,
          interactionText: "自分が描いた線だけをぜんぶ消す",
          onInteract: Xe
        }
      ),
      /* @__PURE__ */ l(
        Y,
        {
          id: `${d}-reset`,
          position: [ue(0) - 0.35, 0.95, 0],
          color: "#1d4f9e",
          label: "All Reset",
          fontSize: 0.019,
          interactionText: "ペンと消しゴムをぜんぶ片づける",
          onInteract: je
        }
      ),
      r ? /* @__PURE__ */ U("group", { children: [
        /* @__PURE__ */ l(Ce, { position: [0.15, 1.92, 0.01], fontSize: 0.042, color: "#172033", anchorX: "center", children: "DOUBLE CLICK: LINE > RIBBON > FUDE > ERASE" }),
        /* @__PURE__ */ l(
          Y,
          {
            id: `${d}-brush-line`,
            position: [-0.48, 1.78, 0],
            size: [0.24, 0.12, 0.035],
            color: Ee === "line" ? "#0f766e" : "#475569",
            label: "LINE",
            fontSize: 0.035,
            interactionText: "通常のDcPen線に切り替える",
            onInteract: () => B({ id: "line" })
          }
        ),
        /* @__PURE__ */ l(
          Y,
          {
            id: `${d}-brush-ribbon`,
            position: [-0.17, 1.78, 0],
            size: [0.34, 0.12, 0.035],
            color: Ee === "ribbon" ? "#c2410c" : "#475569",
            label: "RIBBON",
            fontSize: 0.032,
            interactionText: "速度で幅が変わるリボン筆に切り替える",
            onInteract: () => B({ id: "ribbon" })
          }
        ),
        /* @__PURE__ */ l(
          Y,
          {
            id: `${d}-brush-calligraphy`,
            position: [0.15, 1.78, 0],
            size: [0.24, 0.12, 0.035],
            color: Ee === "calligraphy" ? "#7c3aed" : "#475569",
            label: "FUDE",
            fontSize: 0.03,
            interactionText: "入りと抜きのある筆ブラシに切り替える",
            onInteract: () => B({ id: "calligraphy" })
          }
        ),
        /* @__PURE__ */ l(
          Y,
          {
            id: `${d}-brush-thinner`,
            position: [0.41, 1.78, 0],
            size: [0.18, 0.12, 0.035],
            color: "#334155",
            label: "THIN",
            fontSize: 0.027,
            interactionText: "ブラシを細くする",
            onInteract: () => B({ size: Math.max(0.012, Math.round((H.size - 6e-3) * 1e3) / 1e3) })
          }
        ),
        /* @__PURE__ */ l(
          Y,
          {
            id: `${d}-brush-wider`,
            position: [0.63, 1.78, 0],
            size: [0.18, 0.12, 0.035],
            color: "#334155",
            label: "WIDE",
            fontSize: 0.027,
            interactionText: "ブラシを太くする",
            onInteract: () => B({ size: Math.min(0.08, Math.round((H.size + 6e-3) * 1e3) / 1e3) })
          }
        ),
        /* @__PURE__ */ l(Ce, { position: [0.76, 1.78, 0.02], fontSize: 0.029, color: "#172033", anchorX: "left", children: `P${T + 1} ${Ee.toUpperCase()} ${Math.round(H.size * 1e3)}mm` }),
        /* @__PURE__ */ l(Ce, { position: [-0.72, 2.1, 0.02], fontSize: 0.033, color: "#172033", anchorX: "left", children: `WIDTH ${Math.round((C.penIndex === T ? C.value : 0) * 100)}% SPEED` }),
        /* @__PURE__ */ l(Ce, { position: [0.05, 2.1, 0.02], fontSize: 0.028, color: "#9a3412", anchorX: "left", children: C.penIndex === T && !C.active ? `RANGE ${Math.round(C.min * 100)}-${Math.round(C.max * 100)}%` : "SLOW = THICK / FAST = THIN" }),
        /* @__PURE__ */ l("group", { position: [-0.7, 2.2, 0.01], children: Array.from({ length: 10 }, (s, f) => /* @__PURE__ */ U("mesh", { position: [f * 0.14, 0, 0], children: [
          /* @__PURE__ */ l("boxGeometry", { args: [0.11, 0.055, 0.025] }),
          /* @__PURE__ */ l(
            "meshStandardMaterial",
            {
              color: f < Math.ceil((C.penIndex === T ? C.value : 0) * 10) ? "#f97316" : "#cbd5e1",
              emissive: f < Math.ceil((C.penIndex === T ? C.value : 0) * 10) ? "#f97316" : "#000000",
              emissiveIntensity: 0.4
            }
          )
        ] }, f)) }),
        /* @__PURE__ */ l(Y, { id: `${d}-view-all`, position: [-0.42, 2.34, 0], size: [0.3, 0.1, 0.03], color: v === "all" ? "#2563eb" : "#64748b", label: "ALL", fontSize: 0.028, interactionText: "全員の線を表示", onInteract: () => _("all") }),
        /* @__PURE__ */ l(Y, { id: `${d}-view-mine`, position: [-0.06, 2.34, 0], size: [0.34, 0.1, 0.03], color: v === "mine" ? "#2563eb" : "#64748b", label: "MINE", fontSize: 0.028, interactionText: "自分の線だけ表示", onInteract: () => _("mine") }),
        /* @__PURE__ */ l(Y, { id: `${d}-view-pen`, position: [0.33, 2.34, 0], size: [0.34, 0.1, 0.03], color: v === "pen" ? "#2563eb" : "#64748b", label: "PEN", fontSize: 0.028, interactionText: "選択中の物理ペンの線だけ表示", onInteract: () => _("pen") })
      ] }) : null
    ] }),
    at(
      /* @__PURE__ */ l("group", { children: Ze.map((s) => /* @__PURE__ */ l(Mn, { cacheKey: `${d}|${s.sid}`, stroke: s, count: s.pts.length }, s.sid)) }),
      P
    )
  ] });
}, Ht = ({
  index: e,
  kind: t,
  color: n,
  colorName: r,
  slotOffset: c,
  syncId: y,
  store: i,
  emitSeg: h,
  emitEnd: d,
  persistFinished: P,
  bump: w,
  drawInput: p,
  anyHeldByHand: b,
  pushUndoSid: A,
  eraserMode: u,
  heldPenIndexByHand: $,
  eraseStroke: g,
  putAwayFns: z,
  brushSettingsByPen: D,
  onSelectPen: T,
  onToolModeChange: be,
  onPressureTelemetry: v
}) => {
  const _ = y, { localUser: ee, getMovement: he, getLocalMovement: C, getAvatarHeight: Ve } = Ft(), $e = Fe((o) => o.scene), me = ee?.id ?? "dev-local", te = ee?.displayName || "名前なしユーザー", H = S(me);
  H.current = me;
  const [Ee, ne] = ke(`${_}:holder:${e}`, null), [B, ve] = ke(`${_}:pose:${e}`, null), K = On(Ee), Se = K !== null && K.id === me, oe = S(null);
  oe.current = K;
  const Ie = S(null);
  Ie.current = B;
  const G = S(null), Ne = S(0), W = S(0), xe = S(0), E = S(new L()), ie = S(new L()), ce = S(new L()), ge = S(!1), Le = S(null), Xe = S(null), le = S(null), Qe = S(-1), F = S(null);
  Oe("user-left", (o) => {
    const M = Rn(o);
    M !== null && M === oe.current?.id && ne(null);
  });
  const re = x(() => {
    const o = G.current;
    if (!o) return;
    G.current = null;
    const M = i.get(o.sid);
    if (!M || o.count < 2) {
      i.remove(o.sid), v({
        penIndex: e,
        value: o.maxPressure,
        min: o.minPressure,
        max: o.maxPressure,
        source: o.pressureSource,
        active: !1
      }), w();
      return;
    }
    o.sent < o.count && h(_t(M, o.sent, o.count)), d({ sid: o.sid }), i.markFinished(o.sid), A(o.sid, e), v({
      penIndex: e,
      value: o.maxPressure,
      min: o.minPressure,
      max: o.maxPressure,
      source: o.pressureSource,
      active: !1
    }), P(), w();
  }, [i, h, d, P, A, w, e, v]), De = x(
    (o, M) => {
      const m = Ie.current, R = F.current;
      m ? (o.set(m.p[0], m.p[1], m.p[2]), M.set(m.q[0], m.q[1], m.q[2], m.q[3])) : R ? (R.getWorldPosition(o), R.getWorldQuaternion(M), t === "pen" && M.multiply($n)) : (o.set(0, 0, 0), M.identity());
    },
    [t]
  ), _e = x(
    (o) => {
      const M = Ie.current, m = F.current;
      M ? o.set(M.p[0], M.p[1], M.p[2]) : m ? (m.getWorldPosition(o), t === "pen" && (o.y += 0.17)) : o.set(0, 0, 0);
    },
    [t]
  ), Me = S(null), Re = x(() => {
    const o = Me.current;
    o !== null && (Me.current = null, b.current[o] = !1, u.current[o] = !1, $.current[o] = null, t === "pen" && be(e, D.current[e]?.id ?? Ae));
  }, [b, D, u, $, e, t, be]), Z = cn({
    id: `${_}-slot-${e}`,
    isFree: () => oe.current === null,
    worldPosition: _e,
    worldPose: De,
    defaultOffset: {
      position: new L(0, 0, t === "pen" ? -0.08 : -0.03),
      quaternion: new k()
    },
    onGrabStart: (o) => {
      t === "pen" && T(e), ne({ id: H.current, hand: o }), Me.current = o, b.current[o] = !0, u.current[o] = !1, $.current[o] = t === "pen" ? e : null, t === "pen" && be(e, D.current[e]?.id ?? Ae), Qe.current = p.current[o].down ? p.current[o].seq : -1;
    },
    onDrop: (o) => {
      re(), ve(o ? {
        p: [fe(o.position.x), fe(o.position.y), fe(o.position.z)],
        q: [
          Math.round(o.quaternion.x * 1e3) / 1e3,
          Math.round(o.quaternion.y * 1e3) / 1e3,
          Math.round(o.quaternion.z * 1e3) / 1e3,
          Math.round(o.quaternion.w * 1e3) / 1e3
        ]
      } : null), ne(null), Re();
    }
  }), je = x(() => {
    Z.drop(null);
  }, [Z]), Pe = x(() => {
    oe.current === null && ve(null);
  }, [ve]);
  pe(() => (z.current[e] = Pe, () => {
    z.current[e] = null;
  }), [e, Pe, z]);
  const Ze = x(() => {
    for (const o of i.all()) {
      if (He(o) !== H.current) continue;
      let M = !1;
      for (let m = 0; m + 2 < o.pts.length; m += 3) {
        const R = o.pts[m], N = o.pts[m + 1], Q = o.pts[m + 2];
        if (!(R === void 0 || N === void 0 || Q === void 0) && (Ke.set(R, N, Q), Ke.distanceTo(E.current) < zn)) {
          M = !0;
          break;
        }
      }
      M && g(o.sid);
    }
  }, [i, g]), ue = x(() => {
    for (const o of i.all()) {
      if (He(o) !== H.current || ht(o) !== e) continue;
      const M = o.pts;
      let m = !1;
      const R = [];
      let N = [], Q = 0;
      for (let O = 0; O + 2 < M.length; O += 3) {
        const X = M[O], a = M[O + 1], j = M[O + 2];
        X === void 0 || a === void 0 || j === void 0 || (Ke.set(X, a, j), Ke.distanceTo(E.current) < Tn ? (m = !0, N.length >= 6 && R.push({ pts: N, start: Q }), N = []) : (N.length === 0 && (Q = O / 3), N.push(X, a, j)));
      }
      if (N.length >= 6 && R.push({ pts: N, start: Q }), !m) continue;
      const I = o.hueOffset ?? 0;
      g(o.sid);
      for (const O of R) {
        W.current += 1;
        const X = `${H.current}:${e}:${Date.now().toString(36)}:${W.current}`, a = I + O.start, j = O.pts.length / 3, ye = jt(o, O.start, O.start + j);
        i.applySegment(X, o.color, 0, O.pts, a, ye), i.markFinished(X), h({ sid: X, color: o.color, off: 0, pts: O.pts, hueOffset: a, ...ye }), d({ sid: X });
      }
      P(), w();
    }
  }, [i, g, h, d, P, w, e]);
  Bt(({ camera: o, clock: M }) => {
    const m = Le.current, R = oe.current;
    if (R === null) {
      m && (m.visible = !1), G.current && re(), le.current = null;
      return;
    }
    let N = !1;
    if (se.copy(E.current), R.id === H.current)
      if (Z.getAttachedPose(se, de))
        E.current.copy(se), m && m.quaternion.copy(de), N = !0;
      else {
        const a = C();
        a.isInVR && a.vrTracking ? (N = $t(a, R.hand, E.current), se.copy(E.current), Nt(a, R.hand, de) && m && m.quaternion.copy(de)) : (o.getWorldPosition(it), o.getWorldDirection(Ut), E.current.copy(it).addScaledVector(Ut, dn), qt.set(0.17, -0.11, -0.4).applyQuaternion(o.quaternion), se.copy(it).add(qt), m && (Ct.lookAt(se, E.current, o.up), m.quaternion.setFromRotationMatrix(Ct), de.copy(m.quaternion)), N = !0), N && m && Z.reportFallbackPose(se, m.quaternion);
      }
    else {
      const a = he(R.id);
      if (a)
        if (le.current = null, a.isInVR && a.vrTracking)
          N = $t(a, R.hand, E.current), se.copy(E.current), m && Nt(a, R.hand, de) && m.quaternion.copy(de);
        else {
          const j = Ve?.(R.id)?.eyeHeight ?? 1.3;
          ln(a, j, E.current), se.copy(E.current), N = !0;
        }
      else {
        const j = M.elapsedTime;
        le.current === null ? le.current = j : j - le.current > 5 && (le.current = null, ne(null));
      }
    }
    m && (m.visible = N, N && m.position.copy(se));
    const Q = t === "pen" && u.current[R.hand], I = Xe.current;
    if (I && (I.visible = R.id === H.current && Q), R.id !== H.current || !N) return;
    const O = p.current[R.hand], X = O.down && O.seq !== Qe.current;
    if (t === "eraser" || Q) {
      G.current && re(), ge.current = !1, X && (t === "eraser" ? Ze() : ue());
      return;
    }
    if (X) {
      let a = G.current;
      if (!a) {
        if (!ge.current) {
          ce.current.copy(E.current), ge.current = !0;
          return;
        }
        if (E.current.distanceTo(ce.current) < dt * 1.5) return;
        W.current += 1;
        const qe = Math.round(M.elapsedTime * 1e3), wt = D.current[e] ?? { id: Ae, size: yt }, ae = Dt(O.source, 0, 0);
        a = {
          sid: `${H.current}:${e}:${Date.now().toString(36)}:${W.current}`,
          color: n,
          count: 0,
          sent: 0,
          hueOffset: xe.current,
          brushId: wt.id,
          size: wt.size,
          startedAt: qe,
          lastSampleAt: qe,
          minPressure: ae.value,
          maxPressure: ae.value,
          pressureSource: ae.source,
          lastPressure: ae.value
        }, G.current = a, i.applySegment(
          a.sid,
          a.color,
          0,
          [fe(ce.current.x), fe(ce.current.y), fe(ce.current.z)],
          a.hueOffset,
          {
            brushId: a.brushId,
            size: a.size,
            orientations: Lt(de),
            pressures: [ae.value],
            timestamps: [0],
            penIndex: e,
            ownerUserId: H.current,
            ownerDisplayName: te
          }
        ), v({
          penIndex: e,
          value: ae.value,
          min: ae.value,
          max: ae.value,
          source: ae.source,
          active: !0
        }), a.count = 1, xe.current += 1, ie.current.copy(ce.current);
      }
      if (a.count >= un) {
        re();
        return;
      }
      const j = E.current.distanceTo(ie.current);
      if (j < dt) return;
      const ye = Math.round(M.elapsedTime * 1e3), Je = Dt(O.source, j, (ye - a.lastSampleAt) / 1e3), Ue = Math.round((a.lastPressure * 0.58 + Je.value * 0.42) * 1e3) / 1e3;
      if (a.lastPressure = Ue, a.minPressure = Math.min(a.minPressure, Ue), a.maxPressure = Math.max(a.maxPressure, Ue), a.pressureSource = Je.source, ie.current.copy(E.current), i.applySegment(
        a.sid,
        a.color,
        a.count,
        [fe(E.current.x), fe(E.current.y), fe(E.current.z)],
        a.hueOffset,
        {
          brushId: a.brushId,
          size: a.size,
          orientations: Lt(de),
          pressures: [Ue],
          timestamps: [ye - a.startedAt],
          penIndex: e,
          ownerUserId: H.current,
          ownerDisplayName: te
        }
      ), a.count += 1, a.lastSampleAt = ye, ye - Ne.current >= 100 && (Ne.current = ye, v({
        penIndex: e,
        value: Ue,
        min: a.minPressure,
        max: a.maxPressure,
        source: Je.source,
        active: !0
      })), xe.current += 1, a.count - a.sent >= fn) {
        const qe = i.get(a.sid);
        qe && (h(_t(qe, a.sent, a.count)), a.sent = a.count);
      }
      w();
    } else
      ge.current = !1, G.current && re();
  });
  const Ye = B !== null, s = K === null && !Ye, f = t === "pen" ? `${r}のペン` : r, q = K === null ? Ye ? `${f}をラックに戻す` : t === "pen" ? `${f}を持つ（VR:グリップ・トリガー2回でLINE/RIBBON/FUDE/消しゴム切替）` : `${f}を持つ（トリガーで線に当てて消す）` : Se ? `${f}をラックに戻す` : "だれかが使用中", V = x(() => {
    t === "pen" && T(e), oe.current === null ? Ie.current ? Pe() : Z.grabViaClick() : Z.isHeld && je();
  }, [Z, je, Pe, e, t, T]);
  return /* @__PURE__ */ U("group", { position: c, children: [
    /* @__PURE__ */ l("group", { ref: F }),
    /* @__PURE__ */ U(
      ft,
      {
        id: `${_}-slot-${e}`,
        onInteract: V,
        interactionText: q,
        enabled: K === null || Se,
        children: [
          t === "pen" ? /* @__PURE__ */ l("group", { rotation: [-Math.PI / 2, 0, 0], visible: s, children: /* @__PURE__ */ l(ct, { color: n }) }) : /* @__PURE__ */ l("group", { visible: s, children: /* @__PURE__ */ l(lt, { color: n }) }),
          /* @__PURE__ */ U("mesh", { position: [0, t === "pen" ? 0.17 : 0, 0], children: [
            /* @__PURE__ */ l("cylinderGeometry", { args: [0.06, 0.06, t === "pen" ? 0.36 : 0.12, 8] }),
            /* @__PURE__ */ l("meshBasicMaterial", { transparent: !0, opacity: 0, depthWrite: !1 })
          ] })
        ]
      }
    ),
    K === null && B !== null && at(
      /* @__PURE__ */ l(
        "group",
        {
          position: [B.p[0], B.p[1], B.p[2]],
          quaternion: [B.q[0], B.q[1], B.q[2], B.q[3]],
          children: /* @__PURE__ */ U(
            ft,
            {
              id: `${_}-slot-air-${e}`,
              onInteract: () => {
                t === "pen" && T(e), Z.grabViaClick();
              },
              interactionText: `${f}を持つ`,
              children: [
                t === "pen" ? /* @__PURE__ */ l(ct, { color: n }) : /* @__PURE__ */ l(lt, { color: n }),
                /* @__PURE__ */ U("mesh", { position: [0, 0, t === "pen" ? 0.17 : 0], children: [
                  /* @__PURE__ */ l("sphereGeometry", { args: [0.08, 8, 8] }),
                  /* @__PURE__ */ l("meshBasicMaterial", { transparent: !0, opacity: 0, depthWrite: !1 })
                ] })
              ]
            }
          )
        }
      ),
      $e
    ),
    at(
      /* @__PURE__ */ U("group", { ref: Le, visible: !1, name: `${_}-held-${e}`, children: [
        t === "pen" ? /* @__PURE__ */ l(ct, { color: n }) : /* @__PURE__ */ l(lt, { color: n }),
        t === "pen" && /* @__PURE__ */ U("mesh", { ref: Xe, visible: !1, position: [0, 0, 5e-3], children: [
          /* @__PURE__ */ l("sphereGeometry", { args: [0.02, 12, 12] }),
          /* @__PURE__ */ l("meshStandardMaterial", { color: "#f0f0f0", emissive: "#f0f0f0", emissiveIntensity: 0.6 })
        ] })
      ] }),
      $e
    )
  ] });
}, Ln = ["#e53935", "#fb8c00", "#fdd835", "#43a047", "#1e88e5", "#8e24aa"], ct = ({ color: e }) => {
  const t = e === we ? "#ffffff" : e;
  return /* @__PURE__ */ U("group", { children: [
    /* @__PURE__ */ U("mesh", { position: [0, 0, 7e-3], rotation: [-Math.PI / 2, 0, 0], children: [
      /* @__PURE__ */ l("coneGeometry", { args: [45e-4, 0.015, 8] }),
      /* @__PURE__ */ l("meshStandardMaterial", { color: t, emissive: t, emissiveIntensity: 1.8 })
    ] }),
    /* @__PURE__ */ U("mesh", { position: [0, 0, 0.031], rotation: [-Math.PI / 2, 0, 0], children: [
      /* @__PURE__ */ l("coneGeometry", { args: [0.013, 0.034, 6] }),
      /* @__PURE__ */ l("meshStandardMaterial", { color: "#d8bb90", roughness: 0.85 })
    ] }),
    e === we ? Ln.map((n, r) => /* @__PURE__ */ U("mesh", { position: [0, 0, 0.048 + 0.048 * r + 0.024], rotation: [Math.PI / 2, 0, 0], children: [
      /* @__PURE__ */ l("cylinderGeometry", { args: [0.012, 0.012, 0.048, 6] }),
      /* @__PURE__ */ l("meshStandardMaterial", { color: n, roughness: 0.6 })
    ] }, n)) : /* @__PURE__ */ U("mesh", { position: [0, 0, 0.192], rotation: [Math.PI / 2, 0, 0], children: [
      /* @__PURE__ */ l("cylinderGeometry", { args: [0.012, 0.012, 0.288, 6] }),
      /* @__PURE__ */ l("meshStandardMaterial", { color: e, roughness: 0.6 })
    ] })
  ] });
}, lt = ({ color: e }) => /* @__PURE__ */ U("mesh", { rotation: [Math.PI / 2, 0, 0], children: [
  /* @__PURE__ */ l("cylinderGeometry", { args: [0.05, 0.05, 0.07, 6] }),
  /* @__PURE__ */ l("meshStandardMaterial", { color: e, roughness: 0.5, metalness: 0.1 })
] }), Y = ({
  id: e,
  position: t,
  size: n = [0.12, 0.08, 0.03],
  color: r,
  label: c,
  labelColor: y = "#ffffff",
  fontSize: i = 0.022,
  interactionText: h,
  onInteract: d,
  children: P
}) => /* @__PURE__ */ l(ft, { id: e, onInteract: d, interactionText: h, children: /* @__PURE__ */ U("group", { position: t, children: [
  /* @__PURE__ */ U("mesh", { castShadow: !0, children: [
    /* @__PURE__ */ l("boxGeometry", { args: n }),
    /* @__PURE__ */ l("meshStandardMaterial", { color: r, emissive: r, emissiveIntensity: 0.35 })
  ] }),
  /* @__PURE__ */ l(
    Ce,
    {
      position: [0, 0, n[2] / 2 + 2e-3],
      fontSize: i,
      color: y,
      anchorX: "center",
      anchorY: "middle",
      outlineWidth: i * 0.08,
      outlineColor: "#00000088",
      children: c
    }
  ),
  P
] }) });
export {
  Bn as BRUSH_REGISTRY,
  Ae as DEFAULT_BRUSH,
  yt as DEFAULT_RIBBON_SIZE,
  Gn as DcPen,
  pt as PEN_COLORS,
  we as RAINBOW,
  Mn as StrokeRenderer,
  Sn as buildRibbonGeometry,
  hn as getNextPenToolMode,
  He as getStrokeOwnerId,
  ht as getStrokePenIndex,
  pn as speedToWidthValue
};
