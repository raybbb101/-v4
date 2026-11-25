// 炎陣・ナパーム: 楕円の範囲いっぱいに炎の舌がゆらめき、火の粉と煙が上がる。
import { fit, cycle, TAU, WHITE } from "../../core/index.js";

export const meta = {
  name: "Fire field",
  desc: "A blazing patch of ground: tongues of flame flicker across a glowing elliptical bed, embers and thin smoke rising.",
  tags: ["fire", "field", "ground", "napalm", "loop", "mahou"],
  size: [180, 110], origin: [90, 80], duration: 2, loop: true, fps: 30, bg: "ground",
  options: { palette: ["#1f0b10", "#4a1118", "#8c1d1c", "#cc3a1a", "#f2701f", "#ffae35", "#ffe27a", "#fff8d6"], radius: 40, seed: 4 },
};

export function draw(p, t, o) {
  const C = fit(o.palette, 8), T = meta.duration, Rr = o.radius, SY = 0.36;
  p.ellipse(0, 0, Rr, Rr * SY, C[1], 0.35);
  p.ring(0, 0, Rr * 0.98, 1, C[3], 0.35);
  p.ellipse(0, 0, Rr * 0.6, Rr * SY * 0.6, C[2], 0.3);
  p.glow(0, -4, Rr * 1.2, C[4], 0.22);
  const n = Math.round(Rr * 1.1);
  cycle(t, T, n, o.seed, (r) => r.range(0.35, 0.7), (age, life, r) => {
    const k = age / life, a = r.range(0, TAU), d = Math.sqrt(r.next()) * Rr * 0.95;
    const x = Math.cos(a) * d, y0 = Math.sin(a) * d * SY, h = r.range(5, 14) * Math.sin(k * Math.PI);
    for (let y = 0; y < h; y++) { const v = y / h; p.dot(x + Math.sin(y * 0.6 + age * 12) * v, y0 - y, v < 0.25 ? C[6] : v < 0.55 ? C[5] : v < 0.8 ? C[4] : C[3], 1 - v * 0.3); }
    if (k < 0.3) p.glow(x, y0 - 2, 4, C[5], 0.12);
  });
  cycle(t, T, 10, o.seed + 1, 1, (age, life, r) => {
    const k = age / life, x = r.range(-Rr, Rr) * 0.8, y = r.range(-Rr, Rr) * SY * 0.8 - k * 40;
    p.px(x + Math.sin(k * 9) * 2, y, k < 0.5 ? C[6] : C[4]);
  });
}
