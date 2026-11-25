// ナノ群体: 機械の粒が群れて渦を巻き、ときどき緑の光で走査線を引く。
import { fit, cycle, TAU, WHITE } from "../../core/index.js";

export const meta = {
  name: "Nano swarm",
  desc: "A cloud of tiny machines swirling in loose orbits, glinting lime as they catch the light, scan lines flicking between them.",
  tags: ["scifi", "nano", "swarm", "loop", "mahou"],
  size: [140, 100], origin: [70, 70], duration: 2.4, loop: true, fps: 30, bg: "ground",
  options: { palette: ["#0a1404", "#1a3008", "#3a6010", "#6aa020", "#a8e040", "#d8ff5a", "#f4ffc8"], seed: 3 },
};

export function draw(p, t, o) {
  const C = fit(o.palette, 7), T = meta.duration, ph = (t / T) * TAU;
  p.ellipse(0, 0, 46, 11, C[0], 0.2);
  for (let i = 0; i < 80; i++) {
    const g = (i * 0.618) % 1, r = 12 + g * 40, sp = (i % 3) + 1, a = ph * sp + i * 2.4, h = 10 + ((i * 7) % 26);
    const x = Math.cos(a) * r, y = Math.sin(a) * r * 0.32 - h + Math.sin(ph * 2 + i) * 2;
    const front = Math.sin(a) > 0;
    p.px(x, y, (i + Math.floor(t * 20)) % 9 === 0 ? C[6] : front ? C[4] : C[2]);
  }
  cycle(t, T, 5, o.seed, 0.2, (age, life, r) => {
    const y = -r.range(8, 34), w = r.range(16, 40);
    p.line(-w, y, w, y, C[5], 0.5 * (1 - age / life));
  });
  p.glow(0, -18, 44, C[4], 0.14);
}
