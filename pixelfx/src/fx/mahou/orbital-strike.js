// 衛星軌道砲: 照準の輪が絞られ、宇宙から極太の光の柱が落ちて床を溶かす。
import { Particles, Lights, P, Rng, fit, clamp, ease, TAU, WHITE, sparkle, band } from "../../core/index.js";

export const meta = {
  name: "Orbital strike",
  desc: "A targeting ring locks on and tightens, then a thick column of light slams down from orbit, scorching a glowing crater as it narrows away.",
  tags: ["scifi", "laser", "orbital", "strike", "one-shot", "mahou"],
  size: [160, 260], origin: [80, 220], duration: 2.2, loop: false, fps: 30, bg: "ground",
  options: { palette: ["#04141e", "#08304a", "#0c5a80", "#1890c0", "#40c8f0", "#90ecff", "#d8fbff", "#ffffff"], seed: 9 },
};
const FIRE = 0.35;

export function create(o) {
  const C = fit(o.palette, 8), R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  let t = 0, fired = false;
  return {
    update(dt) {
      t += dt;
      if (!fired && t >= FIRE) {
        fired = true; lights.add(0, -30, 110, C[4], 1, 0.9); lights.add(0, 0, 24, WHITE, 1, 0.2);
        for (let i = 0; i < 40; i++) { const a = R.range(Math.PI, TAU), sp = R.range(60, 240); ps.spawn(P.SPARK, R.range(-6, 6), -1, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.3, 0.8), 0, 1); }
        for (let i = 0; i < 8; i++) ps.spawn(P.SMOKE, R.range(-14, 14), -2, R.range(-20, 20), -R.range(20, 40), R.range(1, 1.6), 0, R.range(4, 7), 0.3);
      }
      ps.update(dt); lights.update(dt);
    },
    draw(p) {
      if (t < FIRE) {
        const k = t / FIRE;
        band(p, 0, 0, 30 - k * 20, 0.35, 1, 0.9, ["#0c5a80", "#40c8f0", "#90ecff", "#ffffff"]);
        p.line(-34 + k * 20, 0, -18, 0, C[5]); p.line(18, 0, 34 - k * 20, 0, C[5]);
        p.line(0, -10, 0, -4, C[5]); p.line(0, 4, 0, 10, C[5]);
      } else {
        const k = clamp((t - FIRE) / 1.2), w = 14 * (1 - ease.inQuad(k)) + (k < 1 ? 1 : 0), H = 220;
        if (w > 0.5) {
          p.shade(-w - 2, -H, w + 2, 2, (x, y, out) => {
            const ax = Math.abs(x) + Math.sin(y * 0.3 + t * 40) * 0.4; if (ax > w) return;
            const u = ax / w; out.c = u < 0.35 ? WHITE : u < 0.65 ? C[6] : u < 0.88 ? C[5] : C[3];
          });
          p.glowLine(0, -H, 0, 0, w * 2 + 10, C[4], 0.35);
        }
        const g = clamp(1 - (t - FIRE - 0.5) / 1.2);
        p.ellipse(0, 0, 20, 6, C[3], 0.6 * g); p.ellipse(0, 0, 12, 3.5, C[5], 0.7 * g); p.glow(0, 0, 30, C[4], 0.3 * g);
        if (t < FIRE + 0.07) p.circle(0, -6, 22, WHITE);
        const r2 = clamp((t - FIRE) / 0.5);
        band(p, 0, 0, 10 + r2 * 50, 0.3, 2, 1 - r2, ["#0c5a80", "#40c8f0", "#90ecff", "#ffffff"]);
      }
      ps.draw(p, "front"); lights.draw(p);
    },
  };
}
