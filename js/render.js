// 描画。低い解像度の絵を作り、整数倍で引きのばす。床は真上から、物はスプライトスタックで立体に。
import { createFrame, clearFrame, createFx, composite, painterFor, hex } from '../pixelfx/src/core/index.js';
import { drawModel, SQ, TAU } from './stack.js';
import { FXDEF, PALS } from './fxreg.js';
import * as F from './fxmods.js';
import { BIOMES } from './enemies.js';

// 体の形だけ（魔法使いくらいの大きさ）。体に巻きつくエフェクトの土台。色は持たない
export const BODY = (() => {
  const w = 16, h = 30, data = new Uint8Array(w * h), pixels = new Uint32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = (x + 0.5 - w / 2), v = y + 0.5;
    const r = v < 9 ? 4.2 : v < 13 ? 5.5 : 5 + (v - 13) * 0.17;
    if ((v < 9 ? Math.hypot(u, v - 5) < 4.6 : Math.abs(u) < r)) { data[y * w + x] = 1; pixels[y * w + x] = (255 << 24 | 0x6a4a3a) >>> 0; }
  }
  return { mask: { w, h, data }, pixels, x: -w / 2, y: -h, w, h, k: 2, head: [0, -h], chest: [0, -h * 0.66], eyes: [] };
})();
const EMPTY_ACTOR = BODY;
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const rand = (a, b) => a + Math.random() * (b - a);
let seedN = 1;

// ---------- pixelfx のレイヤー ----------
class FxLayer {
  constructor() { this.list = []; }
  resize(w, h) { this.frame = createFrame(w, h); this.img = new ImageData(w, h); this.cv = mk(w, h); this.cx = this.cv.getContext('2d'); }
  clear() { for (const f of this.list) f.stop?.(); this.list = []; }
  add(mod, o = {}, meta = {}) {
    for (const k of Object.keys(o)) if (o[k] === undefined) delete o[k];
    if (mod.meta.actor && !o.actor) o.actor = EMPTY_ACTOR;
    const fx = createFx(mod, { seed: (seedN++ % 997) + 1, ...o });
    fx.follow = meta.follow || null; fx.life = meta.life ?? Infinity; fx.layer = meta.layer || 'front'; fx.prio = meta.prio || 0;
    this.list.push(fx);
    return fx;
  }
  custom(obj) { obj.custom = true; obj.layer = obj.layer || 'front'; this.list.push(obj); return obj; }
  update(dt) {
    for (const f of this.list) {
      f.update(dt);
      if (f.custom) continue;
      if (f.follow) { const p = f.follow(); if (!p) f.stop(); else { f.options.x = p.x; f.options.y = p.y; if (p.angle != null) f.options.angle = p.angle; } }
      f.life -= dt; if (f.life <= 0) f.stop();
    }
    this.list = this.list.filter((f) => !f.done());
    if (this.list.length > 260) this.list.splice(0, this.list.length - 260);
  }
  render(ctx, ox, oy, layer) {
    const f = this.frame; f.ox = ox; f.oy = oy; clearFrame(f);
    let any = false;
    for (const fx of this.list) {
      if (layer && fx.layer !== layer) continue; any = true;
      if (fx.custom) { const p = painterFor(f); p.place(0, 0); p.fade = 1; p.lightK = 1; fx.draw(p); }
      else fx.draw(f);
    }
    if (!any) return false;
    composite(f, this.img.data, null);
    this.cx.putImageData(this.img, 0, 0);
    if (ctx) ctx.drawImage(this.cv, 0, 0);
    return true;
  }
}

// ---------- 自前の小さなエフェクト ----------
function customFx(kind, def, o) {
  const C = (def.col || ['#333', '#888', '#ccc', '#fff']).map(hex);
  let t = 0;
  const obj = { layer: def.layer || 'front', update(dt) { t += dt; }, done: () => obj.dead || (obj.life != null && t > obj.life), stop() { obj.dead = true; }, x: o.x, y: o.y, a: o.angle || 0, life: o.life ?? def.life };
  const trail = [];
  switch (kind) {
    case 'bolt': obj.draw = (p) => {
      trail.unshift([obj.x, obj.y]); if (trail.length > (def.trail || 6)) trail.pop();
      trail.forEach(([x, y], i) => { const k = 1 - i / trail.length; p.dot(x, y, i < 2 ? C[2] : C[1], k); });
      p.circle(obj.x, obj.y, 2, C[2]); p.px(obj.x, obj.y, C[3]); p.glow(obj.x, obj.y, 10, C[1], 0.5);
    }; break;
    case 'crescent': obj.draw = (p) => {
      const ca = Math.cos(obj.a), sa = Math.sin(obj.a);
      for (let k = -4; k <= 4; k++) { const b = k * 0.28, x = obj.x + Math.cos(obj.a + b) * 5 - ca * 3, y = obj.y + Math.sin(obj.a + b) * 5 - sa * 3; p.px(x, y, Math.abs(k) < 2 ? C[3] : C[2]); }
      p.glow(obj.x, obj.y, 8, C[1], 0.4);
    }; break;
    case 'tracer': obj.draw = (p) => { const ca = Math.cos(obj.a), sa = Math.sin(obj.a); p.line(obj.x - ca * 8, obj.y - sa * 8, obj.x, obj.y, (u) => (u > 0.7 ? C[3] : C[1])); p.glow(obj.x, obj.y, 5, C[1], 0.4); }; break;
    case 'ball': obj.draw = (p) => { p.circle(obj.x, obj.y, def.r, C[1]); p.circle(obj.x - 1, obj.y - 1, def.r - 1.5, C[2]); p.px(obj.x - 2, obj.y - 2, C[3]); }; break;
    case 'sword': obj.draw = (p) => {
      const ca = Math.cos(obj.a), sa = Math.sin(obj.a);
      p.line(obj.x - ca * 6, obj.y - sa * 6, obj.x + ca * 6, obj.y + sa * 6, (u) => (u > 0.5 ? C[3] : C[2])); p.line(obj.x - sa * 2 - ca * 3, obj.y + ca * 2 - sa * 3, obj.x + sa * 2 - ca * 3, obj.y - ca * 2 - sa * 3, C[1]);
      p.glowLine(obj.x - ca * 6, obj.y - sa * 6, obj.x + ca * 6, obj.y + sa * 6, 5, C[1], 0.35);
    }; break;
    case 'skull': obj.draw = (p) => { p.circle(obj.x, obj.y, 3, C[2]); p.px(obj.x - 1, obj.y, C[0]); p.px(obj.x + 1, obj.y, C[0]); p.rect(obj.x - 2, obj.y + 2, 4, 2, C[2]); p.glow(obj.x, obj.y, 10, C[1], 0.5); }; break;
    case 'beam': obj.draw = (p) => {
      const k = 1 - t / obj.life, L = o.len || 200, ca = Math.cos(obj.a), sa = Math.sin(obj.a), w = def.w * (0.4 + k * 0.6);
      for (let d = 0; d < L; d += 1) {
        const wob = def.wavy ? Math.sin(d * 0.15 - t * 30) * 2 : 0, x = obj.x + ca * d - sa * wob, y = obj.y + sa * d + ca * wob;
        for (let j = -w; j <= w; j += 1) { const u = Math.abs(j) / (w + 0.01); p.dot(x - sa * j, y + ca * j, u < 0.3 ? C[3] : u < 0.6 ? C[2] : C[1], k * (u < 0.8 ? 1 : 0.6)); }
      }
      p.glowLine(obj.x, obj.y, obj.x + ca * L, obj.y + sa * L, w * 2 + 8, C[1], 0.4 * k);
    }; break;
    case 'web': obj.draw = (p) => { for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; p.line(obj.x, obj.y, obj.x + Math.cos(a) * 18, obj.y + Math.sin(a) * 8, hex('#b8b0c8'), 0.5); } p.ring(obj.x, obj.y, 10, 1, hex('#b8b0c8'), 0.4); }; break;
  }
  return obj;
}

function numberFx(x, y, v, crit, heal, col) {
  let t = 0; const vx = rand(-12, 12), life = crit ? 0.95 : 0.7;
  const c = heal ? hex('#7ee88a') : crit ? hex('#ffd23c') : col === 'burn' ? hex('#ff8a2a') : col === 'poison' ? hex('#a8e04a') : hex('#ffffff');
  const o = hex('#14101e');
  return {
    layer: 'front', update(dt) { t += dt; }, done: () => t > life,
    draw(p) {
      const k = t / life, yy = y - 8 - (1 - (1 - k) ** 3) * (crit ? 20 : 14), xx = x + vx * k;
      const s = '' + (heal ? '+' : '') + v + (crit ? '!' : '');
      const sc = crit && k < 0.12 ? 2 : 1;
      p.text(s, xx, yy, c, { font: crit ? 'big' : 'mini', align: 'center', outline: o, scale: sc, a: k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1 });
    },
  };
}

function chainFx(pts, pal) {
  let t = 0; const C = (PALS[pal] || PALS.electric).map(hex), n = C.length;
  const segs = [];
  for (let i = 0; i < pts.length - 1; i++) segs.push([pts[i], pts[i + 1]]);
  return {
    layer: 'front', update(dt) { t += dt; }, done: () => t > 0.32,
    draw(p) {
      const k = 1 - t / 0.32, seed = Math.floor(t * 30);
      for (const [a, b] of segs) {
        let px = a.x, py = a.y * SQ - 10; const bx = b.x, by = b.y * SQ - 10, L = Math.hypot(bx - px, by - py), st = Math.max(2, Math.round(L / 7));
        const pts2 = [[px, py]];
        for (let i = 1; i < st; i++) { const u = i / st, h = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453; pts2.push([px + (bx - px) * u + ((h - Math.floor(h)) - 0.5) * 8, py + (by - py) * u + (((h * 7) % 1 + 1) % 1 - 0.5) * 8]); }
        pts2.push([bx, by]);
        for (let i = 0; i < pts2.length - 1; i++) { p.line(pts2[i][0], pts2[i][1], pts2[i + 1][0], pts2[i + 1][1], k > 0.5 ? C[n - 1] : C[n - 2], k); }
        p.glowLine(px, py, bx, by, 8, C[n - 3], 0.4 * k);
      }
    },
  };
}

// 龍王：火の鱗の長い体が、うねりながら画面を駆け抜ける
function dragonFx(x0, y0, a, len) {
  let t = 0; const C = PALS.fire.map(hex), ca = Math.cos(a), sa = Math.sin(a), T = 1.3, N = 26;
  return {
    layer: 'front', update(dt) { t += dt; }, done: () => t > T,
    draw(p) {
      const head = t / T * (len + 300) - 60;
      for (let i = N - 1; i >= 0; i--) {
        const d = head - i * 9; if (d < -20) continue;
        const w = Math.sin(d * 0.03 + t * 8) * 14, x = x0 + ca * d - sa * w, y = y0 - 40 + sa * d + ca * w;
        const r = i === 0 ? 7 : Math.max(2, 6 - i * 0.18);
        p.circle(x, y, r, C[3]); p.circle(x - 1, y - 1, r - 1.5, C[5]); p.px(x - 2, y - 2, C[7]);
        if (i % 3 === 0) p.glow(x, y, 14, C[4], 0.25);
        if (i === 0) { p.px(x + ca * 4 - sa * 2, y + sa * 4 + ca * 2 - 2, hex('#ffffff')); for (const s of [-1, 1]) p.line(x - ca * 3, y - 5, x - ca * 10 + s * 4, y - 14, C[6]); }
      }
    },
  };
}

function tracerFx(x, y, a, l) {
  let t = 0; const ca = Math.cos(a), sa = Math.sin(a) * SQ, Y = hex('#ffe066'), W = hex('#ffffff'), d0 = rand(10, 30);
  return { layer: 'front', update(dt) { t += dt; }, done: () => t > 0.09, draw(p) { const u = t / 0.09, d = d0 + u * l; p.line(x + ca * d, y + sa * d, x + ca * (d + 14), y + sa * (d + 14), (v) => (v > 0.6 ? W : Y)); p.glow(x + ca * (d + 14), y + sa * (d + 14), 4, Y, 0.3); } };
}

function arrowFlyFx(x0, y0, x1, y1) {
  let t = 0; const G = hex('#ffe066'), W = hex('#ffffff');
  return { layer: 'front', update(dt) { t += dt; }, done: () => t > 0.2, draw(p) { const u = Math.min(1, t / 0.15), x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u, a = Math.atan2(y1 - y0, x1 - x0); p.line(x - Math.cos(a) * 14, y - Math.sin(a) * 14, x, y, (v) => (v > 0.7 ? W : G)); p.glow(x, y, 8, G, 0.5); } };
}

// ---------- 床 ----------
function hash(x, y, s = 0) { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s + 1, 2246822519); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }

function buildFloor(room) {
  const B = BIOMES[room.biome], P = B.floor, W = room.w, H = Math.ceil(room.h * SQ);
  const c = mk(W + 64, H + 64), g = c.getContext('2d'), O = 32;
  g.fillStyle = '#07060c'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = P.base; g.fillRect(O, O, W, H);
  const T = 16, th = Math.round(T * SQ);
  const seed = room.floor * 31 + room.room;
  for (let ty = 0; ty * th < H; ty++) for (let tx = 0; tx * T < W; tx++) {
    const h = hash(tx, ty, seed), x = O + tx * T, y = O + ty * th;
    if (B.id === 'forest') {
      const n = hash(tx >> 2, ty >> 2, seed + 9) * 0.6 + h * 0.4;
      g.fillStyle = n < 0.4 ? P.base : n < 0.7 ? P.a : P.b; g.fillRect(x, y, T, th);
      for (let k = 0; k < 4; k++) { const hx = hash(tx * 4 + k, ty, seed + 3); if (hx < 0.5) { g.fillStyle = hx < 0.1 ? P.glow : hx < 0.25 ? P.accent : P.line; g.fillRect(x + Math.floor(hx * 97) % T, y + Math.floor(hx * 53) % th, 1, hx < 0.1 ? 1 : 2); } }
      if (h > 0.985) { g.fillStyle = ['#ff8ad8', '#fff27a', '#ffffff'][Math.floor(h * 1000) % 3]; g.fillRect(x + 6, y + 4, 1, 1); g.fillRect(x + 5, y + 5, 3, 1); g.fillRect(x + 6, y + 6, 1, 1); }
      if (h > 0.93 && h < 0.96) { g.fillStyle = '#4a3f52'; g.fillRect(x + 2, y + 2, 10, 6); g.fillStyle = '#5a506a'; g.fillRect(x + 3, y + 2, 8, 2); }
    } else if (B.id === 'city') {
      g.fillStyle = h < 0.5 ? P.a : P.b; g.fillRect(x, y, T, th);
      if (h > 0.9) { g.fillStyle = '#121218'; for (let k = 0; k < 8; k++) g.fillRect(x + k, y + Math.round(Math.sin(k + h * 9) * 2 + th / 2), 1, 1); }
      if (h < 0.05) { g.fillStyle = '#3a3a48'; g.fillRect(x + 3, y + 3, 5, 3); }
    } else if (B.id === 'station') {
      g.fillStyle = (tx + ty) % 2 ? P.a : P.b; g.fillRect(x, y, T, th);
      g.fillStyle = '#0c1020'; g.fillRect(x, y, T, 1); g.fillRect(x, y, 1, th);
      g.fillStyle = '#26305a'; g.fillRect(x + 1, y + 1, T - 1, 1);
      if (h > 0.92) { g.fillStyle = P.line; g.fillRect(x + 4, y + 4, 8, 1); }
      if (h < 0.04) { g.fillStyle = '#0a0e18'; for (let k = 0; k < 4; k++) g.fillRect(x + 3 + k * 3, y + 3, 1, th - 6); }
    } else {
      g.fillStyle = h < 0.5 ? P.a : P.base; g.fillRect(x, y, T, th);
      if (h > 0.95) { g.fillStyle = P.accent; g.fillRect(x + 2, y + 2, 12, 1); }
    }
  }
  // 模様の線
  if (B.id === 'city') { g.fillStyle = P.line; for (let x = O + 10; x < O + W - 10; x += 34) g.fillRect(x, O + Math.round(H / 2), 18, 2); g.fillStyle = '#e8e8f0'; for (let y = O + 20; y < O + H - 20; y += 6) { g.fillRect(O + 40, y, 22, 3); } }
  if (B.id === 'station') { g.fillStyle = 'rgba(59,92,255,0.5)'; g.fillRect(O, O + Math.round(H * 0.3), W, 1); g.fillRect(O, O + Math.round(H * 0.7), W, 1); g.fillRect(O + Math.round(W / 2), O, 1, H); }
  if (B.id === 'void') {
    g.strokeStyle = P.line; g.lineWidth = 1; g.globalAlpha = 0.7;
    for (let k = 0; k < 10; k++) { let x = O + hash(k, 1, seed) * W, y = O + hash(k, 2, seed) * H; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 8; s++) { x += (hash(k, s, seed + 5) - 0.5) * 40; y += (hash(k, s, seed + 6) - 0.5) * 24; g.lineTo(Math.round(x), Math.round(y)); } g.stroke(); }
    g.globalAlpha = 1;
  }
  if (B.id === 'forest') { g.fillStyle = 'rgba(154,216,106,0.06)'; for (let k = 0; k < 6; k++) { g.beginPath(); g.ellipse(O + hash(k, 3, seed) * W, O + hash(k, 4, seed) * H, 40, 18, 0, 0, TAU); g.fill(); } }
  // 縁を暗く
  const gr = g.createRadialGradient(O + W / 2, O + H / 2, Math.min(W, H) * 0.3, O + W / 2, O + H / 2, Math.max(W, H) * 0.75);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.45)'); g.fillStyle = gr; g.fillRect(O, O, W, H);
  return { c, O };
}

// ---------- 本体 ----------
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.low = mk(480, 270); this.lctx = this.low.getContext('2d');
    this.fxBack = new FxLayer(); this.fxFront = new FxLayer();
    this.shotFx = new Map(); this.zoneFx = new Map(); this.exitFx = new Map(); this.pickFx = new Map(); this.statusFx = new Map();
    this.cam = { x: 0, y: 0 }; this.shakeT = 0; this.shakeA = 0; this.flash = null; this.screenFx = []; this.room = null; this.t = 0;
    this.weather = new FxLayer(); this.weatherFx = null; this.view = null; this.trails = new Map();
    this.resize();
  }
  resize() {
    const dpr = 1, W = innerWidth, H = innerHeight;
    this.scale = Math.max(2, Math.round(H / 280));
    if (W / this.scale < 300) this.scale = Math.max(1, Math.floor(W / 300));
    this.W = Math.ceil(W / this.scale); this.H = Math.ceil(H / this.scale);
    this.canvas.width = W * dpr; this.canvas.height = H * dpr; this.canvas.style.width = W + 'px'; this.canvas.style.height = H + 'px';
    this.low.width = this.W; this.low.height = this.H;
    this.fxBack.resize(this.W, this.H); this.fxFront.resize(this.W, this.H);
    this.weather.resize(320, 180);
    const v = mk(this.W, this.H), g = v.getContext('2d'), gr = g.createRadialGradient(this.W / 2, this.H / 2, Math.min(this.W, this.H) * 0.35, this.W / 2, this.H / 2, Math.max(this.W, this.H) * 0.72);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(4,2,10,0.55)'); g.fillStyle = gr; g.fillRect(0, 0, this.W, this.H); this.vign = v;
  }
  /** 画面上の位置（CSS px）。DOM のラベル用 */
  toScreen(x, y) { return { x: (x - this.cam.x + this.shx) * this.scale, y: (y * SQ - this.cam.y + this.shy) * this.scale }; }
  toWorld(sx, sy) { return { x: sx / this.scale + this.cam.x, y: (sy / this.scale + this.cam.y) / SQ }; }

  setRoom(r) {
    this.room = r; this.floor = buildFloor(r);
    this.fxBack.clear(); this.fxFront.clear(); this.shotFx.clear(); this.zoneFx.clear(); this.exitFx.clear(); this.pickFx.clear(); this.statusFx.clear();
    const B = BIOMES[r.biome];
    // 壁
    this.walls = [];
    const step = 16, stepY = 16;
    for (let x = 0; x <= r.w; x += step) { this.walls.push({ x, y: 4 }); this.walls.push({ x, y: r.h + 10 }); }
    for (let y = 4 + stepY; y < r.h + 10; y += stepY) { this.walls.push({ x: 0, y }); this.walls.push({ x: r.w, y }); }
    this.wallModel = B.wall;
    // 天気（画面の上を漂う粒）
    this.ambKind = B.weather; this.amb = [];
    // 森にはかがり火
    this.torches = [];
    if (B.id === 'forest' || B.id === 'void') for (let k = 0; k < 4; k++) { const tx = (k + 0.5) * r.w / 4; this.torches.push(this.fxBack.add(B.id === 'void' ? F.spiritFlame : F.torch, { x: tx, y: Math.round(4 * SQ) - 4 }, { layer: 'back' })); }
    if (B.id === 'station') for (let k = 0; k < 3; k++) { const tx = (k + 0.5) * r.w / 3; this.fxBack.add(F.hologram, { x: tx, y: Math.round(4 * SQ) - 2, palette: PALS.cyber }, { layer: 'back' }); }
  }

  // ---------- イベントから出す ----------
  spawn(k, x, y, o = {}, view) {
    const def = FXDEF[k]; if (!def) return null;
    if (this.fxFront.list.length > 220 && !def.life && (k === 'hitSpark' || k === 'manaPop' || k === 'zap' || k === 'bulletHit')) return null;
    const sx = x, sy = y * SQ;
    let fx;
    const follow = o.follow != null ? () => { const v = this.view; if (!v) return null; const e = v.enemies.find((q) => q.id === o.follow) || v.players.find((q) => q.id === o.follow); return e && !(e.dead && e.hp <= 0) ? { x: e.x, y: e.y * SQ } : null; } : null;
    const layer = def.layer || 'front';
    if (def.custom) {
      fx = customFx(def.custom, def, { x: sx, y: sy - (def.custom === 'beam' ? 10 : 0), angle: o.angle != null ? Math.atan2(Math.sin(o.angle) * SQ, Math.cos(o.angle)) : 0, len: o.len ? o.len * Math.hypot(Math.cos(o.angle || 0), Math.sin(o.angle || 0) * SQ) : 200, life: def.life });
      (layer === 'ground' ? this.fxBack : this.fxFront).custom(fx);
    } else {
      const opts = { ...def.o, x: sx, y: sy };
      if (def.sz) Object.assign(opts, def.sz(o));
      if (o.angle != null) opts.angle = Math.atan2(Math.sin(o.angle) * SQ, Math.cos(o.angle));
      if (o.flip) opts.flip = true;
      if (o.palette) opts.palette = PALS[o.palette];
      if (o.pal && PALS[o.pal]) opts.palette = PALS[o.pal];
      fx = (layer === 'ground' ? this.fxBack : this.fxFront).add(def.m, opts, { follow, life: o.life ?? def.life, layer });
    }
    if (def.extra) for (const e of def.extra) this.spawn(e, x, y, {}, view);
    if (def.then) setTimeout(() => this.spawn(def.then.k, x, y), def.then.at * 1000);
    return fx;
  }

  event(e) {
    switch (e.e) {
      case 'fx': this.spawn(e.k, e.x, e.y, e.o || {}); break;
      case 'num': this.fxFront.custom(numberFx(e.x, e.y * SQ, e.v, e.c, e.heal, e.col)); break;
      case 'chain': this.fxFront.custom(chainFx(e.pts, e.pal)); break;
      case 'tracer': this.fxFront.custom(tracerFx(e.x, e.y * SQ, e.a, e.l)); break;
      case 'arrowFly': this.fxFront.custom(arrowFlyFx(e.x0, e.y0 * SQ, e.x1, e.y1 * SQ)); break;
      case 'dragonFly': this.fxFront.custom(dragonFx(e.x0, e.y0 * SQ, Math.atan2(Math.sin(e.ang) * SQ, Math.cos(e.ang)), e.len)); break;
      case 'screen':
        if (e.k === 'flash') this.flash = { col: e.col, t: e.dur, max: e.dur };
        else if (e.k === 'blizzard') this.overlay = { kind: 'snow', t: e.dur };
        else if (e.k === 'fairies') this.overlay = { kind: 'fairy', t: e.dur };
        else if (e.k === 'timestop') this.grayT = e.dur;
        else if (e.k === 'dark') this.darkT = e.dur;
        break;
    }
  }

  // ---------- 毎コマ ----------
  draw(view, dt, me) {
    this.view = view; this.t += dt;
    const g = this.lctx, W = this.W, H = this.H;
    if (!this.room) { g.fillStyle = '#07060c'; g.fillRect(0, 0, W, H); this.blit(); return; }
    // カメラ
    const p = view.players.find((q) => q.id === me) || view.players[0];
    const rw = view.w, rh = view.h * SQ;
    let fx0 = p ? p.x : rw / 2, fy0 = p ? p.y : view.h / 2;
    if (this.followIds) { const qs = view.players.filter((q) => this.followIds.includes(q.id) && !q.dead); if (qs.length) { fx0 = qs.reduce((a, q) => a + q.x, 0) / qs.length; fy0 = qs.reduce((a, q) => a + q.y, 0) / qs.length; } }
    const boss = view.enemies.find((e) => e.bo);
    if (boss && p) { fx0 += (boss.x - p.x) * 0.3; fy0 += (boss.y - p.y) * 0.3; }
    let tx = fx0 - W / 2, ty = fy0 * SQ - H / 2 - 6;
    if (rw + 40 < W) tx = rw / 2 - W / 2; else tx = Math.max(-24, Math.min(rw - W + 24, tx));
    if (rh + 60 < H) ty = rh / 2 - H / 2 - 10; else ty = Math.max(-46, Math.min(rh - H + 30, ty));
    if (!this.camInit) { this.cam.x = tx; this.cam.y = ty; this.camInit = true; }
    this.cam.x += (tx - this.cam.x) * Math.min(1, dt * 8); this.cam.y += (ty - this.cam.y) * Math.min(1, dt * 8);
    this.shakeA = Math.max(this.shakeA * Math.pow(0.02, dt), view.shake * 3);
    this.shx = Math.round((Math.random() - 0.5) * this.shakeA); this.shy = Math.round((Math.random() - 0.5) * this.shakeA);
    const cx = Math.round(this.cam.x) - this.shx, cy = Math.round(this.cam.y) - this.shy;
    const X = (x) => Math.round(x - cx), Y = (y) => Math.round(y * SQ - cy);

    // 床
    g.fillStyle = '#07060c'; g.fillRect(0, 0, W, H);
    g.drawImage(this.floor.c, -this.floor.O - cx, -this.floor.O - cy);

    // 弾・場のループ
    this.syncLoops(view);
    this.fxBack.update(dt); this.fxFront.update(dt);

    // 床の印（予告・地雷・出口）
    this.drawMarks(g, view, X, Y);
    this.fxBack.render(g, cx, cy, null);

    // 影と立体（奥から順に）
    const L = [];
    for (const w of this.walls) L.push({ y: w.y, d: () => drawModel(g, this.wallModel, X(w.x), Y(w.y), 0) });
    for (const o of this.room.obstacles) L.push({ y: o.y, d: () => { shadow(g, X(o.x), Y(o.y), o.r + 2); drawModel(g, o.model, X(o.x), Y(o.y), o.a); } });
    for (const pr of view.props) L.push({ y: pr.y, d: () => { shadow(g, X(pr.x), Y(pr.y), 14 * pr.g); drawModel(g, pr.m, X(pr.x), Y(pr.y), pr.a, { sx: Math.max(0.05, pr.g), sy: Math.max(0.05, pr.g), frame: Math.floor(this.t * (pr.m === 'bigtruck' ? 12 : 2)) % 2 }); } });
    for (const k of view.pickups) { const d = this.pickupDraw(g, k, X, Y); if (d) L.push({ y: k.y, d }); }
    for (const e of view.enemies) L.push({ y: e.y, d: () => this.drawEnemy(g, e, X, Y) });
    for (const s of view.summons) L.push({ y: s.y, d: () => this.drawSummon(g, s, X, Y) });
    for (const q of view.players) L.push({ y: q.y, d: () => this.drawPlayer(g, q, X, Y, q.id === me || (this.followIds && this.followIds.includes(q.id)), view.players.length > 1) });
    L.sort((a, b) => a.y - b.y);
    for (const o of L) o.d();

    // 敵の弾
    this.drawBullets(g, view, X, Y);
    this.fxFront.render(g, cx, cy, 'front');

    // 天気と画面の演出
    this.drawAmbient(g, dt, W, H);
    g.drawImage(this.vign, 0, 0);
    if (this.grayT > 0) { this.grayT -= dt; g.save(); g.globalCompositeOperation = 'saturation'; g.fillStyle = 'rgba(128,128,128,0.85)'; g.fillRect(0, 0, W, H); g.restore(); g.fillStyle = 'rgba(240,210,122,0.06)'; g.fillRect(0, 0, W, H); }
    if (this.darkT > 0) { this.darkT -= dt; const k = Math.min(1, this.darkT * 2, 2.6 - this.darkT); g.save(); g.globalAlpha = 0.55 * Math.max(0, k); g.fillStyle = '#0a0418'; g.fillRect(0, 0, W, H); g.restore(); }
    if (this.flash) { this.flash.t -= dt; const k = Math.max(0, this.flash.t / this.flash.max); g.save(); g.globalAlpha = k * 0.7; g.fillStyle = this.flash.col; g.fillRect(0, 0, W, H); g.restore(); if (this.flash.t <= 0) this.flash = null; }
    if (p && p.hurt) { g.save(); g.globalAlpha = 0.08; g.fillStyle = '#ff2040'; g.fillRect(0, 0, W, H); g.restore(); }
    if (p && p.hp < p.mhp * 0.3 && !p.dead) { const k = 0.12 + 0.08 * Math.sin(this.t * 6); g.save(); g.globalAlpha = k; g.drawImage(this.vign, 0, 0); g.fillStyle = 'rgba(160,0,30,0.25)'; g.globalCompositeOperation = 'source-atop'; g.restore(); }
    this.blit();
  }

  drawAmbient(g, dt, W, H) {
    const kinds = [this.ambKind];
    if (this.overlay) { this.overlay.t -= dt; if (this.overlay.t > 0) kinds.push(this.overlay.kind); else this.overlay = null; }
    const want = { fireflies: 26, rain: 90, stars: 40, fog: 34, snow: 220, fairy: 70 };
    for (const k of kinds) { let n = this.amb.filter((a) => a.k === k).length; while (n++ < (want[k] || 0)) this.amb.push(newAmb(k, W, H, true)); }
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const a of this.amb) {
      a.t += dt; a.x += a.vx * dt; a.y += a.vy * dt;
      if (a.k === 'fireflies' || a.k === 'fairy') { a.vx += Math.sin(a.t * 2 + a.s) * 6 * dt; a.vy += Math.cos(a.t * 1.7 + a.s) * 6 * dt; }
      const out = a.x < -10 || a.x > W + 10 || a.y < -20 || a.y > H + 10 || a.t > a.life;
      if (out) { if (kinds.includes(a.k)) Object.assign(a, newAmb(a.k, W, H, false)); else { a.dead = true; continue; } }
      const fade = Math.min(1, a.t * 2, (a.life - a.t) * 2);
      if (a.k === 'fireflies') { const b = 0.5 + 0.5 * Math.sin(a.t * 3 + a.s); g.fillStyle = `rgba(216,255,90,${0.25 * b * fade})`; g.fillRect(a.x - 1, a.y - 1, 3, 3); g.fillStyle = `rgba(250,255,190,${0.9 * b * fade})`; g.fillRect(a.x, a.y, 1, 1); }
      else if (a.k === 'rain') { g.fillStyle = 'rgba(120,160,220,0.35)'; for (let i = 0; i < 6; i++) g.fillRect(Math.round(a.x - i * 0.4), Math.round(a.y - i), 1, 1); }
      else if (a.k === 'stars') { const b = 0.5 + 0.5 * Math.sin(a.t * 5 + a.s); g.fillStyle = `rgba(127,246,255,${0.6 * b * fade})`; g.fillRect(a.x, a.y, 1, 1); if (b > 0.9) { g.fillRect(a.x - 1, a.y, 3, 1); g.fillRect(a.x, a.y - 1, 1, 3); } }
      else if (a.k === 'fog') { g.fillStyle = `rgba(198,155,255,${0.7 * fade})`; g.fillRect(a.x, a.y, 1, 1); g.fillStyle = `rgba(138,90,255,${0.15 * fade})`; g.fillRect(a.x - 1, a.y - 1, 3, 3); }
      else if (a.k === 'snow') { g.fillStyle = `rgba(220,240,255,${0.8 * fade})`; g.fillRect(a.x, a.y, a.s > 3 ? 2 : 1, a.s > 3 ? 2 : 1); }
      else if (a.k === 'fairy') { const b = 0.5 + 0.5 * Math.sin(a.t * 6 + a.s); g.fillStyle = `rgba(255,138,216,${0.35 * fade})`; g.fillRect(a.x - 1, a.y - 1, 3, 3); g.fillStyle = `rgba(255,240,255,${b * fade})`; g.fillRect(a.x, a.y, 1, 1); if (b > 0.85) { g.fillRect(a.x - 2, a.y, 5, 1); g.fillRect(a.x, a.y - 2, 1, 5); } }
    }
    g.restore();
    this.amb = this.amb.filter((a) => !a.dead);
    if (this.overlay && this.overlay.kind === 'snow') { g.fillStyle = 'rgba(150,200,255,0.08)'; g.fillRect(0, 0, W, H); }
  }

  blit() {
    const c = this.ctx; c.imageSmoothingEnabled = false;
    c.drawImage(this.low, 0, 0, this.W, this.H, 0, 0, this.W * this.scale, this.H * this.scale);
  }

  syncLoops(view) {
    // 弾
    const seen = new Set();
    for (const s of view.shots) {
      seen.add(s.id);
      let f = this.shotFx.get(s.id);
      const ang = Math.atan2(Math.sin(s.a) * SQ, Math.cos(s.a));
      if (!f) {
        const def = FXDEF[s.k]; if (!def) continue;
        if (def.custom) { f = customFx(def.custom, def, { x: s.x, y: s.y * SQ - 10, angle: ang }); this.fxFront.custom(f); f.isCustom = true; }
        else { const o = { ...def.o, x: s.x, y: s.y * SQ - 10, angle: ang }; if (s.pal && PALS[s.pal]) o.palette = PALS[s.pal]; f = this.fxFront.add(def.m, o); }
        this.shotFx.set(s.id, f);
      }
      if (f.isCustom) { f.x = s.x; f.y = s.y * SQ - 10; f.a = ang; }
      else { f.options.x = s.x; f.options.y = s.y * SQ - 10; f.options.angle = ang; }
    }
    for (const [id, f] of this.shotFx) if (!seen.has(id)) { f.stop(); this.shotFx.delete(id); }
    // 場
    const zs = new Set();
    for (const z of view.zones) {
      zs.add(z.id);
      let f = this.zoneFx.get(z.id);
      const zx = z.x, zy = z.y * SQ;
      if (!f) {
        const def = FXDEF[z.k]; if (!def) continue;
        if (def.custom) { f = customFx(def.custom, def, { x: zx, y: zy }); (def.layer === 'ground' ? this.fxBack : this.fxFront).custom(f); f.isCustom = true; }
        else {
          const o = { ...def.o, x: zx, y: zy };
          if (z.pal && PALS[z.pal]) o.palette = PALS[z.pal];
          if (z.k === 'fireField' || z.k === 'napalm') o.radius = z.r;
          if (z.k === 'flamethrower') o.reach = Math.round(z.r * 0.9);
          if (z.k === 'waterJet') o.length = Math.round(z.r);
          f = (def.layer === 'ground' ? this.fxBack : this.fxFront).add(def.m, o, { layer: def.layer || 'front' });
        }
        this.zoneFx.set(z.id, f);
      }
      const cone = z.k === 'flamethrower' || z.k === 'waterJet' || z.k === 'gatling';
      const ax = cone ? zx + Math.cos(z.a) * 8 : zx, ay = cone ? zy - 10 + Math.sin(z.a) * 8 * SQ : zy;
      if (f.isCustom) { f.x = ax; f.y = ay; } else { f.options.x = ax; f.options.y = ay; if (cone) f.options.angle = Math.atan2(Math.sin(z.a) * SQ, Math.cos(z.a)); }
    }
    for (const [id, f] of this.zoneFx) if (!zs.has(id)) { f.stop(); this.zoneFx.delete(id); }
    // 出口の渦
    const es = new Set();
    view.exits.forEach((e, i) => {
      const key = i + ':' + e.x; es.add(key);
      if (!this.exitFx.has(key)) this.exitFx.set(key, this.fxBack.add(F.portal, { x: e.x, y: e.y * SQ + 6, palette: e.type === 'boss' ? PALS.blood : e.type === 'elite' ? PALS.gold : e.type === 'shop' ? PALS.heal : PALS.arcane }, { layer: 'back' }));
    });
    for (const [k, f] of this.exitFx) if (!es.has(k)) { f.stop(); this.exitFx.delete(k); }
    // 光る拾い物
    const ps = new Set();
    for (const k of view.pickups) {
      if (k.k !== 'tome' && k.k !== 'relic' && k.k !== 'chest') continue;
      ps.add(k.id);
      if (!this.pickFx.has(k.id)) this.pickFx.set(k.id, this.fxBack.add(F.lootBeam, { x: k.x, y: k.y * SQ, palette: k.k === 'relic' ? PALS.arcane : k.k === 'chest' ? PALS.gold : PALS.ice }, { layer: 'back' }));
    }
    for (const [id, f] of this.pickFx) if (!ps.has(id)) { f.stop(); this.pickFx.delete(id); }
    // 状態異常の炎・毒
    const ss = new Set();
    for (const e of view.enemies) {
      for (const [bit, mod, key] of [[2, F.burning, 'b'], [8, F.stunned, 's']]) {
        if (!(e.st & bit)) continue;
        const id = e.id + key; ss.add(id);
        if (!this.statusFx.has(id) && this.statusFx.size < 40) this.statusFx.set(id, this.fxFront.add(mod, { x: e.x, y: e.y * SQ }, { follow: () => { const q = this.view.enemies.find((o) => o.id === e.id); return q ? { x: q.x, y: q.y * SQ - (q.fly || 0) } : null; } }));
      }
    }
    for (const [id, f] of this.statusFx) if (!ss.has(id)) { f.stop(); this.statusFx.delete(id); }
  }

  drawMarks(g, view, X, Y) {
    // 敵の予告
    for (const t of view.teles) {
      const a = 0.25 + 0.35 * t.p, col = t.d ? '255,50,80' : '255,200,80';
      g.save();
      if (t.k === 'circle') {
        g.fillStyle = `rgba(${col},${a * 0.35})`; g.strokeStyle = `rgba(${col},${a + 0.2})`; g.lineWidth = 1;
        g.beginPath(); g.ellipse(X(t.x), Y(t.y), t.r, t.r * SQ, 0, 0, TAU); g.fill(); g.stroke();
        g.fillStyle = `rgba(${col},${0.4})`; g.beginPath(); g.ellipse(X(t.x), Y(t.y), t.r * t.p, t.r * t.p * SQ, 0, 0, TAU); g.fill();
      } else {
        const ex = t.x + Math.cos(t.ang) * t.len, ey = t.y + Math.sin(t.ang) * t.len;
        const x0 = X(t.x), y0 = Y(t.y), x1 = X(ex), y1 = Y(ey);
        g.strokeStyle = `rgba(${col},${a * 0.5})`; g.lineWidth = t.w * (0.7 + SQ * 0.3); g.lineCap = 'round';
        g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
        g.strokeStyle = `rgba(${col},${0.5 + t.p * 0.4})`; g.lineWidth = 1; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + (x1 - x0) * t.p, y0 + (y1 - y0) * t.p); g.stroke();
      }
      g.restore();
    }
    // 味方の魔法の着弾点
    for (const s of view.strikes) { g.save(); g.strokeStyle = `rgba(160,200,255,${0.3 + 0.3 * Math.sin(this.t * 20)})`; g.beginPath(); g.ellipse(X(s.x), Y(s.y), s.r, s.r * SQ, 0, 0, TAU); g.stroke(); g.restore(); }
    // 地雷
    for (const [x, y, armed] of view.mines) { g.fillStyle = '#2a2830'; g.fillRect(X(x) - 3, Y(y) - 1, 6, 3); g.fillStyle = armed && Math.floor(this.t * 4) % 2 ? '#ff3a52' : '#6a2a30'; g.fillRect(X(x) - 1, Y(y) - 1, 2, 1); }
    // 出口の床
    for (const e of view.exits) { g.save(); g.fillStyle = `rgba(160,120,255,${0.12 + e.hold * 0.4})`; g.beginPath(); g.ellipse(X(e.x), Y(e.y) + 6, 26, 26 * SQ, 0, 0, TAU); g.fill(); g.restore(); }
  }

  drawBullets(g, view, X, Y) {
    const dtx = (view._age || 0);
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const b of view.bullets) {
      const x = X(b[0] + b[2] * dtx), y = Y(b[1] + b[3] * dtx) - 8, r = b[4];
      g.fillStyle = b[6] ? 'rgba(120,220,255,0.35)' : hexA(b[5], 0.35); g.beginPath(); g.arc(x, y, r + 2.5, 0, TAU); g.fill();
    }
    g.restore();
    for (const b of view.bullets) {
      const x = X(b[0] + b[2] * dtx), y = Y(b[1] + b[3] * dtx) - 8, r = b[4];
      g.fillStyle = '#1a0c1c'; g.fillRect(x - r, y - r + 1, r * 2, r * 2 - 2); g.fillRect(x - r + 1, y - r, r * 2 - 2, r * 2);
      g.fillStyle = b[6] ? '#7ff6ff' : b[5]; g.fillRect(x - r + 1, y - r + 1, r * 2 - 2, r * 2 - 2);
      g.fillStyle = '#ffffff'; g.fillRect(x - 1, y - 1, Math.max(1, r - 1), Math.max(1, r - 1));
      // 影
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x - r + 1, y + 8, r * 2 - 2, 1);
    }
  }

  pickupDraw(g, k, X, Y) {
    const x = X(k.x), y = Y(k.y), b = Math.sin(this.t * 4 + k.id) * 1.5;
    switch (k.k) {
      case 'xp': return () => { g.fillStyle = 'rgba(120,240,255,0.35)'; g.fillRect(x - 2, y - 5 + b, 5, 5); g.fillStyle = '#7ff6ff'; g.fillRect(x - 1, y - 4 + b, 3, 3); g.fillStyle = '#fff'; g.fillRect(x, y - 4 + b, 1, 1); };
      case 'gold': return () => { g.fillStyle = '#7a4a10'; g.fillRect(x - 2, y - 4 + b, 4, 4); g.fillStyle = Math.floor(this.t * 6 + k.id) % 3 ? '#ffd23c' : '#fff0a0'; g.fillRect(x - 1, y - 4 + b, 2, 3); };
      case 'crystal': return () => { g.fillStyle = '#c69bff'; g.beginPath(); g.moveTo(x, y - 10 + b); g.lineTo(x + 4, y - 5 + b); g.lineTo(x, y + b); g.lineTo(x - 4, y - 5 + b); g.fill(); g.fillStyle = '#fff'; g.fillRect(x - 1, y - 7 + b, 1, 2); };
      case 'heart': return () => { g.fillStyle = '#ff4a6a'; g.fillRect(x - 3, y - 7 + b, 2, 2); g.fillRect(x + 1, y - 7 + b, 2, 2); g.fillRect(x - 3, y - 6 + b, 6, 2); g.fillRect(x - 2, y - 4 + b, 4, 1); g.fillRect(x - 1, y - 3 + b, 2, 1); g.fillStyle = '#ffd0d8'; g.fillRect(x - 2, y - 7 + b, 1, 1); };
      case 'tome': return () => { shadow(g, x, y, 7); g.fillStyle = '#3a1c78'; g.fillRect(x - 5, y - 16 + b, 10, 8); g.fillStyle = '#9a8cff'; g.fillRect(x - 4, y - 15 + b, 8, 6); g.fillStyle = '#fff0a0'; g.fillRect(x - 1, y - 14 + b, 2, 4); };
      case 'relic': return () => { shadow(g, x, y, 6); drawModel(g, 'relic', x, y, this.t, {}); };
      case 'chest': return () => { shadow(g, x, y, 8); drawModel(g, 'chest', x, y, Math.PI / 2); };
      case 'fountain': return null;
    }
    return null;
  }

  drawEnemy(g, e, X, Y) {
    const x = X(e.x), y = Y(e.y), sc = e.sc || 1;
    const bob = e.fly ? e.fly + Math.sin(this.t * 3 + e.id) * 2 : 0;
    shadow(g, x, y, (e.bo ? 16 : 6) * sc * (e.fly ? 0.7 : 1));
    let tint = null;
    if (e.st & 1) tint = ['#9bdcff', 0.55]; else if (e.st & 64) tint = ['#8a6a3a', 0.35]; else if (e.st & 32) tint = ['#a868f0', 0.3]; else if (e.st & 4) tint = ['#7ee84c', 0.25]; else if (e.st & 2) tint = Math.floor(this.t * 10) % 2 ? ['#ff8a2a', 0.3] : null;
    if (e.el && !tint) tint = ['#ffd24a', 0.18 + 0.08 * Math.sin(this.t * 5)];
    const fuse = e.st & 128, wind = e.st & 256;
    const flash = e.fl || (fuse && Math.floor(this.t * 12) % 2);
    const frame = (e.st & 1) ? 0 : Math.floor(this.t * 6 + e.id) % 2;
    const squash = e.k === 'slime' ? 1 + Math.sin(this.t * 8 + e.id) * 0.08 : 1;
    const alpha = e.sp ? 0.3 + 0.5 * (Math.floor(this.t * 20) % 2) : 1;
    if (wind) { g.save(); g.globalAlpha = 0.5; g.fillStyle = '#ff4a6a'; g.beginPath(); g.ellipse(x, y, 10 * sc, 4 * sc, 0, 0, TAU); g.fill(); g.restore(); }
    drawModel(g, e.k, x, y, e.a, { frame, sx: sc / squash, sy: sc * squash, flash, tint, alpha, lift: bob });
    if (e.el) { g.fillStyle = '#ffd24a'; g.fillRect(x - 1, y - 30 * sc - bob, 2, 2); }
    if (e.st & 512) { g.fillStyle = '#ff8ad8'; g.fillText?.call; g.fillRect(x - 3, y - 26 * sc - bob, 2, 2); g.fillRect(x + 2, y - 28 * sc - bob, 2, 2); }
    if (!e.bo && e.hp < e.mhp && e.hp > 0) {
      const w = Math.round(14 * sc), hy = y - Math.round((e.k === 'golem' ? 26 : 18) * sc) - bob - 6;
      g.fillStyle = '#14101e'; g.fillRect(x - w / 2 - 1, hy - 1, w + 2, 3);
      g.fillStyle = e.el ? '#ffd24a' : '#ff4a6a'; g.fillRect(x - w / 2, hy, Math.max(1, Math.round(w * e.hp / e.mhp)), 1);
    }
  }

  drawSummon(g, s, X, Y) {
    const x = X(s.x), y = Y(s.y);
    if (s.type === 'drone') { shadow(g, x, y + 10, 4); drawModel(g, 'allydrone', x, y, s.a, { frame: Math.floor(this.t * 20) % 2, lift: 14 + Math.sin(this.t * 4 + s.id) * 2 }); }
    else if (s.type === 'fortress') { shadow(g, x, y + 30, 10); drawModel(g, 'fortress', x, y, s.a, { frame: Math.floor(this.t * 20) % 2, lift: 30 }); }
    else if (s.type === 'decoy' && s.doll) { shadow(g, x, y, 5); drawModel(g, 'doll', x, y, s.a); }
    else if (s.type === 'decoy') { shadow(g, x, y, 6); drawModel(g, 'holo', x, y, s.a, { frame: Math.floor(this.t * 3) % 2, alpha: 0.55 + 0.2 * Math.sin(this.t * 15), tint: ['#7ff6ff', 0.4] }); }
    else if (s.type === 'hound') { shadow(g, x, y, 6); drawModel(g, 'k9', x, y, s.a, { frame: Math.floor((s.w || 0) / 2) % 2 }); }
    else if (s.type === 'turret') { shadow(g, x, y, 6); drawModel(g, 'allyturret', x, y, s.a); }
    else if (s.type === 'tesla') { shadow(g, x, y, 6); drawModel(g, 'pylon', x, y, 0); }
  }

  drawPlayer(g, q, X, Y, me, multi) {
    const x = X(q.x), y = Y(q.y);
    // 残像
    let tr = this.trails.get(q.id); if (!tr) this.trails.set(q.id, (tr = []));
    if (q.dash) tr.push({ x: q.x, y: q.y, a: q.a, t: 0.25 });
    for (const o of tr) { o.t -= 1 / 60; if (o.t > 0) drawModel(g, 'mage' + (q.slot % 4), X(o.x), Y(o.y), o.a, { alpha: o.t * 1.6, tint: ['#9a8cff', 0.6] }); }
    this.trails.set(q.id, tr.filter((o) => o.t > 0));
    shadow(g, x, y, 7);
    if (me) { g.save(); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(x, y, 10, 10 * SQ, 0, 0, TAU); g.stroke(); g.restore(); }
    if (q.dead) {
      drawModel(g, 'mage' + (q.slot % 4), x, y, q.a, { alpha: 0.35, tint: ['#5a5470', 0.7] });
      if (q.rev > 0) { g.strokeStyle = '#7ee88a'; g.lineWidth = 2; g.beginPath(); g.arc(x, y - 36, 5, -Math.PI / 2, -Math.PI / 2 + q.rev * TAU); g.stroke(); g.lineWidth = 1; }
      return;
    }
    const stealth = (this.view.stealth || []).includes(q.id);
    const blink = stealth || (q.ifr && !q.dash && Math.floor(this.t * 20) % 2);
    const frame = Math.floor(q.walk / 3) % 2;
    drawModel(g, 'mage' + (q.slot % 4), x, y, q.a, { frame, tint: q.hurt ? ['#ff3050', 0.55] : stealth ? ['#7ff6ff', 0.5] : null, alpha: stealth ? 0.3 : blink ? 0.6 : 1, lift: q.cast ? 1 : 0 });
    if (q.sh > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(120,220,255,${0.4 + 0.2 * Math.sin(this.t * 8)})`; g.beginPath(); g.ellipse(x, y - 14, 13, 18, 0, 0, TAU); g.stroke(); g.restore(); }
    if (q.inv) { g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,240,160,0.7)'; g.beginPath(); g.ellipse(x, y - 14, 15, 20, 0, 0, TAU); g.stroke(); g.restore(); }
    if (multi) {
      const col = ['#8a7cff', '#ff6a7a', '#5ad890', '#ffd24a'][q.slot % 4];
      g.fillStyle = col; g.fillRect(x - 1, y - 40, 3, 2); g.fillRect(x, y - 38, 1, 1);
      if (!me) { const w = 16; g.fillStyle = '#14101e'; g.fillRect(x - w / 2 - 1, y - 45, w + 2, 3); g.fillStyle = '#7ee88a'; g.fillRect(x - w / 2, y - 44, Math.round(w * q.hp / q.mhp), 1); }
    }
  }
}

function newAmb(k, W, H, anywhere) {
  const a = { k, t: 0, s: Math.random() * 10, life: 4 + Math.random() * 6, x: Math.random() * W, y: anywhere ? Math.random() * H : 0, vx: 0, vy: 0 };
  if (k === 'fireflies') { a.vx = rand(-6, 6); a.vy = rand(-6, 6); a.y = Math.random() * H; }
  if (k === 'rain') { a.vx = -40; a.vy = rand(260, 340); a.life = 3; if (!anywhere) a.y = -10; }
  if (k === 'stars') { a.vx = rand(-3, 3); a.vy = rand(-10, -4); a.y = anywhere ? a.y : H; }
  if (k === 'fog') { a.vx = rand(-5, 5); a.vy = rand(-16, -6); a.y = anywhere ? a.y : H + 5; }
  if (k === 'snow') { a.vx = rand(-90, -40); a.vy = rand(50, 110); a.life = 5; a.x = Math.random() * (W + 80); if (!anywhere) a.y = -5; }
  if (k === 'fairy') { a.vx = rand(-15, 15); a.vy = rand(-20, 5); a.y = Math.random() * H; a.life = 2 + Math.random() * 2; }
  return a;
}

function shadow(g, x, y, r) { g.fillStyle = 'rgba(0,0,0,0.32)'; g.beginPath(); g.ellipse(x, y, r, Math.max(1.5, r * SQ * 0.55), 0, 0, TAU); g.fill(); }
const hexCache = {};
function hexA(h, a) { const k = h + a; if (hexCache[k]) return hexCache[k]; const n = parseInt(h.slice(1), 16); return (hexCache[k] = `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`); }
