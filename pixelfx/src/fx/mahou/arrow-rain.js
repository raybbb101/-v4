// 天弓: 空から光の矢が三本ずつ降り、地面に刺さって光の粒を散らす。
import { Particles, Lights, P, Rng, fit, clamp, WHITE, sparkle } from "../../core/index.js";

export const meta = {
  name: "Arrow rain",
  desc: "Arrows of light streak down from the sky in a tight volley, thud into the ground and burst into glints.",
  tags: ["holy", "arrow", "rain", "one-shot", "mahou"],
  size: [120, 160], origin: [60, 130], duration: 1.2, loop: false, fps: 30, bg: "ground",
  options: { palette: ["#3e300c", "#7a5c14", "#c89a24", "#f0c83a", "#ffe066", "#fff6c4", "#ffffff"], seed: 2 },
};

export function create(o) {
  const C = fit(o.palette, 7), R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  const arrows = Array.from({ length: 3 }, (_, i) => ({ x: R.range(-10, 10), d: i * 0.06 + R.range(0, 0.03), hit: false }));
  let t = 0; const FALL = 0.25;
  return {
    update(dt) {
      t += dt;
      for (const a of arrows) if (!a.hit && t >= a.d + FALL) {
        a.hit = true; lights.add(a.x, -3, 30, C[4], 0.7, 0.3);
        for (let i = 0; i < 8; i++) ps.spawn(P.SPARK, a.x, -1, R.range(-80, 80), -R.range(30, 120), R.range(0.2, 0.45), 0, 1);
        ps.spawn(P.DUST, a.x, 0, R.range(-10, 10), -5, 0.5, 0, 3);
      }
      ps.update(dt); lights.update(dt);
    },
    draw(p) {
      for (const a of arrows) {
        const u = clamp((t - a.d) / FALL); if (u <= 0) continue;
        const y = -130 + 130 * u, fade = clamp(1 - (t - a.d - FALL - 0.3) / 0.4);
        if (fade <= 0) continue;
        if (!a.hit) { p.line(a.x, y - 24, a.x, y - 4, C[3], 0.6); p.glowLine(a.x, y - 22, a.x, y, 4, C[4], 0.3); }
        p.line(a.x, y - 12, a.x, y, C[5], fade); p.px(a.x, y, WHITE);
        p.px(a.x - 1, y - 12, C[4]); p.px(a.x + 1, y - 12, C[4]);
        if (a.hit && t - a.d - FALL < 0.15) sparkle(p, a.x, -2, 4, C[5], WHITE, 0.6);
      }
      ps.draw(p, "front"); lights.draw(p);
    },
  };
}
