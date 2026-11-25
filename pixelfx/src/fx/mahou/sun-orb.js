// 射日・九陽落とし: 空に浮かぶ小さな太陽。白い芯、脈打つ橙のコロナ、ゆらめくフレア、まわりを回る火の粉。
import { fit, sparkle, cycle, TAU, WHITE } from "../../core/index.js";

export const meta = {
  name: "Sun orb",
  desc: "A small burning sun hanging in the sky: a white core, a pulsing orange corona, licking prominences and embers circling it.",
  tags: ["fire", "sun", "sky", "orb", "loop", "mahou"],
  size: [96, 96], origin: [48, 48], duration: 2, loop: true, fps: 30, bg: "dark",
  options: { palette: ["#3a0a04", "#7a1a06", "#c0400a", "#f07a14", "#ffb030", "#ffe070", "#fff8c0", "#ffffff"], seed: 4 },
};

export function draw(p, t, o) {
  const C = fit(o.palette, 8), T = meta.duration, ph = (t / T) * TAU, R = 9 + Math.sin(ph * 2) * 0.6;
  p.glow(0, 0, 44, C[3], 0.32 + 0.06 * Math.sin(ph));
  p.glow(0, 0, 18, C[5], 0.5);
  // prominences: arcs of flame that rise off the rim and fall back
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU + ph * 0.25, lift = 4 + 4 * Math.max(0, Math.sin(ph + i * 1.7));
    for (let s = 0; s <= 1; s += 0.08) {
      const aa = a + (s - 0.5) * 0.5, r = R + Math.sin(s * Math.PI) * lift;
      p.dot(Math.cos(aa) * r, Math.sin(aa) * r, s < 0.2 || s > 0.8 ? C[3] : C[4], 0.9);
    }
  }
  // the body: hard ramp steps, bright to the upper left, limb darkened
  p.shade(-R - 1, -R - 1, R + 1, R + 1, (x, y) => {
    const d = Math.hypot(x, y); if (d > R) return;
    const l = (-(x + y) / (R * 1.4)) * 0.4 + (1 - d / R) * 0.9 + 0.1 * Math.sin(x * 0.9 + ph * 3) * Math.sin(y * 0.8 - ph * 2);
    return l > 0.85 ? WHITE : l > 0.62 ? C[6] : l > 0.42 ? C[5] : l > 0.24 ? C[4] : C[3];
  });
  p.ring(0, 0, R + 0.5, 1, C[2], 0.8);
  // embers circling
  cycle(t, T, 14, o.seed, 1.2, (age, life, r) => {
    const k = age / life, a = r.range(0, TAU) + age * r.range(1.5, 3), d = R + 3 + k * r.range(6, 16);
    const x = Math.cos(a) * d, y = Math.sin(a) * d - k * 6;
    p.px(x, y, k < 0.4 ? C[6] : k < 0.7 ? C[5] : C[3]);
    p.glow(x, y, 3, C[4], 0.25 * (1 - k));
  });
  sparkle(p, -3, -3, 2 + Math.round(1 + Math.sin(ph * 2)), C[6], WHITE, 0.4);
}
