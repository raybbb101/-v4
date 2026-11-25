// 神剣召喚: 空から巨大な光の剣が落ちて地面に突き立ち、光の輪と羽根が散る。
import { Particles, Lights, P, Rng, fit, clamp, ease, TAU, WHITE, sparkle, band } from "../../core/index.js";

export const meta = {
  name: "Holy blade",
  desc: "A giant sword of light drops from the sky, stabs into the ground with a white flash, rings of light spread and motes drift up as it dissolves.",
  tags: ["holy", "sword", "smite", "one-shot", "mahou"],
  size: [180, 200], origin: [90, 160], duration: 2.6, loop: false, fps: 30, bg: "ground",
  options: { palette: ["#2a1c08", "#5a3e10", "#9a6c18", "#d8a428", "#ffd84a", "#fff09a", "#fffbe6", "#ffffff"], seed: 7 },
};
const HIT = 0.3;

export function create(o) {
  const C = fit(o.palette, 8), R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  let t = 0, hit = false;
  return {
    update(dt) {
      t += dt;
      if (!hit && t >= HIT) {
        hit = true; lights.add(0, -20, 90, C[4], 1, 0.6); lights.add(0, -4, 20, WHITE, 0.9, 0.12);
        for (let i = 0; i < 36; i++) { const a = R.range(Math.PI, TAU), sp = R.range(80, 220); ps.spawn(P.SPARK, 0, -2, Math.cos(a) * sp, Math.sin(a) * sp * 0.8, R.range(0.3, 0.7), 0, 1); }
        for (let i = 0; i < 10; i++) ps.spawn(P.DUST, R.range(-14, 14), -2, R.range(-60, 60), -R.range(10, 30), R.range(0.6, 1.1), 0, R.range(3, 5));
      }
      if (hit && t < 1.4 && R.chance(dt * 30)) ps.spawn(P.STAR, R.range(-6, 6), -R.range(10, 90), R.range(-6, 6), -R.range(10, 30), R.range(0.6, 1.2), C[6]);
      ps.update(dt); lights.update(dt);
    },
    draw(p) {
      const drop = ease.inQuad(clamp(t / HIT)), y0 = -260 + 260 * drop, dis = clamp((t - 1.5) / 0.9);
      if (dis < 1) {
        // blade: a long tapering diamond, white spine, gold edges; crossguard and grip above
        const L = 110, a = 1 - dis;
        p.shade(-8, y0 - L - 30, 8, y0, (x, y, out) => {
          const u = (y0 - y) / L; if (u < 0 || u > 1) return;
          const w = 6 * Math.min(1, u * 3) * (1 - u * 0.15); if (Math.abs(x) > w) return;
          if (dis > 0 && (((x * 7 + y * 3 + Math.floor(t * 60)) % 17) + 17) % 17 < dis * 17) return;
          out.c = Math.abs(x) < 1 ? WHITE : Math.abs(x) > w - 1 ? C[3] : x < 0 ? C[6] : C[5]; out.a = a;
        });
        p.rect(-14, y0 - L - 3, 28, 3, C[4], a); p.rect(-2, y0 - L - 16, 4, 13, C[3], a); p.circle(0, y0 - L - 18, 3, C[6], a);
        p.glowLine(0, y0, 0, y0 - L, 10, C[5], 0.4 * a);
      }
      if (hit) {
        const k = clamp((t - HIT) / 0.8);
        band(p, 0, 0, 10 + k * 60, 0.3, 2, 1 - k, ["#9a6c18", "#ffd84a", "#fff09a", "#ffffff"]);
        band(p, 0, 0, 6 + k * 34, 0.3, 1, 1 - k, ["#9a6c18", "#ffd84a", "#fff09a", "#ffffff"]);
        if (t < HIT + 0.06) p.circle(0, -10, 16, WHITE);
        sparkle(p, 0, -6, Math.round(9 * (1 - k)), C[6], WHITE, 0.7);
      }
      ps.draw(p, "front"); lights.draw(p);
    },
  };
}
