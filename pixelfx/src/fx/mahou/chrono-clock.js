// 時の魔法: 床に金の時計盤が開き、針が一周して止まる。目盛りが光り、歯車の影が回る。
import { fit, clamp, ease, TAU, WHITE, sparkle, band } from "../../core/index.js";

export const meta = {
  name: "Chrono clock",
  desc: "A golden clock face opens on the floor, ticks marching round its rim; the hands sweep a full turn and stop with a flash, then it fades.",
  tags: ["arcane", "time", "clock", "floor", "one-shot", "mahou"],
  size: [200, 120], origin: [100, 70], duration: 2.2, loop: false, fps: 30, bg: "ground",
  options: { palette: ["#1e1206", "#4a2c08", "#86520c", "#c48412", "#f0b424", "#ffe066", "#fff6c4", "#ffffff"], size: 1, seed: 1 },
};
const SY = 0.42;

export function draw(p, t, o) {
  const C = fit(o.palette, 8), S = o.size, open = ease.outBack(clamp(t / 0.35)), fade = clamp(1 - (t - 1.7) / 0.5);
  const Rr = 44 * S * open; if (Rr < 1 || fade <= 0) return;
  const RAMP = ["#4a2c08", "#86520c", "#f0b424", "#ffe066", "#fff6c4"];
  band(p, 0, 0, Rr, SY, 2, fade, RAMP);
  band(p, 0, 0, Rr * 0.72, SY, 1, 0.7 * fade, RAMP);
  p.glow(0, 0, Rr, C[4], 0.18 * fade);
  // twelve ticks light up one after another
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU - Math.PI / 2, lit = clamp((t - 0.2 - i * 0.05) / 0.1);
    const x0 = Math.cos(a) * Rr * 0.8, y0 = Math.sin(a) * Rr * 0.8 * SY, x1 = Math.cos(a) * Rr * 0.94, y1 = Math.sin(a) * Rr * 0.94 * SY;
    p.line(x0, y0, x1, y1, lit > 0.5 ? C[6] : C[3], fade);
    if (lit > 0 && lit < 1) p.glow(x1, y1, 5, C[5], 0.5 * fade);
  }
  // hands sweep a turn and stop
  const sweep = ease.inOutCubic(clamp((t - 0.3) / 1.1)), am = -Math.PI / 2 + sweep * TAU, ah = -Math.PI / 2 + sweep * TAU / 12;
  p.line(0, 0, Math.cos(am) * Rr * 0.66, Math.sin(am) * Rr * 0.66 * SY, C[6], fade);
  p.line(0, 0, Math.cos(ah) * Rr * 0.42, Math.sin(ah) * Rr * 0.42 * SY, C[5], fade);
  p.glowLine(0, 0, Math.cos(am) * Rr * 0.66, Math.sin(am) * Rr * 0.66 * SY, 4, C[5], 0.3 * fade);
  p.circle(0, 0, 2, C[6], fade);
  if (t > 1.4 && t < 1.5) { band(p, 0, 0, Rr + 2, SY, 2, 1, ["#ffe066", "#fff6c4", "#ffffff", "#ffffff"], () => true, true); p.glow(0, 0, Rr, C[6], 0.5); }
  if (t > 1.4 && t < 1.9) sparkle(p, 0, -6, Math.round(6 * (1 - (t - 1.4) / 0.5)), C[6], WHITE, 0.6);
}
