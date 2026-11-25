// 魔歌: 床に音の波紋が広がり、音符が跳ねながら外へ散っていく。
import { fit, clamp, ease, TAU, WHITE, sparkle, band } from "../../core/index.js";
import { rng } from "../../core/index.js";

export const meta = {
  name: "Note ring",
  desc: "A song spell: sound rings ripple out across the floor while music notes hop outward in a circle, wobbling and twinkling before they fade.",
  tags: ["arcane", "music", "song", "ring", "one-shot", "mahou"],
  size: [200, 130], origin: [100, 80], duration: 1.6, loop: false, fps: 30, bg: "ground",
  options: { palette: ["#2a0a3a", "#5a1a7a", "#9a3ac0", "#d070f0", "#f0a0ff", "#ffd8ff", "#ffffff"], reach: 80, seed: 3 },
};
const SY = 0.4;
// 8 分音符（旗つき）と 4 分音符
const NOTE8 = ["..##", "..#.#", "..#..#", "..#", "..#", "###", "###"];
const NOTE4 = ["..#", "..#", "..#", "..#", "###", "###"];

export function draw(p, t, o) {
  const C = fit(o.palette, 7), R = o.reach, k = clamp(t / 0.7), fade = clamp(1 - (t - 1.1) / 0.5);
  const RAMP = ["#5a1a7a", "#d070f0", "#ffd8ff", "#ffffff"];
  for (let i = 0; i < 3; i++) {
    const u = clamp((t - i * 0.15) / 0.8); if (u <= 0 || u >= 1) continue;
    band(p, 0, 0, 8 + ease.outCubic(u) * R, SY, 1.5, (1 - u) * 0.9, RAMP);
  }
  if (t < 0.12) { p.glow(0, -6, 30, C[4], 0.6); sparkle(p, 0, -8, 5, C[5], WHITE, 0.6); }
  const n = 10, r0 = rng(o.seed, 1);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + r0.range(-0.2, 0.2), d = 10 + ease.outCubic(k) * R * (0.7 + 0.3 * ((i * 7) % 3) / 2);
    const hop = Math.abs(Math.sin(t * 9 + i)) * 8 * (1 - k * 0.5);
    const x = Math.cos(a) * d, y = Math.sin(a) * d * SY - 10 - hop;
    const rows = i % 2 ? NOTE8 : NOTE4, c = i % 3 === 0 ? C[6] : i % 3 === 1 ? C[5] : C[4];
    if (fade <= 0) continue;
    rows.forEach((row, ry) => { for (let rx = 0; rx < row.length; rx++) if (row[rx] === "#") p.dot(x + rx - 2, y + ry - 6, c, fade); });
    p.glow(x, y - 2, 6, C[4], 0.25 * fade);
  }
}
