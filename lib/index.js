import { jsx as l, jsxs as q } from "react/jsx-runtime";
import { useRef as w, useCallback as I, useEffect as ae, useMemo as ke, createContext as Dt, useState as Ae, useContext as Gt, memo as Bt } from "react";
import { useThree as Re, useFrame as Pt, createPortal as Qe } from "@react-three/fiber";
import { Line as st, Text as Xe } from "@react-three/drei";
import { Vector3 as $, Quaternion as V, Matrix4 as Ee, Euler as zt, Color as Ft, BufferGeometry as Ut, BufferAttribute as He, DoubleSide as Wt, CatmullRomCurve3 as Vt } from "three";
import { useInstanceState as je, useInstanceEvent as ve, useUsers as kt, Interactable as Ye } from "@xrift/world-components";
const ot = new Ee(), it = new Ee(), ct = new Ee(), lt = new Ee(), Qt = new $();
function Rt(t, e, n, r) {
  const i = t.xr;
  if (!i.isPresenting) return !1;
  const g = i.getSession();
  if (!g) return !1;
  const u = i.getFrame(), f = i.getReferenceSpace();
  if (!u || !f) return !1;
  const T = u.getViewerPose(f);
  if (!T) return !1;
  let h = null;
  for (const a of g.inputSources)
    if (a.handedness === e && (a.gripSpace || a.targetRaySpace)) {
      h = a;
      break;
    }
  if (!h) return !1;
  const y = h.gripSpace ?? h.targetRaySpace, o = u.getPose(y, f);
  if (!o) return !1;
  ot.fromArray(Array.from(T.transform.matrix)), it.fromArray(Array.from(o.transform.matrix));
  const p = i.getCamera().matrixWorld;
  return ct.copy(p).multiply(ot.invert()), lt.copy(ct).multiply(it), lt.decompose(n, r, Qt), !0;
}
const Et = Dt(null);
function Xt() {
  const t = Gt(Et);
  if (!t) throw new Error("xrift-grab: useGrabbable must be used within <XRGrabProvider>");
  return t;
}
const ut = ["left", "right"], Ne = new $(), at = new V(), ft = new $();
function jt({ grabRadius: t = 0.45, children: e }) {
  const n = Re((o) => o.gl), r = w(/* @__PURE__ */ new Map()), i = w({ left: null, right: null }), g = w(/* @__PURE__ */ new Set()), u = I((o, p) => {
    r.current.set(o, p);
  }, []), f = I((o) => {
    r.current.delete(o);
    for (const p of ut)
      i.current[p]?.id === o && (i.current[p] = null);
  }, []), T = I(
    (o, p, a, x, O) => {
      const A = r.current.get(o);
      if (!A || !A.isFree()) return;
      const S = i.current[p];
      S && S.id !== o && r.current.get(S.id)?.endHold(), i.current[p] = { id: o, viaGrip: a }, A.beginHold(p, a, x, O);
    },
    []
  ), h = I((o, p) => {
    const a = r.current.get(o);
    for (const x of ut)
      i.current[x]?.id === o && (i.current[x] = null);
    a?.endHold(p);
  }, []);
  ae(() => {
    const o = (S) => S.inputSource.handedness === "left" ? "left" : S.inputSource.handedness === "right" ? "right" : null, p = (S) => {
      const z = o(S);
      if (!z) return;
      const C = i.current[z];
      C === null ? g.current.add(z) : C.viaGrip = !0;
    }, a = (S) => {
      const z = o(S);
      if (!z) return;
      const C = i.current[z];
      C !== null && C.viaGrip && h(C.id);
    };
    let x = null;
    const O = () => {
      const S = n.xr.getSession();
      !S || S === x || (x = S, S.addEventListener("squeezestart", p), S.addEventListener("squeezeend", a));
    }, A = () => {
      x && (x.removeEventListener("squeezestart", p), x.removeEventListener("squeezeend", a), x = null, g.current.clear());
    };
    return n.xr.addEventListener("sessionstart", O), n.xr.addEventListener("sessionend", A), O(), () => {
      n.xr.removeEventListener("sessionstart", O), n.xr.removeEventListener("sessionend", A), A();
    };
  }, [n, h]), Pt(() => {
    if (g.current.size !== 0) {
      for (const o of g.current) {
        if (!Rt(n, o, Ne, at)) continue;
        let p = null, a = t;
        for (const [x, O] of r.current) {
          if (!O.isFree()) continue;
          O.worldPosition(ft);
          const A = ft.distanceTo(Ne);
          A < a && (a = A, p = x);
        }
        p && T(p, o, !0, Ne, at);
      }
      g.current.clear();
    }
  });
  const y = ke(
    () => ({ grabRadius: t, register: u, unregister: f, requestGrab: T, requestDrop: h }),
    [t, u, f, T, h]
  );
  return /* @__PURE__ */ l(Et.Provider, { value: y, children: e });
}
const dt = new $(), ht = new V(), De = new V(), pt = new $(), Ge = new V(), Yt = new V();
function Zt(t) {
  const e = Xt(), n = Re((v) => v.gl), { id: r } = t, i = w(t);
  i.current = t;
  const [g, u] = Ae(!1), [f, T] = Ae(null), h = w(null), y = w(new $()), o = w(new V()), p = w(new $()), a = w(new V()), x = I(() => {
    const v = i.current.isFree;
    return v ? v() : h.current === null;
  }, []), O = I((v) => {
    const D = i.current.worldPosition;
    D ? D(v) : i.current.worldPose(v, Yt);
  }, []), A = I(
    (v, D, G, Z) => {
      if (D && G && Z)
        i.current.worldPose(dt, ht), De.copy(Z).invert(), o.current.copy(De).multiply(ht), y.current.copy(dt).sub(G).applyQuaternion(De);
      else {
        const L = i.current.defaultOffset;
        L ? (y.current.copy(L.position), o.current.copy(L.quaternion)) : (y.current.set(0, 0, 0), o.current.identity());
      }
      h.current = v, u(!0), T(v), i.current.onGrabStart?.(v, D);
    },
    []
  ), S = I((v) => {
    h.current !== null && (h.current = null, u(!1), T(null), v === null ? i.current.onDrop?.(null) : v ? i.current.onDrop?.(v) : i.current.onDrop?.({ position: p.current.clone(), quaternion: a.current.clone() }));
  }, []);
  ae(() => {
    const v = {
      isFree: x,
      worldPosition: O,
      beginHold: A,
      endHold: S
    };
    return e.register(r, v), () => e.unregister(r);
  }, [e, r, x, O, A, S]);
  const z = I(
    (v, D) => {
      const G = h.current;
      return G === null || !Rt(n, G, pt, Ge) ? !1 : (D.copy(Ge).multiply(o.current), v.copy(y.current).applyQuaternion(Ge).add(pt), p.current.copy(v), a.current.copy(D), !0);
    },
    [n]
  ), C = I((v, D) => {
    h.current !== null && (p.current.copy(v), a.current.copy(D));
  }, []), oe = I(
    (v = "right") => {
      e.requestGrab(r, v, !1);
    },
    [e, r]
  );
  return { isHeld: g, heldHand: f, getAttachedPose: z, reportFallbackPose: C, grabViaClick: oe, drop: S };
}
const Ke = new $(0, 1, 0), mt = new V(), gt = new zt();
function yt(t, e, n) {
  const r = t.vrTracking;
  if (!r) return !1;
  const i = e === "right" ? r.rightHand.position : r.leftHand.position;
  return n.set(i.x, i.y, i.z), n.applyAxisAngle(Ke, t.rotation.yaw), n.x += t.position.x, n.y += t.position.y, n.z += t.position.z, !0;
}
function bt(t, e, n) {
  const r = t.vrTracking;
  if (!r) return !1;
  const i = e === "right" ? r.rightHand.rotation : r.leftHand.rotation;
  return n.setFromAxisAngle(Ke, t.rotation.yaw), gt.set(i.x, i.y, i.z, "XYZ"), mt.setFromEuler(gt), n.multiply(mt), !0;
}
function Jt(t, e, n) {
  n.set(0.15, 0, -0.35), n.applyAxisAngle(Ke, t.rotation.yaw), n.x += t.position.x, n.y += t.position.y + e * 0.55, n.z += t.position.z;
}
const Ze = 0.01, et = 4, Kt = 2e3, en = 2e4, tn = 4, nn = 1.2, Tt = "line", Ot = 0.035, fe = "rainbow", Je = [
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
  fe
];
function ne(t) {
  return Math.round(t * 1e3) / 1e3;
}
class rn {
  strokes = /* @__PURE__ */ new Map();
  /** 描画完了したストロークのsid（到着順） */
  finishedOrder = [];
  finished = /* @__PURE__ */ new Set();
  /** 変更通知用の世代カウンタ（Reactの再描画トリガ） */
  version = 0;
  get(e) {
    return this.strokes.get(e);
  }
  all() {
    return [...this.strokes.values()];
  }
  finishedStrokes() {
    return this.finishedOrder.map((e) => this.strokes.get(e)).filter((e) => e !== void 0);
  }
  /** 増分書き込み（自エコー・重複到着に冪等）。旧lineイベントも受理する */
  applySegment(e, n, r, i, g = 0, u = {}) {
    let f = this.strokes.get(e);
    f || (f = {
      sid: e,
      color: n,
      pts: [],
      hueOffset: g,
      brushId: u.brushId,
      size: u.size,
      orientations: u.orientations ? [] : void 0,
      pressures: u.pressures ? [] : void 0,
      timestamps: u.timestamps ? [] : void 0
    }, this.strokes.set(e, f)), u.brushId !== void 0 && (f.brushId = u.brushId), u.size !== void 0 && (f.size = u.size);
    const T = r * 3;
    for (let h = 0; h < i.length; h++)
      f.pts[T + h] = i[h];
    Be(f, "orientations", r * 4, u.orientations), Be(f, "pressures", r, u.pressures), Be(f, "timestamps", r, u.timestamps), this.version++;
  }
  markFinished(e) {
    this.finished.has(e) || this.strokes.has(e) && (this.finished.add(e), this.finishedOrder.push(e), this.trim(), this.version++);
  }
  /** 完成形ストロークの一括投入（late join時のinstance stateマージ） */
  merge(e) {
    let n = !1;
    for (const r of e)
      this.strokes.has(r.sid) || (this.strokes.set(r.sid, {
        sid: r.sid,
        color: r.color,
        pts: [...r.pts],
        hueOffset: r.hueOffset ?? 0,
        brushId: r.brushId,
        size: r.size,
        orientations: r.orientations ? [...r.orientations] : void 0,
        pressures: r.pressures ? [...r.pressures] : void 0,
        timestamps: r.timestamps ? [...r.timestamps] : void 0
      }), this.finished.add(r.sid), this.finishedOrder.push(r.sid), n = !0);
    n && (this.trim(), this.version++);
  }
  remove(e) {
    this.strokes.delete(e) && (this.finished.delete(e), this.finishedOrder = this.finishedOrder.filter((n) => n !== e), this.version++);
  }
  clear() {
    this.strokes.size !== 0 && (this.strokes.clear(), this.finished.clear(), this.finishedOrder = [], this.version++);
  }
  /** 合計点数が予算を超えたら古い完成ストロークから捨てる */
  trim() {
    let e = 0;
    for (const n of this.strokes.values()) e += n.pts.length / 3;
    for (; e > en && this.finishedOrder.length > 0; ) {
      const n = this.finishedOrder[0], r = this.strokes.get(n);
      e -= r ? r.pts.length / 3 : 0, this.remove(n);
    }
  }
}
function Be(t, e, n, r) {
  if (!r) return;
  const i = t[e] ?? [];
  for (let g = 0; g < r.length; g += 1) i[n + g] = r[g];
  t[e] = i;
}
const En = [
  { id: "line", label: "LINE", description: "DcPen互換の均一な線" },
  { id: "ribbon", label: "RIBBON", description: "向きと筆圧で幅が変わる平筆" }
], sn = 0.02 * (Ze / 0.015 / et), Pe = /* @__PURE__ */ new Map(), ze = /* @__PURE__ */ new Map(), X = new Ft();
function $t(t) {
  const e = [];
  for (let n = 0; n + 2 < t.length; n += 3) {
    const r = [t[n], t[n + 1], t[n + 2]];
    r.every(Number.isFinite) && e.push(r);
  }
  return e;
}
function on(t, e) {
  if (e.length < 3) return e;
  const n = Pe.get(t);
  if (n?.count === e.length) return n.points;
  const i = new Vt(e.map((g) => new $(...g)), !1, "centripetal").getPoints((e.length - 1) * et).map((g) => [g.x, g.y, g.z]);
  return Pe.set(t, { count: e.length, points: i }), i;
}
function cn(t, e, n) {
  const r = ze.get(t);
  if (r?.count === e && r.offset === n) return r.colors;
  const i = [];
  for (let g = 0; g < e; g += 1)
    X.setHSL((g + n) * sn % 1, 1, 0.6), i.push([X.r, X.g, X.b]);
  return ze.set(t, { count: e, offset: n, colors: i }), i;
}
function ln(t) {
  if (Pe.size > t.size * 2 + 16)
    for (const e of Pe.keys()) t.has(e) || Pe.delete(e);
  if (ze.size > t.size * 2 + 16)
    for (const e of ze.keys()) t.has(e) || ze.delete(e);
}
function un(t) {
  const e = $t(t.pts);
  if (e.length < 2) return null;
  const n = new Float32Array(e.length * 2 * 3), r = t.color === fe ? new Float32Array(e.length * 2 * 3) : void 0, i = new Uint32Array((e.length - 1) * 6), g = new V(), u = new $(), f = new $(), T = new $(0, 1, 0), h = Math.max(4e-3, Math.min(0.12, t.size ?? Ot));
  for (let y = 0; y < e.length; y += 1) {
    const o = new $(...e[y]), p = y * 4, a = t.orientations;
    if (a && p + 3 < a.length && a.slice(p, p + 4).every(Number.isFinite))
      g.set(a[p], a[p + 1], a[p + 2], a[p + 3]).normalize(), u.set(1, 0, 0).applyQuaternion(g);
    else {
      const z = e[Math.max(0, y - 1)], C = e[Math.min(e.length - 1, y + 1)];
      f.set(C[0] - z[0], C[1] - z[1], C[2] - z[2]).normalize(), u.crossVectors(f, T), u.lengthSq() < 1e-5 && u.set(1, 0, 0);
    }
    u.normalize();
    const x = Math.max(0, Math.min(1, t.pressures?.[y] ?? 0.7)), O = h * (0.25 + x * 0.75) * 0.5, A = o.clone().addScaledVector(u, -O), S = o.clone().addScaledVector(u, O);
    n.set([A.x, A.y, A.z, S.x, S.y, S.z], y * 6), r && (X.setHSL((t.hueOffset + y) * 0.02 % 1, 1, 0.6), r.set([X.r, X.g, X.b, X.r, X.g, X.b], y * 6));
  }
  for (let y = 0; y < e.length - 1; y += 1) {
    const o = y * 2;
    i.set([o, o + 1, o + 2, o + 1, o + 3, o + 2], y * 6);
  }
  return { positions: n, colors: r, indices: i };
}
function an({ cacheKey: t, stroke: e }) {
  const n = $t(e.pts);
  if (n.length < 2) return null;
  const r = on(t, n);
  return e.color === fe ? /* @__PURE__ */ l(
    st,
    {
      points: r,
      vertexColors: cn(t, r.length, (e.hueOffset ?? 0) * et),
      color: "#ffffff",
      lineWidth: 4
    }
  ) : /* @__PURE__ */ l(st, { points: r, color: e.color, lineWidth: 4 });
}
function fn({ stroke: t, count: e }) {
  const n = ke(
    () => un(t),
    [e, t.brushId, t.color, t.hueOffset, t.size, t]
  ), r = ke(() => {
    if (!n) return null;
    const i = new Ut();
    return i.setAttribute("position", new He(n.positions, 3)), n.colors && i.setAttribute("color", new He(n.colors, 3)), i.setIndex(new He(n.indices, 1)), i.computeVertexNormals(), i;
  }, [n]);
  return ae(() => () => r?.dispose(), [r]), r ? /* @__PURE__ */ l("mesh", { geometry: r, children: /* @__PURE__ */ l("meshBasicMaterial", { color: t.color === fe ? "#ffffff" : t.color, vertexColors: !!n?.colors, side: Wt, toneMapped: !1 }) }) : null;
}
const dn = Bt(
  ({ cacheKey: t, stroke: e, count: n = e.pts.length }) => {
    const r = t ?? e.sid;
    return (e.brushId ?? Tt) === "ribbon" ? /* @__PURE__ */ l(fn, { stroke: e, count: n }) : /* @__PURE__ */ l(an, { cacheKey: r, stroke: e });
  }
), Fe = [
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
], Lt = ["#8e4a5b", "#3f8f6a", "#3f6ba0"], hn = 0.45, pn = 0.07, mn = 0.04, gn = 200, yn = 3e3;
function bn(t) {
  if (typeof t == "string") return t;
  if (t && typeof t == "object") {
    const e = t;
    for (const n of ["id", "socketId", "userId"]) {
      const r = e[n];
      if (typeof r == "string") return r;
    }
  }
  return null;
}
function wn(t) {
  if (!t) return null;
  if (typeof t == "string") return { id: t, hand: "right" };
  const e = t;
  return typeof e.id == "string" ? { id: e.id, hand: e.hand === "left" ? "left" : "right" } : null;
}
function wt(t) {
  return [t.x, t.y, t.z, t.w].map(
    (e) => Math.round(e * 1e3) / 1e3
  );
}
function St(t, e, n) {
  const r = t?.gamepad?.buttons[0]?.value;
  if (typeof r == "number" && Number.isFinite(r) && r > 0)
    return Math.round(Math.max(0.08, Math.min(1, r)) * 1e3) / 1e3;
  if (e <= 0 || n <= 0) return 0.7;
  const i = e / n;
  return Math.round(Math.max(0.2, Math.min(1, 1 - i * 0.45)) * 1e3) / 1e3;
}
function _t(t, e, n) {
  return {
    brushId: t.brushId,
    size: t.size,
    orientations: t.orientations?.slice(e * 4, n * 4),
    pressures: t.pressures?.slice(e, n),
    timestamps: t.timestamps?.slice(e, n)
  };
}
function vt(t, e, n) {
  return {
    sid: t.sid,
    color: t.color,
    off: e,
    pts: t.pts.slice(e * 3, n * 3),
    hueOffset: t.hueOffset,
    ..._t(t, e, n)
  };
}
const re = new V(), It = new $(), Ue = new $(), Y = new $(), xt = new $(), Mt = new Ee(), qe = new $(), Sn = new V().setFromEuler(new zt(-Math.PI / 2, 0, 0)), Ce = Je.length, vn = Ce + Lt.length, Tn = ({
  position: t = [0, 0, 0],
  rotationY: e = 0,
  syncId: n = "dcpen",
  enableBrushControls: r = !1,
  defaultBrush: i = Tt,
  defaultRibbonSize: g = Ot,
  debugApi: u
}) => {
  const f = n, T = Re((s) => s.scene), h = Re((s) => s.gl), y = w(null);
  y.current || (y.current = new rn());
  const o = y.current, [, p] = Ae(0), a = I(() => p((s) => s + 1), []), [x, O] = Ae(r ? i : "line"), [A, S] = Ae(() => Math.max(0.012, Math.min(0.08, g))), z = w({ id: x, size: A });
  z.current = { id: x, size: A };
  const [C, oe] = je(`${f}:strokes`, []);
  ae(() => {
    Array.isArray(C) && C.length > 0 && (o.merge(C), a());
  }, [C, o, a]);
  const v = ve(`${f}:seg`, (s) => {
    o.applySegment(s.sid, s.color, s.off, s.pts, s.hueOffset, s), a();
  }), D = ve(`${f}:end`, (s) => {
    o.markFinished(s.sid), a();
  }), G = ve(`${f}:undo`, (s) => {
    o.remove(s.sid), a();
  }), Z = ve(`${f}:clear`, () => {
    o.clear(), a();
  }), L = w(null), Ie = I(() => {
    L.current !== null && (clearTimeout(L.current), L.current = null), oe(o.finishedStrokes());
  }, [oe, o]), F = I(() => {
    L.current === null && (L.current = setTimeout(() => {
      L.current = null, oe(o.finishedStrokes());
    }, yn));
  }, [oe, o]);
  ae(
    () => () => {
      L.current !== null && clearTimeout(L.current);
    },
    []
  ), ve("user-joined", () => {
    L.current !== null && Ie();
  });
  const B = w([]), de = I((s) => {
    B.current.push(s);
  }, []), k = I(() => {
    const s = B.current.pop();
    s && (o.remove(s), G({ sid: s }), F(), a());
  }, [o, G, F, a]), pe = I(() => {
    o.clear(), Z({}), Ie(), B.current = [], a();
  }, [o, Z, Ie, a]), J = I(
    (s) => {
      o.remove(s), G({ sid: s }), F(), a();
    },
    [o, G, F, a]
  ), me = I(
    (s) => {
      for (const P of o.all())
        P.color === s && (o.remove(P.sid), G({ sid: P.sid }));
      F(), a();
    },
    [o, G, F, a]
  );
  ae(() => {
    u?.({
      undo: k,
      clear: pe,
      strokeCount: () => o.all().length,
      strokeColors: () => o.all().map((s) => s.color),
      inject: (s) => {
        o.merge(s), a();
      }
    });
  }, [u, k, pe, o, a]);
  const H = w({
    left: { down: !1, seq: 0, source: null },
    right: { down: !1, seq: 0, source: null }
  }), K = w({ left: !1, right: !1 }), ge = w({ left: 0, right: 0 }), R = w({ left: !1, right: !1 }), ie = w(new Array(vn).fill(null));
  ae(() => {
    const s = (b, ee = null) => {
      const Le = performance.now();
      R.current[b] && Le - ge.current[b] < gn && (K.current[b] = !K.current[b]), ge.current[b] = Le, H.current[b].down = !0, H.current[b].seq += 1, H.current[b].source = ee;
    }, P = (b) => {
      H.current[b].down = !1, H.current[b].source = null;
    }, ye = (b) => {
      b.button === 0 && s("right");
    }, le = (b) => {
      b.button === 0 && P("right");
    };
    window.addEventListener("pointerdown", ye), window.addEventListener("pointerup", le);
    const Oe = (b) => b.inputSource.handedness === "left" ? "left" : b.inputSource.handedness === "right" ? "right" : null, $e = (b) => {
      const ee = Oe(b);
      ee && s(ee, b.inputSource);
    }, be = (b) => {
      const ee = Oe(b);
      ee && P(ee);
    };
    let ue = null;
    const W = () => {
      const b = h.xr.getSession();
      !b || b === ue || (ue = b, b.addEventListener("selectstart", $e), b.addEventListener("selectend", be));
    }, we = () => {
      ue && (ue.removeEventListener("selectstart", $e), ue.removeEventListener("selectend", be), ue = null, H.current.left.down = !1, H.current.right.down = !1, H.current.left.source = null, H.current.right.source = null);
    };
    return h.xr.addEventListener("sessionstart", W), h.xr.addEventListener("sessionend", we), W(), () => {
      window.removeEventListener("pointerdown", ye), window.removeEventListener("pointerup", le), h.xr.removeEventListener("sessionstart", W), h.xr.removeEventListener("sessionend", we), we();
    };
  }, [h]);
  const ce = I(() => {
    for (const s of ie.current) s?.();
  }, []), he = o.all();
  ln(new Set(he.map((s) => `${f}|${s.sid}`)));
  const j = (s) => (s - (Ce - 1) / 2) * 0.17, Te = (s) => j(Ce - 1) + 0.32 + s * 0.13;
  return /* @__PURE__ */ q("group", { position: t, rotation: [0, e, 0], children: [
    /* @__PURE__ */ q(jt, { grabRadius: hn, children: [
      /* @__PURE__ */ l("pointLight", { position: [0, 1.9, 0.3], intensity: 1.6, distance: 5, color: "#ffd49a" }),
      Je.map((s, P) => /* @__PURE__ */ l(
        At,
        {
          index: P,
          kind: "pen",
          color: s,
          colorName: Fe[P] ?? s,
          slotOffset: [j(P), 1.05, 0],
          syncId: f,
          store: o,
          emitSeg: v,
          emitEnd: D,
          persistFinished: F,
          bump: a,
          drawInput: H,
          anyHeldByHand: R,
          pushUndoSid: de,
          eraserMode: K,
          eraseStroke: J,
          putAwayFns: ie,
          brushSettings: z
        },
        s
      )),
      Lt.map((s, P) => /* @__PURE__ */ l(
        At,
        {
          index: Ce + P,
          kind: "eraser",
          color: s,
          colorName: "消しゴム",
          slotOffset: [Te(P), 1.15, 0],
          syncId: f,
          store: o,
          emitSeg: v,
          emitEnd: D,
          persistFinished: F,
          bump: a,
          drawInput: H,
          anyHeldByHand: R,
          pushUndoSid: de,
          eraserMode: K,
          eraseStroke: J,
          putAwayFns: ie,
          brushSettings: z
        },
        s
      )),
      Je.map((s, P) => /* @__PURE__ */ q("group", { children: [
        /* @__PURE__ */ l(
          se,
          {
            id: `${f}-respawn-${P}`,
            position: [j(P), 1.62, 0],
            size: [0.09, 0.07, 0.02],
            color: "#37474f",
            label: "Respawn",
            fontSize: 0.015,
            interactionText: `${Fe[P]}のペンを片づける`,
            onInteract: () => ie.current[P]?.(),
            children: /* @__PURE__ */ q("mesh", { position: [0, -0.05, 0], children: [
              /* @__PURE__ */ l("boxGeometry", { args: [0.1, 0.016, 0.02] }),
              /* @__PURE__ */ l(
                "meshStandardMaterial",
                {
                  color: s === fe ? "#ffffff" : s,
                  emissive: s === fe ? "#ffffff" : s,
                  emissiveIntensity: 0.5
                }
              )
            ] })
          }
        ),
        /* @__PURE__ */ l(
          se,
          {
            id: `${f}-clearcolor-${P}`,
            position: [j(P), 0.62, 0],
            size: [0.09, 0.07, 0.02],
            color: "#4a3b57",
            label: "Clear",
            fontSize: 0.017,
            interactionText: `${Fe[P]}の線をぜんぶ消す`,
            onInteract: () => me(s)
          }
        )
      ] }, `ui-${s}`)),
      /* @__PURE__ */ l(
        se,
        {
          id: `${f}-undo`,
          position: [j(0) - 0.35, 1.45, 0],
          color: "#8a6d00",
          label: "Undo",
          interactionText: "1本戻す（自分の線）",
          onInteract: k
        }
      ),
      /* @__PURE__ */ l(
        se,
        {
          id: `${f}-clear`,
          position: [j(0) - 0.35, 1.2, 0],
          color: "#8a0015",
          label: "Clear All",
          fontSize: 0.019,
          interactionText: "線をぜんぶ消す",
          onInteract: pe
        }
      ),
      /* @__PURE__ */ l(
        se,
        {
          id: `${f}-reset`,
          position: [j(0) - 0.35, 0.95, 0],
          color: "#1d4f9e",
          label: "All Reset",
          fontSize: 0.019,
          interactionText: "ペンと消しゴムをぜんぶ片づける",
          onInteract: ce
        }
      ),
      r ? /* @__PURE__ */ q("group", { children: [
        /* @__PURE__ */ l(Xe, { position: [0.15, 1.92, 0.01], fontSize: 0.05, color: "#172033", anchorX: "center", children: "BRUSH LAB" }),
        /* @__PURE__ */ l(
          se,
          {
            id: `${f}-brush-line`,
            position: [-0.34, 1.78, 0],
            size: [0.3, 0.12, 0.035],
            color: x === "line" ? "#0f766e" : "#475569",
            label: "LINE",
            fontSize: 0.035,
            interactionText: "通常のDcPen線に切り替える",
            onInteract: () => O("line")
          }
        ),
        /* @__PURE__ */ l(
          se,
          {
            id: `${f}-brush-ribbon`,
            position: [0.02, 1.78, 0],
            size: [0.36, 0.12, 0.035],
            color: x === "ribbon" ? "#c2410c" : "#475569",
            label: "RIBBON",
            fontSize: 0.032,
            interactionText: "筆圧リボン筆に切り替える",
            onInteract: () => O("ribbon")
          }
        ),
        /* @__PURE__ */ l(
          se,
          {
            id: `${f}-brush-thinner`,
            position: [0.35, 1.78, 0],
            size: [0.2, 0.12, 0.035],
            color: "#334155",
            label: "THIN",
            fontSize: 0.027,
            interactionText: "リボン筆を細くする",
            onInteract: () => S((s) => Math.max(0.012, Math.round((s - 6e-3) * 1e3) / 1e3))
          }
        ),
        /* @__PURE__ */ l(
          se,
          {
            id: `${f}-brush-wider`,
            position: [0.6, 1.78, 0],
            size: [0.2, 0.12, 0.035],
            color: "#334155",
            label: "WIDE",
            fontSize: 0.027,
            interactionText: "リボン筆を太くする",
            onInteract: () => S((s) => Math.min(0.08, Math.round((s + 6e-3) * 1e3) / 1e3))
          }
        ),
        /* @__PURE__ */ l(Xe, { position: [0.84, 1.78, 0.02], fontSize: 0.032, color: "#172033", anchorX: "left", children: `${Math.round(A * 1e3)}mm` })
      ] }) : null
    ] }),
    Qe(
      /* @__PURE__ */ l("group", { children: he.map((s) => /* @__PURE__ */ l(dn, { cacheKey: `${f}|${s.sid}`, stroke: s, count: s.pts.length }, s.sid)) }),
      T
    )
  ] });
}, At = ({
  index: t,
  kind: e,
  color: n,
  colorName: r,
  slotOffset: i,
  syncId: g,
  store: u,
  emitSeg: f,
  emitEnd: T,
  persistFinished: h,
  bump: y,
  drawInput: o,
  anyHeldByHand: p,
  pushUndoSid: a,
  eraserMode: x,
  eraseStroke: O,
  putAwayFns: A,
  brushSettings: S
}) => {
  const z = g, { localUser: C, getMovement: oe, getLocalMovement: v, getAvatarHeight: D } = kt(), G = Re((c) => c.scene), Z = C?.id ?? "dev-local", L = w(Z);
  L.current = Z;
  const [Ie, F] = je(`${z}:holder:${t}`, null), [B, de] = je(`${z}:pose:${t}`, null), k = wn(Ie), pe = k !== null && k.id === Z, J = w(null);
  J.current = k;
  const me = w(null);
  me.current = B;
  const H = w(null), K = w(0), ge = w(0), R = w(new $()), ie = w(new $()), ce = w(new $()), he = w(!1), j = w(null), Te = w(null), s = w(null), P = w(-1), ye = w(null);
  ve("user-left", (c) => {
    const M = bn(c);
    M !== null && M === J.current?.id && F(null);
  });
  const le = I(() => {
    const c = H.current;
    if (!c) return;
    H.current = null;
    const M = u.get(c.sid);
    if (!M || c.count < 2) {
      u.remove(c.sid), y();
      return;
    }
    c.sent < c.count && f(vt(M, c.sent, c.count)), T({ sid: c.sid }), u.markFinished(c.sid), a(c.sid), h(), y();
  }, [u, f, T, h, a, y]), Oe = I(
    (c, M) => {
      const m = me.current, E = ye.current;
      m ? (c.set(m.p[0], m.p[1], m.p[2]), M.set(m.q[0], m.q[1], m.q[2], m.q[3])) : E ? (E.getWorldPosition(c), E.getWorldQuaternion(M), e === "pen" && M.multiply(Sn)) : (c.set(0, 0, 0), M.identity());
    },
    [e]
  ), $e = I(
    (c) => {
      const M = me.current, m = ye.current;
      M ? c.set(M.p[0], M.p[1], M.p[2]) : m ? (m.getWorldPosition(c), e === "pen" && (c.y += 0.17)) : c.set(0, 0, 0);
    },
    [e]
  ), be = w(null), ue = I(() => {
    const c = be.current;
    c !== null && (be.current = null, p.current[c] = !1, x.current[c] = !1);
  }, [p, x]), W = Zt({
    id: `${z}-slot-${t}`,
    isFree: () => J.current === null,
    worldPosition: $e,
    worldPose: Oe,
    defaultOffset: {
      position: new $(0, 0, e === "pen" ? -0.08 : -0.03),
      quaternion: new V()
    },
    onGrabStart: (c) => {
      F({ id: L.current, hand: c }), be.current = c, p.current[c] = !0, x.current[c] = !1, P.current = o.current[c].down ? o.current[c].seq : -1;
    },
    onDrop: (c) => {
      le(), de(c ? {
        p: [ne(c.position.x), ne(c.position.y), ne(c.position.z)],
        q: [
          Math.round(c.quaternion.x * 1e3) / 1e3,
          Math.round(c.quaternion.y * 1e3) / 1e3,
          Math.round(c.quaternion.z * 1e3) / 1e3,
          Math.round(c.quaternion.w * 1e3) / 1e3
        ]
      } : null), F(null), ue();
    }
  }), we = I(() => {
    W.drop(null);
  }, [W]), b = I(() => {
    J.current === null && de(null);
  }, [de]);
  ae(() => (A.current[t] = b, () => {
    A.current[t] = null;
  }), [t, b, A]);
  const ee = I(() => {
    for (const c of u.all()) {
      let M = !1;
      for (let m = 0; m + 2 < c.pts.length; m += 3) {
        const E = c.pts[m], _ = c.pts[m + 1], te = c.pts[m + 2];
        if (!(E === void 0 || _ === void 0 || te === void 0) && (qe.set(E, _, te), qe.distanceTo(R.current) < pn)) {
          M = !0;
          break;
        }
      }
      M && O(c.sid);
    }
  }, [u, O]), Le = I(() => {
    for (const c of u.all()) {
      const M = c.pts;
      let m = !1;
      const E = [];
      let _ = [], te = 0;
      for (let N = 0; N + 2 < M.length; N += 3) {
        const Q = M[N], d = M[N + 1], U = M[N + 2];
        Q === void 0 || d === void 0 || U === void 0 || (qe.set(Q, d, U), qe.distanceTo(R.current) < mn ? (m = !0, _.length >= 6 && E.push({ pts: _, start: te }), _ = []) : (_.length === 0 && (te = N / 3), _.push(Q, d, U)));
      }
      if (_.length >= 6 && E.push({ pts: _, start: te }), !m) continue;
      const _e = c.hueOffset ?? 0;
      O(c.sid);
      for (const N of E) {
        K.current += 1;
        const Q = `${L.current}:${t}:${Date.now().toString(36)}:${K.current}`, d = _e + N.start, U = N.pts.length / 3, Se = _t(c, N.start, N.start + U);
        u.applySegment(Q, c.color, 0, N.pts, d, Se), u.markFinished(Q), f({ sid: Q, color: c.color, off: 0, pts: N.pts, hueOffset: d, ...Se }), T({ sid: Q });
      }
      h(), y();
    }
  }, [u, O, f, T, h, y, t]);
  Pt(({ camera: c, clock: M }) => {
    const m = j.current, E = J.current;
    if (E === null) {
      m && (m.visible = !1), H.current && le(), s.current = null;
      return;
    }
    let _ = !1;
    if (Y.copy(R.current), E.id === L.current)
      if (W.getAttachedPose(Y, re))
        R.current.copy(Y), m && m.quaternion.copy(re), _ = !0;
      else {
        const d = v();
        d.isInVR && d.vrTracking ? (_ = yt(d, E.hand, R.current), Y.copy(R.current), bt(d, E.hand, re) && m && m.quaternion.copy(re)) : (c.getWorldPosition(Ue), c.getWorldDirection(It), R.current.copy(Ue).addScaledVector(It, nn), xt.set(0.17, -0.11, -0.4).applyQuaternion(c.quaternion), Y.copy(Ue).add(xt), m && (Mt.lookAt(Y, R.current, c.up), m.quaternion.setFromRotationMatrix(Mt), re.copy(m.quaternion)), _ = !0), _ && m && W.reportFallbackPose(Y, m.quaternion);
      }
    else {
      const d = oe(E.id);
      if (d)
        if (s.current = null, d.isInVR && d.vrTracking)
          _ = yt(d, E.hand, R.current), Y.copy(R.current), m && bt(d, E.hand, re) && m.quaternion.copy(re);
        else {
          const U = D?.(E.id)?.eyeHeight ?? 1.3;
          Jt(d, U, R.current), Y.copy(R.current), _ = !0;
        }
      else {
        const U = M.elapsedTime;
        s.current === null ? s.current = U : U - s.current > 5 && (s.current = null, F(null));
      }
    }
    m && (m.visible = _, _ && m.position.copy(Y));
    const te = e === "pen" && x.current[E.hand], _e = Te.current;
    if (_e && (_e.visible = E.id === L.current && te), E.id !== L.current || !_) return;
    const N = o.current[E.hand], Q = N.down && N.seq !== P.current;
    if (e === "eraser" || te) {
      H.current && le(), he.current = !1, Q && (e === "eraser" ? ee() : Le());
      return;
    }
    if (Q) {
      let d = H.current;
      if (!d) {
        if (!he.current) {
          ce.current.copy(R.current), he.current = !0;
          return;
        }
        if (R.current.distanceTo(ce.current) < Ze * 1.5) return;
        K.current += 1;
        const Me = Math.round(M.elapsedTime * 1e3), rt = S.current;
        d = {
          sid: `${L.current}:${t}:${Date.now().toString(36)}:${K.current}`,
          color: n,
          count: 0,
          sent: 0,
          hueOffset: ge.current,
          brushId: rt.id,
          size: rt.size,
          startedAt: Me,
          lastSampleAt: Me
        }, H.current = d;
        const Nt = St(N.source, 0, 0);
        u.applySegment(
          d.sid,
          d.color,
          0,
          [ne(ce.current.x), ne(ce.current.y), ne(ce.current.z)],
          d.hueOffset,
          {
            brushId: d.brushId,
            size: d.size,
            orientations: wt(re),
            pressures: [Nt],
            timestamps: [0]
          }
        ), d.count = 1, ge.current += 1, ie.current.copy(ce.current);
      }
      if (d.count >= Kt) {
        le();
        return;
      }
      const U = R.current.distanceTo(ie.current);
      if (U < Ze) return;
      const Se = Math.round(M.elapsedTime * 1e3), Ht = St(N.source, U, (Se - d.lastSampleAt) / 1e3);
      if (ie.current.copy(R.current), u.applySegment(
        d.sid,
        d.color,
        d.count,
        [ne(R.current.x), ne(R.current.y), ne(R.current.z)],
        d.hueOffset,
        {
          brushId: d.brushId,
          size: d.size,
          orientations: wt(re),
          pressures: [Ht],
          timestamps: [Se - d.startedAt]
        }
      ), d.count += 1, d.lastSampleAt = Se, ge.current += 1, d.count - d.sent >= tn) {
        const Me = u.get(d.sid);
        Me && (f(vt(Me, d.sent, d.count)), d.sent = d.count);
      }
      y();
    } else
      he.current = !1, H.current && le();
  });
  const tt = B !== null, nt = k === null && !tt, xe = e === "pen" ? `${r}のペン` : r, qt = k === null ? tt ? `${xe}をラックに戻す` : e === "pen" ? `${xe}を持つ（VR:グリップで掴む・トリガー2回で消しゴム）` : `${xe}を持つ（トリガーで線に当てて消す）` : pe ? `${xe}をラックに戻す` : "だれかが使用中", Ct = I(() => {
    J.current === null ? me.current ? b() : W.grabViaClick() : W.isHeld && we();
  }, [W, we, b]);
  return /* @__PURE__ */ q("group", { position: i, children: [
    /* @__PURE__ */ l("group", { ref: ye }),
    /* @__PURE__ */ q(
      Ye,
      {
        id: `${z}-slot-${t}`,
        onInteract: Ct,
        interactionText: qt,
        enabled: k === null || pe,
        children: [
          e === "pen" ? /* @__PURE__ */ l("group", { rotation: [-Math.PI / 2, 0, 0], visible: nt, children: /* @__PURE__ */ l(We, { color: n }) }) : /* @__PURE__ */ l("group", { visible: nt, children: /* @__PURE__ */ l(Ve, { color: n }) }),
          /* @__PURE__ */ q("mesh", { position: [0, e === "pen" ? 0.17 : 0, 0], children: [
            /* @__PURE__ */ l("cylinderGeometry", { args: [0.06, 0.06, e === "pen" ? 0.36 : 0.12, 8] }),
            /* @__PURE__ */ l("meshBasicMaterial", { transparent: !0, opacity: 0, depthWrite: !1 })
          ] })
        ]
      }
    ),
    k === null && B !== null && Qe(
      /* @__PURE__ */ l(
        "group",
        {
          position: [B.p[0], B.p[1], B.p[2]],
          quaternion: [B.q[0], B.q[1], B.q[2], B.q[3]],
          children: /* @__PURE__ */ q(
            Ye,
            {
              id: `${z}-slot-air-${t}`,
              onInteract: () => W.grabViaClick(),
              interactionText: `${xe}を持つ`,
              children: [
                e === "pen" ? /* @__PURE__ */ l(We, { color: n }) : /* @__PURE__ */ l(Ve, { color: n }),
                /* @__PURE__ */ q("mesh", { position: [0, 0, e === "pen" ? 0.17 : 0], children: [
                  /* @__PURE__ */ l("sphereGeometry", { args: [0.08, 8, 8] }),
                  /* @__PURE__ */ l("meshBasicMaterial", { transparent: !0, opacity: 0, depthWrite: !1 })
                ] })
              ]
            }
          )
        }
      ),
      G
    ),
    Qe(
      /* @__PURE__ */ q("group", { ref: j, visible: !1, name: `${z}-held-${t}`, children: [
        e === "pen" ? /* @__PURE__ */ l(We, { color: n }) : /* @__PURE__ */ l(Ve, { color: n }),
        e === "pen" && /* @__PURE__ */ q("mesh", { ref: Te, visible: !1, position: [0, 0, 5e-3], children: [
          /* @__PURE__ */ l("sphereGeometry", { args: [0.02, 12, 12] }),
          /* @__PURE__ */ l("meshStandardMaterial", { color: "#f0f0f0", emissive: "#f0f0f0", emissiveIntensity: 0.6 })
        ] })
      ] }),
      G
    )
  ] });
}, In = ["#e53935", "#fb8c00", "#fdd835", "#43a047", "#1e88e5", "#8e24aa"], We = ({ color: t }) => {
  const e = t === fe ? "#ffffff" : t;
  return /* @__PURE__ */ q("group", { children: [
    /* @__PURE__ */ q("mesh", { position: [0, 0, 7e-3], rotation: [-Math.PI / 2, 0, 0], children: [
      /* @__PURE__ */ l("coneGeometry", { args: [45e-4, 0.015, 8] }),
      /* @__PURE__ */ l("meshStandardMaterial", { color: e, emissive: e, emissiveIntensity: 1.8 })
    ] }),
    /* @__PURE__ */ q("mesh", { position: [0, 0, 0.031], rotation: [-Math.PI / 2, 0, 0], children: [
      /* @__PURE__ */ l("coneGeometry", { args: [0.013, 0.034, 6] }),
      /* @__PURE__ */ l("meshStandardMaterial", { color: "#d8bb90", roughness: 0.85 })
    ] }),
    t === fe ? In.map((n, r) => /* @__PURE__ */ q("mesh", { position: [0, 0, 0.048 + 0.048 * r + 0.024], rotation: [Math.PI / 2, 0, 0], children: [
      /* @__PURE__ */ l("cylinderGeometry", { args: [0.012, 0.012, 0.048, 6] }),
      /* @__PURE__ */ l("meshStandardMaterial", { color: n, roughness: 0.6 })
    ] }, n)) : /* @__PURE__ */ q("mesh", { position: [0, 0, 0.192], rotation: [Math.PI / 2, 0, 0], children: [
      /* @__PURE__ */ l("cylinderGeometry", { args: [0.012, 0.012, 0.288, 6] }),
      /* @__PURE__ */ l("meshStandardMaterial", { color: t, roughness: 0.6 })
    ] })
  ] });
}, Ve = ({ color: t }) => /* @__PURE__ */ q("mesh", { rotation: [Math.PI / 2, 0, 0], children: [
  /* @__PURE__ */ l("cylinderGeometry", { args: [0.05, 0.05, 0.07, 6] }),
  /* @__PURE__ */ l("meshStandardMaterial", { color: t, roughness: 0.5, metalness: 0.1 })
] }), se = ({
  id: t,
  position: e,
  size: n = [0.12, 0.08, 0.03],
  color: r,
  label: i,
  labelColor: g = "#ffffff",
  fontSize: u = 0.022,
  interactionText: f,
  onInteract: T,
  children: h
}) => /* @__PURE__ */ l(Ye, { id: t, onInteract: T, interactionText: f, children: /* @__PURE__ */ q("group", { position: e, children: [
  /* @__PURE__ */ q("mesh", { castShadow: !0, children: [
    /* @__PURE__ */ l("boxGeometry", { args: n }),
    /* @__PURE__ */ l("meshStandardMaterial", { color: r, emissive: r, emissiveIntensity: 0.35 })
  ] }),
  /* @__PURE__ */ l(
    Xe,
    {
      position: [0, 0, n[2] / 2 + 2e-3],
      fontSize: u,
      color: g,
      anchorX: "center",
      anchorY: "middle",
      outlineWidth: u * 0.08,
      outlineColor: "#00000088",
      children: i
    }
  ),
  h
] }) });
export {
  En as BRUSH_REGISTRY,
  Tt as DEFAULT_BRUSH,
  Ot as DEFAULT_RIBBON_SIZE,
  Tn as DcPen,
  Je as PEN_COLORS,
  fe as RAINBOW,
  dn as StrokeRenderer,
  un as buildRibbonGeometry
};
