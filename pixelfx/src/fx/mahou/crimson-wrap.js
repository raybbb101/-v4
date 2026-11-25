// 紅蓮の抱擁: 真紅の炎の帯が足元から螺旋に巻き上がり、締めつけ、最後に内側へ潰れて爆ぜる。
import { Particles, Lights, P, Rng, fit, clamp, ease, TAU, WHITE, sparkle } from "../../core/index.js";

export const meta = {
  name: "Crimson wrap",
  desc: "Crimson ribbons of flame spiral up from the feet and coil round the target, tighten, then crush inward and burst.",
  tags: ["fire", "crimson", "bind", "spell", "one-shot", "mahou"],
  size: [120, 120], origin: [60, 100], duration: 2.4, loop: false, fps: 30, bg: "ground",
  options: { palette: ["#1a0206", "#4a0610", "#8a0c1c", "#d01830", "#ff3a50", "#ff7a80", "#ffc8c8", "#ffffff"], seed: 3 },
};
const COIL = 0.55, SQUEEZE = 1.2, BURST = 1.35;

export function create(o) {
  const C = fit(o.palette, 8), R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  let t = 0, burst = false;
  return {
    update(dt) {
      t += dt;
      if (t < BURST && R.chance(dt * 40)) { const a = R.range(0, TAU); ps.spawn(P.EMBER, Math.cos(a) * 10, -R.range(4, 30), R.range(-10, 10), -R.range(20, 50), R.range(0.4, 0.9), C[5]); }
      if (!burst && t >= BURST) {
        burst = true;
        lights.add(0, -16, 70, C[4], 0.9, 0.5); lights.add(0, -16, 16, WHITE, 0.7, 0.12);
        for (let i = 0; i < 40; i++) { const a = R.range(0, TAU), sp = R.range(90, 230); ps.spawn(P.SPARK, 0, -16, Math.cos(a) * sp, Math.sin(a) * sp * 0.7 - 60, R.range(0.25, 0.6), 0, 1); }
        for (let i = 0; i < 14; i++) ps.spawn(P.FIRE, R.range(-8, 8), -R.range(6, 26), R.range(-40, 40), -R.range(30, 80), R.range(0.5, 0.9), 0, R.range(3, 6), 0, 1);
        for (let i = 0; i < 6; i++) ps.spawn(P.SMOKE, R.range(-10, 10), -R.range(10, 30), R.range(-10, 10), -R.range(10, 25), R.range(0.9, 1.4), 0, R.range(4, 6), 0.15);
      }
      ps.update(dt); lights.update(dt);
    },
    drawBack(p) { ribbons(p, t, C, true); ps.draw(p, "back"); },
    draw(p) {
      // a scorched ring on the floor
      const fl = clamp(t / COIL) * (t < BURST ? 1 : clamp(1 - (t - BURST) / 0.9));
      if (fl > 0) { p.ellipse(0, 0, 16 * fl, 4 * fl, C[1], 0.5 * fl); p.glow(0, 0, 26, C[3], 0.25 * fl); }
      ribbons(p, t, C, false);
      if (t >= BURST && t < BURST + 0.08) p.circle(0, -16, 14, WHITE);
      else if (t >= BURST && t < BURST + 0.25) { const k = (t - BURST) / 0.25; p.ring(0, -16, 8 + k * 26, 2, C[5], 1 - k); sparkle(p, 0, -16, 6 * (1 - k), C[6], WHITE, 0.6); }
      ps.draw(p, "front"); lights.draw(p);
    },
  };
}

// three ribbons spiralling up a cylinder; the front half in front of the body, the back half behind
function ribbons(p, t, C, back) {
  if (t >= BURST + 0.05) return;
  const grow = ease.outCubic(clamp(t / COIL)), sq = t < SQUEEZE ? 1 : 1 - 0.6 * ease.inQuad(clamp((t - SQUEEZE) / (BURST - SQUEEZE)));
  const H = 36 * grow, spin = t * 7;
  for (let k = 0; k < 3; k++) {
    for (let s = 0; s < H; s += 0.5) {
      const a = spin + k * (TAU / 3) + s * 0.22, ca = Math.cos(a), sa = Math.sin(a);
      if ((sa < 0) !== back) continue;
      const rad = (13 - s * 0.12) * sq, x = ca * rad, y = -s + sa * 3.2 * sq;
      const head = H - s < 4, w = sa > 0.6 ? 2 : 1;
      const c = head ? WHITE : sa > 0.5 ? C[5] : sa > 0 ? C[4] : C[2];
      p.px(x, y, c); if (w > 1) p.px(x, y - 1, C[4]);
      if (!back && (s | 0) % 4 === 0) p.glow(x, y, 4, C[4], 0.12);
    }
  }
}
