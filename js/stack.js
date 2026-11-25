// スプライトスタッキング（輪切り重ね）エンジン。
// 「Sprite Stack Lab」の仕組みをゲーム用に移植：小さなボクセルを組み立て、真上から見た輪切りを下から重ね、
// 角度ごとに一度だけ光（左上の太陽＋右うしろの青い補助光）を計算してキャッシュする。3D モデルは使わない。

export const TAU = Math.PI * 2;
export const ELEV = 42 * Math.PI / 180;     // カメラの見下ろし角
export const SQ = Math.sin(ELEV);           // 床の縦のつぶれ
export const LIFT = Math.cos(ELEV);         // 輪切り 1 枚ぶんの持ち上げ
export const BUCKETS = 32;                  // 回転の段階

// ---------- 材質（暗→側面→上面→ふち の 4 色） ----------
const PAL = {
  hull: ['#232842', '#45507a', '#8593c0', '#d6def5'],
  red: ['#43142c', '#8e2242', '#d9404c', '#ff9c78'],
  glass: ['#0d2547', '#1a5a8c', '#38b4dc', '#bff6ff'],
  purp: ['#201038', '#47206b', '#8840ad', '#d27de6'],
  metal: ['#14121c', '#2a2738', '#4a4560', '#7b7496'],
  steel: ['#1c2230', '#3a4658', '#6d7c92', '#b8c6d8'],
  rock: ['#241a22', '#46323c', '#73575a', '#a5877c'],
  stone: ['#1e1d2a', '#3c3a52', '#6a6886', '#a8a6c2'],
  cryst: ['#0f2b40', '#1b7286', '#47d9c3', '#c6ffee'],
  gold: ['#3f220e', '#94561a', '#eaa92e', '#fff0a2'],
  green: ['#0d3326', '#1b6e45', '#45b86a', '#b4f0a0'],
  leaf: ['#0b2418', '#1a4a26', '#3a8a3a', '#9ad86a'],
  moss: ['#16261a', '#2c4a2a', '#5a7e3c', '#a8c86a'],
  bark: ['#1e120e', '#3e2418', '#6a4028', '#a07048'],
  wood: ['#2a160e', '#5a321a', '#93582c', '#d6955a'],
  orange: ['#371820', '#82352a', '#d27236', '#f6c272'],
  pink: ['#3a1238', '#7a2468', '#d0569e', '#ffb0d8'],
  white: ['#4d5576', '#8f99bb', '#d3d9ee', '#ffffff'],
  dark: ['#0c0a14', '#14111f', '#1d1a2b', '#262238'],
  skin: ['#4a2a2a', '#9a5a48', '#e0a080', '#ffe0c8'],
  hair: ['#1a1020', '#3a2240', '#6a4a70', '#a888b0'],
  slime: ['#0c2a20', '#1a6a44', '#3ac478', '#b8ffcc'],
  cap: ['#3a0c14', '#8a1a22', '#d83a3a', '#ffa08a'],
  bone: ['#3a3028', '#7a6a58', '#c8b898', '#fff4dc'],
  concrete: ['#1e1e24', '#3e3e48', '#6e6e7a', '#b0b0ba'],
  asphalt: ['#121218', '#1e1e28', '#2e2e3a', '#4a4a58'],
  brick: ['#2a1210', '#5a2418', '#9a4028', '#d0784a'],
  olive: ['#1a1e10', '#3a4220', '#687838', '#a8b868'],
  navy: ['#0c1028', '#1a2450', '#344890', '#7088d0'],
  void: ['#08040e', '#180a26', '#341648', '#62307a'],
  obsid: ['#06060c', '#121222', '#24243c', '#484870'],
  // ローブ（プレイヤーごと）
  robe0: ['#140c38', '#2a1c78', '#4a3ac8', '#9a8cff'],
  robe1: ['#380c18', '#781c2c', '#c83a4a', '#ff9ca4'],
  robe2: ['#0c3020', '#1c6a3c', '#3ab068', '#a8f0b8'],
  robe3: ['#3a2a08', '#7a5a14', '#d0a02a', '#fff0a0'],
};
const NOISY = { rock: 1, cryst: 1, stone: 1, moss: 1, bark: 1, concrete: 1, asphalt: 1, obsid: 1 };
const SPEC_N = { hull: 0.55, metal: 0.5, steel: 0.6, glass: 1.1, gold: 0.8, cryst: 1.0, white: 0.5, purp: 0.35, red: 0.3, orange: 0.25, pink: 0.45, green: 0.3, slime: 0.9, cap: 0.3, rock: 0.04, dark: 0.15, obsid: 0.7, void: 0.4 };
const EMIS = {
  fire: '#ffe68a', fire2: '#ff9a3c', fire3: '#ff4a62', cyan: '#7ff6ff', red: '#ff3a52', green: '#7dff8a', yellow: '#fff27a',
  pinkL: '#ff8ad8', violet: '#c69bff', white: '#ffffff', blue: '#5b7cff', lava: '#ff7a2a', eye: '#fff6c8', lime: '#d8ff5a',
};
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const MATS = [null], MID = {};
for (const k in PAL) { MID[k] = MATS.length; MATS.push({ name: k, rgbs: PAL[k].map(hex), noise: !!NOISY[k] }); }
for (const k in EMIS) { MID['e_' + k] = MATS.length; MATS.push({ name: 'e_' + k, emis: hex(EMIS[k]) }); }

// ---------- ノイズ ----------
export function hash3(x, y, z, s) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1274126177) ^ Math.imul((s | 0) + 1, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function vnoise(x, y, z, s) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  let r = 0;
  for (let dz = 0; dz < 2; dz++) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++)
    r += hash3(xi + dx, yi + dy, zi + dz, s) * (dx ? u : 1 - u) * (dy ? v : 1 - v) * (dz ? w : 1 - w);
  return r;
}
export const fbm = (x, y, z, s) => vnoise(x, y, z, s) * 0.6 + vnoise(x * 2.1, y * 2.1, z * 2.1, s + 7) * 0.3 + vnoise(x * 4.3, y * 4.3, z * 4.3, s + 13) * 0.1;

// ---------- ボクセルの箱 ----------
export class Vol {
  constructor(w, h, d) { this.w = w; this.h = h; this.d = d; this.m = new Uint8Array(w * h * d); }
  idx(x, y, z) { return (z * this.h + y) * this.w + x; }
  inb(x, y, z) { return x >= 0 && y >= 0 && z >= 0 && x < this.w && y < this.h && z < this.d; }
  get(x, y, z) { return this.inb(x, y, z) ? this.m[this.idx(x, y, z)] : 0; }
  is(x, y, z, name) { return this.get(x, y, z) === MID[name]; }
  put(x, y, z, mat) { x |= 0; y |= 0; z |= 0; if (this.inb(x, y, z)) this.m[this.idx(x, y, z)] = mat ? MID[mat] : 0; }
  region(bb, test, mat) {
    const x0 = Math.max(0, Math.floor(bb[0])), x1 = Math.min(this.w - 1, Math.ceil(bb[1]));
    const y0 = Math.max(0, Math.floor(bb[2])), y1 = Math.min(this.h - 1, Math.ceil(bb[3]));
    const z0 = Math.max(0, Math.floor(bb[4])), z1 = Math.min(this.d - 1, Math.ceil(bb[5]));
    for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const px = x + 0.5, py = y + 0.5, pz = z + 0.5;
      if (!test(px, py, pz, x, y, z)) continue;
      const m = typeof mat === 'function' ? mat(px, py, pz, x, y, z) : mat;
      if (m !== undefined) this.m[this.idx(x, y, z)] = m ? MID[m] : 0;
    }
  }
  all(test, mat) { this.region([0, this.w, 0, this.h, 0, this.d], test, mat); }
  paint(test, mat) {
    for (let z = 0; z < this.d; z++) for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const i = this.idx(x, y, z); if (!this.m[i]) continue;
      const px = x + 0.5, py = y + 0.5, pz = z + 0.5;
      if (!test(px, py, pz, x, y, z, MATS[this.m[i]].name)) continue;
      const m = typeof mat === 'function' ? mat(px, py, pz, x, y, z, MATS[this.m[i]].name) : mat;
      if (m !== undefined) this.m[i] = m ? MID[m] : 0;
    }
  }
  box(x0, y0, z0, x1, y1, z1, mat) { this.region([x0, x1, y0, y1, z0, z1], (x, y, z) => x >= x0 && x < x1 && y >= y0 && y < y1 && z >= z0 && z < z1, mat); }
  ell(cx, cy, cz, rx, ry, rz, mat) {
    this.region([cx - rx, cx + rx, cy - ry, cy + ry, cz - rz, cz + rz], (x, y, z) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2 <= 1, mat);
  }
  ball(cx, cy, cz, r, mat) { this.ell(cx, cy, cz, r, r, r, mat); }
  cyl(cx, cy, r, z0, z1, mat) { this.region([cx - r, cx + r, cy - r, cy + r, z0, z1], (x, y, z) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r && z >= z0 && z < z1, mat); }
  cone(ax, ay, az, bx, by, bz, r0, r1, mat) {
    const R = Math.max(r0, r1), dx = bx - ax, dy = by - ay, dz = bz - az, L2 = dx * dx + dy * dy + dz * dz || 1;
    this.region([Math.min(ax, bx) - R, Math.max(ax, bx) + R, Math.min(ay, by) - R, Math.max(ay, by) + R, Math.min(az, bz) - R, Math.max(az, bz) + R], (x, y, z) => {
      let t = ((x - ax) * dx + (y - ay) * dy + (z - az) * dz) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const qx = ax + dx * t - x, qy = ay + dy * t - y, qz = az + dz * t - z, r = r0 + (r1 - r0) * t;
      return qx * qx + qy * qy + qz * qz <= r * r;
    }, mat);
  }
  seg(ax, ay, az, bx, by, bz, r, mat) { this.cone(ax, ay, az, bx, by, bz, r, r, mat); }
  torus(cx, cy, cz, R, r, mat, axis) {
    if (axis === 'y') this.region([cx - R - r, cx + R + r, cy - r, cy + r, cz - R - r, cz + R + r], (x, y, z) => (Math.hypot(x - cx, z - cz) - R) ** 2 + (y - cy) ** 2 <= r * r, mat);
    else if (axis === 'x') this.region([cx - r, cx + r, cy - R - r, cy + R + r, cz - R - r, cz + R + r], (x, y, z) => (Math.hypot(y - cy, z - cz) - R) ** 2 + (x - cx) ** 2 <= r * r, mat);
    else this.region([cx - R - r, cx + R + r, cy - R - r, cy + R + r, cz - r, cz + r], (x, y, z) => (Math.hypot(x - cx, y - cy) - R) ** 2 + (z - cz) ** 2 <= r * r, mat);
  }
}

// ---------- 光の表 ----------
const STEPS = 12, IMAX = 1.6;
const LUT = [], SPEC = [], EMC = [];
MATS.forEach((M, id) => {
  if (!M) return;
  if (M.emis) { EMC[id] = M.emis; return; }
  const r = M.rgbs;
  const stops = [[0, r[0].map((v) => v * 0.45)], [0.22, r[0]], [0.5, r[1]], [0.85, r[2]], [1.15, r[3]], [1.6, r[3].map((v) => v + (255 - v) * 0.6)]];
  const lut = [];
  for (let k = 0; k < STEPS; k++) {
    const I = k / (STEPS - 1) * IMAX;
    let j = 0; while (j < stops.length - 2 && I > stops[j + 1][0]) j++;
    const [a0, c0] = stops[j], [a1, c1] = stops[j + 1], t = Math.max(0, Math.min(1, (I - a0) / (a1 - a0)));
    lut.push(c0.map((v, q) => Math.round(v + (c1[q] - v) * t)));
  }
  LUT[id] = lut; SPEC[id] = SPEC_N[M.name] || 0;
});
const OFFS = [];
for (let dz = -2; dz <= 2; dz++) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
  const d2 = dx * dx + dy * dy + dz * dz; if (d2 > 0 && d2 <= 6.25) OFFS.push([dx, dy, dz, 1 / Math.sqrt(d2)]);
}

const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; };

// 1 枚の輪切り = 左半分に「材質・陰・きめ」、右半分に「面の向き」
function bakeLit(V) {
  const { w, h, d, m } = V, slices = [], glows = [];
  let hasGlow = false;
  const filled = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < w && y < h && z < d && m[(z * h + y) * w + x] !== 0;
  for (let z = 0; z < d; z++) {
    let x0 = w, x1 = -1, y0 = h, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (m[(z * h + y) * w + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) { slices.push(null); glows.push(null); continue; }
    const ix0 = x0, ix1 = x1, iy0 = y0, iy1 = y1;
    x0--; y0--; x1++; y1++;
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, img = new ImageData(bw * 2, bh), D = img.data;
    let gimg = null;
    for (let y = iy0; y <= iy1; y++) for (let x = ix0; x <= ix1; x++) {
      const id = m[(z * h + y) * w + x]; if (!id) continue;
      const li = ((y - y0) * bw * 2 + (x - x0)) * 4, ni = li + bw * 4, M = MATS[id];
      let nx = 0, ny = 0, nz = 1, ao = 0.6;
      const exposed = !filled(x - 1, y, z) || !filled(x + 1, y, z) || !filled(x, y - 1, z) || !filled(x, y + 1, z) || !filled(x, y, z + 1) || !filled(x, y, z - 1);
      if (exposed) {
        let gx = 0, gy = 0, gz = 0, f = 0;
        for (const o of OFFS) if (filled(x + o[0], y + o[1], z + o[2])) { gx -= o[0] * o[3]; gy -= o[1] * o[3]; gz -= o[2] * o[3]; f++; }
        const L = Math.hypot(gx, gy, gz);
        if (L > 1e-4) { nx = gx / L; ny = gy / L; nz = gz / L; }
        ao = Math.max(0.45, Math.min(1.15, 1 - (f / OFFS.length - 0.5) * 1.5));
      }
      if (M.emis) {
        if (!gimg) gimg = new ImageData(bw, bh);
        const gi = ((y - y0) * bw + (x - x0)) * 4;
        gimg.data[gi] = M.emis[0]; gimg.data[gi + 1] = M.emis[1]; gimg.data[gi + 2] = M.emis[2]; gimg.data[gi + 3] = 255;
      }
      let v = 1;
      if (!M.emis) v = M.noise ? 0.8 + 0.34 * fbm(x * 0.2, y * 0.2, z * 0.2, 17) + (hash3(x, y, z, 2) - 0.5) * 0.08 : 0.96 + hash3(x, y, z, 1) * 0.08;
      D[li] = id; D[li + 1] = Math.min(255, Math.round(ao * 200)); D[li + 2] = Math.min(255, Math.round(v * 170)); D[li + 3] = 255;
      D[ni] = Math.round((nx * 0.5 + 0.5) * 255); D[ni + 1] = Math.round((ny * 0.5 + 0.5) * 255); D[ni + 2] = Math.round((nz * 0.5 + 0.5) * 255); D[ni + 3] = 255;
    }
    const c = mkCanvas(bw * 2, bh); c.getContext('2d').putImageData(img, 0, 0);
    slices.push({ c, ox: x0, oy: y0, bw, bh });
    if (gimg) { const g = mkCanvas(bw, bh); g.getContext('2d').putImageData(gimg, 0, 0); glows.push({ c: g, ox: x0, oy: y0, bw, bh }); hasGlow = true; }
    else glows.push(null);
  }
  return { w, h, d, slices, glows, hasGlow };
}

const nrm3 = (x, y, z) => { const l = Math.hypot(x, y, z); return [x / l, y / l, z / l]; };
const SUN = nrm3(-0.62, 0.28, 0.73), FILL = nrm3(0.75, -0.55, 0.25);
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const OUT = [10, 8, 18];

function shade(actx, nctx, W, H, ang) {
  const A = actx.getImageData(0, 0, W, H), N = nctx.getImageData(0, 0, W, H), a = A.data, n = N.data;
  const c = Math.cos(ang), s = Math.sin(ang), HV = nrm3(SUN[0], SUN[1] + LIFT, SUN[2] + SQ);
  const mask = new Uint8Array(W * H), dith = IMAX / STEPS * 0.9;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = y * W + x, i = p * 4; if (!a[i + 3]) continue;
    const id = a[i], em = EMC[id];
    if (a[i + 3] < 250 || (!em && !LUT[id])) { a[i + 3] = 0; continue; }
    mask[p] = 1;
    if (em) { a[i] = em[0]; a[i + 1] = em[1]; a[i + 2] = em[2]; continue; }
    const nx = n[i] / 127.5 - 1, ny = n[i + 1] / 127.5 - 1, nz = n[i + 2] / 127.5 - 1;
    const wx = nx * c - ny * s, wy = nx * s + ny * c;
    const ao = a[i + 1] / 200, v = a[i + 2] / 170;
    const nl = wx * SUN[0] + wy * SUN[1] + nz * SUN[2];
    let I = (0.32 + 0.1 * nz + (nl > -0.2 ? (nl + 0.2) / 1.2 : 0) * 0.95) * ao * v;
    const sp = SPEC[id];
    if (sp && nl > 0) { const nh = wx * HV[0] + wy * HV[1] + nz * HV[2]; if (nh > 0) I += sp * Math.pow(nh, 28); }
    I += (BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.47) * dith;
    let k = Math.round(I / IMAX * (STEPS - 1)); k = k < 0 ? 0 : k >= STEPS ? STEPS - 1 : k;
    const col = LUT[id][k];
    let r = col[0], g = col[1], b = col[2];
    const fl = wx * FILL[0] + wy * FILL[1] + nz * FILL[2];
    if (fl > 0.2) { const q = Math.round((fl - 0.2) * 4) / 4 * 0.5 * Math.min(1, ao); r += 36 * q; g += 60 * q; b += 130 * q; }
    a[i] = r; a[i + 1] = g; a[i + 2] = b;
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; if (mask[i]) continue;
    if ((x > 0 && mask[i - 1]) || (x < W - 1 && mask[i + 1]) || (y > 0 && mask[i - W]) || (y < H - 1 && mask[i + W])) {
      a[i * 4] = OUT[0]; a[i * 4 + 1] = OUT[1]; a[i * 4 + 2] = OUT[2]; a[i * 4 + 3] = 255;
    }
  }
  actx.putImageData(A, 0, 0);
}

// ---------- モデル登録と描画 ----------
const MODELS = {};
/** build(V, frame, frames): ボクセルを組む。x 正方向がモデルの「前」。 */
export function defineModel(id, w, h, d, build, o = {}) {
  MODELS[id] = { id, w, h, d, build, F: o.frames || 1, fps: o.fps || 8, frames: null, cache: new Map(), r: o.r ?? Math.max(w, h) / 2 - 1, glowK: o.glowK ?? 0.8 };
}
export const hasModel = (id) => !!MODELS[id];
export function modelInfo(id) { return MODELS[id]; }

function ensureFrames(M) {
  if (M.frames) return;
  const frames = [];
  for (let f = 0; f < M.F; f++) { const V = new Vol(M.w, M.h, M.d); M.build(V, f, M.F); frames.push(bakeLit(V)); }
  M.frames = frames;
  const diag = Math.ceil(Math.hypot(M.w, M.h)) + 4;
  M.S = diag; M.H = Math.ceil(diag * SQ + M.d * LIFT) + 6;
}

let tmpA, tmpN, tmpActx, tmpNctx;
function render(M, f, b) {
  ensureFrames(M);
  const fr = M.frames[f], ang = b / BUCKETS * TAU, W = M.S, H = M.H;
  const cx = W / 2, cy = H - Math.ceil(M.S * SQ / 2) - 2;
  if (!tmpA || tmpA.width < W || tmpA.height < H) {
    tmpA = mkCanvas(Math.max(W, tmpA?.width || 0), Math.max(H, tmpA?.height || 0)); tmpN = mkCanvas(tmpA.width, tmpA.height);
    tmpActx = tmpA.getContext('2d', { willReadFrequently: true }); tmpNctx = tmpN.getContext('2d', { willReadFrequently: true });
  }
  const draw = (ctx, list, part) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.imageSmoothingEnabled = false;
    for (let z = 0; z < fr.d; z++) {
      const s = list[z]; if (!s) continue;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.translate(cx, cy - Math.round(z * LIFT)); ctx.scale(1, SQ); ctx.rotate(ang);
      ctx.drawImage(s.c, part * s.bw, 0, s.bw, s.bh, -fr.w / 2 + s.ox, -fr.h / 2 + s.oy, s.bw, s.bh);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  };
  draw(tmpActx, fr.slices, 0); draw(tmpNctx, fr.slices, 1);
  shade(tmpActx, tmpNctx, W, H, ang);
  const art = mkCanvas(W, H); art.getContext('2d').drawImage(tmpA, 0, 0, W, H, 0, 0, W, H);
  let glow = null;
  if (fr.hasGlow) {
    glow = mkCanvas(W, H); const g = glow.getContext('2d'); g.imageSmoothingEnabled = false;
    for (let z = 0; z < fr.d; z++) {
      const s = fr.glows[z]; if (!s) continue;
      g.setTransform(1, 0, 0, 1, 0, 0); g.translate(cx, cy - Math.round(z * LIFT)); g.scale(1, SQ); g.rotate(ang);
      g.drawImage(s.c, -fr.w / 2 + s.ox, -fr.h / 2 + s.oy);
    }
    // ぼかした光の輪（加算で重ねる）
    const big = mkCanvas(W + 16, H + 16), bg = big.getContext('2d');
    bg.filter = 'blur(3px)'; bg.drawImage(glow, 8, 8); bg.filter = 'none';
    glow = big;
  }
  return { art, glow, cx, cy, W, H, variants: {} };
}

function variant(e, key, color, alpha) {
  if (e.variants[key]) return e.variants[key];
  const c = mkCanvas(e.W, e.H), g = c.getContext('2d');
  g.drawImage(e.art, 0, 0);
  g.globalCompositeOperation = 'source-atop'; g.globalAlpha = alpha; g.fillStyle = color; g.fillRect(0, 0, e.W, e.H);
  return (e.variants[key] = c);
}

export function bucketOf(ang) { return ((Math.round(ang / TAU * BUCKETS) % BUCKETS) + BUCKETS) % BUCKETS; }

function entry(M, f, b) {
  const key = f * BUCKETS + b;
  let e = M.cache.get(key);
  if (!e) { e = render(M, f, b); M.cache.set(key, e); }
  return e;
}

/** 下の中心を (x, y) に置いて描く。o: { frame, sx, sy (伸び縮み), flash, tint: [css, alpha], alpha, lift(浮き) } */
export function drawModel(ctx, id, x, y, ang, o = {}) {
  const M = MODELS[id]; if (!M) return;
  ensureFrames(M);
  const f = ((Math.floor(o.frame || 0) % M.F) + M.F) % M.F, b = bucketOf(ang || 0), e = entry(M, f, b);
  const sx = o.sx ?? 1, sy = o.sy ?? 1, lift = o.lift ?? 0;
  const dx = Math.round(x - e.cx * sx), dy = Math.round(y - lift - e.cy * sy);
  let img = e.art;
  if (o.flash) img = variant(e, 'flash', '#ffffff', 0.85);
  else if (o.tint) img = variant(e, o.tint[0] + o.tint[1], o.tint[0], o.tint[1]);
  const pa = ctx.globalAlpha;
  if (o.alpha != null) ctx.globalAlpha = pa * o.alpha;
  ctx.drawImage(img, dx, dy, Math.round(e.W * sx), Math.round(e.H * sy));
  if (e.glow && o.glow !== false) {
    const go = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (o.alpha ?? 1) * pa * M.glowK;
    ctx.drawImage(e.glow, dx - 8 * sx, dy - 8 * sy, Math.round((e.W + 16) * sx), Math.round((e.H + 16) * sy));
    ctx.globalCompositeOperation = go;
  }
  ctx.globalAlpha = pa;
}

/** 読み込み時に先に焼いておく（初回の引っかかりを減らす） */
export function warm(ids, buckets = BUCKETS) {
  for (const id of ids) { const M = MODELS[id]; if (!M) continue; ensureFrames(M); for (let f = 0; f < M.F; f++) for (let b = 0; b < buckets; b += BUCKETS / buckets) entry(M, f, b); }
}
export function allModelIds() { return Object.keys(MODELS); }
