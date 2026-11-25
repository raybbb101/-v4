// 桜嵐: 花びらの刃が大きな渦を描いて舞い上がる。芯には風の筋、外側に散る花びら。
import { fit, cycle, TAU, WHITE, hex } from "../../core/index.js";

export const meta = {
  name: "Sakura storm",
  desc: "A vortex of cherry-petal blades: pink petals whirl round a column of pale wind streaks, flickering as they turn edge-on, some flung free.",
  tags: ["nature", "wind", "petal", "vortex", "loop", "mahou"],
  size: [180, 160], origin: [90, 130], duration: 2, loop: true, fps: 30, bg: "ground",
  options: { palette: ["#3a0c24", "#7a1a48", "#c83a78", "#f07aa8", "#ffb0cc", "#ffe0ec", "#ffffff"], seed: 6 },
};
const WIND = hex("#e8f8ff");

export function draw(p, t, o) {
  const C = fit(o.palette, 7), T = meta.duration, ph = t / T;
  p.ellipse(0, 0, 36, 8, C[0], 0.25);
  // wind streaks
  for (let i = 0; i < 6; i++) {
    const y = -8 - i * 16, r = 14 + i * 7, a0 = ph * TAU * 2 + i;
    p.arc(0, y, r, 1, a0, a0 + 1.6, WIND, 0.35);
  }
  // petals
  cycle(t, T, 120, o.seed, (r) => r.range(1.2, 2), (age, life, r) => {
    const k = age / life, h = k * r.range(80, 120), rad = 10 + h * 0.4 + r.range(-4, 4), a = r.range(0, TAU) + age * r.range(4, 7);
    const x = Math.cos(a) * rad, y = -h + Math.sin(a) * rad * 0.3;
    const edge = Math.abs(Math.sin(a * 2 + r.range(0, 6)));
    const c = edge > 0.7 ? C[5] : edge > 0.35 ? C[4] : C[3];
    p.px(x, y, c); if (edge > 0.5) p.px(x + 1, y, C[3]);
    if (k > 0.85) return;
    if (r.chance(0.2)) p.glow(x, y, 3, C[4], 0.15);
  });
  p.glow(0, -50, 40, C[3], 0.12);
}
