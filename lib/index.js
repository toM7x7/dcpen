import { jsx as l, jsxs as L } from "react/jsx-runtime";
import { useRef as b, useCallback as M, useEffect as ue, useMemo as it, createContext as Qt, useState as Re, useContext as kt, memo as jt } from "react";
import { useThree as Ce, useFrame as Ct, createPortal as ct } from "@react-three/fiber";
import { Line as yt, Text as _e } from "@react-three/drei";
import { Vector3 as $, Quaternion as k, Matrix4 as He, Euler as Ht, Color as Yt, BufferGeometry as Zt, BufferAttribute as Ze, DoubleSide as Jt, CatmullRomCurve3 as Kt } from "three";
import { useUsers as Gt, useInstanceState as Qe, useInstanceEvent as Ee, Interactable as lt } from "@xrift/world-components";
const wt = new He(), vt = new He(), bt = new He(), St = new He(), en = new $();
function Bt(e, t, n, r) {
  const c = e.xr;
  if (!c.isPresenting) return !1;
  const w = c.getSession();
  if (!w) return !1;
  const u = c.getFrame(), v = c.getReferenceSpace();
  if (!u || !v) return !1;
  const d = u.getViewerPose(v);
  if (!d) return !1;
  let x = null;
  for (const S of w.inputSources)
    if (S.handedness === t && (S.gripSpace || S.targetRaySpace)) {
      x = S;
      break;
    }
  if (!x) return !1;
  const g = x.gripSpace ?? x.targetRaySpace, p = u.getPose(g, v);
  if (!p) return !1;
  wt.fromArray(Array.from(d.transform.matrix)), vt.fromArray(Array.from(p.transform.matrix));
  const m = c.getCamera().matrixWorld;
  return bt.copy(m).multiply(wt.invert()), St.copy(bt).multiply(vt), St.decompose(n, r, en), !0;
}
const Wt = Qt(null);
function tn() {
  const e = kt(Wt);
  if (!e) throw new Error("xrift-grab: useGrabbable must be used within <XRGrabProvider>");
  return e;
}
const It = ["left", "right"], Je = new $(), xt = new k(), Mt = new $();
function nn({ grabRadius: e = 0.45, children: t }) {
  const n = Ce((p) => p.gl), r = b(/* @__PURE__ */ new Map()), c = b({ left: null, right: null }), w = b(/* @__PURE__ */ new Set()), u = M((p, m) => {
    r.current.set(p, m);
  }, []), v = M((p) => {
    r.current.delete(p);
    for (const m of It)
      c.current[m]?.id === p && (c.current[m] = null);
  }, []), d = M(
    (p, m, S, a, O) => {
      const h = r.current.get(p);
      if (!h || !h.isFree()) return;
      const P = c.current[m];
      P && P.id !== p && r.current.get(P.id)?.endHold(), c.current[m] = { id: p, viaGrip: S }, h.beginHold(m, S, a, O);
    },
    []
  ), x = M((p, m) => {
    const S = r.current.get(p);
    for (const a of It)
      c.current[a]?.id === p && (c.current[a] = null);
    S?.endHold(m);
  }, []);
  ue(() => {
    const p = (P) => P.inputSource.handedness === "left" ? "left" : P.inputSource.handedness === "right" ? "right" : null, m = (P) => {
      const N = p(P);
      if (!N) return;
      const T = c.current[N];
      T === null ? w.current.add(N) : T.viaGrip = !0;
    }, S = (P) => {
      const N = p(P);
      if (!N) return;
      const T = c.current[N];
      T !== null && T.viaGrip && x(T.id);
    };
    let a = null;
    const O = () => {
      const P = n.xr.getSession();
      !P || P === a || (a = P, P.addEventListener("squeezestart", m), P.addEventListener("squeezeend", S));
    }, h = () => {
      a && (a.removeEventListener("squeezestart", m), a.removeEventListener("squeezeend", S), a = null, w.current.clear());
    };
    return n.xr.addEventListener("sessionstart", O), n.xr.addEventListener("sessionend", h), O(), () => {
      n.xr.removeEventListener("sessionstart", O), n.xr.removeEventListener("sessionend", h), h();
    };
  }, [n, x]), Ct(() => {
    if (w.current.size !== 0) {
      for (const p of w.current) {
        if (!Bt(n, p, Je, xt)) continue;
        let m = null, S = e;
        for (const [a, O] of r.current) {
          if (!O.isFree()) continue;
          O.worldPosition(Mt);
          const h = Mt.distanceTo(Je);
          h < S && (S = h, m = a);
        }
        m && d(m, p, !0, Je, xt);
      }
      w.current.clear();
    }
  });
  const g = it(
    () => ({ grabRadius: e, register: u, unregister: v, requestGrab: d, requestDrop: x }),
    [e, u, v, d, x]
  );
  return /* @__PURE__ */ l(Wt.Provider, { value: g, children: t });
}
const Pt = new $(), zt = new k(), Ke = new k(), At = new $(), et = new k(), rn = new k();
function sn(e) {
  const t = tn(), n = Ce((I) => I.gl), { id: r } = e, c = b(e);
  c.current = e;
  const [w, u] = Re(!1), [v, d] = Re(null), x = b(null), g = b(new $()), p = b(new k()), m = b(new $()), S = b(new k()), a = M(() => {
    const I = c.current.isFree;
    return I ? I() : x.current === null;
  }, []), O = M((I) => {
    const H = c.current.worldPosition;
    H ? H(I) : c.current.worldPose(I, rn);
  }, []), h = M(
    (I, H, _, ye) => {
      if (H && _ && ye)
        c.current.worldPose(Pt, zt), Ke.copy(ye).invert(), p.current.copy(Ke).multiply(zt), g.current.copy(Pt).sub(_).applyQuaternion(Ke);
      else {
        const ee = c.current.defaultOffset;
        ee ? (g.current.copy(ee.position), p.current.copy(ee.quaternion)) : (g.current.set(0, 0, 0), p.current.identity());
      }
      x.current = I, u(!0), d(I), c.current.onGrabStart?.(I, H);
    },
    []
  ), P = M((I) => {
    x.current !== null && (x.current = null, u(!1), d(null), I === null ? c.current.onDrop?.(null) : I ? c.current.onDrop?.(I) : c.current.onDrop?.({ position: m.current.clone(), quaternion: S.current.clone() }));
  }, []);
  ue(() => {
    const I = {
      isFree: a,
      worldPosition: O,
      beginHold: h,
      endHold: P
    };
    return t.register(r, I), () => t.unregister(r);
  }, [t, r, a, O, h, P]);
  const N = M(
    (I, H) => {
      const _ = x.current;
      return _ === null || !Bt(n, _, At, et) ? !1 : (H.copy(et).multiply(p.current), I.copy(g.current).applyQuaternion(et).add(At), m.current.copy(I), S.current.copy(H), !0);
    },
    [n]
  ), T = M((I, H) => {
    x.current !== null && (m.current.copy(I), S.current.copy(H));
  }, []), Z = M(
    (I = "right") => {
      t.requestGrab(r, I, !1);
    },
    [t, r]
  );
  return { isHeld: w, heldHand: v, getAttachedPose: N, reportFallbackPose: T, grabViaClick: Z, drop: P };
}
const dt = new $(0, 1, 0), Tt = new k(), Et = new Ht();
function Rt(e, t, n) {
  const r = e.vrTracking;
  if (!r) return !1;
  const c = t === "right" ? r.rightHand.position : r.leftHand.position;
  return n.set(c.x, c.y, c.z), n.applyAxisAngle(dt, e.rotation.yaw), n.x += e.position.x, n.y += e.position.y, n.z += e.position.z, !0;
}
function $t(e, t, n) {
  const r = e.vrTracking;
  if (!r) return !1;
  const c = t === "right" ? r.rightHand.rotation : r.leftHand.rotation;
  return n.setFromAxisAngle(dt, e.rotation.yaw), Et.set(c.x, c.y, c.z, "XYZ"), Tt.setFromEuler(Et), n.multiply(Tt), !0;
}
function on(e, t, n) {
  n.set(0.15, 0, -0.35), n.applyAxisAngle(dt, e.rotation.yaw), n.x += e.position.x, n.y += e.position.y + t * 0.55, n.z += e.position.z;
}
const ut = 0.01, pt = 4, cn = 2e3, ln = 2e4, un = 4, an = 1.2, ht = "line", mt = 0.035, ge = "rainbow", at = [
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
  ge
];
function ce(e) {
  return Math.round(e * 1e3) / 1e3;
}
function ft(e) {
  if (Number.isSafeInteger(e.penIndex) && e.penIndex >= 0) return e.penIndex;
  const t = e.sid.split(":")[1], n = Number(t);
  return Number.isSafeInteger(n) && n >= 0 ? n : null;
}
function De(e) {
  return e.ownerUserId ? e.ownerUserId : e.sid.split(":")[0] || null;
}
class fn {
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
  applySegment(t, n, r, c, w = 0, u = {}) {
    let v = this.strokes.get(t);
    v || (v = {
      sid: t,
      color: n,
      pts: [],
      hueOffset: w,
      brushId: u.brushId,
      size: u.size,
      orientations: u.orientations ? [] : void 0,
      pressures: u.pressures ? [] : void 0,
      timestamps: u.timestamps ? [] : void 0,
      penIndex: u.penIndex,
      ownerUserId: u.ownerUserId,
      ownerDisplayName: u.ownerDisplayName
    }, this.strokes.set(t, v)), u.brushId !== void 0 && (v.brushId = u.brushId), u.size !== void 0 && (v.size = u.size), u.penIndex !== void 0 && (v.penIndex = u.penIndex), u.ownerUserId !== void 0 && (v.ownerUserId = u.ownerUserId), u.ownerDisplayName !== void 0 && (v.ownerDisplayName = u.ownerDisplayName);
    const d = r * 3;
    for (let x = 0; x < c.length; x++)
      v.pts[d + x] = c[x];
    tt(v, "orientations", r * 4, u.orientations), tt(v, "pressures", r, u.pressures), tt(v, "timestamps", r, u.timestamps), this.version++;
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
    for (; t > ln && this.finishedOrder.length > 0; ) {
      const n = this.finishedOrder[0], r = this.strokes.get(n);
      t -= r ? r.pts.length / 3 : 0, this.remove(n);
    }
  }
}
function tt(e, t, n, r) {
  if (!r) return;
  const c = e[t] ?? [];
  for (let w = 0; w < r.length; w += 1) c[n + w] = r[w];
  e[t] = c;
}
const Dn = [
  { id: "line", label: "LINE", description: "DcPen互換の均一な線" },
  { id: "ribbon", label: "RIBBON", description: "向きと筆圧で幅が変わる平筆" }
], dn = 0.02 * (ut / 0.015 / pt), qe = /* @__PURE__ */ new Map(), Ue = /* @__PURE__ */ new Map(), Y = new Yt();
function Ft(e) {
  const t = [];
  for (let n = 0; n + 2 < e.length; n += 3) {
    const r = [e[n], e[n + 1], e[n + 2]];
    r.every(Number.isFinite) && t.push(r);
  }
  return t;
}
function pn(e, t) {
  if (t.length < 3) return t;
  const n = qe.get(e);
  if (n?.count === t.length) return n.points;
  const c = new Kt(t.map((w) => new $(...w)), !1, "centripetal").getPoints((t.length - 1) * pt).map((w) => [w.x, w.y, w.z]);
  return qe.set(e, { count: t.length, points: c }), c;
}
function hn(e, t, n) {
  const r = Ue.get(e);
  if (r?.count === t && r.offset === n) return r.colors;
  const c = [];
  for (let w = 0; w < t; w += 1)
    Y.setHSL((w + n) * dn % 1, 1, 0.6), c.push([Y.r, Y.g, Y.b]);
  return Ue.set(e, { count: t, offset: n, colors: c }), c;
}
function mn(e) {
  if (qe.size > e.size * 2 + 16)
    for (const t of qe.keys()) e.has(t) || qe.delete(t);
  if (Ue.size > e.size * 2 + 16)
    for (const t of Ue.keys()) e.has(t) || Ue.delete(t);
}
function gn(e) {
  const t = Ft(e.pts);
  if (t.length < 2) return null;
  const n = new Float32Array(t.length * 2 * 3), r = e.color === ge ? new Float32Array(t.length * 2 * 3) : void 0, c = new Uint32Array((t.length - 1) * 6), w = new k(), u = new $(), v = new $(), d = new $(0, 1, 0), x = Math.max(4e-3, Math.min(0.12, e.size ?? mt));
  for (let g = 0; g < t.length; g += 1) {
    const p = new $(...t[g]), m = g * 4, S = e.orientations;
    if (S && m + 3 < S.length && S.slice(m, m + 4).every(Number.isFinite))
      w.set(S[m], S[m + 1], S[m + 2], S[m + 3]).normalize(), u.set(1, 0, 0).applyQuaternion(w);
    else {
      const N = t[Math.max(0, g - 1)], T = t[Math.min(t.length - 1, g + 1)];
      v.set(T[0] - N[0], T[1] - N[1], T[2] - N[2]).normalize(), u.crossVectors(v, d), u.lengthSq() < 1e-5 && u.set(1, 0, 0);
    }
    u.normalize();
    const a = Math.max(0, Math.min(1, e.pressures?.[g] ?? 0.7)), O = x * (0.15 + a * 1.25) * 0.5, h = p.clone().addScaledVector(u, -O), P = p.clone().addScaledVector(u, O);
    n.set([h.x, h.y, h.z, P.x, P.y, P.z], g * 6), r && (Y.setHSL((e.hueOffset + g) * 0.02 % 1, 1, 0.6), r.set([Y.r, Y.g, Y.b, Y.r, Y.g, Y.b], g * 6));
  }
  for (let g = 0; g < t.length - 1; g += 1) {
    const p = g * 2;
    c.set([p, p + 1, p + 2, p + 1, p + 3, p + 2], g * 6);
  }
  return { positions: n, colors: r, indices: c };
}
function yn({ cacheKey: e, stroke: t }) {
  const n = Ft(t.pts);
  if (n.length < 2) return null;
  const r = pn(e, n);
  return t.color === ge ? /* @__PURE__ */ l(
    yt,
    {
      points: r,
      vertexColors: hn(e, r.length, (t.hueOffset ?? 0) * pt),
      color: "#ffffff",
      lineWidth: 4
    }
  ) : /* @__PURE__ */ l(yt, { points: r, color: t.color, lineWidth: 4 });
}
function wn({ stroke: e, count: t }) {
  const n = it(
    () => gn(e),
    [t, e.brushId, e.color, e.hueOffset, e.size, e]
  ), r = it(() => {
    if (!n) return null;
    const c = new Zt();
    return c.setAttribute("position", new Ze(n.positions, 3)), n.colors && c.setAttribute("color", new Ze(n.colors, 3)), c.setIndex(new Ze(n.indices, 1)), c.computeVertexNormals(), c;
  }, [n]);
  return ue(() => () => r?.dispose(), [r]), r ? /* @__PURE__ */ l("mesh", { geometry: r, children: /* @__PURE__ */ l("meshBasicMaterial", { color: e.color === ge ? "#ffffff" : e.color, vertexColors: !!n?.colors, side: Jt, toneMapped: !1 }) }) : null;
}
const vn = jt(
  ({ cacheKey: e, stroke: t, count: n = t.pts.length }) => {
    const r = e ?? t.sid;
    return (t.brushId ?? ht) === "ribbon" ? /* @__PURE__ */ l(wn, { stroke: t, count: n }) : /* @__PURE__ */ l(yn, { cacheKey: r, stroke: t });
  }
), nt = [
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
], Vt = ["#8e4a5b", "#3f8f6a", "#3f6ba0"], bn = 0.45, Sn = 0.07, In = 0.04, xn = 200, Mn = 3e3;
function Pn(e) {
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
function zn(e) {
  if (!e) return null;
  if (typeof e == "string") return { id: e, hand: "right" };
  const t = e;
  return typeof t.id == "string" ? { id: t.id, hand: t.hand === "left" ? "left" : "right" } : null;
}
function Ot(e) {
  return [e.x, e.y, e.z, e.w].map(
    (t) => Math.round(t * 1e3) / 1e3
  );
}
function Nt(e, t, n) {
  const r = e?.gamepad?.buttons[0]?.value;
  if (typeof r == "number" && Number.isFinite(r) && r > 0)
    return { value: Math.round(Math.max(0.08, Math.min(1, r)) * 1e3) / 1e3, source: "trigger" };
  if (t <= 0 || n <= 0) return { value: 0.7, source: "speed" };
  const c = t / n;
  return { value: Math.round(Math.max(0.2, Math.min(1, 1 - c * 0.45)) * 1e3) / 1e3, source: "speed" };
}
function Xt(e, t, n) {
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
function Lt(e, t, n) {
  return {
    sid: e.sid,
    color: e.color,
    off: t,
    pts: e.pts.slice(t * 3, n * 3),
    hueOffset: e.hueOffset,
    ...Xt(e, t, n)
  };
}
const le = new k(), _t = new $(), rt = new $(), K = new $(), Dt = new $(), qt = new He(), Xe = new $(), An = new k().setFromEuler(new Ht(-Math.PI / 2, 0, 0)), Ie = at.length, Tn = Ie + Vt.length, qn = ({
  position: e = [0, 0, 0],
  rotationY: t = 0,
  syncId: n = "dcpen",
  enableBrushControls: r = !1,
  defaultBrush: c = ht,
  defaultRibbonSize: w = mt,
  onSelectedPenChange: u,
  debugApi: v
}) => {
  const d = n, x = Ce((s) => s.scene), g = Ce((s) => s.gl), { localUser: p } = Gt(), m = p?.id ?? "dev-local", S = b(null);
  S.current || (S.current = new fn());
  const a = S.current, [, O] = Re(0), h = M(() => O((s) => s + 1), []), P = Math.max(0.012, Math.min(0.08, w)), N = r ? c : "line", [T, Z] = Re(0), [I, H] = Re("all"), [_, ye] = Re({
    penIndex: 0,
    value: 0,
    min: 0,
    max: 0,
    source: "speed",
    active: !1
  }), [ee, xe] = Qe(
    `${d}:brush-settings-v1`,
    Array.from({ length: Ie }, () => ({ id: N, size: P }))
  ), ae = b([]);
  ae.current = Array.from({ length: Ie }, (s, y) => {
    const V = Array.isArray(ee) ? ee[y] : void 0;
    return V && (V.id === "line" || V.id === "ribbon") ? { id: V.id, size: Math.max(0.012, Math.min(0.08, V.size || P)) } : { id: N, size: P };
  });
  const U = ae.current[T] ?? { id: N, size: P }, $e = M((s) => {
    s < 0 || s >= Ie || (Z(s), u?.(s));
  }, [u]), te = M((s) => {
    const V = ae.current.map((fe, Se) => Se === T ? { ...fe, ...s } : fe);
    xe(V);
  }, [T, xe]);
  ue(() => u?.(0), [u]);
  const [B, ne] = Qe(`${d}:strokes`, []);
  ue(() => {
    Array.isArray(B) && B.length > 0 && (a.merge(B), h());
  }, [B, a, h]);
  const J = Ee(`${d}:seg`, (s) => {
    a.applySegment(s.sid, s.color, s.off, s.pts, s.hueOffset, s), h();
  }), Oe = Ee(`${d}:end`, (s) => {
    a.markFinished(s.sid), h();
  }), W = Ee(`${d}:undo`, (s) => {
    a.remove(s.sid), h();
  }), we = Ee(`${d}:clear`, () => {
    a.clear(), h();
  }), C = b(null), Me = M(() => {
    C.current !== null && (clearTimeout(C.current), C.current = null), ne(a.finishedStrokes());
  }, [ne, a]), F = M(() => {
    C.current === null && (C.current = setTimeout(() => {
      C.current = null, ne(a.finishedStrokes());
    }, Mn));
  }, [ne, a]);
  ue(
    () => () => {
      C.current !== null && clearTimeout(C.current);
    },
    []
  ), Ee("user-joined", () => {
    C.current !== null && Me();
  });
  const re = b({}), R = M((s, y) => {
    const V = re.current[y] ?? [];
    V.push(s), re.current[y] = V;
  }, []), ve = M(() => {
    const s = re.current[T]?.pop();
    s && (a.remove(s), W({ sid: s }), F(), h());
  }, [a, W, F, h, T]), se = M(() => {
    a.clear(), we({}), Me(), re.current = {}, h();
  }, [a, we, Me, h]), Pe = M(() => {
    for (const s of a.all())
      De(s) === m && (a.remove(s.sid), W({ sid: s.sid }));
    re.current = {}, F(), h();
  }, [h, W, m, F, a]), Ne = M(
    (s) => {
      a.remove(s), W({ sid: s }), F(), h();
    },
    [a, W, F, h]
  ), Ge = M(
    (s) => {
      for (const y of a.all())
        ft(y) === s && De(y) === m && (a.remove(y.sid), W({ sid: y.sid }));
      F(), h();
    },
    [a, W, F, h, m]
  );
  ue(() => {
    v?.({
      undo: ve,
      clear: se,
      strokeCount: () => a.all().length,
      strokeColors: () => a.all().map((s) => s.color),
      inject: (s) => {
        a.merge(s), h();
      }
    });
  }, [v, ve, se, a, h]);
  const D = b({
    left: { down: !1, seq: 0, source: null },
    right: { down: !1, seq: 0, source: null }
  }), be = b({ left: !1, right: !1 }), ze = b({ left: 0, right: 0 }), oe = b({ left: !1, right: !1 }), Ae = b(new Array(Tn).fill(null));
  ue(() => {
    const s = (i, A = null) => {
      const E = performance.now();
      oe.current[i] && E - ze.current[i] < xn && (be.current[i] = !be.current[i]), ze.current[i] = E, D.current[i].down = !0, D.current[i].seq += 1, D.current[i].source = A;
    }, y = (i) => {
      D.current[i].down = !1, D.current[i].source = null;
    }, V = (i) => {
      i.button === 0 && s("right");
    }, fe = (i) => {
      i.button === 0 && y("right");
    };
    window.addEventListener("pointerdown", V), window.addEventListener("pointerup", fe);
    const Se = (i) => i.inputSource.handedness === "left" ? "left" : i.inputSource.handedness === "right" ? "right" : null, de = (i) => {
      const A = Se(i);
      A && s(A, i.inputSource);
    }, We = (i) => {
      const A = Se(i);
      A && y(A);
    };
    let pe = null;
    const o = () => {
      const i = g.xr.getSession();
      !i || i === pe || (pe = i, i.addEventListener("selectstart", de), i.addEventListener("selectend", We));
    }, z = () => {
      pe && (pe.removeEventListener("selectstart", de), pe.removeEventListener("selectend", We), pe = null, D.current.left.down = !1, D.current.right.down = !1, D.current.left.source = null, D.current.right.source = null);
    };
    return g.xr.addEventListener("sessionstart", o), g.xr.addEventListener("sessionend", z), o(), () => {
      window.removeEventListener("pointerdown", V), window.removeEventListener("pointerup", fe), g.xr.removeEventListener("sessionstart", o), g.xr.removeEventListener("sessionend", z), z();
    };
  }, [g]);
  const ke = M(() => {
    for (const s of Ae.current) s?.();
  }, []), Te = a.all(), je = Te.filter((s) => I === "mine" ? De(s) === m : I === "pen" ? ft(s) === T : !0);
  mn(new Set(Te.map((s) => `${d}|${s.sid}`)));
  const G = (s) => (s - (Ie - 1) / 2) * 0.17, Be = (s) => G(Ie - 1) + 0.32 + s * 0.13;
  return /* @__PURE__ */ L("group", { position: e, rotation: [0, t, 0], children: [
    /* @__PURE__ */ L(nn, { grabRadius: bn, children: [
      /* @__PURE__ */ l("pointLight", { position: [0, 1.9, 0.3], intensity: 1.6, distance: 5, color: "#ffd49a" }),
      at.map((s, y) => /* @__PURE__ */ l(
        Ut,
        {
          index: y,
          kind: "pen",
          color: s,
          colorName: nt[y] ?? s,
          slotOffset: [G(y), 1.05, 0],
          syncId: d,
          store: a,
          emitSeg: J,
          emitEnd: Oe,
          persistFinished: F,
          bump: h,
          drawInput: D,
          anyHeldByHand: oe,
          pushUndoSid: R,
          eraserMode: be,
          eraseStroke: Ne,
          putAwayFns: Ae,
          brushSettingsByPen: ae,
          onSelectPen: $e,
          onPressureTelemetry: ye
        },
        s
      )),
      Vt.map((s, y) => /* @__PURE__ */ l(
        Ut,
        {
          index: Ie + y,
          kind: "eraser",
          color: s,
          colorName: "消しゴム",
          slotOffset: [Be(y), 1.15, 0],
          syncId: d,
          store: a,
          emitSeg: J,
          emitEnd: Oe,
          persistFinished: F,
          bump: h,
          drawInput: D,
          anyHeldByHand: oe,
          pushUndoSid: R,
          eraserMode: be,
          eraseStroke: Ne,
          putAwayFns: Ae,
          brushSettingsByPen: ae,
          onSelectPen: $e,
          onPressureTelemetry: ye
        },
        s
      )),
      at.map((s, y) => /* @__PURE__ */ L("group", { children: [
        /* @__PURE__ */ l(
          Q,
          {
            id: `${d}-respawn-${y}`,
            position: [G(y), 1.62, 0],
            size: [0.09, 0.07, 0.02],
            color: "#37474f",
            label: "Respawn",
            fontSize: 0.015,
            interactionText: `${nt[y]}のペンを片づける`,
            onInteract: () => Ae.current[y]?.(),
            children: /* @__PURE__ */ L("mesh", { position: [0, -0.05, 0], children: [
              /* @__PURE__ */ l("boxGeometry", { args: [0.1, 0.016, 0.02] }),
              /* @__PURE__ */ l(
                "meshStandardMaterial",
                {
                  color: s === ge ? "#ffffff" : s,
                  emissive: s === ge ? "#ffffff" : s,
                  emissiveIntensity: 0.5
                }
              )
            ] })
          }
        ),
        /* @__PURE__ */ l(
          Q,
          {
            id: `${d}-clearcolor-${y}`,
            position: [G(y), 0.62, 0],
            size: [0.09, 0.07, 0.02],
            color: "#4a3b57",
            label: "Clear",
            fontSize: 0.017,
            interactionText: `${nt[y]}のペンで自分が描いた線を消す`,
            onInteract: () => {
              $e(y), Ge(y);
            }
          }
        )
      ] }, `ui-${s}`)),
      /* @__PURE__ */ l(
        Q,
        {
          id: `${d}-undo`,
          position: [G(0) - 0.35, 1.45, 0],
          color: "#8a6d00",
          label: "Undo",
          interactionText: "1本戻す（自分の線）",
          onInteract: ve
        }
      ),
      /* @__PURE__ */ l(
        Q,
        {
          id: `${d}-clear`,
          position: [G(0) - 0.35, 1.2, 0],
          color: "#8a0015",
          label: "Clear Mine",
          fontSize: 0.019,
          interactionText: "自分が描いた線だけをぜんぶ消す",
          onInteract: Pe
        }
      ),
      /* @__PURE__ */ l(
        Q,
        {
          id: `${d}-reset`,
          position: [G(0) - 0.35, 0.95, 0],
          color: "#1d4f9e",
          label: "All Reset",
          fontSize: 0.019,
          interactionText: "ペンと消しゴムをぜんぶ片づける",
          onInteract: ke
        }
      ),
      r ? /* @__PURE__ */ L("group", { children: [
        /* @__PURE__ */ l(_e, { position: [0.15, 1.92, 0.01], fontSize: 0.05, color: "#172033", anchorX: "center", children: "BRUSH LAB" }),
        /* @__PURE__ */ l(
          Q,
          {
            id: `${d}-brush-line`,
            position: [-0.34, 1.78, 0],
            size: [0.3, 0.12, 0.035],
            color: U.id === "line" ? "#0f766e" : "#475569",
            label: "LINE",
            fontSize: 0.035,
            interactionText: "通常のDcPen線に切り替える",
            onInteract: () => te({ id: "line" })
          }
        ),
        /* @__PURE__ */ l(
          Q,
          {
            id: `${d}-brush-ribbon`,
            position: [0.02, 1.78, 0],
            size: [0.36, 0.12, 0.035],
            color: U.id === "ribbon" ? "#c2410c" : "#475569",
            label: "RIBBON",
            fontSize: 0.032,
            interactionText: "筆圧リボン筆に切り替える",
            onInteract: () => te({ id: "ribbon" })
          }
        ),
        /* @__PURE__ */ l(
          Q,
          {
            id: `${d}-brush-thinner`,
            position: [0.35, 1.78, 0],
            size: [0.2, 0.12, 0.035],
            color: "#334155",
            label: "THIN",
            fontSize: 0.027,
            interactionText: "リボン筆を細くする",
            onInteract: () => te({ size: Math.max(0.012, Math.round((U.size - 6e-3) * 1e3) / 1e3) })
          }
        ),
        /* @__PURE__ */ l(
          Q,
          {
            id: `${d}-brush-wider`,
            position: [0.6, 1.78, 0],
            size: [0.2, 0.12, 0.035],
            color: "#334155",
            label: "WIDE",
            fontSize: 0.027,
            interactionText: "リボン筆を太くする",
            onInteract: () => te({ size: Math.min(0.08, Math.round((U.size + 6e-3) * 1e3) / 1e3) })
          }
        ),
        /* @__PURE__ */ l(_e, { position: [0.84, 1.78, 0.02], fontSize: 0.032, color: "#172033", anchorX: "left", children: `P${T + 1} ${Math.round(U.size * 1e3)}mm` }),
        /* @__PURE__ */ l(_e, { position: [-0.72, 2.1, 0.02], fontSize: 0.033, color: "#172033", anchorX: "left", children: `PRESS ${Math.round((_.penIndex === T ? _.value : 0) * 100)}% ${_.source.toUpperCase()}` }),
        /* @__PURE__ */ l(_e, { position: [0.05, 2.1, 0.02], fontSize: 0.028, color: "#9a3412", anchorX: "left", children: _.penIndex === T && !_.active ? `RANGE ${Math.round(_.min * 100)}-${Math.round(_.max * 100)}%` : "DRAW TO TEST" }),
        /* @__PURE__ */ l("group", { position: [-0.7, 2.2, 0.01], children: Array.from({ length: 10 }, (s, y) => /* @__PURE__ */ L("mesh", { position: [y * 0.14, 0, 0], children: [
          /* @__PURE__ */ l("boxGeometry", { args: [0.11, 0.055, 0.025] }),
          /* @__PURE__ */ l(
            "meshStandardMaterial",
            {
              color: y < Math.ceil((_.penIndex === T ? _.value : 0) * 10) ? "#f97316" : "#cbd5e1",
              emissive: y < Math.ceil((_.penIndex === T ? _.value : 0) * 10) ? "#f97316" : "#000000",
              emissiveIntensity: 0.4
            }
          )
        ] }, y)) }),
        /* @__PURE__ */ l(Q, { id: `${d}-view-all`, position: [-0.42, 2.34, 0], size: [0.3, 0.1, 0.03], color: I === "all" ? "#2563eb" : "#64748b", label: "ALL", fontSize: 0.028, interactionText: "全員の線を表示", onInteract: () => H("all") }),
        /* @__PURE__ */ l(Q, { id: `${d}-view-mine`, position: [-0.06, 2.34, 0], size: [0.34, 0.1, 0.03], color: I === "mine" ? "#2563eb" : "#64748b", label: "MINE", fontSize: 0.028, interactionText: "自分の線だけ表示", onInteract: () => H("mine") }),
        /* @__PURE__ */ l(Q, { id: `${d}-view-pen`, position: [0.33, 2.34, 0], size: [0.34, 0.1, 0.03], color: I === "pen" ? "#2563eb" : "#64748b", label: "PEN", fontSize: 0.028, interactionText: "選択中の物理ペンの線だけ表示", onInteract: () => H("pen") })
      ] }) : null
    ] }),
    ct(
      /* @__PURE__ */ l("group", { children: je.map((s) => /* @__PURE__ */ l(vn, { cacheKey: `${d}|${s.sid}`, stroke: s, count: s.pts.length }, s.sid)) }),
      x
    )
  ] });
}, Ut = ({
  index: e,
  kind: t,
  color: n,
  colorName: r,
  slotOffset: c,
  syncId: w,
  store: u,
  emitSeg: v,
  emitEnd: d,
  persistFinished: x,
  bump: g,
  drawInput: p,
  anyHeldByHand: m,
  pushUndoSid: S,
  eraserMode: a,
  eraseStroke: O,
  putAwayFns: h,
  brushSettingsByPen: P,
  onSelectPen: N,
  onPressureTelemetry: T
}) => {
  const Z = w, { localUser: I, getMovement: H, getLocalMovement: _, getAvatarHeight: ye } = Gt(), ee = Ce((o) => o.scene), xe = I?.id ?? "dev-local", ae = I?.displayName || "名前なしユーザー", U = b(xe);
  U.current = xe;
  const [$e, te] = Qe(`${Z}:holder:${e}`, null), [B, ne] = Qe(`${Z}:pose:${e}`, null), J = zn($e), Oe = J !== null && J.id === xe, W = b(null);
  W.current = J;
  const we = b(null);
  we.current = B;
  const C = b(null), Me = b(0), F = b(0), re = b(0), R = b(new $()), ve = b(new $()), se = b(new $()), Pe = b(!1), Ne = b(null), Ge = b(null), D = b(null), be = b(-1), ze = b(null);
  Ee("user-left", (o) => {
    const z = Pn(o);
    z !== null && z === W.current?.id && te(null);
  });
  const oe = M(() => {
    const o = C.current;
    if (!o) return;
    C.current = null;
    const z = u.get(o.sid);
    if (!z || o.count < 2) {
      u.remove(o.sid), T({
        penIndex: e,
        value: o.maxPressure,
        min: o.minPressure,
        max: o.maxPressure,
        source: o.pressureSource,
        active: !1
      }), g();
      return;
    }
    o.sent < o.count && v(Lt(z, o.sent, o.count)), d({ sid: o.sid }), u.markFinished(o.sid), S(o.sid, e), T({
      penIndex: e,
      value: o.maxPressure,
      min: o.minPressure,
      max: o.maxPressure,
      source: o.pressureSource,
      active: !1
    }), x(), g();
  }, [u, v, d, x, S, g, e, T]), Ae = M(
    (o, z) => {
      const i = we.current, A = ze.current;
      i ? (o.set(i.p[0], i.p[1], i.p[2]), z.set(i.q[0], i.q[1], i.q[2], i.q[3])) : A ? (A.getWorldPosition(o), A.getWorldQuaternion(z), t === "pen" && z.multiply(An)) : (o.set(0, 0, 0), z.identity());
    },
    [t]
  ), ke = M(
    (o) => {
      const z = we.current, i = ze.current;
      z ? o.set(z.p[0], z.p[1], z.p[2]) : i ? (i.getWorldPosition(o), t === "pen" && (o.y += 0.17)) : o.set(0, 0, 0);
    },
    [t]
  ), Te = b(null), je = M(() => {
    const o = Te.current;
    o !== null && (Te.current = null, m.current[o] = !1, a.current[o] = !1);
  }, [m, a]), G = sn({
    id: `${Z}-slot-${e}`,
    isFree: () => W.current === null,
    worldPosition: ke,
    worldPose: Ae,
    defaultOffset: {
      position: new $(0, 0, t === "pen" ? -0.08 : -0.03),
      quaternion: new k()
    },
    onGrabStart: (o) => {
      t === "pen" && N(e), te({ id: U.current, hand: o }), Te.current = o, m.current[o] = !0, a.current[o] = !1, be.current = p.current[o].down ? p.current[o].seq : -1;
    },
    onDrop: (o) => {
      oe(), ne(o ? {
        p: [ce(o.position.x), ce(o.position.y), ce(o.position.z)],
        q: [
          Math.round(o.quaternion.x * 1e3) / 1e3,
          Math.round(o.quaternion.y * 1e3) / 1e3,
          Math.round(o.quaternion.z * 1e3) / 1e3,
          Math.round(o.quaternion.w * 1e3) / 1e3
        ]
      } : null), te(null), je();
    }
  }), Be = M(() => {
    G.drop(null);
  }, [G]), s = M(() => {
    W.current === null && ne(null);
  }, [ne]);
  ue(() => (h.current[e] = s, () => {
    h.current[e] = null;
  }), [e, s, h]);
  const y = M(() => {
    for (const o of u.all()) {
      if (De(o) !== U.current) continue;
      let z = !1;
      for (let i = 0; i + 2 < o.pts.length; i += 3) {
        const A = o.pts[i], E = o.pts[i + 1], ie = o.pts[i + 2];
        if (!(A === void 0 || E === void 0 || ie === void 0) && (Xe.set(A, E, ie), Xe.distanceTo(R.current) < Sn)) {
          z = !0;
          break;
        }
      }
      z && O(o.sid);
    }
  }, [u, O]), V = M(() => {
    for (const o of u.all()) {
      if (De(o) !== U.current || ft(o) !== e) continue;
      const z = o.pts;
      let i = !1;
      const A = [];
      let E = [], ie = 0;
      for (let q = 0; q + 2 < z.length; q += 3) {
        const j = z[q], f = z[q + 1], X = z[q + 2];
        j === void 0 || f === void 0 || X === void 0 || (Xe.set(j, f, X), Xe.distanceTo(R.current) < In ? (i = !0, E.length >= 6 && A.push({ pts: E, start: ie }), E = []) : (E.length === 0 && (ie = q / 3), E.push(j, f, X)));
      }
      if (E.length >= 6 && A.push({ pts: E, start: ie }), !i) continue;
      const Fe = o.hueOffset ?? 0;
      O(o.sid);
      for (const q of A) {
        F.current += 1;
        const j = `${U.current}:${e}:${Date.now().toString(36)}:${F.current}`, f = Fe + q.start, X = q.pts.length / 3, he = Xt(o, q.start, q.start + X);
        u.applySegment(j, o.color, 0, q.pts, f, he), u.markFinished(j), v({ sid: j, color: o.color, off: 0, pts: q.pts, hueOffset: f, ...he }), d({ sid: j });
      }
      x(), g();
    }
  }, [u, O, v, d, x, g, e]);
  Ct(({ camera: o, clock: z }) => {
    const i = Ne.current, A = W.current;
    if (A === null) {
      i && (i.visible = !1), C.current && oe(), D.current = null;
      return;
    }
    let E = !1;
    if (K.copy(R.current), A.id === U.current)
      if (G.getAttachedPose(K, le))
        R.current.copy(K), i && i.quaternion.copy(le), E = !0;
      else {
        const f = _();
        f.isInVR && f.vrTracking ? (E = Rt(f, A.hand, R.current), K.copy(R.current), $t(f, A.hand, le) && i && i.quaternion.copy(le)) : (o.getWorldPosition(rt), o.getWorldDirection(_t), R.current.copy(rt).addScaledVector(_t, an), Dt.set(0.17, -0.11, -0.4).applyQuaternion(o.quaternion), K.copy(rt).add(Dt), i && (qt.lookAt(K, R.current, o.up), i.quaternion.setFromRotationMatrix(qt), le.copy(i.quaternion)), E = !0), E && i && G.reportFallbackPose(K, i.quaternion);
      }
    else {
      const f = H(A.id);
      if (f)
        if (D.current = null, f.isInVR && f.vrTracking)
          E = Rt(f, A.hand, R.current), K.copy(R.current), i && $t(f, A.hand, le) && i.quaternion.copy(le);
        else {
          const X = ye?.(A.id)?.eyeHeight ?? 1.3;
          on(f, X, R.current), K.copy(R.current), E = !0;
        }
      else {
        const X = z.elapsedTime;
        D.current === null ? D.current = X : X - D.current > 5 && (D.current = null, te(null));
      }
    }
    i && (i.visible = E, E && i.position.copy(K));
    const ie = t === "pen" && a.current[A.hand], Fe = Ge.current;
    if (Fe && (Fe.visible = A.id === U.current && ie), A.id !== U.current || !E) return;
    const q = p.current[A.hand], j = q.down && q.seq !== be.current;
    if (t === "eraser" || ie) {
      C.current && oe(), Pe.current = !1, j && (t === "eraser" ? y() : V());
      return;
    }
    if (j) {
      let f = C.current;
      if (!f) {
        if (!Pe.current) {
          se.current.copy(R.current), Pe.current = !0;
          return;
        }
        if (R.current.distanceTo(se.current) < ut * 1.5) return;
        F.current += 1;
        const Le = Math.round(z.elapsedTime * 1e3), gt = P.current[e] ?? { id: ht, size: mt }, me = Nt(q.source, 0, 0);
        f = {
          sid: `${U.current}:${e}:${Date.now().toString(36)}:${F.current}`,
          color: n,
          count: 0,
          sent: 0,
          hueOffset: re.current,
          brushId: gt.id,
          size: gt.size,
          startedAt: Le,
          lastSampleAt: Le,
          minPressure: me.value,
          maxPressure: me.value,
          pressureSource: me.source
        }, C.current = f, u.applySegment(
          f.sid,
          f.color,
          0,
          [ce(se.current.x), ce(se.current.y), ce(se.current.z)],
          f.hueOffset,
          {
            brushId: f.brushId,
            size: f.size,
            orientations: Ot(le),
            pressures: [me.value],
            timestamps: [0],
            penIndex: e,
            ownerUserId: U.current,
            ownerDisplayName: ae
          }
        ), T({
          penIndex: e,
          value: me.value,
          min: me.value,
          max: me.value,
          source: me.source,
          active: !0
        }), f.count = 1, re.current += 1, ve.current.copy(se.current);
      }
      if (f.count >= cn) {
        oe();
        return;
      }
      const X = R.current.distanceTo(ve.current);
      if (X < ut) return;
      const he = Math.round(z.elapsedTime * 1e3), Ye = Nt(q.source, X, (he - f.lastSampleAt) / 1e3), Ve = Ye.value;
      if (f.minPressure = Math.min(f.minPressure, Ve), f.maxPressure = Math.max(f.maxPressure, Ve), f.pressureSource = Ye.source, ve.current.copy(R.current), u.applySegment(
        f.sid,
        f.color,
        f.count,
        [ce(R.current.x), ce(R.current.y), ce(R.current.z)],
        f.hueOffset,
        {
          brushId: f.brushId,
          size: f.size,
          orientations: Ot(le),
          pressures: [Ve],
          timestamps: [he - f.startedAt],
          penIndex: e,
          ownerUserId: U.current,
          ownerDisplayName: ae
        }
      ), f.count += 1, f.lastSampleAt = he, he - Me.current >= 100 && (Me.current = he, T({
        penIndex: e,
        value: Ve,
        min: f.minPressure,
        max: f.maxPressure,
        source: Ye.source,
        active: !0
      })), re.current += 1, f.count - f.sent >= un) {
        const Le = u.get(f.sid);
        Le && (v(Lt(Le, f.sent, f.count)), f.sent = f.count);
      }
      g();
    } else
      Pe.current = !1, C.current && oe();
  });
  const fe = B !== null, Se = J === null && !fe, de = t === "pen" ? `${r}のペン` : r, We = J === null ? fe ? `${de}をラックに戻す` : t === "pen" ? `${de}を持つ（VR:グリップで掴む・トリガー2回で消しゴム）` : `${de}を持つ（トリガーで線に当てて消す）` : Oe ? `${de}をラックに戻す` : "だれかが使用中", pe = M(() => {
    t === "pen" && N(e), W.current === null ? we.current ? s() : G.grabViaClick() : G.isHeld && Be();
  }, [G, Be, s, e, t, N]);
  return /* @__PURE__ */ L("group", { position: c, children: [
    /* @__PURE__ */ l("group", { ref: ze }),
    /* @__PURE__ */ L(
      lt,
      {
        id: `${Z}-slot-${e}`,
        onInteract: pe,
        interactionText: We,
        enabled: J === null || Oe,
        children: [
          t === "pen" ? /* @__PURE__ */ l("group", { rotation: [-Math.PI / 2, 0, 0], visible: Se, children: /* @__PURE__ */ l(st, { color: n }) }) : /* @__PURE__ */ l("group", { visible: Se, children: /* @__PURE__ */ l(ot, { color: n }) }),
          /* @__PURE__ */ L("mesh", { position: [0, t === "pen" ? 0.17 : 0, 0], children: [
            /* @__PURE__ */ l("cylinderGeometry", { args: [0.06, 0.06, t === "pen" ? 0.36 : 0.12, 8] }),
            /* @__PURE__ */ l("meshBasicMaterial", { transparent: !0, opacity: 0, depthWrite: !1 })
          ] })
        ]
      }
    ),
    J === null && B !== null && ct(
      /* @__PURE__ */ l(
        "group",
        {
          position: [B.p[0], B.p[1], B.p[2]],
          quaternion: [B.q[0], B.q[1], B.q[2], B.q[3]],
          children: /* @__PURE__ */ L(
            lt,
            {
              id: `${Z}-slot-air-${e}`,
              onInteract: () => {
                t === "pen" && N(e), G.grabViaClick();
              },
              interactionText: `${de}を持つ`,
              children: [
                t === "pen" ? /* @__PURE__ */ l(st, { color: n }) : /* @__PURE__ */ l(ot, { color: n }),
                /* @__PURE__ */ L("mesh", { position: [0, 0, t === "pen" ? 0.17 : 0], children: [
                  /* @__PURE__ */ l("sphereGeometry", { args: [0.08, 8, 8] }),
                  /* @__PURE__ */ l("meshBasicMaterial", { transparent: !0, opacity: 0, depthWrite: !1 })
                ] })
              ]
            }
          )
        }
      ),
      ee
    ),
    ct(
      /* @__PURE__ */ L("group", { ref: Ne, visible: !1, name: `${Z}-held-${e}`, children: [
        t === "pen" ? /* @__PURE__ */ l(st, { color: n }) : /* @__PURE__ */ l(ot, { color: n }),
        t === "pen" && /* @__PURE__ */ L("mesh", { ref: Ge, visible: !1, position: [0, 0, 5e-3], children: [
          /* @__PURE__ */ l("sphereGeometry", { args: [0.02, 12, 12] }),
          /* @__PURE__ */ l("meshStandardMaterial", { color: "#f0f0f0", emissive: "#f0f0f0", emissiveIntensity: 0.6 })
        ] })
      ] }),
      ee
    )
  ] });
}, En = ["#e53935", "#fb8c00", "#fdd835", "#43a047", "#1e88e5", "#8e24aa"], st = ({ color: e }) => {
  const t = e === ge ? "#ffffff" : e;
  return /* @__PURE__ */ L("group", { children: [
    /* @__PURE__ */ L("mesh", { position: [0, 0, 7e-3], rotation: [-Math.PI / 2, 0, 0], children: [
      /* @__PURE__ */ l("coneGeometry", { args: [45e-4, 0.015, 8] }),
      /* @__PURE__ */ l("meshStandardMaterial", { color: t, emissive: t, emissiveIntensity: 1.8 })
    ] }),
    /* @__PURE__ */ L("mesh", { position: [0, 0, 0.031], rotation: [-Math.PI / 2, 0, 0], children: [
      /* @__PURE__ */ l("coneGeometry", { args: [0.013, 0.034, 6] }),
      /* @__PURE__ */ l("meshStandardMaterial", { color: "#d8bb90", roughness: 0.85 })
    ] }),
    e === ge ? En.map((n, r) => /* @__PURE__ */ L("mesh", { position: [0, 0, 0.048 + 0.048 * r + 0.024], rotation: [Math.PI / 2, 0, 0], children: [
      /* @__PURE__ */ l("cylinderGeometry", { args: [0.012, 0.012, 0.048, 6] }),
      /* @__PURE__ */ l("meshStandardMaterial", { color: n, roughness: 0.6 })
    ] }, n)) : /* @__PURE__ */ L("mesh", { position: [0, 0, 0.192], rotation: [Math.PI / 2, 0, 0], children: [
      /* @__PURE__ */ l("cylinderGeometry", { args: [0.012, 0.012, 0.288, 6] }),
      /* @__PURE__ */ l("meshStandardMaterial", { color: e, roughness: 0.6 })
    ] })
  ] });
}, ot = ({ color: e }) => /* @__PURE__ */ L("mesh", { rotation: [Math.PI / 2, 0, 0], children: [
  /* @__PURE__ */ l("cylinderGeometry", { args: [0.05, 0.05, 0.07, 6] }),
  /* @__PURE__ */ l("meshStandardMaterial", { color: e, roughness: 0.5, metalness: 0.1 })
] }), Q = ({
  id: e,
  position: t,
  size: n = [0.12, 0.08, 0.03],
  color: r,
  label: c,
  labelColor: w = "#ffffff",
  fontSize: u = 0.022,
  interactionText: v,
  onInteract: d,
  children: x
}) => /* @__PURE__ */ l(lt, { id: e, onInteract: d, interactionText: v, children: /* @__PURE__ */ L("group", { position: t, children: [
  /* @__PURE__ */ L("mesh", { castShadow: !0, children: [
    /* @__PURE__ */ l("boxGeometry", { args: n }),
    /* @__PURE__ */ l("meshStandardMaterial", { color: r, emissive: r, emissiveIntensity: 0.35 })
  ] }),
  /* @__PURE__ */ l(
    _e,
    {
      position: [0, 0, n[2] / 2 + 2e-3],
      fontSize: u,
      color: w,
      anchorX: "center",
      anchorY: "middle",
      outlineWidth: u * 0.08,
      outlineColor: "#00000088",
      children: c
    }
  ),
  x
] }) });
export {
  Dn as BRUSH_REGISTRY,
  ht as DEFAULT_BRUSH,
  mt as DEFAULT_RIBBON_SIZE,
  qn as DcPen,
  at as PEN_COLORS,
  ge as RAINBOW,
  vn as StrokeRenderer,
  gn as buildRibbonGeometry,
  De as getStrokeOwnerId,
  ft as getStrokePenIndex
};
