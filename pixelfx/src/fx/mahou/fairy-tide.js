// 妖精の潮: 青緑と桃色に光る波がせり上がって砕け、泡の中で妖精の光が舞う。
import { Particles, Lights, P, Rng, fit, clamp, ease, TAU, WHITE, sparkle, hex } from "../../core/index.js";

export const meta = {
  name: "Fairy tide",
  desc: "A glowing turquoise wave rears up and breaks with a pink crest; foam bursts and fairy lights swirl out of the spray.",
  tags: ["water", "fairy", "wave", "magic", "one-shot", "mahou"],
  size: [140, 100], origin: [60, 80], duration: 1.8, loop: false, fps: 30, bg: "ground",
  options: { palette: ["#140a26", "#1a2a6a", "#1a6aa8", "#2aa8c8", "#5ae0e0", "#a8fff0", "#ffd8f8", "#ffffff"], seed: 5 },
};
const PINK = hex("#ff8ad8");

export function create(o) {
  const C = fit(o.palette, 8), R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0 }), lights = new Lights();
  const fairies = Array.from({ length: 7 }, () => ({ x: R.range(-20, 30), y: -R.range(10, 40), a: R.range(0, TAU), r: R.range(4, 12), sp: R.range(3, 6), d: R.range(0.2, 0.6) }));
  let t = 0, broke = false;
  return {
    update(dt) {
      t += dt;
      if (!broke && t > 0.45) {
        broke = true; lights.add(14, -18, 60, C[4], 0.7, 0.6);
        for (let i = 0; i < 30; i++) ps.spawn(P.FLAKE, R.range(0, 24), -R.range(14, 34), R.range(20, 120), -R.range(40, 140), R.range(0.4, 0.8), R.chance(0.3) ? PINK : C[6], R.range(1, 2));
        for (let i = 0; i < 8; i++) ps.spawn(P.VAPOUR, R.range(0, 30), -R.range(4, 20), R.range(10, 40), -R.range(5, 20), R.range(0.6, 1.1), C[5], R.range(4, 7));
      }
      ps.update(dt); lights.update(dt);
    },
    draw(p) {
      const rise = ease.outCubic(clamp(t / 0.45)), fall = clamp((t - 0.45) / 0.9), H = 46 * rise * (1 - ease.inQuad(fall) * 0.85), fade = clamp(1 - (t - 1.2) / 0.5);
      if (fade <= 0) { ps.draw(p, "front"); lights.draw(p); return; }
      // body of the wave: columns rising to a curling lip that leans forward as it breaks
      for (let x = -40; x <= 34; x++) {
        const u = (x + 40) / 74, h = H * Math.sin(u * Math.PI * 0.95) * (0.6 + 0.4 * u), lean = fall * 18 * u;
        for (let y = 0; y < h; y++) {
          const v = y / Math.max(1, h), xx = x + lean * v * v;
          const c = v > 0.92 ? (u > 0.55 ? PINK : C[7]) : v > 0.75 ? C[5] : v > 0.45 ? C[4] : v > 0.2 ? C[3] : C[2];
          if (fade > 0.6) p.px(xx, -y, c); else p.dot(xx, -y, c, fade / 0.6);
          if (v > 0.3 && v < 0.75 && ((x * 3 + y * 5 + Math.floor(t * 30)) % 11 === 0)) p.px(xx, -y, C[6]);
        }
        if (h > 3 && x % 5 === 0) p.glow(x + lean, -h, 5, C[5], 0.18 * fade);
      }
      // foam line on the floor
      p.ellipse(0, 1, 44, 3, C[5], 0.5 * fade);
      for (const f of fairies) {
        const a = f.a + t * f.sp, x = f.x + Math.cos(a) * f.r + t * 18, y = f.y + Math.sin(a) * f.r * 0.6 - t * 10, k = clamp((t - f.d) / 0.2) * fade;
        if (k <= 0) continue;
        sparkle(p, x, y, 2, PINK, WHITE, 0.5 * k); p.glow(x, y, 6, PINK, 0.25 * k);
      }
      ps.draw(p, "front"); lights.draw(p);
    },
  };
}
